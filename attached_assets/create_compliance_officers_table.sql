CREATE TABLE compliance_officers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP DEFAULT NOW(),
  name TEXT,
  email TEXT,
  institution TEXT,
  auth_user_id UUID REFERENCES auth.users(id)
);