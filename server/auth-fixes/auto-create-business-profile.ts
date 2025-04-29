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
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.error(`[AutoProfile] Error checking business profile with API: ${profileError.message}`);
    } else if (existingProfile) {
      console.log(`[AutoProfile] Business profile already exists: ${existingProfile.id}`);
      return true;
    }
    
    // If API doesn't find a profile, try with direct SQL
    try {
      const { data: existingProfiles } = await supabase.rpc('exec_sql', {
        sql: `SELECT id FROM business_profiles WHERE user_id = '${userId}' LIMIT 1`
      });
      
      if (existingProfiles && existingProfiles.length > 0) {
        console.log(`[AutoProfile] Business profile already exists (via SQL): ${existingProfiles[0].id}`);
        return true;
      }
    } catch (sqlError) {
      console.error(`[AutoProfile] SQL query error: ${sqlError}`);
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
      // If we can't get the email, use a placeholder
      return await createBusinessProfile(userId, 'placeholder@example.com');
    }
    
    // Create profile
    return await createBusinessProfile(userId, userData.email);
    
  } catch (error) {
    console.error('[AutoProfile] Unexpected error:', error);
    return false;
  }
}

/**
 * Helper to create a business profile using the Supabase API
 */
async function createBusinessProfile(userId: string, email: string): Promise<boolean> {
  try {
    // First try to create profile using the Supabase API
    const { data: newProfile, error: apiInsertError } = await supabase
      .from('business_profiles')
      .insert({
        user_id: userId,
        business_name: 'My Business',
        email: email,
        business_type: 'service',
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();
      
    if (apiInsertError) {
      console.error(`[AutoProfile] Failed to create business profile with API: ${apiInsertError.message}`);
      
      // If API fails, try direct SQL insert
      try {
        const { data: insertResult } = await supabase.rpc('exec_sql', {
          sql: `
            INSERT INTO business_profiles
            (user_id, business_name, email, business_type, created_at)
            VALUES
            ('${userId}', 'My Business', '${email}', 'service', '${new Date().toISOString()}')
            RETURNING id
          `
        });
        
        if (insertResult && insertResult.length > 0) {
          console.log(`[AutoProfile] Successfully created business profile with SQL: ${insertResult[0].id}`);
          return true;
        } else {
          console.error('[AutoProfile] SQL insert returned no results');
          return false;
        }
      } catch (sqlError) {
        console.error(`[AutoProfile] SQL insert error: ${sqlError}`);
        return false;
      }
    }
    
    console.log(`[AutoProfile] Successfully created business profile with API: ${newProfile.id}`);
    return true;
  } catch (error) {
    console.error('[AutoProfile] Error in createBusinessProfile:', error);
    return false;
  }
}