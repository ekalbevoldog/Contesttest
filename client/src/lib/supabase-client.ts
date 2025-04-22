import { createClient } from '@supabase/supabase-js';

// Instead of using environment variables directly, we'll initialize with empty values
// and then fetch the actual configuration from our server
let supabaseUrl = '';
let supabaseKey = '';

// Create the Supabase client with placeholder values first
export let supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storageKey: 'nil-connect-auth'
  }
});

// Function to initialize the Supabase client with config from our server
export async function initializeSupabase() {
  try {
    console.log('[Client] Fetching Supabase configuration from server...');
    const response = await fetch('/api/config/supabase');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Supabase config: ${response.status}`);
    }
    
    const config = await response.json();
    supabaseUrl = config.url;
    supabaseKey = config.key;
    
    console.log(`[Client] Supabase URL available: ${!!supabaseUrl}`);
    console.log(`[Client] Supabase URL: ${supabaseUrl ? `${supabaseUrl.substring(0, 10)}...` : 'missing'}`);
    console.log(`[Client] Supabase Key available: ${!!supabaseKey}`);
    console.log(`[Client] Supabase Key length: ${supabaseKey ? supabaseKey.length : 0}`);
    
    // Re-initialize the Supabase client with the fetched configuration
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        storageKey: 'nil-connect-auth'
      }
    });
    
    return true;
  } catch (error) {
    console.error('[Client] Error initializing Supabase:', error);
    return false;
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