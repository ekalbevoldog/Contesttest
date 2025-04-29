import { supabase } from "../supabase";
import { ensureBusinessProfile } from "./auto-create-business-profile";

/**
 * This is a simple test script to verify that the business profile 
 * creation is working properly. Uses API-only approach.
 */
async function testBusinessProfileCreation() {
  try {
    console.log('Running business profile creation test...');
    
    // First, get a user with the business role
    const { data: businessUsers, error: userError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('role', 'business')
      .limit(1);
      
    if (userError || !businessUsers || businessUsers.length === 0) {
      console.error('Error getting business user:', userError?.message || 'No business users found');
      return;
    }
    
    const testUser = businessUsers[0];
    console.log(`Testing with business user: ${testUser.id} (${testUser.email})`);
    
    // Check for existing profile with API
    const { data: existingProfile, error: profileError } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('user_id', testUser.id)
      .maybeSingle();
    
    // If profile exists, delete it for testing
    if (existingProfile) {
      console.log(`User already has business profile:`, existingProfile);
      
      // For testing, let's delete the existing profile
      console.log('Deleting existing profile for testing purposes...');
      
      try {
        // Use API to delete the profile
        const { error: deleteError } = await supabase
          .from('business_profiles')
          .delete()
          .eq('user_id', testUser.id);
        
        if (deleteError) {
          console.error('Error deleting profile with API:', deleteError.message);
          console.log('Skipping test as we could not prepare the test environment');
          return;
        }
        
        console.log('Existing profile deleted successfully');
      } catch (deleteError) {
        console.error('Error during profile deletion:', deleteError);
        return;
      }
    } else {
      console.log('No existing business profile found, will create new one');
    }
    
    // Now try to create a new profile
    console.log('Creating new business profile...');
    const result = await ensureBusinessProfile(testUser.id, testUser.role);
    
    console.log('Profile creation result:', result);
    
    // Verify the profile was created with API
    const { data: newProfile, error: checkError } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('user_id', testUser.id)
      .maybeSingle();
    
    if (checkError) {
      console.error('Error checking for new profile with API:', checkError.message);
      console.error('Failed to create business profile - could not verify creation');
      return;
    }
    
    if (newProfile) {
      console.log('Success! New business profile created:');
      console.log(JSON.stringify(newProfile, null, 2));
    } else {
      console.error('Failed to create business profile - no profile found after creation attempt');
    }
    
  } catch (error) {
    console.error('Unexpected error in test:', error);
  }
}

// Run the test
testBusinessProfileCreation().then(() => {
  console.log('Test completed.');
  process.exit(0);
}).catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});