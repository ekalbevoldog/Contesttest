/** 050825 1623CST
 * Validation Middleware
 * 
 * Provides middleware for validating request data using schemas.
 */

import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../lib/error';
import { ZodSchema } from 'zod';
import { fromZodError } from 'zod-validation-error';

/**
 * Validate request body against a schema
 */
export function validateBody(schema: ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync(req.body);
      // Replace request body with validated data
      req.body = validated;
      next();
    } catch (error) {
      // Convert Zod error to friendly format
      const validationError = fromZodError(error as any);
      next(new ValidationError(validationError.message, validationError.details));
    }
  };
}

/**
 * Validate request query parameters against a schema
 */
export function validateQuery(schema: ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync(req.query);
      // Replace request query with validated data
      req.query = validated;
      next();
    } catch (error) {
      const validationError = fromZodError(error as any);
      next(new ValidationError(validationError.message, validationError.details));
    }
  };
}

/**
 * Validate request params against a schema
 */
export function validateParams(schema: ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync(req.params);
      // Replace request params with validated data
      req.params = validated;
      next();
    } catch (error) {
      const validationError = fromZodError(error as any);
      next(new ValidationError(validationError.message, validationError.details));
    }
  };
}

/**
 * Validate a file upload
 */
export function validateFile(req: Request, res: Response, next: NextFunction) {
  // Check if file exists
  if (!req.file) {
    next(new ValidationError('File upload is required'));
    return;
  }

  // Check file size (default max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (req.file.size > maxSize) {
    next(new ValidationError('File size exceeds limit (5MB)'));
    return;
  }

  // Check file type based on mimetype
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(req.file.mimetype)) {
    next(new ValidationError('Only image files are allowed (JPEG, PNG, GIF, WEBP)'));
    return;
  }

  next();
}

export default {
  validateBody,
  validateQuery,
  validateParams,
  validateFile
};