/** 05/08/2025 - 13:31 CST
 * WebSocket Service
 * 
 * Manages WebSocket connections, authentication, and message broadcasting.
 * Provides real-time communication between server and clients.
 */

import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';
import { authService } from './authService';
import { supabase } from '../lib/supabase';

// Types for WebSocket connections
interface ConnectedClient {
  ws: WebSocket;
  id: string;
  userId?: string;
  userType?: string;
  authenticated: boolean;
  subscriptions: Set<string>;
  lastActivity: number;
}

// Helper for broadcasting to channels
export const wsHelpers = {
  broadcastToChannel: null as ((channel: string, message: any) => number) | null
};

/**
 * Configure WebSocket server
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
  const connections = new Map<WebSocket, ConnectedClient>();

  // Connection statistics
  let connectionCounter = 0;
  const stats = {
    totalConnections: 0,
    activeConnections: 0,
    messagesReceived: 0,
    messagesSent: 0,
    authenticatedUsers: 0,
    errors: 0
  };

  // Helper to send a message to a client
  function sendMessage(ws: WebSocket, message: any) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        // Add timestamp to message
        const messageWithTimestamp = {
          ...message,
          timestamp: message.timestamp || new Date().toISOString()
        };

        // Convert to JSON string and send
        const payload = JSON.stringify(messageWithTimestamp);
        ws.send(payload);
        stats.messagesSent++;

        // Update last activity
        const connection = connections.get(ws);
        if (connection) {
          connection.lastActivity = Date.now();
        }
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        stats.errors++;
      }
    }
  }

  // Send message to all authenticated clients
  function broadcast(message: any, filter?: (conn: ConnectedClient) => boolean) {
    let sentCount = 0;

    connections.forEach((connection, client) => {
      if (connection.authenticated && (!filter || filter(connection))) {
        sendMessage(client, message);
        sentCount++;
      }
    });

    return sentCount;
  }

  // Send message to specific channel subscribers
  function broadcastToChannel(channel: string, message: any) {
    let sentCount = 0;

    connections.forEach((connection, client) => {
      if (connection.authenticated && connection.subscriptions.has(channel)) {
        sendMessage(client, {
          ...message,
          channel
        });
        sentCount++;
      }
    });

    return sentCount;
  }

  // Make broadcastToChannel available externally
  wsHelpers.broadcastToChannel = broadcastToChannel;

  // Handle WebSocket connections
  wss.on('connection', (ws, req) => {
    // Assign a unique connection ID
    const connectionId = `conn_${++connectionCounter}`;
    stats.totalConnections++;
    stats.activeConnections++;

    // Initialize connection metadata
    connections.set(ws, {
      ws,
      id: connectionId,
      authenticated: false,
      subscriptions: new Set(),
      lastActivity: Date.now()
    });

    console.log(`WebSocket connection established: ${connectionId}`);

    // Send welcome message with connection ID
    sendMessage(ws, {
      type: 'system',
      message: 'Connected to WebSocket server',
      connectionId
    });

    // Handle incoming messages
    ws.on('message', async (message: Buffer) => {
      // Update activity timestamp
      const connection = connections.get(ws);
      if (!connection) return;

      connection.lastActivity = Date.now();
      stats.messagesReceived++;

      try {
        // Parse JSON message
        const data = JSON.parse(message.toString());

        // Handle different message types
        switch (data.type) {
          case 'authenticate':
            // Authenticate with token
            if (data.token) {
              try {
                // Verify token with auth service
                const authResult = await authService.verifyToken(data.token);

                if (!authResult.success || !authResult.user) {
                  console.log(`WebSocket auth failed for ${connectionId}`);

                  sendMessage(ws, {
                    type: 'auth_error',
                    error: authResult.error || 'Invalid authentication token'
                  });
                  break;
                }

                // Authentication successful
                connection.userId = authResult.user.id;
                connection.userType = authResult.user.role;
                connection.authenticated = true;
                stats.authenticatedUsers++;

                console.log(`WebSocket ${connectionId} authenticated for user ${authResult.user.id} (${authResult.user.role})`);

                // Send success response
                sendMessage(ws, {
                  type: 'auth_success',
                  userId: authResult.user.id,
                  email: authResult.user.email,
                  role: authResult.user.role
                });

                // Auto-subscribe to user-specific channels
                if (authResult.user.id) {
                  const userChannel = `user:${authResult.user.id}`;
                  connection.subscriptions.add(userChannel);

                  // Subscribe to role-specific channels
                  if (authResult.user.role) {
                    const roleChannel = `role:${authResult.user.role}`;
                    connection.subscriptions.add(roleChannel);
                  }

                  console.log(`WebSocket ${connectionId} auto-subscribed to channels:`, 
                    Array.from(connection.subscriptions));

                  // Notify client of subscriptions
                  sendMessage(ws, {
                    type: 'subscribed',
                    channels: Array.from(connection.subscriptions)
                  });
                }
              } catch (error) {
                console.error(`WebSocket auth error for ${connectionId}:`, error);
                stats.errors++;

                sendMessage(ws, {
                  type: 'auth_error',
                  error: 'Authentication failed'
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
            } else {
              sendMessage(ws, {
                type: 'error',
                error: 'Invalid channel specified'
              });
            }
            break;

          case 'unsubscribe':
            // Unsubscribe from a channel
            if (data.channel && typeof data.channel === 'string') {
              connection.subscriptions.delete(data.channel);
              console.log(`Connection ${connectionId} unsubscribed from channel: ${data.channel}`);

              sendMessage(ws, {
                type: 'unsubscribed',
                channel: data.channel
              });
            }
            break;

          case 'message':
            // Send message to a channel (only if authenticated)
            if (!connection.authenticated) {
              sendMessage(ws, {
                type: 'error',
                error: 'Authentication required to send messages'
              });
              break;
            }

            if (data.channel && typeof data.channel === 'string' && data.content) {
              // Store message in database if needed
              if (data.persist) {
                try {
                  // Store message in Supabase
                  await supabase.from('messages').insert({
                    session_id: connection.id,
                    user_id: connection.userId,
                    role: connection.userType || 'user',
                    content: data.content,
                    metadata: { channel: data.channel, ...(data.metadata || {}) },
                    created_at: new Date().toISOString()
                  });
                } catch (error) {
                  console.error('Error storing message:', error);
                }
              }

              // Broadcast message to channel
              broadcastToChannel(data.channel, {
                type: 'message',
                channel: data.channel,
                content: data.content,
                sender: connection.userId,
                senderType: connection.userType,
                metadata: data.metadata
              });
            } else {
              sendMessage(ws, {
                type: 'error',
                error: 'Invalid message format'
              });
            }
            break;

          case 'ping':
            // Simple ping-pong for connection health checks
            sendMessage(ws, { type: 'pong' });
            break;

          default:
            // Handle unknown message types
            console.log(`Unknown message type from ${connectionId}:`, data.type);
            sendMessage(ws, {
              type: 'error',
              error: 'Unknown message type'
            });
        }
      } catch (error) {
        console.error(`Error processing WebSocket message from ${connectionId}:`, error);
        stats.errors++;

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
      console.error(`WebSocket error on connection ${connections.get(ws)?.id || 'unknown'}:`, error);
      stats.errors++;
    });
  });

  // Health check method for WebSocket server
  (wss as any).getStats = () => ({
    ...stats,
    connections: connections.size,
    authenticationRate: stats.totalConnections > 0 
      ? (stats.authenticatedUsers / stats.totalConnections * 100).toFixed(1) + '%' 
      : '0%'
  });

  // Cleanup inactive connections periodically
  const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
  const MAX_INACTIVE_TIME = 30 * 60 * 1000; // 30 minutes

  setInterval(() => {
    const now = Date.now();
    let closedCount = 0;

    connections.forEach((connection, ws) => {
      const inactiveTime = now - connection.lastActivity;
      if (inactiveTime > MAX_INACTIVE_TIME) {
        console.log(`Closing inactive connection ${connection.id} (inactive for ${Math.round(inactiveTime/1000/60)} minutes)`);
        ws.close();
        connections.delete(ws);
        closedCount++;

        if (connection.authenticated) {
          stats.authenticatedUsers--;
        }
      }
    });

    if (closedCount > 0) {
      console.log(`Cleaned up ${closedCount} inactive WebSocket connections`);
      stats.activeConnections = connections.size;
    }
  }, CLEANUP_INTERVAL);

  return wss;
}

export default {
  configureWebSocket,
  wsHelpers
};