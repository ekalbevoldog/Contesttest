import { drizzle } from 'drizzle-orm/postgres-js';
import { supabase } from './supabase';
import * as schema from "@shared/schema";

if (!process.env.SUPABASE_URL) {
  console.error("SUPABASE_URL environment variable is not set");
  if (process.env.NODE_ENV === 'production') {
    throw new Error("SUPABASE_URL must be set");
  }
}

// Initialize Drizzle with Supabase's underlying Postgres connection
export const db = drizzle(supabase.connectionString, { schema });

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