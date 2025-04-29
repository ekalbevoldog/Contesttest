/**
 * Fix Auth ID Mapping Utility
 * 
 * This utility helps fix auth_id mismatches between Supabase Auth and the users table.
 * It can be run with specific user IDs or in batch mode for all users.
 */

import { supabase, supabaseAdmin } from './supabase.js';

// Parse command line arguments
const args = process.argv.slice(2);
const userId = args.find(arg => arg.startsWith('--user-id='))?.split('=')[1];
const authId = args.find(arg => arg.startsWith('--auth-id='))?.split('=')[1];
const email = args.find(arg => arg.startsWith('--email='))?.split('=')[1];
const fixAll = args.includes('--fix-all');
const dryRun = args.includes('--dry-run');

/**
 * Fix auth_id mapping for a specific user
 */
async function fixUserAuthMapping(
  userId: string | number, 
  authId?: string, 
  userEmail?: string
): Promise<boolean> {
  try {
    console.log(`[Fix] Fixing auth mapping for user ${userId}...`);
    
    // Fetch the user from the database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, auth_id, email, role')
      .eq('id', userId)
      .single();
      
    if (userError) {
      console.error(`[Fix] Error fetching user ${userId}:`, userError);
      return false;
    }
    
    if (!user) {
      console.error(`[Fix] User ${userId} not found`);
      return false;
    }
    
    if (user.auth_id) {
      console.log(`[Fix] User ${userId} already has auth_id ${user.auth_id}`);
      
      // If an auth_id was specified and it doesn't match, we need to update
      if (authId && user.auth_id !== authId) {
        console.log(`[Fix] User ${userId} has auth_id ${user.auth_id} but should be ${authId}`);
        
        if (dryRun) {
          console.log(`[Fix] DRY RUN: Would update user ${userId} auth_id to ${authId}`);
          return true;
        }
        
        // Update the auth_id
        const { error: updateError } = await supabase
          .from('users')
          .update({ auth_id: authId })
          .eq('id', userId);
          
        if (updateError) {
          console.error(`[Fix] Error updating user ${userId}:`, updateError);
          return false;
        }
        
        console.log(`[Fix] ✅ Updated user ${userId} auth_id to ${authId}`);
        return true;
      }
      
      return true;
    }
    
    // User has no auth_id, we need to find or create one
    const email = userEmail || user.email;
    if (!email) {
      console.error(`[Fix] User ${userId} has no email and no email provided`);
      return false;
    }
    
    // If an auth_id was specifically provided, use it
    if (authId) {
      console.log(`[Fix] Using provided auth_id ${authId} for user ${userId}`);
      
      // Verify the auth_id exists
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(authId);
      
      if (authError || !authUser?.user) {
        console.error(`[Fix] Auth user ${authId} not found:`, authError);
        return false;
      }
      
      if (dryRun) {
        console.log(`[Fix] DRY RUN: Would update user ${userId} auth_id to ${authId}`);
        return true;
      }
      
      // Update the user with the provided auth_id
      const { error: updateError } = await supabase
        .from('users')
        .update({ auth_id: authId })
        .eq('id', userId);
        
      if (updateError) {
        console.error(`[Fix] Error updating user ${userId}:`, updateError);
        return false;
      }
      
      console.log(`[Fix] ✅ Updated user ${userId} auth_id to ${authId}`);
      return true;
    }
    
    // Try to find an auth user with matching email
    console.log(`[Fix] Looking for auth user with email ${email}...`);
    const { data: authData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('[Fix] Error listing auth users:', listError);
      return false;
    }
    
    const matchingAuthUser = authData.users.find(au => 
      au.email && au.email.toLowerCase() === email.toLowerCase()
    );
    
    if (!matchingAuthUser) {
      console.log(`[Fix] No auth user found with email ${email}`);
      
      console.log(`[Fix] Creating new auth user for ${email}...`);
      
      if (dryRun) {
        console.log(`[Fix] DRY RUN: Would create new auth user for ${email}`);
        return true;
      }
      
      // Create a new auth user with a random password
      const password = Math.random().toString(36).slice(2) + Math.random().toString(36).toUpperCase().slice(2);
      
      const { data: newAuthUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          role: user.role || 'athlete',
          source: 'fix-auth-mapping'
        }
      });
      
      if (createError) {
        console.error(`[Fix] Error creating auth user:`, createError);
        return false;
      }
      
      if (!newAuthUser?.user) {
        console.error('[Fix] Created auth user, but no user data returned');
        return false;
      }
      
      // Update the user with the new auth_id
      const { error: updateError } = await supabase
        .from('users')
        .update({ auth_id: newAuthUser.user.id })
        .eq('id', userId);
        
      if (updateError) {
        console.error(`[Fix] Error updating user ${userId}:`, updateError);
        return false;
      }
      
      console.log(`[Fix] ✅ Created auth user ${newAuthUser.user.id} for ${email} and linked to user ${userId}`);
      return true;
    }
    
    console.log(`[Fix] Found matching auth user ${matchingAuthUser.id} for email ${email}`);
    
    if (dryRun) {
      console.log(`[Fix] DRY RUN: Would update user ${userId} auth_id to ${matchingAuthUser.id}`);
      return true;
    }
    
    // Update the user with the found auth_id
    const { error: updateError } = await supabase
      .from('users')
      .update({ auth_id: matchingAuthUser.id })
      .eq('id', userId);
      
    if (updateError) {
      console.error(`[Fix] Error updating user ${userId}:`, updateError);
      return false;
    }
    
    console.log(`[Fix] ✅ Updated user ${userId} auth_id to ${matchingAuthUser.id}`);
    return true;
  } catch (error) {
    console.error('[Fix] Unhandled error:', error);
    return false;
  }
}

