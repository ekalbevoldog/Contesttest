import { supabase } from './supabase.js';

async function checkUsersSchema() {
  try {
    console.log('Checking users table schema...');
    
    // Try to get direct information about the users table structure
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_info', { target_table: 'users' });
    
    if (tableError) {
      console.error('Error fetching table info:', tableError);
    } else {
      console.log('Table info:', tableInfo);
    }
    
    // Simple approach to get table columns - select a single row and examine structure
    console.log('Trying to select a user to see columns...');
    const { data: sampleUser, error: sampleError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error('Error fetching sample user:', sampleError);
    } else if (sampleUser && sampleUser.length > 0) {
      console.log('Sample user columns:', Object.keys(sampleUser[0]));
    } else {
      console.log('No users found in the table');
    }
    
    // Try a direct SQL query if available
    try {
      console.log('Trying SQL to describe table...');
      const { data: describeData, error: describeError } = await supabase
        .rpc('exec_sql', {
          sql: `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = 'users'
          ORDER BY ordinal_position;
          `
        });
      
      if (describeError) {
        console.error('Error describing table via SQL:', describeError);
      } else {
        console.log('Table structure from SQL:', describeData);
      }
    } catch (sqlError) {
      console.error('SQL query error:', sqlError);
    }
    
    // Try a simple insert to see what columns are required
    console.log('Trying minimal insert to see required columns...');
    const { data: testInsert, error: insertError } = await supabase
      .from('users')
      .insert({
        email: 'test.schema@example.com',
        username: 'test_schema_user',
        role: 'business'
      })
      .select();
    
    if (insertError) {
      console.error('Insert error (shows missing required fields):', insertError);
    } else {
      console.log('Insert successful with minimal fields:', testInsert);
      
      // Clean up test user
      await supabase
        .from('users')
        .delete()
        .eq('email', 'test.schema@example.com');
    }
    
  } catch (error) {
    console.error('Unexpected error during schema check:', error);
  }
}

// Run the check
checkUsersSchema();