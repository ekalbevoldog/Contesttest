// scripts/clean-build.js
// A clean build script that fails on errors rather than using fallbacks

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Ensure dist directories exist
console.log('🔧 Preparing build directories...');
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist', { recursive: true });
}

if (!fs.existsSync('dist/public')) {
  fs.mkdirSync('dist/public', { recursive: true });
}

// Build client first
console.log('🏗️ Building client application...');
try {
  execSync('npx vite build', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Client build failed:', error);
  process.exit(1);
}

// Then build server
console.log('🏗️ Building server application...');
try {
  execSync('tsc -p tsconfig.build.json', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Server TypeScript compilation failed:', error);
  process.exit(1);
}

// Copy any necessary non-TypeScript files
if (fs.existsSync('server/supabase-migration.sql')) {
  console.log('📋 Copying SQL migration files...');
  execSync('cp server/supabase-migration.sql dist/', { stdio: 'inherit' });
}

console.log('✅ Build completed successfully!');