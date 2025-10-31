/**
 * Split Transaction Service
 * 
 * Business logic for split transaction management
 * Handles transactions where one base account is split across multiple accounts
 */

import {
  SplitTransaction,
  TransactionSplit,
  CreateSplitTransactionRequest,
  Transaction,
} from '@/types';
import {
  splitTransactionRepository,
  transactionRepository,
  holderAccountRepository,
  auditRepository,
} from '../repositories';

export class SplitTransactionService {
  private static instance: SplitTransactionService;

  private constructor() {}

  public static getInstance(): SplitTransactionService {
    if (!SplitTransactionService.instance) {
      SplitTransactionService.instance = new SplitTransactionService();
    }
    return SplitTransactionService.instance;
  }

  /**
   * Create a new split transaction
   */
  async createSplitTransaction(request: CreateSplitTransactionRequest): Promise<SplitTransaction> {
    // Validate split amounts balance
    const validation = await this.validateSplitTransaction(request);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    // Validate base account exists
    const baseAccount = await holderAccountRepository.findById(request.baseAccountId);
    if (!baseAccount) {
      throw new Error('Base account not found');
    }

    // Validate all split accounts exist
    for (const split of request.splits) {
      const account = await holderAccountRepository.findById(split.accountId);
      if (!account) {
        throw new Error(`Split account ${split.accountId} not found`);
      }
    }

    // Generate split transaction code
    const code = await splitTransactionRepository.getNextCode(request.date);

    // Calculate total amount
    const totalAmount = request.splits.reduce((sum, split) => sum + split.amount, 0);

    // Create individual transactions for each split
    const transactions: Transaction[] = [];
    const transactionSplits: TransactionSplit[] = [];

    for (const split of request.splits) {
      // Generate transaction number
      const transactionNumber = await transactionRepository.getNextTransactionNumber(request.date);

      // Determine debit and credit accounts based on base account side
      const debitAccountId = request.baseAccountSide === 'DEBIT' 
        ? request.baseAccountId 
        : split.accountId;
      const creditAccountId = request.baseAccountSide === 'DEBIT' 
        ? split.accountId 
        : request.baseAccountId;

      // Create transaction
      const transaction = await transactionRepository.create({
        date: request.date,
        number: transactionNumber,
        description: split.description,
        amount: split.amount,
        debitAccountId,
        creditAccountId,
        reconciled: false,
        splitTransactionId: '', // Will be updated after split transaction is created
      });

      transactions.push(transaction);

      // Update account balances
      await holderAccountRepository.updateBalance(debitAccountId, split.amount, true);
      await holderAccountRepository.updateBalance(creditAccountId, split.amount, false);

      // Create transaction split record
      transactionSplits.push({
        id: this.generateId(),
        transactionNumber,
        accountId: split.accountId,
        amount: split.amount,
        description: split.description,
        reconciled: false,
      });
    }

    // Create split transaction
    const splitTransaction = await splitTransactionRepository.create({
      date: request.date,
      code,
      baseAccountId: request.baseAccountId,
      baseAccountSide: request.baseAccountSide,
      splits: transactionSplits,
      totalAmount,
      reconciled: false,
    });

    // Update transactions with split transaction ID
    for (const transaction of transactions) {
      await transactionRepository.update(transaction.id, {
        splitTransactionId: splitTransaction.id,
      });
    }

    // Log audit entry
    const { userId, username } = this.getCurrentUser();
    await this.logAudit(
      splitTransaction.id,
      'CREATE',
      undefined,
      splitTransaction,
      userId,
      username
    );

    return splitTransaction;
  }

