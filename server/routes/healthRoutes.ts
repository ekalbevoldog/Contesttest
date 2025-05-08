/** 05/08/2025 - 13:30 CST
 * Health Check Routes
 * 
 * Provides endpoints to verify system health and component status.
 * Used for monitoring and uptime checks.
 */

import { Router } from 'express';
import os from 'os';
import { WebSocket } from 'ws';
import { checkDbConnection } from '../lib/supabase';
import config from '../config/environment';

const router = Router();

/**
 * GET /health
 * Basic health check endpoint
 */
router.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString() 
  });
});

/**
 * GET /health/detailed
 * Detailed health check with system information
 */
router.get('/detailed', async (req, res) => {
  try {
    // Prepare health check response
    const health: any = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: config.VERSION,
      environment: config.NODE_ENV,
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

    // Check database connection
    try {
      const dbStatus = await checkDbConnection();
      health.database = dbStatus;

      // Update overall status if database is not connected
      if (dbStatus.status !== 'connected') {
        health.status = 'degraded';
      }
    } catch (dbError) {
      health.database = {
        status: 'error',
        error: dbError instanceof Error ? dbError.message : String(dbError)
      };
      health.status = 'degraded';
    }

    // Check WebSocket server status
    const wss = (req.app.get('wss') as any);
    if (wss) {
      try {
        // Get stats from WebSocket server
        const wsStats = wss.getStats ? wss.getStats() : { activeConnections: 0 };

        health.websocket = {
          status: 'active',
          connections: wsStats.activeConnections || 0,
          ...(wsStats || {})
        };
      } catch (wsError) {
        health.websocket = {
          status: 'error',
          error: wsError instanceof Error ? wsError.message : String(wsError)
        };
        health.status = 'degraded';
      }
    } else {
      health.websocket = {
        status: 'disabled',
        message: 'WebSocket server is not configured'
      };
    }

    res.status(200).json(health);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /health/websocket
 * WebSocket-specific health check
 */
router.get('/websocket', (req, res) => {
  // Check if WebSocket server exists and is running
  const wss = (req.app.get('wss') as any);

  if (!wss) {
    return res.status(200).json({
      status: 'not_configured',
      message: 'WebSocket server is not configured'
    });
  }

  try {
    // Get WebSocket clients
    const clients = wss.clients ? Array.from(wss.clients as Set<WebSocket>) : [];
    const activeClients = clients.filter(
      (client) => client.readyState === WebSocket.OPEN
    ).length;

    // Get stats if available
    const stats = wss.getStats ? wss.getStats() : null;

    res.status(200).json({
      status: 'ok',
      clients: {
        total: clients.length,
        active: activeClients
      },
      ...(stats ? { stats } : {})
    });
  } catch (error) {
    console.error('WebSocket health check error:', error);
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /health/database
 * Database connection health check
 */
router.get('/database', async (req, res) => {
  try {
    const dbStatus = await checkDbConnection();

    res.status(dbStatus.status === 'connected' ? 200 : 503).json(dbStatus);
  } catch (error) {
    console.error('Database health check error:', error);
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;