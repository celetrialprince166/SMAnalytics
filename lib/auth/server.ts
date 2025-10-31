/**
 * Server-side Authentication Helpers
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/lib/config/env';

/**
 * Create Supabase client for server components
 */
export function createServerSupabaseClient() {
  const cookieStore = cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

/**
 * Get current user in server component
 */
export async function getServerUser() {
  const supabase = createServerSupabaseClient();
  
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  // Get user data from our database
  const { data: userData, error: dbError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (dbError) {
    console.warn('Failed to get user data:', dbError.message);
    return null;
  }

  return userData;
}

/**
 * Get organization ID from headers (set by middleware)
 */
export async function getOrganizationId(): Promise<string | null> {
  const { headers } = await import('next/headers');
  const headersList = headers();
  return headersList.get('x-organization-id');
}

/**
 * Require authentication in server component
 */
export async function requireAuth() {
  const user = await getServerUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  return user;
}

/**
 * Require organization context in server component
 */
export async function requireOrganization() {
  const orgId = await getOrganizationId();
  
  if (!orgId) {
    throw new Error('Organization context required');
  }
  
  return orgId;
}















