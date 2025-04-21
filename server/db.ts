import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon for WebSocket support
neonConfig.webSocketConstructor = ws;

// Ensure DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set");
  // In production, we'll throw an error
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }
}

// Create connection pool with proper configuration
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 5000, // How long to wait for a connection
});

// Initialize Drizzle ORM with our schema
export const db = drizzle(pool, { schema });

// Export a function to check the database connection
export async function testConnection() {
  try {
    // Simple test query using Drizzle
    const result = await db.select().from(schema.users).limit(1);
    console.log("Successfully connected to database with Drizzle ORM");
    return true;
  } catch (error) {
    console.error("Database connection error:", error);
    return false;
  }
}