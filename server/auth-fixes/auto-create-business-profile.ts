import { supabase } from "../supabase";
import { v4 as uuidv4 } from 'uuid';

/**
 * Helper function to ensure a business user has a corresponding business profile
 * This is called during login, registration, and on profile page access
 */
export async function ensureBusinessProfile(userId: string, role: string): Promise<boolean> {
  // Validate input parameters
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    console.error(`[AutoProfile] CRITICAL ERROR: Invalid user ID provided: "${userId}"`);
    return false;
  }
  
  if (role !== 'business') {
    console.log(`[AutoProfile] Not a business user (role: ${role}), skipping profile creation`);
    return false;
  }
  
  try {
    console.log(`[AutoProfile] Checking if business profile exists for user with auth_id ${userId}`);
    
    // First, let's find the user by auth_id in the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('auth_id', userId)
      .maybeSingle();
      
    if (userError) {
      console.error(`[AutoProfile] Error finding user by auth_id: ${userError.message}`);
      return false;
    }
    
    if (!userData) {
      console.error(`[AutoProfile] No user found with auth_id: ${userId}`);
      return false;
    }
    
    console.log(`[AutoProfile] Found user with ID: ${userData.id} and email: ${userData.email}`);
    
    // Now check if this user already has a business profile
    const { data: existingProfile, error: profileError } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('user_id', userData.id)
      .maybeSingle();
      
    if (profileError && profileError.code !== 'PGRST116') {
      console.error(`[AutoProfile] Error checking business profile: ${profileError.message}`);
    } else if (existingProfile) {
      console.log(`[AutoProfile] Business profile already exists with ID: ${existingProfile.id}`);
      return true;
    }
    
    // If no profile found, create one
    console.log(`[AutoProfile] Creating default business profile for user ${userData.id}`);
    
    // We already have the user data from the previous query
    if (userData.role !== 'business') {
      console.error(`[AutoProfile] User ${userData.id} has role ${userData.role}, not 'business'. Skipping profile creation.`);
      return false;
    }
    
    const userEmail = userData.email || 'unknown@example.com';
    
    // Create profile using the API with defensive checks
    return await createBusinessProfile(userId, userEmail);
    
  } catch (error) {
    console.error('[AutoProfile] Unexpected error in ensureBusinessProfile:', error);
    return false;
  }
}

/**
 * Create a business profile using the Supabase API with multiple attempts
 * to handle potential schema mismatches between what the API expects and the database
 */
