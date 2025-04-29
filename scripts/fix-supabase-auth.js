#!/usr/bin/env node

/**
 * Supabase Authentication System Fix Script
 * 
 * This script runs a series of fixes to repair the Supabase authentication system,
 * specifically addressing the issues with user registration and database integration.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// ANSI color codes for better visual output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');
const verbose = args.includes('--verbose');
const help = args.includes('--help') || args.includes('-h');

if (help) {
  console.log(`
${colors.bright}Supabase Authentication System Fix Script${colors.reset}

This script runs a series of fixes to repair the Supabase authentication system,
specifically addressing the issues with user registration and database integration.

${colors.bright}Usage:${colors.reset}
  node scripts/fix-supabase-auth.js [options]

${colors.bright}Options:${colors.reset}
  --dry-run       Show what would be fixed without making changes
  --force         Run all fixes without confirmation prompts
  --verbose       Show detailed output from each step
  --help, -h      Show this help message
  `);
  process.exit(0);
}

// Function to run a command with proper output handling
function runCommand(command, description) {
  console.log(`\n${colors.cyan}▶ ${description}${colors.reset}`);
  
  if (dryRun) {
    console.log(`${colors.dim}Would run: ${command}${colors.reset}`);
    return true;
  }
  
  try {
    execSync(command, { 
      stdio: verbose ? 'inherit' : 'pipe',
      encoding: 'utf-8'
    });
    console.log(`${colors.green}✓ ${description} completed successfully${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}✗ ${description} failed${colors.reset}`);
    if (verbose) {
      console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
    } else {
      console.error(`${colors.yellow}Run with --verbose for more details${colors.reset}`);
    }
    return false;
  }
}

// Function to prompt for confirmation
function confirm(message) {
  if (force) return true;
  if (dryRun) {
    console.log(`${colors.dim}Would prompt: ${message} (y/N)${colors.reset}`);
    return true;
  }
  
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise(resolve => {
    readline.question(`${colors.yellow}${message} (y/N) ${colors.reset}`, answer => {
      readline.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

// Main function to run the fixes
async function main() {
  console.log(`\n${colors.bright}${colors.blue}=== Supabase Authentication System Fix Script ===${colors.reset}`);
  console.log(`${colors.dim}Mode: ${dryRun ? 'Dry Run (no changes will be made)' : 'Live'}${colors.reset}`);
  
  // Check if we're in the project root by looking for package.json
  if (!fs.existsSync(path.join(process.cwd(), 'package.json'))) {
    console.error(`${colors.red}Error: This script must be run from the project root directory${colors.reset}`);
    process.exit(1);
  }
  
  // Step 1: Database Schema Verification and Repair
  console.log(`\n${colors.bright}${colors.blue}Step 1: Database Schema Verification and Repair${colors.reset}`);
  
  // Verify the enhanced users schema script exists
  const schemaScriptPath = path.join(process.cwd(), 'server/enhanced-users-schema.ts');
  if (!fs.existsSync(schemaScriptPath)) {
    console.error(`${colors.red}Error: Enhanced users schema script not found at ${schemaScriptPath}${colors.reset}`);
    process.exit(1);
  }
  
  const proceedWithSchemaFix = await confirm('Proceed with database schema verification and repair?');
  if (!proceedWithSchemaFix) {
    console.log(`${colors.yellow}Skipping schema verification and repair${colors.reset}`);
  } else {
    const schemaFixSuccess = runCommand(
      'npx tsx server/enhanced-users-schema.ts',
      'Schema verification and repair'
    );
    
    if (!schemaFixSuccess && !force) {
      console.error(`${colors.red}Schema verification and repair failed. Fix this issue before continuing.${colors.reset}`);
      const proceedAnyway = await confirm('Proceed anyway?');
      if (!proceedAnyway) {
        process.exit(1);
      }
    }
  }
  
  // Step 2: Run diagnostic checks
  console.log(`\n${colors.bright}${colors.blue}Step 2: Authentication System Diagnostics${colors.reset}`);
  
  // Verify the diagnostic script exists
  const diagnosticScriptPath = path.join(process.cwd(), 'server/auth-diagnostic.ts');
  if (!fs.existsSync(diagnosticScriptPath)) {
    console.error(`${colors.red}Error: Auth diagnostic script not found at ${diagnosticScriptPath}${colors.reset}`);
    process.exit(1);
  }
  
  const proceedWithDiagnostics = await confirm('Proceed with authentication system diagnostics?');
  if (!proceedWithDiagnostics) {
    console.log(`${colors.yellow}Skipping authentication diagnostics${colors.reset}`);
  } else {
    runCommand(
      'npx tsx server/auth-diagnostic.ts',
      'Authentication system diagnostics'
    );
  }
  
  // Step 3: Fix auth_id mappings
  console.log(`\n${colors.bright}${colors.blue}Step 3: Fix Auth ID Mappings${colors.reset}`);
  
  // Verify the fix auth mapping script exists
  const fixAuthMappingPath = path.join(process.cwd(), 'server/fix-auth-mapping.ts');
  if (!fs.existsSync(fixAuthMappingPath)) {
    console.error(`${colors.red}Error: Fix auth mapping script not found at ${fixAuthMappingPath}${colors.reset}`);
    process.exit(1);
  }
  
  const proceedWithMappingFix = await confirm('Proceed with fixing auth ID mappings?');
  if (!proceedWithMappingFix) {
    console.log(`${colors.yellow}Skipping auth ID mapping fixes${colors.reset}`);
  } else {
    const dryRunFlag = dryRun ? '--dry-run' : '';
    runCommand(
      `npx tsx server/fix-auth-mapping.ts --fix-all ${dryRunFlag}`,
      'Fix auth ID mappings'
    );
  }
  
  // Step 4: Install the updated auth routes file
  console.log(`\n${colors.bright}${colors.blue}Step 4: Update Authentication Routes${colors.reset}`);
  
  // Verify the fixed auth routes file exists
  const fixedAuthRoutesPath = path.join(process.cwd(), 'server/fixed-auth-routes.ts');
  if (!fs.existsSync(fixedAuthRoutesPath)) {
    console.error(`${colors.red}Error: Fixed auth routes not found at ${fixedAuthRoutesPath}${colors.reset}`);
    process.exit(1);
  }
  
  // Check if the supabaseAuth.ts file exists
  const supabaseAuthPath = path.join(process.cwd(), 'server/supabaseAuth.ts');
  if (!fs.existsSync(supabaseAuthPath)) {
    console.error(`${colors.red}Error: Supabase auth file not found at ${supabaseAuthPath}${colors.reset}`);
    process.exit(1);
  }
  
  // Make a backup of the original file
  const proceedWithRouteUpdate = await confirm('Proceed with updating authentication routes?');
  if (!proceedWithRouteUpdate) {
    console.log(`${colors.yellow}Skipping authentication routes update${colors.reset}`);
  } else {
    if (!dryRun) {
      const backupPath = `${supabaseAuthPath}.bak`;
      try {
        fs.copyFileSync(supabaseAuthPath, backupPath);
        console.log(`${colors.green}✓ Backup created at ${backupPath}${colors.reset}`);
      } catch (error) {
        console.error(`${colors.red}Failed to create backup: ${error.message}${colors.reset}`);
        const proceedWithoutBackup = await confirm('Proceed without backup?');
        if (!proceedWithoutBackup) {
          process.exit(1);
        }
      }
      
      // Copy the fixed file to the original location
      try {
        fs.copyFileSync(fixedAuthRoutesPath, supabaseAuthPath);
        console.log(`${colors.green}✓ Updated authentication routes${colors.reset}`);
      } catch (error) {
        console.error(`${colors.red}Failed to update authentication routes: ${error.message}${colors.reset}`);
      }
    } else {
      console.log(`${colors.dim}Would replace ${supabaseAuthPath} with ${fixedAuthRoutesPath}${colors.reset}`);
    }
  }
  
  // Step 5: Final verification
  console.log(`\n${colors.bright}${colors.blue}Step 5: Final Verification${colors.reset}`);
  
  const proceedWithFinalVerification = await confirm('Proceed with final verification?');
  if (!proceedWithFinalVerification) {
    console.log(`${colors.yellow}Skipping final verification${colors.reset}`);
  } else {
    runCommand(
      'npx tsx server/auth-diagnostic.ts',
      'Final authentication system verification'
    );
  }
  
  console.log(`\n${colors.bright}${colors.green}=== Supabase Authentication System Fix Complete ===${colors.reset}`);
  
  if (dryRun) {
    console.log(`${colors.yellow}This was a dry run. No changes were made.${colors.reset}`);
    console.log(`${colors.yellow}Run without --dry-run to apply the fixes.${colors.reset}`);
  } else {
    console.log(`${colors.green}All fixes have been applied.${colors.reset}`);
    console.log(`${colors.yellow}Remember to restart your application to apply the changes.${colors.reset}`);
  }
}

// Run the main function
main().catch(error => {
  console.error(`${colors.red}Unhandled error: ${error.message}${colors.reset}`);
  process.exit(1);
});