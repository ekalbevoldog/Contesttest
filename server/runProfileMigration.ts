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
    if (!fs.existsSync(sqlFilePath)) {
      console.error(`SQL file not found at path: ${sqlFilePath}`);
      return false;
    }
    
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split the SQL statements
    const statements = sqlContent
      .split(';')
      .filter(statement => statement.trim().length > 0)
      .map(statement => statement.trim() + ';');
      
    console.log('Successfully loaded migration file');
    
    // Execute each statement using the Supabase admin client
    for (const statement of statements) {
      try {
        console.log('Executing SQL statement');
        console.log('SQL statement (preview):', statement.substring(0, 50) + '...');
        
        // According to the error message, the parameter should be named 'sql' not 'sql_statement'
        const { data, error } = await supabaseAdmin.rpc('exec_sql', { 
          sql: statement 
        });
        
        if (error) {
          console.error('Error executing SQL statement:', error);
        } else {
          console.log('Executed SQL statement successfully');
        }
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