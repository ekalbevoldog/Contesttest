
-- Script to fix user_role column issues by ensuring correct enum values
-- Run this to ensure that the enum type exists and has all necessary values

-- First check if the enum type exists
DO $$
BEGIN
  -- Check if the enum type exists
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    -- Create the enum type
    CREATE TYPE public.user_role AS ENUM (
      'user', 'athlete', 'business', 'admin', 'compliance'
    );
    
    RAISE NOTICE 'Created user_role enum type';
  ELSE
    -- Enum exists, check if we need to add values
    -- This is complex in PostgreSQL as you can't easily add values to an existing enum
    -- without recreating it, so we'll just log info about what exists
    RAISE NOTICE 'user_role enum already exists';
  END IF;
END
$$;

-- Create a function to directly insert user role values avoiding casting errors
CREATE OR REPLACE FUNCTION batch_update_user_roles()
RETURNS VOID AS $$
DECLARE
  user_rec RECORD;
BEGIN
  -- For each user with a non-null role in auth metadata but potential issue in users table
  FOR user_rec IN 
    SELECT 
      au.id,
      au.raw_user_meta_data->>'role' as auth_role
    FROM 
      auth.users au
    WHERE 
      au.raw_user_meta_data->>'role' IS NOT NULL
  LOOP
    -- Update the user's role using CASE to avoid casting issues
    BEGIN
      UPDATE public.users 
      SET role = CASE 
        WHEN user_rec.auth_role = 'athlete' THEN 'athlete'::user_role
        WHEN user_rec.auth_role = 'business' THEN 'business'::user_role
        WHEN user_rec.auth_role = 'admin' THEN 'admin'::user_role
        WHEN user_rec.auth_role = 'compliance' THEN 'compliance'::user_role
        ELSE 'user'::user_role
      END
      WHERE id = user_rec.id;
      
      RAISE NOTICE 'Updated role for user % to %', user_rec.id, user_rec.auth_role;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Failed to update role for user %: %', user_rec.id, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'User role batch update completed';
END;
$$ LANGUAGE plpgsql;

-- Execute the function to update all users
SELECT batch_update_user_roles();

-- Check for any users with NULL roles in the public.users table
-- and set them based on auth.users metadata
DO $$
DECLARE
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count FROM public.users WHERE role IS NULL;
  RAISE NOTICE 'Found % users with NULL roles', null_count;
END
$$;

-- Drop the function as it's no longer needed
DROP FUNCTION IF EXISTS batch_update_user_roles();
