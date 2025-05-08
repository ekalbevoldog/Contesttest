/** 05/08/2025 - 1334 CST
 * Server Entry Point
 * 
 * This is the main server initialization that sets up Express, WebSockets,
 * database connections, middleware, API routes, and serves the React frontend.
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

// Register all API routes
registerRoutes(app);

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
    // Set up frontend depending on environment
    if (config.isDevelopment) {
      console.log('Setting up Vite development server for frontend');
      await setupVite(app, server);
    } else {
      console.log('Setting up static file serving for production');
      serveStatic(app);
    }

    // Start listening
    server.listen(config.PORT, config.HOST, () => {
      const serverUrl = config.SERVER_URL || `http://${config.HOST === '0.0.0.0' ? 'localhost' : config.HOST}:${config.PORT}`;
      const wsProtocol = serverUrl.startsWith('https') ? 'wss://' : 'ws://';
      const wsUrl = serverUrl.replace(/^https?:\/\//, wsProtocol);

      console.log(`⚡ Server running on port ${config.PORT}`);
      console.log(`🌎 API available at ${serverUrl}/api/status`);
      console.log(`🩺 Health check at ${serverUrl}/health`);

      if (wss) {
        console.log(`🧵 WebSocket server running at ${wsUrl}/ws`);
      }
    });
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