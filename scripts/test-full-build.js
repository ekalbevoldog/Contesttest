#!/usr/bin/env node

/**
 * Test Full Build Script
 * 
 * This script tests a full build of the application to ensure it's deployable.
 * It will:
 * 1. Run the build with our fallback script
 * 2. Test that the output files exist
 * 3. Test basic functionality of the build
 * 
 * Usage: node scripts/test-full-build.js
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.resolve(ROOT_DIR, 'dist');

console.log('🔍 Testing full build process...');

try {
  // Clear dist directory if it exists
  if (fs.existsSync(DIST_DIR)) {
    console.log('🧹 Cleaning existing dist directory...');
    execSync('rm -rf dist', { cwd: ROOT_DIR, stdio: 'inherit' });
  }

  // Run the build script
  console.log('🔨 Running build script...');
  execSync('node scripts/build-with-fallback.js', { cwd: ROOT_DIR, stdio: 'inherit' });

  // Check if the dist directory was created and contains the expected files
  if (!fs.existsSync(DIST_DIR)) {
    throw new Error('Dist directory was not created');
  }

  console.log('📂 Checking for key server files...');
  
  // Check for essential files
  const requiredFiles = [
    'server/index.js',
    'server/routes.js',
    'server/db.js',
    'server/storage.js',
    'shared/schema.js'
  ];

  for (const file of requiredFiles) {
    const filePath = path.join(DIST_DIR, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Required file ${file} was not built`);
    }
    console.log(`✅ ${file} exists`);
  }

  // Check that we can start the server (just a quick test, then kill it)
  console.log('🚀 Testing server startup (brief test)...');
  try {
    // Set environment variable to skip Vite frontend during this test
    process.env.TEST_BUILD = 'true';
    
    // Start the server with a timeout to kill it
    const serverProcess = execSync('node dist/server/index.js', { 
      cwd: ROOT_DIR,
      timeout: 5000, // 5 second timeout
      stdio: 'inherit'
    });
  } catch (e) {
    // We expect a timeout error
    if (e.signal === 'SIGTERM') {
      console.log('✅ Server started successfully (terminated after 5 seconds as expected)');
    } else {
      throw e;
    }
  }

  console.log('🎉 Build test complete! Your application should be ready for deployment.');
} catch (error) {
  console.error('❌ Build test failed:', error.message);
  process.exit(1);
}