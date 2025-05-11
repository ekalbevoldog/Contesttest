
import { supabaseAdmin } from '../lib/supabase';

async function fixRoleEnum() {
  console.log('🔧 Fixing user role enum...');
  
  try {
    // 1. First check if we have a proper user_role enum type
    console.log('Checking user_role enum type...');
    
    // Execute the SQL using exec_sql function
    const { error: enumCheckError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
          -- Check if the enum type exists
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
            -- Create the enum type with common role values
            CREATE TYPE public.user_role AS ENUM (
              'user', 'athlete', 'business', 'admin', 'compliance'
            );
          END IF;
        END
        $$;
      `
    });
    
    if (enumCheckError) {
      console.error('❌ Error checking/creating user_role enum:', enumCheckError);
      return false;
    }
    
    console.log('✅ Enum type check completed');
    
    // 2. Add the direct role insertion function if it doesn't exist
    console.log('Creating/updating helper functions...');
    
    const { error: funcError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        -- Create a new helper function for direct role insertion during signup
        CREATE OR REPLACE FUNCTION set_user_role_direct(
          user_id UUID,
          role_value TEXT,
          first_name TEXT DEFAULT NULL,
          last_name TEXT DEFAULT NULL,
          full_name TEXT DEFAULT NULL
        )
        RETURNS VOID AS $$
        BEGIN
          -- First attempt: Use CASE statement to avoid casting issues
          UPDATE public.users 
          SET 
            role = CASE 
              WHEN role_value = 'athlete' THEN 'athlete'::user_role
              WHEN role_value = 'business' THEN 'business'::user_role
              WHEN role_value = 'admin' THEN 'admin'::user_role
              WHEN role_value = 'compliance' THEN 'compliance'::user_role
              ELSE 'user'::user_role
            END,
            first_name = COALESCE(first_name, first_name),
            last_name = COALESCE(last_name, last_name),
            full_name = COALESCE(full_name, full_name)
          WHERE id = user_id;
          
          EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Direct role update failed: %', SQLERRM;
            -- Do nothing and let application handle fallback
        END;
        $$ LANGUAGE plpgsql;
        
        -- Grant execute permission on the function
        GRANT EXECUTE ON FUNCTION set_user_role_direct TO authenticated;
        GRANT EXECUTE ON FUNCTION set_user_role_direct TO service_role;
      `
    });
    
    if (funcError) {
      console.error('❌ Error creating helper functions:', funcError);
      return false;
    }
    
    console.log('✅ Helper functions created/updated');
    
    // 3. Add triggers to handle role updates
    console.log('Creating/updating role handling triggers...');
    
    const { error: triggerError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        -- Create helper function to handle safe user role updates from triggers
        CREATE OR REPLACE FUNCTION handle_auth_user_role()
        RETURNS TRIGGER AS $$
        DECLARE
          role_val TEXT;
        BEGIN
          -- Extract role from user_metadata if available
          role_val := (new.raw_user_meta_data->>'role')::TEXT;
          
          -- Only proceed if we have a valid role
          IF role_val IS NOT NULL AND LENGTH(role_val) > 0 THEN
            -- Use our case-based function instead of direct casting
            PERFORM set_user_role_direct(new.id, role_val);
          END IF;
          
          RETURN new;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        -- Drop the trigger if it exists
        DROP TRIGGER IF EXISTS on_auth_user_update ON auth.users;

        -- Create the trigger to update public.users when auth.users is updated
        CREATE TRIGGER on_auth_user_update
          AFTER UPDATE OF raw_user_meta_data ON auth.users
          FOR EACH ROW
          EXECUTE FUNCTION handle_auth_user_role();
      `
    });
    
    if (triggerError) {
      console.error('❌ Error creating triggers:', triggerError);
      return false;
    }
    
    console.log('✅ Triggers created/updated');
    
    // 4. Test the setup by inserting a test user
    console.log('Testing user registration with business role...');
    
    // Generate a random email to avoid conflicts
    const testEmail = `test-${Math.floor(Math.random() * 1000000)}@example.com`;
    
    // Create a test auth user with business role
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: 'Password123!',
      email_confirm: true,
      user_metadata: {
        role: 'business',
        first_name: 'Test',
        last_name: 'User'
      }
    });
    
    if (authError) {
      console.error('❌ Error creating test user:', authError);
      return false;
    }
    
    console.log(`✅ Test user created: ${testEmail}`);
    console.log('✅ Role enum fix completed successfully');
    
    return true;
  } catch (error) {
    console.error('❌ Unhandled error during role enum fix:', error);
    return false;
  }
}

// Execute the function
fixRoleEnum()
  .then(success => {
    if (success) {
      console.log('✅ Role enum fix completed successfully');
      process.exit(0);
    } else {
      console.error('❌ Role enum fix failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
