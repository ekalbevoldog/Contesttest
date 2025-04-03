import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Simple test to see if we can access database via Supabase client
async function testDatabaseAccess() {
  console.log('🔍 Testing Supabase Database Access');
  
  // Check Supabase credentials
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    console.error('❌ Supabase credentials not found in environment variables');
    process.exit(1);
  }
  
  console.log(`✅ Supabase credentials found`);
  console.log(`Supabase URL: ${process.env.SUPABASE_URL}`);
  
  // Initialize Supabase client
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  );
  
  console.log('✅ Supabase client initialized');
  
  // Test database access
  try {
    // Test getting users
    console.log('\n1. Testing users table:');
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .limit(5);
      
    if (userError) {
      console.error(`❌ Error fetching users: ${userError.message}`);
    } else {
      console.log(`✅ Successfully retrieved ${users.length} users`);
      if (users.length > 0) {
        console.log('First user data:', JSON.stringify(users[0], null, 2));
      } else {
        console.log('Users table is empty');
      }
    }
    
    // Test getting athletes
    console.log('\n2. Testing athlete_profiles table:');
    const { data: athletes, error: athleteError } = await supabase
      .from('athlete_profiles')
      .select('*')
      .limit(5);
      
    if (athleteError) {
      console.error(`❌ Error fetching athletes: ${athleteError.message}`);
    } else {
      console.log(`✅ Successfully retrieved ${athletes.length} athletes`);
      if (athletes.length > 0) {
        console.log('First athlete data:', JSON.stringify(athletes[0], null, 2));
      } else {
        console.log('Athlete profiles table is empty');
      }
    }
    
    // Test creating a test user
    console.log('\n3. Testing user creation:');
    const testUser = {
      username: `test_user_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'password123',
      user_type: 'athlete'
    };
    
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([testUser])
      .select();
      
    if (createError) {
      console.error(`❌ Error creating test user: ${createError.message}`);
    } else {
      console.log(`✅ Successfully created test user with ID: ${newUser[0].id}`);
      console.log('New user data:', JSON.stringify(newUser[0], null, 2));
      
      // Clean up - delete the test user
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', newUser[0].id);
        
      if (deleteError) {
        console.error(`❌ Error deleting test user: ${deleteError.message}`);
      } else {
        console.log(`✅ Successfully deleted test user with ID: ${newUser[0].id}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Unhandled error during database access tests:', error);
  }
}

testDatabaseAccess().catch(err => {
  console.error('Unhandled error:', err);
});