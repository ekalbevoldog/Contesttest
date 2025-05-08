import { createClient } from '@supabase/supabase-js';
import { getSupabase } from './supabase-client'; // Import from the centralized client

// This file is maintained for backward compatibility with existing code
// All new code should use the getSupabase() function from supabase-client.ts

// Create a proxy that delegates all operations to the singleton instance
// from supabase-client.ts to avoid multiple instances problem
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get: (target, prop) => {
    try {
      const supabaseInstance = getSupabase();
      // @ts-ignore
      return supabaseInstance[prop];
    } catch (error) {
      console.error('[Supabase Proxy] Error accessing Supabase client:', error);
      // Fallback to a dummy method that returns a proper error in a Supabase-like format
      if (typeof prop === 'string' && ['auth', 'from', 'storage', 'functions'].includes(prop)) {
        return new Proxy({}, {
          get: () => (...args: any[]) => {
            console.warn(`[Supabase] Method ${String(prop)} called before initialization`);
            return { data: null, error: { message: 'Supabase client not initialized' } };
          }
        });
      }
      return undefined;
    }
  }
});


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