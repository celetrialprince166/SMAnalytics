/**
 * API Transaction Service
 * 
 * Service for managing transactions using API backend instead of local storage
 */

import { 
  Transaction, 
  CreateTransactionRequest, 
  UpdateTransactionRequest,
  TransactionFilters,
  TransactionSummary
} from '@/types';

export class ApiTransactionService {
  private static instance: ApiTransactionService;
  private baseUrl = '/api/transactions';

  private constructor() {}

  public static getInstance(): ApiTransactionService {
    if (!ApiTransactionService.instance) {
      ApiTransactionService.instance = new ApiTransactionService();
    }
    return ApiTransactionService.instance;
  }

  /**
   * Get all transactions with optional filtering
   */
  async getTransactions(filters?: TransactionFilters): Promise<Transaction[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.startDate) {
        params.append('dateFrom', filters.startDate.toISOString());
      }
      if (filters?.endDate) {
        params.append('dateTo', filters.endDate.toISOString());
      }
      if (filters?.accountId) {
        params.append('accountId', filters.accountId);
      }
      if (filters?.reconciled !== undefined) {
        params.append('reconciled', filters.reconciled.toString());
      }
      if (filters?.searchTerm) {
        params.append('search', filters.searchTerm);
      }

      const response = await fetch(`${this.baseUrl}?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch transactions: ${response.statusText}`);
      }

      const data = await response.json();
      const transactions = data.data || [];
      
      // Parse amounts as numbers - Prisma Decimal returns strings
      return transactions.map((t: any) => ({
        ...t,
        amount: typeof t.amount === 'string' ? parseFloat(t.amount) || 0 : t.amount || 0,
      }));
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(id: string): Promise<Transaction | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch transaction: ${response.statusText}`);
      }

      const data = await response.json();
      const t = data.data;
      if (!t) return null;
      
      // Parse amount as number - Prisma Decimal returns strings
      return {
        ...t,
        amount: typeof t.amount === 'string' ? parseFloat(t.amount) || 0 : t.amount || 0,
      };
    } catch (error) {
      console.error('Error fetching transaction:', error);
      throw error;
    }
  }

  /**
   * Create a new transaction
   */
  async createTransaction(request: CreateTransactionRequest): Promise<Transaction> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...request,
          date: request.date.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to create transaction: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  /**
   * Update an existing transaction
   */
  async updateTransaction(id: string, updates: UpdateTransactionRequest): Promise<Transaction> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...updates,
          ...(updates.date && { date: updates.date.toISOString() }),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update transaction: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  }

  /**
   * Delete a transaction
   */
  async deleteTransaction(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to delete transaction: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  }

  /**
   * Reconcile a transaction
   */
  async reconcileTransaction(id: string, reconciled: boolean): Promise<Transaction> {
    try {
      const response = await fetch(`${this.baseUrl}/reconcile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId: id,
          reconciled,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to reconcile transaction: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error reconciling transaction:', error);
      throw error;
    }
  }

  /**
   * Get transactions by date range
   */
  async getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]> {
    return this.getTransactions({
      startDate,
      endDate,
    });
  }

  /**
   * Get transactions by account
   */
  async getTransactionsByAccount(accountId: string): Promise<Transaction[]> {
    return this.getTransactions({
      accountId,
    });
  }

  /**
   * Get next transaction number for a given date
   */
  async getNextTransactionNumber(date: Date): Promise<string> {
    try {
      // For now, generate a simple sequential number
      // In a real implementation, this would query the API for the next number
      const transactions = await this.getTransactionsByDateRange(date, date);
      const todayTransactions = transactions.filter(t => {
        const txDate = new Date(t.date);
        return txDate.toDateString() === date.toDateString();
      });
      
      const nextNumber = todayTransactions.length + 1;
      const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
      return `TXN-${dateStr}-${String(nextNumber).padStart(4, '0')}`;
    } catch (error) {
      console.error('Error getting next transaction number:', error);
      // Fallback to timestamp-based number
      const timestamp = Date.now();
      return `TXN-${timestamp}`;
    }
  }

  /**
   * Get transaction summary for display
   */
  async getTransactionSummary(id: string): Promise<TransactionSummary | null> {
    try {
      const transaction = await this.getTransactionById(id);
      if (!transaction) {
        return null;
      }

      // Note: In a real implementation, this would fetch account details from the API
      // For now, we'll return basic summary information
      return {
        id: transaction.id,
        date: transaction.date,
        number: transaction.number,
        description: transaction.description,
        amount: transaction.amount,
        debitAccount: `Account ${transaction.debitAccountId}`, // Placeholder
        creditAccount: `Account ${transaction.creditAccountId}`, // Placeholder
        reconciled: transaction.reconciled,
      };
    } catch (error) {
      console.error('Error getting transaction summary:', error);
      throw error;
    }
  }

  /**
   * Search transactions
   */
  async searchTransactions(searchTerm: string): Promise<Transaction[]> {
    return this.getTransactions({
      searchTerm,
    });
  }

  /**
   * Get audit entries for a transaction
   */
  async getTransactionAuditEntries(transactionId: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/${transactionId}/audit`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch audit entries: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching audit entries:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const apiTransactionService = ApiTransactionService.getInstance();
