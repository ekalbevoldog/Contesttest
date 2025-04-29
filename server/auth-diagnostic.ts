/**
 * Supabase Auth Diagnostic Utility
 * 
 * This script provides diagnostic tools to identify and fix common authentication issues,
 * particularly around the mapping between Supabase Auth users and the application's users table.
 */

import { supabase, supabaseAdmin } from './supabase.js';

interface DiagnosticResult {
  ok: boolean;
  issues: DiagnosticIssue[];
  stats: {
    authUserCount: number;
    dbUserCount: number;
    unmappedAuthUsers: number;
    unmappedDbUsers: number;
    missingEmailUsers: number;
    duplicateEmails: number;
  };
}

interface DiagnosticIssue {
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  details?: string;
  entity?: string;
  entityId?: string;
  fixable?: boolean;
  fixCommand?: string;
}

interface UserMapping {
  authId: string;
  dbId: number;
  email: string;
  status: 'ok' | 'missing_auth_id' | 'missing_db_record' | 'mismatch';
}

/**
 * Run comprehensive auth diagnostics
 */
export async function runAuthDiagnostics(): Promise<DiagnosticResult> {
  console.log("[Diagnostic] Running comprehensive auth diagnostics...");
  
  const issues: DiagnosticIssue[] = [];
  const stats = {
    authUserCount: 0,
    dbUserCount: 0,
    unmappedAuthUsers: 0,
    unmappedDbUsers: 0,
    missingEmailUsers: 0,
    duplicateEmails: 0
  };
  
  try {
    // Step 1: Check if users table exists
    const { data: tables, error: tablesError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_name", "users");
      
    if (tablesError) {
      issues.push({
        severity: 'critical',
        message: "Failed to check if users table exists",
        details: tablesError.message,
        fixable: false
      });
      return { ok: false, issues, stats };
    }
    
    if (!tables || tables.length === 0) {
      issues.push({
        severity: 'critical',
        message: "Users table doesn't exist",
        details: "The users table is missing from the database",
        fixable: true,
        fixCommand: "npx tsx server/enhanced-users-schema.ts"
      });
      return { ok: false, issues, stats };
    }
    
    // Step 2: Get all auth users
    console.log("[Diagnostic] Fetching all auth users...");
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      issues.push({
        severity: 'critical',
        message: "Failed to fetch auth users",
        details: authError.message,
        fixable: false
      });
      return { ok: false, issues, stats };
    }
    
    const authUsers = authData.users || [];
    stats.authUserCount = authUsers.length;
    
    // Step 3: Get all database users
    console.log("[Diagnostic] Fetching all database users...");
    const { data: dbUsers, error: dbError } = await supabase
      .from("users")
      .select("id, auth_id, email, role, created_at, last_login");
      
    if (dbError) {
      issues.push({
        severity: 'critical',
        message: "Failed to fetch database users",
        details: dbError.message,
        fixable: false
      });
      return { ok: false, issues, stats };
    }
    
    stats.dbUserCount = dbUsers?.length || 0;
    
    // Step 4: Check for auth users without emails
    console.log("[Diagnostic] Checking for auth users without emails...");
    const authUsersWithoutEmail = authUsers.filter(user => !user.email);
    stats.missingEmailUsers = authUsersWithoutEmail.length;
    
    if (authUsersWithoutEmail.length > 0) {
      issues.push({
        severity: 'warning',
        message: `${authUsersWithoutEmail.length} auth users have no email addresses`,
        details: "This can cause mapping issues as email is used as a fallback",
        fixable: false
      });
      
      // Log each problematic user
      authUsersWithoutEmail.forEach(user => {
        console.log(`[Diagnostic] Auth user without email: ${user.id}`);
      });
    }
    
    // Step 5: Check for duplicate emails in auth
    console.log("[Diagnostic] Checking for duplicate emails in auth system...");
    const emailCounts = new Map<string, number>();
    
    authUsers.forEach(user => {
      if (user.email) {
        const email = user.email.toLowerCase();
        emailCounts.set(email, (emailCounts.get(email) || 0) + 1);
      }
    });
    
    const duplicateEmails = Array.from(emailCounts.entries())
      .filter(([email, count]) => count > 1)
      .map(([email]) => email);
      
    stats.duplicateEmails = duplicateEmails.length;
    
    if (duplicateEmails.length > 0) {
      issues.push({
        severity: 'error',
        message: `${duplicateEmails.length} emails have duplicate auth accounts`,
        details: `Emails with multiple auth accounts: ${duplicateEmails.join(', ')}`,
        fixable: false
      });
    }
    
    // Step 6: Create mappings and identify issues
    console.log("[Diagnostic] Building user mappings and identifying issues...");
    const mappings: UserMapping[] = [];
    
    // Map based on auth users first
    authUsers.forEach(authUser => {
      const dbUser = dbUsers.find(u => u.auth_id === authUser.id);
      
      if (!dbUser) {
        // No database user mapped to this auth user
        stats.unmappedAuthUsers++;
        
        mappings.push({
          authId: authUser.id,
          dbId: -1,
          email: authUser.email || '',
          status: 'missing_db_record'
        });
        
        issues.push({
          severity: 'error',
          message: `Auth user has no database record`,
          details: `Auth user ${authUser.id} (${authUser.email || 'no email'}) is not mapped to any database record`,
          entity: 'auth_user',
          entityId: authUser.id,
          fixable: true,
          fixCommand: `npx tsx server/fix-missing-user.ts --auth-id=${authUser.id}`
        });
      } else {
        // Found a mapping
        mappings.push({
          authId: authUser.id,
          dbId: dbUser.id,
          email: authUser.email || dbUser.email,
          status: 'ok'
        });
        
        // Check for email mismatches
        if (authUser.email && dbUser.email && authUser.email.toLowerCase() !== dbUser.email.toLowerCase()) {
          issues.push({
            severity: 'warning',
            message: `Email mismatch between auth and database`,
            details: `Auth user ${authUser.id} has email ${authUser.email}, but database user ${dbUser.id} has email ${dbUser.email}`,
            entity: 'user',
            entityId: dbUser.id.toString(),
            fixable: true,
            fixCommand: `npx tsx server/fix-email-mismatch.ts --user-id=${dbUser.id} --correct-email=${authUser.email}`
          });
        }
      }
    });
    
    // Check for database users not mapped to any auth user
    dbUsers.forEach(dbUser => {
      if (!dbUser.auth_id) {
        stats.unmappedDbUsers++;
        
        mappings.push({
          authId: '',
          dbId: dbUser.id,
          email: dbUser.email,
          status: 'missing_auth_id'
        });
        
        // If we have the email, try to find a matching auth user
        if (dbUser.email) {
          const matchingAuthUser = authUsers.find(au => 
            au.email && au.email.toLowerCase() === dbUser.email.toLowerCase()
          );
          
          if (matchingAuthUser) {
            issues.push({
              severity: 'error',
              message: `Database user missing auth_id but matching auth user exists`,
              details: `Database user ${dbUser.id} (${dbUser.email}) should be mapped to auth user ${matchingAuthUser.id}`,
              entity: 'user',
              entityId: dbUser.id.toString(),
              fixable: true,
              fixCommand: `npx tsx server/fix-auth-mapping.ts --user-id=${dbUser.id} --auth-id=${matchingAuthUser.id}`
            });
          } else {
            issues.push({
              severity: 'warning',
              message: `Database user has no auth_id and no matching auth user found`,
              details: `Database user ${dbUser.id} (${dbUser.email}) is not linked to any auth user`,
              entity: 'user',
              entityId: dbUser.id.toString(),
              fixable: false
            });
          }
        } else {
          issues.push({
            severity: 'error',
            message: `Database user has no auth_id and no email`,
            details: `Database user ${dbUser.id} is missing both auth_id and email, cannot be mapped`,
            entity: 'user',
            entityId: dbUser.id.toString(),
            fixable: false
          });
        }
      }
    });
    
    console.log("[Diagnostic] Checking for auth trigger...");
    
    // Check if the auth trigger exists
    const { data: triggers, error: triggerError } = await supabase
      .from("information_schema.triggers")
      .select("trigger_name, event_manipulation")
      .eq("event_object_schema", "auth")
      .eq("event_object_table", "users");
      
    if (triggerError) {
      issues.push({
        severity: 'warning',
        message: "Failed to check for auth triggers",
        details: triggerError.message,
        fixable: false
      });
    } else {
      const insertTrigger = triggers?.find(t => 
        t.trigger_name === 'on_auth_user_created' && 
        t.event_manipulation === 'INSERT'
      );
      
      if (!insertTrigger) {
        issues.push({
          severity: 'error',
          message: "Auth user insert trigger is missing",
          details: "The trigger that creates database users when auth users are created is missing",
          fixable: true,
          fixCommand: "npx tsx server/enhanced-users-schema.ts"
        });
      }
    }
    
    console.log("[Diagnostic] Auth diagnostics completed");
    console.log(`[Diagnostic] Issues found: ${issues.length}`);
    
    // Summarize findings
    console.log(`[Diagnostic] Stats:
  Auth users: ${stats.authUserCount}
  Database users: ${stats.dbUserCount}
  Unmapped auth users: ${stats.unmappedAuthUsers}
  Unmapped db users: ${stats.unmappedDbUsers}
  Auth users missing email: ${stats.missingEmailUsers}
  Duplicate emails in auth: ${stats.duplicateEmails}
`);
    
    return {
      ok: issues.filter(i => i.severity === 'critical' || i.severity === 'error').length === 0,
      issues,
      stats
    };
  } catch (error) {
    console.error("[Diagnostic] Unhandled error:", error);
    issues.push({
      severity: 'critical',
      message: "Unhandled error during diagnostics",
      details: error instanceof Error ? error.message : String(error),
      fixable: false
    });
    
    return { ok: false, issues, stats };
  }
}

