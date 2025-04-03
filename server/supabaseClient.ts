import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Make sure we have the Supabase URL and key
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Validate required environment variables
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables:');
  if (!supabaseUrl) console.error('  - SUPABASE_URL is not set');
  if (!supabaseKey) console.error('  - SUPABASE_KEY is not set');
  console.error('❌ Supabase client will not be initialized');
}

// Create Supabase client (returns null if credentials are missing)
const supabaseClient = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

if (supabaseClient) {
  console.log('✅ Supabase client initialized successfully');
} else {
  console.warn('⚠️ Supabase client not initialized due to missing credentials');
}

export default supabaseClient;