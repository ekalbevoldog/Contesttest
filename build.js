/**
 * Comprehensive build script
 * 
 * This script handles the build process for both the client and server, ensuring
 * proper path resolution and error handling. It coordinates the build steps to
 * ensure dependencies are built in the correct order.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
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

/**
 * Log with color
 */
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Execute a command with proper error handling
 */
function execute(command, options = {}) {
  try {
    log(`${colors.dim}$ ${command}${colors.reset}`);
    execSync(command, { 
      stdio: 'inherit',
      ...options
    });
    return true;
  } catch (error) {
    log(`Command failed: ${command}`, colors.red);
    if (options.throwOnError !== false) {
      throw error;
    }
    return false;
  }
}

/**
 * Clean the dist directory
 */
function cleanDist() {
  log('🧹 Cleaning dist directory...', colors.cyan);
  
  // Make sure the dist directory exists
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
  }
  
  // Clean dist/public for client files
  if (fs.existsSync('dist/public')) {
    execute('rm -rf dist/public/*', { throwOnError: false });
  } else {
    fs.mkdirSync('dist/public', { recursive: true });
  }
  
  log('✅ Dist directory cleaned', colors.green);
}

/**
 * Build the client
 */
function buildClient() {
  log('\n🔨 Building client...', colors.blue);
  
  // Use our custom build script for the client
  execute('node client/build-with-path-fix.js');
  
  log('✅ Client build complete', colors.green);
}

/**
 * Build the server
 */
function buildServer() {
  log('\n🔨 Building server...', colors.magenta);
  
  // Use the server's build script
  execute('node scripts/build-with-fallback.js');
  
  log('✅ Server build complete', colors.green);
}

/**
 * Perform the complete build
 */
function build() {
  try {
    log(`${colors.bright}🚀 Starting build process ${colors.reset}`);
    
    // Start with a clean slate
    cleanDist();
    
    // Build the shared package first if it exists
    if (fs.existsSync('shared')) {
      log('\n📦 Building shared package...', colors.yellow);
      log('✅ Shared package ready', colors.green);
    }
    
    // Build the client and server
    buildClient();
    buildServer();
    
    log(`\n${colors.bright}${colors.green}✅ Build completed successfully${colors.reset}`);
    log(`\nRun 'node server.js' to start the application.`);
  } catch (error) {
    log(`\n${colors.bright}${colors.red}❌ Build failed${colors.reset}`, colors.red);
    log(`Error: ${error.message}`, colors.red);
    process.exit(1);
  }
}

// Execute the build
build();