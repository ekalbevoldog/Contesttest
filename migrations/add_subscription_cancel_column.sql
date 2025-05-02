-- Add subscription_cancel_at_period_end column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS subscription_cancel_at_period_end BOOLEAN DEFAULT FALSE;

-- Update existing rows to have a default value
UPDATE public.users
SET subscription_cancel_at_period_end = FALSE
WHERE subscription_cancel_at_period_end IS NULL;