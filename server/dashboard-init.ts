import { supabase } from './supabase.js';
import { logger } from './logger.js';

interface InitResult {
  success: boolean;
  error?: string;
}

/**
 * Initialize dashboard tables for storing configurations and preferences
 */
export async function initializeDashboardTables(): Promise<InitResult> {
  try {
    logger.info('[Dashboard Init] Checking and initializing dashboard tables');
    
    // Create dashboard config table
    const configTableResult = await createDashboardConfigTable();
    if (!configTableResult.success) {
      return { success: false, error: configTableResult.error };
    }
    
    // Create dashboard preferences table
    const prefsTableResult = await createDashboardPreferencesTable();
    if (!prefsTableResult.success) {
      return { success: false, error: prefsTableResult.error };
    }
    
    // Set up Row-Level Security and grants
    const securityResult = await setupTableSecurity();
    if (!securityResult.success) {
      return { success: false, error: securityResult.error };
    }
    
    return { success: true };
  } catch (error) {
    logger.error('[Dashboard Init] Unexpected error initializing dashboard tables:', error);
    return { success: false, error: 'Unexpected error initializing dashboard tables' };
  }
}

/**
 * Create user_dashboard_configs table if it doesn't exist
 */
async function createDashboardConfigTable(): Promise<InitResult> {
  try {
    const { error } = await supabase.query(`
      CREATE TABLE IF NOT EXISTS user_dashboard_configs (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        layout JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT user_dashboard_unique_user_id UNIQUE (user_id)
      );
      
      -- Create index for faster lookups
      CREATE INDEX IF NOT EXISTS idx_user_dashboard_configs_user_id ON user_dashboard_configs(user_id);
    `);
    
    if (error) {
      logger.error('[Dashboard Init] Error creating dashboard config table:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    logger.error('[Dashboard Init] Error creating dashboard config table:', error);
    return { success: false, error: 'Error creating dashboard config table' };
  }
}

/**
 * Create user_dashboard_preferences table if it doesn't exist
 */
async function createDashboardPreferencesTable(): Promise<InitResult> {
  try {
    const { error } = await supabase.query(`
      CREATE TABLE IF NOT EXISTS user_dashboard_preferences (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        theme VARCHAR(20) DEFAULT 'system',
        refresh_interval INTEGER DEFAULT 30,
        widget_preferences JSONB DEFAULT '{}'::jsonb,
        hidden_widgets JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT user_dashboard_prefs_unique_user_id UNIQUE (user_id)
      );
      
      -- Create index for faster lookups
      CREATE INDEX IF NOT EXISTS idx_user_dashboard_prefs_user_id ON user_dashboard_preferences(user_id);
    `);
    
    if (error) {
      logger.error('[Dashboard Init] Error creating dashboard preferences table:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    logger.error('[Dashboard Init] Error creating dashboard preferences table:', error);
    return { success: false, error: 'Error creating dashboard preferences table' };
  }
}

/**
 * Set up Row-Level Security and grants
 */
async function setupTableSecurity(): Promise<InitResult> {
  try {
    // Enable RLS on dashboard tables
    const { error: rlsError } = await supabase.query(`
      -- Enable Row Level Security
      ALTER TABLE user_dashboard_configs ENABLE ROW LEVEL SECURITY;
      ALTER TABLE user_dashboard_preferences ENABLE ROW LEVEL SECURITY;
      
      -- Create policies for user_dashboard_configs
      DROP POLICY IF EXISTS "Users can view their own dashboard config" ON user_dashboard_configs;
      CREATE POLICY "Users can view their own dashboard config"
        ON user_dashboard_configs FOR SELECT
        USING (auth.uid() = user_id);
        
      DROP POLICY IF EXISTS "Users can update their own dashboard config" ON user_dashboard_configs;
      CREATE POLICY "Users can update their own dashboard config"
        ON user_dashboard_configs FOR UPDATE
        USING (auth.uid() = user_id);
        
      DROP POLICY IF EXISTS "Users can insert their own dashboard config" ON user_dashboard_configs;
      CREATE POLICY "Users can insert their own dashboard config"
        ON user_dashboard_configs FOR INSERT
        WITH CHECK (auth.uid() = user_id);
        
      -- Create policies for user_dashboard_preferences
      DROP POLICY IF EXISTS "Users can view their own dashboard preferences" ON user_dashboard_preferences;
      CREATE POLICY "Users can view their own dashboard preferences"
        ON user_dashboard_preferences FOR SELECT
        USING (auth.uid() = user_id);
        
      DROP POLICY IF EXISTS "Users can update their own dashboard preferences" ON user_dashboard_preferences;
      CREATE POLICY "Users can update their own dashboard preferences"
        ON user_dashboard_preferences FOR UPDATE
        USING (auth.uid() = user_id);
        
      DROP POLICY IF EXISTS "Users can insert their own dashboard preferences" ON user_dashboard_preferences;
      CREATE POLICY "Users can insert their own dashboard preferences"
        ON user_dashboard_preferences FOR INSERT
        WITH CHECK (auth.uid() = user_id);
    `);
    
    if (rlsError) {
      logger.error('[Dashboard Init] Error setting up RLS policies:', rlsError);
      return { success: false, error: rlsError.message };
    }
    
    // Grant privileges to authenticated users
    const { error: grantError } = await supabase.query(`
      -- Grant privileges to authenticated users
      GRANT SELECT, INSERT, UPDATE ON user_dashboard_configs TO authenticated;
      GRANT SELECT, INSERT, UPDATE ON user_dashboard_preferences TO authenticated;
      GRANT USAGE, SELECT ON SEQUENCE user_dashboard_configs_id_seq TO authenticated;
      GRANT USAGE, SELECT ON SEQUENCE user_dashboard_preferences_id_seq TO authenticated;
    `);
    
    if (grantError) {
      logger.error('[Dashboard Init] Error granting privileges:', grantError);
      return { success: false, error: grantError.message };
    }
    
    return { success: true };
  } catch (error) {
    logger.error('[Dashboard Init] Error setting up table security:', error);
    return { success: false, error: 'Error setting up table security' };
  }
}