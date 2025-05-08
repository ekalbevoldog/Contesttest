/**
 * Routes Index
 * 
 * Central route registration file that collects all route modules
 * and exports them with a unified registration function.
 */

import { Express } from 'express';
import { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { supabase } from '../lib/unifiedSupabase';
import config from '../config/environment';
import authRoutes from './authRoutes';
import profileRoutes from './profileRoutes';
import healthRoutes from './healthRoutes';
import apiRoutes from './apiRoutes';
import configRoutes from './configRoutes';
import subscriptionRoutes from './subscriptionRoutes';
import webhookRoutes from './webhookRoutes';

/**
 * Register all API routes with the Express application
 * @param app Express application instance
 * @returns The configured application
 */
export function registerRoutes(app: Express): Express {
  // Register all route modules
  app.use('/health', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/config', configRoutes);
  app.use('/api', apiRoutes);
  app.use('/api/subscription', subscriptionRoutes);
  app.use('/api/webhook', webhookRoutes);
  
  return app;
}

/**
 * Configure WebSocket server with support for authentication and channels
 * @param server HTTP server instance
 * @returns Configured WebSocket server
 */
export function configureWebSocket(server: Server): WebSocketServer {
  // Create WebSocket server with specified path
  const wss = new WebSocketServer({ 
    server,
    path: '/ws'
  });
  
  // Store WebSocket server instance in app for health checks
  (server as any).app?.set('wss', wss);
  
  // Track connection metadata
  const connections = new Map<WebSocket, {
    id: string;
    userId?: string;
    authenticated: boolean;
    subscriptions: Set<string>;
    lastActivity: number;
  }>();
  
  // Connection statistics
  let connectionCounter = 0;
  const stats = {
    totalConnections: 0,
    activeConnections: 0,
    messagesProcessed: 0,
    errors: 0,
    authenticatedUsers: 0
  };
  
  // Helper to send a message to a client
  function sendMessage(ws: WebSocket, message: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        ...message,
        timestamp: new Date().toISOString()
      }));
      
      // Update last activity
      const connection = connections.get(ws);
      if (connection) {
        connection.lastActivity = Date.now();
      }
    }
  }
  
  // Send message to specific channel subscribers
  function broadcastToChannel(channel: string, message: any) {
    let count = 0;
    connections.forEach((connection, client) => {
      if (connection.authenticated && connection.subscriptions.has(channel)) {
        sendMessage(client, {
          ...message,
          channel
        });
        count++;
      }
    });
    return count;
  }
  
  // Handle WebSocket connections
  wss.on('connection', (ws) => {
    // Assign a connection ID and initialize metadata
    const connectionId = `conn_${++connectionCounter}`;
    stats.totalConnections++;
    stats.activeConnections++;
    
    connections.set(ws, {
      id: connectionId,
      authenticated: false,
      subscriptions: new Set(),
      lastActivity: Date.now()
    });
    
    console.log(`WebSocket connection established: ${connectionId}`);
    
    // Send welcome message
    sendMessage(ws, {
      type: 'system',
      message: 'Connected to WebSocket server',
      connectionId,
      env: config.NODE_ENV
    });
    
    // Handle incoming messages
    ws.on('message', async (message) => {
      const connection = connections.get(ws);
      if (!connection) return;
      
      // Update activity timestamp
      connection.lastActivity = Date.now();
      stats.messagesProcessed++;
      
      try {
        // Parse JSON message
        const data = JSON.parse(message.toString());
        
        // Handle different message types
        switch (data.type) {
          case 'authenticate':
            // Authenticate with Supabase token
            if (data.token) {
              try {
                // Verify token with Supabase
                const { data: authData, error } = await supabase.auth.getUser(data.token);
                
                if (error || !authData.user) {
                  console.log(`WebSocket auth failed for ${connectionId}:`, error?.message);
                  sendMessage(ws, {
                    type: 'auth_error',
                    error: 'Invalid authentication token'
                  });
                  break;
                }
                
                // Successfully authenticated
                connection.userId = authData.user.id;
                connection.authenticated = true;
                stats.authenticatedUsers++;
                
                console.log(`WebSocket ${connectionId} authenticated for user ${authData.user.id}`);
                
                sendMessage(ws, {
                  type: 'auth_success',
                  userId: authData.user.id,
                  email: authData.user.email
                });
              } catch (e) {
                console.error(`WebSocket auth error:`, e);
                sendMessage(ws, {
                  type: 'auth_error',
                  error: 'Authentication error'
                });
              }
            } else {
              sendMessage(ws, {
                type: 'auth_error',
                error: 'Token required for authentication'
              });
            }
            break;
            
          case 'subscribe':
            // Subscribe to a channel
            if (data.channel && typeof data.channel === 'string') {
              connection.subscriptions.add(data.channel);
              console.log(`Connection ${connectionId} subscribed to channel: ${data.channel}`);
              
              sendMessage(ws, {
                type: 'subscribed',
                channel: data.channel
              });
            }
            break;
            
          case 'unsubscribe':
            // Unsubscribe from a channel
            if (data.channel && typeof data.channel === 'string') {
              connection.subscriptions.delete(data.channel);
              sendMessage(ws, {
                type: 'unsubscribed',
                channel: data.channel
              });
            }
            break;
            
          case 'ping':
            // Simple ping-pong for connection health check
            sendMessage(ws, { type: 'pong' });
            break;
            
          default:
            // Echo message back
            sendMessage(ws, {
              type: 'echo',
              data,
              authenticated: connection.authenticated,
              userId: connection.userId
            });
        }
      } catch (error) {
        stats.errors++;
        console.error(`WebSocket message error from ${connectionId}:`, error);
        sendMessage(ws, {
          type: 'error',
          error: 'Invalid message format'
        });
      }
    });
    
    // Handle WebSocket close
    ws.on('close', () => {
      const connection = connections.get(ws);
      console.log(`WebSocket connection closed: ${connection?.id || 'unknown'}`);
      
      if (connection?.authenticated) {
        stats.authenticatedUsers--;
      }
      
      connections.delete(ws);
      stats.activeConnections--;
    });
    
    // Handle connection errors
    ws.on('error', (error) => {
      stats.errors++;
      console.error(`WebSocket error:`, error);
    });
  });
  
  // Add health check method
  (wss as any).getStats = () => ({
    ...stats,
    connections: connections.size,
    authenticationRate: stats.totalConnections > 0 
      ? (stats.authenticatedUsers / stats.totalConnections * 100).toFixed(1) + '%' 
      : '0%'
  });
  
  // Set up cleanup for inactive connections
  const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
  const MAX_INACTIVE_TIME = 30 * 60 * 1000; // 30 minutes
  
  setInterval(() => {
    const now = Date.now();
    let closed = 0;
    
    connections.forEach((connection, ws) => {
      const inactiveTime = now - connection.lastActivity;
      if (inactiveTime > MAX_INACTIVE_TIME) {
        console.log(`Closing inactive connection ${connection.id}`);
        ws.close();
        connections.delete(ws);
        closed++;
        
        if (connection.authenticated) {
          stats.authenticatedUsers--;
        }
      }
    });
    
    if (closed > 0) {
      console.log(`Cleaned up ${closed} inactive WebSocket connections`);
      stats.activeConnections = connections.size;
    }
  }, CLEANUP_INTERVAL);
  
  console.log(`WebSocket server initialized on path: /ws (${config.NODE_ENV} mode)`);
  
  // Make the broadcastToChannel function available externally
  wsHelpers.broadcastToChannel = broadcastToChannel;
  
  return wss;
}

// Export the WebSocket broadcast function for use in other modules
export const wsHelpers = {
  broadcastToChannel: null as ((channel: string, message: any) => number) | null
};

// Export all route functions
export default { registerRoutes, configureWebSocket, wsHelpers };