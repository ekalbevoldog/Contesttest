-- Migration to create missing tables referenced in code but not in SupabaseSchema 050825 1618CST


-- Create campaigns table
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  deliverables JSONB,
  budget TEXT,
  budget_min INTEGER,
  budget_max INTEGER,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  target_audience JSONB,
  target_sports TEXT[],
  target_divisions TEXT[],
  target_follower_counts JSONB,
  created_by UUID REFERENCES public.users(id),
  launched_at TIMESTAMP WITH TIME ZONE,
  terms_accepted BOOLEAN DEFAULT FALSE,
  terms_accepted_at TIMESTAMP WITH TIME ZONE,
  terms_accepted_by UUID REFERENCES public.users(id),
  bundle_type TEXT,
  bundle_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create campaign_stats table
CREATE TABLE IF NOT EXISTS public.campaign_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  view_count INTEGER DEFAULT 0,
  athlete_count INTEGER DEFAULT 0,
  offer_count INTEGER DEFAULT 0,
  acceptance_rate NUMERIC(5,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create campaign_activities table
CREATE TABLE IF NOT EXISTS public.campaign_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  actor_id UUID REFERENCES public.users(id),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bundles table
CREATE TABLE IF NOT EXISTS public.bundles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  athlete_ids UUID[] NOT NULL,
  bundle_type TEXT NOT NULL DEFAULT 'standard',
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create match_scores table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.match_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  score NUMERIC(4,3) CHECK (score >= 0 AND score <= 1),
  status TEXT NOT NULL DEFAULT 'pending',
  athlete_response TEXT,
  responded_at TIMESTAMP WITH TIME ZONE,
  compliance_status TEXT DEFAULT 'pending',
  compliance_officer_id UUID REFERENCES public.users(id),
  compliance_notes TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create partnership_offers table
CREATE TABLE IF NOT EXISTS public.partnership_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID REFERENCES public.match_scores(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  compensation_type TEXT NOT NULL,
  offer_amount TEXT NOT NULL,
  payment_schedule TEXT,
  bonus_structure JSONB,
  deliverables JSONB,
  content_specifications TEXT,
  post_frequency TEXT,
  approval_process TEXT,
  usage_rights TEXT NOT NULL,
  term TEXT NOT NULL,
  exclusivity TEXT,
  geographic_restrictions TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  athlete_response TEXT,
  responded_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  canceled_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create offers table as a shorthand for partnership_offers
CREATE TABLE IF NOT EXISTS public.offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  bundle_type TEXT,
  compensation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.users(id)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes to improve query performance
CREATE INDEX IF NOT EXISTS idx_campaigns_business_id ON public.campaigns(business_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_match_scores_athlete_id ON public.match_scores(athlete_id);
CREATE INDEX IF NOT EXISTS idx_match_scores_business_id ON public.match_scores(business_id);
CREATE INDEX IF NOT EXISTS idx_match_scores_campaign_id ON public.match_scores(campaign_id);
CREATE INDEX IF NOT EXISTS idx_partnership_offers_athlete_id ON public.partnership_offers(athlete_id);
CREATE INDEX IF NOT EXISTS idx_partnership_offers_business_id ON public.partnership_offers(business_id);
CREATE INDEX IF NOT EXISTS idx_partnership_offers_match_id ON public.partnership_offers(match_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON public.messages(session_id);

-- Add RLS policies for campaigns
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own campaigns" ON public.campaigns
FOR SELECT
USING (auth.uid() = business_id);

CREATE POLICY "Users can insert own campaigns" ON public.campaigns
FOR INSERT
WITH CHECK (auth.uid() = business_id);

CREATE POLICY "Users can update own campaigns" ON public.campaigns
FOR UPDATE
USING (auth.uid() = business_id)
WITH CHECK (auth.uid() = business_id);

CREATE POLICY "Users can delete own campaigns" ON public.campaigns
FOR DELETE
USING (auth.uid() = business_id);

-- Add RLS policies for match_scores
ALTER TABLE public.match_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their matches" ON public.match_scores
FOR SELECT
USING (auth.uid() = athlete_id OR auth.uid() = business_id);

-- Add RLS policies for partnership_offers
ALTER TABLE public.partnership_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their offers" ON public.partnership_offers
FOR SELECT
USING (auth.uid() = athlete_id OR auth.uid() = business_id);

-- Add RLS policies for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add admin policies for all tables
DO $$
DECLARE
  table_names TEXT[] := ARRAY[
    'campaigns', 'campaign_stats', 'campaign_activities', 
    'bundles', 'match_scores', 'partnership_offers', 
    'offers', 'notifications', 'messages'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY table_names LOOP
    EXECUTE format('
      CREATE POLICY "Admins can do everything" ON public.%I
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid()
          AND users.role = ''admin''
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid()
          AND users.role = ''admin''
        )
      )
    ', t);
  END LOOP;
END $$;