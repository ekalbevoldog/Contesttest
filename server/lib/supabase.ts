import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Check for required environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Missing Supabase credentials. Database operations will fail.');
}

// Create a Supabase client
export const supabase = createClient(
  supabaseUrl || '',
  supabaseKey || ''
);

// Helper function to handle database errors consistently
export const handleDatabaseError = (error: any) => {
  console.error('Database error:', error);
  return {
    error: {
      message: error.message || 'Database operation failed',
      details: error.details || null,
      code: error.code || 'DB_ERROR',
    }
  };
};

// Basic health check function for the Supabase connection
export const checkSupabaseConnection = async () => {
  try {
    // Try a simple query to see if the connection works
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection check failed:', error);
      return { status: 'error', message: error.message };
    }
    
    return { status: 'ok', message: 'Supabase connection successful' };
  } catch (err) {
    console.error('Supabase connection check exception:', err);
    return { 
      status: 'error', 
      message: err instanceof Error ? err.message : 'Unknown error checking Supabase connection' 
    };
  }
};