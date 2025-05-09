/**
 * Development Server Starter
 * 
 * This script starts both the client and server components in development mode.
 * It launches the server using tsx and sets up the environment for proper execution.
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ANSI color codes for prettier console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Log with color
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Check if required files exist
function checkFiles() {
  const requiredFiles = [
    { path: 'server/index.ts', name: 'Server entry point' },
    { path: 'vite.config.ts', name: 'Vite configuration' }
  ];
  
  for (const file of requiredFiles) {
    if (!fs.existsSync(resolve(__dirname, file.path))) {
      log(`Error: ${file.name} (${file.path}) not found!`, colors.red);
      process.exit(1);
    }
  }
}

// Start development server
function startDevelopment() {
  log('Starting development environment...', colors.cyan);
  
  // Start the server with tsx
  log('\n📡 Starting server...', colors.yellow);
  const server = spawn('npx', ['tsx', 'server/index.ts'], {
    stdio: 'inherit',
    env: { ...process.env, PORT: process.env.PORT || '5001' }
  });
  
  // Handle server process events
  server.on('error', (error) => {
    log(`\n❌ Failed to start server: ${error.message}`, colors.red);
  });
  
  server.on('close', (code) => {
    if (code !== 0) {
      log(`\n⚠️ Server process exited with code ${code}`, colors.yellow);
    }
    process.exit(code);
  });
  
  // Handle process termination
  const cleanupAndExit = () => {
    log('\n🛑 Shutting down development environment...', colors.yellow);
    server.kill();
    process.exit(0);
  };
  
  // Register shutdown handlers
  process.on('SIGINT', cleanupAndExit);
  process.on('SIGTERM', cleanupAndExit);
  process.on('exit', cleanupAndExit);
}

// Main execution
function main() {
  log('\n🚀 Development Environment Setup', colors.bright + colors.cyan);
  log('==============================\n', colors.cyan);
  
  checkFiles();
  startDevelopment();
}

main();