-- Start transaction to ensure all operations succeed or fail together
BEGIN;

-- 1. First drop the existing indexes that use user_id
DROP INDEX IF EXISTS idx_athlete_profiles_user_id;
DROP INDEX IF EXISTS idx_business_profiles_user_id;

-- 2. First add a new column to store the UUID values temporarily
ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS user_id_uuid UUID;
ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS user_id_uuid UUID;

-- 3. For existing records, we'll set a default value (null initially) 
-- We'll update this with the actual UUID values later in the application code

-- 4. Change the column type of user_id from INTEGER to UUID
-- Drop the old columns first
ALTER TABLE athlete_profiles DROP COLUMN IF EXISTS user_id CASCADE;
ALTER TABLE business_profiles DROP COLUMN IF EXISTS user_id CASCADE;

-- Rename the new UUID columns to user_id
ALTER TABLE athlete_profiles RENAME COLUMN user_id_uuid TO user_id;
ALTER TABLE business_profiles RENAME COLUMN user_id_uuid TO user_id;

-- 5. Make user_id NOT NULL and create new indexes
ALTER TABLE athlete_profiles ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE business_profiles ALTER COLUMN user_id SET NOT NULL;

-- 6. Create new indexes on the UUID columns
CREATE INDEX IF NOT EXISTS idx_athlete_profiles_user_id ON athlete_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_business_profiles_user_id ON business_profiles(user_id);

-- Remove original_user_id columns if they exist
ALTER TABLE athlete_profiles DROP COLUMN IF EXISTS original_user_id;
ALTER TABLE business_profiles DROP COLUMN IF EXISTS original_user_id;

-- Commit the transaction
COMMIT;