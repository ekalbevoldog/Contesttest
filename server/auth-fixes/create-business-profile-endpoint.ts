/**
 * Business Profile Auto-Creation Endpoint
 * 
 * This endpoint creates a business profile for a user when they don't have one yet.
 * It's used by the BusinessDashboard and UnifiedProtectedRoute components to ensure
 * business users always have a profile before accessing protected routes.
 */

import { Request, Response } from 'express';
import { supabase } from '../supabase';

/**
 * Creates a minimal business profile for a user who doesn't have one yet
 */
export async function createBusinessProfileEndpoint(req: Request, res: Response) {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    console.log(`[createBusinessProfileEndpoint] Creating profile for user ${userId}`);
    
    // First check if a profile already exists for this user
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (profileCheckError) {
      console.error('[createBusinessProfileEndpoint] Error checking for existing profile:', profileCheckError);
      return res.status(500).json({ error: 'Error checking for existing profile' });
    }
    
    // If profile already exists, return it
    if (existingProfile) {
      console.log('[createBusinessProfileEndpoint] Profile already exists:', existingProfile);
      return res.status(200).json({ profile: existingProfile, message: 'Profile already exists' });
    }
    
    // Get user details to populate profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (userError) {
      console.error('[createBusinessProfileEndpoint] Error fetching user:', userError);
      return res.status(500).json({ error: 'Error fetching user' });
    }
    
    if (!user) {
      console.error('[createBusinessProfileEndpoint] User not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get session details for the user
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    // Create minimal business profile
    const businessProfile = {
      name: user.username || 'New Business',
      user_id: user.id,
      session_id: session?.id || null,
      values: '',
      product_type: '',
      audience_goals: '',
      campaign_vibe: '',
      target_schools_sports: '',
      email: user.email,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const { data: newProfile, error: insertError } = await supabase
      .from('business_profiles')
      .insert(businessProfile)
      .select()
      .single();
    
    if (insertError) {
      console.error('[createBusinessProfileEndpoint] Error creating profile:', insertError);
      return res.status(500).json({ error: 'Error creating business profile' });
    }
    
    console.log('[createBusinessProfileEndpoint] Successfully created business profile:', newProfile);
    
    // Update user record to indicate profile is complete
    await supabase
      .from('sessions')
      .update({ profile_completed: true })
      .eq('user_id', userId);
    
    return res.status(201).json({ 
      profile: newProfile,
      message: 'Business profile created successfully'
    });
    
  } catch (error) {
    console.error('[createBusinessProfileEndpoint] Unexpected error:', error);
    return res.status(500).json({ error: 'Unexpected error creating business profile' });
  }
}