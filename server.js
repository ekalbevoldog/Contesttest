// This is a simple server entry point for production deployments
// It allows us to bypass TypeScript issues during deployment
// while still using the compiled JavaScript code

// Set production mode
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Load environment variables from multiple possible locations
try {
  // Try to load from .env file in the root directory
  require('dotenv').config();
  
  // Also try to load from the dist directory if we're running from there
  require('dotenv').config({ path: './dist/.env' });
  require('dotenv').config({ path: './dist/.env.production' });
  
  console.log('Environment loaded, NODE_ENV =', process.env.NODE_ENV);
} catch (error) {
  console.warn('Warning: dotenv could not be loaded', error.message);
}

// Handle port for various deployment platforms
const PORT = process.env.PORT || 5000;
if (PORT !== 5000) {
  console.log(`Note: Overriding default port 5000 with environment PORT=${PORT}`);
}

// Use the compiled files from the dist directory
try {
  require('./dist/server/index.js');
} catch (error) {
  console.error('Error starting server:', error);
  console.error('This could be due to missing compiled files. Try running the build script first.');
  process.exit(1);
}