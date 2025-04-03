// drizzle.config.ts
import type { Config } from "drizzle-kit";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Prioritize Supabase connection, fall back to local PostgreSQL
const dbUrl = new URL(process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL || '');

// Check if URL is valid
if (!dbUrl.toString()) {
  console.error('⚠️ No SUPABASE_DATABASE_URL or DATABASE_URL environment variable is set');
  process.exit(1);
}

// Log which database we're using
const isSupabase = !!process.env.SUPABASE_DATABASE_URL;
console.log(`Using ${isSupabase ? 'Supabase' : 'local PostgreSQL'} for database migrations`);

// Detect if we're using Neon and prevent it
if (dbUrl.hostname.includes('neon.tech')) {
  console.error('⚠️ Neon database detected. The application should use ONLY Supabase or local PostgreSQL.');
  console.error('⚠️ Please configure Supabase or local PostgreSQL instead of Neon.');
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
