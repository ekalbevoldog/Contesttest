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
    console.log(`[AutoProfile] Checking if business profile exists for user ${userId}`);
    
    // Check if profile exists with the Supabase API - double check ID format first
    if (!isValidUUID(userId)) {
      console.error(`[AutoProfile] CRITICAL ERROR: User ID is not a valid UUID: ${userId}`);
      // Try to proceed anyway, but log the warning
    }
    
    // Check for existing profile with retries
    let retryCount = 0;
    const maxRetries = 2;
    let existingProfile = null;
    let profileError = null;
    
    while (retryCount <= maxRetries) {
      try {
        const result = await supabase
          .from('business_profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
          
        existingProfile = result.data;
        profileError = result.error;
        
        if (!profileError || existingProfile) {
          break; // Success or found profile
        }
        
        // If we got an error that's not just "not found", log and retry
        if (profileError && profileError.code !== 'PGRST116') {
          console.warn(`[AutoProfile] Error checking profile (attempt ${retryCount+1}): ${profileError.message}`);
          await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms before retry
          retryCount++;
        } else {
          break; // It's just a "not found" error, which is expected
        }
      } catch (err) {
        console.error(`[AutoProfile] Exception during profile check (attempt ${retryCount+1}):`, err);
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms before retry
        retryCount++;
      }
    }
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.error(`[AutoProfile] Error checking business profile with API after ${retryCount} retries: ${profileError.message}`);
    } else if (existingProfile) {
      console.log(`[AutoProfile] Business profile already exists:`, existingProfile);
      return true;
    }
    
    // If no profile found, create one
    console.log(`[AutoProfile] Creating default business profile for user ${userId}`);
    
    // Get user email from API with retries
    retryCount = 0;
    let userData = null;
    let userError = null;
    
    while (retryCount <= maxRetries) {
      try {
        const result = await supabase
          .from('users')
          .select('email, role')
          .eq('id', userId)
          .maybeSingle();
          
        userData = result.data;
        userError = result.error;
        
        if (!userError || userData) {
          break;
        }
        
        console.warn(`[AutoProfile] Error fetching user data (attempt ${retryCount+1}): ${userError?.message}`);
        await new Promise(resolve => setTimeout(resolve, 500));
        retryCount++;
      } catch (err) {
        console.error(`[AutoProfile] Exception fetching user data (attempt ${retryCount+1}):`, err);
        await new Promise(resolve => setTimeout(resolve, 500));
        retryCount++;
      }
    }
    
    // Verify user is actually a business user type before proceeding
    if (userData?.role !== 'business') {
      console.error(`[AutoProfile] User ${userId} has role ${userData?.role}, not 'business'. Skipping profile creation.`);
      return false;
    }
      
    let userEmail = userData?.email || 'unknown@example.com';
    if (userError) {
      console.error(`[AutoProfile] Error fetching user data after ${retryCount} retries: ${userError.message}`);
    }
    
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
    
    // Generate a session ID
    const sessionId = uuidv4();
    
    console.log(`[AutoProfile] Creating business profile record directly with retries...`);
    
    // Setup retry mechanism for profile creation
    let retryCount = 0;
    const maxRetries = 3;
    let success = false;
    
    // Profile data to insert/update - matching our new schema
    const profileData = {
      id: userId,  // This uses the user ID directly
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
            onConflict: 'id',
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
                  .eq('id', userId)
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
            .eq('id', userId)
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
          .eq('id', userId)
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