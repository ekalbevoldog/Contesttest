import { Request, Response } from 'express';
import { supabase } from '../supabase';

/**
 * This endpoint retrieves a business profile for a user but does NOT create one if it doesn't exist.
 * Instead, it returns a clear error message if no profile is found.
 */
export async function getBusinessProfile(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId parameter' });
    }
    
    console.log(`[getBusinessProfile] Fetching profile for user ${userId}`);
    
    // Try to fetch the existing profile
    const { data: profileData, error: fetchError } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('user_id', userId)
      .limit(1);
      
    if (fetchError) {
      console.error('[getBusinessProfile] Error fetching profile:', fetchError);
      return res.status(500).json({ error: 'Error fetching business profile', details: fetchError });
    }
    
    // Check if profile exists
    if (!profileData || profileData.length === 0) {
      console.log('[getBusinessProfile] No profile found for user', userId);
      return res.status(404).json({ 
        error: 'Profile not found', 
        message: 'Business profile does not exist for this user', 
        userId
      });
    }
    
    // Return the profile
    console.log('[getBusinessProfile] Successfully retrieved profile:', profileData[0]);
    return res.status(200).json({ profile: profileData[0] });
    
  } catch (error) {
    console.error('[getBusinessProfile] Unexpected error:', error);
    return res.status(500).json({ error: 'Server error', details: error });
  }
}