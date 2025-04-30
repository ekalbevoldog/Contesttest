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
      .eq('id', userId)
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
    
    // Based on our successful testing, we now know the exact required fields:
    // 1. session_id - required, not null
    // 2. name - required, not null
    // 3. audience_goals - required, not null
    // 4. values - required, not null (from error)
    // 5. campaign_vibe - required, not null (from error)
    // 6. product_type - required for API
    
    console.log(`[AutoProfile] Creating with all required fields`);
    try {
      const { data, error } = await supabase
        .from('business_profiles')
        .insert({
          id: userId, // Use id instead of user_id
          name: 'My Business',
          session_id: sessionId,
          email: email,
          audience_goals: 'Default goals',
          campaign_vibe: 'Professional',
          values: 'Default values',
          product_type: 'Default product'
        })
        .select();
        
      if (error) {
        console.error(`[AutoProfile] Profile creation error: ${error.message}`);
        if (error.details) {
          console.error(`[AutoProfile] Error details: ${error.details}`);
        }
        return false;
      }
      
      if (data && data.length > 0) {
        console.log(`[AutoProfile] Successfully created business profile with ID: ${data[0].id}`);
        return true;
      }
      
      console.error(`[AutoProfile] No data returned from profile creation, but no error either`);
      return false;
    } catch (err) {
      console.error(`[AutoProfile] Exception during profile creation:`, err);
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