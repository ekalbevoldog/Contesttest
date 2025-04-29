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
    
    // Use direct SQL to check for existing profile - most reliable method
    const { data: existingProfiles, error: profileError } = await supabase.rpc('exec_sql', {
      sql: `SELECT id FROM business_profiles WHERE user_id = '${userId}' LIMIT 1`
    });
    
    if (profileError) {
      console.error(`[AutoProfile] Error checking business profile with SQL: ${profileError.message}`);
    } else if (existingProfiles && existingProfiles.length > 0) {
      console.log(`[AutoProfile] Business profile already exists: ${existingProfiles[0].id}`);
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
    
    // Create profile via direct SQL which we've confirmed works
    return await createBusinessProfileWithDirectSQL(userId, userEmail);
    
  } catch (error) {
    console.error('[AutoProfile] Unexpected error:', error);
    return false;
  }
}

/**
 * Create a business profile using direct SQL to bypass any schema cache issues
 */
async function createBusinessProfileWithDirectSQL(userId: string, email: string): Promise<boolean> {
  try {
    console.log(`[AutoProfile] Attempting direct SQL insert for user ${userId}`);
    
    // Use exactly the schema we verified works
    const sqlQuery = `
      INSERT INTO business_profiles (
        user_id, 
        business_name, 
        email
      ) 
      VALUES (
        '${userId}', 
        'My Business', 
        '${email}'
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