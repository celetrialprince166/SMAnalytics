'use client';

/**
 * Supabase Authentication Context
 * 
 * Provides authentication state and methods using Supabase throughout the application
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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

export interface UserPermissions {
  canViewDashboard: boolean;
  canManageAccounts: boolean;
  canManageTransactions: boolean;
  canManageReports: boolean;
  canManageUsers: boolean;
  canManageSettings: boolean;
  canViewFinancials: boolean;
  canManageClients: boolean;
  canManageProducts: boolean;
  canManageEmployees: boolean;
  canManagePayroll: boolean;
  canManageFixedAssets: boolean;
}

export interface AuthState {
  user: AppUser | null;
  supabaseUser: SupabaseUser | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  signIn: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (data: {
    email: string;
    username: string;
    password: string;
    firstName?: string;
    lastName?: string;
    accessCode: string;
    userId: string;
  }) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
  permissions: UserPermissions | null;
  hasPermission: (permission: keyof UserPermissions) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default permissions based on role
const getDefaultPermissions = (role: string): UserPermissions => {
  const basePermissions: UserPermissions = {
    canViewDashboard: true,
    canManageAccounts: false,
    canManageTransactions: false,
    canManageReports: true,
    canManageUsers: false,
    canManageSettings: false,
    canViewFinancials: true,
    canManageClients: false,
    canManageProducts: false,
    canManageEmployees: false,
    canManagePayroll: false,
    canManageFixedAssets: false,
  };

  switch (role.toUpperCase()) {
    case 'SUPER_USER':
      return {
        ...basePermissions,
        canManageAccounts: true,
        canManageTransactions: true,
        canManageUsers: true,
        canManageSettings: true,
        canManageClients: true,
        canManageProducts: true,
        canManageEmployees: true,
        canManagePayroll: true,
        canManageFixedAssets: true,
      };
    case 'ADMIN':
      return {
        ...basePermissions,
        canManageAccounts: true,
        canManageTransactions: true,
        canManageUsers: false,
        canManageSettings: false,
        canManageClients: true,
        canManageProducts: true,
        canManageEmployees: true,
        canManagePayroll: true,
        canManageFixedAssets: true,
      };
    case 'USER_2': // Manager
      return {
        ...basePermissions,
        canManageAccounts: false,
        canManageTransactions: true,
        canManageClients: true,
        canManageProducts: true,
        canManageEmployees: true,
        canManagePayroll: false,
        canManageFixedAssets: true,
      };
    case 'USER_1': // Staff
      return {
        ...basePermissions,
        canManageAccounts: false,
        canManageTransactions: true,
        canManageClients: true,
        canManageProducts: true,
        canManageEmployees: false,
        canManagePayroll: false,
        canManageFixedAssets: false,
      };
    default:
      return basePermissions;
  }
};

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    supabaseUser: null,
    loading: true,
    error: null,
  });

  const loadUser = async () => {
    try {
      const { data: { user: supabaseUser }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Error loading user:', error);
        setState(prev => ({ ...prev, user: null, supabaseUser: null, loading: false }));
        return;
      }

      if (!supabaseUser) {
        setState(prev => ({ ...prev, user: null, supabaseUser: null, loading: false }));
        return;
      }

      // Fetch user data from our Prisma database via API
      try {
        const response = await fetch('/api/auth/user');
        if (response.ok) {
          const userData = await response.json();
          setState(prev => ({ 
            ...prev, 
            user: userData, 
            supabaseUser, 
            loading: false,
            error: null 
          }));
        } else {
          console.error('Failed to load user data - API returned:', response.status);
          setState(prev => ({ 
            ...prev, 
            user: null, 
            supabaseUser, 
            loading: false,
            error: 'Failed to load user data'
          }));
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
        setState(prev => ({ 
          ...prev, 
          user: null, 
          supabaseUser, 
          loading: false,
          error: 'Failed to load user data'
        }));
      }
    } catch (error) {
      console.error('Error loading user:', error);
      setState(prev => ({ 
        ...prev, 
        user: null, 
        supabaseUser: null, 
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  };

  const signIn = async (username: string, password: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Look up email by username
      const emailResponse = await fetch('/api/auth/lookup-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      if (!emailResponse.ok) {
        const errorData = await emailResponse.json();
        setState(prev => ({ ...prev, loading: false }));
        return { success: false, error: errorData.error || 'Invalid credentials' };
      }

      const { email } = await emailResponse.json();

      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setState(prev => ({ ...prev, loading: false }));
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Wait a brief moment for cookies to propagate
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Fetch user data from our Prisma database via API
        try {
          const response = await fetch('/api/auth/user');
          if (response.ok) {
            const userData = await response.json();
            setState(prev => ({ 
              ...prev, 
              user: userData, 
              supabaseUser: data.user, 
              loading: false,
              error: null 
            }));
            router.push('/dashboard');
            return { success: true };
          } else {
            console.error('Failed to load user data - API returned:', response.status);
            setState(prev => ({ ...prev, loading: false }));
            return { success: false, error: 'Failed to load user data' };
          }
        } catch (error) {
          console.error('Failed to load user data:', error);
          setState(prev => ({ ...prev, loading: false }));
          return { success: false, error: 'Failed to load user data' };
        }
      }

      setState(prev => ({ ...prev, loading: false }));
      return { success: false, error: 'Login failed' };
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  };

  const signUp = async (data: {
    email: string;
    username: string;
    password: string;
    firstName?: string;
    lastName?: string;
    accessCode: string;
    userId: string;
  }) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setState(prev => ({ ...prev, loading: false }));
        return { success: false, error: result.error || 'Signup failed' };
      }

      setState(prev => ({ ...prev, loading: false }));
      return { success: true };
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setState({
        user: null,
        supabaseUser: null,
        loading: false,
        error: null,
      });
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  };

  const refreshUser = async () => {
    await loadUser();
  };

  const permissions = state.user ? getDefaultPermissions(state.user.role) : null;

  const hasPermission = (permission: keyof UserPermissions): boolean => {
    if (!permissions) return false;
    return permissions[permission];
  };

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
            supabaseUser: null,
            loading: false,
            error: null,
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signIn,
        signUp,
        signOut,
        changePassword,
        refreshUser,
        permissions,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useSupabaseAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
}
