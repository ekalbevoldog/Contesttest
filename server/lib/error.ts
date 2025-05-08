/** 050825 1624CST
 * Error Utilities
 * 
 * Provides error classes and helper functions for consistent error handling.
 */

/**
 * Standard application error with status code and error code
 */
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

/**
 * Validation error for request data
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Authentication error
 */
export class AuthError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

/**
 * Authorization/permission error
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Permission denied') {
    super(message, 403, 'FORBIDDEN');
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

/**
 * Not found error
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Conflict error (e.g., duplicate resource)
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * Format error for API response
 */
export function formatError(error: Error | AppError): Record<string, any> {
  if (error instanceof AppError) {
    return {
      error: {
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {})
      }
    };
  }

  // For standard errors or unexpected objects
  return {
    error: {
      code: 'SERVER_ERROR',
      message: error.message || 'An unexpected error occurred'
    }
  };
}

export default {
  AppError,
  ValidationError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  formatError
};