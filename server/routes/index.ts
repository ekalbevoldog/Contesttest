/** 05/08/2025 - 13:35 CST
 * Routes Index
 * 
 * Registers all API routes with the Express application.
 * Serves as the central router registry.
 */

import { Express, Request, Response } from 'express';
import { Server } from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import fs from 'fs';
import config from '../config/environment';

// Import route modules
import authRoutes from './authRoutes';
import profileRoutes from './profileRoutes';
import healthRoutes from './healthRoutes';
import campaignRoutes from './campaignRoutes';
import matchRoutes from './matchRoutes';
import subscriptionRoutes from './subscriptionRoutes';
import webhookRoutes from './webhookRoutes';
import configRoutes from './configRoutes';
import offerRoutes from './offerRoutes';
import bundleRoutes from './bundleRoutes';
// Supabase profile routes are handled in supabaseProfile.ts
// Import routes for serving static files
import publicRoutes from './publicRoutes';
import wsTestRoutes from './wsTestRoutes';

// Import middleware
import { requireAuth } from '../middleware/auth';
import { errorHandler } from '../middleware/error';
import { requestLogger } from '../middleware/logging';

// Import WebSocket service
import { configureWebSocket } from '../services/websocketService';

/**
 * Register all API routes with the Express application
 */
export function registerRoutes(app: Express): Express {
  // Apply common middleware to all routes
  app.use(requestLogger);

  // Register API routes with their respective prefixes
  app.use('/api/auth', authRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/campaign', campaignRoutes);
  app.use('/api/match', matchRoutes);
  app.use('/api/subscription', subscriptionRoutes);
  app.use('/api/webhook', webhookRoutes);
  app.use('/api/config', configRoutes);
  app.use('/api/offer', offerRoutes);
  app.use('/api/bundle', bundleRoutes);
  
  // Register test routes with explicit paths
  app.use('/api/ws-test', wsTestRoutes);
  app.use('/test/websocket', wsTestRoutes); // Make test routes only accessible via explicit paths
  app.use('/health', healthRoutes);
  
  // Register routes for specific static test pages
  // These will be used for direct testing and won't interfere with the React app
  app.use('/simple.html', (req, res, next) => {
    // If the url is exactly "/simple.html", serve it from public
    if (req.path === '/') {
      // Use import.meta.url for ESM compatibility
      const currentFilePath = new URL(import.meta.url).pathname;
      const currentDir = path.dirname(currentFilePath);
      const publicDir = path.resolve(currentDir, '../../../public');
      const testFilePath = path.join(publicDir, 'simple.html');
      if (fs.existsSync(testFilePath)) {
        return res.sendFile(testFilePath);
      }
    }
    next();
  });
  
  app.use('/websocket-test.html', (req, res, next) => {
    // If the url is exactly "/websocket-test.html", serve it from public
    if (req.path === '/') {
      // Use import.meta.url for ESM compatibility
      const currentFilePath = new URL(import.meta.url).pathname;
      const currentDir = path.dirname(currentFilePath);
      const publicDir = path.resolve(currentDir, '../../../public');
      const testFilePath = path.join(publicDir, 'websocket-test.html');
      if (fs.existsSync(testFilePath)) {
        return res.sendFile(testFilePath);
      }
    }
    next();
  });
  
  app.use('/test.html', (req, res, next) => {
    // If the url is exactly "/test.html", serve it from public
    if (req.path === '/') {
      // Use import.meta.url for ESM compatibility
      const currentFilePath = new URL(import.meta.url).pathname;
      const currentDir = path.dirname(currentFilePath);
      const publicDir = path.resolve(currentDir, '../../../public');
      const testFilePath = path.join(publicDir, 'test.html');
      if (fs.existsSync(testFilePath)) {
        return res.sendFile(testFilePath);
      }
    }
    next();
  });

  // Serve our auth test page
  app.use('/auth-test.html', (req, res, next) => {
    if (req.path === '/') {
      // Use import.meta.url for ESM compatibility
      const currentFilePath = new URL(import.meta.url).pathname;
      const currentDir = path.dirname(currentFilePath);
      const publicDir = path.resolve(currentDir, '../../../public');
      const testFilePath = path.join(publicDir, 'auth-test.html');
      
      if (fs.existsSync(testFilePath)) {
        console.log('Serving auth-test.html from', testFilePath);
        return res.sendFile(testFilePath);
      }
    }
    next();
  });
  
  // Add explicit middleware for client-side authentication routes
  // This ensures they're handled correctly by the frontend router
  app.use('/sign-in', (req, res, next) => {
    console.log('Sign-in route accessed, passing to frontend router');
    next(); // Let Vite handle this route
  });

  app.use('/auth', (req, res, next) => {
    console.log('Auth route accessed, passing to frontend router');
    next(); // Let Vite handle this route
  });
  
  // DO NOT register public routes here, let Vite handle the React app
  // This ensures proper handling of the root path and client-side routing
  // app.use('/', publicRoutes);

  // API status endpoint
  app.get('/api/status', (req, res) => {
    res.json({ 
      status: 'ok', 
      version: config.VERSION,
      environment: config.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  });

  // Route configuration check endpoint
  app.get('/api/route-check', (req, res) => {
    console.log('[Route Check] Route configuration check requested');
    
    try {
      // Summary of main API routes
      const mainRoutes = [
        { path: '/api/auth/*', description: 'Authentication endpoints (login, register, etc.)' },
        { path: '/api/profile/*', description: 'User profile management' },
        { path: '/api/campaign/*', description: 'Campaign management' },
        { path: '/api/match/*', description: 'Athlete-campaign matching' },
        { path: '/api/subscription/*', description: 'Subscription management' },
        { path: '/api/webhook/*', description: 'External service webhooks' },
        { path: '/api/config/*', description: 'Application configuration' },
        { path: '/api/offer/*', description: 'Offer management' },
        { path: '/api/bundle/*', description: 'Bundle management' },
        { path: '/api/status', description: 'API health check' },
        { path: '/api/route-check', description: 'This endpoint - route configuration' },
        { path: '/api/protected', description: 'Protected test endpoint' },
        { path: '/health', description: 'Server health check' },
        { path: '/api/ws-test', description: 'WebSocket test endpoints' },
        { path: '/auth', description: 'Frontend authentication page' },
        { path: '/sign-in', description: 'Frontend sign-in redirect' },
        { path: '/', description: 'Frontend application root' }
      ];
      
      // Add test pages separately
      const testPageRoutes = [
        { path: '/auth-test.html', description: 'Authentication test page' },
        { path: '/simple.html', description: 'Simple test page' },
        { path: '/websocket-test.html', description: 'WebSocket test page' },
        { path: '/test.html', description: 'General test page' },
        { path: '/test/websocket', description: 'WebSocket test API' }
      ];
      
      console.log('[Route Check] Reporting on main application routes');
      res.json({
        message: 'Route configuration check',
        timestamp: new Date().toISOString(),
        mainRoutesCount: mainRoutes.length,
        testRoutesCount: testPageRoutes.length,
        apiRoutes: mainRoutes,
        testPages: testPageRoutes
      });
    } catch (error) {
      console.error('[Route Check] Error getting routes:', error);
      res.status(500).json({ error: 'Failed to check routes configuration' });
    }
  });

  // Protected test endpoint
  app.get('/api/protected', requireAuth, (req: Request, res: Response) => {
    res.json({ 
      message: 'This is a protected endpoint',
      user: (req as any).user
    });
  });

  // Apply error handling middleware last
  app.use(errorHandler);

  return app;
}

/**
 * Configure WebSocket server
 */
export function configureWebSocketServer(server: Server): WebSocketServer | null {
  // Only configure WebSocket server if enabled in config
  if (!config.ENABLE_WEBSOCKETS) {
    console.log('WebSocket server disabled in configuration');
    return null;
  }

  try {
    const wss = configureWebSocket(server);
    console.log('WebSocket server configured successfully');
    return wss;
  } catch (error) {
    console.error('Failed to configure WebSocket server:', error);
    return null;
  }
}

// Export helpers for working with WebSockets
export { wsHelpers } from '../services/websocketService';

export default { registerRoutes, configureWebSocketServer };