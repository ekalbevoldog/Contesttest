#!/usr/bin/env node

/**
 * Install Auth Fixes Script
 * 
 * This script copies the auth fix files to their correct locations
 * and makes them executable.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
const skipBackups = args.includes('--skip-backups');
const help = args.includes('--help') || args.includes('-h');

// Display help message if requested
if (help) {
  console.log(`
${colors.bright}Install Auth Fixes Script${colors.reset}

This script copies the auth fix files to their correct locations and makes them executable.

${colors.bright}Usage:${colors.reset}
  node scripts/install-auth-fixes.js [options]

${colors.bright}Options:${colors.reset}
  --dry-run       Show what would be done without making changes
  --skip-backups  Do not create backups of existing files
  --help, -h      Show this help message
  `);
  process.exit(0);
}

// File mapping - source to destination
const fileMapping = [
  {
    src: 'server/fixed-auth-routes.ts',
    dest: 'server/supabaseAuth.ts',
    backup: true,
    executable: false
  },
  {
    src: 'server/enhanced-users-schema.ts',
    dest: 'server/enhanced-users-schema.ts',
    backup: false,
    executable: true
  },
  {
    src: 'server/auth-diagnostic.ts',
    dest: 'server/auth-diagnostic.ts',
    backup: false,
    executable: true
  },
  {
    src: 'server/fix-auth-mapping.ts',
    dest: 'server/fix-auth-mapping.ts',
    backup: false,
    executable: true
  },
  {
    src: 'server/auth-fixes/fix-missing-user.ts',
    dest: 'server/fix-missing-user.ts',
    backup: false,
    executable: true
  },
  {
    src: 'server/auth-fixes/fix-email-mismatch.ts',
    dest: 'server/fix-email-mismatch.ts',
    backup: false,
    executable: true
  },
  {
    src: 'docs/supabase-auth-fix-guide.md',
    dest: 'docs/supabase-auth-fix-guide.md',
    backup: false,
    executable: false
  },
  {
    src: 'scripts/fix-supabase-auth.js',
    dest: 'scripts/fix-supabase-auth.js',
    backup: false,
    executable: true
  }
];

// Function to copy a file
function copyFile(src, dest, backup = true) {
  try {
    // Check if source file exists
    if (!fs.existsSync(src)) {
      console.error(`${colors.red}Source file ${src} does not exist${colors.reset}`);
      return false;
    }
    
    // Create backup if requested
    if (!skipBackups && backup && fs.existsSync(dest)) {
      const backupPath = `${dest}.bak`;
      if (dryRun) {
        console.log(`${colors.dim}Would create backup: ${dest} -> ${backupPath}${colors.reset}`);
      } else {
        fs.copyFileSync(dest, backupPath);
        console.log(`${colors.green}Created backup: ${dest} -> ${backupPath}${colors.reset}`);
      }
    }
    
    // Ensure directory exists
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
      if (dryRun) {
        console.log(`${colors.dim}Would create directory: ${destDir}${colors.reset}`);
      } else {
        fs.mkdirSync(destDir, { recursive: true });
        console.log(`${colors.green}Created directory: ${destDir}${colors.reset}`);
      }
    }
    
    // Copy the file
    if (dryRun) {
      console.log(`${colors.dim}Would copy: ${src} -> ${dest}${colors.reset}`);
    } else {
      fs.copyFileSync(src, dest);
      console.log(`${colors.green}Copied: ${src} -> ${dest}${colors.reset}`);
    }
    
    return true;
  } catch (error) {
    console.error(`${colors.red}Error copying file ${src} to ${dest}: ${error.message}${colors.reset}`);
    return false;
  }
}

// Function to make a file executable
function makeExecutable(filePath) {
  try {
    if (dryRun) {
      console.log(`${colors.dim}Would make executable: ${filePath}${colors.reset}`);
      return true;
    }
    
    if (process.platform === 'win32') {
      console.log(`${colors.dim}Skipping chmod on Windows for: ${filePath}${colors.reset}`);
      return true;
    }
    
    execSync(`chmod +x ${filePath}`);
    console.log(`${colors.green}Made executable: ${filePath}${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}Error making file executable ${filePath}: ${error.message}${colors.reset}`);
    return false;
  }
}

// Main execution
async function main() {
  console.log(`\n${colors.bright}${colors.blue}=== Installing Auth Fixes ===${colors.reset}`);
  console.log(`${colors.dim}Mode: ${dryRun ? 'Dry Run (no changes will be made)' : 'Live'}${colors.reset}`);
  
  let successCount = 0;
  let failureCount = 0;
  
  // Process each file
  for (const file of fileMapping) {
    console.log(`\n${colors.cyan}▶ Processing ${file.src}${colors.reset}`);
    
    const copied = copyFile(file.src, file.dest, file.backup);
    
    if (copied && file.executable) {
      const madeExecutable = makeExecutable(file.dest);
      if (!madeExecutable) {
        failureCount++;
        continue;
      }
    }
    
    if (copied) {
      successCount++;
    } else {
      failureCount++;
    }
  }
  
  console.log(`\n${colors.bright}${colors.blue}=== Installation Complete ===${colors.reset}`);
  console.log(`${colors.green}${successCount} files processed successfully${colors.reset}`);
  
  if (failureCount > 0) {
    console.log(`${colors.red}${failureCount} files failed${colors.reset}`);
  }
  
  if (dryRun) {
    console.log(`${colors.yellow}This was a dry run. No changes were made.${colors.reset}`);
    console.log(`${colors.yellow}Run without --dry-run to apply the changes.${colors.reset}`);
  } else {
    console.log(`\n${colors.green}Auth fixes installed successfully!${colors.reset}`);
    console.log(`${colors.bright}Next steps:${colors.reset}`);
    console.log(`1. Run database checks: ${colors.cyan}npx tsx server/enhanced-users-schema.ts${colors.reset}`);
    console.log(`2. Run diagnostics: ${colors.cyan}npx tsx server/auth-diagnostic.ts${colors.reset}`);
    console.log(`3. Fix any issues: ${colors.cyan}node scripts/fix-supabase-auth.js${colors.reset}`);
    console.log(`4. Review documentation: ${colors.cyan}docs/supabase-auth-fix-guide.md${colors.reset}`);
  }
}

// Run the main function
main().catch(error => {
  console.error(`${colors.red}Unhandled error: ${error.message}${colors.reset}`);
  process.exit(1);
});