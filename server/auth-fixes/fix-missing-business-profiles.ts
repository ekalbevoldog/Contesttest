import { supabase } from "../supabase";
import { ensureBusinessProfile } from "./auto-create-business-profile";

/**
 * This script identifies all business users who don't have profiles
 * and creates them automatically.
 */
async function fixMissingBusinessProfiles() {
  try {
    console.log('Starting to fix missing business profiles...');
    
    // Get all business users
    const { data: businessUsers, error: userError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('role', 'business');
      
    if (userError || !businessUsers || businessUsers.length === 0) {
      console.error('Error getting business users:', userError?.message || 'No business users found');
      return;
    }
    
    console.log(`Found ${businessUsers.length} business users`);
    
    // Get all existing business profiles
    const { data: existingProfiles, error: profileError } = await supabase.rpc('exec_sql', {
      sql_query: `SELECT user_id FROM business_profiles`
    });
    
    if (profileError) {
      console.error('Error checking existing profiles:', profileError.message);
      return;
    }
    
    // Create a set of user IDs that already have profiles
    const userIdsWithProfiles = new Set<string>();
    if (existingProfiles && existingProfiles.length > 0) {
      existingProfiles.forEach(profile => {
        userIdsWithProfiles.add(profile.user_id);
      });
    }
    
    console.log(`Found ${userIdsWithProfiles.size} existing business profiles`);
    
    // Filter out users who already have profiles
    const usersNeedingProfiles = businessUsers.filter(user => !userIdsWithProfiles.has(user.id));
    
    console.log(`Found ${usersNeedingProfiles.length} business users without profiles`);
    
    // Create profiles for users who need them
    const results = [];
    for (const user of usersNeedingProfiles) {
      console.log(`Creating profile for user ${user.id} (${user.email})`);
      const result = await ensureBusinessProfile(user.id, user.role);
      results.push({ userId: user.id, email: user.email, success: result });
    }
    
    console.log('Results:');
    console.table(results);
    
    // Count successes
    const successCount = results.filter(r => r.success).length;
    console.log(`Successfully created ${successCount} out of ${results.length} profiles`);
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the script
fixMissingBusinessProfiles().then(() => {
  console.log('Fix completed.');
  process.exit(0);
}).catch(err => {
  console.error('Fix failed:', err);
  process.exit(1);
});