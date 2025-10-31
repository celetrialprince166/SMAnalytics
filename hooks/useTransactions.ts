/**
 * React Query Hooks for Transaction Management
 * 
 * Provides cached, optimized data fetching with automatic background updates
 * Following the pattern from hooks/useAccounts.ts
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiTransactionService } from '@/lib/services/ApiTransactionService';
import {
  Transaction,
  SplitTransaction,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  TransactionFilters,
} from '@/types';
import { toast } from 'sonner';

// Query Keys Factory (following accountKeys pattern)
export const transactionKeys = {
  all: ['transactions'] as const,
  lists: () => [...transactionKeys.all, 'list'] as const,
  list: (filters?: TransactionFilters) => 
    filters ? [...transactionKeys.lists(), filters] as const : [...transactionKeys.lists()] as const,
  byDate: (date?: string) => 
    date ? [...transactionKeys.all, 'by-date', date] as const : [...transactionKeys.all, 'by-date'] as const,
  details: () => [...transactionKeys.all, 'detail'] as const,
  detail: (id: string) => [...transactionKeys.details(), id] as const,
  nextNumber: (date: string, type: string) => [...transactionKeys.all, 'next-number', date, type] as const,
  pettyCashAccount: () => [...transactionKeys.all, 'petty-cash-account'] as const,
  splits: () => [...transactionKeys.all, 'splits'] as const,
  splitsList: () => [...transactionKeys.splits(), 'list'] as const,
  splitDetail: (id: string) => [...transactionKeys.splits(), 'detail', id] as const,
};

/**
 * Get transactions with optional filtering and caching
 */
export function useTransactions(filters?: TransactionFilters) {
  return useQuery({
    queryKey: transactionKeys.list(filters),
    queryFn: () => apiTransactionService.getTransactions(filters),
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}

/**
 * Get single transaction by ID
 */
export function useTransaction(id?: string) {
  return useQuery({
    queryKey: transactionKeys.detail(id || ''),
    queryFn: () => apiTransactionService.getTransactionById(id!),
    enabled: !!id,
    staleTime: 3 * 60 * 1000,
  });
}

/**
 * Get transactions for a specific date (for date-based navigation)
 */
export function useTransactionsByDate(date?: string) {
  return useQuery({
    queryKey: transactionKeys.byDate(date),
    queryFn: async () => {
      if (!date) return [];
      
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      return apiTransactionService.getTransactionsByDateRange(startDate, endDate);
    },
    enabled: !!date,
    staleTime: 2 * 60 * 1000, // 2 minutes - refresh more often for active editing
  });
}

/**
 * Get next transaction number for a given date and type
 */
export function useNextTransactionNumber(date: Date, type: 'single' | 'split' | 'petty', enabled: boolean = true) {
  return useQuery({
    queryKey: transactionKeys.nextNumber(date.toISOString().split('T')[0], type),
    queryFn: async () => {
      const response = await fetch(
        `/api/transactions/next-number?date=${date.toISOString()}&type=${type}`
      );
      if (!response.ok) {
        throw new Error('Failed to get next transaction number');
      }
      const data = await response.json();
      return data.data;
    },
    enabled,
    staleTime: 0, // Always fresh for number generation
    gcTime: 0, // Don't cache transaction numbers
  });
}

/**
 * Find petty cash account (holder account with "petty cash" in name)
 */
export function usePettyCashAccount() {
  return useQuery({
    queryKey: transactionKeys.pettyCashAccount(),
    queryFn: async () => {
      const response = await fetch('/api/accounts/petty-cash');
      if (!response.ok) {
        throw new Error('Failed to find petty cash account');
      }
      const data = await response.json();
      return data.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - rarely changes
  });
}

/**
 * Get split transactions
 */
export function useSplitTransactions() {
  return useQuery({
    queryKey: transactionKeys.splitsList(),
    queryFn: async () => {
      const response = await fetch('/api/transactions/split');
      if (!response.ok) {
        throw new Error('Failed to fetch split transactions');
      }
      const data = await response.json();
      return data.data || [];
    },
    staleTime: 3 * 60 * 1000,
  });
}

/**
 * Get single split transaction by ID
 */
export function useSplitTransaction(id?: string) {
  return useQuery({
    queryKey: transactionKeys.splitDetail(id || ''),
    queryFn: async () => {
      const response = await fetch(`/api/transactions/split/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch split transaction');
      }
      const data = await response.json();
      return data.data;
    },
    enabled: !!id,
    staleTime: 3 * 60 * 1000,
  });
}

/**
 * Create transaction mutation with cache invalidation
 */
export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTransactionRequest) =>
      apiTransactionService.createTransaction(data),
    onSuccess: () => {
      // Invalidate all transaction queries to refetch
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      toast.success('Transaction created successfully');
    },
    onError: (error: Error) => {
      console.error('Error creating transaction:', error);
      // Don't show toast here - let the component handle it
    },
  });
}

/**
 * Update transaction mutation with optimistic updates
 */
export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      transactionId,
      data,
    }: {
      transactionId: string;
      data: UpdateTransactionRequest;
    }) => apiTransactionService.updateTransaction(transactionId, data),
    onMutate: async ({ transactionId, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: transactionKeys.detail(transactionId) });

      // Snapshot previous value
      const previousTransaction = queryClient.getQueryData(transactionKeys.detail(transactionId));

      // Optimistically update cache
      if (previousTransaction) {
        queryClient.setQueryData(
          transactionKeys.detail(transactionId),
          Object.assign({}, previousTransaction as any, data)
        );
      }

      return { previousTransaction };
    },
    onError: (err, { transactionId }, context) => {
      // Rollback on error
      if (context?.previousTransaction) {
        queryClient.setQueryData(transactionKeys.detail(transactionId), context.previousTransaction);
      }
      console.error('Error updating transaction:', err);
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      toast.success('Transaction updated successfully');
    },
  });
}

/**
 * Delete transaction mutation with cache invalidation
 */
export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (transactionId: string) =>
      apiTransactionService.deleteTransaction(transactionId),
    onSuccess: () => {
      // Invalidate all transaction queries
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      toast.success('Transaction deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete transaction');
    },
  });
}

/**
 * Create split transaction mutation
 */
export function useCreateSplitTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/transactions/split', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create split transaction');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: transactionKeys.splits() });
      toast.success('Split transaction created successfully');
    },
    onError: (error: Error) => {
      console.error('Error creating split transaction:', error);
    },
  });
}

/**
 * Update split transaction mutation
 */
export function useUpdateSplitTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/transactions/split/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update split transaction');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: transactionKeys.splits() });
      toast.success('Split transaction updated successfully');
    },
    onError: (error: Error) => {
      console.error('Error updating split transaction:', error);
    },
  });
}

/**
 * Delete split transaction mutation
 */
export function useDeleteSplitTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/transactions/split/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete split transaction');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: transactionKeys.splits() });
      toast.success('Split transaction deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete split transaction');
    },
  });
}

/**
 * Prefetch transactions (for preloading)
 */
export function usePrefetchTransactions() {
  const queryClient = useQueryClient();

  return (filters?: TransactionFilters) => {
    queryClient.prefetchQuery({
      queryKey: transactionKeys.list(filters),
      queryFn: () => apiTransactionService.getTransactions(filters),
    });
  };
}


