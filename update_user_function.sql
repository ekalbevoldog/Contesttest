CREATE OR REPLACE FUNCTION update_user_with_role(
  user_id UUID,
  user_role TEXT,
  user_first_name TEXT,
  user_last_name TEXT,
  user_full_name TEXT
) RETURNS VOID AS 7589
BEGIN
  UPDATE users 
  SET 
    role = user_role::public.user_role,
    first_name = user_first_name,
    last_name = user_last_name,
    full_name = user_full_name
  WHERE id = user_id;
END;
7589 LANGUAGE plpgsql;
