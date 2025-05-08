/** 05/08/2025 - 1:05pm CST
 * Unified Supabase Client
 * 
 * This module provides a single, consistent interface for all Supabase operations.
 * It handles authentication, database access, and storage operations.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import config from '../config/environment';

// Type definitions for better type safety
export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceKey?: string;
}

// Create configuration object
const supabaseConfig: SupabaseConfig = {
  url: config.SUPABASE_URL,
  anonKey: config.SUPABASE_ANON_KEY || config.SUPABASE_PUBLIC_KEY,
  serviceKey: config.SUPABASE_SERVICE_KEY,
};

// Initialize clients
let supabaseInstance: SupabaseClient | null = null;
let supabaseAdminInstance: SupabaseClient | null = null;

/**
 * Get the standard Supabase client (with anon key)
 */
export function getSupabase(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance;

  if (!supabaseConfig.url || !supabaseConfig.anonKey) {
    throw new Error('Missing Supabase configuration. SUPABASE_URL and SUPABASE_ANON_KEY are required.');
  }

  supabaseInstance = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true
    },
    global: {
      headers: {
        'X-Client-Info': 'unifiedSupabase'
      }
    }
  });

  return supabaseInstance;
}

/**
 * Get the admin Supabase client (with service role key)
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (supabaseAdminInstance) return supabaseAdminInstance;

  if (!supabaseConfig.url || !supabaseConfig.serviceKey) {
    throw new Error('Missing Supabase admin configuration. SUPABASE_URL and SUPABASE_SERVICE_KEY are required.');
  }

  supabaseAdminInstance = createClient(supabaseConfig.url, supabaseConfig.serviceKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true
    },
    global: {
      headers: {
        'X-Client-Info': 'unifiedSupabaseAdmin'
      }
    }
  });

  return supabaseAdminInstance;
}

/**
 * Execute raw SQL query with proper error handling
 */
export async function executeSQL(sql: string, params: any[] = []): Promise<any> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql,
      params: params 
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error executing SQL:', error);
    throw error;
  }
}

/**
 * SQL template tag for creating parameterized queries
 */
export function sql(strings: TemplateStringsArray, ...values: any[]) {
  // Build the query with placeholders
  const text = strings.reduce((result, str, i) => {
    return result + '$' + i + str;
  });

  return {
    text,
    values,
    /**
     * Execute this SQL query
     */
    async execute() {
      return await executeSQL(text, values);
    }
  };
}

/**
 * Helper function to handle database errors consistently
 */
export function handleDatabaseError(error: any) {
  console.error('Database error:', error);

  // Create a standardized error response
  return {
    error: {
      message: error.message || 'Database operation failed',
      details: error.details || null,
      code: error.code || 'DB_ERROR',
    }
  };
}

/**
 * Check database connection health
 */
export async function checkDbConnection() {
  try {
    const result = await executeSQL('SELECT NOW() as now');
    return {
      status: 'connected',
      timestamp: result[0]?.now || new Date().toISOString(),
    };
  } catch (error) {
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
  // Reset client instances
  supabaseInstance = null;
  supabaseAdminInstance = null;
  console.log('Database connections closed');
}

// Export commonly used instances directly for convenience
export const supabase = getSupabase();
export const supabaseAdmin = supabaseConfig.serviceKey ? getSupabaseAdmin() : null;

export default {
  supabase,
  supabaseAdmin,
  executeSQL,
  sql,
  handleDatabaseError,
  checkDbConnection,
  closeConnections
};