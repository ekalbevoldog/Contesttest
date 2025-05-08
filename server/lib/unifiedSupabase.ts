/**
 * Unified Supabase Client
 * 
 * This module provides centralized access to all Supabase functionality:
 * - Authentication client
 * - Database client with admin capabilities
 * - Postgres raw client
 * - Drizzle ORM integration
 * - Consistent error handling
 * 
 * IMPORTANT: Use this module for all Supabase operations to ensure consistency
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../shared/schema';
import config from '../config/environment';

// Validate required environment variables from config
const supabaseUrl = config.SUPABASE_URL;
const supabaseAnonKey = config.SUPABASE_ANON_KEY || config.SUPABASE_PUBLIC_KEY;
const supabaseServiceKey = config.SUPABASE_SERVICE_KEY;
const databaseUrl = config.DATABASE_URL;

// Validate essential configuration
if (!supabaseUrl) {
  throw new Error('SUPABASE_URL environment variable is required');
}
if (!supabaseAnonKey) {
  throw new Error('SUPABASE_ANON_KEY environment variable is required');
}
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Log warning if service key is missing (some admin operations will fail)
if (!supabaseServiceKey) {
  console.warn('SUPABASE_SERVICE_KEY environment variable is missing. Admin operations will be limited.');
}

/**
 * Singleton instances to ensure we only create these once
 */
let supabaseInstance: SupabaseClient | null = null;
let supabaseAdminInstance: SupabaseClient | null = null;
let pgClientInstance: ReturnType<typeof postgres> | null = null;
let drizzleDbInstance: any = null;

/**
 * SQL template tag for creating parameterized queries
 */
export function sql(strings: TemplateStringsArray, ...values: any[]) {
  const text = strings.reduce((result, str, i) => {
    return result + '$' + i + str;
  }).replace('$0', '');
  
  return {
    text,
    values,
    /**
     * Execute this SQL query directly
     */
    execute: async () => {
      const client = getPgClient();
      const result = await client.unsafe(text, ...values);
      return result;
    }
  };
}

/**
 * Get the standard Supabase client
 * Uses the anon key for authentication and user-level operations
 */
export function getSupabase(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance;
  }
  
  supabaseInstance = createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      autoRefreshToken: true,
      persistSession: true
    },
    // Disable realtime by default to reduce connections
    realtime: {
      params: {
        eventsPerSecond: 0
      }
    },
    global: {
      headers: {
        'X-Client-Info': 'server-connect'
      }
    }
  });
  
  console.log('✅ Supabase client initialized');
  return supabaseInstance;
}

/**
 * Get the Supabase admin client
 * Uses the service role key for admin-level operations
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (supabaseAdminInstance) {
    return supabaseAdminInstance;
  }
  
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_KEY is required for admin operations');
  }
  
  supabaseAdminInstance = createClient(supabaseUrl!, supabaseServiceKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true
    },
    // Disable realtime by default to reduce connections
    realtime: {
      params: {
        eventsPerSecond: 0
      }
    },
    global: {
      headers: {
        'X-Client-Info': 'server-admin-connect'
      }
    }
  });
  
  console.log('✅ Supabase admin client initialized');
  return supabaseAdminInstance;
}

/**
 * Get the raw postgres client
 * This provides direct access to perform raw SQL queries
 */
export function getPgClient() {
  if (pgClientInstance) {
    return pgClientInstance;
  }
  
  pgClientInstance = postgres(databaseUrl!, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    ssl: databaseUrl!.includes('localhost') ? false : 'require',
    prepare: false // For better Supabase compatibility
  });
  
  console.log('✅ PostgreSQL client initialized');
  return pgClientInstance;
}

/**
 * Get the database instance with Drizzle ORM
 * @returns The database instance with extended functionality
 */
export function getDb() {
  if (drizzleDbInstance) {
    return drizzleDbInstance;
  }
  
  try {
    // Get the PostgreSQL client
    const client = getPgClient();
    
    // Create a new Drizzle ORM instance
    const db = drizzle(client, { schema });
    
    // Create an enhanced DB instance with execute method for raw SQL
    drizzleDbInstance = {
      ...db,
      execute: async (query: ReturnType<typeof sql>) => {
        return await query.execute();
      },
      query: {
        // Add placeholder query namespace to satisfy TypeScript
        // This will be populated by Drizzle with actual table queries
        ...db.query
      }
    };
    
    console.log('✅ Drizzle ORM initialized');
    return drizzleDbInstance;
  } catch (error) {
    console.error('❌ Drizzle ORM initialization error:', error);
    throw error;
  }
}

/**
 * Helper function to handle database errors consistently
 */
export const handleDatabaseError = (error: any) => {
  console.error('Database error:', error);
  return {
    error: {
      message: error.message || 'Database operation failed',
      details: error.details || null,
      code: error.code || 'DB_ERROR',
    }
  };
};

/**
 * Check database connection health
 */
export async function checkDbConnection() {
  try {
    const client = getPgClient();
    const result = await client.unsafe('SELECT NOW() as now');
    return {
      status: 'connected',
      timestamp: result[0]?.now || new Date().toISOString(),
    };
  } catch (error) {
    console.error('❌ Database connection check failed:', error);
    return {
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Check Supabase auth connection
 */
export async function checkSupabaseAuth() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      throw error;
    }
    
    return {
      status: 'connected',
      message: 'Supabase auth connection successful'
    };
  } catch (error) {
    console.error('❌ Supabase auth check failed:', error);
    return {
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Close all database connections
 * Call this during application shutdown
 */
export async function closeConnections() {
  if (pgClientInstance) {
    try {
      await pgClientInstance.end();
      pgClientInstance = null;
      drizzleDbInstance = null;
      console.log('✅ PostgreSQL connection closed');
    } catch (error) {
      console.error('❌ Error closing PostgreSQL connection:', error);
    }
  }
  
  // Reset Supabase clients (they don't need explicit closing)
  supabaseInstance = null;
  supabaseAdminInstance = null;
  console.log('✅ Supabase clients reset');
}

// Export commonly used instances directly
export const supabase = getSupabase();
export const supabaseAdmin = supabaseServiceKey ? getSupabaseAdmin() : null;
export const db = getDb();