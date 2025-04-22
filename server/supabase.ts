import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Check for Supabase credentials
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl) {
  console.error('SUPABASE_URL is missing or empty');
}

if (!supabaseKey) {
  console.error('SUPABASE_KEY is missing or empty');
}

// Used for debugging only - do not log in production
console.log(`Supabase URL (first few chars): ${supabaseUrl ? supabaseUrl.substring(0, 10) + '...' : 'missing'}`);
console.log(`Supabase Key length: ${supabaseKey ? supabaseKey.length : 'missing'}`);

// Create the Supabase client
export const supabase = createClient(
  supabaseUrl || '',
  supabaseKey || '',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true
    }
  }
);

console.log('Supabase client initialized with provided credentials');

// Test connection
export const testSupabaseConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    // Simple query to test connection
    const { data, error } = await supabase.from('sessions').select('count').limit(1);
    
    if (error) {
      if (error.code === '42P01') {
        // Table not found is okay during initial setup
        console.log('Table not found, but connection succeeded');
        return true;
      }
      console.error('Error connecting to Supabase:', error.message);
      return false;
    }
    
    console.log('Successfully connected to Supabase');
    return true;
  } catch (err) {
    console.error('Error connecting to Supabase:', err);
    return false;
  }
};