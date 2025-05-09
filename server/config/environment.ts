/** 05/08/2025 - 1PM CST
 * Claude
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
  // Load base .env file
  dotenv.config({ path: path.join(rootDir, '.env') });

  // Load environment-specific .env file
  const nodeEnv = process.env.NODE_ENV || 'development';
  const envFile = path.join(rootDir, `.env.${nodeEnv}`);
  if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile });
  }

  // Load local override .env file
  const localEnvFile = path.join(rootDir, '.env.local');
  if (fs.existsSync(localEnvFile)) {
    dotenv.config({ path: localEnvFile });
  }
}

// Load environment variables
loadEnvFiles();

// Environment configuration with defaults
interface Config {
  // Server configuration
  PORT: number;
  HOST: string;
  NODE_ENV: string;
  isDevelopment: boolean;
  isProduction: boolean;

  // Database configuration
  DATABASE_URL: string;

  // Session configuration
  SESSION_SECRET: string;
  SESSION_TTL: number; // Time to live in seconds

  // API configuration
  API_URL: string;
  SERVER_URL: string;

  // Supabase configuration
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_PUBLIC_KEY: string;
  SUPABASE_SERVICE_KEY: string;

  // Object storage configuration
  OBJECT_STORAGE_BUCKET: string;

  // App version
  VERSION: string;

  // Stripe configuration
  STRIPE_SECRET_KEY: string;
  STRIPE_PUBLIC_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;

  // Logging configuration
  LOG_LEVEL: string;

  // Feature flags
  ENABLE_WEBSOCKETS: boolean;
  ENABLE_ANALYTICS: boolean;
}

export const config: Config = {
  // Server configuration
  PORT: parseInt(process.env.PORT || '3001', 10), // Changed from 3000 to 3001
  HOST: process.env.HOST || '0.0.0.0',
  NODE_ENV: process.env.NODE_ENV || 'development',
  isDevelopment: (process.env.NODE_ENV !== 'production'),
  isProduction: (process.env.NODE_ENV === 'production'),

  // Database configuration
  DATABASE_URL: process.env.DATABASE_URL || '',

  // Session configuration
  SESSION_SECRET: process.env.SESSION_SECRET || 'contested-app-secret',
  SESSION_TTL: parseInt(process.env.SESSION_TTL || '86400', 10), // 24 hours default

  // API configuration
  API_URL: process.env.API_URL || '',
  SERVER_URL: process.env.SERVER_URL || '',

  // Supabase configuration
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  SUPABASE_PUBLIC_KEY: process.env.SUPABASE_PUBLIC_KEY || '',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || '',

  // Object storage configuration
  OBJECT_STORAGE_BUCKET: process.env.OBJECT_STORAGE_BUCKET || '',

  // App version
  VERSION: process.env.npm_package_version || '1.0.0',

  // Stripe configuration
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',

  // Logging configuration
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  // Feature flags
  ENABLE_WEBSOCKETS: process.env.ENABLE_WEBSOCKETS !== 'false',
  ENABLE_ANALYTICS: process.env.ENABLE_ANALYTICS === 'true'
};

// Validate critical configuration
function validateConfig() {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Required for all environments
  if (!config.SESSION_SECRET || config.SESSION_SECRET === 'contested-app-secret') {
    warnings.push('Using default SESSION_SECRET. Set a unique value in production.');
  }

  // Required only in production
  if (config.isProduction) {
    if (!config.SUPABASE_URL) errors.push('SUPABASE_URL is required in production');
    if (!config.SUPABASE_ANON_KEY && !config.SUPABASE_PUBLIC_KEY) {
      errors.push('Either SUPABASE_ANON_KEY or SUPABASE_PUBLIC_KEY is required in production');
    }
    if (!config.SUPABASE_SERVICE_KEY) {
      warnings.push('SUPABASE_SERVICE_KEY is missing. Some admin operations will be limited.');
    }
    if (!config.STRIPE_SECRET_KEY) {
      warnings.push('STRIPE_SECRET_KEY is missing. Payment features will be disabled.');
    }
  }

  // Log warnings and errors
  warnings.forEach(warning => console.warn(`⚠️ Config Warning: ${warning}`));
  if (errors.length > 0) {
    errors.forEach(error => console.error(`❌ Config Error: ${error}`));
    throw new Error('Invalid configuration. Check server logs for details.');
  }
}

// Validate config if not in test environment
if (process.env.NODE_ENV !== 'test') {
  validateConfig();
}

export default config;