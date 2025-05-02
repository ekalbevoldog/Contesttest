
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP DEFAULT NOW(),
  account_type TEXT CHECK (account_type IN ('product', 'service')) NOT NULL,
  business_name TEXT NOT NULL,
  restricted_industry BOOLEAN DEFAULT FALSE,
  industry TEXT,
  goals TEXT[],
  has_partnered_before BOOLEAN,
  budget_min FLOAT,
  budget_max FLOAT,
  zip_code VARCHAR(10),
  contact_name TEXT,
  contact_title TEXT,
  contact_email TEXT,
  business_size TEXT,
  phone_number TEXT,
  auth_user_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'trial',
  trial_start_date TIMESTAMP DEFAULT NOW()
);
