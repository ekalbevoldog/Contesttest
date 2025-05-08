/**
 * Direct Server Starter
 * 
 * A direct, no-frills server launcher without any fallback mechanisms.
 * This simply executes the server/index.ts file directly using tsx.
 */

import { spawn } from 'child_process';
import dotenv from 'dotenv';
import net from 'net';

// Load environment variables
dotenv.config();

// Default port with fallbacks
let PORT = parseInt(process.env.PORT || process.env.REPLIT_PORT || '5000', 10);

// Check if a port is in use
function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true); // Port is in use
      } else {
        resolve(false); // Some other error
      }
    });
    
    server.once('listening', () => {
      // Close the server and return not in use
      server.close();
      resolve(false);
    });
    
    server.listen(port, '0.0.0.0');
  });
}

// Find an available port
async function findAvailablePort(startPort) {
  let port = startPort;
  
  while (await isPortInUse(port)) {
    console.log(`Port ${port} is in use, trying ${port + 1}`);
    port++;
    
    // Prevent infinite loop in extreme cases
    if (port > startPort + 100) {
      console.error('Could not find an available port after 100 attempts');
      process.exit(1);
    }
  }
  
  return port;
}

async function startServer() {
  try {
    // Find an available port
    PORT = await findAvailablePort(PORT);
    
    console.log(`Starting server on port ${PORT}`);
    
    // Prepare environment with explicit variables (no fallbacks)
    const serverEnv = {
      ...process.env,
      PORT: PORT.toString(),
      NODE_ENV: process.env.NODE_ENV || 'development',
      HOST: '0.0.0.0' // Always bind to all interfaces
    };
    
    // Launch the server directly using tsx
    const serverProcess = spawn('npx', ['tsx', 'server/index.ts'], {
      stdio: 'inherit',
      env: serverEnv
    });
    
    // Handle server process termination
    serverProcess.on('close', (code) => {
      console.log(`Server process exited with code ${code}`);
      process.exit(code);
    });
    
    // Forward termination signals
    process.on('SIGINT', () => serverProcess.kill('SIGINT'));
    process.on('SIGTERM', () => serverProcess.kill('SIGTERM'));
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();