/**
 * Attempt to automatically fix common issues
 */
export async function autoFixCommonIssues(): Promise<string[]> {
  console.log("[Diagnostic] Attempting to automatically fix common issues...");
  const results: string[] = [];
  
  try {
    // Run diagnostics first
    const diagnostics = await runAuthDiagnostics();
    const fixableIssues = diagnostics.issues.filter(i => i.fixable);
    
    if (fixableIssues.length === 0) {
      console.log("[Diagnostic] No fixable issues found");
      return ["No fixable issues found"];
    }
    
    console.log(`[Diagnostic] Found ${fixableIssues.length} fixable issues`);
    
    // Fix missing trigger issues first
    const triggerIssues = fixableIssues.filter(i => 
      i.message.includes("trigger is missing") || 
      i.message.includes("Users table doesn't exist")
    );
    
    if (triggerIssues.length > 0) {
      console.log("[Diagnostic] Fixing schema and trigger issues...");
      
      const { verifyAndFixUsersSchema } = await import('./enhanced-users-schema.js');
      const success = await verifyAndFixUsersSchema();
      
      if (success) {
        results.push("✅ Fixed schema and trigger issues");
      } else {
        results.push("❌ Failed to fix schema and trigger issues");
      }
    }
    
    // Fix missing database records for auth users
    const missingDbRecords = fixableIssues.filter(i => 
      i.message.includes("Auth user has no database record")
    );
    
    if (missingDbRecords.length > 0) {
      console.log(`[Diagnostic] Fixing ${missingDbRecords.length} missing database records...`);
      
      // Get all auth users
      const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
      const authUsers = authData?.users || [];
      
      for (const issue of missingDbRecords) {
        const authId = issue.entityId;
        if (!authId) continue;
        
        const authUser = authUsers.find(u => u.id === authId);
        if (!authUser) {
          results.push(`❌ Could not find auth user ${authId}`);
          continue;
        }
        
        if (!authUser.email) {
          results.push(`❌ Auth user ${authId} has no email, cannot create database record`);
          continue;
        }
        
        console.log(`[Diagnostic] Creating database record for auth user ${authId} (${authUser.email})`);
        
        const userToInsert = {
          auth_id: authId,
          email: authUser.email,
          username: authUser.user_metadata?.preferred_username || authUser.email.split('@')[0],
          role: authUser.user_metadata?.role || 'athlete',
          created_at: new Date(authUser.created_at || Date.now())
        };
        
        const { data: newUser, error: insertError } = await supabase
          .from("users")
          .insert(userToInsert)
          .select()
          .single();
          
        if (insertError) {
          results.push(`❌ Failed to create user for ${authUser.email}: ${insertError.message}`);
        } else {
          results.push(`✅ Created user ${newUser.id} for auth user ${authId}`);
        }
      }
    }
    
    // Fix database users missing auth_id
    const missingAuthIds = fixableIssues.filter(i => 
      i.message.includes("Database user missing auth_id")
    );
    
    if (missingAuthIds.length > 0) {
      console.log(`[Diagnostic] Fixing ${missingAuthIds.length} users missing auth_id...`);
      
      for (const issue of missingAuthIds) {
        const match = issue.fixCommand?.match(/--user-id=(\d+) --auth-id=([a-zA-Z0-9-]+)/);
        if (!match) continue;
        
        const userId = match[1];
        const authId = match[2];
        
        console.log(`[Diagnostic] Updating user ${userId} with auth_id ${authId}`);
        
        const { error: updateError } = await supabase
          .from("users")
          .update({ auth_id: authId })
          .eq("id", userId);
          
        if (updateError) {
          results.push(`❌ Failed to update user ${userId}: ${updateError.message}`);
        } else {
          results.push(`✅ Updated user ${userId} with auth_id ${authId}`);
        }
      }
    }
    
    console.log("[Diagnostic] Auto-fix completed");
    return results;
  } catch (error) {
    console.error("[Diagnostic] Error during auto-fix:", error);
    return [`❌ Error during auto-fix: ${error instanceof Error ? error.message : String(error)}`];
  }
}

