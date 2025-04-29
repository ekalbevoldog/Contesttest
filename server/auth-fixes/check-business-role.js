/**
 * Script to verify business role handling
 */
import { supabase } from '../supabase.js';

async function checkBusinessRoles() {
  console.log("=== Checking all users with business role ===");
  
  // Step 1: Check users table for business role
  console.log("\n- Checking users table for business role:");
  const { data: dbUsers, error: dbError } = await supabase
    .from('users')
    .select('id, email, role, auth_id')
    .eq('role', 'business');
    
  if (dbError) {
    console.error("Error querying users table:", dbError);
    return;
  }
  
  console.log(`Found ${dbUsers?.length || 0} business users in users table:`);
  dbUsers?.forEach(user => {
    console.log(`  User ID: ${user.id}, Email: ${user.email}, Role: ${user.role}, Auth ID: ${user.auth_id}`);
  });

  // Step 2: Check for business profiles
  console.log("\n- Checking business_profiles table:");
  const { data: profiles, error: profileError } = await supabase
    .from('business_profiles')
    .select('*');
    
  if (profileError) {
    console.error("Error querying business_profiles table:", profileError);
    return;
  }
  
  console.log(`Found ${profiles?.length || 0} business profiles:`);
  profiles?.forEach(profile => {
    console.log(`  Profile ID: ${profile.id}, User ID: ${profile.user_id}`);
  });
  
  // Step 3: Check users missing profiles
  console.log("\n- Checking for business users missing profiles:");
  let missingProfiles = 0;
  
  for (const user of dbUsers || []) {
    const hasProfile = profiles?.some(p => p.user_id === user.id);
    if (!hasProfile) {
      console.log(`  User ID: ${user.id}, Email: ${user.email} has no business profile`);
      missingProfiles++;
    }
  }
  
  console.log(`Found ${missingProfiles} business users with missing profiles`);
  
  // Step 4: Check Supabase Auth users with business role in metadata
  console.log("\n- Attempting to fix missing profiles for business users...");
  
  for (const user of dbUsers || []) {
    if (!profiles?.some(p => p.user_id === user.id)) {
      try {
        console.log(`  Creating business profile for user ${user.id}...`);
        const { data, error } = await supabase
          .from('business_profiles')
          .insert({
            user_id: user.id,
            company_name: 'My Business', 
            company_type: 'service',
            email: user.email,
            created_at: new Date()
          })
          .select()
          .single();
          
        if (error) {
          console.error(`  Error creating profile: ${error.message}`);
        } else {
          console.log(`  Successfully created profile: ${data.id}`);
        }
      } catch (err) {
        console.error(`  Unexpected error: ${err.message}`);
      }
    }
  }
}

// Run the check
checkBusinessRoles().catch(console.error);