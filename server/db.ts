import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Set DATABASE_URL from Supabase if available
let dbConnectionUrl = process.env.DATABASE_URL;

// Check for Supabase Database URL
if (process.env.SUPABASE_DATABASE_URL) {
  console.log('📦 Using Supabase PostgreSQL database connection');
  dbConnectionUrl = process.env.SUPABASE_DATABASE_URL;
} else if (!dbConnectionUrl) {
  console.warn('⚠️ No DATABASE_URL or SUPABASE_DATABASE_URL environment variable is set');
  console.warn('⚠️ Application will use in-memory storage as fallback');
}

// Create SQL connection
let sql: any;
try {
  if (dbConnectionUrl) {
    sql = neon(dbConnectionUrl);
    console.log('🔌 SQL connection initialized successfully');
  } else {
    console.warn('⚠️ No database URL available, SQL connection not initialized');
  }
} catch (error) {
  console.error('❌ Failed to initialize SQL connection:', error);
}

// Create Drizzle ORM instance if SQL is available
export const db = sql ? drizzle(sql, { 
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
    // Simple query to check if the database is accessible
    const result = await sql`SELECT 1 as connected`;
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
    // Get PostgreSQL version
    const versionResult = await sql`SELECT version()`;
    const version = versionResult[0]?.version || 'Unknown';
    
    // Get current timestamp from database to check latency
    const timeResult = await sql`SELECT NOW() as current_time`;
    const dbTime = timeResult[0]?.current_time || null;
    
    // Get the number of tables in the public schema
    const tablesResult = await sql`
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