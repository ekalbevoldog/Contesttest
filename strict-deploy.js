/**
 * Strict Deployment Script
 * 
 * A reliable deployment process that builds and runs the application in production
 * with no fallbacks, ensuring consistent and reliable deployments.
 * 
 * Usage:
 *   node strict-deploy.js
 *   NODE_ENV=production node strict-deploy.js
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// ANSI colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Logging function for consistent output
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Execute a command with proper error handling
function execute(command, options = {}) {
  try {
    return execSync(command, { stdio: 'inherit', ...options });
  } catch (error) {
    if (options.throwOnError !== false) {
      throw error;
    }
    return null;
  }
}

// Deploy the application
async function deploy() {
  log('🚀 Starting strict deployment process...', colors.blue);
  
  try {
    // Set environment to production
    process.env.NODE_ENV = 'production';
    
    // Run the strict build
    log('🔨 Building application...', colors.cyan);
    execute('node unified-build-strict.js');
    
    // Check that the build was successful
    if (!fs.existsSync('dist') || !fs.existsSync('dist/index.js')) {
      throw new Error('Build failed - dist/index.js not found');
    }
    
    log('✅ Build completed successfully', colors.green);
    
    // Create a proper package.json for production
    log('📦 Preparing production package.json...', colors.cyan);
    
    const deployPackage = {
      name: 'nil-connect-production',
      version: '1.0.0',
      type: 'module',
      scripts: {
        start: 'NODE_ENV=production node index.js'
      },
      engines: {
        node: '>=18'
      }
    };
    
    fs.writeFileSync('dist/package.json', JSON.stringify(deployPackage, null, 2));
    
    log('✅ Production package.json created', colors.green);
    
    // Start the production server
    log('🚀 Starting production server...', colors.green);
    execute('cd dist && NODE_ENV=production node index.js');
    
  } catch (error) {
    log(`❌ Deployment failed: ${error}`, colors.red);
    process.exit(1);
  }
}

// Run the deployment
deploy();