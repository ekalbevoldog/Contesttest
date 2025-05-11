
-- Function to update a user with proper role enum casting
CREATE OR REPLACE FUNCTION update_user_with_role(
  user_id UUID,
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
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Simplified function that only updates the role field with proper casting
CREATE OR REPLACE FUNCTION update_user_role_only(
  user_id UUID,
  user_role TEXT
) RETURNS VOID AS $$
BEGIN
  UPDATE public.users
  SET role = user_role::public.user_role
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;
