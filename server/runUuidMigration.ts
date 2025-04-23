import { supabase } from './supabase';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Handle ESM module paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Run the migration to change user_id from INTEGER to UUID type
 */
export async function runUuidMigration() {
  console.log('Starting user_id UUID migration...');
  
  try {
    // Read the migration SQL file
    const migrationFilePath = path.join(__dirname, 'migrations', 'change-user-id-to-uuid.sql');
    const migrationSql = fs.readFileSync(migrationFilePath, 'utf8');
    
    console.log('Successfully loaded migration file for UUID conversion');
    console.log('Executing SQL migration...');
    
    // Execute the migration SQL - using the same method as in runProfileMigration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSql });
    
    if (error) {
      console.error('Error executing UUID migration:', error);
      throw new Error(`Migration failed: ${error.message}`);
    }
    
    console.log('UUID migration completed successfully!');
    return true;
  } catch (error) {
    console.error('Exception during UUID migration:', error);
    throw error;
  }
}

// For direct execution, this check needs to be done differently in ESM
// We'll just export the function for now and run via runMigrations.ts