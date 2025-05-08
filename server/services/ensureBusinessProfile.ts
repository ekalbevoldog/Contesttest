/** 050825 1506 CST
 * Ensure Business Profile
 * 
 * Creates a placeholder business profile for users with the business role
 * if they don't already have one.
 */

import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

/**
 * Ensures a user with the business role has at least a placeholder business profile
 * @param userId The user's ID
 * @param userRole The user's role (should be 'business')
 */
export async function ensureBusinessProfile(userId: string, userRole: string): Promise<boolean> {
  try {
    // Only proceed for business users
    if (userRole !== 'business') {
      return false;
    }

    // Check if a business profile already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('business_profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking for existing business profile:', checkError);
      return false;
    }

    // If profile already exists, nothing to do
    if (existingProfile) {
      return true;
    }

    // Get user email from auth users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user data for profile creation:', userError);
      return false;
    }

    // Create placeholder business profile
    const sessionId = uuidv4(); // Generate a unique session ID
    const { error: insertError } = await supabase
      .from('business_profiles')
      .insert({
        id: userId,
        session_id: sessionId,
        name: 'Business Account', // Placeholder name
        email: userData.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error creating placeholder business profile:', insertError);
      return false;
    }

    console.log(`Created placeholder business profile for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Exception in ensureBusinessProfile:', error);
    return false;
  }
}

export default { ensureBusinessProfile };