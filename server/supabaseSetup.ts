import { supabase, supabaseAdmin } from './supabase';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

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
    console.log(`Checking if table ${tableName} exists...`);
    
    // Use the admin client which has more permissions
    try {
      const { data, error } = await supabaseAdmin
        .from(tableName)
        .select('count')
        .limit(1);
      
      if (!error) {
        console.log(`Table ${tableName} exists (verified by selecting data)`);
        return true;
      }
      
      // If the error is not "relation doesn't exist", it might be a permissions issue or other error
      if (error && error.code !== '42P01') {
        console.log(`Table ${tableName} might exist, but got another error: ${error.code}`);
        // Let's assume the table exists if it's a permission error
        return error.code.startsWith('PGRST');
      }
    } catch (selectError) {
      console.log(`Error checking table existence via select: ${selectError instanceof Error ? selectError.message : String(selectError)}`);
    }
    
    console.log(`Table ${tableName} does not exist or is not accessible`);
    return false;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

// Function to execute SQL using the existing db connection
async function executeSql(sql: string): Promise<boolean> {
  try {
    console.log('Executing SQL statement');
    
    // Log the first 50 characters of the SQL statement for debugging
    console.log('SQL statement (preview):', sql.substring(0, 50) + '...');
    
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
    
    // Execute using the existing pool from db.ts
    try {
      // Import the pool from db.ts
      const { pool } = await import('./db');
      
      // Execute SQL
      await pool.query(sql);
      console.log('SQL statement executed successfully');
      return true;
    } catch (dbError) {
      console.error('Error executing SQL via database client:', dbError instanceof Error ? dbError.message : String(dbError));
      return false;
    }
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
        const { error } = await supabaseAdmin.from('sessions').insert({
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
        console.error('Exception creating sessions table:', e instanceof Error ? e.message : String(e));
      }
    }

    // Create users table
    if (!(await tableExists('users'))) {
      console.log('Creating users table...');
      try {
        const { error } = await supabaseAdmin.from('users').insert({
          username: 'system-initialization',
          email: 'system@example.com',
          password: 'not-real-password',
          role: 'system', // Updated field name to match our schema
        });
        
        if (error && error.code !== 'PGRST109') { // Duplicate key error is OK here
          console.error('Error creating users table:', error);
        } else {
          console.log('Users table created successfully');
        }
      } catch (e) {
        console.error('Exception creating users table:', e instanceof Error ? e.message : String(e));
      }
    }

    // Create athletes table
    if (!(await tableExists('athlete_profiles'))) {
      console.log('Creating athlete_profiles table...');
      try {
        const { error } = await supabaseAdmin.from('athlete_profiles').insert({
          session_id: 'initialization-test',
          name: 'System Test Athlete',
          sport: 'Test Sport',
          school: 'Test University',
          division: 'Division I',
          follower_count: 0, // Using snake_case for column names in DB
          content_style: 'Test Content Style',
          compensation_goals: 'Test Compensation Goals'
        });
        
        if (error && error.code !== 'PGRST109') { // Duplicate key error is OK here
          console.error('Error creating athlete_profiles table:', error);
        } else {
          console.log('athlete_profiles table created successfully');
        }
      } catch (e) {
        console.error('Exception creating athlete_profiles table:', e instanceof Error ? e.message : String(e));
      }
    }

    // Create businesses table
    if (!(await tableExists('business_profiles'))) {
      console.log('Creating business_profiles table...');
      try {
        // First try with minimal fields
        const { error } = await supabaseAdmin.from('business_profiles').insert({
          session_id: 'initialization-test',
          name: 'System Test Business',
          product_type: 'Test Product', // Using snake_case for column names in DB
          audience_goals: 'Test Audience Goals',
          campaign_vibe: 'Test Campaign Vibe',
          values: 'Test Values',
          target_schools_sports: 'Test Schools & Sports'
        });
        
        if (error) {
          console.error('Error creating business_profiles table:', error);
          
          // If there was an error, try a different approach by checking if the table is accessible
          // even if we can't insert data into it
          const { count, error: countError } = await supabaseAdmin
            .from('business_profiles')
            .select('*', { count: 'exact', head: true });
            
          if (!countError) {
            console.log('business_profiles table exists but might have restrictions on inserting data');
            return true;
          } else {
            console.error('Could not access business_profiles table:', countError);
          }
        } else {
          console.log('business_profiles table created successfully');
        }
      } catch (e) {
        console.error('Exception creating business_profiles table:', e instanceof Error ? e.message : String(e));
      }
    }

    console.log('Successfully completed createCoreTablesDirectly function');
    return true;
  } catch (err) {
    console.error('Exception creating core tables:', err instanceof Error ? err.message : String(err));
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
    const athletesExists = await tableExists('athlete_profiles'); // Correct table name from schema.ts
    const businessesExists = await tableExists('business_profiles'); // Correct table name from schema.ts
    
    // If all core tables exist, we don't need to run the full migration
    if (sessionsExists && usersExists && athletesExists && businessesExists) {
      console.log('Core tables already exist, skipping table creation...');
      return;
    }
    
    // Try to execute the migration SQL if it exists
    if (MIGRATION_SQL && process.env.DATABASE_URL) {
      console.log('Running migration from SQL file...');
      
      // Execute each SQL statement separately
      for (const statement of SQL_STATEMENTS) {
        if (statement.trim()) {
          await executeSql(statement);
        }
      }
      
      // Verify the tables were created
      const tablesAfterMigration = {
        sessions: await tableExists('sessions'),
        users: await tableExists('users'),
        athleteProfiles: await tableExists('athlete_profiles'),
        businessProfiles: await tableExists('business_profiles')
      };
      
      console.log('Tables after migration:', tablesAfterMigration);
      
      if (tablesAfterMigration.sessions && tablesAfterMigration.users && 
          tablesAfterMigration.athleteProfiles && tablesAfterMigration.businessProfiles) {
        console.log('All tables created successfully via SQL migration');
        return;
      } else {
        console.log('Some tables not created via SQL migration, falling back to API method');
      }
    } else {
      console.log('No migration SQL available or DATABASE_URL not set, using API method');
    }
    
    // Fallback: Try to create core tables directly using the Supabase API
    console.log('Using API method to create tables...');
    await createCoreTablesDirectly();
    
    console.log('Table initialization complete');
  } catch (err) {
    console.error('Exception during Supabase initialization:', err instanceof Error ? err.message : String(err));
  }
}

// Export a function to initialize everything at once
export async function setupSupabase() {
  try {
    console.log('Starting Supabase setup process...');
    await initializeSupabaseTables();
    console.log('Supabase setup completed successfully');
    
    // Run a simple test query to verify the connection
    console.log('Testing connection with a final verification...');
    const { data, error } = await supabaseAdmin.from('users').select('count').limit(1);
    
    if (error) {
      console.error('Final connection test failed:', error.message);
    } else {
      console.log('Final connection test succeeded');
    }
  } catch (error) {
    console.error('Error in Supabase setup:', error instanceof Error ? error.message : String(error));
  }
}