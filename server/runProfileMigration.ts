import { supabaseAdmin } from './supabase';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to run the migration
export async function runProfileMigration() {
  try {
    console.log('Running profile tables migration...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'create-profile-tables.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split the SQL statements
    const statements = sqlContent
      .split(';')
      .filter(statement => statement.trim().length > 0)
      .map(statement => statement.trim() + ';');
      
    // Execute each statement
    for (const statement of statements) {
      try {
        await pool.query(statement);
        console.log('Executed SQL statement successfully');
      } catch (error) {
        console.error('Error executing SQL statement:', error);
      }
    }
    
    console.log('Profile tables migration completed');
    return true;
  } catch (error) {
    console.error('Error running profile migration:', error);
    return false;
  }
}

// Run the migration if this file is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runProfileMigration()
    .then(() => {
      console.log('Migration process completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Migration process failed:', error);
      process.exit(1);
    });
}