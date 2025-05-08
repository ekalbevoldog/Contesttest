/** 05/08/2025 - 1458CST
 * Configuration Routes
 * 
 * Provides API endpoints to fetch configuration information.
 * Used by the frontend for configuration without hardcoding values.
 */

import { Router, Request, Response } from 'express';
import config from '../config/environment';
import { optionalAuth } from '../middleware/auth';

const router = Router();

/**
 * Apply optional authentication middleware to all routes
 * This allows us to provide different configurations based on user role
 * while still allowing unauthenticated access to basic config
 */
router.use(optionalAuth);

/**
 * GET /api/config
 * Get general application configuration
 */
router.get('/', (req: Request, res: Response) => {
  // Public configuration data safe to expose to frontend
  const publicConfig = {
    version: config.VERSION,
    environment: config.NODE_ENV,
    features: {
      websockets: config.ENABLE_WEBSOCKETS,
      analytics: config.ENABLE_ANALYTICS
    },
    serverUrl: config.SERVER_URL || '',
    apiUrl: config.API_URL || ''
  };

  res.status(200).json(publicConfig);
});

/**
 * GET /api/config/supabase
 * Get Supabase public configuration
 */
router.get('/supabase', (req: Request, res: Response) => {
  // Only expose the URL and public/anon key
  const supabaseConfig = {
    url: config.SUPABASE_URL,
    key: config.SUPABASE_ANON_KEY || config.SUPABASE_PUBLIC_KEY
  };

  // Check if required credentials are available
  if (!supabaseConfig.url || !supabaseConfig.key) {
    return res.status(500).json({ 
      error: 'Supabase configuration is not available',
      message: 'The server is missing required Supabase environment variables'
    });
  }

  res.status(200).json(supabaseConfig);
});

/**
 * GET /api/config/stripe
 * Get Stripe public configuration
 */
router.get('/stripe', (req: Request, res: Response) => {
  // Only expose the public key, never the secret key
  const stripeConfig = {
    publicKey: config.STRIPE_PUBLIC_KEY,
    enabled: Boolean(config.STRIPE_PUBLIC_KEY && config.STRIPE_SECRET_KEY)
  };

  res.status(200).json(stripeConfig);
});

/**
 * GET /api/config/roles
 * Get available user roles and their permissions
 */
router.get('/roles', (req: Request, res: Response) => {
  // Define available roles and their permissions
  const roles = {
    athlete: {
      name: 'Athlete',
      description: 'College athletes looking to find partnerships with businesses',
      permissions: [
        'view_matches',
        'respond_to_matches',
        'view_offers',
        'accept_offers',
        'decline_offers'
      ]
    },
    business: {
      name: 'Business',
      description: 'Businesses looking to partner with college athletes',
      permissions: [
        'create_campaigns',
        'view_campaigns',
        'edit_campaigns',
        'launch_campaigns',
        'view_matches',
        'create_offers'
      ]
    },
    compliance: {
      name: 'Compliance Officer',
      description: 'School compliance officers who review partnerships',
      permissions: [
        'view_matches',
        'approve_matches',
        'reject_matches',
        'view_offers',
        'approve_offers',
        'reject_offers'
      ]
    },
    admin: {
      name: 'Administrator',
      description: 'System administrators with full access',
      permissions: [
        'view_all_users',
        'edit_users',
        'view_all_campaigns',
        'view_all_matches',
        'view_all_offers',
        'manage_system'
      ]
    }
  };

  res.status(200).json({ roles });
});

/**
 * GET /api/config/sports
 * Get available sports
 */
router.get('/sports', async (req: Request, res: Response) => {
  // Define common sports available in the platform
  const sports = [
    { id: 'football', name: 'Football' },
    { id: 'basketball', name: 'Basketball' },
    { id: 'baseball', name: 'Baseball' },
    { id: 'softball', name: 'Softball' },
    { id: 'volleyball', name: 'Volleyball' },
    { id: 'soccer', name: 'Soccer' },
    { id: 'track', name: 'Track & Field' },
    { id: 'swimming', name: 'Swimming & Diving' },
    { id: 'tennis', name: 'Tennis' },
    { id: 'golf', name: 'Golf' },
    { id: 'wrestling', name: 'Wrestling' },
    { id: 'gymnastics', name: 'Gymnastics' },
    { id: 'hockey', name: 'Hockey' },
    { id: 'lacrosse', name: 'Lacrosse' },
    { id: 'rowing', name: 'Rowing' },
    { id: 'fencing', name: 'Fencing' },
    { id: 'cross_country', name: 'Cross Country' },
    { id: 'water_polo', name: 'Water Polo' },
    { id: 'field_hockey', name: 'Field Hockey' },
    { id: 'other', name: 'Other' }
  ];

  res.status(200).json({ sports });
});

/**
 * GET /api/config/divisions
 * Get available NCAA divisions
 */
router.get('/divisions', (req: Request, res: Response) => {
  // Define NCAA divisions
  const divisions = [
    { id: 'division1', name: 'NCAA Division I' },
    { id: 'division2', name: 'NCAA Division II' },
    { id: 'division3', name: 'NCAA Division III' },
    { id: 'naia', name: 'NAIA' },
    { id: 'juco', name: 'Junior College' }
  ];

  res.status(200).json({ divisions });
});

/**
 * GET /api/config/industries
 * Get available business industries
 */
router.get('/industries', (req: Request, res: Response) => {
  // Define common business industries
  const industries = [
    { id: 'retail', name: 'Retail' },
    { id: 'food_beverage', name: 'Food & Beverage' },
    { id: 'apparel', name: 'Apparel & Fashion' },
    { id: 'sports_equipment', name: 'Sports Equipment' },
    { id: 'technology', name: 'Technology' },
    { id: 'entertainment', name: 'Entertainment' },
    { id: 'health_fitness', name: 'Health & Fitness' },
    { id: 'financial', name: 'Financial Services' },
    { id: 'automotive', name: 'Automotive' },
    { id: 'education', name: 'Education' },
    { id: 'travel', name: 'Travel & Hospitality' },
    { id: 'gaming', name: 'Gaming' },
    { id: 'beauty', name: 'Beauty & Personal Care' },
    { id: 'real_estate', name: 'Real Estate' },
    { id: 'other', name: 'Other' }
  ];

  res.status(200).json({ industries });
});

export default router;