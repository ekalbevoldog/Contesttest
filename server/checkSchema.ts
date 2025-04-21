import { supabase } from './supabase';

async function checkSchema() {
  try {
    console.log('Checking users table schema');
    
    // Check users table columns via raw SQL
    const { data: userColumnsData, error: userColumnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'users' });
      
    if (userColumnsError) {
      console.error('Error fetching users table schema:', userColumnsError);
      
      // Try direct SQL query approach
      console.log('Trying to create a test user to see schema');
      const { data: testUser, error: testUserError } = await supabase
        .from('users')
        .insert({
          email: 'test@example.com',
          user_type: 'athlete'  // Try user_type (snake_case)
        })
        .select();
        
      if (testUserError) {
        console.error('Error creating test user with user_type:', testUserError);
        
        // Try with userType (camelCase)
        const { data: testUser2, error: testUserError2 } = await supabase
          .from('users')
          .insert({
            email: 'test2@example.com',
            userType: 'athlete'  // Try userType (camelCase)
          })
          .select();
          
        if (testUserError2) {
          console.error('Error creating test user with userType:', testUserError2);
        } else {
          console.log('Successfully created user with userType field:', testUser2);
        }
      } else {
        console.log('Successfully created user with user_type field:', testUser);
      }
    } else {
      console.log('Users table columns:', userColumnsData);
    }
    
    // Check if user_credentials table exists and create it if it doesn't
    console.log('Checking if user_credentials table exists');
    const { data: credColumns, error: credColumnsError } = await supabase
      .from('user_credentials')
      .select('*')
      .limit(1);
      
    if (credColumnsError && credColumnsError.code === '42P01') { // Table doesn't exist
      console.log('user_credentials table does not exist, creating it');
      
      // Create user_credentials table using SQL
      const { error: createTableError } = await supabase.rpc('run_sql', {
        sql: `
        CREATE TABLE IF NOT EXISTS public.user_credentials (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          password_hash TEXT NOT NULL,
          salt TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_user_credentials_user_id ON public.user_credentials (user_id);
        `
      });
      
      if (createTableError) {
        console.error('Error creating user_credentials table:', createTableError);
      } else {
        console.log('user_credentials table created successfully');
      }
    } else if (credColumnsError) {
      console.error('Error fetching user_credentials table:', credColumnsError);
    } else {
      if (credColumns && credColumns.length > 0) {
        console.log('User_credentials table columns:', Object.keys(credColumns[0]));
      } else {
        console.log('User_credentials table exists but no rows found');
      }
    }
  } catch (err) {
    console.error('Error checking schema:', err);
  }
}

// Execute and cleanup
checkSchema().then(() => {
  console.log('Schema check complete');
  
  // Clean up test users
  supabase.from('users')
    .delete()
    .in('email', ['test@example.com', 'test2@example.com'])
    .then(() => console.log('Test users deleted'))
    .catch(err => console.error('Error deleting test users:', err));
});