  /**
   * Update a split transaction
   */
  async updateSplitTransaction(
    splitTransactionId: string,
    updates: Partial<CreateSplitTransactionRequest>
  ): Promise<SplitTransaction> {
    const existingSplit = await splitTransactionRepository.findById(splitTransactionId);
    if (!existingSplit) {
      throw new Error('Split transaction not found');
    }

    // If splits are being updated, we need to reverse old transactions and create new ones
    if (updates.splits) {
      // Validate new splits
      const validation = await this.validateSplitTransaction({
        date: updates.date || existingSplit.date,
        baseAccountId: updates.baseAccountId || existingSplit.baseAccountId,
        baseAccountSide: updates.baseAccountSide || existingSplit.baseAccountSide,
        splits: updates.splits,
      });

      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Delete old transactions and reverse balances
      const oldTransactions = await transactionRepository.findAll();
      const splitTransactions = oldTransactions.filter(
        t => t.splitTransactionId === splitTransactionId
      );

      for (const transaction of splitTransactions) {
        // Reverse balances
        await holderAccountRepository.updateBalance(transaction.debitAccountId, transaction.amount, false);
        await holderAccountRepository.updateBalance(transaction.creditAccountId, transaction.amount, true);
        // Delete transaction
        await transactionRepository.delete(transaction.id);
      }

      // Create new transactions
      const newSplits: TransactionSplit[] = [];
      const baseAccountId = updates.baseAccountId || existingSplit.baseAccountId;
      const baseAccountSide = updates.baseAccountSide || existingSplit.baseAccountSide;
      const date = updates.date || existingSplit.date;

      for (const split of updates.splits) {
        const transactionNumber = await transactionRepository.getNextTransactionNumber(date);

        const debitAccountId = baseAccountSide === 'DEBIT' ? baseAccountId : split.accountId;
        const creditAccountId = baseAccountSide === 'DEBIT' ? split.accountId : baseAccountId;

        await transactionRepository.create({
          date,
          number: transactionNumber,
          description: split.description,
          amount: split.amount,
          debitAccountId,
          creditAccountId,
          reconciled: false,
          splitTransactionId,
        });

        await holderAccountRepository.updateBalance(debitAccountId, split.amount, true);
        await holderAccountRepository.updateBalance(creditAccountId, split.amount, false);

        newSplits.push({
          id: this.generateId(),
          transactionNumber,
          accountId: split.accountId,
          amount: split.amount,
          description: split.description,
          reconciled: false,
        });
      }

      updates.splits = newSplits as any;
    }

    // Calculate new total amount if splits changed
    if (updates.splits) {
      const totalAmount = (updates.splits as any).reduce((sum: number, split: TransactionSplit) => 
        sum + split.amount, 0
      );
      (updates as any).totalAmount = totalAmount;
    }

    // Update split transaction
    const updatedSplit = await splitTransactionRepository.update(splitTransactionId, updates as Partial<SplitTransaction>);

    // Log audit entry
    const { userId, username } = this.getCurrentUser();
    await this.logAudit(
      splitTransactionId,
      'UPDATE',
      existingSplit,
      updatedSplit,
      userId,
      username
    );

    return updatedSplit;
  }

  /**
   * Delete a split transaction
   */
  async deleteSplitTransaction(splitTransactionId: string): Promise<void> {
    const splitTransaction = await splitTransactionRepository.findById(splitTransactionId);
    if (!splitTransaction) {
      throw new Error('Split transaction not found');
    }

    // Find and delete all associated transactions
    const allTransactions = await transactionRepository.findAll();
    const splitTransactions = allTransactions.filter(
      t => t.splitTransactionId === splitTransactionId
    );

    for (const transaction of splitTransactions) {
      // Reverse balances
      await holderAccountRepository.updateBalance(transaction.debitAccountId, transaction.amount, false);
      await holderAccountRepository.updateBalance(transaction.creditAccountId, transaction.amount, true);
      // Delete transaction
      await transactionRepository.delete(transaction.id);
    }

    // Log audit entry before deletion
    const { userId, username } = this.getCurrentUser();
    await this.logAudit(
      splitTransactionId,
      'DELETE',
      splitTransaction,
      undefined,
      userId,
      username
    );

    // Delete split transaction
    await splitTransactionRepository.delete(splitTransactionId);
  }

  /**
   * Get split transaction by ID
   */
  async getSplitTransactionById(splitTransactionId: string): Promise<SplitTransaction | null> {
    return await splitTransactionRepository.findById(splitTransactionId);
  }

