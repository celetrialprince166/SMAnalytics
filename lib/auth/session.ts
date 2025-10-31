/**
 * Session Management
 */

import { supabase } from './supabase';
import { User } from './supabase';

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

/**
 * Get current session
 */
export async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    throw new Error(`Failed to get session: ${error.message}`);
  }
  
  return session;
}

/**
 * Get current user with organization info
 */
export async function getCurrentUser(): Promise<User | null> {
  const session = await getCurrentSession();
  
  if (!session?.user) {
    return null;
  }
  
  // Get user data from our database
  const { data: userData, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single();
  
  if (error) {
    console.warn('Failed to get user data:', error.message);
    return null;
  }
  
  return userData;
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    throw new Error(`Sign in failed: ${error.message}`);
  }
  
  return data;
}

/**
 * Sign up with email and password
 */
export async function signUp(email: string, password: string, organizationId?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        organizationId,
      },
    },
  });
  
  if (error) {
    throw new Error(`Sign up failed: ${error.message}`);
  }
  
  return data;
}

/**
 * Sign out
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    throw new Error(`Sign out failed: ${error.message}`);
  }
}

/**
 * Reset password
 */
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  
  if (error) {
    throw new Error(`Password reset failed: ${error.message}`);
  }
}















