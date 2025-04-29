import { supabase } from "../supabase";

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
    
    // Check if business profile already exists
    // Use direct SQL query to avoid schema cache issues
    const { data: existingProfileData, error: profileError } = await supabase.rpc('run_sql', {
      sql: `SELECT id FROM business_profiles WHERE user_id = '${userId}'`
    });
    
    const existingProfile = Array.isArray(existingProfileData) && existingProfileData.length > 0 
      ? existingProfileData[0] 
      : null;
      
    if (profileError && profileError.code !== 'PGRST116') {
      // Unexpected error - log but continue to create profile
      console.error(`[AutoProfile] Error checking business profile: ${profileError.message}`);
    }
    
    // If profile exists, no need to create one
    if (existingProfile) {
      console.log(`[AutoProfile] Business profile already exists: ${existingProfile.id}`);
      return true;
    }
    
    // Create default business profile
    console.log(`[AutoProfile] Creating default business profile for user ${userId}`);
    
    const { data: businessUser, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();
      
    if (userError) {
      console.error(`[AutoProfile] Error fetching user data: ${userError.message}`);
      return false;
    }
    
    // Create business profile with defaults
    // Use direct SQL query for inserting to avoid schema cache issues
    const { data: insertResult, error: insertError } = await supabase.rpc('run_sql', {
      sql: `
        INSERT INTO business_profiles (user_id, business_name, email, business_type, created_at)
        VALUES ('${userId}', 'My Business', '${businessUser.email}', 'service', CURRENT_TIMESTAMP)
        RETURNING id
      `
    });
    
    const newProfile = Array.isArray(insertResult) && insertResult.length > 0 
      ? insertResult[0] 
      : null;
      
    if (insertError) {
      console.error(`[AutoProfile] Failed to create business profile: ${insertError.message}`);
      return false;
    }
    
    console.log(`[AutoProfile] Successfully created business profile: ${newProfile.id}`);
    return true;
  } catch (error) {
    console.error('[AutoProfile] Unexpected error:', error);
    return false;
  }
}