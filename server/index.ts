/**
 * Server Entry Point
 * 
 * This is the main server initialization that sets up Express, WebSockets,
 * database connections, middleware, API routes, and serves the React frontend.
 */

import express from 'express';
import http from 'http';
import path from 'path';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import net from 'net';
import fs from 'fs';
import { configureWebSocket, registerRoutes } from './routes';
import { setupVite, serveStatic } from './vite';
import config from './config/environment';
import { closeConnections } from './lib/unifiedSupabase';

// Initialize Express app
const app = express();

// Start with the requested port, but don't bind yet - we'll find an available port
const DEFAULT_PORT = 3000;
let PORT = config.PORT || DEFAULT_PORT;

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
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Create HTTP server
const server = http.createServer(app);

// Store the app in the server for access by other modules
(server as any).app = app;

// Configure WebSocket server
const wss = configureWebSocket(server);

// Register all API routes
registerRoutes(app);

// Check if a port is in use
async function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true); // Port is in use
      } else {
        resolve(false); // Some other error
      }
    });
    
    server.once('listening', () => {
      // Close the server and return not in use
      server.close();
      resolve(false);
    });
    
    server.listen(port, '0.0.0.0');
  });
}

// Find an available port
async function findAvailablePort(startPort: number): Promise<number> {
  let port = startPort;
  
  while (await isPortInUse(port)) {
    console.log(`Port ${port} is in use, trying ${port + 1}`);
    port++;
    
    // Prevent infinite loop in extreme cases
    if (port > startPort + 100) {
      console.error('Could not find an available port after 100 attempts');
      process.exit(1);
    }
  }
  
  return port;
}

// Handle server errors
server.on('error', (error: Error) => {
  console.error('Server error:', error);
  process.exit(1);
});

async function startServer() {
  try {
    // Find an available port
    PORT = await findAvailablePort(PORT);
    
    // Set up frontend depending on environment
    // In development mode, use Vite dev server
    if (config.isDevelopment) {
      console.log('Setting up Vite development server for frontend');
      await setupVite(app, server);
    } 
    // In production mode, serve static files
    else {
      console.log('Setting up static file serving for production');
      serveStatic(app);
    }
    
    // Start listening (bind to all interfaces for remote access)
    server.listen(PORT, config.HOST, () => {
      const serverUrl = config.SERVER_URL || `http://localhost:${PORT}`;
      const wsProtocol = serverUrl.startsWith('https') ? 'wss://' : 'ws://';
      const wsUrl = serverUrl.replace(/^https?:\/\//, wsProtocol);
      
      console.log(`⚡ Server running on port ${PORT}`);
      console.log(`🌎 API available at ${serverUrl}/api/status`);
      console.log(`🩺 Health check at ${serverUrl}/health`);
      console.log(`🧵 WebSocket server running at ${wsUrl}/ws`);
      
      if (config.isDevelopment) {
        console.log(`💻 Development server: ${serverUrl}`);
      } else {
        console.log(`🚀 Production server: ${serverUrl}`);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  
  // Close WebSocket server if available
  if (wss) {
    wss.close();
    console.log('WebSocket server closed');
  }
  
  // Close all database connections
  try {
    await closeConnections();
    console.log('Database connections closed');
  } catch (error) {
    console.error('Error closing database connections:', error);
  }
  
  // Close HTTP server
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
});

// Also handle SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.emit('SIGTERM');
});

export default server;