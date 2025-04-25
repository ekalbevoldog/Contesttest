// This file is for testing the Supabase connection
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Extract credentials
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Print information for debugging
console.log('===== SUPABASE CONNECTION TEST =====');
console.log(`Supabase URL: ${supabaseUrl ? 'Provided' : 'Missing'}`);
console.log(`Supabase Key: ${supabaseKey ? 'Provided' : 'Missing'}`);
console.log(`Service Role Key: ${supabaseServiceKey ? 'Provided' : 'Missing'}`);

// Print partial values for verification (never log full credentials)
if (supabaseUrl) {
  console.log(`URL starts with: ${supabaseUrl.substring(0, 10)}...`);
  console.log(`URL length: ${supabaseUrl.length}`);
}

if (supabaseKey) {
  console.log(`Key starts with: ${supabaseKey.substring(0, 5)}...`);
  console.log(`Key length: ${supabaseKey.length}`);
}

// Function to test the connection
async function testConnection() {
  try {
    // Create a client with fetch polyfill for Replit environment
    const options = {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
      },
      global: {
        fetch: fetch as any,
      },
    };

    // Initialize client
    console.log('Initializing Supabase client...');
    const supabase = createClient(supabaseUrl || '', supabaseKey || '', options);
    
    // Try a simple query
    console.log('Testing connection with a health check...');
    const { data, error } = await supabase.from('sessions').select('count').limit(1);
    
    if (error) {
      console.error('Connection failed with error:', error);
      
      if (error.code === '42P01') {
        // Table doesn't exist yet, but connection succeeded
        console.log('Table not found, but connection was successful');
        return true;
      }
      
      return false;
    }
    
    console.log('Connection successful!', data);
    return true;
  } catch (error) {
    console.error('Fatal connection error:', error);
    return false;
  }
}

// Run the test
testConnection().then(success => {
  console.log('Connection test complete. Result:', success ? 'SUCCESS' : 'FAILED');
}).catch(err => {
  console.error('Unhandled error during connection test:', err);
});