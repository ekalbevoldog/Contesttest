import { supabase } from './supabase.js';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger.js';

/**
 * Initialize dashboard tables in the database if they don't exist
 */
export async function initializeDashboardTables(): Promise<{ success: boolean, error?: string }> {
  try {
    logger.info('[Dashboard Init] Checking and initializing dashboard tables');
    
    // Check if tables exist
    const { error: checkError } = await supabase.query(`
      SELECT to_regclass('public.user_dashboard_configs') as configs,
             to_regclass('public.user_dashboard_preferences') as prefs
    `);
    
    if (checkError) {
      logger.error('[Dashboard Init] Error checking for dashboard tables:', checkError);
      return { success: false, error: checkError.message };
    }
    
    // Create user_dashboard_configs table if it doesn't exist
    logger.info('[Dashboard Init] Creating user_dashboard_configs table if it doesn\'t exist');
    const { error: configTableError } = await supabase.query(`
      CREATE TABLE IF NOT EXISTS public.user_dashboard_configs (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        layout JSONB NOT NULL DEFAULT '[]'::jsonb,
        settings JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Create index for faster lookups by user_id
      CREATE INDEX IF NOT EXISTS idx_dashboard_configs_user_id ON public.user_dashboard_configs(user_id);
    `);
    
    if (configTableError) {
      logger.error('[Dashboard Init] Error creating user_dashboard_configs table:', configTableError);
      return { success: false, error: configTableError.message };
    }
    
    // Create trigger to automatically update the updated_at timestamp
    logger.info('[Dashboard Init] Creating update trigger for user_dashboard_configs');
    const { error: configTriggerError } = await supabase.query(`
      -- Function to update updated_at timestamp
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      
      -- Create the trigger if it doesn't exist
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger
          WHERE tgname = 'set_dashboard_configs_updated_at'
        ) THEN
          CREATE TRIGGER set_dashboard_configs_updated_at
          BEFORE UPDATE ON public.user_dashboard_configs
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
        END IF;
      END
      $$;
    `);
    
    if (configTriggerError) {
      logger.error('[Dashboard Init] Error creating update trigger for user_dashboard_configs:', configTriggerError);
      // Non-fatal error, continue
    }
    
    // Create user_dashboard_preferences table if it doesn't exist
    logger.info('[Dashboard Init] Creating user_dashboard_preferences table if it doesn\'t exist');
    const { error: prefsTableError } = await supabase.query(`
      CREATE TABLE IF NOT EXISTS public.user_dashboard_preferences (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        widget_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
        theme TEXT NOT NULL DEFAULT 'system',
        refresh_interval INTEGER NOT NULL DEFAULT 30,
        hidden_widgets TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Create index for faster lookups by user_id
      CREATE INDEX IF NOT EXISTS idx_dashboard_prefs_user_id ON public.user_dashboard_preferences(user_id);
    `);
    
    if (prefsTableError) {
      logger.error('[Dashboard Init] Error creating user_dashboard_preferences table:', prefsTableError);
      return { success: false, error: prefsTableError.message };
    }
    
    // Create trigger to automatically update the updated_at timestamp for preferences
    logger.info('[Dashboard Init] Creating update trigger for user_dashboard_preferences');
    const { error: prefsTriggerError } = await supabase.query(`
      -- Create the trigger if it doesn't exist
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger
          WHERE tgname = 'set_dashboard_prefs_updated_at'
        ) THEN
          CREATE TRIGGER set_dashboard_prefs_updated_at
          BEFORE UPDATE ON public.user_dashboard_preferences
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
        END IF;
      END
      $$;
    `);
    
    if (prefsTriggerError) {
      logger.error('[Dashboard Init] Error creating update trigger for user_dashboard_preferences:', prefsTriggerError);
      // Non-fatal error, continue
    }
    
    // Create RLS policies to restrict access to dashboard data
    logger.info('[Dashboard Init] Setting up RLS policies for dashboard tables');
    const { error: rlsError } = await supabase.query(`
      -- Enable RLS on the tables
      ALTER TABLE public.user_dashboard_configs ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.user_dashboard_preferences ENABLE ROW LEVEL SECURITY;
      
      -- Create policies for user_dashboard_configs
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'user_dashboard_configs' AND policyname = 'users_can_select_own_configs'
        ) THEN
          CREATE POLICY users_can_select_own_configs ON public.user_dashboard_configs
            FOR SELECT USING (user_id = auth.uid());
        END IF;
        
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'user_dashboard_configs' AND policyname = 'users_can_insert_own_configs'
        ) THEN
          CREATE POLICY users_can_insert_own_configs ON public.user_dashboard_configs
            FOR INSERT WITH CHECK (user_id = auth.uid());
        END IF;
        
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'user_dashboard_configs' AND policyname = 'users_can_update_own_configs'
        ) THEN
          CREATE POLICY users_can_update_own_configs ON public.user_dashboard_configs
            FOR UPDATE USING (user_id = auth.uid());
        END IF;
      END
      $$;
      
      -- Create policies for user_dashboard_preferences
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'user_dashboard_preferences' AND policyname = 'users_can_select_own_prefs'
        ) THEN
          CREATE POLICY users_can_select_own_prefs ON public.user_dashboard_preferences
            FOR SELECT USING (user_id = auth.uid());
        END IF;
        
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'user_dashboard_preferences' AND policyname = 'users_can_insert_own_prefs'
        ) THEN
          CREATE POLICY users_can_insert_own_prefs ON public.user_dashboard_preferences
            FOR INSERT WITH CHECK (user_id = auth.uid());
        END IF;
        
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'user_dashboard_preferences' AND policyname = 'users_can_update_own_prefs'
        ) THEN
          CREATE POLICY users_can_update_own_prefs ON public.user_dashboard_preferences
            FOR UPDATE USING (user_id = auth.uid());
        END IF;
      END
      $$;
      
      -- Grant privileges to authenticated users and service role
      GRANT SELECT, INSERT, UPDATE ON public.user_dashboard_configs TO authenticated;
      GRANT SELECT, INSERT, UPDATE ON public.user_dashboard_preferences TO authenticated;
      GRANT ALL PRIVILEGES ON public.user_dashboard_configs TO service_role;
      GRANT ALL PRIVILEGES ON public.user_dashboard_preferences TO service_role;
      GRANT USAGE, SELECT ON SEQUENCE user_dashboard_configs_id_seq TO authenticated;
      GRANT USAGE, SELECT ON SEQUENCE user_dashboard_preferences_id_seq TO authenticated;
    `);
    
    if (rlsError) {
      logger.error('[Dashboard Init] Error setting up RLS policies:', rlsError);
      // Non-fatal error, continue
    }
    
    logger.info('[Dashboard Init] Dashboard tables initialized successfully');
    return { success: true };
  } catch (error) {
    logger.error('[Dashboard Init] Unexpected error initializing dashboard tables:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    };
  }
}