
// Database Diagnostic Tool
// This script checks the structure and content of all database tables

import { supabase, supabaseAdmin } from '../server/supabase.js';

// Check if a table exists
async function tableExists(tableName: string): Promise<boolean> {
  try {
    console.log(`Checking if table ${tableName} exists...`);
    
    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '${tableName}'
        ) as exists;
      `
    });
    
    if (error) {
      console.error(`Error checking if table ${tableName} exists:`, error);
      return false;
    }
    
    const exists = data && data.length > 0 && data[0].exists;
    console.log(`Table ${tableName} exists: ${exists}`);
    return exists;
  } catch (error) {
    console.error(`Exception checking if table ${tableName} exists:`, error);
    return false;
  }
}

// Get column information for a table
async function getTableColumns(tableName: string): Promise<any[]> {
  try {
    console.log(`Getting column information for table ${tableName}...`);
    
    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = '${tableName}'
        ORDER BY ordinal_position;
      `
    });
    
    if (error) {
      console.error(`Error getting column information for table ${tableName}:`, error);
      return [];
    }
    
    console.log(`Retrieved ${data.length} columns for table ${tableName}`);
    return data || [];
  } catch (error) {
    console.error(`Exception getting column information for table ${tableName}:`, error);
    return [];
  }
}

// Get row count for a table
async function getTableRowCount(tableName: string): Promise<number> {
  try {
    console.log(`Getting row count for table ${tableName}...`);
    
    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      sql: `SELECT COUNT(*) as count FROM ${tableName};`
    });
    
    if (error) {
      console.error(`Error getting row count for table ${tableName}:`, error);
      return 0;
    }
    
    const count = data && data.length > 0 ? parseInt(data[0].count, 10) : 0;
    console.log(`Table ${tableName} has ${count} rows`);
    return count;
  } catch (error) {
    console.error(`Exception getting row count for table ${tableName}:`, error);
    return 0;
  }
}

// Check if a column exists in a table
async function columnExists(tableName: string, columnName: string): Promise<boolean> {
  const columns = await getTableColumns(tableName);
  const exists = columns.some(col => col.column_name === columnName);
  console.log(`Column ${columnName} in table ${tableName} exists: ${exists}`);
  return exists;
}

// Check for missing columns based on schema
async function checkMissingColumns(): Promise<{ table: string, missingColumns: string[] }[]> {
  const results: { table: string, missingColumns: string[] }[] = [];
  
  // Define expected columns for each table based on your schema
  const expectedColumns = {
    users: ['id', 'email', 'username', 'password', 'role', 'created_at', 'last_login', 'auth_id'],
    athlete_profiles: [
      'id', 'user_id', 'session_id', 'name', 'email', 'school', 'division', 'sport',
      'follower_count', 'content_style', 'compensation_goals', 'personal_values',
      'content_types', 'preferences'
    ],
    business_profiles: [
      'id', 'user_id', 'session_id', 'name', 'email', 'product_type',
      'audience_goals', 'campaign_vibe', 'values', 'target_schools_sports',
      'preferences'
    ]
  };
  
  // Check each table for missing columns
  for (const [table, columns] of Object.entries(expectedColumns)) {
    if (await tableExists(table)) {
      const existingColumns = await getTableColumns(table);
      const existingColumnNames = existingColumns.map(col => col.column_name);
      
      const missingColumns = columns.filter(col => !existingColumnNames.includes(col));
      
      if (missingColumns.length > 0) {
        results.push({ table, missingColumns });
        console.log(`Table ${table} is missing columns: ${missingColumns.join(', ')}`);
      } else {
        console.log(`Table ${table} has all expected columns`);
      }
    }
  }
  
  return results;
}

// Generate SQL to add missing columns
function generateAddColumnSQL(tableName: string, columnName: string): string {
  let dataType = 'TEXT';
  
  // Determine appropriate data type based on column name
  if (columnName.includes('id') && columnName !== 'user_id') {
    dataType = 'SERIAL';
  } else if (columnName === 'user_id') {
    dataType = 'UUID';
  } else if (columnName.includes('count')) {
    dataType = 'INTEGER';
  } else if (columnName.includes('preferences') || 
             columnName.includes('personal_values') || 
             columnName.includes('content_types')) {
    dataType = 'JSONB';
  } else if (columnName.includes('created_at') || 
             columnName.includes('updated_at') || 
             columnName.includes('last_login')) {
    dataType = 'TIMESTAMP WITH TIME ZONE';
  }
  
  return `ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS ${columnName} ${dataType};`;
}

// Main diagnostic function
async function runDiagnostic() {
  try {
    console.log('Starting database diagnostic...');
    
    // Check core tables
    const tables = ['users', 'sessions', 'athlete_profiles', 'business_profiles'];
    const tableStatus: Record<string, boolean> = {};
    
    for (const table of tables) {
      tableStatus[table] = await tableExists(table);
    }
    
    console.log('\nTable status:');
    console.table(tableStatus);
    
    // Check for missing columns
    const missingColumnsResults = await checkMissingColumns();
    
    console.log('\nMissing columns check completed');
    if (missingColumnsResults.length > 0) {
      console.log('SQL to add missing columns:');
      
      for (const { table, missingColumns } of missingColumnsResults) {
        for (const column of missingColumns) {
          const sql = generateAddColumnSQL(table, column);
          console.log(sql);
        }
      }
    } else {
      console.log('No missing columns detected');
    }
    
    // Check row counts
    console.log('\nRow counts:');
    for (const table of tables) {
      if (tableStatus[table]) {
        const count = await getTableRowCount(table);
        console.log(`- ${table}: ${count} rows`);
      }
    }
    
    // Check specific issues based on the error logs
    console.log('\nChecking specific issues from error logs:');
    
    // Check athlete_profiles for personalValues field
    if (tableStatus['athlete_profiles']) {
      const hasPersonalValues = await columnExists('athlete_profiles', 'personal_values');
      const hasContentTypes = await columnExists('athlete_profiles', 'content_types');
      
      console.log(`athlete_profiles.personal_values field exists: ${hasPersonalValues}`);
      console.log(`athlete_profiles.content_types field exists: ${hasContentTypes}`);
    }
    
    // Check business_profiles for preferences field
    if (tableStatus['business_profiles']) {
      const hasPreferences = await columnExists('business_profiles', 'preferences');
      console.log(`business_profiles.preferences field exists: ${hasPreferences}`);
    }
    
    console.log('\nDatabase diagnostic completed');
  } catch (error) {
    console.error('Error during database diagnostic:', error);
  }
}

// Run the diagnostic when the script is executed directly
if (process.argv[1] === import.meta.url) {
  runDiagnostic().then(() => {
    console.log('Diagnostic process completed');
    process.exit(0);
  }).catch(error => {
    console.error('Diagnostic process failed:', error);
    process.exit(1);
  });
}

export { 
  tableExists, 
  getTableColumns, 
  getTableRowCount, 
  columnExists,
  checkMissingColumns,
  runDiagnostic
};
