
-- Fix user role casting issues
-- These functions properly cast string role values to the user_role enum type

CREATE OR REPLACE FUNCTION update_user_with_role(
  id UUID,
  user_role TEXT,
  user_first_name TEXT,
  user_last_name TEXT,
  user_full_name TEXT
) RETURNS VOID AS $$
BEGIN
  UPDATE public.users
  SET 
    role = user_role::public.user_role,
    first_name = user_first_name,
    last_name = user_last_name,
    full_name = user_full_name
  WHERE id = id;
END;
$$ LANGUAGE plpgsql;

-- Simplified function that only updates the role field with proper casting
CREATE OR REPLACE FUNCTION update_user_role_only(
  id UUID,
  user_role TEXT
) RETURNS VOID AS $$
BEGIN
  -- Use explicit variable naming to avoid ambiguity
  UPDATE public.users
  SET role = user_role::public.user_role
  WHERE id = $1;
END;
$$ LANGUAGE plpgsql;

-- New safer function for user role update
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
  EXECUTE format('
    UPDATE public.users
    SET role = %L::"user_role"
    WHERE id = %L
  ', user_role_str, $1);
END;
$$ LANGUAGE plpgsql;
