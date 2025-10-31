/**
 * Authentication Hook
 * 
 * Wraps Supabase authentication with app-specific logic
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/auth/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

export interface AppUser {
  id: string;
  email: string;
  username: string;
  organizationId: string;
  role: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
}

export interface AuthState {
  user: AppUser | null;
  loading: boolean;
  error: string | null;
  supabaseUser: SupabaseUser | null;
}

export function useAuth() {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    supabaseUser: null,
  });

  // Load user on mount
  useEffect(() => {
    loadUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          await loadUser();
        } else if (event === 'SIGNED_OUT') {
          setState({
            user: null,
            loading: false,
            error: null,
            supabaseUser: null,
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Load user data from Supabase and database
   */
  async function loadUser() {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Get Supabase session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      if (!session) {
        setState({
          user: null,
          loading: false,
          error: null,
          supabaseUser: null,
        });
        return;
      }

      // Get user data from our database
      const response = await fetch('/api/auth/user', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load user data');
      }

      const userData: AppUser = await response.json();

      setState({
        user: userData,
        loading: false,
        error: null,
        supabaseUser: session.user,
      });
    } catch (error: any) {
      console.error('Error loading user:', error);
      setState({
        user: null,
        loading: false,
        error: error.message,
        supabaseUser: null,
      });
    }
  }

  /**
   * Sign in with username and password
   */
  async function signIn(username: string, password: string) {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Look up user email from username
      const response = await fetch('/api/auth/lookup-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      if (!response.ok) {
        throw new Error('Invalid username or password');
      }

      const { email } = await response.json();

      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Load user data
      await loadUser();

      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return { success: false, message: errorMessage };
    }
  }

  /**
   * Sign up with username, email, and password
   */
  async function signUp(data: {
    userId: string;
    accessCode: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Validate passwords match
      if (data.password !== data.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Call signup API endpoint
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Signup failed');
      }

      const result = await response.json();

      setState(prev => ({ ...prev, loading: false }));

      return { success: true, data: result };
    } catch (error: any) {
      const errorMessage = error.message || 'Signup failed';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return { success: false, message: errorMessage };
    }
  }

  /**
   * Sign out
   */
  async function signOut() {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      setState({
        user: null,
        loading: false,
        error: null,
        supabaseUser: null,
      });

      router.push('/login');

      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Logout failed';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return { success: false, message: errorMessage };
    }
  }

  /**
   * Change password
   */
  async function changePassword(currentPassword: string, newPassword: string) {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Verify current password by trying to sign in
      if (!state.user?.email) {
        throw new Error('User not authenticated');
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: state.user.email,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error('Current password is incorrect');
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setState(prev => ({ ...prev, loading: false }));

      return { success: true, message: 'Password changed successfully' };
    } catch (error: any) {
      const errorMessage = error.message || 'Password change failed';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return { success: false, message: errorMessage };
    }
  }

  /**
   * Reset password
   */
  async function resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      return { success: true, message: 'Password reset email sent' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Password reset failed' };
    }
  }

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    changePassword,
    resetPassword,
    isAuthenticated: !!state.user,
  };
}



