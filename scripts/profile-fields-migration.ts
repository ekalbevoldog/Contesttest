
// Profile Fields Migration Script
// This script adds missing fields to athlete_profiles and business_profiles tables

import { supabaseAdmin } from '../server/supabase.js';
import { tableExists, columnExists } from './db-diagnostic.js';

async function executeSQL(sql: string): Promise<boolean> {
  try {
    console.log('Executing SQL statement:');
    console.log(sql);
    
    const { data, error } = await supabaseAdmin.rpc('exec_sql', { 
      sql: sql
    });
    
    if (error) {
      console.error('Error executing SQL statement:', error);
      return false;
    }
    
    console.log('SQL statement executed successfully');
    return true;
  } catch (error) {
    console.error('Exception executing SQL statement:', error);
    return false;
  }
}

async function migrateAthleteProfileFields(): Promise<boolean> {
  try {
    console.log('Migrating athlete_profiles table fields...');
    
    // Check if the table exists
    if (!(await tableExists('athlete_profiles'))) {
      console.error('athlete_profiles table does not exist');
      return false;
    }
    
    // Add personal_values column if it doesn't exist
    if (!(await columnExists('athlete_profiles', 'personal_values'))) {
      console.log('Adding personal_values column to athlete_profiles table');
      
      const sql = `
        ALTER TABLE athlete_profiles 
        ADD COLUMN IF NOT EXISTS personal_values JSONB DEFAULT '[]'::jsonb;
      `;
      
      if (!(await executeSQL(sql))) {
        console.error('Failed to add personal_values column');
        return false;
      }
    } else {
      console.log('personal_values column already exists in athlete_profiles table');
    }
    
    // Add content_types column if it doesn't exist
    if (!(await columnExists('athlete_profiles', 'content_types'))) {
      console.log('Adding content_types column to athlete_profiles table');
      
      const sql = `
        ALTER TABLE athlete_profiles 
        ADD COLUMN IF NOT EXISTS content_types JSONB DEFAULT '[]'::jsonb;
      `;
      
      if (!(await executeSQL(sql))) {
        console.error('Failed to add content_types column');
        return false;
      }
    } else {
      console.log('content_types column already exists in athlete_profiles table');
    }
    
    // Add preferences column if it doesn't exist
    if (!(await columnExists('athlete_profiles', 'preferences'))) {
      console.log('Adding preferences column to athlete_profiles table');
      
      const sql = `
        ALTER TABLE athlete_profiles 
        ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;
      `;
      
      if (!(await executeSQL(sql))) {
        console.error('Failed to add preferences column');
        return false;
      }
      
      // If content_style exists but content_types doesn't, migrate the data
      if ((await columnExists('athlete_profiles', 'content_style'))) {
        console.log('Migrating content_style data to content_types');
        
        const migrationSql = `
          UPDATE athlete_profiles
          SET content_types = jsonb_build_array(content_style)
          WHERE content_style IS NOT NULL AND content_types IS NULL;
        `;
        
        await executeSQL(migrationSql);
      }
    } else {
      console.log('preferences column already exists in athlete_profiles table');
    }
    
    console.log('Athlete profiles migration completed successfully');
    return true;
  } catch (error) {
    console.error('Error during athlete profiles migration:', error);
    return false;
  }
}

async function migrateBusinessProfileFields(): Promise<boolean> {
  try {
    console.log('Migrating business_profiles table fields...');
    
    // Check if the table exists
    if (!(await tableExists('business_profiles'))) {
      console.error('business_profiles table does not exist');
      return false;
    }
    
    // Add preferences column if it doesn't exist
    if (!(await columnExists('business_profiles', 'preferences'))) {
      console.log('Adding preferences column to business_profiles table');
      
      const sql = `
        ALTER TABLE business_profiles 
        ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;
      `;
      
      if (!(await executeSQL(sql))) {
        console.error('Failed to add preferences column');
        return false;
      }
    } else {
      console.log('preferences column already exists in business_profiles table');
    }
    
    console.log('Business profiles migration completed successfully');
    return true;
  } catch (error) {
    console.error('Error during business profiles migration:', error);
    return false;
  }
}

async function runMigration() {
  try {
    console.log('Starting profile fields migration...');
    
    // Run athlete profile migration
    const athleteResult = await migrateAthleteProfileFields();
    console.log('Athlete profiles migration result:', athleteResult ? 'Success' : 'Failed');
    
    // Run business profile migration
    const businessResult = await migrateBusinessProfileFields();
    console.log('Business profiles migration result:', businessResult ? 'Success' : 'Failed');
    
    console.log('Migration process completed');
    return athleteResult && businessResult;
  } catch (error) {
    console.error('Error during migration process:', error);
    return false;
  }
}

// Run the migration when the script is executed directly
if (process.argv[1] === import.meta.url) {
  runMigration().then(success => {
    if (success) {
      console.log('All migrations completed successfully');
    } else {
      console.error('One or more migrations failed');
    }
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Migration process failed with exception:', error);
    process.exit(1);
  });
}

export { 
  migrateAthleteProfileFields, 
  migrateBusinessProfileFields,
  runMigration 
};
