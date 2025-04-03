require('dotenv').config();
const { exec } = require('child_process');
const path = require('path');

// We'll use a simple approach since TS files require compilation
// Run a simple shell command to compile and run a test file
console.log('🔄 Compiling and running Supabase storage test...');

// Use esbuild to compile TS
const esbuildCmd = `./node_modules/.bin/esbuild --platform=node --format=cjs --bundle --outfile=test-supabase-temp.js server/supabaseStorage.ts`;

exec(esbuildCmd, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error compiling TypeScript:', error);
    console.error(stderr);
    return;
  }
  
  console.log('✅ Successfully compiled TypeScript files');
  
  // Now run the test code
  const { createClient } = require('@supabase/supabase-js');
  
  // Get Supabase credentials from environment
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials (SUPABASE_URL or SUPABASE_KEY)');
    return;
  }
  
  console.log('✅ Supabase credentials found');
  
  // Initialize the Supabase client
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client initialized');
    
    // Test connection by fetching a single user
    supabase
      .from('users')
      .select('id, email')
      .limit(5)
      .then(({ data, error }) => {
        if (error) {
          console.error('❌ Failed to query users:', error.message);
          return;
        }
        
        console.log(`✅ Successfully connected to Supabase. Found ${data.length} users:`);
        if (data.length > 0) {
          data.forEach(user => {
            console.log(`- User ID: ${user.id}, Email: ${user.email}`);
          });
        } else {
          console.log('No users found in the database');
        }
        
        // Test another table
        return supabase
          .from('athlete_profiles')
          .select('id, user_id')
          .limit(5);
      })
      .then(({ data, error }) => {
        if (error) {
          console.error('❌ Failed to query athletes:', error.message);
          return;
        }
        
        console.log(`\n✅ Successfully queried athletes. Found ${data.length} athletes:`);
        if (data.length > 0) {
          data.forEach(athlete => {
            console.log(`- Athlete ID: ${athlete.id}, User ID: ${athlete.user_id}`);
          });
        } else {
          console.log('No athletes found in the database');
        }
        
        // Test another table
        return supabase
          .from('business_profiles')
          .select('id, user_id, company_name')
          .limit(5);
      })
      .then(({ data, error }) => {
        if (error) {
          console.error('❌ Failed to query businesses:', error.message);
          return;
        }
        
        console.log(`\n✅ Successfully queried businesses. Found ${data.length} businesses:`);
        if (data.length > 0) {
          data.forEach(business => {
            console.log(`- Business ID: ${business.id}, User ID: ${business.user_id}, Name: ${business.company_name}`);
          });
        } else {
          console.log('No businesses found in the database');
        }
      })
      .catch(err => {
        console.error('❌ Unhandled error:', err);
      });
      
  } catch (error) {
    console.error('❌ Failed to initialize Supabase client:', error);
  }
});