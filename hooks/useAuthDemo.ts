/**
 * Demo useAuth hook for testing without Supabase
 * This is a simplified version for UI testing
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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
}

export function useAuthDemo() {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: false,
    error: null,
  });

  const signIn = async (username: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Demo authentication logic
      if (username === 'demo' && password === 'password123') {
        const mockUser: AppUser = {
          id: 'demo-user-1',
          email: 'demo@example.com',
          username: 'demo',
          organizationId: 'demo-org-1',
          role: 'ADMIN',
          firstName: 'Demo',
          lastName: 'User',
          isActive: true,
        };

        setState({
          user: mockUser,
          loading: false,
          error: null,
        });

        return { success: true, message: 'Login successful' };
      } else {
        setState(prev => ({ ...prev, loading: false, error: 'Invalid credentials' }));
        return { success: false, message: 'Invalid username or password' };
      }
    } catch (error) {
      setState(prev => ({ ...prev, loading: false, error: 'Login failed' }));
      return { success: false, message: 'Login failed' };
    }
  };

  const signUp = async (data: {
    userId: string;
    accessCode: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Demo signup logic
      if (data.password === data.confirmPassword && data.password.length >= 6) {
        setState(prev => ({ ...prev, loading: false, error: null }));
        return { success: true, message: 'Registration successful' };
      } else {
        setState(prev => ({ ...prev, loading: false, error: 'Passwords do not match' }));
        return { success: false, message: 'Passwords do not match' };
      }
    } catch (error) {
      setState(prev => ({ ...prev, loading: false, error: 'Registration failed' }));
      return { success: false, message: 'Registration failed' };
    }
  };

  const signOut = async () => {
    setState({
      user: null,
      loading: false,
      error: null,
    });
    router.push('/login');
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Demo password change logic
      if (newPassword.length >= 6) {
        setState(prev => ({ ...prev, loading: false, error: null }));
        return { success: true, message: 'Password changed successfully' };
      } else {
        setState(prev => ({ ...prev, loading: false, error: 'Password too short' }));
        return { success: false, message: 'Password must be at least 6 characters' };
      }
    } catch (error) {
      setState(prev => ({ ...prev, loading: false, error: 'Password change failed' }));
      return { success: false, message: 'Password change failed' };
    }
  };

  const resetPassword = async (email: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Demo password reset logic
      setState(prev => ({ ...prev, loading: false, error: null }));
      return { success: true, message: 'Password reset email sent' };
    } catch (error) {
      setState(prev => ({ ...prev, loading: false, error: 'Password reset failed' }));
      return { success: false, message: 'Password reset failed' };
    }
  };

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



