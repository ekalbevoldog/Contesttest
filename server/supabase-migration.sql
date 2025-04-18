-- Create tables for Contested platform in Supabase

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  user_type TEXT,
  data JSONB,
  profile_completed BOOLEAN DEFAULT FALSE,
  athlete_id INTEGER,
  business_id INTEGER,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  session_id TEXT,
  user_type TEXT NOT NULL CHECK (user_type IN ('athlete', 'business', 'compliance', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  password TEXT,
  avatar TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT
);

-- Athletes table
CREATE TABLE IF NOT EXISTS athletes (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id INTEGER,
  email TEXT,
  phone TEXT,
  birthdate TEXT,
  gender TEXT,
  bio TEXT,
  graduation_year TEXT,
  major TEXT,
  gpa TEXT,
  academic_honors JSONB,
  position TEXT,
  sport_achievements JSONB,
  stats JSONB,
  university TEXT,
  sport TEXT,
  team TEXT,
  height TEXT,
  weight TEXT,
  social_media_presence JSONB,
  social_connections JSONB,
  interests JSONB,
  media_appearances JSONB,
  personal_brand TEXT,
  endorsement_history JSONB,
  availability TEXT,
  profile_visibility TEXT,
  profile_url TEXT,
  highlight_reel_url TEXT,
  resume_url TEXT,
  portfolio_url TEXT,
  verification_status TEXT,
  verification_documents JSONB,
  public_profile TEXT,
  audience_demographics JSONB,
  content_strategy TEXT,
  content_examples JSONB,
  partnership_goals TEXT,
  preferred_industries JSONB,
  ideal_partnership_description TEXT,
  past_collaboration_examples JSONB,
  rate_card JSONB,
  compensation_expectations TEXT,
  metrics_screenshots JSONB,
  preferences JSONB
);

-- Businesses table
CREATE TABLE IF NOT EXISTS businesses (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  values TEXT,
  user_id INTEGER,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  country TEXT,
  website TEXT,
  social_media JSONB,
  industry TEXT,
  business_type TEXT,
  company_size TEXT,
  founding_year TEXT,
  revenue_range TEXT,
  mission_statement TEXT,
  business_description TEXT,
  target_audience JSONB,
  marketing_goals JSONB,
  previous_endorsements JSONB,
  endorsement_budget TEXT,
  partnership_timeline TEXT,
  contact_person_name TEXT,
  contact_person_role TEXT,
  contact_person_email TEXT,
  contact_person_phone TEXT,
  brand_guidelines_url TEXT,
  logo_url TEXT,
  company_brochure_url TEXT,
  product_catalog_url TEXT,
  marketing_materials_url TEXT,
  athletePreferences JSONB
);

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id SERIAL PRIMARY KEY,
  business_id INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT,
  budget TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  campaign_brief TEXT,
  timeline_start TEXT,
  timeline_end TEXT,
  target_demographics JSONB,
  target_platforms JSONB,
  target_sports JSONB,
  target_niches JSONB,
  audience_reach_target JSONB,
  content_requirements TEXT,
  deliverables JSONB,
  content_guidelines TEXT,
  exclusivity_terms TEXT,
  usage_rights TEXT,
  key_messaging TEXT,
  reporting_requirements TEXT,
  payment_terms TEXT,
  cancellation_terms TEXT,
  compliance_requirements TEXT,
  additional_notes TEXT,
  resources_provided JSONB,
  goals JSONB
);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
  id SERIAL PRIMARY KEY,
  athlete_id INTEGER NOT NULL,
  business_id INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT,
  campaign_id INTEGER,
  score NUMERIC NOT NULL,
  reason TEXT,
  strength_areas JSONB,
  weakness_areas JSONB,
  compatibility_analysis TEXT,
  match_tier TEXT,
  athlete_notes TEXT,
  business_notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  viewed_by_athlete BOOLEAN DEFAULT FALSE,
  viewed_by_business BOOLEAN DEFAULT FALSE,
  athlete_interested BOOLEAN DEFAULT FALSE,
  business_interested BOOLEAN DEFAULT FALSE,
  negotiation_started_at TIMESTAMP WITH TIME ZONE,
  agreement_reached_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Partnership Offers table
CREATE TABLE IF NOT EXISTS partnership_offers (
  id SERIAL PRIMARY KEY,
  athlete_id INTEGER NOT NULL,
  business_id INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL,
  post_frequency TEXT,
  deliverables JSONB,
  campaign_id INTEGER NOT NULL,
  match_id INTEGER NOT NULL,
  compensation_amount NUMERIC,
  compensation_currency TEXT,
  compensation_type TEXT,
  compensation_schedule TEXT,
  contract_terms TEXT,
  timeline_start TIMESTAMP WITH TIME ZONE,
  timeline_end TIMESTAMP WITH TIME ZONE,
  expected_deliverables JSONB,
  intellectual_property_terms TEXT,
  revisions_allowed INTEGER,
  cancellation_terms TEXT,
  compliance_status TEXT DEFAULT 'pending',
  compliance_notes TEXT,
  compliance_reviewed_at TIMESTAMP WITH TIME ZONE,
  viewed BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  metadata JSONB
);

-- Feedback table
CREATE TABLE IF NOT EXISTS feedbacks (
  id SERIAL PRIMARY KEY,
  user_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  match_id INTEGER,
  content TEXT NOT NULL,
  feedback_type TEXT NOT NULL,
  rating INTEGER,
  sentiment TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  admin_response TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_athletes_session_id ON athletes(session_id);
CREATE INDEX IF NOT EXISTS idx_businesses_session_id ON businesses(session_id);
CREATE INDEX IF NOT EXISTS idx_matches_athlete_id ON matches(athlete_id);
CREATE INDEX IF NOT EXISTS idx_matches_business_id ON matches(business_id);
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_partnership_offers_match_id ON partnership_offers(match_id);

-- Add Foreign Key relationships
ALTER TABLE athletes 
  ADD CONSTRAINT fk_athletes_user_id 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE businesses 
  ADD CONSTRAINT fk_businesses_user_id 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE campaigns 
  ADD CONSTRAINT fk_campaigns_business_id 
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE matches 
  ADD CONSTRAINT fk_matches_athlete_id 
  FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE;

ALTER TABLE matches 
  ADD CONSTRAINT fk_matches_business_id 
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE matches 
  ADD CONSTRAINT fk_matches_campaign_id 
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL;

ALTER TABLE partnership_offers 
  ADD CONSTRAINT fk_offers_athlete_id 
  FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE;

ALTER TABLE partnership_offers 
  ADD CONSTRAINT fk_offers_business_id 
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE partnership_offers 
  ADD CONSTRAINT fk_offers_campaign_id 
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;

ALTER TABLE partnership_offers 
  ADD CONSTRAINT fk_offers_match_id 
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE;

ALTER TABLE feedbacks 
  ADD CONSTRAINT fk_feedbacks_user_id 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE feedbacks 
  ADD CONSTRAINT fk_feedbacks_match_id 
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE SET NULL;