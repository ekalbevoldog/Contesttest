/**
 * Configuration Routes
 * 
 * Provides frontend with necessary configuration values for connecting to backend services.
 * Includes Supabase credentials and application feature flags.
 */
import { Router, Request, Response } from 'express';
import config from '../config/environment';

const router = Router();

// Get Supabase configuration
router.get('/supabase', (_req: Request, res: Response) => {
  // Get Supabase URL and key from centralized config
  const supabaseUrl = config.SUPABASE_URL;
  const supabaseKey = config.SUPABASE_PUBLIC_KEY || config.SUPABASE_ANON_KEY;

  // Check if we have both required values
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase configuration. SUPABASE_URL and SUPABASE_PUBLIC_KEY/SUPABASE_ANON_KEY are required.');
    return res.status(500).json({
      error: 'Missing Supabase configuration',
      message: 'Server is not properly configured for Supabase. Please contact support.'
    });
  }

  // Return the configuration
  res.json({
    url: supabaseUrl,
    key: supabaseKey
  });
});

// Get general application configuration
router.get('/', (_req: Request, res: Response) => {
  // Return general configuration using centralized config
  res.json({
    version: config.VERSION,
    environment: config.NODE_ENV,
    features: {
      enableWebsockets: true,
      enableAuth: true,
      enableSubscriptions: true,
      stripeEnabled: !!config.STRIPE_PUBLIC_KEY
    },
    // Additional app-level configuration
    apiEndpoints: {
      baseUrl: config.API_URL || '/api',
      websocketUrl: '/ws'
    }
  });
});

export default router;