async function createBusinessProfile(userId: string, email: string): Promise<boolean> {
  if (!userId || !email) {
    console.error(`[AutoProfile] CRITICAL ERROR: Missing required parameters for profile creation: userId=${userId}, email=${email}`);
    return false;
  }

  try {
    console.log(`[AutoProfile] Attempting profile creation for user ${userId}`);
    
    // Verify the userId is a valid UUID
    if (!isValidUUID(userId)) {
      console.error(`[AutoProfile] Invalid UUID format for user_id: ${userId}`);
      // Despite the error, we'll try anyway with retries - sometimes non-standard IDs work
    }
    
    // First, check if the user exists in the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', email)
      .maybeSingle();

    if (userError) {
      console.error(`[AutoProfile] Error checking user in users table: ${userError.message}`);
    }
    
    // Get the user_id (numeric) from the users table
    let user_id = userData?.id;
    if (!user_id) {
      console.error(`[AutoProfile] Could not find user with email ${email} in users table`);
      
      // Attempt to fetch by auth_id
      const { data: userByAuthId, error: authIdError } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('auth_id', userId)
        .maybeSingle();
        
      if (authIdError) {
        console.error(`[AutoProfile] Error checking user by auth_id: ${authIdError.message}`);
      } else if (userByAuthId?.id) {
        user_id = userByAuthId.id;
        console.log(`[AutoProfile] Found user_id ${user_id} using auth_id lookup`);
      } else {
        console.error(`[AutoProfile] Critical: User not found in users table by email or auth_id`);
        // Create a fallback user record (this should rarely happen)
        const { data: newUser, error: newUserError } = await supabase
          .from('users')
          .insert({
            email: email,
            role: 'business',
            auth_id: userId,
            created_at: new Date()
          })
          .select()
          .single();
          
        if (newUserError) {
          console.error(`[AutoProfile] Failed to create fallback user: ${newUserError.message}`);
          return false;
        }
        user_id = newUser.id;
        console.log(`[AutoProfile] Created fallback user with ID ${user_id}`);
      }
    }
    
    // Generate a session ID
    const sessionId = uuidv4();
    
    console.log(`[AutoProfile] Creating business profile record for user_id ${user_id}...`);
    
    // Setup retry mechanism for profile creation
    let retryCount = 0;
    const maxRetries = 3;
    let success = false;
    
    // Profile data to insert/update - matching our new schema
    const profileData = {
      user_id: user_id,  // Use the numeric user ID from the users table
      name: email.split('@')[0], // Use part of email as default name
      session_id: sessionId,
      business_type: 'product', // Default to product business
      industry: null,
      access_restriction: 'unrestricted',
      goal_identification: ['Brand Awareness'],
      has_past_partnership: false,
      budget_min: 500,
      budget_max: 5000,
      zip_code: null,
      operating_location: [],
      contact_name: null,
      contact_title: null,
      contact_email: email,
      contact_phone: null,
      business_size: 'small_team',
      // Dashboard fields
      product_type: 'Default product',
      audience_goals: 'Increase brand visibility',
      values: 'Quality, Innovation, Customer Satisfaction',
      target_schools_sports: 'All',
    };
    
    // Log the exact data being sent to the API for debugging
    console.log(`[AutoProfile] Profile data to be inserted:`, JSON.stringify(profileData, null, 2));
    
    while (retryCount <= maxRetries && !success) {
      try {
        // Try the operation with exponential backoff between retries
        const { data: resultData, error: profileError } = await supabase
          .from('business_profiles')
          .upsert(profileData, {
            onConflict: 'user_id',
            ignoreDuplicates: false // Update if exists
          })
          .select();
        
        if (profileError) {
          console.error(`[AutoProfile] Profile creation error (attempt ${retryCount+1}): ${profileError.message}`);
          
          if (profileError.details) {
            console.error(`[AutoProfile] Profile error details: ${profileError.details}`);
          
            // Additional diagnostics for foreign key constraint errors
            if (profileError.details.includes('foreign key constraint')) {
              console.log(`[AutoProfile] Detected foreign key constraint issue. Checking database structure...`);
              
              try {
                // Query existing profiles to understand schema
                const { data: existingUserProfileSearch, error: searchError } = await supabase
                  .from('business_profiles')
                  .select('*')
                  .limit(5);
                  
                if (searchError) {
                  console.error(`[AutoProfile] Error querying profile structure:`, searchError.message);
                } else if (existingUserProfileSearch && existingUserProfileSearch.length > 0) {
                  console.log(`[AutoProfile] Found ${existingUserProfileSearch.length} existing profiles to analyze`);
                  // Log structure of first profile to help debug schema issues
                  if (existingUserProfileSearch[0]) {
                    console.log(`[AutoProfile] Sample profile structure:`, Object.keys(existingUserProfileSearch[0]));
                    
                    // Try to detect if ID column has a different name or type
                    if (!Object.keys(existingUserProfileSearch[0]).includes('id')) {
                      console.error(`[AutoProfile] CRITICAL: 'id' column may not exist in business_profiles!`);
                    }
                    
                    // Check for other required columns
                    if (!Object.keys(existingUserProfileSearch[0]).includes('email')) {
                      console.error(`[AutoProfile] CRITICAL: 'email' column may not exist in business_profiles!`);
                    }
                  }
                } else {
                  console.log(`[AutoProfile] No existing profiles found for analysis.`);
                }
              } catch (diagError) {
                console.error(`[AutoProfile] Error during diagnostic queries:`, diagError);
              }
              
              // Despite the error, maybe check if profile already exists anyway
              try {
                const { data: existingProfileCheck } = await supabase
                  .from('business_profiles')
                  .select('id')
                  .eq('user_id', user_id)
                  .maybeSingle();
                  
                if (existingProfileCheck) {
                  console.log(`[AutoProfile] Profile appears to exist despite upsert error!`);
                  return true; // Profile exists, consider this a success
                }
              } catch (checkError) {
                console.error(`[AutoProfile] Error checking if profile exists:`, checkError);
              }
            }
          }
          
          // Wait before retry with exponential backoff
          const waitTime = Math.min(1000 * Math.pow(2, retryCount), 8000);
          console.log(`[AutoProfile] Retrying in ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          retryCount++;
          
        } else if (resultData && resultData.length > 0) {
          console.log(`[AutoProfile] Successfully created/updated business profile with ID: ${resultData[0].id}`);
          success = true;
          return true;
        } else {
          console.warn(`[AutoProfile] No data returned from profile creation, but no error either. Checking if profile exists...`);
          
          // Double-check if profile exists despite no confirmation
          const { data: existingCheck } = await supabase
            .from('business_profiles')
            .select('id')
            .eq('user_id', user_id)
            .maybeSingle();
            
          if (existingCheck) {
            console.log(`[AutoProfile] Profile exists after operation, considering successful`);
            success = true;
            return true;
          } else {
            console.error(`[AutoProfile] Cannot confirm profile creation success`);
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000));
            retryCount++;
          }
        }
      } catch (err) {
        console.error(`[AutoProfile] Exception during profile creation (attempt ${retryCount+1}):`, err);
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
        retryCount++;
      }
    }
    
    if (!success) {
      console.error(`[AutoProfile] CRITICAL: Failed to create profile after ${maxRetries} attempts`);
      // Final fallback check - maybe it exists despite all errors?
      try {
        const { data: lastChanceCheck } = await supabase
          .from('business_profiles')
          .select('id')
          .eq('user_id', user_id)
          .maybeSingle();
          
        if (lastChanceCheck) {
          console.log(`[AutoProfile] Profile found in final verification check, operation ultimately successful`);
          return true;
        }
      } catch (finalError) {
        console.error(`[AutoProfile] Final profile check failed:`, finalError);
      }
    }
    
    return success;
  } catch (error) {
    console.error(`[AutoProfile] Unhandled error in createBusinessProfile:`, error);
    
    // Even in case of total failure, check if profile happens to exist
    try {
      const { data: existingProfile } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
        
      if (existingProfile) {
        console.log(`[AutoProfile] Despite errors, profile exists! Returning success.`);
        return true;
      }
    } catch (e) {
      // Ignore error in error handler
    }
    
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