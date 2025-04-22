-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_login TIMESTAMP WITH TIME ZONE,
  auth_id TEXT UNIQUE
);

-- Create sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  user_type TEXT,
  data JSONB,
  profile_completed BOOLEAN DEFAULT false,
  athlete_id INTEGER,
  business_id INTEGER,
  last_login TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create athlete_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS athlete_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
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
  
  -- Social Media OAuth Connections
  social_connections JSONB, -- Store OAuth tokens and connection status
  instagram_metrics JSONB, -- Store cached metrics from Instagram
  twitter_metrics JSONB, -- Store cached metrics from Twitter
  tiktok_metrics JSONB, -- Store cached metrics from TikTok
  last_metrics_update TIMESTAMP WITH TIME ZONE, -- Timestamp of last metrics update
  
  -- Profile Link Settings
  profile_link_enabled BOOLEAN DEFAULT false,
  profile_link_id TEXT,
  profile_link_theme TEXT DEFAULT 'default',
  profile_link_background_color TEXT DEFAULT '#111111',
  profile_link_text_color TEXT DEFAULT '#ffffff',
  profile_link_accent_color TEXT DEFAULT '#ff4500',
  profile_link_bio TEXT,
  profile_link_photo_url TEXT,
  profile_link_buttons JSONB,
  follower_count INTEGER NOT NULL,
  average_engagement_rate REAL,
  content_quality INTEGER, -- 1-10 rating
  post_frequency TEXT, -- daily, weekly, etc.
  
  -- Content Creation
  content_style TEXT NOT NULL,
  content_types JSONB, -- video, photo, blog, etc
  top_performing_content_themes JSONB,
  media_kit_url TEXT,
  
  -- Brand Preferences
  compensation_goals TEXT NOT NULL,
  preferred_product_categories JSONB,
  previous_brand_deals JSONB,
  available_for_travel BOOLEAN,
  exclusivity_requirements TEXT,
  
  -- Personal Brand
  personal_values JSONB,
  causes JSONB,
  brand_personality JSONB, -- assessments of personality traits
  
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
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  session_id TEXT NOT NULL,
  
  -- Basic Information
  name TEXT NOT NULL,
  email TEXT,
  industry TEXT,
  business_type TEXT,
  company_size TEXT,
  founded_year INTEGER,
  website TEXT,
  logo TEXT,
  zipCode TEXT,
  
  -- Product Information
  product_type TEXT NOT NULL,
  product_description TEXT,
  product_images JSONB,
  pricing_tier TEXT, -- premium, mid-range, budget
  
  -- Marketing Information
  audience_goals TEXT NOT NULL,
  audience_demographics JSONB,
  primary_audience_age_range TEXT,
  secondary_audience_age_range TEXT,
  
  -- Campaign Details
  campaign_vibe TEXT NOT NULL,
  campaign_goals JSONB,
  campaign_frequency TEXT,
  campaign_duration TEXT,
  campaign_seasonality TEXT,
  campaign_timeline TEXT,
  
  -- Brand Information
  values TEXT NOT NULL,
  brand_voice TEXT,
  brand_colors JSONB,
  brand_guidelines TEXT,
  sustainability_focus BOOLEAN,
  
  -- Athletic Targeting
  target_schools_sports TEXT NOT NULL,
  preferred_sports JSONB,
  preferred_divisions JSONB,
  preferred_regions JSONB,
  
  -- Budget and Compensation
  budget TEXT,
  budgetMin INTEGER,
  budgetMax INTEGER,
  compensation_model TEXT, -- monetary, product, affiliate, etc.
  budget_per_athlete TEXT,
  
  -- Previous Experience
  hasPreviousPartnerships BOOLEAN,
  previous_influencer_campaigns JSONB,
  campaign_success_metrics JSONB,
  
  -- Goals
  goals JSONB,
  
  -- Preferences and Algorithm Data
  preferences JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create campaigns table if it doesn't exist
