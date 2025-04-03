// drizzle.config.js
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Use only Supabase database URL
const supabaseDbUrl = process.env.SUPABASE_DATABASE_URL;

if (!supabaseDbUrl) {
  console.error('⚠️ SUPABASE_DATABASE_URL environment variable is not set');
  console.error('⚠️ This application requires a Supabase database connection');
  process.exit(1);
}

// Parse the Supabase database URL
const dbUrl = new URL(supabaseDbUrl);

console.log('Using Supabase for database migrations');

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
    ssl: true  // Always use SSL for Supabase connections
  },
};