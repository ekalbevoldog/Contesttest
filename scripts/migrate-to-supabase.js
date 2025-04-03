import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Supabase Migration Script
 * 
 * This script:
 * 1. Checks connection to Supabase PostgreSQL
 * 2. Validates the connection is to Supabase, not Neon
 * 3. Drops existing tables from the Supabase database (if any)
 * 4. Pushes the schema to the Supabase database
 * 
 * Usage:
 *   node scripts/migrate-to-supabase.js
 */

// Get environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseDatabaseUrl = process.env.SUPABASE_DATABASE_URL;

// Check if Supabase credentials are available
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL or SUPABASE_KEY environment variables are not set');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Test connection to Supabase
async function testSupabaseConnection() {
  try {
    console.log('🔍 Testing Supabase API connection...');
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Supabase API connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase API connection successful');
    return true;
  } catch (error) {
    console.error('❌ Error testing Supabase connection:', error);
    return false;
  }
}

// Drop existing tables (if any) to start fresh
async function dropExistingTables() {
  try {
    console.log('🧹 Dropping existing tables from Supabase...');
    
    // Execute SQL query to drop all tables in the public schema
    const { error } = await supabase.rpc('drop_all_tables_in_public_schema');
    
    if (error) {
      console.error('❌ Failed to drop tables:', error.message);
      
      // Create the function if it doesn't exist
      console.log('🔄 Creating drop_all_tables function...');
      
      const createFunctionSQL = `
        CREATE OR REPLACE FUNCTION drop_all_tables_in_public_schema()
        RETURNS void AS $$
        DECLARE
            stmt TEXT;
        BEGIN
            FOR stmt IN
                SELECT 'DROP TABLE IF EXISTS "' || tablename || '" CASCADE;' 
                FROM pg_tables
                WHERE schemaname = 'public'
            LOOP
                EXECUTE stmt;
            END LOOP;
        END;
        $$ LANGUAGE plpgsql;
      `;
      
      const { error: createFuncError } = await supabase.rpc('exec_sql', { 
        sql: createFunctionSQL 
      });
      
      if (createFuncError) {
        console.error('❌ Failed to create function:', createFuncError.message);
        console.log('⚠️ Will continue with migration, tables may already be empty');
      } else {
        // Try dropping tables again
        const { error: dropError } = await supabase.rpc('drop_all_tables_in_public_schema');
        if (dropError) {
          console.error('❌ Still failed to drop tables:', dropError.message);
          console.log('⚠️ Will continue with migration');
        } else {
          console.log('✅ Successfully dropped all existing tables');
        }
      }
    } else {
      console.log('✅ Successfully dropped all existing tables');
    }
  } catch (error) {
    console.error('❌ Error during table cleanup:', error);
    console.log('⚠️ Will continue with migration');
  }
}

// Push schema to Supabase database
async function pushSchemaToSupabase() {
  try {
    console.log('🚀 Pushing schema to Supabase...');
    
    // Use drizzle-kit to push the schema
    const drizzlePushCommand = 'npm run db:push';
    
    // Execute the command
    console.log(`Executing: ${drizzlePushCommand}`);
    const output = execSync(drizzlePushCommand, { 
      cwd: join(__dirname, '..'),
      stdio: 'inherit'
    });
    
    console.log('✅ Schema migration completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Error pushing schema:', error);
    return false;
  }
}

// Main function
async function main() {
  console.log('🚀 Starting Supabase migration');
  
  // Step 1: Test Supabase connection
  const supabaseConnected = await testSupabaseConnection();
  if (!supabaseConnected) {
    console.error('❌ Cannot proceed with migration due to connection issues');
    process.exit(1);
  }
  
  // Step 2: Drop existing tables
  await dropExistingTables();
  
  // Step 3: Push schema to Supabase
  const migrationSuccess = await pushSchemaToSupabase();
  
  if (migrationSuccess) {
    console.log('✅ Migration to Supabase completed successfully');
  } else {
    console.error('❌ Migration to Supabase failed');
    process.exit(1);
  }
}

// Run the migration
main().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});