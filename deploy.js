/**
 * Deployment Script
 * 
 * A single-file solution for building and running the application in production.
 * Uses the unified build system and sets up proper environment variables.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get proper directory path in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Log with color
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Execute a command
function execute(command, options = {}) {
  try {
    log(`$ ${command}`, colors.bright);
    return execSync(command, { 
      stdio: options.silent ? 'pipe' : 'inherit',
      cwd: options.cwd || __dirname,
      ...options
    });
  } catch (error) {
    if (options.ignoreError) {
      log(`Warning: Command failed but continuing: ${command}`, colors.yellow);
      return null;
    }
    log(`Error: Command failed: ${command}`, colors.red);
    throw error;
  }
}

// Main deployment function
async function deploy() {
  try {
    log('🚀 Starting deployment process', colors.bright + colors.blue);
    
    // Set production environment
    process.env.NODE_ENV = 'production';
    
    // Run the unified build
    log('\n📦 Building the application...', colors.cyan);
    execute('node unified-build.js');
    
    // Start the server
    log('\n🌐 Starting the server...', colors.green);
    execute('NODE_ENV=production node server.js');
    
  } catch (error) {
    log(`\n❌ Deployment failed: ${error.message}`, colors.bright + colors.red);
    process.exit(1);
  }
}

// Execute the deployment
deploy().catch(error => {
  log(`Unhandled error: ${error.message}`, colors.red);
  process.exit(1);
});