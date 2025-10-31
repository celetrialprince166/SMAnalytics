/**
 * React Query Hooks for Petty Cash Management
 * 
 * Specialized hooks for petty cash transactions with validation
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { transactionKeys } from './useTransactions';
import { TransactionFilters, CreateTransactionRequest } from '@/types';

/**
 * Get petty cash account
 */
export function usePettyCashAccount() {
  return useQuery({
    queryKey: transactionKeys.pettyCashAccount(),
    queryFn: async () => {
      const response = await fetch('/api/accounts/petty-cash');
      if (!response.ok) {
        throw new Error('Petty cash account not found');
      }
      const data = await response.json();
      return data.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Get petty cash transactions (transactions where isPettyCash = true)
 */
export function usePettyCashTransactions(filters?: TransactionFilters) {
  return useQuery({
    queryKey: [...transactionKeys.lists(), 'petty-cash', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters?.startDate) {
        params.append('dateFrom', filters.startDate.toISOString());
      }
      if (filters?.endDate) {
        params.append('dateTo', filters.endDate.toISOString());
      }
      params.append('isPettyCash', 'true');

      const response = await fetch(`/api/transactions?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch petty cash transactions');
      }
      const data = await response.json();
      return data.data || [];
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}

/**
 * Create petty cash transaction with validation
 */
export function useCreatePettyCashTransaction() {
  const queryClient = useQueryClient();
  const { data: pettyCashAccount } = usePettyCashAccount();

  return useMutation({
    mutationFn: async (data: CreateTransactionRequest & { pettyCashSide: 'debit' | 'credit' }) => {
      // Validate petty cash account involvement
      if (!pettyCashAccount) {
        throw new Error('Petty cash account not found');
      }

      const isDebitPettyCash = data.pettyCashSide === 'debit';
      
      if (isDebitPettyCash && data.debitAccountId !== pettyCashAccount.id) {
        throw new Error('Debit account must be petty cash account');
      }
      
      if (!isDebitPettyCash && data.creditAccountId !== pettyCashAccount.id) {
        throw new Error('Credit account must be petty cash account');
      }

      // Create transaction with isPettyCash flag
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          isPettyCash: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create petty cash transaction');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate all transaction queries
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      toast.success('Petty cash transaction created successfully');
    },
    onError: (error: Error) => {
      console.error('Error creating petty cash transaction:', error);
    },
  });
}

/**
 * Update petty cash transaction with validation
 */
export function useUpdatePettyCashTransaction() {
  const queryClient = useQueryClient();
  const { data: pettyCashAccount } = usePettyCashAccount();

  return useMutation({
    mutationFn: async ({ 
      transactionId, 
      data 
    }: { 
      transactionId: string; 
      data: Partial<CreateTransactionRequest> & { pettyCashSide?: 'debit' | 'credit' }
    }) => {
      // If accounts are being updated, validate petty cash involvement
      if (pettyCashAccount && data.pettyCashSide) {
        const isDebitPettyCash = data.pettyCashSide === 'debit';
        
        if (isDebitPettyCash && data.debitAccountId && data.debitAccountId !== pettyCashAccount.id) {
          throw new Error('Debit account must be petty cash account');
        }
        
        if (!isDebitPettyCash && data.creditAccountId && data.creditAccountId !== pettyCashAccount.id) {
          throw new Error('Credit account must be petty cash account');
        }
      }

      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          isPettyCash: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update petty cash transaction');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      toast.success('Petty cash transaction updated successfully');
    },
    onError: (error: Error) => {
      console.error('Error updating petty cash transaction:', error);
    },
  });
}

/**
 * Get petty cash balance
 */
export function usePettyCashBalance() {
  const { data: pettyCashAccount } = usePettyCashAccount();

  return useQuery({
    queryKey: [...transactionKeys.pettyCashAccount(), 'balance'],
    queryFn: async () => {
      if (!pettyCashAccount) {
        return 0;
      }
      return pettyCashAccount.balance || 0;
    },
    enabled: !!pettyCashAccount,
    staleTime: 1 * 60 * 1000, // 1 minute - refresh more often for active use
  });
}


