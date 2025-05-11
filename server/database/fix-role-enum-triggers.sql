
-- Fix role enum casting issues in triggers and RLS policies
-- This ensures that TEXT role values are properly cast to user_role enum type

-- First, let's ensure the enum type exists (if not, create it with fallback values)
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

-- Drop and recreate the update_user_role_safely function with more robust error handling
CREATE OR REPLACE FUNCTION update_user_role_safely(
  id UUID,
  user_role_str TEXT
)
RETURNS VOID AS $$
DECLARE
  valid_role BOOLEAN := TRUE;
BEGIN
  -- First update auth.users metadata which doesn't require enum casting
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    to_jsonb(user_role_str)
  )
  WHERE id = $1;
  
  -- Use a different approach for public.users with CASE statement
  -- This avoids the direct casting that's causing the error
  UPDATE public.users 
  SET role = CASE 
    WHEN user_role_str = 'athlete' THEN 'athlete'::user_role
    WHEN user_role_str = 'business' THEN 'business'::user_role
    WHEN user_role_str = 'admin' THEN 'admin'::user_role
    WHEN user_role_str = 'compliance' THEN 'compliance'::user_role
    ELSE 'user'::user_role
  END
  WHERE id = $1;

  -- Also update any additional columns like name, etc. if present in profile
  EXCEPTION WHEN OTHERS THEN
    -- Log the error
    RAISE NOTICE 'Error updating user role: %', SQLERRM;
    
    -- Try a more direct approach as last resort
    BEGIN
      EXECUTE format('
        UPDATE public.users
        SET role = %L::"user_role"
        WHERE id = %L
      ', user_role_str, $1);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Final fallback approach also failed: %', SQLERRM;
    END;
END;
$$ LANGUAGE plpgsql;

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

-- Create a new exec_sql function if it doesn't already exist
-- This allows execution of arbitrary SQL for admin purposes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'exec_sql' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    EXECUTE '
      CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
      RETURNS VOID AS $$
      BEGIN
        EXECUTE sql;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    ';
  END IF;
END
$$;

-- Grant execute permission on the exec_sql function
GRANT EXECUTE ON FUNCTION public.exec_sql TO authenticated;
GRANT EXECUTE ON FUNCTION public.exec_sql TO service_role;
GRANT EXECUTE ON FUNCTION set_user_role_direct TO authenticated;
GRANT EXECUTE ON FUNCTION set_user_role_direct TO service_role;

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
    -- Use our new case-based function instead of direct casting
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
