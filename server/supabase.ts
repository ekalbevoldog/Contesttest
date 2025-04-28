// services/supabase.ts
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Pull from your Replit Secrets or .env:
//   SUPABASE_URL=https://<project-ref>.supabase.co
//   SUPABASE_ANON_KEY=<your-anon-key>
//   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
const SUPABASE_URL          = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY     = process.env.SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_KEY) {
  console.error('⛔ Missing SUPABASE env vars:', {
    URL:    !!SUPABASE_URL,
    ANON:   !!SUPABASE_ANON_KEY,
    SRV:    !!SUPABASE_SERVICE_KEY,
  });
}

// Client for public reads
export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// Client for all server‐side writes & RLS‐bypassing operations
export const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY
);
