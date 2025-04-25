import { supabase } from './supabase';

async function checkSimpleSchema() {
  try {
    // Try inserting a user with minimal data including role field
    const { data: simpleUser, error: simpleUserError } = await supabase
      .from('users')
      .insert({
        email: 'simple@example.com',
        role: 'athlete'
      })
      .select();
      
    if (simpleUserError) {
      console.error('Error creating simple user:', simpleUserError);
    } else {
      console.log('Successfully created user with minimal fields:', simpleUser);
      
      // If user created successfully, look at structure
      console.log('User column names:', Object.keys(simpleUser[0]));
    }
    
    // Try to read users table structure by selecting a single row
    const { data: existingUsers, error: existingUsersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
      
    if (existingUsersError) {
      console.error('Error reading users table:', existingUsersError);
    } else if (existingUsers && existingUsers.length > 0) {
      console.log('Example user structure:', Object.keys(existingUsers[0]));
    } else {
      console.log('Users table exists but is empty');
    }
    
    // Cleanup - delete test user
    await supabase
      .from('users')
      .delete()
      .eq('email', 'simple@example.com');
      
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkSimpleSchema().then(() => console.log('Simple schema check complete'));