CREATE TABLE athletes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP DEFAULT NOW(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  dob DATE,
  sport TEXT,
  position TEXT,
  university TEXT,
  eligibility_status TEXT,
  audience_size INTEGER,
  social_links TEXT[],
  has_past_deals BOOLEAN,
  preferred_industries TEXT[],
  auth_user_id UUID REFERENCES auth.users(id)
);