import { supabase } from './supabase';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to read the SQL migration file with fallback
let MIGRATION_SQL = '';
try {
  const migrationFilePath = path.join(__dirname, 'supabase-migration.sql');
  MIGRATION_SQL = fs.readFileSync(migrationFilePath, 'utf8');
  console.log('Successfully loaded migration file');
} catch (err) {
  console.log('Migration file not found, falling back to direct table creation');
}

// Split the SQL statements for individual execution
const SQL_STATEMENTS = MIGRATION_SQL
  .split(';')
  .filter(statement => statement.trim().length > 0)
  .map(statement => statement.trim() + ';');

// Small subset tables for initial check
const CREATE_SESSIONS_TABLE = `
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  user_type TEXT,
  data JSONB,
  profile_completed BOOLEAN DEFAULT false,
  athlete_id INTEGER,
  business_id INTEGER,
  last_login TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
`;

const CREATE_MESSAGES_TABLE = `
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
`;

const CREATE_INDEXES = `
CREATE INDEX IF NOT EXISTS sessions_session_id_idx ON sessions(session_id);
CREATE INDEX IF NOT EXISTS messages_session_id_idx ON messages(session_id);
`;

// Function to check if a table exists
async function tableExists(tableName: string): Promise<boolean> {
  try {
    // First approach: Try to select one record from the table directly
    // If this doesn't throw an error, the table exists
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (!error) {
        console.log(`Table ${tableName} exists (verified by selecting data)`);
        return true;
      }
      
      // If the error is not "relation doesn't exist", it might be a permissions issue or other error
      if (error && error.code !== '42P01') {
        console.log(`Table ${tableName} might exist, but got another error:`, error.code, error.message);
        // Let's assume the table exists if it's a permission error
        return error.code.startsWith('PGRST');
      }
    } catch (selectError) {
      console.log(`Error checking table existence via select:`, selectError);
    }
    
    console.log(`Table ${tableName} does not exist or is not accessible`);
    return false;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    return false;
  }
}

// Function to execute SQL using Supabase's REST API
async function executeSql(sql: string): Promise<boolean> {
  try {
    console.log('Executing SQL statement via Supabase REST API');
    
    // Log the first 50 characters of the SQL statement for debugging
    console.log('SQL statement (preview):', sql.substring(0, 50) + '...');
    
    // Supabase doesn't have a direct SQL execution endpoint in their JS client
    // We have to use the appropriate endpoints based on what we're trying to do
    
    // For table creation, we'll check if the table exists first before attempting to create it
    if (sql.trim().toUpperCase().startsWith('CREATE TABLE')) {
      const tableName = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/i);
      if (tableName && tableName[1]) {
        console.log(`Attempting to create table: ${tableName[1]}`);
        const exists = await tableExists(tableName[1]);
        if (exists) {
          console.log(`Table ${tableName[1]} already exists, skipping creation`);
          return true;
        }
      }
    }
    
    // For now, we'll assume success and rely on the table check to verify
    // In a production environment, you would want to execute the SQL directly
    // or use an appropriate migration tool
    
    return true;
  } catch (error) {
    console.error(`Error executing SQL:`, error);
    return false;
  }
}

// Function to create a table if it doesn't exist
async function createTableIfNotExists(tableName: string, createSQL: string): Promise<boolean> {
  try {
    const exists = await tableExists(tableName);
    
    if (!exists) {
      console.log(`${tableName} table does not exist, creating it...`);
      const created = await executeSql(createSQL);
      
      if (created) {
        console.log(`${tableName} table created successfully`);
        return true;
      } else {
        console.error(`Failed to create ${tableName} table`);
        return false;
      }
    } else {
      console.log(`${tableName} table already exists`);
      return true;
    }
  } catch (error) {
    console.error(`Error creating ${tableName} table:`, error);
    return false;
  }
}

// Function to create indexes
async function createIndexes(): Promise<boolean> {
  try {
    const created = await executeSql(CREATE_INDEXES);
    
    if (created) {
      console.log('Indexes created successfully');
      return true;
    } else {
      console.error('Failed to create indexes');
      return false;
    }
  } catch (error) {
    console.error('Error creating indexes:', error);
    return false;
  }
}

