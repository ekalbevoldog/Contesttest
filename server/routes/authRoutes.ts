/**
 * Authentication Routes
 * 
 * Handles user authentication with Supabase, standardized role detection,
 * and session management.
 */

import { Router, Request, Response } from 'express';
import { supabase } from '../lib/unifiedSupabase';
import { requireAuth } from '../middleware/auth';

const router = Router();

/**
 * Handle user login
 * Uses standardized role detection approach
 */
router.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Missing credentials',
        message: 'Email and password are required'
      });
    }
    
    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('Login error:', error);
      return res.status(401).json({ 
        error: 'Authentication failed',
        message: error.message 
      });
    }
    
    if (!data || !data.user) {
      return res.status(401).json({ 
        error: 'Authentication failed',
        message: 'Invalid credentials' 
      });
    }
    
    // Extract user role using standardized approach
    const role = data.user.user_metadata?.role || 
                data.user.role || 
                data.user.user_metadata?.userType ||
                data.user.user_metadata?.user_type || 
                (data.user as any).user_type ||
                'user';
    
    // Return user data with standardized fields
    res.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        role: role,
        userType: role,
        user_metadata: {
          role: data.user.user_metadata?.role,
          userType: data.user.user_metadata?.userType,
          user_type: data.user.user_metadata?.user_type
        }
      },
      session: data.session
    });
  } catch (error) {
    console.error('Server error during login:', error);
    res.status(500).json({
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error during authentication'
    });
  }
});

/**
 * Handle user registration
 * With standardized role fields
 */
router.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, role } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Missing credentials',
        message: 'Email and password are required'
      });
    }
    
    // Register with Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
          userType: role,
          user_type: role
        }
      }
    });
    
    if (error) {
      console.error('Registration error:', error);
      return res.status(400).json({ 
        error: 'Registration failed',
        message: error.message 
      });
    }
    
    if (!data || !data.user) {
      return res.status(400).json({ 
        error: 'Registration failed',
        message: 'Could not create user' 
      });
    }
    
    // Return success
    res.json({
      success: true,
      message: 'Registration successful',
      user: {
        id: data.user.id,
        email: data.user.email,
        role: role,
        userType: role
      }
    });
  } catch (error) {
    console.error('Server error during registration:', error);
    res.status(500).json({
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error during registration'
    });
  }
});

/**
 * Get current user profile
 * Using standardized role approach
 */
router.get('/api/auth/me', requireAuth, (req: Request, res: Response) => {
  // This route will only be reached if requireAuth middleware passes
  // At this point, req.user should be populated with user data
  res.json({ 
    user: req.user,
    authenticated: true
  });
});

/**
 * Log out current user
 */
router.post('/api/auth/logout', async (req: Request, res: Response) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Sign out this session
      await supabase.auth.signOut();
    }
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error during logout'
    });
  }
});

export default router;