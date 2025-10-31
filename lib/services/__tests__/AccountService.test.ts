/**
 * Account Service Tests
 * 
 * Tests for account management functionality including:
 * - Account creation with automatic code generation
 * - Account hierarchy relationships
 * - Account balance calculations
 * - Account validation rules
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AccountService } from '../AccountService';
import {
  primaryAccountRepository,
  secondaryAccountRepository,
  holderAccountRepository,
} from '../../repositories';
import { PrimaryAccount, SecondaryAccount, HolderAccount } from '@/types';

// Mock data
const mockPrimaryAccount: PrimaryAccount = {
  id: 'primary-1',
  name: 'Assets',
  type: 'ASSETS',
  description: 'Asset accounts',
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockSecondaryAccount: SecondaryAccount = {
  id: 'secondary-1',
  primaryAccountId: 'primary-1',
  name: 'Current Assets',
  code: '01-001',
  description: 'Current asset accounts',
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockHolderAccount: HolderAccount = {
  id: 'holder-1',
  secondaryAccountId: 'secondary-1',
  code: '01-001-001',
  name: 'Cash',
  description: 'Cash account',
  balance: 1000,
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('AccountService', () => {
  let accountService: AccountService;

  beforeEach(() => {
    accountService = AccountService.getInstance();

    // Clear localStorage before each test
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  describe('Account Creation with Automatic Code Generation', () => {
    it('should create a holder account with automatically generated code', async () => {
      // Setup: Create primary and secondary accounts first in storage
      const primary = await primaryAccountRepository.create({
        name: 'Assets',
        type: 'ASSETS',
        description: 'Asset accounts',
        isActive: true,
      });

      const secondary = await secondaryAccountRepository.create({
        primaryAccountId: primary.id,
        name: 'Current Assets',
        code: '01-001',
        description: 'Current asset accounts',
        isActive: true,
      });

      const result = await accountService.createHolderAccount({
        secondaryAccountId: secondary.id,
        name: 'Cash',
        description: 'Cash account',
      });

      expect(result.code).toMatch(/^\d+-\d+-\d+$/);
      expect(result.code).toBe('01-001-001');
    });

    it('should generate sequential codes for multiple accounts', async () => {
      // Setup: Create primary and secondary accounts first in storage
      const primary = await primaryAccountRepository.create({
        name: 'Assets',
        type: 'ASSETS',
        description: 'Asset accounts',
        isActive: true,
      });

      const secondary = await secondaryAccountRepository.create({
        primaryAccountId: primary.id,
        name: 'Current Assets',
        code: '01-001',
        description: 'Current asset accounts',
        isActive: true,
      });

      // Create first account
      await accountService.createHolderAccount({
        secondaryAccountId: secondary.id,
        name: 'Cash',
        description: 'Cash account',
      });

      // Create second account
      const result = await accountService.createHolderAccount({
        secondaryAccountId: secondary.id,
        name: 'Bank Account',
        description: 'Bank account',
      });

      expect(result.code).toBe('01-001-002');
    });

    it('should validate account name before creation', async () => {
      vi.spyOn(primaryAccountRepository, 'findById').mockResolvedValue(mockPrimaryAccount);
      vi.spyOn(secondaryAccountRepository, 'findById').mockResolvedValue(mockSecondaryAccount);
      vi.spyOn(holderAccountRepository, 'findBySecondaryAccount').mockResolvedValue([]);

      await expect(
        accountService.createHolderAccount({
          secondaryAccountId: 'secondary-1',
          name: '', // Invalid: empty name
          description: 'Test',
        })
      ).rejects.toThrow();
    });

    it('should validate account name length', async () => {
      vi.spyOn(primaryAccountRepository, 'findById').mockResolvedValue(mockPrimaryAccount);
      vi.spyOn(secondaryAccountRepository, 'findById').mockResolvedValue(mockSecondaryAccount);
      vi.spyOn(holderAccountRepository, 'findBySecondaryAccount').mockResolvedValue([]);

      await expect(
        accountService.createHolderAccount({
          secondaryAccountId: 'secondary-1',
          name: 'AB', // Invalid: too short (< 3 characters)
          description: 'Test',
        })
      ).rejects.toThrow();
    });
  });

  describe('Account Hierarchy Relationships', () => {
    it('should retrieve complete account hierarchy', async () => {
      vi.spyOn(primaryAccountRepository, 'findAll').mockResolvedValue([mockPrimaryAccount]);
      vi.spyOn(secondaryAccountRepository, 'findAll').mockResolvedValue([mockSecondaryAccount]);
      vi.spyOn(holderAccountRepository, 'findAll').mockResolvedValue([mockHolderAccount]);

      const hierarchy = await accountService.getAccountHierarchy();

      expect(hierarchy.primary).toHaveLength(1);
      expect(hierarchy.secondary).toHaveLength(1);
      expect(hierarchy.holder).toHaveLength(1);
      expect(hierarchy.primary[0].id).toBe('primary-1');
      expect(hierarchy.secondary[0].primaryAccountId).toBe('primary-1');
      expect(hierarchy.holder[0].secondaryAccountId).toBe('secondary-1');
    });

    it('should get secondary accounts by primary account', async () => {
      vi.spyOn(secondaryAccountRepository, 'findByPrimaryAccount').mockResolvedValue([
        mockSecondaryAccount,
      ]);

      const result = await accountService.getSecondaryAccounts('primary-1');

      expect(result).toHaveLength(1);
      expect(result[0].primaryAccountId).toBe('primary-1');
    });

    it('should get holder accounts by secondary account', async () => {
      vi.spyOn(holderAccountRepository, 'findBySecondaryAccount').mockResolvedValue([
        mockHolderAccount,
      ]);

      const result = await accountService.getHolderAccounts('secondary-1');

      expect(result).toHaveLength(1);
      expect(result[0].secondaryAccountId).toBe('secondary-1');
    });

    it('should build full account path', async () => {
      vi.spyOn(holderAccountRepository, 'findById').mockResolvedValue(mockHolderAccount);
      vi.spyOn(secondaryAccountRepository, 'findById').mockResolvedValue(mockSecondaryAccount);
      vi.spyOn(primaryAccountRepository, 'findById').mockResolvedValue(mockPrimaryAccount);

      const path = await accountService.getAccountPath('holder-1');

      expect(path).toBe('Assets > Current Assets > Cash');
    });

    it('should validate hierarchy when creating account', async () => {
      vi.spyOn(secondaryAccountRepository, 'findById').mockResolvedValue(null);

      await expect(
        accountService.createHolderAccount({
          secondaryAccountId: 'invalid-id',
          name: 'Test Account',
        })
      ).rejects.toThrow();
    });

    it('should prevent creating account under inactive secondary account', async () => {
      const inactiveSecondary = { ...mockSecondaryAccount, isActive: false };
      vi.spyOn(secondaryAccountRepository, 'findById').mockResolvedValue(inactiveSecondary);
      vi.spyOn(primaryAccountRepository, 'findById').mockResolvedValue(mockPrimaryAccount);
      vi.spyOn(holderAccountRepository, 'findBySecondaryAccount').mockResolvedValue([]);

      await expect(
        accountService.createHolderAccount({
          secondaryAccountId: 'secondary-1',
          name: 'Test Account',
        })
      ).rejects.toThrow();
    });

    it('should prevent creating account under inactive primary account', async () => {
      const inactivePrimary = { ...mockPrimaryAccount, isActive: false };
      vi.spyOn(secondaryAccountRepository, 'findById').mockResolvedValue(mockSecondaryAccount);
      vi.spyOn(primaryAccountRepository, 'findById').mockResolvedValue(inactivePrimary);
      vi.spyOn(holderAccountRepository, 'findBySecondaryAccount').mockResolvedValue([]);

      await expect(
        accountService.createHolderAccount({
          secondaryAccountId: 'secondary-1',
          name: 'Test Account',
        })
      ).rejects.toThrow();
    });
  });

  describe('Account Balance Calculations', () => {
    it('should return current account balance', async () => {
      vi.spyOn(holderAccountRepository, 'findById').mockResolvedValue(mockHolderAccount);

      const balance = await accountService.getAccountBalance('holder-1');

      expect(balance).toBe(1000);
    });

    it('should return zero for non-existent account', async () => {
      vi.spyOn(holderAccountRepository, 'findById').mockResolvedValue(null);

      const balance = await accountService.getAccountBalance('non-existent');

      expect(balance).toBe(0);
    });

    it('should calculate total balance by account type', async () => {
      const assetAccounts: HolderAccount[] = [
        { ...mockHolderAccount, id: 'holder-1', balance: 1000 },
        { ...mockHolderAccount, id: 'holder-2', balance: 2000 },
        { ...mockHolderAccount, id: 'holder-3', balance: 1500 },
      ];

      vi.spyOn(primaryAccountRepository, 'findByType').mockResolvedValue([mockPrimaryAccount]);
      vi.spyOn(secondaryAccountRepository, 'findAll').mockResolvedValue([mockSecondaryAccount]);
      vi.spyOn(holderAccountRepository, 'findAll').mockResolvedValue(assetAccounts);

      const totalBalance = await accountService.getTotalBalanceByType('ASSETS');

      expect(totalBalance).toBe(4500);
    });

    it('should get accounts by type', async () => {
      vi.spyOn(primaryAccountRepository, 'findByType').mockResolvedValue([mockPrimaryAccount]);
      vi.spyOn(secondaryAccountRepository, 'findAll').mockResolvedValue([mockSecondaryAccount]);
      vi.spyOn(holderAccountRepository, 'findAll').mockResolvedValue([mockHolderAccount]);

      const accounts = await accountService.getAccountsByType('ASSETS');

      expect(accounts).toHaveLength(1);
      expect(accounts[0].id).toBe('holder-1');
    });
  });

  describe('Account Validation Rules', () => {
    it('should enforce unique account codes', async () => {
      vi.spyOn(primaryAccountRepository, 'findById').mockResolvedValue(mockPrimaryAccount);
      vi.spyOn(secondaryAccountRepository, 'findById').mockResolvedValue(mockSecondaryAccount);
      vi.spyOn(holderAccountRepository, 'findBySecondaryAccount').mockResolvedValue([]);
      vi.spyOn(holderAccountRepository, 'findByCode').mockResolvedValue(mockHolderAccount);

      await expect(
        accountService.createHolderAccount({
          secondaryAccountId: 'secondary-1',
          name: 'Duplicate Account',
        })
      ).rejects.toThrow();
    });

    it('should enforce unique account names within secondary account', async () => {
      vi.spyOn(primaryAccountRepository, 'findById').mockResolvedValue(mockPrimaryAccount);
      vi.spyOn(secondaryAccountRepository, 'findById').mockResolvedValue(mockSecondaryAccount);
      vi.spyOn(holderAccountRepository, 'findBySecondaryAccount').mockResolvedValue([
        mockHolderAccount,
      ]);
      vi.spyOn(holderAccountRepository, 'findByCode').mockResolvedValue(null);

      await expect(
        accountService.createHolderAccount({
          secondaryAccountId: 'secondary-1',
          name: 'Cash', // Duplicate name
        })
      ).rejects.toThrow();
    });

    it('should validate description length', async () => {
      const longDescription = 'A'.repeat(501);
      vi.spyOn(primaryAccountRepository, 'findById').mockResolvedValue(mockPrimaryAccount);
      vi.spyOn(secondaryAccountRepository, 'findById').mockResolvedValue(mockSecondaryAccount);
      vi.spyOn(holderAccountRepository, 'findBySecondaryAccount').mockResolvedValue([]);
      vi.spyOn(holderAccountRepository, 'findByCode').mockResolvedValue(null);

      await expect(
        accountService.createHolderAccount({
          secondaryAccountId: 'secondary-1',
          name: 'Test Account',
          description: longDescription,
        })
      ).rejects.toThrow();
    });

    it('should allow updating account name', async () => {
      vi.spyOn(holderAccountRepository, 'findById').mockResolvedValue(mockHolderAccount);
      vi.spyOn(holderAccountRepository, 'update').mockResolvedValue({
        ...mockHolderAccount,
        name: 'Updated Cash',
      });

      const result = await accountService.updateHolderAccount('holder-1', {
        name: 'Updated Cash',
      });

      expect(result.name).toBe('Updated Cash');
    });

    it('should validate account exists before update', async () => {
      vi.spyOn(holderAccountRepository, 'findById').mockResolvedValue(null);

      await expect(
        accountService.updateHolderAccount('non-existent', {
          name: 'Updated Name',
        })
      ).rejects.toThrow();
    });

    it('should search accounts by name, code, or description', async () => {
      const accounts: HolderAccount[] = [
        { ...mockHolderAccount, name: 'Cash', code: '01-001-001' },
        { ...mockHolderAccount, id: 'holder-2', name: 'Bank', code: '01-001-002' },
        { ...mockHolderAccount, id: 'holder-3', name: 'Petty Cash', code: '01-001-003' },
      ];

      vi.spyOn(holderAccountRepository, 'search').mockResolvedValue(
        accounts.filter(a => a.name.toLowerCase().includes('cash'))
      );

      const results = await accountService.searchAccounts('cash');

      expect(results).toHaveLength(2);
      expect(results.some(a => a.name === 'Cash')).toBe(true);
      expect(results.some(a => a.name === 'Petty Cash')).toBe(true);
    });

    it('should get account options with full path', async () => {
      vi.spyOn(primaryAccountRepository, 'findAll').mockResolvedValue([mockPrimaryAccount]);
      vi.spyOn(secondaryAccountRepository, 'findAll').mockResolvedValue([mockSecondaryAccount]);
      vi.spyOn(holderAccountRepository, 'findAll').mockResolvedValue([mockHolderAccount]);

      const options = await accountService.getAccountOptions();

      expect(options).toHaveLength(1);
      expect(options[0].fullPath).toBe('Assets > Current Assets > Cash');
      expect(options[0].code).toBe('01-001-001');
      expect(options[0].balance).toBe(1000);
    });

    it('should filter account options by secondary account', async () => {
      const holder2: HolderAccount = {
        ...mockHolderAccount,
        id: 'holder-2',
        secondaryAccountId: 'secondary-2',
        name: 'Other Account',
      };

      vi.spyOn(primaryAccountRepository, 'findAll').mockResolvedValue([mockPrimaryAccount]);
      vi.spyOn(secondaryAccountRepository, 'findAll').mockResolvedValue([mockSecondaryAccount]);
      vi.spyOn(holderAccountRepository, 'findAll').mockResolvedValue([
        mockHolderAccount,
        holder2,
      ]);

      const options = await accountService.getAccountOptions('secondary-1');

      expect(options).toHaveLength(1);
      expect(options[0].id).toBe('holder-1');
    });
  });

  describe('Account Deletion Validation', () => {
    it('should allow deletion of account with no transactions', async () => {
      vi.spyOn(holderAccountRepository, 'findById').mockResolvedValue({
        ...mockHolderAccount,
        balance: 0,
      });

      // Mock transaction repository to return empty array
      const { transactionRepository } = await import('../../repositories');
      vi.spyOn(transactionRepository, 'findByAccount').mockResolvedValue([]);
      vi.spyOn(holderAccountRepository, 'delete').mockResolvedValue();

      await expect(
        accountService.deleteHolderAccount('holder-1')
      ).resolves.not.toThrow();
    });

    it('should prevent deletion of account with transactions', async () => {
      vi.spyOn(holderAccountRepository, 'findById').mockResolvedValue(mockHolderAccount);

      // Mock transaction repository to return transactions
      const { transactionRepository } = await import('../../repositories');
      vi.spyOn(transactionRepository, 'findByAccount').mockResolvedValue([
        { id: 'trans-1' } as any,
      ]);

      await expect(
        accountService.deleteHolderAccount('holder-1')
      ).rejects.toThrow(/existing transactions/);
    });

    it('should prevent deletion of account with non-zero balance', async () => {
      vi.spyOn(holderAccountRepository, 'findById').mockResolvedValue({
        ...mockHolderAccount,
        balance: 1000,
      });

      const { transactionRepository } = await import('../../repositories');
      vi.spyOn(transactionRepository, 'findByAccount').mockResolvedValue([]);

      await expect(
        accountService.deleteHolderAccount('holder-1')
      ).rejects.toThrow(/non-zero balance/);
    });
  });

  describe('Secondary Account Management', () => {
    it('should create secondary account with generated code', async () => {
      vi.spyOn(secondaryAccountRepository, 'findByPrimaryAccount').mockResolvedValue([]);
      vi.spyOn(secondaryAccountRepository, 'create').mockResolvedValue({
        ...mockSecondaryAccount,
        code: '01-001',
      });

      const result = await accountService.createSecondaryAccount(
        'primary-1',
        'Current Assets',
        'Current asset accounts'
      );

      expect(result.code).toMatch(/^\d+-\d+$/);
    });

    it('should update secondary account', async () => {
      vi.spyOn(secondaryAccountRepository, 'update').mockResolvedValue({
        ...mockSecondaryAccount,
        name: 'Updated Name',
      });

      const result = await accountService.updateSecondaryAccount('secondary-1', {
        name: 'Updated Name',
      });

      expect(result.name).toBe('Updated Name');
    });
  });
});
