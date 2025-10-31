'use client';

/**
 * Authentication Context
 * 
 * Provides authentication state and methods throughout the application
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { UserSession, UserPermissions, USER_PERMISSIONS } from '@/types';
import { authService } from '../services/AuthService';

interface AuthContextType {
  session: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: UserPermissions | null;
  hasPermission: (permission: keyof UserPermissions) => boolean;
  refreshSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = () => {
    const currentSession = authService.getCurrentSession();
    setSession(currentSession);
  };

  useEffect(() => {
    // Load session on mount
    refreshSession();
    setIsLoading(false);

    // Set up interval to check session validity
    const interval = setInterval(() => {
      refreshSession();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const permissions = session ? USER_PERMISSIONS[session.level] : null;

  const hasPermission = (permission: keyof UserPermissions): boolean => {
    if (!permissions) return false;
    return permissions[permission];
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        isAuthenticated: session !== null,
        isLoading,
        permissions,
        hasPermission,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
