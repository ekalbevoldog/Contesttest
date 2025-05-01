/**
 * Fix Email Mismatch Utility
 * 
 * This utility helps fix email mismatches between Auth users and database users.
 * Use this when the email in the Auth system doesn't match the email in the users table.
 */

import { supabase, supabaseAdmin } from '../supabase.js';

// Parse command line arguments
const args = process.argv.slice(2);
const userId = args.find(arg => arg.startsWith('--user-id='))?.split('=')[1];
const correctEmail = args.find(arg => arg.startsWith('--correct-email='))?.split('=')[1];
const authId = args.find(arg => arg.startsWith('--auth-id='))?.split('=')[1];
const dryRun = args.includes('--dry-run');

/**
 * Fix email mismatch for a user
 */
export async function fixEmailMismatch(
  userId: string | number,
  correctEmail?: string,
  authUserId?: string
): Promise<boolean> {
  try {
    console.log(`[Fix] Fixing email mismatch for user ${userId}...`);
    
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
    
    // If auth_id is provided, use it to verify or update the user
    if (authUserId) {
      if (user.auth_id && user.auth_id !== authUserId) {
        console.log(`[Fix] User ${userId} has auth_id ${user.auth_id} but should be ${authUserId}`);
        
        // Check if the auth user exists
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(authUserId);
        
        if (authError || !authUser?.user) {
          console.error(`[Fix] Auth user ${authUserId} not found:`, authError);
          return false;
        }
        
        if (dryRun) {
          console.log(`[Fix] DRY RUN: Would update user ${userId} auth_id to ${authUserId}`);
        } else {
          // Update the auth_id
          const { error: updateError } = await supabase
            .from('users')
            .update({ auth_id: authUserId })
            .eq('id', userId);
            
          if (updateError) {
            console.error(`[Fix] Error updating auth_id for user ${userId}:`, updateError);
            return false;
          }
          
          console.log(`[Fix] ✅ Updated user ${userId} auth_id to ${authUserId}`);
        }
      }
      
      // Use auth user to get correct email if not provided
      if (!correctEmail) {
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(authUserId);
        
        if (authError || !authUser?.user) {
          console.error(`[Fix] Auth user ${authUserId} not found:`, authError);
          return false;
        }
        
        if (!authUser.user.email) {
          console.error(`[Fix] Auth user ${authUserId} has no email`);
          return false;
        }
        
        correctEmail = authUser.user.email;
        console.log(`[Fix] Using email ${correctEmail} from auth user ${authUserId}`);
      }
    } else if (!correctEmail) {
      // If neither auth_id nor correctEmail is provided, we need to get the email from the auth user
      if (!user.auth_id) {
        console.error(`[Fix] User ${userId} has no auth_id and no correct email was provided`);
        return false;
      }
      
      // Get the email from the auth user
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(user.auth_id);
      
      if (authError || !authUser?.user) {
        console.error(`[Fix] Auth user ${user.auth_id} not found:`, authError);
        return false;
      }
      
      if (!authUser.user.email) {
        console.error(`[Fix] Auth user ${user.auth_id} has no email`);
        return false;
      }
      
      correctEmail = authUser.user.email;
      console.log(`[Fix] Using email ${correctEmail} from auth user ${user.auth_id}`);
    }
    
    // Now we should have the correct email
    if (!correctEmail) {
      console.error(`[Fix] Could not determine correct email`);
      return false;
    }
    
    // Check if the email already matches
    if (user.email === correctEmail) {
      console.log(`[Fix] User ${userId} already has the correct email ${correctEmail}`);
      return true;
    }
    
    console.log(`[Fix] Updating email for user ${userId} from ${user.email} to ${correctEmail}`);
    
    if (dryRun) {
      console.log(`[Fix] DRY RUN: Would update user ${userId} email to ${correctEmail}`);
      return true;
    }
    
    // Update the email
    const { error: updateError } = await supabase
      .from('users')
      .update({ email: correctEmail })
      .eq('id', userId);
      
    if (updateError) {
      console.error(`[Fix] Error updating email for user ${userId}:`, updateError);
      
      // Check for specific error conditions
      if (updateError.code === '23505') {
        console.error(`[Fix] Email ${correctEmail} is already in use by another user`);
        
        // Try to find the other user
        const { data: conflictUser, error: conflictError } = await supabase
          .from('users')
          .select('id, auth_id, email')
          .eq('email', correctEmail)
          .neq('id', userId)
          .single();
          
        if (!conflictError && conflictUser) {
          console.error(`[Fix] User ${conflictUser.id} already has email ${correctEmail}`);
          console.log(`[Fix] Consider merging the users or providing a different email`);
        }
      }
      
      return false;
    }
    
    console.log(`[Fix] ✅ Updated user ${userId} email to ${correctEmail}`);
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
    
    if (!userId) {
      console.log(`[Fix] No user ID provided`);
      console.log(`[Fix] Usage: 
  npx tsx server/auth-fixes/fix-email-mismatch.ts --user-id=<id> --correct-email=<email> [--dry-run]
  npx tsx server/auth-fixes/fix-email-mismatch.ts --user-id=<id> --auth-id=<id> [--dry-run]`);
      process.exit(1);
    }
    
    if (!correctEmail && !authId) {
      console.log(`[Fix] Either correct email or auth ID must be provided`);
      process.exit(1);
    }
    
    console.log(`[Fix] Fixing email mismatch for user ${userId}...`);
    const success = await fixEmailMismatch(userId, correctEmail, authId);
    
    if (success) {
      console.log(`[Fix] ✅ Successfully fixed email for user ${userId}`);
    } else {
      console.log(`[Fix] ❌ Failed to fix email for user ${userId}`);
      process.exit(1);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('[Fix] Unhandled error:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (process.argv[1].endsWith('fix-email-mismatch.ts')) {
  main();
}

export { fixEmailMismatch };