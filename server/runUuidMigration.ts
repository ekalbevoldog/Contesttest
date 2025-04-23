import { supabase } from './supabase';
import fs from 'fs';
import path from 'path';

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
    
    // Execute the migration SQL
    const { error } = await supabase.rpc('pg_execute', { sql: migrationSql });
    
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

// Allow direct execution of this script
if (require.main === module) {
  runUuidMigration()
    .then(() => {
      console.log('UUID migration completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('UUID migration failed:', error);
      process.exit(1);
    });
}