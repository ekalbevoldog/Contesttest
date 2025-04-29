import { supabase } from "../supabase";
import { ensureBusinessProfile } from "./auto-create-business-profile";

/**
 * Test script to verify user type determination
 * 
 * This script:
 * 1. Queries users to find business users
 * 2. Tests various ways of accessing the role
 * 3. Formats user objects with userType property
 * 4. Verifies auto-create-business-profile functionality
 */
async function testUserTypeDetermination() {
  try {
    console.log('=== User Type Determination Test ===');
    
    // Get a business user from the database
    console.log('Fetching business users...');
    const { data: businessUsers, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'business')
      .limit(5);
      
    if (userError) {
      console.error('Error fetching users:', userError);
      return;
    }
    
    console.log(`Found ${businessUsers.length} business users`);
    
    if (businessUsers.length === 0) {
      console.log('No business users found to test with');
      return;
    }
    
    // Test role access for each business user
    for (const user of businessUsers) {
      console.log(`\nTesting user: ${user.id} (${user.email})`);
      console.log('Role from users table:', user.role);
      
      // Add userType property consistent with API responses
      const userWithType = {
        ...user,
        userType: user.role
      };
      
      console.log('Added userType property:', userWithType.userType);
      
      // Simulate client-side detection with various fallbacks
      const clientSideRole = userWithType.userType || userWithType.role || 'unknown';
      console.log('Client-side detected role:', clientSideRole);
      
      // Test business profile association
      console.log('\nTesting business profile...');
      await ensureBusinessProfile(user.id.toString(), user.role);
      
      // Query to see if business profile exists
      const { data: businessProfile, error: profileError } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (profileError) {
        console.error('Error checking business profile:', profileError);
        console.log('No business profile found!');
      } else {
        console.log('Business profile found:', businessProfile.id);
      }
    }
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Run the test
testUserTypeDetermination().then(() => {
  console.log('\nTest completed');
}).catch(err => {
  console.error('Unhandled error:', err);
});