import { supabase } from '../server/supabase.js';

async function addAuthIdColumnToUsersTable() {
  console.log('Checking users table schema...');
  
  try {
    // First check if the auth_id column already exists
    const { data: columns, error: columnsError } = await supabase.rpc('exec_sql', { 
      sql: `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users';
      `
    });
    
    if (columnsError) {
      console.error('Error checking columns:', columnsError);
      return;
    }
    
    console.log('Current columns in users table:', columns);
    
    // Check if auth_id column exists
    const hasAuthIdColumn = columns.some(col => col.column_name === 'auth_id');
    
    if (hasAuthIdColumn) {
      console.log('auth_id column already exists in users table');
      return;
    }
    
    console.log('Adding auth_id column to users table...');
    
    // Add the auth_id column
    const { error: addColumnError } = await supabase.rpc('exec_sql', { 
      sql: `
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE;
      `
    });
    
    if (addColumnError) {
      console.error('Error adding auth_id column:', addColumnError);
      return;
    }
    
    console.log('auth_id column added successfully to users table');
    
    // Update Row Level Security (RLS) for user-based access
    console.log('Updating RLS policies...');
    
    const { error: rlsError } = await supabase.rpc('exec_sql', { 
      sql: `
        -- Enable RLS on users table
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Users can view their own data" ON users;
        DROP POLICY IF EXISTS "Users can update their own data" ON users;
        
        -- Create policies for users table
        CREATE POLICY "Users can view their own data" 
        ON users FOR SELECT 
        USING (auth.uid() = auth_id OR auth.uid() IS NULL);
        
        CREATE POLICY "Users can update their own data" 
        ON users FOR UPDATE 
        USING (auth.uid() = auth_id);
      `
    });
    
    if (rlsError) {
      console.error('Error setting up RLS policies:', rlsError);
      return;
    }
    
    console.log('RLS policies updated successfully');
    
    // Setup similar RLS for business_profiles and athlete_profiles
    const { error: profilesRlsError } = await supabase.rpc('exec_sql', { 
      sql: `
        -- Enable RLS on profile tables
        ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;
        ALTER TABLE athlete_profiles ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Users can view their own business profile" ON business_profiles;
        DROP POLICY IF EXISTS "Users can update their own business profile" ON business_profiles;
        DROP POLICY IF EXISTS "Users can view their own athlete profile" ON athlete_profiles;
        DROP POLICY IF EXISTS "Users can update their own athlete profile" ON athlete_profiles;
        
        -- Create policies for business_profiles
        CREATE POLICY "Users can view their own business profile" 
        ON business_profiles FOR SELECT 
        USING ((user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())) OR auth.uid() IS NULL);
        
        CREATE POLICY "Users can update their own business profile" 
        ON business_profiles FOR UPDATE 
        USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
        
        -- Create policies for athlete_profiles
        CREATE POLICY "Users can view their own athlete profile" 
        ON athlete_profiles FOR SELECT 
        USING ((user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())) OR auth.uid() IS NULL);
        
        CREATE POLICY "Users can update their own athlete profile" 
        ON athlete_profiles FOR UPDATE 
        USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
      `
    });
    
    if (profilesRlsError) {
      console.error('Error setting up profile RLS policies:', profilesRlsError);
      return;
    }
    
    console.log('Profile RLS policies updated successfully');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the function
addAuthIdColumnToUsersTable()
  .then(() => console.log('Schema update script completed'))
  .catch(err => console.error('Error in schema update script:', err));