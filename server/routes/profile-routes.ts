import express from 'express';
import { supabase } from '../supabase';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

/**
 * Create a business profile for a user if it doesn't already exist
 */
router.post('/create-business-profile', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    // Check if the user exists and has a business role
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', userId)
      .maybeSingle();
      
    if (userError) {
      console.error('Error fetching user:', userError.message);
      return res.status(500).json({ error: 'Failed to fetch user' });
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.role !== 'business') {
      return res.status(400).json({ error: 'User is not a business user' });
    }
    
    // Check if profile already exists
    const { data: existingProfile, error: profileError } = await supabase
      .from('business_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error checking existing profile:', profileError.message);
      return res.status(500).json({ error: 'Failed to check existing profile' });
    }
    
    if (existingProfile) {
      console.log(`Business profile already exists for user ${userId}`);
      return res.status(200).json({ success: true, existing: true, profileId: existingProfile.id });
    }
    
    // Create a new business profile
    const sessionId = uuidv4();
    
    const { data: newProfile, error: createError } = await supabase
      .from('business_profiles')
      .insert({
        user_id: userId,
        name: 'My Business',
        session_id: sessionId,
        email: user.email,
        values: 'Default values',
        product_type: 'Default product',
        target_schools_sports: 'All'
      })
      .select();
      
    if (createError) {
      console.error('Error creating business profile:', createError.message);
      return res.status(500).json({ error: 'Failed to create business profile', details: createError.message });
    }
    
    console.log(`Created business profile for user ${userId}`);
    return res.status(201).json({ success: true, profile: newProfile[0] });
    
  } catch (error) {
    console.error('Unexpected error in create-business-profile:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;