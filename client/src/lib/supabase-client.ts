import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and key from environment variables
// For client-side, these need to be passed through Vite
// The server can't directly share environment variables with the client 
// so we need to set these in the build process
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

// Log for debugging - we should see the environment variables being loaded
console.log(`[Client] Supabase URL available: ${!!supabaseUrl}`);
console.log(`[Client] Supabase Key available: ${!!supabaseKey}`);

// If Vite environment variables aren't available yet, we'll use server-provided values
// Our API will communicate with Supabase regardless, so the client just needs
// to be able to make API calls to our own server endpoints
let url = supabaseUrl;
let key = supabaseKey;

// Create the Supabase client
export const supabase = createClient(
  url || '',
  key || '', 
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true
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