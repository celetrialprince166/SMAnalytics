/**
 * API Split Transaction Service
 * 
 * Service for managing split transactions using API backend instead of local storage
 */

import { 
  SplitTransaction, 
  CreateSplitTransactionRequest, 
  TransactionSplit,
  Transaction
} from '@/types';

export class ApiSplitTransactionService {
  private static instance: ApiSplitTransactionService;
  private baseUrl = '/api/transactions/split';

  private constructor() {}

  public static getInstance(): ApiSplitTransactionService {
    if (!ApiSplitTransactionService.instance) {
      ApiSplitTransactionService.instance = new ApiSplitTransactionService();
    }
    return ApiSplitTransactionService.instance;
  }

  /**
   * Get all split transactions
   */
  async getSplitTransactions(filters?: {
    dateFrom?: Date;
    dateTo?: Date;
    baseAccountId?: string;
    reconciled?: boolean;
    search?: string;
  }): Promise<SplitTransaction[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.dateFrom) {
        params.append('dateFrom', filters.dateFrom.toISOString());
      }
      if (filters?.dateTo) {
        params.append('dateTo', filters.dateTo.toISOString());
      }
      if (filters?.baseAccountId) {
        params.append('baseAccountId', filters.baseAccountId);
      }
      if (filters?.reconciled !== undefined) {
        params.append('reconciled', filters.reconciled.toString());
      }
      if (filters?.search) {
        params.append('search', filters.search);
      }

      const response = await fetch(`${this.baseUrl}?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch split transactions: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching split transactions:', error);
      throw error;
    }
  }

  /**
   * Get split transaction by ID
   */
  async getSplitTransactionById(id: string): Promise<SplitTransaction | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch split transaction: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching split transaction:', error);
      throw error;
    }
  }

  /**
   * Create a new split transaction
   */
  async createSplitTransaction(request: CreateSplitTransactionRequest): Promise<SplitTransaction> {
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
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        
        console.error('Split Transaction API Error:', {
          status: response.status,
          statusText: response.statusText,
          errorData: errorData
        });
        
        // Extract detailed error message
        let errorMessage = `Failed to create split transaction: ${response.statusText}`;
        
        if (errorData.error) {
          if (errorData.error.details && Array.isArray(errorData.error.details)) {
            const details = errorData.error.details
              .map((detail: any) => {
                if (typeof detail === 'string') return detail;
                if (detail.message) return `${detail.path ? detail.path.join('.') + ': ' : ''}${detail.message}`;
                return JSON.stringify(detail);
              })
              .join('; ');
            errorMessage = `Validation failed: ${details}`;
          } else if (errorData.error.message) {
            errorMessage = errorData.error.message;
          }
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.errors && Array.isArray(errorData.errors)) {
          errorMessage = errorData.errors.map((e: any) => e.message || e).join(', ');
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return result.data.splitTransaction;
    } catch (error) {
      console.error('Error creating split transaction:', error);
      throw error;
    }
  }

  /**
   * Update an existing split transaction
   */
  async updateSplitTransaction(id: string, updates: Partial<CreateSplitTransactionRequest> & {
    reconciled?: boolean;
  }): Promise<SplitTransaction> {
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
        throw new Error(errorData.message || `Failed to update split transaction: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data.splitTransaction;
    } catch (error) {
      console.error('Error updating split transaction:', error);
      throw error;
    }
  }

  /**
   * Delete a split transaction
   */
  async deleteSplitTransaction(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to delete split transaction: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting split transaction:', error);
      throw error;
    }
  }

  /**
   * Reconcile a split transaction
   */
  async reconcileSplitTransaction(id: string, reconciled: boolean): Promise<SplitTransaction> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reconciled,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to reconcile split transaction: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data.splitTransaction;
    } catch (error) {
      console.error('Error reconciling split transaction:', error);
      throw error;
    }
  }

  /**
   * Get split transactions by date range
   */
  async getSplitTransactionsByDateRange(startDate: Date, endDate: Date): Promise<SplitTransaction[]> {
    return this.getSplitTransactions({
      dateFrom: startDate,
      dateTo: endDate,
    });
  }

  /**
   * Get split transactions by base account
   */
  async getSplitTransactionsByBaseAccount(baseAccountId: string): Promise<SplitTransaction[]> {
    return this.getSplitTransactions({
      baseAccountId,
    });
  }

  /**
   * Search split transactions
   */
  async searchSplitTransactions(searchTerm: string): Promise<SplitTransaction[]> {
    return this.getSplitTransactions({
      search: searchTerm,
    });
  }

  /**
   * Validate split transaction data
   */
  validateSplitTransactionData(request: CreateSplitTransactionRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.date) {
      errors.push('Date is required');
    }

    if (!request.baseAccountId) {
      errors.push('Base account is required');
    }

    if (!request.baseAccountSide || !['DEBIT', 'CREDIT'].includes(request.baseAccountSide)) {
      errors.push('Base account side must be DEBIT or CREDIT');
    }

    if (!request.splits || request.splits.length === 0) {
      errors.push('At least one split is required');
    } else {
      const totalAmount = request.splits.reduce((sum, split) => sum + split.amount, 0);
      if (totalAmount <= 0) {
        errors.push('Total split amount must be greater than zero');
      }

      // Check for duplicate accounts in splits
      const accountIds = request.splits.map(s => s.accountId);
      const uniqueAccountIds = new Set(accountIds);
      if (accountIds.length !== uniqueAccountIds.size) {
        errors.push('Duplicate accounts in splits are not allowed');
      }

      // Check if base account is used in splits
      if (request.splits.some(s => s.accountId === request.baseAccountId)) {
        errors.push('Base account cannot be used in splits');
      }

      // Validate individual splits
      request.splits.forEach((split, index) => {
        if (!split.accountId) {
          errors.push(`Split ${index + 1}: Account is required`);
        }
        if (!split.amount || split.amount <= 0) {
          errors.push(`Split ${index + 1}: Amount must be greater than zero`);
        }
        if (!split.description || split.description.trim() === '') {
          errors.push(`Split ${index + 1}: Description is required`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
export const apiSplitTransactionService = ApiSplitTransactionService.getInstance();
