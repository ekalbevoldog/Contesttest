// server/routes/configRoutes.ts
import { Router } from 'express';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

// Get Supabase configuration
router.get('/supabase', (_req, res) => {
  // Get Supabase URL and key from environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_PUBLIC_KEY || process.env.SUPABASE_ANON_KEY;

  // Check if we have both required values
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase configuration. SUPABASE_URL and SUPABASE_PUBLIC_KEY are required.');
    // Return temporary dummy values that will allow the frontend to initialize
    // This is better than crashing the entire application
    return res.json({
      url: process.env.SUPABASE_URL || 'https://dummy.supabase.co',
      key: process.env.SUPABASE_PUBLIC_KEY || 'dummy-key'
    });
  }

  // Return the configuration
  res.json({
    url: supabaseUrl,
    key: supabaseKey
  });
});

// Get general application configuration
router.get('/', (_req, res) => {
  // Return general configuration
  res.json({
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    features: {
      enableWebsockets: true,
      enableAuth: true,
      enableSubscriptions: true
    }
  });
});

export default router;