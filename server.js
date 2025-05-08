/**
 * Universal Server Launcher
 * 
 * A robust server launcher that handles different environments (production/development),
 * proper error handling, and graceful shutdown across all deployment scenarios.
 * 
 * This file is the main entry point for the server and should be used in all environments.
 */

// Import required modules using ESM syntax
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { spawn } from 'child_process';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Get current file path (ESM equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from all potential .env files
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });
dotenv.config({ path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development' });

// Server child process reference
let serverProcess = null;

// Determine server entry point without fallbacks
function determineServerPath() {
  // In production, use the compiled JavaScript
  if (process.env.NODE_ENV === 'production') {
    return './dist/server/index.js';
  }
  
  // In development, use TypeScript directly
  return './server/index.ts';
}

// Launch the server - direct execution without fallbacks
async function launchServer(serverPath) {
  console.log(`Starting server in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`Loading server from: ${serverPath}`);
  
  // Determine the right command based on file extension
  const command = serverPath.endsWith('.ts') ? 'tsx' : 'node';
  
  // Ensure proper environment variables for server execution
  const PORT = process.env.PORT || process.env.REPLIT_PORT || 5000;
  
  // Create enhanced environment with explicitly set variables
  const enhancedEnv = {
    ...process.env,
    PORT: PORT.toString(),
    NODE_ENV: process.env.NODE_ENV || 'development',
    HOST: '0.0.0.0' // Ensure binding to all interfaces
  };
  
  // Launch the server process
  serverProcess = spawn('npx', [command, serverPath], { 
    stdio: 'inherit',
    env: enhancedEnv
  });
  
  serverProcess.on('error', (error) => {
    console.error(`Failed to start server process: ${error.message}`);
    
    if (error.code === 'ENOENT') {
      console.error(`The '${command}' command was not found. Make sure it's installed.`);
      console.error(`Try running: npm install -g ${command}`);
    }
    
    process.exit(1);
  });
  
  serverProcess.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
    
    // If it's a clean exit, we should also exit
    if (code === 0) {
      process.exit(0);
    }
    
    // If we're here, it means the server crashed
    console.error('Server crashed. Exiting with error code');
    process.exit(1);
  });
}

// Configure graceful shutdown
function setupGracefulShutdown() {
  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down gracefully`);
    
    if (serverProcess) {
      // Forward the signal to the child process
      serverProcess.kill(signal);
      
      // Force kill after timeout
      setTimeout(() => {
        console.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    } else {
      process.exit(0);
    }
  };
  
  // Handle signals
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    shutdown('SIGTERM');
  });
}

/**
 * Main function to start everything
 */
async function startServer() {
  try {
    // Get the correct server path
    const serverPath = determineServerPath();
    
    // Setup graceful shutdown handlers
    setupGracefulShutdown();
    
    // Launch the server
    await launchServer(serverPath);
  } catch (error) {
    console.error('Critical error during server startup:', error);
    process.exit(1);
  }
}

// Start the server
startServer().catch(err => {
  console.error('Fatal error in server startup:', err);
  process.exit(1);
});