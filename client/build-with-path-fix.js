/**
 * Client build script that ensures path alias resolution works correctly
 * 
 * This script creates a temporary tsconfig.paths.json file that explicitly maps
 * all path aliases to ensure they're properly resolved during build time.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get proper __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the original tsconfig
const tsconfigPath = path.resolve(__dirname, '../tsconfig.json');
const originalTsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));

// Create a paths-specific tsconfig for the client
const clientTsconfigPath = path.resolve(__dirname, 'tsconfig.paths.json');
const clientTsconfig = {
  extends: '../tsconfig.json',
  compilerOptions: {
    baseUrl: '.',
    paths: {
      '@/*': ['./src/*'],
      '@shared/*': ['../shared/*']
    }
  },
  include: ['src/**/*']
};

// Write the client tsconfig
fs.writeFileSync(clientTsconfigPath, JSON.stringify(clientTsconfig, null, 2));

console.log('📝 Created temporary tsconfig.paths.json for correct path resolution');

try {
  // Run the build with the temporary tsconfig
  console.log('🔨 Building client with correct paths...');
  execSync('vite build --config ../vite.config.ts', { 
    stdio: 'inherit',
    cwd: __dirname
  });
  
  console.log('✅ Build completed successfully');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
} finally {
  // Clean up temporary tsconfig
  fs.unlinkSync(clientTsconfigPath);
  console.log('🧹 Cleaned up temporary tsconfig.paths.json');
}