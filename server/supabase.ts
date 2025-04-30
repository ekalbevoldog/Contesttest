import { createClient } from '@supabase/supabase-js';
import { logger } from './logger.js';
import pg from 'pg';

// Get Supabase URL and key from environment variables
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  logger.warn('Supabase credentials not found in environment variables');
}

// PostgreSQL connection pool (for direct SQL queries)
let pool: pg.Pool | null = null;

// Initialize PostgreSQL pool if DATABASE_URL is available
if (process.env.DATABASE_URL) {
  try {
    pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    
    // Test the connection
    pool.query('SELECT NOW()')
      .then(() => logger.info('PostgreSQL pool initialized successfully'))
      .catch(err => logger.error('Error initializing PostgreSQL pool:', err));
  } catch (error) {
    logger.error('Failed to initialize PostgreSQL pool:', error);
    pool = null;
  }
} else {
  logger.error('PostgreSQL pool not initialized - check DATABASE_URL environment variable');
}

// Create Supabase clients
const options = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  }
};

// Create Supabase client with anon key
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, options);

// Create Supabase client with service role key
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, options);

// Enhanced supabase client with query method for SQL
export interface EnhancedClient {
  query: (text: string, params?: any[]) => Promise<{ rows: any[], rowCount: number | null, error?: Error }>;
  auth: typeof supabaseClient.auth;
  realtime: typeof supabaseClient.realtime;
  from: typeof supabaseClient.from;
  rpc: typeof supabaseClient.rpc;
}

// Query function to unify the API between PostgreSQL and Supabase
async function executeQuery(text: string, params: any[] = []): Promise<{ rows: any[], rowCount: number | null, error?: Error }> {
  try {
    // If we have a PostgreSQL pool, use it for native SQL queries
    if (pool) {
      const result = await pool.query(text, params);
      return { rows: result.rows, rowCount: result.rowCount };
    }
    
    // Fall back to Supabase RPC if SQL function is available
    if (text.trim().toLowerCase().startsWith('select') || 
        text.trim().toLowerCase().startsWith('with')) {
      try {
        const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql: text, params });
        if (error) throw error;
        return { rows: data || [], rowCount: data?.length || 0 };
      } catch (rpcError) {
        logger.debug('RPC exec_sql not available, falling back to Supabase REST API');
      }
    }
    
    // Fall back to REST API for simple queries that match Supabase patterns
    if (text.trim().toLowerCase().startsWith('select * from')) {
      const tableName = text.trim().toLowerCase().split('from')[1].trim().split(/\s|;/)[0];
      let query = supabaseAdmin.from(tableName).select('*');
      
      // Apply basic where clause if it exists
      const whereMatch = text.match(/where\s+(.*?)(?:order by|group by|limit|$)/i);
      if (whereMatch) {
        const whereClause = whereMatch[1].trim();
        const conditions = whereClause.split(/\s+and\s+/i);
        
        for (const condition of conditions) {
          const [column, op, value] = condition.split(/\s*([=<>])\s*/);
          if (column && op === '=' && value) {
            // Remove quotes from string values
            const cleanValue = value.replace(/^['"]|['"]$/g, '');
            query = query.eq(column.trim(), cleanValue);
          }
        }
      }
      
      // Apply limit if it exists
      const limitMatch = text.match(/limit\s+(\d+)/i);
      if (limitMatch && limitMatch[1]) {
        query = query.limit(parseInt(limitMatch[1]));
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return { rows: data || [], rowCount: data?.length || 0 };
    }
    
    // For other queries, just log and return empty result
    logger.warn(`SQL query not supported with current setup: ${text}`);
    return { rows: [], rowCount: 0, error: new Error('Database connection not available') };
  } catch (error) {
    logger.error('Error executing query:', error);
    return { rows: [], rowCount: 0, error: error as Error };
  }
}

// Create enhanced client
export const supabase: EnhancedClient = {
  query: executeQuery,
  auth: supabaseClient.auth,
  realtime: supabaseClient.realtime,
  from: supabaseClient.from,
  rpc: supabaseClient.rpc
};