// If this file is run directly, execute the diagnostics
if (process.argv[1].endsWith("auth-diagnostic.ts")) {
  const autoFix = process.argv.includes("--fix");
  
  if (autoFix) {
    console.log("[Diagnostic] Running diagnostics with auto-fix...");
    autoFixCommonIssues()
      .then(results => {
        console.log("[Diagnostic] Auto-fix results:");
        results.forEach(result => console.log(`  ${result}`));
        process.exit(0);
      })
      .catch(error => {
        console.error("[Diagnostic] Unhandled error:", error);
        process.exit(1);
      });
  } else {
    console.log("[Diagnostic] Running diagnostics...");
    runAuthDiagnostics()
      .then(result => {
        console.log("[Diagnostic] Diagnostics result:", result.ok ? "OK" : "Issues found");
        console.log("[Diagnostic] Issues:");
        result.issues.forEach(issue => {
          console.log(`  [${issue.severity.toUpperCase()}] ${issue.message}`);
          if (issue.details) console.log(`    Details: ${issue.details}`);
          if (issue.fixable) console.log(`    Fix command: ${issue.fixCommand}`);
        });
        process.exit(result.ok ? 0 : 1);
      })
      .catch(error => {
        console.error("[Diagnostic] Unhandled error:", error);
        process.exit(1);
      });
  }
}