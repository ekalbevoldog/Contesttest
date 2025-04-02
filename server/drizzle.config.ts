// drizzle.config.ts
import type { Config } from "drizzle-kit";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Parse database URL components
const dbUrl = new URL(process.env.DATABASE_URL || 
  'postgresql://neondb_owner:npg_Hsj1IWXf6USc@ep-patient-butterfly-a6bg3zba.us-west-2.aws.neon.tech/neondb?sslmode=require');

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
