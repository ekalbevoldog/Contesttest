/**
 * Database Setup
 * 
 * Centralized database connection management for Supabase.
 * Implements connection pooling and proper error handling.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Client instance that will be reused
let pgClient: ReturnType<typeof postgres> | null = null;

// Database instance that will be reused
let dbInstance: any = null;

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
 * Get the raw postgres client
 * This provides direct access to perform raw SQL queries
 */
function getPgClient() {
  if (pgClient) {
    return pgClient;
  }
  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }
  
  pgClient = postgres(databaseUrl, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    ssl: databaseUrl.includes('localhost') ? false : 'require',
    prepare: false // For better Supabase compatibility
  });
  
  return pgClient;
}

/**
 * Get the database instance with Drizzle ORM
 * @returns The database instance with extended functionality
 */
export function getDb() {
  if (dbInstance) {
    return dbInstance;
  }
  
  try {
    // Get the PostgreSQL client
    const client = getPgClient();
    
    // Create a new Drizzle ORM instance
    const db = drizzle(client, { schema });
    
    // Create an enhanced DB instance with execute method for raw SQL
    dbInstance = {
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
    
    console.log('✅ Database connection established');
    return dbInstance;
  } catch (error) {
    console.error('❌ Database connection error:', error);
    throw error;
  }
}

/**
 * Check database connection health
 * @returns Object with connection status
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
    return {
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Close database connection
 * Call this during application shutdown
 */
export async function closeDbConnection() {
  if (pgClient) {
    try {
      await pgClient.end();
      pgClient = null;
      dbInstance = null;
      console.log('✅ Database connection closed');
    } catch (error) {
      console.error('❌ Error closing database connection:', error);
    }
  }
}