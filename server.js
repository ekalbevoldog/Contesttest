// Production server entry point with enhanced error handling and fallback mechanisms
// This script handles TypeScript compilation issues during deployment
// by providing multiple fallback options to load the server

// Set production mode
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Configure error reporting
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught exception:', err);
  // Don't exit process for uncaught exceptions in production
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled rejection at:', promise, 'reason:', reason);
  // Don't exit process for unhandled rejections in production
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

// Load environment variables from multiple possible locations
try {
  // Try to load from .env files in various locations
  const dotenv = require('dotenv');
  
  // Order of priority (later overrides earlier)
  const envFiles = [
    '.env',                   // Root directory
    '.env.production',        // Root production config
    './dist/.env',            // Dist directory
    './dist/.env.production'  // Dist production config
  ];
  
  envFiles.forEach(file => {
    try {
      const result = dotenv.config({ path: file });
      if (result.parsed) {
        console.log(`Loaded environment from ${file}`);
      }
    } catch (e) {
      // Silently ignore missing env files
    }
  });
  
  console.log('Environment loading complete. NODE_ENV =', process.env.NODE_ENV);
} catch (error) {
  console.warn('Warning: dotenv could not be loaded', error.message);
}

// Handle port for various deployment platforms
const PORT = process.env.PORT || 5000;
if (PORT !== 5000) {
  console.log(`Note: Using PORT=${PORT} from environment`);
}

// Database URL check
if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is not set. Database functions will not work correctly.');
}

// Verify database connectivity before starting server
async function checkDatabaseConnection() {
  try {
    console.log('Verifying database connection...');
    const { Pool } = require('pg');
    const pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      max: 1,
      idleTimeoutMillis: 5000,
      connectionTimeoutMillis: 5000,
    });
    
    const client = await pool.connect();
    console.log('Database connection successful!');
    client.release();
    await pool.end();
    return true;
  } catch (error) {
    console.error('WARNING: Database connection failed:', error.message);
    console.error('The server will still start, but database functionality may not work.');
    return false;
  }
}

// Only check in production to avoid slowing down development
if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
  checkDatabaseConnection().catch(err => {
    console.error('Database pre-check failed:', err.message);
  });
}

// Try different ways to start the server with fallbacks
console.log('Starting server in production mode...');

// Return true if successful, false if failed
function tryRequire(path) {
  try {
    require(path);
    return true;
  } catch (error) {
    console.error(`Failed to load ${path}:`, error.message);
    return false;
  }
}

// Try multiple loading strategies in order of preference
const strategies = [
  // Strategy 1: Regular compiled JavaScript
  () => {
    console.log('Trying to load compiled JavaScript...');
    return tryRequire('./dist/server/index.js');
  },
  
  // Strategy 2: Server-ts.js fallback (when TypeScript compilation failed)
  () => {
    console.log('Trying fallback ts-node loader...');
    return tryRequire('./dist/server-ts.js');
  },
  
  // Strategy 3: Direct ts-node usage
  () => {
    console.log('Trying direct ts-node compilation...');
    try {
      // Dynamically load ts-node and register it
      require('ts-node').register({
        transpileOnly: true,
        compilerOptions: {
          module: 'commonjs',
        },
      });
      
      // Load the original TypeScript entry point
      require('./server/index.ts');
      return true;
    } catch (error) {
      console.error('Failed with direct ts-node:', error.message);
      return false;
    }
  }
];

// Try each strategy in order until one succeeds
let started = false;
for (const strategy of strategies) {
  started = strategy();
  if (started) {
    console.log('Server started successfully.');
    break;
  }
}

if (!started) {
  console.error('All server startup strategies failed.');
  console.error('Please rebuild the application or check the server code.');
  process.exit(1);
}