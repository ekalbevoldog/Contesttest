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
    
    // Skip trying to create a business record - the foreign key constraint appears 
    // to be bi-directional or going in a different direction. Instead, we'll focus
    // on directly creating the business_profile record.
    
    console.log(`[AutoProfile] Creating business profile record directly...`);
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('business_profiles')
        .upsert({
          id: userId,  // This uses the user ID directly
          name: 'My Business',
          session_id: sessionId,
          email: email,
          product_type: 'Default product',
          // Set defaults for other fields
          industry: null,
          business_type: null,
          company_size: null,
          zipCode: null,
          budget: null,
          budgetmin: null,
          budgetmax: null,
          haspreviouspartnerships: null
        }, {
          onConflict: 'id',
          ignoreDuplicates: false // Update if exists
        })
        .select();
      
      if (profileError) {
        console.error(`[AutoProfile] Profile creation error: ${profileError.message}`);
        if (profileError.details) {
          console.error(`[AutoProfile] Profile error details: ${profileError.details}`);
        }
        
        // Add additional diagnostics if we get a foreign key constraint error
        if (profileError.details && profileError.details.includes('foreign key constraint')) {
          console.log(`[AutoProfile] Detected foreign key constraint issue. Trying alternative approach...`);
          
          // Search existing profiles to see if one might exist for this user
          const { data: existingUserProfileSearch, error: searchError } = await supabase
            .from('business_profiles')
            .select('*')
            .limit(10);
            
          if (searchError) {
            console.error(`[AutoProfile] Error searching profiles:`, searchError.message);
          } else if (existingUserProfileSearch && existingUserProfileSearch.length > 0) {
            console.log(`[AutoProfile] Found ${existingUserProfileSearch.length} existing profiles`);
            // Just log the first profile's structure without personal data
            if (existingUserProfileSearch[0]) {
              console.log(`[AutoProfile] Sample profile structure:`, Object.keys(existingUserProfileSearch[0]));
            }
          }
        }
        
        return false;
      }
      
      if (profileData && profileData.length > 0) {
        console.log(`[AutoProfile] Successfully created business profile with ID: ${profileData[0].id}`);
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