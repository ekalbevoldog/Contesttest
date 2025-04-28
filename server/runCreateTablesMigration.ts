
import { supabaseAdmin } from './supabase.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Run the create_tables.sql migration
 */
export async function runCreateTablesMigration() {
  try {
    console.log('Running create_tables.sql migration...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'migrations', 'create_tables.sql');
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
      
    console.log(`Successfully loaded migration file with ${statements.length} statements`);
    
    // Execute each statement using the Supabase admin client
    for (const statement of statements) {
      try {
        console.log('Executing SQL statement:');
        console.log(statement.substring(0, 100) + '...');
        
        const { data, error } = await supabaseAdmin.rpc('exec_sql', { 
          sql: statement 
        });
        
        if (error) {
          console.error('Error executing SQL statement:', error);
        } else {
          console.log('SQL statement executed successfully');
        }
      } catch (error) {
        console.error('Error executing SQL statement:', error);
      }
    }
    
    console.log('create_tables.sql migration completed');
    return true;
  } catch (error) {
    console.error('Error running create_tables migration:', error);
    return false;
  }
}

// Run the migration if this file is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCreateTablesMigration()
    .then(() => {
      console.log('Migration process completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Migration process failed:', error);
      process.exit(1);
    });
}
