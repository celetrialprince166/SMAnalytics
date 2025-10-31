/**
 * Split Transaction Service Tests
 * 
 * Tests for split transaction management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SplitTransactionService } from '../SplitTransactionService';
import {
  splitTransactionRepository,
  transactionRepository,
  holderAccountRepository,
  auditRepository,
} from '../../repositories';
import { SplitTransaction, CreateSplitTransactionRequest } from '@/types';

// Mock the repositories
vi.mock('../../repositories', () => ({
  splitTransactionRepository: {
    create: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findByDateRange: vi.fn(),
    findByBaseAccount: vi.fn(),
    findBySplitAccount: vi.fn(),
    getNextCode: vi.fn(),
  },
  transactionRepository: {
    create: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getNextTransactionNumber: vi.fn(),
  },
  holderAccountRepository: {
    findById: vi.fn(),
    updateBalance: vi.fn(),
  },
  auditRepository: {
    create: vi.fn(),
  },
}));

describe('SplitTransactionService', () => {
  let splitTransactionService: SplitTransactionService;

  beforeEach(() => {
    splitTransactionService = SplitTransactionService.getInstance();
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

  describe('createSplitTransaction', () => {
    it('should create a valid split transaction with balanced amounts', async () => {
      const request: CreateSplitTransactionRequest = {
        date: new Date('2025-10-06'),
        baseAccountId: 'base-account-1',
        baseAccountSide: 'CREDIT',
        splits: [
          {
            accountId: 'split-account-1',
            amount: 300,
            description: 'Split 1',
            reconciled: false,
          },
          {
            accountId: 'split-account-2',
            amount: 400,
            description: 'Split 2',
            reconciled: false,
          },
          {
            accountId: 'split-account-3',
            amount: 300,
            description: 'Split 3',
            reconciled: false,
          },
        ],
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

      const mockSplitTransaction: SplitTransaction = {
        id: 'split-1',
        date: request.date,
        code: 'SPL-20251006-001',
        baseAccountId: request.baseAccountId,
        baseAccountSide: request.baseAccountSide,
        splits: request.splits.map((s, i) => ({
          id: `split-entry-${i}`,
          transactionNumber: `TRN-00${i + 1}`,
          accountId: s.accountId,
          amount: s.amount,
          description: s.description,
          reconciled: false,
        })),
        totalAmount: 1000,
        reconciled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(holderAccountRepository.findById).mockResolvedValue(mockAccount);
      vi.mocked(splitTransactionRepository.getNextCode).mockResolvedValue('SPL-20251006-001');
      vi.mocked(transactionRepository.getNextTransactionNumber)
        .mockResolvedValueOnce('TRN-001')
        .mockResolvedValueOnce('TRN-002')
        .mockResolvedValueOnce('TRN-003');
      vi.mocked(transactionRepository.create).mockResolvedValue({} as any);
      vi.mocked(holderAccountRepository.updateBalance).mockResolvedValue(mockAccount);
      vi.mocked(splitTransactionRepository.create).mockResolvedValue(mockSplitTransaction);
      vi.mocked(transactionRepository.update).mockResolvedValue({} as any);

      const result = await splitTransactionService.createSplitTransaction(request);

      expect(result).toEqual(mockSplitTransaction);
      expect(splitTransactionRepository.create).toHaveBeenCalled();
      expect(transactionRepository.create).toHaveBeenCalledTimes(3);
      expect(holderAccountRepository.updateBalance).toHaveBeenCalledTimes(6); // 3 splits × 2 accounts each
    });

    it('should reject split transaction with missing base account', async () => {
      const request: CreateSplitTransactionRequest = {
        date: new Date(),
        baseAccountId: 'non-existent',
        baseAccountSide: 'CREDIT',
        splits: [
          {
            accountId: 'split-1',
            amount: 100,
            description: 'Test',
            reconciled: false,
          },
        ],
      };

      vi.mocked(holderAccountRepository.findById).mockResolvedValue(null);

      await expect(splitTransactionService.createSplitTransaction(request)).rejects.toThrow(
        'Base account not found'
      );
    });

    it('should reject split transaction with missing split account', async () => {
      const request: CreateSplitTransactionRequest = {
        date: new Date(),
        baseAccountId: 'base-account',
        baseAccountSide: 'CREDIT',
        splits: [
          {
            accountId: 'non-existent',
            amount: 100,
            description: 'Test',
            reconciled: false,
          },
        ],
      };

      const mockAccount = {
        id: 'base-account',
        name: 'Base Account',
        code: 'ACC-001',
        balance: 0,
        secondaryAccountId: 'sec-1',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(holderAccountRepository.findById)
        .mockResolvedValueOnce(mockAccount)
        .mockResolvedValueOnce(null);

      await expect(splitTransactionService.createSplitTransaction(request)).rejects.toThrow(
        'Split account non-existent not found'
      );
    });

    it('should reject split transaction with no splits', async () => {
      const request: CreateSplitTransactionRequest = {
        date: new Date(),
        baseAccountId: 'base-account',
        baseAccountSide: 'CREDIT',
        splits: [],
      };

      await expect(splitTransactionService.createSplitTransaction(request)).rejects.toThrow(
        'At least one split is required'
      );
    });
  });

  describe('validateSplitTransaction', () => {
    it('should validate a correct split transaction', async () => {
      const data: CreateSplitTransactionRequest = {
        date: new Date(),
        baseAccountId: 'base-account',
        baseAccountSide: 'CREDIT',
        splits: [
          {
            accountId: 'split-1',
            amount: 500,
            description: 'Split 1',
            reconciled: false,
          },
          {
            accountId: 'split-2',
            amount: 500,
            description: 'Split 2',
            reconciled: false,
          },
        ],
      };

      const result = await splitTransactionService.validateSplitTransaction(data);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject split with missing base account', async () => {
      const data: CreateSplitTransactionRequest = {
        date: new Date(),
        baseAccountId: '',
        baseAccountSide: 'CREDIT',
        splits: [
          {
            accountId: 'split-1',
            amount: 100,
            description: 'Test',
            reconciled: false,
          },
        ],
      };

      const result = await splitTransactionService.validateSplitTransaction(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Base account is required');
    });

    it('should reject split with zero or negative amounts', async () => {
      const data: CreateSplitTransactionRequest = {
        date: new Date(),
        baseAccountId: 'base-account',
        baseAccountSide: 'CREDIT',
        splits: [
          {
            accountId: 'split-1',
            amount: 0,
            description: 'Test',
            reconciled: false,
          },
        ],
      };

      const result = await splitTransactionService.validateSplitTransaction(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Split 1: Amount must be greater than zero');
    });

    it('should reject split with missing description', async () => {
      const data: CreateSplitTransactionRequest = {
        date: new Date(),
        baseAccountId: 'base-account',
        baseAccountSide: 'CREDIT',
        splits: [
          {
            accountId: 'split-1',
            amount: 100,
            description: '',
            reconciled: false,
          },
        ],
      };

      const result = await splitTransactionService.validateSplitTransaction(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Split 1: Description is required');
    });

    it('should reject split where split account equals base account', async () => {
      const data: CreateSplitTransactionRequest = {
        date: new Date(),
        baseAccountId: 'same-account',
        baseAccountSide: 'CREDIT',
        splits: [
          {
            accountId: 'same-account',
            amount: 100,
            description: 'Test',
            reconciled: false,
          },
        ],
      };

      const result = await splitTransactionService.validateSplitTransaction(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Split 1: Split account cannot be the same as base account');
    });

    it('should reject split with duplicate accounts', async () => {
      const data: CreateSplitTransactionRequest = {
        date: new Date(),
        baseAccountId: 'base-account',
        baseAccountSide: 'CREDIT',
        splits: [
          {
            accountId: 'split-1',
            amount: 100,
            description: 'Test 1',
            reconciled: false,
          },
          {
            accountId: 'split-1',
            amount: 200,
            description: 'Test 2',
            reconciled: false,
          },
        ],
      };

      const result = await splitTransactionService.validateSplitTransaction(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Duplicate accounts found in splits');
    });
  });

  describe('updateSplitTransaction', () => {
    it('should update split transaction and recalculate balances', async () => {
      const splitId = 'split-1';
      const existingSplit: SplitTransaction = {
        id: splitId,
        date: new Date('2025-10-01'),
        code: 'SPL-20251001-001',
        baseAccountId: 'base-account',
        baseAccountSide: 'CREDIT',
        splits: [
          {
            id: 'split-entry-1',
            transactionNumber: 'TRN-001',
            accountId: 'split-1',
            amount: 500,
            description: 'Original split',
            reconciled: false,
          },
        ],
        totalAmount: 500,
        reconciled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updates = {
        splits: [
          {
            accountId: 'split-1',
            amount: 600,
            description: 'Updated split',
            reconciled: false,
          },
        ],
      };

      vi.mocked(splitTransactionRepository.findById).mockResolvedValue(existingSplit);
      vi.mocked(transactionRepository.findAll).mockResolvedValue([
        {
          id: 'trans-1',
          splitTransactionId: splitId,
          debitAccountId: 'split-1',
          creditAccountId: 'base-account',
          amount: 500,
        } as any,
      ]);
      vi.mocked(holderAccountRepository.updateBalance).mockResolvedValue({} as any);
      vi.mocked(transactionRepository.delete).mockResolvedValue(undefined);
      vi.mocked(transactionRepository.getNextTransactionNumber).mockResolvedValue('TRN-002');
      vi.mocked(transactionRepository.create).mockResolvedValue({} as any);
      vi.mocked(splitTransactionRepository.update).mockResolvedValue({
        ...existingSplit,
        ...updates,
        totalAmount: 600,
      } as any);

      const result = await splitTransactionService.updateSplitTransaction(splitId, updates);

      expect(result.totalAmount).toBe(600);
      expect(transactionRepository.delete).toHaveBeenCalled();
      expect(transactionRepository.create).toHaveBeenCalled();
    });

    it('should reject update for non-existent split transaction', async () => {
      vi.mocked(splitTransactionRepository.findById).mockResolvedValue(null);

      await expect(
        splitTransactionService.updateSplitTransaction('non-existent', {})
      ).rejects.toThrow('Split transaction not found');
    });
  });

  describe('deleteSplitTransaction', () => {
    it('should delete split transaction and reverse all balances', async () => {
      const splitId = 'split-1';
      const splitTransaction: SplitTransaction = {
        id: splitId,
        date: new Date(),
        code: 'SPL-20251006-001',
        baseAccountId: 'base-account',
        baseAccountSide: 'CREDIT',
        splits: [
          {
            id: 'split-entry-1',
            transactionNumber: 'TRN-001',
            accountId: 'split-1',
            amount: 300,
            description: 'Split 1',
            reconciled: false,
          },
          {
            id: 'split-entry-2',
            transactionNumber: 'TRN-002',
            accountId: 'split-2',
            amount: 700,
            description: 'Split 2',
            reconciled: false,
          },
        ],
        totalAmount: 1000,
        reconciled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(splitTransactionRepository.findById).mockResolvedValue(splitTransaction);
      vi.mocked(transactionRepository.findAll).mockResolvedValue([
        {
          id: 'trans-1',
          splitTransactionId: splitId,
          debitAccountId: 'split-1',
          creditAccountId: 'base-account',
          amount: 300,
        } as any,
        {
          id: 'trans-2',
          splitTransactionId: splitId,
          debitAccountId: 'split-2',
          creditAccountId: 'base-account',
          amount: 700,
        } as any,
      ]);
      vi.mocked(holderAccountRepository.updateBalance).mockResolvedValue({} as any);
      vi.mocked(transactionRepository.delete).mockResolvedValue(undefined);
      vi.mocked(splitTransactionRepository.delete).mockResolvedValue(undefined);

      await splitTransactionService.deleteSplitTransaction(splitId);

      expect(transactionRepository.delete).toHaveBeenCalledTimes(2);
      expect(holderAccountRepository.updateBalance).toHaveBeenCalledTimes(4); // 2 transactions × 2 accounts each
      expect(splitTransactionRepository.delete).toHaveBeenCalledWith(splitId);
    });

    it('should reject delete for non-existent split transaction', async () => {
      vi.mocked(splitTransactionRepository.findById).mockResolvedValue(null);

      await expect(
        splitTransactionService.deleteSplitTransaction('non-existent')
      ).rejects.toThrow('Split transaction not found');
    });
  });

  describe('toggleReconciliation', () => {
    it('should toggle reconciliation status from false to true', async () => {
      const splitId = 'split-1';
      const splitTransaction: SplitTransaction = {
        id: splitId,
        date: new Date(),
        code: 'SPL-20251006-001',
        baseAccountId: 'base-account',
        baseAccountSide: 'CREDIT',
        splits: [],
        totalAmount: 1000,
        reconciled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const reconciledSplit = { ...splitTransaction, reconciled: true };

      vi.mocked(splitTransactionRepository.findById).mockResolvedValue(splitTransaction);
      vi.mocked(splitTransactionRepository.update).mockResolvedValue(reconciledSplit);
      vi.mocked(transactionRepository.findAll).mockResolvedValue([
        { id: 'trans-1', splitTransactionId: splitId } as any,
      ]);
      vi.mocked(transactionRepository.update).mockResolvedValue({} as any);

      const result = await splitTransactionService.toggleReconciliation(splitId);

      expect(result.reconciled).toBe(true);
      expect(splitTransactionRepository.update).toHaveBeenCalledWith(splitId, {
        reconciled: true,
      });
      expect(transactionRepository.update).toHaveBeenCalledWith('trans-1', {
        reconciled: true,
      });
    });

    it('should toggle reconciliation status from true to false', async () => {
      const splitId = 'split-1';
      const splitTransaction: SplitTransaction = {
        id: splitId,
        date: new Date(),
        code: 'SPL-20251006-001',
        baseAccountId: 'base-account',
        baseAccountSide: 'CREDIT',
        splits: [],
        totalAmount: 1000,
        reconciled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const unreconciledSplit = { ...splitTransaction, reconciled: false };

      vi.mocked(splitTransactionRepository.findById).mockResolvedValue(splitTransaction);
      vi.mocked(splitTransactionRepository.update).mockResolvedValue(unreconciledSplit);
      vi.mocked(transactionRepository.findAll).mockResolvedValue([]);

      const result = await splitTransactionService.toggleReconciliation(splitId);

      expect(result.reconciled).toBe(false);
    });
  });

  describe('query methods', () => {
    it('should get split transactions by date range', async () => {
      const startDate = new Date('2025-10-01');
      const endDate = new Date('2025-10-31');
      const mockSplits: SplitTransaction[] = [
        {
          id: 'split-1',
          date: new Date('2025-10-15'),
          code: 'SPL-20251015-001',
          baseAccountId: 'base-1',
          baseAccountSide: 'CREDIT',
          splits: [],
          totalAmount: 1000,
          reconciled: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(splitTransactionRepository.findByDateRange).mockResolvedValue(mockSplits);

      const result = await splitTransactionService.getSplitTransactionsByDateRange(
        startDate,
        endDate
      );

      expect(result).toEqual(mockSplits);
      expect(splitTransactionRepository.findByDateRange).toHaveBeenCalledWith(startDate, endDate);
    });

    it('should get split transactions by base account', async () => {
      const accountId = 'base-account-1';
      const mockSplits: SplitTransaction[] = [
        {
          id: 'split-1',
          date: new Date(),
          code: 'SPL-20251006-001',
          baseAccountId: accountId,
          baseAccountSide: 'CREDIT',
          splits: [],
          totalAmount: 1000,
          reconciled: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(splitTransactionRepository.findByBaseAccount).mockResolvedValue(mockSplits);

      const result = await splitTransactionService.getSplitTransactionsByBaseAccount(accountId);

      expect(result).toEqual(mockSplits);
      expect(splitTransactionRepository.findByBaseAccount).toHaveBeenCalledWith(accountId);
    });

    it('should get split transactions by split account', async () => {
      const accountId = 'split-account-1';
      const mockSplits: SplitTransaction[] = [
        {
          id: 'split-1',
          date: new Date(),
          code: 'SPL-20251006-001',
          baseAccountId: 'base-1',
          baseAccountSide: 'CREDIT',
          splits: [
            {
              id: 'entry-1',
              transactionNumber: 'TRN-001',
              accountId,
              amount: 500,
              description: 'Test',
              reconciled: false,
            },
          ],
          totalAmount: 1000,
          reconciled: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(splitTransactionRepository.findBySplitAccount).mockResolvedValue(mockSplits);

      const result = await splitTransactionService.getSplitTransactionsBySplitAccount(accountId);

      expect(result).toEqual(mockSplits);
      expect(splitTransactionRepository.findBySplitAccount).toHaveBeenCalledWith(accountId);
    });
  });
});
