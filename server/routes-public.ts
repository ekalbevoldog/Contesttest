/**
 * This file contains public API routes for exposing 
 * necessary environment variables to the client.
 */
import express, { Request, Response } from 'express';

export function registerPublicRoutes(app: express.Express) {
  // Route to provide client-side Supabase credentials
  app.get('/api/config/supabase', (req: Request, res: Response) => {
    res.json({
      url: process.env.SUPABASE_URL,
      key: process.env.SUPABASE_KEY
    });
  });
}