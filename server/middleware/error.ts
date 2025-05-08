/** 05/08/2025 - 13:34 CST
 * Error Handling Middleware
 * 
 * Provides centralized error handling for the application.
 * Standardizes error responses and logs errors appropriately.
 */

import { Request, Response, NextFunction } from 'express';
import config from '../config/environment';

// Custom error class with status code
export class AppError extends Error {
  statusCode: number;
  code: string;
  details?: any;

  constructor(message: string, statusCode = 500, code = 'SERVER_ERROR', details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;

    // Ensure prototype chain is properly maintained
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// Error handler middleware
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error occurred:', err);

  // Default values
  let statusCode = 500;
  let errorCode = 'SERVER_ERROR';
  let message = 'Internal server error';
  let details = undefined;

  // Determine if this is our custom AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = err.code;
    message = err.message;
    details = err.details;
  } else {
    // Handle other types of errors
    message = err.message || 'Internal server error';

    // Check for known error types
    if (err.name === 'ValidationError') {
      statusCode = 400;
      errorCode = 'VALIDATION_ERROR';
    } else if (err.name === 'UnauthorizedError') {
      statusCode = 401;
      errorCode = 'UNAUTHORIZED';
    }

    // Include stack trace in development mode
    if (config.isDevelopment) {
      details = err.stack;
    }
  }

  // Send standardized error response
  res.status(statusCode).json({
    error: {
      code: errorCode,
      message: message,
      ...(details ? { details } : {})
    }
  });
};

// Not found error handler
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Resource not found: ${req.method} ${req.originalUrl}`
    }
  });
};

export default {
  AppError,
  errorHandler,
  notFoundHandler
};