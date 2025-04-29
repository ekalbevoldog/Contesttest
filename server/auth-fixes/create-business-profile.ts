import { supabase } from "../supabase.js";

/**
 * Creates a placeholder business profile for a user if one doesn't exist
 * 
 * This function should be called when:
 * 1. A new user with role 'business' registers
 * 2. An existing user's role is changed to 'business'
 * 3. During auth repair when a business user is missing a profile
 */
export async function createBusinessProfileIfNeeded(userId: string): Promise<boolean> {
  try {
    console.log(`[Business Profile] Checking if user ${userId} needs a business profile`);
    
    // First, get the user record to make sure it exists and has role 'business'
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, role, auth_id')
      .eq('id', userId)
      .single();
    
    if (userError) {
      console.error(`[Business Profile] Error fetching user: ${userError.message}`);
      return false;
    }
    
    if (userData.role !== 'business') {
      console.log(`[Business Profile] User ${userId} has role ${userData.role}, not creating business profile`);
      return false; // User doesn't have business role
    }
    
    // Check if a business profile already exists
    const { data: existingProfile, error: profileError } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (existingProfile) {
      console.log(`[Business Profile] User ${userId} already has business profile ${existingProfile.id}`);
      return true; // Profile already exists
    }
    
    // Create a placeholder business profile
    console.log(`[Business Profile] Creating placeholder business profile for user ${userId}`);
    
    // Determine required fields from error messages in previous attempts
    const businessData = {
      user_id: userId,
      company_name: `Business ${userData.email.split('@')[0]}`, // Generate a placeholder name
      company_type: 'Other' // Default type
    };
    
    const { data: newProfile, error: createError } = await supabase
      .from('businesses')
      .insert(businessData)
      .select()
      .single();
    
    if (createError) {
      console.error(`[Business Profile] Error creating business profile: ${createError.message}`);
      return false;
    }
    
    console.log(`[Business Profile] Successfully created business profile ${newProfile.id} for user ${userId}`);
    return true;
  } catch (error) {
    console.error(`[Business Profile] Unexpected error: ${error.message}`);
    return false;
  }
}

/**
 * Fix all business users missing business profiles
 */
export async function fixAllBusinessProfiles(): Promise<void> {
  try {
    console.log('[Business Profile] Fixing all business users missing business profiles');
    
    // Get all users with role 'business'
    const { data: businessUsers, error: userError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('role', 'business');
    
    if (userError) {
      console.error(`[Business Profile] Error fetching business users: ${userError.message}`);
      return;
    }
    
    console.log(`[Business Profile] Found ${businessUsers.length} business users`);
    
    // For each business user, check if they have a profile and create one if needed
    const results = await Promise.all(
      businessUsers.map(async (user) => {
        // Check if profile exists
        const { data: profile, error } = await supabase
          .from('businesses')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (profile) {
          console.log(`[Business Profile] User ${user.id} (${user.email}) already has profile ${profile.id}`);
          return { user, existing: true };
        }
        
        // No profile found, create one
        const created = await createBusinessProfileIfNeeded(user.id);
        return { user, created };
      })
    );
    
    const created = results.filter(r => r.created).length;
    const existing = results.filter(r => r.existing).length;
    
    console.log(`[Business Profile] Results: ${existing} existing profiles, ${created} profiles created`);
  } catch (error) {
    console.error(`[Business Profile] Error fixing business profiles: ${error.message}`);
  }
}