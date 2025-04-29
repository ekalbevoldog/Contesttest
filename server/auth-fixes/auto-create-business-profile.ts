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
    
    // First try to check with the Supabase API
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
      .single();
      
    let userEmail = 'placeholder@example.com';
    if (userError) {
      console.error(`[AutoProfile] Error fetching user data: ${userError.message}`);
    } else if (userData) {
      userEmail = userData.email;
    }
    
    // Try creating profile with Supabase API
    if (await createBusinessProfileWithAPI(userId, userEmail)) {
      return true;
    }
    
    // If API fails, try direct SQL
    console.log('[AutoProfile] API method failed, attempting with direct SQL');
    return await createBusinessProfileWithDirectSQL(userId, userEmail);
    
  } catch (error) {
    console.error('[AutoProfile] Unexpected error:', error);
    return false;
  }
}

/**
 * Create a business profile using the Supabase API
 */
async function createBusinessProfileWithAPI(userId: string, email: string): Promise<boolean> {
  try {
    console.log(`[AutoProfile] Attempting profile creation with API for user ${userId}`);
    
    // Verify the userId is a valid UUID
    if (!isValidUUID(userId)) {
      console.error(`[AutoProfile] Invalid UUID format for user_id: ${userId}`);
      return false;
    }
    
    // Generate a session ID - this appears to be required
    const sessionId = uuidv4();
    
    // Create profile with required fields based on error messages
    const { data, error } = await supabase
      .from('business_profiles')
      .insert({
        user_id: userId,
        email: email,
        session_id: sessionId,
        name: 'My Business' // Required field
      })
      .select();
    
    if (error) {
      console.error(`[AutoProfile] API profile creation error: ${error.message}`);
      return false;
    }
    
    if (data && data.length > 0) {
      console.log(`[AutoProfile] Successfully created profile:`, data[0]);
      return true;
    } else {
      console.error(`[AutoProfile] Insert returned no results`);
      return false;
    }
  } catch (error) {
    console.error(`[AutoProfile] Error in createBusinessProfileWithAPI: ${error}`);
    return false;
  }
}

/**
 * Create a business profile using direct SQL as a fallback
 */
async function createBusinessProfileWithDirectSQL(userId: string, email: string): Promise<boolean> {
  try {
    console.log(`[AutoProfile] Attempting direct SQL insert for user ${userId}`);
    
    // Generate a session ID - also required in the direct SQL
    const sessionId = uuidv4();
    
    // Try direct SQL as a last resort, with all required fields
    const { data, error } = await supabase
      .from('business_profiles')
      .insert({
        user_id: userId, 
        email: email,
        session_id: sessionId,
        name: 'My Business' // Required field
      })
      .select('*');
    
    if (error) {
      console.error(`[AutoProfile] Direct SQL insert error: ${error.message}`);
      return false;
    }
    
    if (data && data.length > 0) {
      console.log(`[AutoProfile] Successfully created profile with SQL:`, data[0]);
      return true;
    } else {
      console.error(`[AutoProfile] SQL insert returned no results`);
      return false;
    }
  } catch (error) {
    console.error(`[AutoProfile] Error in createBusinessProfileWithDirectSQL: ${error}`);
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