CREATE TABLE IF NOT EXISTS campaigns (
  id SERIAL PRIMARY KEY,
  business_id INTEGER NOT NULL,
  
  -- Campaign Overview
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  campaign_brief TEXT,
  campaign_type TEXT, -- ongoing, one-time, seasonal
  
  -- Deliverables and Requirements
  deliverables JSONB NOT NULL,
  content_requirements JSONB,
  brand_mention_requirements TEXT,
  hashtag_requirements JSONB,
  exclusivity_clause TEXT,
  
  -- Timeline
  start_date DATE,
  end_date DATE,
  submission_deadlines JSONB,
  
  -- Targeting
  target_audience JSONB,
  target_sports JSONB,
  target_divisions JSONB,
  target_regions JSONB,
  target_follower_counts JSONB,
  target_engagement_rates JSONB,
  
  -- Budget
  budget TEXT,
  compensation_details JSONB,
  
  -- Performance
  kpis JSONB, -- Key Performance Indicators
  goals JSONB,
  
  -- Status
  status TEXT DEFAULT 'draft', -- draft, active, completed, cancelled
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create match_scores table if it doesn't exist
CREATE TABLE IF NOT EXISTS match_scores (
  id SERIAL PRIMARY KEY,
  athlete_id INTEGER NOT NULL,
  business_id INTEGER NOT NULL,
  campaign_id INTEGER NOT NULL,
  
  -- Match Details
  score REAL NOT NULL,
  reason TEXT NOT NULL,
  strength_areas JSONB,
  weakness_areas JSONB,
  
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
  status TEXT DEFAULT 'pending', -- pending, accepted, declined, completed
  athlete_response TEXT,
  business_response TEXT,
  compliance_status TEXT DEFAULT 'pending', -- pending, approved, rejected
  compliance_officer_id INTEGER,
  compliance_notes TEXT,
  
  -- Timestamps
  matched_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create compliance_officers table if it doesn't exist
CREATE TABLE IF NOT EXISTS compliance_officers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  institution TEXT NOT NULL,
  department TEXT NOT NULL,
  title TEXT NOT NULL,
  permissions JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create partnership_offers table if it doesn't exist
CREATE TABLE IF NOT EXISTS partnership_offers (
  id SERIAL PRIMARY KEY,
  match_id INTEGER REFERENCES match_scores(id) NOT NULL,
  business_id INTEGER REFERENCES business_profiles(id) NOT NULL,
  athlete_id INTEGER REFERENCES athlete_profiles(id) NOT NULL,
  campaign_id INTEGER REFERENCES campaigns(id) NOT NULL,
  
  -- Compensation Details
  compensation_type TEXT NOT NULL, -- monetary, product, affiliate, hybrid
  offer_amount TEXT NOT NULL, -- monetary value or product value
  payment_schedule TEXT, -- one-time, monthly, per-deliverable
  bonus_structure TEXT, -- performance bonuses or incentives
  
  -- Deliverables
  deliverables JSONB NOT NULL, -- array of required content pieces
  content_specifications TEXT, -- detailed content requirements
  post_frequency TEXT, -- how often content should be posted
  approval_process TEXT, -- content approval workflow
  
  -- Rights and Terms
  usage_rights TEXT NOT NULL, -- how business can use athlete's content
  term TEXT NOT NULL, -- duration of the partnership
  exclusivity TEXT, -- exclusivity requirements
  geographic_restrictions TEXT, -- where content can be shared
  
  -- Status
  status TEXT DEFAULT 'pending' NOT NULL, -- pending, accepted, declined, expired
  athlete_viewed_at TIMESTAMP WITH TIME ZONE,
  athlete_responded_at TIMESTAMP WITH TIME ZONE,
  business_updated_at TIMESTAMP WITH TIME ZONE,
  
  -- Compliance
  compliance_status TEXT DEFAULT 'pending', -- pending, approved, rejected
  compliance_notes TEXT,
  compliance_reviewed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create feedbacks table if it doesn't exist
CREATE TABLE IF NOT EXISTS feedbacks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  user_type TEXT NOT NULL, -- athlete, business, compliance, admin
  match_id INTEGER REFERENCES match_scores(id),
  partnership_id INTEGER REFERENCES partnership_offers(id),
  rating INTEGER NOT NULL, -- 1-5 rating
  category TEXT NOT NULL, -- platform, content, partner, payment, etc.
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  response TEXT, -- Official response from compliance
  status TEXT DEFAULT 'pending', -- pending, resolved, rejected
  public BOOLEAN DEFAULT FALSE, -- Whether visible on public testimonials
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  response_by INTEGER REFERENCES users(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_athlete_profiles_user_id ON athlete_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_business_profiles_user_id ON business_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_match_scores_athlete_id ON match_scores(athlete_id);
CREATE INDEX IF NOT EXISTS idx_match_scores_business_id ON match_scores(business_id);
CREATE INDEX IF NOT EXISTS idx_match_scores_campaign_id ON match_scores(campaign_id);
CREATE INDEX IF NOT EXISTS idx_partnership_offers_athlete_id ON partnership_offers(athlete_id);
CREATE INDEX IF NOT EXISTS idx_partnership_offers_business_id ON partnership_offers(business_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_user_id ON feedbacks(user_id);