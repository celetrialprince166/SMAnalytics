'use client';

/**
 * Admin Users Management Page
 * Allows admins to create and manage user invitations
 */

import { UserInvitationForm } from '@/components/admin/UserInvitationForm';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useSupabaseAuth } from '@/lib/contexts/SupabaseAuthContext';
import { Loader2 } from 'lucide-react';

export default function AdminUsersPage() {
  const { user, loading } = useSupabaseAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container max-w-4xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Create invitations for new users to join your organization
          </p>
        </div>

        {user?.organizationId && <UserInvitationForm orgId={user.organizationId} />}
      </div>
    </ProtectedRoute>
  );
}
