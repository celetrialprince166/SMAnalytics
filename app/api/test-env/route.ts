/**
 * Test Environment Variables API
 * GET /api/test-env
 */

import { NextResponse } from 'next/server';

export async function GET() {
  // Only return safe environment variables (no sensitive data)
  return NextResponse.json({
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
}



