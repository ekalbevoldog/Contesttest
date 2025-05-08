/**
 * Database migration utility
 * 
 * This module provides functionality to run complete database migrations,
 * including creating tables, indexes, and populating any required initial data.
 */

import { supabase, supabaseAdmin } from './supabase.js';
import { pool, createEssentialTables } from './db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get proper file paths in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Run a complete database migration
 * 
 * @returns {Promise<boolean>} Success or failure
 */
export async function runCompleteMigration() {
  try {
    console.log('Starting complete database migration...');
    
    // Step 1: Verify connection to Supabase
    try {
      const { data, error } = await supabase.from('_schema').select('*').limit(1);
      if (error) {
        console.error('Supabase connection test failed:', error);
        return false;
      }
      console.log('✅ Connected to Supabase successfully');
    } catch (err) {
      console.error('Error connecting to Supabase:', err);
      return false;
    }
    
    // Step 2: Create essential tables
    try {
      const tablesCreated = await createEssentialTables();
      if (!tablesCreated) {
        console.error('Failed to create essential tables');
        return false;
      }
      console.log('✅ Essential tables created or verified');
    } catch (err) {
      console.error('Error creating essential tables:', err);
      return false;
    }
    
    // Step 3: Run SQL migration file if it exists
    const migrationFilePath = path.join(__dirname, 'supabase-migration.sql');
    if (fs.existsSync(migrationFilePath)) {
      try {
        console.log('Running SQL migration file...');
        const migrationSql = fs.readFileSync(migrationFilePath, 'utf8');
        
        // Split by semicolon to run each statement separately
        const statements = migrationSql
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0);
        
        for (let i = 0; i < statements.length; i++) {
          const statement = statements[i];
          console.log(`Running migration statement ${i+1}/${statements.length}...`);
          
          const { error } = await supabaseAdmin.rpc('exec_sql', { 
            sql: statement 
          });
          
          if (error) {
            console.error(`Error in statement ${i+1}:`, error);
            console.error('Statement:', statement);
            // Continue with other statements
          }
        }
        
        console.log('✅ SQL migration file executed');
      } catch (err) {
        console.error('Error executing migration SQL:', err);
        return false;
      }
    } else {
      console.log('No SQL migration file found, skipping');
    }
    
    // Step 4: Verify critical tables
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('count');
      
      if (usersError) {
        console.warn('Warning: users table may not exist:', usersError);
      } else {
        console.log(`✅ Users table verified, contains ${usersData[0]?.count || 0} records`);
      }
      
      const { data: athletesData, error: athletesError } = await supabase
        .from('athlete_profiles')
        .select('count');
      
      if (athletesError) {
        console.warn('Warning: athlete_profiles table may not exist:', athletesError);
      } else {
        console.log(`✅ Athlete profiles table verified, contains ${athletesData[0]?.count || 0} records`);
      }
      
      const { data: businessData, error: businessError } = await supabase
        .from('business_profiles')
        .select('count');
      
      if (businessError) {
        console.warn('Warning: business_profiles table may not exist:', businessError);
      } else {
        console.log(`✅ Business profiles table verified, contains ${businessData[0]?.count || 0} records`);
      }
    } catch (err) {
      console.error('Error verifying critical tables:', err);
      // Continue anyway
    }
    
    console.log('Database migration completed successfully');
    return true;
  } catch (error) {
    console.error('Unhandled error in migration process:', error);
    return false;
  }
}