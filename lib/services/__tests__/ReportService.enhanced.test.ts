/**
 * Report Service Tests - Enhanced Balance Sheet & Comparative Cash Flow
 * 
 * Tests for detailed Balance Sheet (all accounts) and Comparative Cash Flow
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ReportService } from '../ReportService';
import { AccountService } from '../AccountService';
import { TransactionService } from '../TransactionService';
import { setupAccountHierarchy } from './helpers/accountSetup';
import { primaryAccountRepository, secondaryAccountRepository, holderAccountRepository } from '../../repositories';

describe('ReportService - Enhanced Balance Sheet (All Accounts)', () => {
  let reportService: ReportService;
  let accountService: AccountService;

  beforeEach(async () => {
    localStorage.clear();
    reportService = ReportService.getInstance();
    accountService = AccountService.getInstance();
    await setupAccountHierarchy();
  });

  describe('generateBalanceSheet - Detailed Version', () => {
    it.skip('should include ALL asset accounts from database', async () => {
      // Create multiple asset accounts
      const assetPrimary = await primaryAccountRepository.create({
        name: 'Assets',
        code: '01',
        type: 'ASSETS',
        description: 'All assets',
        isActive: true,
      });

      const assetSecondary = await secondaryAccountRepository.create({
        name: 'Current Assets',
        code: '01-001',
        primaryAccountId: assetPrimary.id,
        description: 'Current assets',
        isActive: true,
      });

      // Create multiple holder accounts
      const cashAccount = await holderAccountRepository.create({
        secondaryAccountId: assetSecondary.id,
        code: '01-001-001',
        name: 'Cash in Hand',
        description: 'Cash',
        isActive: true,
      });

      const bankAccount = await holderAccountRepository.create({
        secondaryAccountId: assetSecondary.id,
        code: '01-001-002',
        name: 'Bank Account - ABC',
        description: 'Bank',
        isActive: true,
      });

      const arAccount = await holderAccountRepository.create({
        secondaryAccountId: assetSecondary.id,
        code: '01-001-003',
        name: 'Accounts Receivable - Customer A',
        description: 'AR',
        isActive: true,
      });

      // Create transactions to give accounts balances
      const transactionService = TransactionService.getInstance();
      await transactionService.createTransaction({
        date: new Date('2024-01-15'),
        description: 'Initial cash',
        debitAccountId: cashAccount.id,
        creditAccountId: arAccount.id,
        amount: 5000,
      });

      await transactionService.createTransaction({
        date: new Date('2024-01-15'),
        description: 'Bank deposit',
        debitAccountId: bankAccount.id,
        creditAccountId: arAccount.id,
        amount: 15000,
      });

      await transactionService.createTransaction({
        date: new Date('2024-01-15'),
        description: 'AR balance',
        debitAccountId: arAccount.id,
        creditAccountId: cashAccount.id,
        amount: 8000,
      });

      const asOfDate = new Date();
      const balanceSheet = await reportService.generateBalanceSheet(asOfDate);

      // Should have all 3 asset accounts - collect from all subsections
      const allAssetAccounts = balanceSheet.assets.subsections.flatMap(s => s.lineItems);

      expect(allAssetAccounts.length).toBeGreaterThanOrEqual(3);
      expect(allAssetAccounts.some(a => a.accountName.includes('Cash in Hand'))).toBe(true);
      expect(allAssetAccounts.some(a => a.accountName.includes('Bank Account'))).toBe(true);
      expect(allAssetAccounts.some(a => a.accountName.includes('Accounts Receivable'))).toBe(true);
    });

    it.skip('should include ALL liability accounts from database', async () => {
      const liabilityPrimary = await primaryAccountRepository.create({
        name: 'Liabilities',
        code: '20',
        type: 'LIABILITIES',
        description: 'All liabilities',
        isActive: true,
      });

      const liabilitySecondary = await secondaryAccountRepository.create({
        name: 'Current Liabilities',
        code: '20-001',
        primaryAccountId: liabilityPrimary.id,
        description: 'Current liabilities',
        isActive: true,
      });

      await holderAccountRepository.create({
        secondaryAccountId: liabilitySecondary.id,
        code: '20-001-001',
        name: 'Accounts Payable - Supplier X',
        description: 'AP',
        balance: -3000,
        isActive: true,
      });

      await holderAccountRepository.create({
        secondaryAccountId: liabilitySecondary.id,
        code: '20-001-002',
        name: 'Tax Payable - VAT',
        description: 'Tax',
        balance: -1500,
        isActive: true,
      });

      const asOfDate = new Date();
      const balanceSheet = await reportService.generateBalanceSheet(asOfDate);

      const allLiabilityAccounts = balanceSheet.liabilities.subsections.flatMap(s => s.lineItems);

      expect(allLiabilityAccounts.length).toBeGreaterThanOrEqual(2);
      expect(allLiabilityAccounts.some(l => l.accountName.includes('Accounts Payable'))).toBe(true);
      expect(allLiabilityAccounts.some(l => l.accountName.includes('Tax Payable'))).toBe(true);
    });

    it.skip('should include ALL equity accounts from database', async () => {
      const equityPrimary = await primaryAccountRepository.create({
        name: 'Equity',
        code: '30',
        type: 'EQUITY',
        description: 'Shareholders equity',
        isActive: true,
      });

      const equitySecondary = await secondaryAccountRepository.create({
        name: 'Capital',
        code: '30-001',
        primaryAccountId: equityPrimary.id,
        description: 'Capital accounts',
        isActive: true,
      });

      await holderAccountRepository.create({
        secondaryAccountId: equitySecondary.id,
        code: '30-001-001',
        name: 'Stated Capital',
        description: 'Share capital',
        balance: -50000,
        isActive: true,
      });

      await holderAccountRepository.create({
        secondaryAccountId: equitySecondary.id,
        code: '30-001-002',
        name: 'Retained Earnings',
        description: 'Accumulated profits',
        balance: -10000,
        isActive: true,
      });

      const asOfDate = new Date();
      const balanceSheet = await reportService.generateBalanceSheet(asOfDate);

      const allEquityAccounts = balanceSheet.equity.subsections.flatMap(s => s.lineItems);

      expect(allEquityAccounts.length).toBeGreaterThanOrEqual(2);
      expect(allEquityAccounts.some(e => e.accountName.includes('Stated Capital'))).toBe(true);
      expect(allEquityAccounts.some(e => e.accountName.includes('Retained Earnings'))).toBe(true);
    });

    it.skip('should categorize current vs non-current assets correctly', async () => {
      const assetPrimary = await primaryAccountRepository.create({
        name: 'Assets',
        code: '01',
        type: 'ASSETS',
        description: 'All assets',
        isActive: true,
      });

      const assetSecondary = await secondaryAccountRepository.create({
        name: 'Mixed Assets',
        code: '01-001',
        primaryAccountId: assetPrimary.id,
        description: 'Assets',
        isActive: true,
      });

      // Current asset (has "cash" keyword)
      await holderAccountRepository.create({
        secondaryAccountId: assetSecondary.id,
        code: '01-001-001',
        name: 'Cash Account',
        description: 'Current',
        balance: 5000,
        isActive: true,
      });

      // Non-current asset (has "equipment" keyword)
      await holderAccountRepository.create({
        secondaryAccountId: assetSecondary.id,
        code: '01-001-002',
        name: 'Equipment',
        description: 'Non-current',
        balance: 25000,
        isActive: true,
      });

      const asOfDate = new Date();
      const balanceSheet = await reportService.generateBalanceSheet(asOfDate);

      const currentAssetsSection = balanceSheet.assets.subsections.find(s => 
        s.title.toLowerCase().includes('current')
      );
      const nonCurrentAssetsSection = balanceSheet.assets.subsections.find(s => 
        s.title.toLowerCase().includes('non-current') || s.title.toLowerCase().includes('fixed')
      );

      expect(currentAssetsSection).toBeDefined();
      expect(nonCurrentAssetsSection).toBeDefined();
      
      const allAssets = balanceSheet.assets.subsections.flatMap(s => s.lineItems);
      expect(allAssets.some(a => a.accountName.includes('Cash'))).toBe(true);
      expect(allAssets.some(a => a.accountName.includes('Equipment'))).toBe(true);
    });

    it.skip('should exclude inactive accounts', async () => {
      const assetPrimary = await primaryAccountRepository.create({
        name: 'Assets',
        code: '01',
        type: 'ASSETS',
        description: 'All assets',
        isActive: true,
      });

      const assetSecondary = await secondaryAccountRepository.create({
        name: 'Current Assets',
        code: '01-001',
        primaryAccountId: assetPrimary.id,
        description: 'Current assets',
        isActive: true,
      });

      // Active account
      await holderAccountRepository.create({
        secondaryAccountId: assetSecondary.id,
        code: '01-001-001',
        name: 'Active Cash Account',
        description: 'Active',
        balance: 5000,
        isActive: true,
      });

      // Inactive account
      await holderAccountRepository.create({
        secondaryAccountId: assetSecondary.id,
        code: '01-001-002',
        name: 'Inactive Old Account',
        description: 'Inactive',
        balance: 3000,
        isActive: false,
      });

      const asOfDate = new Date();
      const balanceSheet = await reportService.generateBalanceSheet(asOfDate);

      const allAssetAccounts = balanceSheet.assets.subsections.flatMap(s => s.lineItems);

      expect(allAssetAccounts.some(a => a.accountName.includes('Active Cash'))).toBe(true);
      expect(allAssetAccounts.some(a => a.accountName.includes('Inactive Old'))).toBe(false);
    });
  });
});

describe('ReportService - Comparative Cash Flow Statement', () => {
  let reportService: ReportService;
  let transactionService: TransactionService;

  beforeEach(async () => {
    localStorage.clear();
    reportService = ReportService.getInstance();
    transactionService = TransactionService.getInstance();
    await setupAccountHierarchy();
  });

  describe('generateComparativeCashFlowStatement', () => {
    it('should generate comparative cash flow for multiple months', async () => {
      const startDate = new Date('2024-01-01');
      const numberOfPeriods = 3;
      const periodType = 'MONTHLY';

      const comparativeCashFlow = await reportService.generateComparativeCashFlowStatement(
        startDate,
        numberOfPeriods,
        periodType
      );

      expect(comparativeCashFlow).toBeDefined();
      expect(comparativeCashFlow.periods).toHaveLength(3);
      expect(comparativeCashFlow.netCashFlows).toHaveLength(3);
      expect(comparativeCashFlow.beginningCash).toHaveLength(3);
      expect(comparativeCashFlow.endingCash).toHaveLength(3);
    });

    it('should generate comparative cash flow for multiple years', async () => {
      const startDate = new Date('2022-01-01');
      const numberOfPeriods = 2;
      const periodType = 'YEARLY';

      const comparativeCashFlow = await reportService.generateComparativeCashFlowStatement(
        startDate,
        numberOfPeriods,
        periodType
      );

      expect(comparativeCashFlow).toBeDefined();
      expect(comparativeCashFlow.periods).toHaveLength(2);
      
      // Check that periods are yearly
      const period1 = comparativeCashFlow.periods[0];
      const period2 = comparativeCashFlow.periods[1];
      
      expect(period1.startDate.getFullYear()).toBe(2022);
      expect(period2.startDate.getFullYear()).toBe(2023);
    });

    it('should have three main sections with comparative data', async () => {
      const startDate = new Date('2024-01-01');
      const numberOfPeriods = 2;

      const comparativeCashFlow = await reportService.generateComparativeCashFlowStatement(
        startDate,
        numberOfPeriods,
        'MONTHLY'
      );

      // Operating Activities
      expect(comparativeCashFlow.operatingActivities).toBeDefined();
      expect(comparativeCashFlow.operatingActivities.title).toBe('Cash from Operating Activities');
      expect(comparativeCashFlow.operatingActivities.totals).toHaveLength(2);
      expect(Array.isArray(comparativeCashFlow.operatingActivities.lineItems)).toBe(true);

      // Investing Activities
      expect(comparativeCashFlow.investingActivities).toBeDefined();
      expect(comparativeCashFlow.investingActivities.title).toBe('Cash Flow from Investing Activities');
      expect(comparativeCashFlow.investingActivities.totals).toHaveLength(2);

      // Financing Activities
      expect(comparativeCashFlow.financingActivities).toBeDefined();
      expect(comparativeCashFlow.financingActivities.title).toBe('Cash Flow from Financing Activities');
      expect(comparativeCashFlow.financingActivities.totals).toHaveLength(2);
    });

    it('should have line items with amounts for each period', async () => {
      const startDate = new Date('2024-01-01');
      const numberOfPeriods = 3;

      const comparativeCashFlow = await reportService.generateComparativeCashFlowStatement(
        startDate,
        numberOfPeriods,
        'MONTHLY'
      );

      // Check that each line item has amounts for all periods
      comparativeCashFlow.operatingActivities.lineItems.forEach(item => {
        expect(item.description).toBeDefined();
        expect(item.amounts).toHaveLength(3);
        expect(Array.isArray(item.amounts)).toBe(true);
      });
    });

    it('should calculate net cash flows correctly for each period', async () => {
      const startDate = new Date('2024-01-01');
      const numberOfPeriods = 2;

      const comparativeCashFlow = await reportService.generateComparativeCashFlowStatement(
        startDate,
        numberOfPeriods,
        'MONTHLY'
      );

      // For each period, net cash flow should equal sum of three sections
      for (let i = 0; i < numberOfPeriods; i++) {
        const calculatedNetCashFlow =
          comparativeCashFlow.operatingActivities.totals[i] +
          comparativeCashFlow.investingActivities.totals[i] +
          comparativeCashFlow.financingActivities.totals[i];

        expect(Math.abs(comparativeCashFlow.netCashFlows[i] - calculatedNetCashFlow)).toBeLessThan(0.01);
      }
    });

    it('should reconcile cash for each period', async () => {
      const startDate = new Date('2024-01-01');
      const numberOfPeriods = 2;

      const comparativeCashFlow = await reportService.generateComparativeCashFlowStatement(
        startDate,
        numberOfPeriods,
        'MONTHLY'
      );

      // For each period, ending cash should equal beginning cash + net cash flow
      for (let i = 0; i < numberOfPeriods; i++) {
        const calculatedEndingCash = 
          comparativeCashFlow.beginningCash[i] + 
          comparativeCashFlow.netCashFlows[i];

        expect(Math.abs(comparativeCashFlow.endingCash[i] - calculatedEndingCash)).toBeLessThan(0.01);
      }
    });

    it('should handle 6 periods correctly', async () => {
      const startDate = new Date('2024-01-01');
      const numberOfPeriods = 6;

      const comparativeCashFlow = await reportService.generateComparativeCashFlowStatement(
        startDate,
        numberOfPeriods,
        'MONTHLY'
      );

      expect(comparativeCashFlow.periods).toHaveLength(6);
      expect(comparativeCashFlow.netCashFlows).toHaveLength(6);
      expect(comparativeCashFlow.operatingActivities.totals).toHaveLength(6);
      expect(comparativeCashFlow.investingActivities.totals).toHaveLength(6);
      expect(comparativeCashFlow.financingActivities.totals).toHaveLength(6);
    });

    it('should handle 12 periods correctly', async () => {
      const startDate = new Date('2024-01-01');
      const numberOfPeriods = 12;

      const comparativeCashFlow = await reportService.generateComparativeCashFlowStatement(
        startDate,
        numberOfPeriods,
        'MONTHLY'
      );

      expect(comparativeCashFlow.periods).toHaveLength(12);
      expect(comparativeCashFlow.netCashFlows).toHaveLength(12);
    });
  });
});
