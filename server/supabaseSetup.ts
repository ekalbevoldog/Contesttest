import { supabase } from './supabase';

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

// Function to create a table via direct REST API if it doesn't exist
async function createTableIfNotExists(tableName: string, createSQL: string) {
  try {
    // First check if the table exists by querying it
    const { error: checkError } = await supabase
      .from(tableName)
      .select('count(*)')
      .limit(1);
    
    if (checkError && checkError.code === '42P01') {
      console.log(`${tableName} table does not exist, attempting to create it`);
      
      // Table doesn't exist, try to create it with a direct REST query
      // This is a workaround since we can't use the RPC or SQL functions directly
      // We output the SQL for manual execution
      console.log(`Please run this SQL in Supabase SQL Editor to create the ${tableName} table:`);
      console.log(createSQL);
      
      return false;
    } else {
      console.log(`${tableName} table already exists`);
      return true;
    }
  } catch (error) {
    console.error(`Error checking/creating ${tableName} table:`, error);
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
      console.log('Please run this SQL in Supabase SQL Editor if needed:');
      console.log(CREATE_INDEXES);
    }
  } catch (err) {
    console.error('Exception during Supabase initialization:', err);
  }
}

// Export a function to initialize everything at once
export async function setupSupabase() {
  await initializeSupabaseTables();
  console.log('Supabase setup completed');
}