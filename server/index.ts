/**
 * Server Entry Point
 * 
 * This is the main server initialization that sets up Express, WebSockets, 
 * database connections, and all required middleware for the application.
 */

import express from 'express';
import http from 'http';
import path from 'path';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { registerRoutes, configureWebSocket } from './routes'; // Import from consolidated routes

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Set up middleware
app.use(cors());
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

// Register all routes through the centralized route registry
registerRoutes(app);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Serve frontend static files
  app.use(express.static(path.join(__dirname, '../../client/dist')));
  
  // All unhandled requests should return the React app
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../client/dist/index.html'));
  });
}

// Create HTTP server
const server = http.createServer(app);

// Store the app in the server for access by other modules
(server as any).app = app;

// Configure WebSocket server
const wss = configureWebSocket(server);

// Handle server errors
server.on('error', (error: Error) => {
  console.error('Server error:', error);
  process.exit(1);
});

// Start listening (parse port as number to avoid TypeScript error)
server.listen(parseInt(String(PORT), 10), () => {
  console.log(`⚡ Server running on port ${PORT}`);
  console.log(`🌎 API available at http://localhost:${PORT}/api/status`);
  console.log(`🩺 Health check at http://localhost:${PORT}/health`);
  console.log(`🧵 WebSocket server running at ws://localhost:${PORT}/ws`);
});

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