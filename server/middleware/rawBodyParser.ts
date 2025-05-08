/** 12/08/2025 - 13:25 CST
 * Raw Body Parser Middleware
 * 
 * Provides middleware for handling raw request bodies.
 * Useful for webhook signature verification and other cases
 * where access to the raw request body is needed.
 */

import { Request, Response, NextFunction } from 'express';
import { json } from 'express';

// Extend Express Request type to include rawBody property
declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer;
    }
  }
}

/**
 * Middleware that captures the raw request body as Buffer
 * and attaches it to req.rawBody
 */
export const rawBodyParser = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    const chunks: Buffer[] = [];

    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    req.on('end', () => {
      req.rawBody = Buffer.concat(chunks);
      next();
    });

    req.on('error', next);
  };
};

/**
 * Middleware that combines raw body parsing with JSON parsing
 * For use with webhooks that need both raw body and parsed JSON body
 */
export const jsonWithRawBody = () => {
  return [
    // First capture the raw body
    rawBodyParser(),

    // Then parse body as JSON, but preserve the raw body
    (req: Request, res: Response, next: NextFunction) => {
      try {
        // Skip parsing if body is already handled
        if (typeof req.body === 'object' && req.body !== null) {
          return next();
        }

        // Parse the raw body as JSON
        if (req.rawBody) {
          req.body = JSON.parse(req.rawBody.toString());
        }

        next();
      } catch (error) {
        next(error);
      }
    }
  ];
};

export default {
  rawBodyParser,
  jsonWithRawBody
};