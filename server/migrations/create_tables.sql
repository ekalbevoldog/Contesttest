-- Create Sessions table
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

-- Create Messages table
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS sessions_session_id_idx ON sessions(session_id);
CREATE INDEX IF NOT EXISTS messages_session_id_idx ON messages(session_id);

-- Sample inserts for testing (optional)
INSERT INTO sessions (session_id, user_type, data, profile_completed)
VALUES ('test-session-123', 'user', '{"visited": true}', false)
ON CONFLICT (session_id) DO NOTHING;
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
