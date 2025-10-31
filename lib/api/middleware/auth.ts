/**
 * Authentication Middleware
 * 
 * Handles authentication for API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/lib/config/env';
import { unauthorizedResponse } from '../utils/response';

export type AuthenticatedHandler = (
  req: NextRequest,
  context: { params?: any; user: any; organizationId: string }
) => Promise<NextResponse>;

/**
 * Create Supabase client for API routes
 */
function createSupabaseClient() {
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
            // Ignore - called from Server Component
          }
        },
      },
    }
  );
}

/**
 * Middleware to require authentication
 */
export function withAuth(handler: AuthenticatedHandler) {
  return async (req: NextRequest, context: { params?: any }) => {
    try {
      const supabase = createSupabaseClient();
      
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !authUser) {
        return unauthorizedResponse('Authentication required');
      }

      // Get user details from database
      const { data: user, error } = await supabase
        .from('users')
        .select('id, email, username, organizationId, role, firstName, lastName, isActive')
        .eq('id', authUser.id)
        .single();

      if (error || !user) {
        return unauthorizedResponse('User not found');
      }

      if (!user.isActive) {
        return unauthorizedResponse('User account is inactive');
      }

      // Call the handler with authenticated context
      return handler(req, {
        ...context,
        user,
        organizationId: user.organizationId,
      });
    } catch (error: any) {
      console.error('Authentication error:', error);
      return unauthorizedResponse('Authentication failed');
    }
  };
}

/**
 * Optional auth - doesn't fail if no user is authenticated
 */
export function withOptionalAuth(handler: AuthenticatedHandler) {
  return async (req: NextRequest, context: { params?: any }) => {
    try {
      const supabase = createSupabaseClient();
      
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      let user = null;
      let organizationId = '';

      if (authUser) {
        const { data: userData } = await supabase
          .from('users')
          .select('id, email, username, organizationId, role, firstName, lastName, isActive')
          .eq('id', authUser.id)
          .single();

        if (userData && userData.isActive) {
          user = userData;
          organizationId = userData.organizationId;
        }
      }

      return handler(req, {
        ...context,
        user,
        organizationId,
      });
    } catch (error: any) {
      console.error('Optional auth error:', error);
      return handler(req, {
        ...context,
        user: null,
        organizationId: '',
      });
    }
  };
}

