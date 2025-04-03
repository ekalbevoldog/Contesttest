import { drizzle } from "drizzle-orm/neon-serverless";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import * as schema from "../shared/schema";

// Initialize the connection to the database
const sql: NeonQueryFunction<boolean, boolean> = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql as any, { schema });

// Export a function to check the database connection
export async function testConnection() {
  try {
    // Simple query to check the connection
    const result = await sql`SELECT 1 as connected`;
    
    // Safe access of the result with type checking
    if (Array.isArray(result) && result.length > 0) {
      const firstRow = result[0] as Record<string, any>;
      return firstRow.connected === 1;
    }
    return false;
  } catch (error) {
    console.error("Database connection error:", error);
    return false;
  }
}