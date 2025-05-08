/**
 * Routes Index
 * 
 * Central route registration file that collects all route modules
 * and exports them with a unified registration function.
 */

import { Express } from 'express';
import { Server } from 'http';
import { WebSocketServer } from 'ws';
import authRoutes from './authRoutes';
import profileRoutes from './profileRoutes';
import healthRoutes from './healthRoutes';
import apiRoutes from './apiRoutes';
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
  app.use('/api', apiRoutes);
  app.use('/api/subscription', subscriptionRoutes);
  app.use('/api/webhook', webhookRoutes);
  
  return app;
}

/**
 * Configure WebSocket server
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
  
  // Handle WebSocket connections
  wss.on('connection', (ws) => {
    console.log('WebSocket connection established');
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: 'system',
      message: 'Connected to WebSocket server',
      timestamp: new Date().toISOString()
    }));
    
    // Handle incoming messages
    ws.on('message', (message) => {
      try {
        // Parse JSON message
        const data = JSON.parse(message.toString());
        console.log('Received WebSocket message:', data);
        
        // Echo the message back to the client
        ws.send(JSON.stringify({
          type: 'echo',
          data,
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          error: 'Invalid message format',
          timestamp: new Date().toISOString()
        }));
      }
    });
    
    // Handle WebSocket close
    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
  });
  
  // Log WebSocket server status
  console.log('WebSocket server initialized on path: /ws');
  
  return wss;
}

export default { registerRoutes, configureWebSocket };