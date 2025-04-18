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

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sessions_session_id_idx ON sessions(session_id);
CREATE INDEX IF NOT EXISTS messages_session_id_idx ON messages(session_id);
`;

// Function to initialize Supabase database structure
export async function initializeSupabaseTables() {
  try {
    console.log('Starting Supabase database initialization...');
    
    // Try to create tables directly with Supabase's SQL query capability
    const { error } = await supabase.rpc('pgql', { query: CREATE_SESSIONS_TABLE });
    
    if (error) {
      console.error('Error initializing Supabase tables using RPC:', error);
      console.log('Checking if tables exist by querying them...');
      
      // Try to query tables to see if they exist
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select('id')
        .limit(1);
        
      if (sessionsError && sessionsError.code === '42P01') {
        console.log('Sessions table does not exist. Manual creation required.');
        console.log('Please run this SQL in Supabase SQL Editor:');
        console.log(CREATE_SESSIONS_TABLE);
      } else {
        console.log('Sessions table exists.');
      }
    } else {
      console.log('Supabase tables initialized successfully.');
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