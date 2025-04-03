import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

async function testSupabaseAPI() {
  console.log('🔍 Testing Supabase API Connection');
  
  // Check environment variables
  console.log('Checking environment variables:');
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  
  if (!supabaseUrl) {
    console.error('❌ SUPABASE_URL environment variable is missing');
    return;
  }
  
  if (!supabaseKey) {
    console.error('❌ SUPABASE_KEY environment variable is missing');
    return;
  }
  
  console.log(`✅ SUPABASE_URL: ${supabaseUrl.substring(0, 20)}...`);
  console.log(`✅ SUPABASE_KEY: ${supabaseKey.substring(0, 5)}...`);
  
  try {
    // Create Supabase client
    console.log('\nCreating Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test basic API functionality
    console.log('\nTesting auth API...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Auth API failed:', authError.message);
    } else {
      console.log('✅ Auth API working:', authData ? 'Session data received' : 'No active session');
    }
    
    // Test storage API
    console.log('\nTesting storage API...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Storage API failed:', bucketsError.message);
    } else {
      console.log('✅ Storage API working:', buckets.length > 0 ? `${buckets.length} buckets found` : 'No buckets found');
    }
    
  } catch (err) {
    console.error('❌ Supabase client error:', err.message);
  }
}

testSupabaseAPI().catch(err => {
  console.error('Unhandled error:', err);
});