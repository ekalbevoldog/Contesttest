import { createClient } from '@supabase/supabase-js';

// For client-side, we need the credentials passed through Vite environment variables
// The server can't directly share environment variables with the client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

// Log for debugging - should see the environment variables being loaded
console.log(`[Client] Supabase URL available: ${!!supabaseUrl}`);
console.log(`[Client] Supabase URL: ${supabaseUrl ? `${supabaseUrl.substring(0, 10)}...` : 'missing'}`);
console.log(`[Client] Supabase Key available: ${!!supabaseKey}`);
console.log(`[Client] Supabase Key length: ${supabaseKey ? supabaseKey.length : 0}`);

// Create the Supabase client with enhanced options for browser environment
export const supabase = createClient(
  supabaseUrl || '',
  supabaseKey || '', 
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      storageKey: 'nil-connect-auth'
    }
  }
);

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
    .from('athletes')
    .insert(profileData)
    .select()
    .single();

  if (error) {
    console.error('Error creating athlete profile:', error);
    throw new Error(error.message);
  }

  return data;
};