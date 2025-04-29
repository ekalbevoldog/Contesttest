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
    
    // First check with the Supabase API
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
      
    if (userError) {
      console.error(`[AutoProfile] Error fetching user data: ${userError.message}`);
      // If we can't get the email, use direct SQL to create a profile
      return await createBusinessProfileWithDirectSQL(userId);
    }
    
    // Create profile with email
    return await createBusinessProfileWithDirectSQL(userId, userData.email);
    
  } catch (error) {
    console.error('[AutoProfile] Unexpected error:', error);
    return false;
  }
}

/**
 * Create a business profile using direct SQL to bypass any schema cache issues
 */
async function createBusinessProfileWithDirectSQL(userId: string, email?: string): Promise<boolean> {
  try {
    console.log(`[AutoProfile] Attempting direct SQL insert for user ${userId}`);
    
    // Generate a random session ID if we don't have one
    const sessionId = `session-${Math.random().toString(36).substring(2, 15)}`;
    const timestamp = new Date().toISOString();
    
    // Create with all the required fields
    const sqlQuery = `
      INSERT INTO business_profiles (
        user_id, 
        session_id, 
        email, 
        business_name, 
        business_type, 
        created_at
      ) 
      VALUES (
        '${userId}', 
        '${sessionId}', 
        '${email || 'placeholder@example.com'}', 
        'My Business', 
        'service', 
        '${timestamp}'
      ) 
      RETURNING *;
    `;
    
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlQuery });
    
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