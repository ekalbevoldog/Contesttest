import express from 'express';

const router = express.Router();

// GET /api/config/supabase - Returns Supabase configuration
router.get('/supabase', (req, res) => {
  try {
    // Get Supabase credentials from environment variables
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLIC_KEY;

    // Check if required credentials are available
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase configuration environment variables');
      return res.status(500).json({ 
        error: 'Supabase configuration is not available',
        message: 'The server is missing required Supabase environment variables'
      });
    }
    
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