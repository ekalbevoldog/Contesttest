
-- Complete Supabase Schema Migration
-- This migration creates a comprehensive database schema with proper Auth connections

-- Drop existing tables if they exist (to ensure clean migration)
DROP TABLE IF EXISTS public.partnership_offers CASCADE;
DROP TABLE IF EXISTS public.match_scores CASCADE;
DROP TABLE IF EXISTS public.campaigns CASCADE;
DROP TABLE IF EXISTS public.feedbacks CASCADE;
DROP TABLE IF EXISTS public.compliance_officers CASCADE;
DROP TABLE IF EXISTS public.athlete_profiles CASCADE;
DROP TABLE IF EXISTS public.business_profiles CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Create users table that properly links to Auth
CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('athlete', 'business', 'compliance', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_login TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS public.sessions (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  user_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
  user_type TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  profile_completed BOOLEAN DEFAULT false,
  last_login TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create athlete_profiles table
CREATE TABLE IF NOT EXISTS public.athlete_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL UNIQUE,
  
  -- Basic Information
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  birthdate DATE,
  gender TEXT,
  bio TEXT,
  zipcode TEXT,
  
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
  follower_count INTEGER NOT NULL DEFAULT 0,
  average_engagement_rate REAL,
  
  -- Social Media OAuth Connections
  social_connections JSONB DEFAULT '{}'::jsonb,
  instagram_metrics JSONB DEFAULT '{}'::jsonb,
  twitter_metrics JSONB DEFAULT '{}'::jsonb,
  tiktok_metrics JSONB DEFAULT '{}'::jsonb,
  last_metrics_update TIMESTAMP WITH TIME ZONE,
  
  -- Profile Link Settings
  profile_link_enabled BOOLEAN DEFAULT false,
  profile_link_id TEXT,
  profile_link_theme TEXT DEFAULT 'default',
  profile_link_background_color TEXT DEFAULT '#111111',
  profile_link_text_color TEXT DEFAULT '#ffffff',
  profile_link_accent_color TEXT DEFAULT '#ff4500',
  profile_link_bio TEXT,
  profile_link_photo_url TEXT,
  profile_link_buttons JSONB DEFAULT '{}'::jsonb,
  
  -- Content Creation
  content_style TEXT NOT NULL,
  content_types JSONB DEFAULT '[]'::jsonb,
  top_performing_content_themes JSONB DEFAULT '[]'::jsonb,
  media_kit_url TEXT,
  
  -- Brand Preferences
  compensation_goals TEXT NOT NULL,
  preferred_product_categories JSONB DEFAULT '[]'::jsonb,
  previous_brand_deals JSONB DEFAULT '[]'::jsonb,
  available_for_travel BOOLEAN DEFAULT false,
  exclusivity_requirements TEXT,
  
  -- Personal Brand
  personal_values JSONB DEFAULT '[]'::jsonb,
  causes JSONB DEFAULT '[]'::jsonb,
  brand_personality JSONB DEFAULT '{}'::jsonb,
  
  -- Availability & Requirements
  availability_timeframe TEXT,
  minimum_compensation TEXT,
  
  -- Preferences and Algorithm Data
  preferences JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create business_profiles table
CREATE TABLE IF NOT EXISTS public.business_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL UNIQUE,
  
  -- Basic Information
  name TEXT NOT NULL,
  email TEXT,
  industry TEXT,
  business_type TEXT,
  company_size TEXT,
  founded_year INTEGER,
  website TEXT,
  logo TEXT,
  zipcode TEXT,
  
  -- Product Information
  product_type TEXT NOT NULL,
  product_description TEXT,
  product_images JSONB DEFAULT '[]'::jsonb,
  pricing_tier TEXT,
  
  -- Marketing Information
  audience_goals TEXT NOT NULL,
  audience_demographics JSONB DEFAULT '{}'::jsonb,
  primary_audience_age_range TEXT,
  secondary_audience_age_range TEXT,
  
  -- Campaign Details
  campaign_vibe TEXT NOT NULL,
  campaign_goals JSONB DEFAULT '[]'::jsonb,
  campaign_frequency TEXT,
  campaign_duration TEXT,
  campaign_seasonality TEXT,
  campaign_timeline TEXT,
  
  -- Brand Information
  values TEXT NOT NULL,
  brand_voice TEXT,
  brand_colors JSONB DEFAULT '[]'::jsonb,
  brand_guidelines TEXT,
  sustainability_focus BOOLEAN DEFAULT false,
  
  -- Athletic Targeting
  target_schools_sports TEXT NOT NULL,
  preferred_sports JSONB DEFAULT '[]'::jsonb,
  preferred_divisions JSONB DEFAULT '[]'::jsonb,
  preferred_regions JSONB DEFAULT '[]'::jsonb,
  
  -- Budget and Compensation
  budget TEXT,
  budget_min INTEGER,
  budget_max INTEGER,
  compensation_model TEXT,
  budget_per_athlete TEXT,
  
  -- Previous Experience
  has_previous_partnerships BOOLEAN DEFAULT false,
  previous_influencer_campaigns JSONB DEFAULT '[]'::jsonb,
  campaign_success_metrics JSONB DEFAULT '{}'::jsonb,
  
  -- Goals
  goals JSONB DEFAULT '[]'::jsonb,
  
  -- Preferences and Algorithm Data
  preferences JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create campaigns table
CREATE TABLE IF NOT EXISTS public.campaigns (
  id SERIAL PRIMARY KEY,
  business_id INTEGER NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  
  -- Campaign Overview
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  campaign_brief TEXT,
  campaign_type TEXT,
  
  -- Deliverables and Requirements
  deliverables JSONB NOT NULL DEFAULT '[]'::jsonb,
  content_requirements JSONB DEFAULT '{}'::jsonb,
  brand_mention_requirements TEXT,
  hashtag_requirements JSONB DEFAULT '[]'::jsonb,
  exclusivity_clause TEXT,
  
  -- Timeline
  start_date DATE,
  end_date DATE,
  submission_deadlines JSONB DEFAULT '{}'::jsonb,
  
  -- Targeting
  target_audience JSONB DEFAULT '{}'::jsonb,
  target_sports JSONB DEFAULT '[]'::jsonb,
  target_divisions JSONB DEFAULT '[]'::jsonb,
  target_regions JSONB DEFAULT '[]'::jsonb,
  target_follower_counts JSONB DEFAULT '{}'::jsonb,
  target_engagement_rates JSONB DEFAULT '{}'::jsonb,
  
  -- Budget
  budget TEXT,
  compensation_details JSONB DEFAULT '{}'::jsonb,
  
  -- Performance
  kpis JSONB DEFAULT '{}'::jsonb,
  goals JSONB DEFAULT '[]'::jsonb,
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create match_scores table
CREATE TABLE IF NOT EXISTS public.match_scores (
  id SERIAL PRIMARY KEY,
  athlete_id INTEGER NOT NULL REFERENCES public.athlete_profiles(id) ON DELETE CASCADE,
  business_id INTEGER NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  campaign_id INTEGER NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  
  -- Match Details
  score REAL NOT NULL,
  reason TEXT NOT NULL,
  strength_areas JSONB DEFAULT '[]'::jsonb,
  weakness_areas JSONB DEFAULT '[]'::jsonb,
  
  -- AI Analysis
  audience_fit_score REAL,
  content_style_fit_score REAL,
  brand_value_alignment_score REAL,
  engagement_potential_score REAL,
  compensation_fit_score REAL,
  academic_alignment_score REAL,
  geographic_fit_score REAL,
  timing_compatibility_score REAL,
  platform_specialization_score REAL,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed')),
  athlete_response TEXT,
  business_response TEXT,
  compliance_status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  compliance_officer_id INTEGER REFERENCES public.users(id),
  compliance_notes TEXT,
  
  -- Timestamps
  matched_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Uniqueness constraint
  UNIQUE(athlete_id, business_id, campaign_id)
);

-- Create compliance_officers table
CREATE TABLE IF NOT EXISTS public.compliance_officers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  institution TEXT NOT NULL,
  department TEXT NOT NULL,
  title TEXT NOT NULL,
  permissions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create partnership_offers table
CREATE TABLE IF NOT EXISTS public.partnership_offers (
  id SERIAL PRIMARY KEY,
  match_id INTEGER REFERENCES public.match_scores(id) NOT NULL,
  business_id INTEGER REFERENCES public.business_profiles(id) NOT NULL,
  athlete_id INTEGER REFERENCES public.athlete_profiles(id) NOT NULL,
  campaign_id INTEGER REFERENCES public.campaigns(id) NOT NULL,
  
  -- Compensation Details
  compensation_type TEXT NOT NULL CHECK (compensation_type IN ('monetary', 'product', 'affiliate', 'hybrid')),
  offer_amount TEXT NOT NULL,
  payment_schedule TEXT,
  bonus_structure TEXT,
  
  -- Deliverables
  deliverables JSONB NOT NULL DEFAULT '[]'::jsonb,
  content_specifications TEXT,
  post_frequency TEXT,
  approval_process TEXT,
  
  -- Rights and Terms
  usage_rights TEXT NOT NULL,
  term TEXT NOT NULL,
  exclusivity TEXT,
  geographic_restrictions TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  athlete_viewed_at TIMESTAMP WITH TIME ZONE,
  athlete_responded_at TIMESTAMP WITH TIME ZONE,
  business_updated_at TIMESTAMP WITH TIME ZONE,
  
  -- Compliance
  compliance_status TEXT DEFAULT 'pending' CHECK (compliance_status IN ('pending', 'approved', 'rejected')),
  compliance_notes TEXT,
  compliance_reviewed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Uniqueness constraint
  UNIQUE(match_id)
);

-- Create feedbacks table
CREATE TABLE IF NOT EXISTS public.feedbacks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES public.users(id) NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('athlete', 'business', 'compliance', 'admin')),
  match_id INTEGER REFERENCES public.match_scores(id),
  partnership_id INTEGER REFERENCES public.partnership_offers(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  response TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'rejected')),
  public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  response_by INTEGER REFERENCES public.users(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);
CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON public.sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON public.messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_athlete_profiles_user_id ON public.athlete_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_athlete_profiles_session_id ON public.athlete_profiles(session_id);
CREATE INDEX IF NOT EXISTS idx_business_profiles_user_id ON public.business_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_business_profiles_session_id ON public.business_profiles(session_id);
CREATE INDEX IF NOT EXISTS idx_match_scores_athlete_id ON public.match_scores(athlete_id);
CREATE INDEX IF NOT EXISTS idx_match_scores_business_id ON public.match_scores(business_id);
CREATE INDEX IF NOT EXISTS idx_match_scores_campaign_id ON public.match_scores(campaign_id);
CREATE INDEX IF NOT EXISTS idx_partnership_offers_athlete_id ON public.partnership_offers(athlete_id);
CREATE INDEX IF NOT EXISTS idx_partnership_offers_business_id ON public.partnership_offers(business_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_user_id ON public.feedbacks(user_id);

-- Create RLS policies
-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athlete_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partnership_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

-- Create trigger functions for updated_at timestamps
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for each table with updated_at
CREATE TRIGGER set_updated_at_users
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_sessions
BEFORE UPDATE ON public.sessions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_athlete_profiles
BEFORE UPDATE ON public.athlete_profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_business_profiles
BEFORE UPDATE ON public.business_profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_campaigns
BEFORE UPDATE ON public.campaigns
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_compliance_officers
BEFORE UPDATE ON public.compliance_officers
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_partnership_offers
BEFORE UPDATE ON public.partnership_offers
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_feedbacks
BEFORE UPDATE ON public.feedbacks
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Create a function to handle new Supabase Auth users
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (auth_id, email, username, role, created_at)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'preferred_username', SPLIT_PART(NEW.email, '@', 1)), 
    COALESCE(NEW.raw_user_meta_data->>'role', 'athlete'),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger on auth.users to add new users to our table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- Create a function to sync user updates from auth
CREATE OR REPLACE FUNCTION public.handle_auth_user_updates() 
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET 
    email = NEW.email,
    last_login = CASE 
      WHEN OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at 
      THEN NEW.last_sign_in_at
      ELSE public.users.last_login
    END
  WHERE auth_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger on auth.users updates
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
AFTER UPDATE ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_updates();
