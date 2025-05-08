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
import router, { configureWebSocket } from './routes';

// Import each route module
import authRoutes from './routes/authRoutes';
import profileRoutes from './routes/profileRoutes';
import healthRoutes from './routes/healthRoutes';
import subscriptionRoutes from './routes/subscriptionRoutes';
import webhookRoutes from './routes/webhookRoutes';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
// Always use environment PORT or fallback to 5000
const PORT = process.env.PORT || process.env.REPLIT_PORT || 5000;

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

// Register all route modules with consistent paths
app.use('/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/webhook', webhookRoutes);

// Use main router for other routes
app.use('/', router);

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

// Start listening (bind to all interfaces for remote access)
server.listen(parseInt(String(PORT), 10), '0.0.0.0', () => {
  const serverUrl = process.env.SERVER_URL || `http://localhost:${PORT}`;
  const wsProtocol = serverUrl.startsWith('https') ? 'wss://' : 'ws://';
  const wsUrl = serverUrl.replace(/^https?:\/\//, wsProtocol);
  
  console.log(`⚡ Server running on port ${PORT}`);
  console.log(`🌎 API available at ${serverUrl}/api/status`);
  console.log(`🩺 Health check at ${serverUrl}/health`);
  console.log(`🧵 WebSocket server running at ${wsUrl}/ws`);
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