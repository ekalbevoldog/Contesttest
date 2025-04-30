import fs from 'fs';
import path from 'path';
import { supabaseAdmin } from '../supabase';

/**
 * This script deploys the get_user_profile_type function to Supabase
 * 
 * Usage:
 * 1. Make sure you're authenticated as an admin with your Supabase project
 * 2. Run this script with: ts-node server/auth-fixes/deploy-profile-type-function.ts
 */

async function deployProfileTypeFunction() {
  try {
    console.log('Deploying get_user_profile_type function to Supabase...');
    
    // Read SQL file
    const sqlFilePath = path.join(__dirname, 'get_profile_type_function.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL
    const { error } = await supabaseAdmin.rpc('exec_sql', {
      sql: sqlContent
    });
    
    if (error) {
      console.error('Error deploying function:', error);
      return;
    }
    
    console.log('Function deployed successfully!');
    
    // Test the function (will only work if you're authenticated)
    try {
      console.log('Testing function...');
      const { data, error: testError } = await supabaseAdmin.rpc('get_user_profile_type');
      
      if (testError) {
        console.error('Error testing function:', testError);
      } else {
        console.log('Function test result:', data);
      }
    } catch (testErr) {
      console.error('Exception testing function:', testErr);
    }
    
  } catch (err) {
    console.error('Deployment failed:', err);
  }
}

// Run the function if this file is executed directly
if (require.main === module) {
  deployProfileTypeFunction();
}

export { deployProfileTypeFunction };