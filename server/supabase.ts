import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get Supabase URL from environment variable
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlma3F2dWV2YXlreGl6cG5kaGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NTExNDMsImV4cCI6MjA2MDMyNzE0M30.fWogNLRxTPk8uEYA8bh3SoeiZoyrpPlv5zt0pSVJu4s';

// Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Supabase client initialized with provided credentials');

// Test connection
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('sessions').select('count').limit(1);
    
    if (error && error.code !== '42P01') { // Ignore table not found errors
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