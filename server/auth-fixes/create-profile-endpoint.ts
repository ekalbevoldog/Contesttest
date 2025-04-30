import express, { Request, Response } from 'express';
import { supabase } from '../supabase';

/**
 * This file contains an Express endpoint to create a business profile for a user
 * 
 * Usage: Import this into your routes.ts file and add it as middleware:
 *   import { createProfileEndpoint } from './auth-fixes/create-profile-endpoint';
 *   app.use('/api', createProfileEndpoint);
 */

// Middleware to check if user is authenticated
const checkAuth = async (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized - No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }
    
    // Attach user to request
    req.user = data.user;
    next();
  } catch (err) {
    console.error('Error checking authentication:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a router
const profileRouter = express.Router();

// Endpoint to create a business profile for a user
profileRouter.post('/create-business-profile', checkAuth, async (req: Request, res: Response) => {
  try {
    // Get user ID from request body or from authenticated user
    const userId = req.body.userId || req.user.id;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    console.log(`Creating business profile for user ${userId}`);
    
    // Check if user already has a business profile
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('business_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (profileCheckError) {
      console.error('Error checking for existing business profile:', profileCheckError);
      return res.status(500).json({ 
        error: 'Error checking for existing business profile',
        details: profileCheckError.message 
      });
    }
    
    if (existingProfile) {
      console.log(`User ${userId} already has a business profile with ID ${existingProfile.id}`);
      return res.status(200).json({ 
        message: 'Business profile already exists',
        profileId: existingProfile.id
      });
    }
    
    // Create a minimal business profile
    const { data: newProfile, error: createError } = await supabase
      .from('business_profiles')
      .insert({
        user_id: userId,
        name: 'New Business', // Placeholder name
        values: '',
        product_type: '',
        audience_goals: '',
        campaign_vibe: '',
        target_schools_sports: '',
        session_id: 'api-created'
      })
      .select()
      .single();
      
    if (createError) {
      console.error('Error creating business profile:', createError);
      return res.status(500).json({ 
        error: 'Error creating business profile',
        details: createError.message 
      });
    }
    
    console.log(`Created new business profile with ID ${newProfile.id} for user ${userId}`);
    
    return res.status(201).json({
      message: 'Business profile created successfully',
      profile: newProfile
    });
    
  } catch (error) {
    console.error('Unhandled error creating business profile:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export { profileRouter as createProfileEndpoint };

// Add TypeScript augmentation to extend Request type
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}