
// Script to validate users table schema compatibility with Supabase Auth

import { supabase } from "./supabase.js";

async function checkUsersTableSchema() {
  console.log("Checking users table schema...");

  // Check if users table exists
  const { data: tables, error: tablesError } = await supabase
    .from("information_schema.tables")
    .select("table_name")
    .eq("table_schema", "public")
    .eq("table_name", "users");

  if (tablesError) {
    console.error("Error checking for users table:", tablesError);
    return false;
  }

  if (!tables || tables.length === 0) {
    console.error("Users table does not exist!");
    return false;
  }

  console.log("✅ Users table exists");

  // Check if auth_id column exists
  const { data: columns, error: columnsError } = await supabase
    .from("information_schema.columns")
    .select("column_name, data_type")
    .eq("table_schema", "public")
    .eq("table_name", "users")
    .eq("column_name", "auth_id");

  if (columnsError) {
    console.error("Error checking for auth_id column:", columnsError);
    return false;
  }

  if (!columns || columns.length === 0) {
    console.error("❌ auth_id column does not exist in users table!");
    console.log("Creating auth_id column...");

    // Add auth_id column
    const { error: alterError } = await supabase.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE REFERENCES auth.users(id);
    `);

    if (alterError) {
      console.error("Failed to add auth_id column:", alterError);
      return false;
    }

    console.log("✅ Added auth_id column to users table");
  } else {
    console.log("✅ auth_id column exists with type:", columns[0].data_type);
  }

  // Check if auth_id is properly mapped for existing users
  const { data: unmappedUsers, error: unmappedError } = await supabase
    .from("users")
    .select("id, email")
    .is("auth_id", null);

  if (unmappedError) {
    console.error("Error checking for unmapped users:", unmappedError);
  } else if (unmappedUsers && unmappedUsers.length > 0) {
    console.log(`⚠️ Found ${unmappedUsers.length} users with null auth_id`);
    
    // For each unmapped user, try to find their auth user
    console.log("Attempting to map users to auth_id...");
    let mappedCount = 0;
    
    // Get all auth users
    const { data: authUsers, error: authUsersError } = await supabase.auth.admin.listUsers();
    
    if (authUsersError) {
      console.error("Error fetching auth users:", authUsersError);
    } else if (authUsers) {
      // Create a map of email -> auth_id for faster lookup
      const emailToAuthId = new Map();
      authUsers.users.forEach(user => {
        if (user.email) {
          emailToAuthId.set(user.email.toLowerCase(), user.id);
        }
      });
      
      // Update each unmapped user
      for (const user of unmappedUsers) {
        if (user.email && emailToAuthId.has(user.email.toLowerCase())) {
          const auth_id = emailToAuthId.get(user.email.toLowerCase());
          const { error: updateError } = await supabase
            .from("users")
            .update({ auth_id })
            .eq("id", user.id);
            
          if (!updateError) {
            mappedCount++;
          }
        }
      }
      
      console.log(`✅ Mapped ${mappedCount} users to their auth_id`);
    }
  } else {
    console.log("✅ All users have auth_id properly mapped");
  }
  
  return true;
}

// Run the check
checkUsersTableSchema().then(success => {
  if (success) {
    console.log("✅ Users table schema is compatible with Supabase Auth");
  } else {
    console.error("❌ Users table schema validation failed");
  }
});

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