  /**
   * Get all split transactions
   */
  async getSplitTransactions(): Promise<SplitTransaction[]> {
    return await splitTransactionRepository.findAll();
  }

  /**
   * Get split transactions by date range
   */
  async getSplitTransactionsByDateRange(startDate: Date, endDate: Date): Promise<SplitTransaction[]> {
    return await splitTransactionRepository.findByDateRange(startDate, endDate);
  }

  /**
   * Get split transactions by base account
   */
  async getSplitTransactionsByBaseAccount(accountId: string): Promise<SplitTransaction[]> {
    return await splitTransactionRepository.findByBaseAccount(accountId);
  }

  /**
   * Get split transactions by split account
   */
  async getSplitTransactionsBySplitAccount(accountId: string): Promise<SplitTransaction[]> {
    return await splitTransactionRepository.findBySplitAccount(accountId);
  }

  /**
   * Toggle reconciliation for split transaction
   */
  async toggleReconciliation(splitTransactionId: string): Promise<SplitTransaction> {
    const splitTransaction = await splitTransactionRepository.findById(splitTransactionId);
    if (!splitTransaction) {
      throw new Error('Split transaction not found');
    }

    const newReconciledStatus = !splitTransaction.reconciled;

    // Update split transaction
    const updatedSplit = await splitTransactionRepository.update(splitTransactionId, {
      reconciled: newReconciledStatus,
    });

    // Update all associated transactions
    const allTransactions = await transactionRepository.findAll();
    const splitTransactions = allTransactions.filter(
      t => t.splitTransactionId === splitTransactionId
    );

    for (const transaction of splitTransactions) {
      await transactionRepository.update(transaction.id, {
        reconciled: newReconciledStatus,
      });
    }

    // Log audit entry
    const { userId, username } = this.getCurrentUser();
    await this.logAudit(
      splitTransactionId,
      newReconciledStatus ? 'RECONCILE' : 'UNRECONCILE',
      { reconciled: splitTransaction.reconciled } as any,
      { reconciled: newReconciledStatus } as any,
      userId,
      username
    );

    return updatedSplit;
  }

  /**
   * Validate split transaction
   */
  async validateSplitTransaction(data: CreateSplitTransactionRequest): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    if (!data.baseAccountId) {
      errors.push('Base account is required');
    }

    if (!data.baseAccountSide) {
      errors.push('Base account side is required');
    }

    if (!data.splits || data.splits.length === 0) {
      errors.push('At least one split is required');
    }

    if (data.splits) {
      // Validate each split
      for (let i = 0; i < data.splits.length; i++) {
        const split = data.splits[i];
        
        if (!split.accountId) {
          errors.push(`Split ${i + 1}: Account is required`);
        }

        if (!split.amount || split.amount <= 0) {
          errors.push(`Split ${i + 1}: Amount must be greater than zero`);
        }

        if (!split.description || split.description.trim().length === 0) {
          errors.push(`Split ${i + 1}: Description is required`);
        }

        // Check if split account is same as base account
        if (split.accountId === data.baseAccountId) {
          errors.push(`Split ${i + 1}: Split account cannot be the same as base account`);
        }
      }

      // Check for duplicate accounts in splits
      const accountIds = data.splits.map(s => s.accountId);
      const duplicates = accountIds.filter((id, index) => accountIds.indexOf(id) !== index);
      if (duplicates.length > 0) {
        errors.push('Duplicate accounts found in splits');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Log audit entry for split transaction action
   */
  private async logAudit(
    splitTransactionId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RECONCILE' | 'UNRECONCILE',
    previousValues?: Partial<SplitTransaction>,
    newValues?: Partial<SplitTransaction>,
    userId?: string,
    username?: string
  ): Promise<void> {
    try {
      await auditRepository.create({
        transactionId: splitTransactionId,
        action,
        timestamp: new Date(),
        userId,
        username,
        previousValues: previousValues as any,
        newValues: newValues as any,
      });
    } catch (error) {
      console.error('Failed to log audit entry:', error);
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

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `split_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const splitTransactionService = SplitTransactionService.getInstance();
