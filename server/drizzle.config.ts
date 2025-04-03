// drizzle.config.ts
import type { Config } from "drizzle-kit";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Use Supabase database URL
const dbUrl = new URL(process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL || '');

if (!dbUrl.toString()) {
  console.error('⚠️ No SUPABASE_DATABASE_URL or DATABASE_URL environment variable is set');
  process.exit(1);
}

export default {
  schema: "./server/schema.ts",  // points to schema in server directory
  out: "./drizzle/migrations",   // folder for migration files
  dialect: "postgresql",         // the actual SQL dialect
  dbCredentials: {
    host: dbUrl.hostname,
    user: dbUrl.username, 
    password: dbUrl.password,
    database: dbUrl.pathname.substring(1), // remove leading '/'
    port: dbUrl.port ? parseInt(dbUrl.port) : 5432,
    ssl: dbUrl.searchParams.get('sslmode') === 'require'
  },
} satisfies Config;
