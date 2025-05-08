/**
 * Server Entry Point
 * 
 * This is the main entry point for the server, handling proper imports
 * and environment configurations with fallbacks for various deployment scenarios.
 */

// Import environment variables
require('dotenv').config();

// Determine the right path for the server index
const serverIndex = process.env.NODE_ENV === 'production' 
  ? './dist/server/index.js'  // Production: use built JS
  : './server/index.ts';      // Development: use TypeScript directly with tsx

/**
 * Import the server dynamically based on environment
 * This allows us to handle both production (JS) and development (TS) modes
 */
async function startServer() {
  try {
    console.log(`Starting server in ${process.env.NODE_ENV || 'development'} mode`);
    console.log(`Loading server from: ${serverIndex}`);
    
    // For production, use standard require
    if (process.env.NODE_ENV === 'production') {
      require(serverIndex);
    } 
    // For development, use tsx to run TypeScript directly
    else {
      // Check if we have tsx available
      try {
        // Use dynamic import to allow ESM modules
        const { importTsModule } = await import('./server/ts-import-helper.js');
        await importTsModule(serverIndex);
      } catch (e) {
        console.error('Failed to import TypeScript module:', e);
        
        // Fallback to tsx command line
        const { spawn } = require('child_process');
        const child = spawn('npx', ['tsx', serverIndex], { stdio: 'inherit' });
        
        // Handle process termination properly
        child.on('close', (code) => {
          console.log(`Server process exited with code ${code}`);
          process.exit(code);
        });
        
        // Forward signals to child process
        process.on('SIGINT', () => child.kill('SIGINT'));
        process.on('SIGTERM', () => child.kill('SIGTERM'));
      }
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();