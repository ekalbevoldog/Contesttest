import { supabase } from './supabase';

async function createUserCredentialsTable() {
  console.log('Creating user_credentials table in Supabase...');
  
  try {
    // SQL to create the user_credentials table
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS public.user_credentials (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_user_credentials_user_id ON public.user_credentials (user_id);
    `;
    
    // Execute the SQL using Supabase's REST API
    const { error } = await supabase.rpc('exec_sql', { sql: createTableSql });
    
    if (error) {
      if (error.message.includes('function "exec_sql" does not exist')) {
        console.error('Function "exec_sql" does not exist in your Supabase project.');
        console.log('We will try an alternative method: creating a table through the client API');
        
        // Try creating a table using the REST API
        const { error: tableError } = await supabase.from('user_credentials').insert({
          user_id: 'placeholder',
          password_hash: 'placeholder',
          salt: 'placeholder'
        });
        
        if (tableError && tableError.code === '42P01') {
          console.log('Table does not exist yet. We should create it through the Supabase dashboard.');
          console.log('Please create the user_credentials table with these columns:');
          console.log('- id: serial PRIMARY KEY');
          console.log('- user_id: text NOT NULL REFERENCES users(id)');
          console.log('- password_hash: text NOT NULL');
          console.log('- salt: text NOT NULL');
          console.log('- created_at: timestamptz DEFAULT NOW()');
          console.log('- updated_at: timestamptz DEFAULT NOW()');
        } else if (tableError) {
          console.error('Error testing user_credentials table:', tableError);
        } else {
          console.log('Successfully inserted test record into user_credentials');
          
          // Clean up the test record
          const { error: deleteError } = await supabase
            .from('user_credentials')
            .delete()
            .eq('user_id', 'placeholder');
            
          if (deleteError) {
            console.error('Error deleting test record:', deleteError);
          }
        }
      } else {
        console.error('Error creating user_credentials table:', error);
      }
    } else {
      console.log('Successfully created user_credentials table!');
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

createUserCredentialsTable().then(() => console.log('Finished table creation process'));