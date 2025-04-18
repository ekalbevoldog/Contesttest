import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Using a mock Supabase client with dummy URL and key
// This is a temporary solution until we get the correct Supabase credentials
console.log('Using mock Supabase client (not connected to any Supabase project)');

// Create a mock Supabase client
const mockSupabaseClient = {
  auth: {
    getSession: async () => ({ data: null, error: null }),
    signInWithPassword: async () => ({ data: null, error: null }),
    signUp: async () => ({ data: null, error: null }),
    signOut: async () => ({ error: null })
  },
  from: (table: string) => ({
    select: (columns: string) => ({
      eq: (column: string, value: any) => ({
        single: () => ({ data: null, error: null })
      }),
      limit: (limit: number) => ({ data: null, error: null }),
      order: (column: string, { ascending }: { ascending: boolean }) => ({
        limit: (limit: number) => ({
          offset: (offset: number) => ({ data: null, error: null })
        })
      })
    }),
    insert: (data: any) => ({
      select: () => ({
        single: () => ({ data: null, error: null })
      })
    }),
    update: (data: any) => ({
      eq: (column: string, value: any) => ({
        select: () => ({
          single: () => ({ data: null, error: null })
        })
      })
    }),
    delete: () => ({
      eq: (column: string, value: any) => ({ error: null })
    })
  })
};

// Export the mock client instead of a real one
export const supabase = mockSupabaseClient as any;

console.log('Mock Supabase client initialized.');

// Test connection - always returns true for the mock
export const testSupabaseConnection = async () => {
  console.log('Mock Supabase connection test - always succeeds');
  return true;
};