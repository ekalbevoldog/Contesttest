CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP DEFAULT NOW(),
  name TEXT,
  email TEXT,
  auth_user_id UUID REFERENCES auth.users(id)
);