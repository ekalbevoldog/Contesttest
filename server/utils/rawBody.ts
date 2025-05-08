/**
 * Raw Body Utilities
 * 
 * Replacement for the micro module's functionality in webhook handling.
 * Provides utilities to read the raw body from a request.
 */

import { Request } from 'express';
import { buffer } from './buffer';

/**
 * Get the raw body string from a request
 * Used primarily in webhook verification
 */
export async function text(req: Request): Promise<string> {
  if (req.rawBody) {
    return req.rawBody.toString();
  }
  
  const buf = await buffer(req);
  return buf.toString();
}

/**
 * Parse the raw body as JSON
 */
export async function json(req: Request): Promise<any> {
  const body = await text(req);
  return JSON.parse(body);
}

// Export a default object for compatibility with the micro module
export default { text, json };