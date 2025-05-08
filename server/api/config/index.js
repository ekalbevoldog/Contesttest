import express from 'express';

const router = express.Router();

// GET /api/config/supabase - Returns Supabase configuration
router.get('/supabase', (req, res) => {
  try {
    // When DATABASE_URL or other Supabase secrets are not available,
    // we'll use a fallback configuration for development
    
    // Check if we have real Supabase credentials
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
    
    // Return the configuration
    res.json({
      url: supabaseUrl,
      key: supabaseKey
    });
  } catch (error) {
    console.error('Error providing Supabase configuration:', error);
    res.status(500).json({ error: 'Failed to provide Supabase configuration' });
  }
});

export default router;