-- Add Stripe and subscription fields to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT,
ADD COLUMN IF NOT EXISTS subscription_plan TEXT,
ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMP,
ADD COLUMN IF NOT EXISTS subscription_cancel_at_period_end BOOLEAN DEFAULT FALSE;

-- Create subscription_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.subscription_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id TEXT NOT NULL,
  status TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  CONSTRAINT fk_user
    FOREIGN KEY (id)
    REFERENCES public.users(id)
    ON DELETE CASCADE
);

-- Add RLS policies for subscription_history table
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own subscription history
CREATE POLICY "Users can view own subscription history" ON public.subscription_history
FOR SELECT
USING (auth.uid() = id);

-- Allow admins to view all subscription history
CREATE POLICY "Admins can view all subscription history" ON public.subscription_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Allow backend services to insert subscription history
CREATE POLICY "Backend can insert subscription history" ON public.subscription_history
FOR INSERT
WITH CHECK (true);