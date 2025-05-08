/** 05/08/2025 - 1332CST
 * Request Logging Middleware
 * 
 * Provides centralized request logging for the application.
 * Logs request details and response time.
 */

import { Request, Response, NextFunction } from 'express';
import config from '../config/environment';

/**
 * Request logger middleware
 * 
 * Logs details about incoming requests and their responses.
 * In development, logs detailed info; in production, logs minimal info unless debug is enabled.
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  // Skip logging for health check and static file requests to reduce noise
  if (req.path.startsWith('/health') || req.path.startsWith('/assets/')) {
    return next();
  }

  // Record request start time
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] || `req-${Math.random().toString(36).substring(2, 10)}`;

  // Log request details
  if (config.isDevelopment || config.LOG_LEVEL === 'debug') {
    console.log(`[${requestId}] ${req.method} ${req.path} - Request received`);

    // Log request body for non-GET requests, but sanitize sensitive fields
    if (req.method !== 'GET' && req.body) {
      const sanitizedBody = { ...req.body };

      // Sanitize sensitive fields
      const sensitiveFields = ['password', 'currentPassword', 'newPassword', 'token', 'accessToken', 'refreshToken'];
      sensitiveFields.forEach(field => {
        if (field in sanitizedBody) {
          sanitizedBody[field] = '[REDACTED]';
        }
      });

      console.log(`[${requestId}] Request body:`, sanitizedBody);
    }
  }

  // Store request ID for potential use in error handling
  res.locals.requestId = requestId;

  // Capture response details
  const originalSend = res.send;
  res.send = function(body) {
    // Calculate response time
    const responseTime = Date.now() - startTime;

    // Log response details
    const logLevel = res.statusCode >= 500 ? 'error' : (res.statusCode >= 400 ? 'warn' : 'info');
    const logMethod = console[logLevel as keyof Console] || console.log;

    // Detailed logging for development or debug level
    if (config.isDevelopment || config.LOG_LEVEL === 'debug') {
      logMethod(`[${requestId}] ${req.method} ${req.path} - Response: ${res.statusCode} (${responseTime}ms)`);

      // Log error responses
      if (res.statusCode >= 400 && body) {
        let responseBody = body;

        // Try to parse JSON string
        if (typeof body === 'string' && body.startsWith('{')) {
          try {
            responseBody = JSON.parse(body);
          } catch (e) {
            // Keep as string if parse fails
          }
        }

        logMethod(`[${requestId}] Response body:`, responseBody);
      }
    } else if (logLevel !== 'info') {
      // In production, only log errors and warnings
      logMethod(`${req.method} ${req.path} - ${res.statusCode} (${responseTime}ms)`);
    }

    // Add response time header
    res.setHeader('X-Response-Time', `${responseTime}ms`);

    // Continue with the original send
    return originalSend.call(this, body);
  };

  next();
};

export default {
  requestLogger
};