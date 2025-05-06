import { createClient } from '@supabase/supabase-js';

// Hard-coded Supabase credentials from the user-provided details
const supabaseUrl = 'https://yfkqvuevaykxizpndhke.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlma3F2dWV2YXlreGl6cG5kaGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NTExNDMsImV4cCI6MjA2MDMyNzE0M30.fWogNLRxTPk8uEYA8bh3SoeiZoyrpPlv5zt0pSVJu4s';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);


// Create a hook for user authentication
export async function signInWithEmail(email: string, password: string) {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
}

export async function signUpWithEmail(email: string, password: string) {
  return await supabase.auth.signUp({
    email,
    password,
  });
}

export async function signOut() {
  return await supabase.auth.signOut();
}

export async function getCurrentUser() {
  return await supabase.auth.getUser();
}

export async function getSession() {
  return await supabase.auth.getSession();
}