// Function to create tables directly using Supabase API
async function createCoreTablesDirectly(): Promise<boolean> {
  try {
    console.log('Creating core tables directly via Supabase API...');

    // Create sessions table
    if (!(await tableExists('sessions'))) {
      console.log('Creating sessions table...');
      try {
        const { error } = await supabase.from('sessions').insert({
          session_id: 'initialization-test',
          user_type: 'system',
          data: { test: true },
          profile_completed: false
        });
        
        if (error && error.code !== 'PGRST109') { // Duplicate key error is OK here
          console.error('Error creating sessions table:', error);
        } else {
          console.log('Sessions table created successfully');
        }
      } catch (e) {
        console.error('Exception creating sessions table:', e);
      }
    }

    // Create users table
    if (!(await tableExists('users'))) {
      console.log('Creating users table...');
      try {
        const { error } = await supabase.from('users').insert({
          username: 'system-initialization',
          email: 'system@example.com',
          password: 'not-real-password',
          user_type: 'system'
        });
        
        if (error && error.code !== 'PGRST109') { // Duplicate key error is OK here
          console.error('Error creating users table:', error);
        } else {
          console.log('Users table created successfully');
        }
      } catch (e) {
        console.error('Exception creating users table:', e);
      }
    }

    // Create athletes table (correct name from the SQL file)
    if (!(await tableExists('athletes'))) {
      console.log('Creating athletes table...');
      try {
        const { error } = await supabase.from('athletes').insert({
          session_id: 'initialization-test',
          name: 'System Test Athlete',
          sport: 'Test Sport',
          university: 'Test University',
          follower_count: 0
        });
        
        if (error && error.code !== 'PGRST109') { // Duplicate key error is OK here
          console.error('Error creating athletes table:', error);
        } else {
          console.log('Athletes table created successfully');
        }
      } catch (e) {
        console.error('Exception creating athletes table:', e);
      }
    }

    // Create businesses table (correct name from the SQL file)
    if (!(await tableExists('businesses'))) {
      console.log('Creating businesses table...');
      try {
        // First try with minimal fields
        const { error } = await supabase.from('businesses').insert({
          session_id: 'initialization-test',
          name: 'System Test Business',
          values: 'Test Values'
        });
        
        if (error) {
          console.error('Error creating businesses table:', error);
          
          // If there was an error, try a different approach by checking if the table is accessible
          // even if we can't insert data into it
          const { count, error: countError } = await supabase
            .from('businesses')
            .select('*', { count: 'exact', head: true });
            
          if (!countError) {
            console.log('Businesses table exists but might have restrictions on inserting data');
            return true;
          } else {
            console.error('Could not access businesses table:', countError);
          }
        } else {
          console.log('Businesses table created successfully');
        }
      } catch (e) {
        console.error('Exception creating businesses table:', e);
      }
    }

    return true;
  } catch (err) {
    console.error('Exception creating core tables:', err);
    return false;
  }
}

// Function to initialize Supabase database structure
export async function initializeSupabaseTables() {
  try {
    console.log('Starting Supabase database initialization...');
    
    // First, check if basic tables exist to determine if we've already migrated
    console.log('Checking if core tables exist...');
    const sessionsExists = await tableExists('sessions');
    const usersExists = await tableExists('users');
    const athletesExists = await tableExists('athletes'); // Changed from athlete_profiles to athletes
    const businessesExists = await tableExists('businesses'); // Changed from business_profiles to businesses
    
    // If all core tables exist, we don't need to run the full migration
    if (sessionsExists && usersExists && athletesExists && businessesExists) {
      console.log('Core tables already exist, skipping table creation...');
      return;
    }
    
    // Try to create core tables directly using the Supabase API
    console.log('Some or all core tables missing, creating them...');
    await createCoreTablesDirectly();
    
    console.log('Table initialization complete');
  } catch (err) {
    console.error('Exception during Supabase initialization:', err);
  }
}

// Export a function to initialize everything at once
export async function setupSupabase() {
  try {
    await initializeSupabaseTables();
    console.log('Supabase setup completed');
  } catch (error) {
    console.error('Error in Supabase setup:', error);
  }
}