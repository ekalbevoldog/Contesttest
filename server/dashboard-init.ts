import { supabaseAdmin } from './supabase';
import { pool } from './db';

export async function initializeDashboardTables() {
  console.log('Checking dashboard tables...');
  
  try {
    // Check if the user_dashboard_configs table exists
    const { data: configTableExists, error: configError } = await supabaseAdmin
      .from('user_dashboard_configs')
      .select('id')
      .limit(1);
    
    if (configError && configError.code === 'PGRST116') {
      console.log('Creating user_dashboard_configs table...');
      
      // Create user_dashboard_configs table using pool.query instead of supabase.query
      await pool.query(`
        CREATE TABLE IF NOT EXISTS public.user_dashboard_configs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          widgets JSONB NOT NULL DEFAULT '[]',
          last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          UNIQUE(user_id)
        );
        
        -- Add RLS (Row Level Security) policies for user_dashboard_configs
        ALTER TABLE public.user_dashboard_configs ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view their own dashboard configs"
            ON public.user_dashboard_configs FOR SELECT
            USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can insert their own dashboard configs"
            ON public.user_dashboard_configs FOR INSERT
            WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can update their own dashboard configs"
            ON public.user_dashboard_configs FOR UPDATE
            USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can delete their own dashboard configs"
            ON public.user_dashboard_configs FOR DELETE
            USING (auth.uid() = user_id);
      `);
      
      console.log('Created user_dashboard_configs table successfully');
    } else {
      console.log('user_dashboard_configs table already exists');
    }
    
    // Check if the user_dashboard_preferences table exists
    const { data: prefsTableExists, error: prefsError } = await supabaseAdmin
      .from('user_dashboard_preferences')
      .select('id')
      .limit(1);
    
    if (prefsError && prefsError.code === 'PGRST116') {
      console.log('Creating user_dashboard_preferences table...');
      
      // Create user_dashboard_preferences table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS public.user_dashboard_preferences (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          preference_type TEXT NOT NULL,
          data JSONB NOT NULL DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          UNIQUE(user_id, preference_type)
        );
        
        -- Add RLS policies for user_dashboard_preferences
        ALTER TABLE public.user_dashboard_preferences ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view their own dashboard preferences"
            ON public.user_dashboard_preferences FOR SELECT
            USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can insert their own dashboard preferences"
            ON public.user_dashboard_preferences FOR INSERT
            WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can update their own dashboard preferences"
            ON public.user_dashboard_preferences FOR UPDATE
            USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can delete their own dashboard preferences"
            ON public.user_dashboard_preferences FOR DELETE
            USING (auth.uid() = user_id);
        
        -- Create function to update the updated_at timestamp
        CREATE OR REPLACE FUNCTION update_modified_column()
        RETURNS TRIGGER AS $$
        BEGIN
           NEW.updated_at = now();
           RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        -- Create triggers to automatically update the updated_at column
        CREATE TRIGGER update_user_dashboard_preferences_modtime
        BEFORE UPDATE ON public.user_dashboard_preferences
        FOR EACH ROW EXECUTE FUNCTION update_modified_column();
      `);
      
      console.log('Created user_dashboard_preferences table successfully');
    } else {
      console.log('user_dashboard_preferences table already exists');
    }
    
    // Grant permissions
    await pool.query(`
      -- Add necessary grants for the service role
      GRANT ALL ON public.user_dashboard_configs TO authenticated;
      GRANT ALL ON public.user_dashboard_preferences TO authenticated;
      
      -- Create indexes for faster lookups
      CREATE INDEX IF NOT EXISTS idx_user_dashboard_configs_user_id ON public.user_dashboard_configs(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_dashboard_preferences_user_id ON public.user_dashboard_preferences(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_dashboard_preferences_type ON public.user_dashboard_preferences(preference_type);
    `);
    
    console.log('Dashboard tables initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing dashboard tables:', error);
    return false;
  }
}