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
    
    // Split the SQL statements - similar to runProfileMigration
    const statements = migrationSql
      .split(';')
      .filter(statement => statement.trim().length > 0)
      .map(statement => statement.trim() + ';');
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement individually
    for (const statement of statements) {
      console.log('Executing SQL statement:', statement.substring(0, 50) + '...');
      
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        console.error('Error executing SQL statement:', error);
        throw new Error(`Migration statement failed: ${error.message}`);
      }
      
      console.log('SQL statement executed successfully');
    }
    
    // All statements executed successfully at this point
    
    console.log('UUID migration completed successfully!');
    return true;
  } catch (error) {
    console.error('Exception during UUID migration:', error);
    throw error;
  }
}

// For direct execution, this check needs to be done differently in ESM
// We'll just export the function for now and run via runMigrations.ts