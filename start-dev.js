/**
 * Development Server Starter
 * 
 * This script is specifically designed to start the server in development mode
 * with proper workflow integration, automatic reloading, and environment setup.
 */

const { spawn } = require('child_process');
const { execSync } = require('child_process');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables from all potential .env files
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env.development' });

// Check for required development dependencies
function checkDependencies() {
  const requiredDeps = ['tsx', 'nodemon'];
  
  for (const dep of requiredDeps) {
    try {
      // Check if dependency is available
      execSync(`npx ${dep} --version`, { stdio: 'ignore' });
    } catch (error) {
      console.log(`Installing required development dependency: ${dep}`);
      try {
        execSync(`npm install -D ${dep}`, { stdio: 'inherit' });
      } catch (err) {
        console.error(`Failed to install ${dep}. Please install it manually: npm install -D ${dep}`);
        process.exit(1);
      }
    }
  }
}

// Start the development server
function startDevelopmentServer() {
  console.log('Starting server in development mode...');
  
  // Set development environment
  process.env.NODE_ENV = 'development';
  
  // Create a nodemon configuration if it doesn't exist
  if (!fs.existsSync('nodemon.json')) {
    const nodemonConfig = {
      "watch": ["server", "shared"],
      "ext": "ts,js,json",
      "exec": "npx tsx server/index.ts",
      "env": {
        "NODE_ENV": "development"
      }
    };
    
    fs.writeFileSync('nodemon.json', JSON.stringify(nodemonConfig, null, 2));
    console.log('Created nodemon.json configuration');
  }
  
  // Start the server with nodemon for auto-reloading
  const serverProcess = spawn('npx', ['nodemon'], {
    stdio: 'inherit',
    env: process.env
  });
  
  // Handle process termination
  process.on('SIGINT', () => {
    serverProcess.kill('SIGINT');
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    serverProcess.kill('SIGTERM');
    process.exit(0);
  });
  
  // Handle server process exit
  serverProcess.on('close', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`Development server exited with code ${code}`);
      process.exit(code);
    }
  });
}

// Main execution
function main() {
  try {
    // Ensure we have the necessary dependencies
    checkDependencies();
    
    // Start the development server
    startDevelopmentServer();
  } catch (error) {
    console.error('Failed to start development server:', error);
    process.exit(1);
  }
}

// Run the main function
main();