import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
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