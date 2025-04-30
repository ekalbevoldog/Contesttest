-- Function to determine a user's profile type based on roles and profile existence
-- Returns: 'business', 'athlete', 'compliance', 'admin', or null
CREATE OR REPLACE FUNCTION get_user_profile_type()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id TEXT;
  user_role TEXT;
  has_profile BOOLEAN := FALSE;
BEGIN
  -- Get the current user's ID from the Supabase auth.uid()
  user_id := auth.uid();
  
  IF user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get the user's role from the users table
  SELECT role INTO user_role
  FROM public.users
  WHERE auth_id = user_id;
  
  -- If no role found, return null
  IF user_role IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- For users with specific roles, verify they have the corresponding profile
  IF user_role = 'business' THEN
    -- Check if business profile exists
    SELECT EXISTS (
      SELECT 1 
      FROM public.business_profiles 
      WHERE user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
    ) INTO has_profile;
    
    IF has_profile THEN
      RETURN 'business';
    ELSE
      RETURN NULL; -- Business user without profile
    END IF;
    
  ELSIF user_role = 'athlete' THEN
    -- Check if athlete profile exists
    SELECT EXISTS (
      SELECT 1 
      FROM public.athlete_profiles 
      WHERE user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
    ) INTO has_profile;
    
    IF has_profile THEN
      RETURN 'athlete';
    ELSE
      RETURN NULL; -- Athlete user without profile
    END IF;
    
  ELSIF user_role = 'compliance' OR user_role = 'admin' THEN
    -- These roles don't require profiles
    RETURN user_role;
  ELSE
    -- Unknown role
    RETURN NULL;
  END IF;
END;
$$;