/**
 * API Routes
 * 
 * Central router that manages all API endpoints and WebSocket connections.
 * Provides consistent error handling and authentication integration with Supabase.
 */

import { Router, Request, Response, NextFunction } from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { getDb, sql } from './dbSetup';
import healthRoutes from './routes/healthRoutes';
import { jsonWithRawBody } from './middleware/rawBodyParser';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create main router
export const router = Router();

// Middleware for all routes
router.use((req: Request, res: Response, next: NextFunction) => {
  // Add cross-origin headers for API requests
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Health check routes
router.use('/health', healthRoutes);

// Authentication middleware
// Verifies JWT tokens from Supabase
const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  // Log authentication attempt
  console.log('Auth Middleware: Authorization header', authHeader ? 'Present' : 'Missing');
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header missing' });
  }
  
  try {
    // Format: "Bearer <token>"
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Invalid authorization format' });
    }
    
    // Verify token with Supabase JWT logic
    // Note: This is a simplified implementation
    // In production, verify with proper JWT validation
    req.user = { 
      id: 'user_id', 
      token,
      role: 'user', // Adding default role for type compatibility
      email: 'user@example.com' // Adding default email for type compatibility
    };
    
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// API endpoints
router.get('/api/status', (req: Request, res: Response) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

// Protected endpoint example
router.get('/api/profile', authMiddleware, (req: Request, res: Response) => {
  res.json({ user: req.user });
});

// Example endpoint that uses database
router.get('/api/data', async (req: Request, res: Response) => {
  try {
    // Get database connection
    const db = getDb();
    
    // Execute a simple SQL query to test database connectivity
    const query = sql`SELECT NOW() as time`;
    const result = await query.execute();
    
    // Return the result
    res.json({ 
      data: result, 
      timestamp: new Date().toISOString(),
      status: 'success'
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      error: 'Database error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
router.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('API Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// WebSocket configuration
export function configureWebSocket(server: http.Server) {
  // Create WebSocket server with specified path
  const wss = new WebSocketServer({ 
    server,
    path: '/ws'
  });
  
  // Store WebSocket server instance in app for health checks
  (server as any).app?.set('wss', wss);
  
  // Handle WebSocket connections
  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket connection established');
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: 'system',
      message: 'Connected to WebSocket server',
      timestamp: new Date().toISOString()
    }));
    
    // Handle incoming messages
    ws.on('message', (message: string) => {
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

// Add type definition for User in Request
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        token: string;
        role: string;
        email: string;
      };
    }
  }
}

export default router;