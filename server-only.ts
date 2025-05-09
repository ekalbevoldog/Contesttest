/**
 * Simple server script - runs the server without Vite
 * This allows testing the server routes independently
 */

import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import http from 'http';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

import config from './server/config/environment';
import { registerRoutes, configureWebSocketServer } from './server/routes';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Apply middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Create HTTP server
const server = http.createServer(app);

// Register routes
registerRoutes(app);

// Configure WebSocket server if enabled
if (config.ENABLE_WEBSOCKETS) {
  configureWebSocketServer(server);
}

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api/status`);
  console.log(`Health check at http://localhost:${PORT}/health`);
  if (config.ENABLE_WEBSOCKETS) {
    console.log(`WebSocket server running at ws://localhost:${PORT}/ws`);
  }
});