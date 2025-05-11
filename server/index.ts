/** 05/09/2025 - 1445 CST
 * Server Entry Point
 * 
 * This is the main server initialization that sets up Express, WebSockets,
 * database connections, middleware, API routes, and serves the React frontend
 * with Home.tsx as the primary landing page.
 */

import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { registerRoutes, configureWebSocketServer } from './routes';
import { setupVite, serveStatic } from './vite';
import config from './config/environment';
import { closeConnections } from './lib/supabase';
import { profileService } from './services/profileService';

import * as netType from 'net';

// Get __dirname in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();

// Log startup information
console.log(`Starting server in ${config.isDevelopment ? 'development' : 'production'} mode`);

// Set up middleware
app.use(cors({
  origin: true, // Allow any origin in development
  credentials: true // Allow cookies
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(config.isDevelopment ? 'dev' : 'common'));

// Configure session management
app.use(
  session({
    secret: config.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: config.isProduction,
      maxAge: config.SESSION_TTL * 1000 // Convert seconds to milliseconds
    }
  })
);

// Create HTTP server
const server = http.createServer(app);

// Store the app in the server for access by other modules
(server as any).app = app;

// Configure WebSocket server if enabled
const wss = configureWebSocketServer(server);

// API routes will be registered in startServer to ensure proper order with Vite middleware

// Graceful shutdown handler
function gracefulShutdown(signal: string) {
  console.log(`${signal} received, shutting down gracefully`);

  // Close WebSocket server if available
  if (wss) {
    wss.close(() => console.log('WebSocket server closed'));
  }

  // Close all database connections
  closeConnections().catch(err => console.error('Error closing database connections:', err));

  // Close HTTP server
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });

  // Force close after timeout
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

// Handle server errors
server.on('error', (error: Error) => {
  console.error('Server error:', error);
  process.exit(1);
});

// Start the server
async function startServer() {
  try {
    // Register API routes first so they're available in both development and production
    // This ensures /api/... endpoints are accessible
    console.log('Registering API-specific and health check routes');
    registerRoutes(app);
    
    // Register profile endpoints
    console.log('Setting up profile endpoints');
    profileService.setupProfileEndpoints(app);
    
    // Set up frontend depending on environment
    // This must be done AFTER API routes to ensure Vite handles frontend routes properly
    if (config.isDevelopment) {
      console.log('Setting up Vite development server for frontend');
      await setupVite(app, server);
    } else {
      console.log('Setting up static file serving for production');
      serveStatic(app);
    }

    // Function to find and use an available port
    const findAvailablePort = async (startPort: number): Promise<number> => {
      const net = await import('net');
      
      return new Promise((resolve) => {
        const testServer = net.createServer();
        testServer.once('error', () => {
          resolve(findAvailablePort(startPort + 1));
        });
        
        testServer.once('listening', () => {
          const port = (testServer.address() as netType.AddressInfo).port;
          testServer.close(() => resolve(port));
        });
        
        testServer.listen(startPort);
      });
    };

    // Start listening with port fallback if the port is in use
    try {
      server.listen(config.PORT, config.HOST, () => {
        const actualPort = (server.address() as any)?.port || config.PORT;
        const serverUrl = config.SERVER_URL || `http://${config.HOST === '0.0.0.0' ? 'localhost' : config.HOST}:${actualPort}`;
        const wsProtocol = serverUrl.startsWith('https') ? 'wss://' : 'ws://';
        const wsUrl = serverUrl.replace(/^https?:\/\//, wsProtocol);

        console.log(`⚡ Server running on port ${actualPort}`);
        console.log(`🌎 API available at ${serverUrl}/api/status`);
        console.log(`🩺 Health check at ${serverUrl}/health`);

        if (wss) {
          console.log(`🧵 WebSocket server running at ${wsUrl}/ws`);
        }
      });
    } catch (error) {
      if ((error as any).code === 'EADDRINUSE') {
        console.log(`Port ${config.PORT} is already in use, trying to find an alternative port...`);
        
        // Find an available port and start again
        const availablePort = await findAvailablePort(config.PORT + 1);
        console.log(`Found available port: ${availablePort}`);
        
        server.listen(availablePort, config.HOST, () => {
          const serverUrl = config.SERVER_URL || `http://${config.HOST === '0.0.0.0' ? 'localhost' : config.HOST}:${availablePort}`;
          const wsProtocol = serverUrl.startsWith('https') ? 'wss://' : 'ws://';
          const wsUrl = serverUrl.replace(/^https?:\/\//, wsProtocol);

          console.log(`⚡ Server running on port ${availablePort}`);
          console.log(`🌎 API available at ${serverUrl}/api/status`);
          console.log(`🩺 Health check at ${serverUrl}/health`);

          if (wss) {
            console.log(`🧵 WebSocket server running at ${wsUrl}/ws`);
          }
        });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Register graceful shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start the server
startServer().catch(err => {
  console.error('Server startup error:', err);
  process.exit(1);
});

export default server;