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
import http from 'http';

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
  
  // Verify authentication-related files
  const authFiles = [
    { path: 'server/routes/authRoutes.ts', name: 'Auth routes' },
    { path: 'server/controllers/authController.ts', name: 'Auth controller' },
    { path: 'server/middleware/auth.ts', name: 'Auth middleware' }
  ];
  
  log('\n🔐 Checking authentication files...', colors.cyan);
  for (const file of authFiles) {
    if (!fs.existsSync(resolve(__dirname, file.path))) {
      log(`⚠️ Warning: ${file.name} (${file.path}) not found!`, colors.yellow);
    } else {
      log(`✅ ${file.name} found`, colors.green);
    }
  }
}

// Check server health
function checkServerHealth(port, maxRetries = 30, delay = 1000) {
  return new Promise((resolve, reject) => {
    let retries = 0;
    
    const check = () => {
      const req = http.request(
        {
          hostname: 'localhost',
          port: port,
          path: '/health',
          method: 'GET',
          timeout: 1000,
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            if (res.statusCode === 200) {
              log(`✅ Server is healthy and responding on port ${port}`, colors.green);
              resolve(true);
            } else {
              retryHealthCheck();
            }
          });
        }
      );
      
      req.on('error', () => retryHealthCheck());
      req.on('timeout', () => {
        req.destroy();
        retryHealthCheck();
      });
      
      req.end();
    };
    
    const retryHealthCheck = () => {
      retries++;
      if (retries >= maxRetries) {
        log(`❌ Server health check failed after ${maxRetries} attempts`, colors.red);
        reject(new Error('Server health check timeout'));
        return;
      }
      
      setTimeout(check, delay);
    };
    
    check();
  });
}

// Start development server
function startDevelopment() {
  log('Starting development environment...', colors.cyan);
  
  // Set server port
  const PORT = process.env.PORT || '5001';
  
  // Start the server with tsx
  log('\n📡 Starting server on port ' + PORT + '...', colors.yellow);
  const server = spawn('npx', ['tsx', 'server/index.ts'], {
    stdio: 'inherit',
    env: { ...process.env, PORT, DEBUG: 'true', NODE_ENV: 'development' }
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
  
  // Check server health after a brief startup period
  setTimeout(() => {
    log('\n🔍 Checking server health...', colors.cyan);
    checkServerHealth(PORT)
      .then(() => {
        log('\n🔐 Testing authentication routes...', colors.cyan);
        log('To test authentication manually, visit: http://localhost:' + PORT + '/auth-test.html', colors.green);
        
        // Log available routes
        log('\n📋 Available API Routes:', colors.cyan);
        log('  - GET    /api/status           - API status check', colors.reset);
        log('  - GET    /api/auth/user        - Get current user', colors.reset);
        log('  - POST   /api/auth/login       - User login', colors.reset);
        log('  - POST   /api/auth/register    - User registration', colors.reset);
        log('  - POST   /api/auth/logout      - User logout', colors.reset);
        log('  - GET    /health               - Server health check', colors.reset);
        log('  - WS     /ws                   - WebSocket connection', colors.reset);
      })
      .catch(error => {
        log(`\n⚠️ ${error.message}`, colors.yellow);
        log('The server might still be starting up. You can try accessing it manually.', colors.reset);
      });
  }, 3000);
  
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