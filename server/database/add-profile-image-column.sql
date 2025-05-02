-- Add profile_image column to business_profiles if it doesn't exist
ALTER TABLE public.business_profiles
ADD COLUMN IF NOT EXISTS profile_image TEXT;

-- Add profile_image column to athlete_profiles if it doesn't exist
ALTER TABLE public.athlete_profiles
ADD COLUMN IF NOT EXISTS profile_image TEXT;

-- Update RLS policies to allow access to these columns
ALTER POLICY "Users can view own business profiles" ON public.business_profiles
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

ALTER POLICY "Users can view own athlete profiles" ON public.athlete_profiles
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);