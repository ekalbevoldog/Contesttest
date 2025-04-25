import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "../shared/schema.js";

// Check for database URL
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create a PostgreSQL pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create Drizzle ORM instance
export const db = drizzle(pool, { schema });

// Test connection function
export async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to PostgreSQL database');
    client.release();
    return true;
  } catch (error) {
    console.error('Failed to connect to PostgreSQL database:', error);
    return false;
  }
}

// Create essential tables if they don't exist
export async function createEssentialTables() {
  try {
    console.log('Creating essential database tables...');
    
    // Execute the SQL to create tables
    // This will be replaced with proper Drizzle migrations
    await pool.query(`
      -- Create users table if it doesn't exist
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        last_login TIMESTAMP,
        auth_id VARCHAR(255)
      );
      
      -- Create sessions table if it doesn't exist
      CREATE TABLE IF NOT EXISTS sessions (
        sid VARCHAR(255) PRIMARY KEY,
        sess TEXT NOT NULL,
        expire TIMESTAMP NOT NULL
      );
      
      -- Create indexes
      CREATE INDEX IF NOT EXISTS email_idx ON users (email);
      CREATE INDEX IF NOT EXISTS username_idx ON users (username);
      CREATE INDEX IF NOT EXISTS expire_idx ON sessions (expire);
    `);
    
    console.log('Essential tables created successfully');
    return true;
  } catch (error) {
    console.error('Error creating essential tables:', error);
    return false;
  }
}