/**
 * Simple server starter script
 * Acts as a wrapper around tsx server/index.ts
 */

import { spawnSync, spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

console.log('Starting server...');

// First check if tsx is available
try {
  spawnSync('npx', ['--version'], { stdio: 'ignore' });
} catch (error) {
  console.error('Error: npx is not available. Make sure Node.js is installed correctly.');
  process.exit(1);
}

// Start the server using tsx
const server = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  env: { ...process.env, PORT: '3002' }
});

// Handle server process events
server.on('error', (error) => {
  console.error(`Server start error: ${error.message}`);
  process.exit(1);
});

// Handle clean shutdown
const shutdown = () => {
  console.log('Shutting down server...');
  server.kill();
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);