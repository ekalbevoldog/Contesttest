-- Create athlete_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS athlete_profiles (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id TEXT NOT NULL,
  name TEXT NOT NULL,
  
  -- Basic Information
  email TEXT,
  phone TEXT,
  birthdate DATE,
  gender TEXT,
  bio TEXT,
  
  -- Academic Information
  school TEXT NOT NULL,
  division TEXT NOT NULL,
  graduation_year INTEGER,
  major TEXT,
  gpa REAL,
  academic_honors TEXT,
  
  -- Athletic Information
  sport TEXT NOT NULL,
  position TEXT,
  sport_achievements TEXT,
  stats JSONB,
  
  -- Social Media
  social_handles JSONB,
  follower_count INTEGER NOT NULL,
  average_engagement_rate REAL,
  
  -- Content Creation
  content_style TEXT NOT NULL,
  content_types JSONB,
  
  -- Brand Preferences
  compensation_goals TEXT NOT NULL,
  preferred_product_categories JSONB,
  previous_brand_deals JSONB,
  
  -- Personal Brand
  personal_values JSONB,
  causes JSONB,
  
  -- Availability & Requirements
  availability_timeframe TEXT,
  minimum_compensation TEXT,
  
  -- Preferences and Algorithm Data
  preferences JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create business_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS business_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID NOT NULL REFERENCES auth.users(id),
  session_id TEXT NOT NULL,
  
  -- Basic Information
  name TEXT NOT NULL,
  email TEXT,
  industry TEXT,
  business_type TEXT,
  company_size TEXT,
  zipCode TEXT,
  
  -- Product Information
  product_type TEXT NOT NULL,
  
  -- Marketing Information
  audience_goals TEXT NOT NULL,
  
  -- Campaign Details
  campaign_vibe TEXT NOT NULL,
  
  -- Brand Information
  values TEXT NOT NULL,
  
  -- Athletic Targeting
  target_schools_sports TEXT NOT NULL,
  
  -- Budget and Compensation
  budget TEXT,
  budgetMin INTEGER,
  budgetMax INTEGER,
  
  -- Previous Experience
  hasPreviousPartnerships BOOLEAN,
  
  -- Preferences and Algorithm Data
  preferences JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_athlete_profiles_user_id ON athlete_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_business_profiles_user_id ON business_profiles(user_id);

-- link athlete_profiles → users
ALTER TABLE public.athlete_profiles
  ADD CONSTRAINT athlete_profiles_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.users (id)
    ON DELETE CASCADE;

-- link business_profiles → users
ALTER TABLE public.business_profiles
  ADD CONSTRAINT business_profiles_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.users (id)
    ON DELETE CASCADE;

-- fix partnership_offers → athlete_profiles typo
ALTER TABLE public.partnership_offers
  DROP CONSTRAINT IF EXISTS partnership_offers_athlete_fkey,
  ADD CONSTRAINT partnership_offers_athlete_fkey
    FOREIGN KEY (athlete_id)
    REFERENCES public.athlete_profiles (id)
    ON DELETE CASCADE;

-- enforce unique session_id for safe upsert
ALTER TABLE public.athlete_profiles
  ADD CONSTRAINT athlete_profiles_session_id_key UNIQUE (session_id);

ALTER TABLE public.business_profiles
  ADD CONSTRAINT business_profiles_session_id_key UNIQUE (session_id);
