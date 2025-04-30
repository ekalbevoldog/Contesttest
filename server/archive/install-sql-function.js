#!/usr/bin/env node

/**
 * This script installs the get_user_profile_type SQL function in Supabase
 * 
 * Run with:
 * node server/auth-fixes/install-sql-function.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_KEY');
  process.exit(1);
}

async function installSqlFunction() {
  console.log('Creating Supabase admin client...');
  
  // Create Supabase client with admin privileges
  const supabaseAdmin = createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_KEY
  );
  
  // Read SQL file
  const sqlFilePath = path.join(__dirname, 'get_profile_type_function.sql');
  
  console.log(`Reading SQL file from ${sqlFilePath}...`);
  const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
  
  console.log('Installing SQL function...');
  try {
    // Execute the SQL
    const { error } = await supabaseAdmin.rpc('exec_sql', {
      sql: sqlContent
    });
    
    if (error) {
      console.error('Error deploying function:', error);
      process.exit(1);
    }
    
    console.log('SQL function installed successfully!');
    
    // Try to test the function
    console.log('Testing function (note: will only work if you are authenticated)...');
    const { data, error: testError } = await supabaseAdmin.rpc('get_user_profile_type');
    
    if (testError) {
      console.log('Function test error (this is normal if not authenticated):', testError.message);
    } else {
      console.log('Function test result:', data);
    }
    
  } catch (err) {
    console.error('Installation failed:', err);
    process.exit(1);
  }
}

// Run the function
installSqlFunction();