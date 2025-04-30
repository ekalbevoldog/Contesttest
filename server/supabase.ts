import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { logger } from './logger.js';

dotenv.config();

const supabaseUrl        = process.env.SUPABASE_URL!;
const supabaseAnonKey    = process.env.SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create Supabase clients with realtime disabled to prevent WebSocket connections
const options = {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  },
  // Explicitly disable realtime to prevent WebSocket connection attempts
  realtime: {
    params: {
      eventsPerSecond: 0
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'server-supabase-client'
    }
  }
};

// Create PostgreSQL pool for direct SQL queries
const databaseUrl = process.env.DATABASE_URL;
const pool = databaseUrl ? new Pool({ connectionString: databaseUrl }) : null;

// Add query method to Supabase client
const createClientWithQuery = (url: string, key: string, opts: any) => {
  const client = createClient(url, key, opts);
  
  // Add query method for direct SQL execution
  return {
    ...client,
    query: async (text: string, params?: any[]) => {
      if (!pool) {
        logger.error('PostgreSQL pool not initialized - check DATABASE_URL environment variable');
        throw new Error('Database connection not available');
      }
      
      try {
        logger.debug('Running SQL query via Supabase: \n      ' + text.replace(/\s+/g, ' ').trim());
        const result = await pool.query(text, params);
        return { rows: result.rows, rowCount: result.rowCount };
      } catch (error) {
        logger.error('SQL query error:', error);
        throw error;
      }
    }
  };
};

// Public client with anon key
export const supabase = createClientWithQuery(supabaseUrl, supabaseAnonKey, options);

// Admin client with service role key
export const supabaseAdmin = createClientWithQuery(supabaseUrl, supabaseServiceKey, options);

logger.info('[Server] Supabase clients initialized with realtime DISABLED');

// Notify if DB connection is missing
if (!databaseUrl) {
  logger.warn('[Server] DATABASE_URL not set - direct SQL queries will not work');
} else {
  // Test database connection
  pool?.query('SELECT NOW()')
    .then(() => logger.info('Successfully connected to Supabase database'))
    .catch(err => logger.error('Failed to connect to database:', err));
}
