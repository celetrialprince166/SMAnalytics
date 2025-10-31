/**
 * Transaction Service Tests
 * 
 * Tests for double-entry transaction management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TransactionService } from '../TransactionService';
import { transactionRepository, holderAccountRepository, auditRepository } from '../../repositories';
import { Transaction, CreateTransactionRequest } from '@/types';

// Mock the repositories
vi.mock('../../repositories', () => ({
  transactionRepository: {
    create: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findByAccount: vi.fn(),
    findByDateRange: vi.fn(),
    findByDate: vi.fn(),
    getNextTransactionNumber: vi.fn(),
    getFirstTransaction: vi.fn(),
    getLastTransaction: vi.fn(),
  },
  holderAccountRepository: {
    findById: vi.fn(),
    updateBalance: vi.fn(),
  },
  auditRepository: {
    create: vi.fn(),
    findByTransactionId: vi.fn(),
    getAuditLog: vi.fn(),
  },
}));

describe('TransactionService', () => {
  let transactionService: TransactionService;

  beforeEach(() => {
    transactionService = TransactionService.getInstance();
    vi.clearAllMocks();
    
    // Mock localStorage for audit logging
    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };
  });

  describe('createTransaction', () => {
    it('should create a valid transaction with double-entry bookkeeping', async () => {
      const request: CreateTransactionRequest = {
        date: new Date('2025-10-06'),
        description: 'Test transaction',
        amount: 1000,
        debitAccountId: 'debit-account-1',
        creditAccountId: 'credit-account-1',
        reconciled: false,
      };

      const mockDebitAccount = {
        id: 'debit-account-1',
        name: 'Cash',
        code: 'ACC-001',
        balance: 5000,
        secondaryAccountId: 'sec-1',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockCreditAccount = {
        id: 'credit-account-1',
        name: 'Revenue',
        code: 'ACC-002',
        balance: 0,
        secondaryAccountId: 'sec-2',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockTransaction: Transaction = {
        id: 'trans-1',
        date: request.date,
        number: 'TRN-001',
        description: request.description,
        amount: request.amount,
        debitAccountId: request.debitAccountId,
        creditAccountId: request.creditAccountId,
        reconciled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(holderAccountRepository.findById)
        .mockResolvedValueOnce(mockDebitAccount)
        .mockResolvedValueOnce(mockCreditAccount);
      vi.mocked(transactionRepository.getNextTransactionNumber).mockResolvedValue('TRN-001');
      vi.mocked(transactionRepository.create).mockResolvedValue(mockTransaction);
      vi.mocked(holderAccountRepository.updateBalance).mockResolvedValue(mockDebitAccount);

      const result = await transactionService.createTransaction(request);

      expect(result).toEqual(mockTransaction);
      expect(holderAccountRepository.findById).toHaveBeenCalledWith('debit-account-1');
      expect(holderAccountRepository.findById).toHaveBeenCalledWith('credit-account-1');
      expect(transactionRepository.create).toHaveBeenCalled();
      expect(holderAccountRepository.updateBalance).toHaveBeenCalledWith('debit-account-1', 1000, true);
      expect(holderAccountRepository.updateBalance).toHaveBeenCalledWith('credit-account-1', 1000, false);
    });

    it('should reject transaction with zero or negative amount', async () => {
      const request: CreateTransactionRequest = {
        date: new Date(),
        description: 'Invalid transaction',
        amount: 0,
        debitAccountId: 'debit-1',
        creditAccountId: 'credit-1',
      };

      await expect(transactionService.createTransaction(request)).rejects.toThrow(
        'Transaction amount must be greater than zero'
      );
    });

    it('should reject transaction with same debit and credit accounts', async () => {
      const request: CreateTransactionRequest = {
        date: new Date(),
        description: 'Invalid transaction',
        amount: 1000,
        debitAccountId: 'same-account',
        creditAccountId: 'same-account',
      };

      const mockAccount = {
        id: 'same-account',
        name: 'Test Account',
        code: 'ACC-001',
        balance: 0,
        secondaryAccountId: 'sec-1',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(holderAccountRepository.findById).mockResolvedValue(mockAccount);

      await expect(transactionService.createTransaction(request)).rejects.toThrow(
        'Debit and credit accounts must be different'
      );
    });

    it('should reject transaction with non-existent debit account', async () => {
      const request: CreateTransactionRequest = {
        date: new Date(),
        description: 'Invalid transaction',
        amount: 1000,
        debitAccountId: 'non-existent',
        creditAccountId: 'credit-1',
      };

      vi.mocked(holderAccountRepository.findById).mockResolvedValue(null);

      await expect(transactionService.createTransaction(request)).rejects.toThrow(
        'Debit account not found'
      );
    });

    it('should reject transaction with non-existent credit account', async () => {
      const request: CreateTransactionRequest = {
        date: new Date(),
        description: 'Invalid transaction',
        amount: 1000,
        debitAccountId: 'debit-1',
        creditAccountId: 'non-existent',
      };

      const mockDebitAccount = {
        id: 'debit-1',
        name: 'Cash',
        code: 'ACC-001',
        balance: 5000,
        secondaryAccountId: 'sec-1',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(holderAccountRepository.findById)
        .mockResolvedValueOnce(mockDebitAccount)
        .mockResolvedValueOnce(null);

      await expect(transactionService.createTransaction(request)).rejects.toThrow(
        'Credit account not found'
      );
    });
  });

  describe('updateTransaction', () => {
    it('should update transaction and recalculate balances', async () => {
      const transactionId = 'trans-1';
      const existingTransaction: Transaction = {
        id: transactionId,
        date: new Date('2025-10-01'),
        number: 'TRN-001',
        description: 'Original description',
        amount: 1000,
        debitAccountId: 'debit-1',
        creditAccountId: 'credit-1',
        reconciled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updates = {
        description: 'Updated description',
        amount: 1500,
      };

      const updatedTransaction: Transaction = {
        ...existingTransaction,
        ...updates,
        updatedAt: new Date(),
      };

      vi.mocked(transactionRepository.findById).mockResolvedValue(existingTransaction);
      vi.mocked(transactionRepository.update).mockResolvedValue(updatedTransaction);
      vi.mocked(holderAccountRepository.updateBalance).mockResolvedValue({} as any);

      const result = await transactionService.updateTransaction(transactionId, updates);

      expect(result).toEqual(updatedTransaction);
      // Should reverse old balances
      expect(holderAccountRepository.updateBalance).toHaveBeenCalledWith('debit-1', 1000, false);
      expect(holderAccountRepository.updateBalance).toHaveBeenCalledWith('credit-1', 1000, true);
      // Should apply new balances
      expect(holderAccountRepository.updateBalance).toHaveBeenCalledWith('debit-1', 1500, true);
      expect(holderAccountRepository.updateBalance).toHaveBeenCalledWith('credit-1', 1500, false);
    });

    it('should reject update for non-existent transaction', async () => {
      vi.mocked(transactionRepository.findById).mockResolvedValue(null);

      await expect(
        transactionService.updateTransaction('non-existent', { description: 'Test' })
      ).rejects.toThrow('Transaction not found');
    });
  });

  describe('deleteTransaction', () => {
    it('should delete transaction and reverse balances', async () => {
      const transactionId = 'trans-1';
      const transaction: Transaction = {
        id: transactionId,
        date: new Date(),
        number: 'TRN-001',
        description: 'Test transaction',
        amount: 1000,
        debitAccountId: 'debit-1',
        creditAccountId: 'credit-1',
        reconciled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(transactionRepository.findById).mockResolvedValue(transaction);
      vi.mocked(transactionRepository.delete).mockResolvedValue(undefined);
      vi.mocked(holderAccountRepository.updateBalance).mockResolvedValue({} as any);

      await transactionService.deleteTransaction(transactionId);

      // Should reverse balances
      expect(holderAccountRepository.updateBalance).toHaveBeenCalledWith('debit-1', 1000, false);
      expect(holderAccountRepository.updateBalance).toHaveBeenCalledWith('credit-1', 1000, true);
      expect(transactionRepository.delete).toHaveBeenCalledWith(transactionId);
    });

    it('should reject delete for non-existent transaction', async () => {
      vi.mocked(transactionRepository.findById).mockResolvedValue(null);

      await expect(transactionService.deleteTransaction('non-existent')).rejects.toThrow(
        'Transaction not found'
      );
    });
  });

  describe('toggleReconciliation', () => {
    it('should toggle reconciliation status from false to true', async () => {
      const transactionId = 'trans-1';
      const transaction: Transaction = {
        id: transactionId,
        date: new Date(),
        number: 'TRN-001',
        description: 'Test transaction',
        amount: 1000,
        debitAccountId: 'debit-1',
        creditAccountId: 'credit-1',
        reconciled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const reconciledTransaction = { ...transaction, reconciled: true };

      vi.mocked(transactionRepository.findById).mockResolvedValue(transaction);
      vi.mocked(transactionRepository.update).mockResolvedValue(reconciledTransaction);

      const result = await transactionService.toggleReconciliation(transactionId);

      expect(result.reconciled).toBe(true);
      expect(transactionRepository.update).toHaveBeenCalledWith(transactionId, {
        reconciled: true,
      });
    });

    it('should toggle reconciliation status from true to false', async () => {
      const transactionId = 'trans-1';
      const transaction: Transaction = {
        id: transactionId,
        date: new Date(),
        number: 'TRN-001',
        description: 'Test transaction',
        amount: 1000,
        debitAccountId: 'debit-1',
        creditAccountId: 'credit-1',
        reconciled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const unreconciledTransaction = { ...transaction, reconciled: false };

      vi.mocked(transactionRepository.findById).mockResolvedValue(transaction);
      vi.mocked(transactionRepository.update).mockResolvedValue(unreconciledTransaction);

      const result = await transactionService.toggleReconciliation(transactionId);

      expect(result.reconciled).toBe(false);
      expect(transactionRepository.update).toHaveBeenCalledWith(transactionId, {
        reconciled: false,
      });
    });
  });

  describe('getTransactionSummaries', () => {
    it('should return transaction summaries with account names', async () => {
      const mockTransactions: Transaction[] = [
        {
          id: 'trans-1',
          date: new Date('2025-10-01'),
          number: 'TRN-001',
          description: 'Transaction 1',
          amount: 1000,
          debitAccountId: 'debit-1',
          creditAccountId: 'credit-1',
          reconciled: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'trans-2',
          date: new Date('2025-10-02'),
          number: 'TRN-002',
          description: 'Transaction 2',
          amount: 2000,
          debitAccountId: 'debit-2',
          creditAccountId: 'credit-2',
          reconciled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(transactionRepository.findAll).mockResolvedValue(mockTransactions);
      vi.mocked(holderAccountRepository.findById)
        .mockResolvedValueOnce({ id: 'debit-1', name: 'Cash', code: 'ACC-001' } as any)
        .mockResolvedValueOnce({ id: 'credit-1', name: 'Revenue', code: 'ACC-002' } as any)
        .mockResolvedValueOnce({ id: 'debit-2', name: 'Bank', code: 'ACC-003' } as any)
        .mockResolvedValueOnce({ id: 'credit-2', name: 'Sales', code: 'ACC-004' } as any);

      const summaries = await transactionService.getTransactionSummaries();

      expect(summaries).toHaveLength(2);
      expect(summaries[0]).toMatchObject({
        id: 'trans-1',
        number: 'TRN-001',
        description: 'Transaction 1',
        amount: 1000,
        debitAccount: 'Cash',
        creditAccount: 'Revenue',
        reconciled: false,
      });
      expect(summaries[1]).toMatchObject({
        id: 'trans-2',
        number: 'TRN-002',
        description: 'Transaction 2',
        amount: 2000,
        debitAccount: 'Bank',
        creditAccount: 'Sales',
        reconciled: true,
      });
    });
  });

  describe('validateTransaction', () => {
    it('should validate a correct transaction', async () => {
      const data: CreateTransactionRequest = {
        date: new Date(),
        description: 'Valid transaction',
        amount: 1000,
        debitAccountId: 'debit-1',
        creditAccountId: 'credit-1',
      };

      const mockAccount = {
        id: 'account-1',
        name: 'Test Account',
        code: 'ACC-001',
        balance: 0,
        secondaryAccountId: 'sec-1',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(holderAccountRepository.findById).mockResolvedValue(mockAccount);

      const result = await transactionService.validateTransaction(data);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject transaction with missing description', async () => {
      const data: CreateTransactionRequest = {
        date: new Date(),
        description: '',
        amount: 1000,
        debitAccountId: 'debit-1',
        creditAccountId: 'credit-1',
      };

      const result = await transactionService.validateTransaction(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Description is required');
    });

    it('should reject transaction with invalid amount', async () => {
      const data: CreateTransactionRequest = {
        date: new Date(),
        description: 'Test',
        amount: -100,
        debitAccountId: 'debit-1',
        creditAccountId: 'credit-1',
      };

      const result = await transactionService.validateTransaction(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Amount must be greater than zero');
    });

    it('should reject transaction with same debit and credit accounts', async () => {
      const data: CreateTransactionRequest = {
        date: new Date(),
        description: 'Test',
        amount: 1000,
        debitAccountId: 'same-account',
        creditAccountId: 'same-account',
      };

      const result = await transactionService.validateTransaction(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Debit and credit accounts must be different');
    });
  });

  describe('getAccountBalanceAtDate', () => {
    it('should calculate account balance at specific date', async () => {
      const accountId = 'account-1';
      const targetDate = new Date('2025-10-15');

      const mockTransactions: Transaction[] = [
        {
          id: 'trans-1',
          date: new Date('2025-10-01'),
          number: 'TRN-001',
          description: 'Transaction 1',
          amount: 1000,
          debitAccountId: accountId,
          creditAccountId: 'other-1',
          reconciled: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'trans-2',
          date: new Date('2025-10-10'),
          number: 'TRN-002',
          description: 'Transaction 2',
          amount: 500,
          debitAccountId: 'other-2',
          creditAccountId: accountId,
          reconciled: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'trans-3',
          date: new Date('2025-10-20'),
          number: 'TRN-003',
          description: 'Transaction 3 (after target date)',
          amount: 300,
          debitAccountId: accountId,
          creditAccountId: 'other-3',
          reconciled: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(transactionRepository.findByAccount).mockResolvedValue(mockTransactions);

      const balance = await transactionService.getAccountBalanceAtDate(accountId, targetDate);

      // Balance should be: +1000 (debit) - 500 (credit) = 500
      // Transaction 3 should not be included as it's after the target date
      expect(balance).toBe(500);
    });
  });
});
