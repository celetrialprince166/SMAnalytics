/**
 * Transaction Service
 * 
 * Business logic for double-entry transaction management
 */

import {
  Transaction,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  TransactionFilters,
  TransactionSummary,
  TransactionNavigation,
  TransactionAuditEntry,
  TransactionAuditLog,
} from '@/types';
import {
  transactionRepository,
  holderAccountRepository,
  auditRepository,
} from '../repositories';

export class TransactionService {
  private static instance: TransactionService;

  private constructor() {}

  public static getInstance(): TransactionService {
    if (!TransactionService.instance) {
      TransactionService.instance = new TransactionService();
    }
    return TransactionService.instance;
  }

  /**
   * Create a new transaction with double-entry validation
   */
  async createTransaction(request: CreateTransactionRequest): Promise<Transaction> {
    // Validate double-entry: debit and credit must be equal
    if (request.amount <= 0) {
      throw new Error('Transaction amount must be greater than zero');
    }

    // Validate accounts exist
    const debitAccount = await holderAccountRepository.findById(request.debitAccountId);
    const creditAccount = await holderAccountRepository.findById(request.creditAccountId);

    if (!debitAccount) {
      throw new Error('Debit account not found');
    }

    if (!creditAccount) {
      throw new Error('Credit account not found');
    }

    if (request.debitAccountId === request.creditAccountId) {
      throw new Error('Debit and credit accounts must be different');
    }

    // Generate transaction number
    const number = await transactionRepository.getNextTransactionNumber(request.date);

    // Create transaction
    const transaction = await transactionRepository.create({
      date: request.date,
      number,
      description: request.description,
      amount: request.amount,
      debitAccountId: request.debitAccountId,
      creditAccountId: request.creditAccountId,
      reconciled: request.reconciled || false,
    });

    // Update account balances
    await this.updateAccountBalances(
      request.debitAccountId,
      request.creditAccountId,
      request.amount
    );

    // Log audit entry
    const { userId, username } = this.getCurrentUser();
    await this.logAudit(
      transaction.id,
      'CREATE',
      undefined,
      transaction,
      userId,
      username
    );

    return transaction;
  }

  /**
   * Update an existing transaction
   */
  async updateTransaction(
    transactionId: string,
    updates: UpdateTransactionRequest
  ): Promise<Transaction> {
    const existingTransaction = await transactionRepository.findById(transactionId);
    if (!existingTransaction) {
      throw new Error('Transaction not found');
    }

    // If amount or accounts changed, reverse old balances and apply new ones
    const amountChanged = updates.amount !== undefined && updates.amount !== existingTransaction.amount;
    const debitChanged = updates.debitAccountId !== undefined && updates.debitAccountId !== existingTransaction.debitAccountId;
    const creditChanged = updates.creditAccountId !== undefined && updates.creditAccountId !== existingTransaction.creditAccountId;

    if (amountChanged || debitChanged || creditChanged) {
      // Reverse old transaction
      await this.reverseAccountBalances(
        existingTransaction.debitAccountId,
        existingTransaction.creditAccountId,
        existingTransaction.amount
      );

      // Apply new transaction
      const newDebitId = updates.debitAccountId || existingTransaction.debitAccountId;
      const newCreditId = updates.creditAccountId || existingTransaction.creditAccountId;
      const newAmount = updates.amount || existingTransaction.amount;

      if (newDebitId === newCreditId) {
        throw new Error('Debit and credit accounts must be different');
      }

      await this.updateAccountBalances(newDebitId, newCreditId, newAmount);
    }

    // Update transaction
    const updatedTransaction = await transactionRepository.update(transactionId, updates);

    // Log audit entry
    const { userId, username } = this.getCurrentUser();
    await this.logAudit(
      transactionId,
      'UPDATE',
      existingTransaction,
      updatedTransaction,
      userId,
      username
    );

    return updatedTransaction;
  }

