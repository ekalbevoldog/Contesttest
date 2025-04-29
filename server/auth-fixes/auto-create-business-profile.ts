import { supabase } from "../supabase";
import { v4 as uuidv4 } from 'uuid';

/**
 * Helper function to ensure a business user has a corresponding business profile
 * This is called during login, registration, and on profile page access
 */
export async function ensureBusinessProfile(userId: string, role: string): Promise<boolean> {
  if (role !== 'business') {
    console.log(`[AutoProfile] Not a business user (role: ${role}), skipping profile creation`);
    return false;
  }
  
  try {
    console.log(`[AutoProfile] Checking if business profile exists for user ${userId}`);
    
    // Check if profile exists with the Supabase API
    const { data: existingProfile, error: profileError } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.error(`[AutoProfile] Error checking business profile with API: ${profileError.message}`);
    } else if (existingProfile) {
      console.log(`[AutoProfile] Business profile already exists:`, existingProfile);
      return true;
    }
    
    // If no profile found, create one
    console.log(`[AutoProfile] Creating default business profile for user ${userId}`);
    
    // Get user email from API
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .maybeSingle();
      
    let userEmail = 'placeholder@example.com';
    if (userError) {
      console.error(`[AutoProfile] Error fetching user data: ${userError.message}`);
    } else if (userData?.email) {
      userEmail = userData.email;
    }
    
    // Create profile using the API
    return await createBusinessProfile(userId, userEmail);
    
  } catch (error) {
    console.error('[AutoProfile] Unexpected error:', error);
    return false;
  }
}

/**
 * Create a business profile using the Supabase API with multiple attempts
 * to handle potential schema mismatches between what the API expects and the database
 */
async function createBusinessProfile(userId: string, email: string): Promise<boolean> {
  try {
    console.log(`[AutoProfile] Attempting profile creation for user ${userId}`);
    
    // Verify the userId is a valid UUID
    if (!isValidUUID(userId)) {
      console.error(`[AutoProfile] Invalid UUID format for user_id: ${userId}`);
      return false;
    }
    
    // Generate a session ID
    const sessionId = uuidv4();
    
    // Try different combinations of field names based on what the API might expect
    
    // Attempt #1: Try with a complete set of fields
    try {
      const { data, error } = await supabase
        .from('business_profiles')
        .insert({
          user_id: userId,
          name: 'My Business',
          session_id: sessionId,
          email: email,
          audience_goals: 'Default goals',
          campaign_vibe: 'Professional',
          target_schools_sports: 'All'
        })
        .select();
        
      if (!error && data && data.length > 0) {
        console.log(`[AutoProfile] Successfully created profile with full fields:`, data[0]);
        return true;
      }
      
      console.log(`[AutoProfile] First attempt failed, trying alternate fields`);
    } catch (err) {
      console.log(`[AutoProfile] First profile creation attempt error:`, err);
    }
    
    // Attempt #2: Try with just the minimum fields
    try {
      const { data, error } = await supabase
        .from('business_profiles')
        .insert({
          user_id: userId,
          email: email
        })
        .select();
        
      if (!error && data && data.length > 0) {
        console.log(`[AutoProfile] Successfully created profile with minimal fields:`, data[0]);
        return true;
      }
      
      console.log(`[AutoProfile] Second attempt failed, trying with business_name`);
    } catch (err) {
      console.log(`[AutoProfile] Second profile creation attempt error:`, err);
    }
    
    // Attempt #3: Try with business_name instead of name 
    try {
      const { data, error } = await supabase
        .from('business_profiles')
        .insert({
          user_id: userId,
          business_name: 'My Business',
          email: email
        })
        .select();
        
      if (!error && data && data.length > 0) {
        console.log(`[AutoProfile] Successfully created profile with business_name field:`, data[0]);
        return true;
      }
      
      // If we got here, all attempts failed
      console.error(`[AutoProfile] All profile creation attempts failed`);
      return false;
    } catch (err) {
      console.log(`[AutoProfile] Final profile creation attempt error:`, err);
      return false;
    }
  } catch (error) {
    console.error(`[AutoProfile] Error in createBusinessProfile: ${error}`);
    return false;
  }
}

/**
 * Validate UUID format - basic validation for v4 UUID
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}