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
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import net from 'net';
import fs from 'fs';
import { router, configureWebSocket } from './routes';
import { setupVite, serveStatic } from './vite';

// Import each route module
import authRoutes from './routes/authRoutes';
import profileRoutes from './routes/profileRoutes';
import healthRoutes from './routes/healthRoutes';
import subscriptionRoutes from './routes/subscriptionRoutes';
import webhookRoutes from './routes/webhookRoutes';
import configRoutes from './routes/configRoutes';

// Load environment variables from .env files
dotenv.config();

// Determine environment
const isDev = process.env.NODE_ENV !== 'production';
console.log(`Starting server in ${isDev ? 'development' : 'production'} mode`);

// Initialize Express app
const app = express();

// Start with the requested port, but don't bind yet - we'll find an available port
const DEFAULT_PORT = 3000;
let PORT = parseInt(process.env.PORT || process.env.REPLIT_PORT || DEFAULT_PORT.toString(), 10);

// Set up middleware
app.use(cors({
  origin: true, // Allow any origin in development
  credentials: true // Allow cookies
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// Configure session management
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'contested-app-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
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

// API Routes - register these FIRST to ensure they take priority
app.use('/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/config', configRoutes);
app.use('/api', router);

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
    if (isDev) {
      console.log('Setting up Vite development server for frontend');
      await setupVite(app, server);
    } 
    // In production mode, serve static files
    else {
      console.log('Setting up static file serving for production');
      serveStatic(app);
    }
    
    // Start listening (bind to all interfaces for remote access)
    server.listen(PORT, '0.0.0.0', () => {
      const serverUrl = process.env.SERVER_URL || `http://localhost:${PORT}`;
      const wsProtocol = serverUrl.startsWith('https') ? 'wss://' : 'ws://';
      const wsUrl = serverUrl.replace(/^https?:\/\//, wsProtocol);
      
      console.log(`⚡ Server running on port ${PORT}`);
      console.log(`🌎 API available at ${serverUrl}/api/status`);
      console.log(`🩺 Health check at ${serverUrl}/health`);
      console.log(`🧵 WebSocket server running at ${wsUrl}/ws`);
      
      if (isDev) {
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
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
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

export default server;