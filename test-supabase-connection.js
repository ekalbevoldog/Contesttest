import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Connection');
  
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
    
    // Test connection with a simple query
    console.log('Testing connection with a simple query...');
    const { data, error } = await supabase.from('users').select('id').limit(1);
    
    if (error) {
      console.error('❌ Connection test failed:', error.message);
      return;
    }
    
    console.log('✅ Connection successful!');
    console.log(`Query result: ${JSON.stringify(data)}`);
    
    // Test table existence
    console.log('\nChecking table existence:');
    // Let's first check what schemas exist
    console.log('\nChecking available schemas:');
    const { data: schemas, error: schemaError } = await supabase.rpc('get_schemas');
    
    if (schemaError) {
      console.error('❌ Failed to get schemas:', schemaError.message);
    } else {
      console.log('Available schemas:', schemas);
    }
    
    // Let's check what tables exist in the database
    console.log('\nChecking available tables:');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_schema, table_name')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      console.error('❌ Failed to get tables:', tablesError.message);
    } else {
      console.log('Available tables:', tables);
    }
    
    const tablesToCheck = [
      'users', 
      'athletes', 
      'businesses', 
      'campaigns', 
      'matches', 
      'messages', 
      'partnership_offers',
      'feedbacks',
      'compliance_officers',
      'sessions'
    ];
    
    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase.from(table).select('count').limit(1);
        if (error) {
          console.error(`❌ Table "${table}" check failed:`, error.message);
        } else {
          console.log(`✅ Table "${table}" exists`);
        }
      } catch (err) {
        console.error(`❌ Error checking table "${table}":`, err.message);
      }
    }
    
  } catch (err) {
    console.error('❌ Supabase client error:', err.message);
  }
}

testSupabaseConnection().catch(err => {
  console.error('Unhandled error:', err);
});