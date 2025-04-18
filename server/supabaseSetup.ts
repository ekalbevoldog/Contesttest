import { supabase } from './supabase';
import { pool } from './db';

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
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      );
    `, [tableName]);
    
    return result.rows[0].exists;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    return false;
  }
}

// Function to execute SQL
async function executeSql(sql: string): Promise<boolean> {
  try {
    await pool.query(sql);
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

// Function to initialize Supabase database structure
export async function initializeSupabaseTables() {
  try {
    console.log('Starting Supabase database initialization...');
    
    // Try to create tables one by one
    const sessionsExists = await createTableIfNotExists('sessions', CREATE_SESSIONS_TABLE);
    const messagesExists = await createTableIfNotExists('messages', CREATE_MESSAGES_TABLE);
    
    if (sessionsExists && messagesExists) {
      // If both tables exist, try to create indexes
      console.log('Tables exist, ensuring indexes are created...');
      await createIndexes();
    }
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