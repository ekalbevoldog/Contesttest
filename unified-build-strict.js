/**
 * Strict Unified Build System
 * 
 * A clean, reliable build process for the entire application with no fallbacks.
 * Handles TypeScript compilation, path resolution, and proper deployment builds.
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
    execSync(command, { stdio: 'inherit', ...options });
    return true;
  } catch (error) {
    if (options.throwOnError !== false) {
      throw error;
    }
    return false;
  }
}

// Clean build directories for a fresh start
function cleanBuildDirs() {
  log('🧹 Cleaning build directories...', colors.cyan);
  execute('rm -rf dist', { throwOnError: false });
  execute('rm -rf client/dist', { throwOnError: false });
  fs.mkdirSync('dist', { recursive: true });
  log('✅ Build directories cleaned', colors.green);
}

// Build the client-side code with Vite
async function buildClient() {
  log('🔨 Building client with Vite...', colors.cyan);
  execute('cd client && npx vite build');
  
  // Copy to dist/public
  log('📋 Copying client build to dist/public...', colors.cyan);
  fs.mkdirSync('dist/public', { recursive: true });
  execute('cp -r client/dist/* dist/public/');
  
  log('✅ Client build completed', colors.green);
}

// Build the server-side code with TypeScript
function buildServer() {
  log('🔨 Building server with TypeScript...', colors.cyan);
  
  // Use TypeScript compiler with strict settings
  execute('tsc -p tsconfig.build.json');
  
  // Copy the SQL migration file if it exists
  if (fs.existsSync('server/supabase-migration.sql')) {
    execute('cp server/supabase-migration.sql dist/');
    log('✅ SQL migration file copied', colors.green);
  }
  
  log('✅ Server build completed', colors.green);
}

// Run the unified build process
async function build() {
  log('🚀 Starting strict unified build process...', colors.blue);
  
  try {
    // Clean directories first
    cleanBuildDirs();
    
    // Build server
    buildServer();
    
    // Build client
    await buildClient();
    
    log('🎉 Build process completed successfully!', colors.green);
    process.exit(0);
  } catch (error) {
    log(`❌ Build failed: ${error}`, colors.red);
    process.exit(1);
  }
}

build();