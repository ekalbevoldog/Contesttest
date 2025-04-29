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
    const { data: existingProfile, error: profileError } = await supabase
      .from('business_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();
      
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
    const { data: newProfile, error: insertError } = await supabase
      .from('business_profiles')
      .insert({
        user_id: userId,
        company_name: 'My Business', // Default name that user should update
        company_type: 'service',     // Required field with valid value
        email: businessUser.email,   // Use user's email as default
        created_at: new Date()
      })
      .select()
      .single();
      
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