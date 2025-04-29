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
    
    // Use direct SQL query to check if business profile exists
    // This is more reliable than using the Supabase API which might have schema sync issues
    const { data: existingProfiles, error: profileQueryError } = await supabase.rpc('exec_sql', {
      sql_query: `SELECT id FROM business_profiles WHERE user_id = '${userId}' LIMIT 1`
    });
    
    if (profileQueryError) {
      console.error(`[AutoProfile] Error checking business profile with SQL: ${profileQueryError.message}`);
      
      // Fallback to standard API call
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
    } else if (existingProfiles && existingProfiles.length > 0) {
      console.log(`[AutoProfile] Business profile already exists: ${existingProfiles[0].id}`);
      return true;
    }
    
    // Get user email
    console.log(`[AutoProfile] Creating default business profile for user ${userId}`);
    
    const { data: users, error: userQueryError } = await supabase.rpc('exec_sql', {
      sql_query: `SELECT email FROM users WHERE id = '${userId}' LIMIT 1`
    });
    
    if (userQueryError || !users || users.length === 0) {
      console.error(`[AutoProfile] Error fetching user data with SQL: ${userQueryError?.message || 'No user found'}`);
      
      // Fallback to standard API
      const { data: businessUser, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single();
        
      if (userError) {
        console.error(`[AutoProfile] Error fetching user data with API: ${userError.message}`);
        return false;
      }
      
      // Create using direct SQL
      const userEmail = businessUser.email;
      const insertResult = await createBusinessProfileWithSQL(userId, userEmail);
      return insertResult;
    }
    
    // Create using direct SQL
    const userEmail = users[0].email;
    return await createBusinessProfileWithSQL(userId, userEmail);
    
  } catch (error) {
    console.error('[AutoProfile] Unexpected error:', error);
    return false;
  }
}

/**
 * Helper to create a business profile with direct SQL
 * This bypasses any issues with schema synchronization
 */
async function createBusinessProfileWithSQL(userId: string, email: string): Promise<boolean> {
  try {
    // Try direct SQL insert first
    const { data: insertResult, error: insertError } = await supabase.rpc('exec_sql', {
      sql_query: `
        INSERT INTO business_profiles
        (user_id, business_name, email, business_type, created_at)
        VALUES
        ('${userId}', 'My Business', '${email}', 'service', '${new Date().toISOString()}')
        RETURNING id
      `
    });
    
    if (insertError) {
      console.error(`[AutoProfile] Failed to create business profile with SQL: ${insertError.message}`);
      
      // Fallback to Supabase API
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
        return false;
      }
      
      console.log(`[AutoProfile] Successfully created business profile with API: ${newProfile.id}`);
      return true;
    }
    
    if (insertResult && insertResult.length > 0) {
      console.log(`[AutoProfile] Successfully created business profile with SQL: ${insertResult[0].id}`);
      return true;
    } else {
      console.error('[AutoProfile] SQL insert returned no results');
      return false;
    }
  } catch (error) {
    console.error('[AutoProfile] Error in createBusinessProfileWithSQL:', error);
    return false;
  }
}