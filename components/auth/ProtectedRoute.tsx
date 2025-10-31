'use client';

/**
 * Protected Route Component
 * 
 * Wrapper component that requires authentication
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth, UserPermissions } from '@/lib/contexts/SupabaseAuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: keyof UserPermissions;
  fallbackPath?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredPermission,
  fallbackPath = '/login' 
}: ProtectedRouteProps) {
  const { user, loading, hasPermission } = useSupabaseAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push(fallbackPath);
      } else if (requiredPermission && !hasPermission(requiredPermission)) {
        router.push('/dashboard'); // Redirect to dashboard if no permission
      }
    }
  }, [user, loading, requiredPermission, hasPermission, router, fallbackPath]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return null;
  }

  return <>{children}</>;
}
