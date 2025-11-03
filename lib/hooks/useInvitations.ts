/**
 * TanStack Query hooks for user invitations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createInvitation, getInvitations, revokeInvitation } from '@/app/admin/users/actions';
import { toast } from 'sonner';

export function useInvitations(orgId: string) {
  return useQuery({
    queryKey: ['invitations', orgId],
    queryFn: () => getInvitations(orgId),
    staleTime: 30000, // Cache for 30 seconds
    enabled: !!orgId,
  });
}

export function useCreateInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      email: string;
      name: string;
      role: 'ADMIN' | 'MANAGER' | 'ACCOUNTANT' | 'USER';
      orgId: string;
    }) => {
      return createInvitation(data.email, data.name, data.role, data.orgId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      toast.success('Invitation created successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create invitation');
    },
  });
}

export function useRevokeInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: revokeInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      toast.success('Invitation revoked');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to revoke invitation');
    },
  });
}
