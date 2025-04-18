import * as schema from "../shared/schema";
import { supabase } from "./supabase";
import pg from 'pg';

console.log("Using Supabase and PostgreSQL for storage and authentication");

// Create a PostgreSQL connection pool
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test the pool connection
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});

// Export a function to check the database connection
export async function testConnection() {
  try {
    // Test direct PostgreSQL connection
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      console.log("Successfully connected to PostgreSQL database");
      
      // Test Supabase connection as well
      const { data, error } = await supabase.from('sessions').select('count').limit(1);
      
      if (error && error.code !== '42P01') { // Ignore table doesn't exist errors
        console.error("Supabase connection error:", error.message);
        return false;
      }
      
      console.log("Successfully connected to Supabase");
      return true;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Database connection error:", error);
    return false;
  }
}