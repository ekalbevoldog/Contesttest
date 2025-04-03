import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

async function testSupabaseAPI() {
  console.log('🔍 Testing Supabase API Connection');
  
  // Get Supabase credentials
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials (SUPABASE_URL or SUPABASE_KEY)');
    return;
  }
  
  console.log('✅ Supabase credentials found');
  console.log(`Supabase URL: ${supabaseUrl}`);
  
  try {
    // Initialize the Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client initialized');
    
    // Test authentication functionality
    console.log('\n1. Testing auth API:');
    const authResponse = await supabase.auth.getSession();
    console.log('Auth service status:', authResponse.error ? '❌ Error' : '✅ Working');
    
    // Try to list tables directly
    console.log('\n2. Attempting to directly list tables:');
    const { data: tablesData, error: tablesError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (tablesError) {
      console.error('❌ Failed to fetch users table:', tablesError.message);
      console.log('ℹ️ The database tables might not exist yet. Run the migration script.');
    } else {
      console.log('✅ Users table exists in the database');
      console.log(`Found ${tablesData.length} user records`);
      if (tablesData.length > 0) {
        console.log(`Sample user: ${JSON.stringify(tablesData[0], null, 2)}`);
      }
    }
    
    // Test storage service
    console.log('\n3. Testing storage service:');
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();
    
    if (bucketsError) {
      console.error('❌ Failed to access storage:', bucketsError.message);
    } else {
      console.log('✅ Storage service is working');
      console.log(`Found ${buckets.length} storage buckets:`);
      buckets.forEach(bucket => {
        console.log(`- ${bucket.name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Unhandled error:', error);
  }
}

testSupabaseAPI().catch(err => {
  console.error('Unhandled error:', err);
});