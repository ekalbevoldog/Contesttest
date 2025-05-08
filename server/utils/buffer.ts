/**
 * Buffer Utility
 * 
 * Utility function to convert request streams to buffers.
 * Used for webhook processing and raw body parsing.
 */

import { Request } from 'express';

/**
 * Convert a request stream to a buffer
 * @param req Express request object
 * @returns Promise resolving to a Buffer
 */
export async function buffer(req: Request): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    // If the body is already parsed as a Buffer, return it
    if (Buffer.isBuffer(req.body)) {
      return resolve(req.body);
    }
    
    // If req.rawBody exists and is a string (from middleware), convert to Buffer
    if (req.rawBody && typeof req.rawBody === 'string') {
      return resolve(Buffer.from(req.rawBody));
    }

    // Otherwise, collect the body from the stream
    const chunks: Buffer[] = [];
    
    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    
    req.on('end', () => {
      const bodyBuffer = Buffer.concat(chunks);
      resolve(bodyBuffer);
    });
    
    req.on('error', (err) => {
      reject(err);
    });
  });
}