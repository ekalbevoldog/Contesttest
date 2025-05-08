/**
 * Health Check Routes
 * 
 * Provides endpoints to verify server status and health.
 * Used by monitoring systems and frontend to check backend availability.
 */

import { Router } from 'express';
import os from 'os';
import { WebSocket } from 'ws';

// Import database connection functions
let dbConnection: any;
let checkDbConnection: any;
try {
  const { getDb, checkDbConnection: checkDb } = require('../dbSetup');
  dbConnection = getDb;
  checkDbConnection = checkDb;
} catch (error) {
  console.log('No database setup found, health check will not include database status');
}

export const healthRoutes = Router();

// Basic health check: returns 200 OK if server is running
healthRoutes.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Define interface for health check response for type safety
interface HealthResponse {
  status: string;
  timestamp: string;
  uptime: number;
  system: {
    freemem: number;
    totalmem: number;
    loadavg: number[];
    cpus: number;
    platform: string;
    hostname: string;
  };
  process: {
    pid: number;
    memory: NodeJS.MemoryUsage;
    version: string;
  };
  database?: {
    status: string;
    timestamp?: string;
    error?: string;
  };
}

// Detailed health check with system information
healthRoutes.get('/detailed', async (req, res) => {
  try {
    const health: HealthResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      system: {
        freemem: os.freemem(),
        totalmem: os.totalmem(),
        loadavg: os.loadavg(),
        cpus: os.cpus().length,
        platform: os.platform(),
        hostname: os.hostname()
      },
      process: {
        pid: process.pid,
        memory: process.memoryUsage(),
        version: process.version
      }
    };
    
    // Add database status if available
    if (dbConnection) {
      try {
        // Test database connection using our checkDbConnection utility
        const { status, timestamp, error } = await checkDbConnection();
        health.database = {
          status,
          timestamp: timestamp || new Date().toISOString()
        };
        if (error) {
          health.database.error = error;
        }
      } catch (err) {
        const error = err as Error;
        health.database = {
          status: 'error',
          error: error.message
        };
      }
    }
    
    res.status(200).json(health);
  } catch (err) {
    const error = err as Error;
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

// WebSocket status
healthRoutes.get('/websocket', (req, res) => {
  // Check if WebSocket server exists and is running
  const wss = (req.app.get('wss') as any);
  
  if (!wss) {
    return res.status(200).json({
      status: 'not_configured',
      message: 'WebSocket server is not configured'
    });
  }
  
  // Safely type-cast clients array
  const clients = wss.clients ? Array.from(wss.clients as Set<WebSocket>) : [];
  const activeClients = clients.filter(
    (client) => client.readyState === WebSocket.OPEN
  ).length;
  
  res.status(200).json({
    status: 'ok',
    clients: {
      total: clients.length,
      active: activeClients
    }
  });
});

export default healthRoutes;