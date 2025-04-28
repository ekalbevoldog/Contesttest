
// Utility script to fix user ID mismatches between auth system and profiles

import { supabase, supabaseAdmin } from './supabase.js';

async function fixUserIdMismatches() {
  console.log('Starting user ID mismatch fix script...');
  
  try {
    // 1. Get all users with auth_id
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, auth_id')
      .not('auth_id', 'is', null);
      
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }
    
    console.log(`Found ${users.length} users with auth_id to check`);
    
    // 2. Get all business profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('business_profiles')
      .select('id, user_id, email');
      
    if (profilesError) {
      console.error('Error fetching business profiles:', profilesError);
      return;
    }
    
    console.log(`Found ${profiles.length} business profiles to check`);
    
    // 3. Check for mismatches and fix them
    let fixCount = 0;
    
    for (const user of users) {
      // Find business profiles that might be for this user but have wrong user_id
      const matchingProfiles = profiles.filter(p => 
        // If profile has this auth_id directly (shouldn't happen but checking)
        p.user_id === user.auth_id ||
        // If profile has same email but different user_id
        (p.email === user.email && p.user_id !== user.id)
      );
      
      if (matchingProfiles.length > 0) {
        console.log(`Found ${matchingProfiles.length} profiles to fix for user ${user.email}`);
        
        for (const profile of matchingProfiles) {
          console.log(`Fixing profile ID ${profile.id}: changing user_id from ${profile.user_id} to ${user.id}`);
          
          // Update the profile with the correct user_id
          const { error: updateError } = await supabaseAdmin
            .from('business_profiles')
            .update({ user_id: user.id })
            .eq('id', profile.id);
            
          if (updateError) {
            console.error(`Error updating profile ${profile.id}:`, updateError);
          } else {
            fixCount++;
            console.log(`Successfully fixed profile ${profile.id}`);
          }
        }
      }
    }
    
    console.log(`Completed fixing ${fixCount} profiles`);
    
  } catch (error) {
    console.error('Error in fix script:', error);
  }
}

// Run the fix function
fixUserIdMismatches()
  .then(() => console.log('Script completed'))
  .catch(err => console.error('Script failed:', err));
