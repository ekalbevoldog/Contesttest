import { createClient } from '@supabase/supabase-js';

// Supabase credentials provided in the server
// These are the same as in server/supabase.ts
const supabaseUrl = 'https://yfkqvuevaykxizpndhke.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlma3F2dWV2YXlreGl6cG5kaGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NTExNDMsImV4cCI6MjA2MDMyNzE0M30.fWogNLRxTPk8uEYA8bh3SoeiZoyrpPlv5zt0pSVJu4s';

// Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

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