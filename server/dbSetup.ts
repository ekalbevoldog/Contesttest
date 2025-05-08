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

// Type for connection pool
interface ConnectionPool {
  client: ReturnType<typeof postgres>;
  db: ReturnType<typeof drizzle>;
  isConnected: boolean;
}

// Create a singleton connection pool
let connectionPool: ConnectionPool | null = null;

/**
 * Get database connection with proper connection pooling
 * @returns Database connection from pool
 */
export function getDb() {
  if (connectionPool && connectionPool.isConnected) {
    return connectionPool.db;
  }

  // Validate DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  try {
    // Create connection
    const client = postgres(databaseUrl, {
      max: 10, // Maximum number of connections
      idle_timeout: 20, // Max idle time in seconds
      connect_timeout: 10, // Connect timeout in seconds
      prepare: false, // For better Supabase compatibility
    });

    // Create drizzle instance
    const db = drizzle(client, { schema });

    // Update connection pool
    connectionPool = {
      client,
      db,
      isConnected: true
    };

    console.log('✅ Database connection established');
    return connectionPool.db;
  } catch (error) {
    console.error('❌ Database connection error:', error);
    connectionPool = null;
    throw error;
  }
}

/**
 * Check database connection health
 * @returns Object with connection status
 */
export async function checkDbConnection() {
  try {
    const db = getDb();
    const result = await db.execute(sql`SELECT NOW()`);
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
 * Close database connection (useful for graceful shutdown)
 */
export async function closeDbConnection() {
  if (connectionPool && connectionPool.client) {
    try {
      await connectionPool.client.end();
      connectionPool.isConnected = false;
      console.log('✅ Database connection closed');
    } catch (error) {
      console.error('❌ Error closing database connection:', error);
    }
  }
}

// Create SQL helper for raw queries
export const sql = postgres.sql;