/**
 * Fix auth_id mappings for all users
 */
async function fixAllUsersAuthMapping(): Promise<{ total: number, fixed: number, failed: number }> {
  try {
    console.log('[Fix] Fixing auth mappings for all users...');
    
    // Get all users without auth_id
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, auth_id, email, role')
      .is('auth_id', null);
      
    if (userError) {
      console.error('[Fix] Error fetching users:', userError);
      return { total: 0, fixed: 0, failed: 0 };
    }
    
    if (!users || users.length === 0) {
      console.log('[Fix] No users found without auth_id');
      return { total: 0, fixed: 0, failed: 0 };
    }
    
    console.log(`[Fix] Found ${users.length} users without auth_id`);
    
    let fixed = 0;
    let failed = 0;
    
    for (const user of users) {
      const success = await fixUserAuthMapping(user.id);
      if (success) {
        fixed++;
      } else {
        failed++;
      }
    }
    
    console.log(`[Fix] Fixed ${fixed}/${users.length} users, failed ${failed}`);
    return { total: users.length, fixed, failed };
  } catch (error) {
    console.error('[Fix] Unhandled error:', error);
    return { total: 0, fixed: 0, failed: 0 };
  }
}

// Main execution
async function main() {
  try {
    if (dryRun) {
      console.log('[Fix] Running in DRY RUN mode - no changes will be made');
    }
    
    if (fixAll) {
      console.log('[Fix] Fixing all user auth mappings...');
      const result = await fixAllUsersAuthMapping();
      console.log(`[Fix] Fixed ${result.fixed}/${result.total} users, failed ${result.failed}`);
    } else if (userId) {
      console.log(`[Fix] Fixing auth mapping for user ${userId}...`);
      const success = await fixUserAuthMapping(userId, authId, email);
      if (success) {
        console.log(`[Fix] ✅ Successfully fixed auth mapping for user ${userId}`);
      } else {
        console.log(`[Fix] ❌ Failed to fix auth mapping for user ${userId}`);
        process.exit(1);
      }
    } else {
      console.log(`[Fix] No user ID or --fix-all flag provided`);
      console.log(`[Fix] Usage: 
  npx tsx server/fix-auth-mapping.ts --user-id=<id> [--auth-id=<id>] [--email=<email>] [--dry-run]
  npx tsx server/fix-auth-mapping.ts --fix-all [--dry-run]`);
      process.exit(1);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('[Fix] Unhandled error:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (process.argv[1].endsWith('fix-auth-mapping.ts')) {
  main();
}

export { fixUserAuthMapping, fixAllUsersAuthMapping };