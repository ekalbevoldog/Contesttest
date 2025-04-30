import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl        = process.env.SUPABASE_URL!;
const supabaseAnonKey    = process.env.SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create Supabase clients with realtime disabled to prevent WebSocket connections
const options = {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  },
  // Explicitly disable realtime to prevent WebSocket connection attempts
  realtime: {
    params: {
      eventsPerSecond: 0
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'server-supabase-client'
    }
  }
};

// Public client with anon key
export const supabase = createClient(supabaseUrl, supabaseAnonKey, options);

// Admin client with service role key
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, options);

console.log('[Server] Supabase clients initialized with realtime DISABLED');
