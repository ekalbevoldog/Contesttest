-- Fix role enum casting issues in triggers and RLS policies
-- This ensures that TEXT role values are properly cast to user_role enum type

-- Drop and recreate the user_role_safely function with better error handling and explicit casting
CREATE OR REPLACE FUNCTION update_user_role_safely(
  id UUID,
  user_role_str TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Update auth.users metadata
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    to_jsonb(user_role_str)
  )
  WHERE id = $1;
  
  -- Use explicit casting for the role column in public.users
  -- Handle each valid enum value separately to avoid casting errors
  IF user_role_str = 'athlete' THEN
    UPDATE public.users SET role = 'athlete'::user_role WHERE id = $1;
  ELSIF user_role_str = 'business' THEN
    UPDATE public.users SET role = 'business'::user_role WHERE id = $1;
  ELSIF user_role_str = 'admin' THEN
    UPDATE public.users SET role = 'admin'::user_role WHERE id = $1;
  ELSIF user_role_str = 'compliance' THEN
    UPDATE public.users SET role = 'compliance'::user_role WHERE id = $1;
  ELSE
    -- Default to 'user' for unrecognized roles
    UPDATE public.users SET role = 'user'::user_role WHERE id = $1;
  END IF;
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
    -- Update the public.users table with proper enum casting
    EXECUTE format('
      UPDATE public.users
      SET role = %L::user_role
      WHERE id = %L
    ', role_val, new.id);
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