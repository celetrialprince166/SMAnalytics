/**
 * Supabase Authentication Configuration
 */

import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

// Client-side Supabase client - MUST use createBrowserClient for proper cookie handling in Next.js
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://frnccxaotutxujqoswwr.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZybmNjeGFvdHV0eHVqcW9zd3dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MDc3NjEsImV4cCI6MjA3NTQ4Mzc2MX0.sQc3pqbI7FWJr2flMEg6WJRxvzgkQKDqzSTLYDiaZKo'
);

// Server-side Supabase client with service role - for admin operations only
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://frnccxaotutxujqoswwr.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZybmNjeGFvdHV0eHVqcW9zd3dyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTkwNzc2MSwiZXhwIjoyMDc1NDgzNzYxfQ.KRnhiYUMMEwa29uGQg2u3WX40eELSZ3841gNnIocnYs',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Auth types
export interface User {
  id: string;
  email: string;
  organizationId?: string;
  role?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_at: number;
}
