import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

// Check for Supabase credentials
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Log essential environment variable status
if (!supabaseUrl) {
  console.error('SUPABASE_URL is missing or empty');
}

if (!supabaseKey) {
  console.error('SUPABASE_KEY is missing or empty');
}

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is missing or empty');
}

// Used for debugging only - do not log in production
console.log(`Supabase URL available: ${!!supabaseUrl}`);
console.log(`Supabase Key available: ${!!supabaseKey}`);
console.log(`Supabase Service Key available: ${!!supabaseServiceKey}`);

// Create options with fetch compatibility for Replit environment
const supabaseOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  },
  global: {
    fetch: fetch as any
  }
};

// Create the standard Supabase client with anon key (for normal operations)
export const supabase = createClient(
  supabaseUrl || '',
  supabaseKey || '',
  supabaseOptions
);

// Create an admin client with service role key (for admin operations)
export const supabaseAdmin = createClient(
  supabaseUrl || '',
  supabaseServiceKey || '',
  supabaseOptions
);

console.log('Supabase clients initialized with provided credentials');

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