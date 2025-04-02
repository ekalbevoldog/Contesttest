import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Set DATABASE_URL from environment variables
let dbConnectionUrl = process.env.DATABASE_URL;

// Check database connection URLs
if (dbConnectionUrl) {
  console.log('📦 Using DATABASE_URL for PostgreSQL connection');
} else {
  console.warn('⚠️ No DATABASE_URL environment variable is set');
  console.warn('⚠️ Application will use in-memory storage as fallback');
}

// Create SQL connection
let client: any;
try {
  if (dbConnectionUrl) {
    // Initialize postgres client
    client = postgres(dbConnectionUrl, { 
      max: 10, // Maximum number of connections
      idle_timeout: 30, // Idle timeout in seconds
      connect_timeout: 10, // Connection timeout in seconds
    });
    console.log('🔌 PostgreSQL connection initialized successfully');
  } else {
    console.warn('⚠️ No database URL available, SQL connection not initialized');
  }
} catch (error) {
  console.error('❌ Failed to initialize PostgreSQL connection:', error);
}

// Create Drizzle ORM instance if client is available
export const db = client ? drizzle(client, { 
  logger: process.env.NODE_ENV !== 'production',
}) : null;

// Maximum number of retry attempts for connection
const MAX_RETRY_ATTEMPTS = 3;
// Delay between retry attempts (in milliseconds)
const RETRY_DELAY = 2000;

/**
 * Tests the database connection with retry logic
 * @param retryCount Current retry attempt
 * @returns Promise resolving to a boolean indicating connection success
 */
export async function testConnection(retryCount = 0): Promise<boolean> {
  try {
    if (!client) {
      console.error('❌ Database client is not initialized');
      return false;
    }
    
    // Simple query to check if the database is accessible
    const result = await client`SELECT 1 as connected`;
    if (result[0]?.connected === 1) {
      if (retryCount > 0) {
        console.log(`✅ Database connection established after ${retryCount} retries`);
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Database connection failed (attempt ${retryCount + 1}/${MAX_RETRY_ATTEMPTS}):`, error);
    
    if (retryCount < MAX_RETRY_ATTEMPTS - 1) {
      console.log(`⏱️ Retrying in ${RETRY_DELAY / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return testConnection(retryCount + 1);
    }
    
    console.error('❌ Maximum retry attempts reached. Database connection failed.');
    return false;
  }
}

/**
 * Executes a database health check
 * @returns Promise resolving to an object with database health metrics
 */
export async function getDatabaseHealth() {
  try {
    if (!client) {
      throw new Error('Database client is not initialized');
    }
    
    // Get PostgreSQL version
    const versionResult = await client`SELECT version()`;
    const version = versionResult[0]?.version || 'Unknown';
    
    // Get current timestamp from database to check latency
    const timeResult = await client`SELECT NOW() as current_time`;
    const dbTime = timeResult[0]?.current_time || null;
    
    // Get the number of tables in the public schema
    const tablesResult = await client`
      SELECT COUNT(*) as table_count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    const tableCount = tablesResult[0]?.table_count || 0;
    
    return {
      status: 'healthy',
      version,
      timestamp: dbTime,
      tableCount,
      latency: null // Could add latency measurement if needed
    };
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Test Supabase connection health
 * @returns Promise resolving to connection status
 */
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    if (!client) {
      console.error('❌ Database client is not initialized');
      return false;
    }
    
    // Test query to verify connection and permissions
    const result = await client`
      SELECT current_user, current_database(), version() as version;
    `;
    
    console.log('✅ Supabase connection test successful:', {
      user: result[0].current_user,
      database: result[0].current_database,
      version: result[0].version
    });
    
    return true;
  } catch (error) {
    console.error('❌ Supabase connection test failed:', error);
    return false;
  }
}