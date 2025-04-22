
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from "@shared/schema";
import { supabase } from './supabase';

if (!process.env.SUPABASE_URL) {
  console.error("SUPABASE_URL environment variable is not set");
  if (process.env.NODE_ENV === 'production') {
    throw new Error("SUPABASE_URL must be set");
  }
}

// Get the connection string from Supabase config
const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_URL;

// Create a Postgres client
const client = postgres(connectionString, { 
  max: 1,
  ssl: 'require'
});

// Initialize Drizzle with the Postgres client
export const db = drizzle(client, { schema });

// Export a function to check the database connection
export async function testConnection() {
  try {
    if (!db) {
      console.error("Database connection not initialized yet");
      return false;
    }

    // Simple test query using Drizzle
    const result = await db.select().from(schema.users).limit(1);
    console.log("Successfully connected to Supabase database with Drizzle ORM");
    return true;
  } catch (error) {
    console.error("Database connection error:", error);
    return false;
  }
}
