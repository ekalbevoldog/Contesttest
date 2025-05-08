/**
 * Environment Configuration
 * 
 * Centralizes all environment variable access and provides defaults
 * to ensure consistent configuration across all environments.
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get directory path in ESM context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

// Load environment variables from all potential .env files
// Priority: .env.local > .env.[environment] > .env
function loadEnvFiles() {
  dotenv.config({ path: path.join(rootDir, '.env') });
  
  const nodeEnv = process.env.NODE_ENV || 'development';
  const envFile = path.join(rootDir, `.env.${nodeEnv}`);
  if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile });
  }
  
  const localEnvFile = path.join(rootDir, '.env.local');
  if (fs.existsSync(localEnvFile)) {
    dotenv.config({ path: localEnvFile });
  }
}

// Load environment variables
loadEnvFiles();

// Environment configuration with defaults
export const config = {
  // Server configuration
  PORT: parseInt(process.env.PORT || process.env.REPLIT_PORT || '3000', 10),
  HOST: process.env.HOST || '0.0.0.0',
  NODE_ENV: process.env.NODE_ENV || 'development',
  isDevelopment: (process.env.NODE_ENV !== 'production'),
  isProduction: (process.env.NODE_ENV === 'production'),
  
  // Database configuration
  DATABASE_URL: process.env.DATABASE_URL || '',
  
  // Session configuration
  SESSION_SECRET: process.env.SESSION_SECRET || 'contested-app-secret',
  
  // API configuration
  API_URL: process.env.API_URL || '',
  SERVER_URL: process.env.SERVER_URL || '',
  
  // Supabase configuration
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_PUBLIC_KEY: process.env.SUPABASE_PUBLIC_KEY || process.env.SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || '',
  
  // Object storage configuration
  OBJECT_STORAGE_BUCKET: process.env.REPLIT_OBJECT_STORAGE_BUCKET || process.env.OBJECT_STORAGE_BUCKET || '',
  
  // App version
  VERSION: process.env.npm_package_version || '1.0.0',
  
  // Stripe configuration
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
};

// Export as default as well
export default config;