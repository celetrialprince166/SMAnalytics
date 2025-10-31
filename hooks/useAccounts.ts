/**
 * React Query Hooks for Account Management
 * 
 * Provides cached, optimized data fetching with automatic background updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiAccountService } from '@/lib/services/ApiAccountService';
import {
  PrimaryAccount,
  SecondaryAccount,
  HolderAccount,
  CreateHolderAccountRequest,
  UpdateHolderAccountRequest,
} from '@/types';
import { toast } from 'sonner';

// Query Keys
export const accountKeys = {
  all: ['accounts'] as const,
  hierarchyWithPaths: () => [...accountKeys.all, 'hierarchy-with-paths'] as const,
  hierarchy: () => [...accountKeys.all, 'hierarchy'] as const,
  primary: () => [...accountKeys.all, 'primary'] as const,
  secondary: (primaryId?: string) =>
    primaryId
      ? [...accountKeys.all, 'secondary', primaryId] as const
      : [...accountKeys.all, 'secondary'] as const,
  holder: (secondaryId?: string) =>
    secondaryId
      ? [...accountKeys.all, 'holder', secondaryId] as const
      : [...accountKeys.all, 'holder'] as const,
  holderDetail: (id: string) => [...accountKeys.all, 'holder', 'detail', id] as const,
  secondaryDetail: (id: string) => [...accountKeys.all, 'secondary', 'detail', id] as const,
  accountPath: (id: string) => [...accountKeys.all, 'path', id] as const,
};

// Extended HolderAccount with path
export interface HolderAccountWithPath extends HolderAccount {
  path: string;
  primaryAccountId?: string;
  primaryAccountName?: string;
  primaryAccountType?: string;
  secondaryAccountName?: string;
}

export interface AccountHierarchyWithPaths {
  primary: PrimaryAccount[];
  secondary: SecondaryAccount[];
  holder: HolderAccountWithPath[];
}

/**
 * Fetch account hierarchy with all paths pre-computed (OPTIMIZED - Single API call)
 */
export function useAccountHierarchyWithPaths() {
  return useQuery({
    queryKey: accountKeys.hierarchyWithPaths(),
    queryFn: async (): Promise<AccountHierarchyWithPaths> => {
      const response = await fetch('/api/accounts/hierarchy-with-paths');
      if (!response.ok) {
        throw new Error('Failed to fetch account hierarchy');
      }
      const data = await response.json();
      return data.data || data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get primary accounts with caching
 */
export function usePrimaryAccounts() {
  return useQuery({
    queryKey: accountKeys.primary(),
    queryFn: () => apiAccountService.getPrimaryAccounts(),
    staleTime: 10 * 60 * 1000, // 10 minutes - rarely changes
  });
}

/**
 * Get secondary accounts by primary account ID
 */
export function useSecondaryAccounts(primaryAccountId?: string) {
  return useQuery({
    queryKey: accountKeys.secondary(primaryAccountId),
    queryFn: () =>
      primaryAccountId
        ? apiAccountService.getSecondaryAccounts(primaryAccountId)
        : apiAccountService.getAllSecondaryAccounts(),
    enabled: !!primaryAccountId || primaryAccountId === undefined,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get holder accounts by secondary account ID
 */
export function useHolderAccounts(secondaryAccountId?: string) {
  return useQuery({
    queryKey: accountKeys.holder(secondaryAccountId),
    queryFn: () =>
      secondaryAccountId
        ? apiAccountService.getHolderAccounts(secondaryAccountId)
        : apiAccountService.getAllHolderAccounts(),
    enabled: !!secondaryAccountId || secondaryAccountId === undefined,
    staleTime: 3 * 60 * 1000,
  });
}

/**
 * Get single holder account by ID
 */
export function useHolderAccount(accountId?: string) {
  return useQuery({
    queryKey: accountKeys.holderDetail(accountId || ''),
    queryFn: () => apiAccountService.getHolderAccountById(accountId!),
    enabled: !!accountId,
    staleTime: 3 * 60 * 1000,
  });
}

/**
 * Get single secondary account by ID
 */
export function useSecondaryAccount(accountId?: string) {
  return useQuery({
    queryKey: accountKeys.secondaryDetail(accountId || ''),
    queryFn: () => apiAccountService.getSecondaryAccountById(accountId!),
    enabled: !!accountId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Create holder account mutation with optimistic updates
 */
export function useCreateHolderAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateHolderAccountRequest) =>
      apiAccountService.createHolderAccount(data),
    onSuccess: () => {
      // Invalidate all account queries to refetch
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
      toast.success('Account created successfully');
    },
    onError: (error: Error) => {
      // Don't show toast here - let the component handle it
      console.error('Error creating account:', error);
    },
  });
}

/**
 * Update holder account mutation
 */
export function useUpdateHolderAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      accountId,
      data,
    }: {
      accountId: string;
      data: UpdateHolderAccountRequest;
    }) => apiAccountService.updateHolderAccount(accountId, data),
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
      queryClient.invalidateQueries({ queryKey: accountKeys.holderDetail(data.id) });
      toast.success('Account updated successfully');
    },
    onError: (error: Error) => {
      // Don't show toast here - let the component handle it
      console.error('Error updating account:', error);
    },
  });
}

/**
 * Delete holder account mutation
 */
export function useDeleteHolderAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (accountId: string) => apiAccountService.deleteHolderAccount(accountId),
    onSuccess: () => {
      // Invalidate all account queries
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
      toast.success('Account deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete account');
    },
  });
}

/**
 * Prefetch account hierarchy (for preloading)
 */
export function usePrefetchAccountHierarchy() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.prefetchQuery({
      queryKey: accountKeys.hierarchyWithPaths(),
      queryFn: async () => {
        const response = await fetch('/api/accounts/hierarchy-with-paths');
        const data = await response.json();
        return data.data || data;
      },
    });
  };
}