  /**
   * Delete a transaction
   */
  async deleteTransaction(transactionId: string): Promise<void> {
    const transaction = await transactionRepository.findById(transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Reverse account balances
    await this.reverseAccountBalances(
      transaction.debitAccountId,
      transaction.creditAccountId,
      transaction.amount
    );

    // Log audit entry before deletion
    const { userId, username } = this.getCurrentUser();
    await this.logAudit(
      transactionId,
      'DELETE',
      transaction,
      undefined,
      userId,
      username
    );

    // Delete transaction
    await transactionRepository.delete(transactionId);
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(transactionId: string): Promise<Transaction | null> {
    return await transactionRepository.findById(transactionId);
  }

  /**
   * Get transactions with filters
   */
  async getTransactions(filters?: TransactionFilters): Promise<Transaction[]> {
    return await transactionRepository.findAll(filters);
  }

  /**
   * Get transactions by date range
   */
  async getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]> {
    return await transactionRepository.findByDateRange(startDate, endDate);
  }

  /**
   * Get transactions by account
   */
  async getTransactionsByAccount(accountId: string): Promise<Transaction[]> {
    return await transactionRepository.findByAccount(accountId);
  }

  /**
   * Get transaction summaries for display
   */
  async getTransactionSummaries(filters?: TransactionFilters): Promise<TransactionSummary[]> {
    const transactions = await this.getTransactions(filters);
    
    const summaries: TransactionSummary[] = [];
    for (const transaction of transactions) {
      const debitAccount = await holderAccountRepository.findById(transaction.debitAccountId);
      const creditAccount = await holderAccountRepository.findById(transaction.creditAccountId);

      summaries.push({
        id: transaction.id,
        date: transaction.date,
        number: transaction.number,
        description: transaction.description,
        amount: transaction.amount,
        debitAccount: debitAccount?.name || 'Unknown',
        creditAccount: creditAccount?.name || 'Unknown',
        reconciled: transaction.reconciled,
      });
    }

    return summaries;
  }

  /**
   * Get transaction navigation info
   */
  async getTransactionNavigation(
    transactionId: string,
    filters?: TransactionFilters
  ): Promise<TransactionNavigation | null> {
    const transactions = await this.getTransactions(filters);
    const index = transactions.findIndex(t => t.id === transactionId);

    if (index === -1) {
      return null;
    }

    return {
      current: transactions[index],
      position: index + 1,
      total: transactions.length,
      hasNext: index < transactions.length - 1,
      hasPrevious: index > 0,
    };
  }

  /**
   * Get first transaction
   */
  async getFirstTransaction(date?: Date): Promise<Transaction | null> {
    return await transactionRepository.getFirstTransaction(date);
  }

  /**
   * Get last transaction
   */
  async getLastTransaction(date?: Date): Promise<Transaction | null> {
    return await transactionRepository.getLastTransaction(date);
  }

  /**
   * Get transactions by date
   */
  async getTransactionsByDate(date: Date): Promise<Transaction[]> {
    return await transactionRepository.findByDate(date);
  }

  /**
   * Toggle transaction reconciliation
   */
  async toggleReconciliation(transactionId: string): Promise<Transaction> {
    const transaction = await transactionRepository.findById(transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    const newReconciledStatus = !transaction.reconciled;
    const updatedTransaction = await transactionRepository.update(transactionId, {
      reconciled: newReconciledStatus,
    });

    // Log audit entry
    const { userId, username } = this.getCurrentUser();
    await this.logAudit(
      transactionId,
      newReconciledStatus ? 'RECONCILE' : 'UNRECONCILE',
      { reconciled: transaction.reconciled },
      { reconciled: newReconciledStatus },
      userId,
      username
    );

    return updatedTransaction;
  }

  /**
   * Update account balances for a transaction
   */
  private async updateAccountBalances(
    debitAccountId: string,
    creditAccountId: string,
    amount: number
  ): Promise<void> {
    // Debit increases the account balance
    await holderAccountRepository.updateBalance(debitAccountId, amount, true);

    // Credit decreases the account balance
    await holderAccountRepository.updateBalance(creditAccountId, amount, false);
  }

  /**
   * Reverse account balances for a transaction
   */
  private async reverseAccountBalances(
    debitAccountId: string,
    creditAccountId: string,
    amount: number
  ): Promise<void> {
    // Reverse debit (decrease balance)
    await holderAccountRepository.updateBalance(debitAccountId, amount, false);

    // Reverse credit (increase balance)
    await holderAccountRepository.updateBalance(creditAccountId, amount, true);
  }

  /**
   * Validate transaction data
   */
  async validateTransaction(data: CreateTransactionRequest): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    if (!data.description || data.description.trim().length === 0) {
      errors.push('Description is required');
    }

    if (data.amount <= 0) {
      errors.push('Amount must be greater than zero');
    }

    if (!data.debitAccountId) {
      errors.push('Debit account is required');
    }

    if (!data.creditAccountId) {
      errors.push('Credit account is required');
    }

    if (data.debitAccountId === data.creditAccountId) {
      errors.push('Debit and credit accounts must be different');
    }

    // Validate accounts exist
    if (data.debitAccountId) {
      const debitAccount = await holderAccountRepository.findById(data.debitAccountId);
      if (!debitAccount) {
        errors.push('Debit account not found');
      }
    }

    if (data.creditAccountId) {
      const creditAccount = await holderAccountRepository.findById(data.creditAccountId);
      if (!creditAccount) {
        errors.push('Credit account not found');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get account balance at a specific date
   */
  async getAccountBalanceAtDate(accountId: string, date: Date): Promise<number> {
    const transactions = await transactionRepository.findByAccount(accountId);
    
    let balance = 0;
    for (const transaction of transactions) {
      if (new Date(transaction.date) <= date) {
        if (transaction.debitAccountId === accountId) {
          balance += transaction.amount;
        } else if (transaction.creditAccountId === accountId) {
          balance -= transaction.amount;
        }
      }
    }

    return balance;
  }

  /**
   * Log audit entry for transaction action
   */
  private async logAudit(
    transactionId: string,
    action: TransactionAuditEntry['action'],
    previousValues?: Partial<Transaction>,
    newValues?: Partial<Transaction>,
    userId?: string,
    username?: string
  ): Promise<void> {
    try {
      await auditRepository.create({
        transactionId,
        action,
        timestamp: new Date(),
        userId,
        username,
        previousValues,
        newValues,
      });
    } catch (error) {
      console.error('Failed to log audit entry:', error);
      // Don't throw - audit logging failure shouldn't break the transaction
    }
  }

  /**
   * Get audit log for a transaction
   */
  async getAuditLog(transactionId: string): Promise<TransactionAuditLog | null> {
    try {
      const transaction = await transactionRepository.findById(transactionId);
      if (!transaction) {
        return null;
      }

      return await auditRepository.getAuditLog(transactionId, transaction.number);
    } catch (error) {
      console.error('Failed to get audit log:', error);
      return null;
    }
  }

  /**
   * Get all audit entries for a transaction
   */
  async getTransactionAuditEntries(transactionId: string): Promise<TransactionAuditEntry[]> {
    try {
      return await auditRepository.findByTransactionId(transactionId);
    } catch (error) {
      console.error('Failed to get audit entries:', error);
      return [];
    }
  }

  /**
   * Get audit entries by date range
   */
  async getAuditEntriesByDateRange(startDate: Date, endDate: Date): Promise<TransactionAuditEntry[]> {
    try {
      return await auditRepository.findByDateRange(startDate, endDate);
    } catch (error) {
      console.error('Failed to get audit entries by date range:', error);
      return [];
    }
  }

  /**
   * Get current user info for audit logging
   */
  private getCurrentUser(): { userId?: string; username?: string } {
    try {
      if (typeof window !== 'undefined') {
        const sessionData = localStorage.getItem('snm_session');
        if (sessionData) {
          const session = JSON.parse(sessionData);
          return {
            userId: session.userId,
            username: session.username,
          };
        }
      }
    } catch (error) {
      console.error('Failed to get current user:', error);
    }
    return {};
  }
}

// Export singleton instance
export const transactionService = TransactionService.getInstance();
