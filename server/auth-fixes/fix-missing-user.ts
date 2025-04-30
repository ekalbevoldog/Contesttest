/**
 * Fix Missing User Utility
 * 
 * This utility helps create database user records for existing Auth users.
 * Use this when an Auth user exists but has no corresponding record in the users table.
 */

import { supabase, supabaseAdmin } from '../supabase.js';

// Parse command line arguments
const args = process.argv.slice(2);
const authId = args.find(arg => arg.startsWith('--auth-id='))?.split('=')[1];
const email = args.find(arg => arg.startsWith('--email='))?.split('=')[1];
const dryRun = args.includes('--dry-run');

/**
 * Create a database user record for an existing Auth user
 */
export async function createUserForAuthUser(
  authUserId: string, 
  userEmail?: string
): Promise<boolean> {
  try {
    console.log(`[Fix] Creating database user for auth user ${authUserId}...`);
    
    // First verify the auth user exists
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(authUserId);
    
    if (authError || !authUser?.user) {
      console.error(`[Fix] Auth user ${authUserId} not found:`, authError);
      return false;
    }
    
    // Use the provided email or the one from the auth user
    const email = userEmail || authUser.user.email;
    if (!email) {
      console.error(`[Fix] Auth user ${authUserId} has no email and none was provided`);
      return false;
    }
    
    console.log(`[Fix] Using email ${email} for user creation`);
    
    // Check if a user with this auth_id already exists
    const { data: existingAuthUser, error: checkAuthError } = await supabase
      .from('users')
      .select('id, email')
      .eq('auth_id', authUserId)
      .single();
      
    if (!checkAuthError && existingAuthUser) {
      console.log(`[Fix] User already exists with auth_id ${authUserId}: ID ${existingAuthUser.id}`);
      return true;
    }
    
    // Check if a user with this email already exists
    const { data: existingEmailUser, error: checkEmailError } = await supabase
      .from('users')
      .select('id, auth_id')
      .eq('email', email)
      .single();
      
    if (!checkEmailError && existingEmailUser) {
      console.log(`[Fix] User already exists with email ${email}: ID ${existingEmailUser.id}`);
      
      // If the user has no auth_id, update it
      if (!existingEmailUser.auth_id) {
        console.log(`[Fix] User ${existingEmailUser.id} has no auth_id, updating to ${authUserId}`);
        
        if (dryRun) {
          console.log(`[Fix] DRY RUN: Would update user ${existingEmailUser.id} with auth_id ${authUserId}`);
          return true;
        }
        
        const { error: updateError } = await supabase
          .from('users')
          .update({ auth_id: authUserId })
          .eq('id', existingEmailUser.id);
          
        if (updateError) {
          console.error(`[Fix] Error updating user ${existingEmailUser.id}:`, updateError);
          return false;
        }
        
        console.log(`[Fix] ✅ Updated user ${existingEmailUser.id} with auth_id ${authUserId}`);
        return true;
      }
      
      // If the user has a different auth_id, report the conflict
      if (existingEmailUser.auth_id !== authUserId) {
        console.error(`[Fix] User with email ${email} has different auth_id: ${existingEmailUser.auth_id} (expected ${authUserId})`);
        return false;
      }
      
      return true;
    }
    
    // Get role from user metadata
    const role = authUser.user.user_metadata?.role || 'athlete';
    
    // Prepare data for user creation - username field removed as it doesn't exist in Supabase
    const userData = {
      auth_id: authUserId,
      email: email,
      // username removed - not in Supabase schema
      role: role,
      created_at: new Date(authUser.user.created_at || Date.now())
    };
    
    console.log(`[Fix] Creating new user record with data:`, userData);
    
    if (dryRun) {
      console.log(`[Fix] DRY RUN: Would create new user with data:`, userData);
      return true;
    }
    
    // Create the user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();
      
    if (insertError) {
      console.error(`[Fix] Error creating user:`, insertError);
      
      // Check for specific error conditions
      if (insertError.code === '23505') {
        // Unique constraint violation - likely duplicate email
        console.error(`[Fix] Email already exists, try with a different email`);
      }
      
      return false;
    }
    
    console.log(`[Fix] ✅ Created user ${newUser.id} for auth user ${authUserId}`);
    return true;
  } catch (error) {
    console.error('[Fix] Unhandled error:', error);
    return false;
  }
}

// Main execution
async function main() {
  try {
    if (dryRun) {
      console.log('[Fix] Running in DRY RUN mode - no changes will be made');
    }
    
    if (!authId && !email) {
      console.log(`[Fix] No auth ID or email provided`);
      console.log(`[Fix] Usage: 
  npx tsx server/auth-fixes/fix-missing-user.ts --auth-id=<id> [--email=<email>] [--dry-run]
  npx tsx server/auth-fixes/fix-missing-user.ts --email=<email> [--dry-run]`);
      process.exit(1);
    }
    
    if (authId) {
      console.log(`[Fix] Creating user for auth ID ${authId}...`);
      const success = await createUserForAuthUser(authId, email);
      if (success) {
        console.log(`[Fix] ✅ Successfully created/fixed user for auth ID ${authId}`);
      } else {
        console.log(`[Fix] ❌ Failed to create/fix user for auth ID ${authId}`);
        process.exit(1);
      }
    } else if (email) {
      console.log(`[Fix] Looking for auth user with email ${email}...`);
      
      // Find auth user by email
      const { data: authData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (listError) {
        console.error('[Fix] Error listing auth users:', listError);
        process.exit(1);
      }
      
      const matchingAuthUser = authData.users.find(user => 
        user.email && user.email.toLowerCase() === email.toLowerCase()
      );
      
      if (!matchingAuthUser) {
        console.error(`[Fix] No auth user found with email ${email}`);
        process.exit(1);
      }
      
      console.log(`[Fix] Found auth user ${matchingAuthUser.id} with email ${email}`);
      const success = await createUserForAuthUser(matchingAuthUser.id, email);
      
      if (success) {
        console.log(`[Fix] ✅ Successfully created/fixed user for auth user ${matchingAuthUser.id}`);
      } else {
        console.log(`[Fix] ❌ Failed to create/fix user for auth user ${matchingAuthUser.id}`);
        process.exit(1);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('[Fix] Unhandled error:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (process.argv[1].endsWith('fix-missing-user.ts')) {
  main();
}

export { createUserForAuthUser };