/**
 * Deployment Verification Script
 * 
 * This script checks that all the necessary deployment files exist
 * and verifies the production build without actually starting the server.
 */

import fs from 'fs';
import path from 'path';

// ANSI colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function checkDeploy() {
  log('🔍 Verifying deployment build...', colors.blue);
  
  try {
    // Check if the build was successful
    const missingFiles = [];
    
    const requiredFiles = [
      'dist/index.js',
      'dist/server/index.js',
      'dist/server/routes.js',
      'dist/public/index.html'
    ];
    
    requiredFiles.forEach(file => {
      if (!fs.existsSync(file)) {
        missingFiles.push(file);
      }
    });
    
    if (missingFiles.length > 0) {
      log('❌ Missing required files:', colors.red);
      missingFiles.forEach(file => {
        log(`   - ${file}`, colors.red);
      });
      throw new Error('Deployment verification failed - missing files');
    }
    
    log('✅ All required files present', colors.green);
    
    // Check package.json in dist directory
    if (!fs.existsSync('dist/package.json')) {
      log('❌ Missing dist/package.json', colors.red);
      throw new Error('Deployment verification failed - missing package.json');
    }
    
    const packageJson = JSON.parse(fs.readFileSync('dist/package.json', 'utf8'));
    if (!packageJson.scripts || !packageJson.scripts.start) {
      log('❌ Missing start script in dist/package.json', colors.red);
      throw new Error('Deployment verification failed - invalid package.json');
    }
    
    log('✅ package.json is valid', colors.green);
    
    // Verify the build paths in the main server file
    const indexJs = fs.readFileSync('dist/index.js', 'utf8');
    if (!indexJs.includes('./server/')) {
      log('⚠️ Warning: index.js might have incorrect import paths', colors.yellow);
    } else {
      log('✅ index.js import paths look correct', colors.green);
    }
    
    log('🎉 Deployment verification completed successfully!', colors.green);
    
    // Summary
    log('\nDeployment Summary:', colors.blue);
    log('The application build is verified and ready for deployment.', colors.reset);
    log('To deploy the application:', colors.reset);
    log('1. Upload the dist directory to your hosting provider', colors.reset);
    log('2. Start the server with: NODE_ENV=production node index.js', colors.reset);
    
  } catch (error) {
    log(`❌ ${error.message}`, colors.red);
    process.exit(1);
  }
}

checkDeploy().catch(err => {
  log(`❌ Unexpected error: ${err}`, colors.red);
  process.exit(1);
});