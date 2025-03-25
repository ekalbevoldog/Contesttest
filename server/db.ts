import { drizzle } from "drizzle-orm/neon-serverless";
import { neon } from "@neondatabase/serverless";
import * as schema from "../shared/schema";

// Initialize the connection to the database
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });

// Export a function to check the database connection
export async function testConnection() {
  try {
    // Simple query to check the connection
    const result = await sql`SELECT 1 as connected`;
    return result[0].connected === 1;
  } catch (error) {
    console.error("Database connection error:", error);
    return false;
  }
}