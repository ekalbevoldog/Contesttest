import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Default placeholder values
let supabaseUrl = '';
let supabaseKey = '';

// Create the Supabase client with placeholder values first - will be updated after initialization
export let supabase: SupabaseClient;

// We'll use a flag to track initialization state
let isInitialized = false;

// Function to initialize the Supabase client with config from our server
export async function initializeSupabase(): Promise<boolean> {
  // If already initialized, just return true
  if (isInitialized && supabase) {
    console.log('[Client] Supabase already initialized.');
    return true;
  }

  try {
    console.log('[Client] Fetching Supabase configuration from server...');
    
    // Make sure we have a proper fetch call with error handling
    const response = await fetch('/api/config/supabase', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
    });
    
    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(`Failed to fetch Supabase config (${response.status}): ${errorMessage}`);
    }
    
    const config = await response.json();
    
    // Validate configuration
    if (!config || !config.url || !config.key) {
      throw new Error('Invalid Supabase configuration received from server');
    }
    
    supabaseUrl = config.url;
    supabaseKey = config.key;
    
    console.log(`[Client] Supabase URL available: ${!!supabaseUrl}`);
    console.log(`[Client] Supabase URL prefix: ${supabaseUrl ? `${supabaseUrl.substring(0, 10)}...` : 'missing'}`);
    console.log(`[Client] Supabase Key available: ${!!supabaseKey}`);
    
    // Initialize the Supabase client
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        storageKey: 'nil-connect-auth'
      }
    });
    
    // Test the connection
    const { error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      console.error('[Client] Could not connect to Supabase:', error);
      throw new Error(`Supabase connection failed: ${error.message}`);
    }
    
    console.log('[Client] Supabase initialized successfully');
    isInitialized = true;
    return true;
  } catch (error) {
    console.error('[Client] Error initializing Supabase:', error);
    // Re-throw the error to propagate it to the caller for proper error handling
    throw error;
  }
}

// Helper functions for athlete onboarding
export const registerAthlete = async (userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) => {
  // First register with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: userData.email,
    password: userData.password,
    options: {
      data: {
        first_name: userData.firstName,
        last_name: userData.lastName,
        full_name: `${userData.firstName} ${userData.lastName}`,
        user_type: 'athlete'
      }
    }
  });

  if (authError) {
    console.error('Supabase registration error:', authError);
    throw new Error(authError.message);
  }

  return authData;
};

export const createAthleteProfile = async (profileData: any) => {
  const { data, error } = await supabase
    .from('athlete_profiles')
    .insert(profileData)
    .select()
    .single();

  if (error) {
    console.error('Error creating athlete profile:', error);
    throw new Error(error.message);
  }

  return data;
};

// Test function to verify connection to Supabase
export const testSupabaseConnection = async () => {
  try {
    console.log('[Client] Testing Supabase connection...');
    const { data, error } = await supabase.from('sessions').select('count').limit(1);
    
    if (error) {
      console.error('[Client] Supabase connection test failed:', error.message);
      return false;
    }
    
    console.log('[Client] Supabase connection test successful:', data);
    return true;
  } catch (error) {
    console.error('[Client] Unexpected error during Supabase connection test:', error);
    return false;
  }
};