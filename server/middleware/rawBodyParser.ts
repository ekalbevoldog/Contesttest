/**
 * Raw Body Parser Middleware
 * 
 * A middleware that extends Express request objects with rawBody property
 * for webhook verification and other use cases requiring the raw request body.
 */

import { Request, Response, NextFunction } from 'express';
import { json } from 'express';

declare global {
  namespace Express {
    interface Request {
      rawBody?: string;
    }
  }
}

/**
 * Creates middleware that parses the raw request body as text
 * and attaches it to the request object as `rawBody`
 * @returns Express middleware
 */
export function rawBodyParser() {
  return (req: Request, res: Response, next: NextFunction) => {
    let data = '';
    
    // Only parse if not already parsed
    if (req.rawBody === undefined) {
      // Save the raw body
      req.on('data', (chunk) => {
        data += chunk;
      });
      
      req.on('end', () => {
        req.rawBody = data;
        next();
      });
    } else {
      next();
    }
  };
}

/**
 * Creates middleware that combines raw body parsing with JSON parsing
 * Useful for webhook endpoints that need both the parsed JSON and the raw body
 * @returns Express middleware for both raw and JSON parsing
 */
export function jsonWithRawBody() {
  return [
    // First capture the raw body
    (req: Request, res: Response, next: NextFunction) => {
      let data = '';
      
      req.on('data', (chunk) => {
        data += chunk;
      });
      
      req.on('end', () => {
        req.rawBody = data;
        next();
      });
    },
    // Then parse as JSON
    json()
  ];
}

export default rawBodyParser;