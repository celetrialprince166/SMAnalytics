/**
 * Report Service Tests - Account Reports
 * 
 * Tests for Account Report and Comparative Account Report
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ReportService } from '../ReportService';
import { AccountService } from '../AccountService';
import { TransactionService } from '../TransactionService';
import { setupAccountHierarchy } from './helpers/accountSetup';

describe('ReportService - Account Reports', () => {
  let reportService: ReportService;
  let accountService: AccountService;
  let transactionService: TransactionService;
  let testAccounts: Awaited<ReturnType<typeof setupAccountHierarchy>>;

  beforeEach(async () => {
    // Clear localStorage
    localStorage.clear();

    reportService = ReportService.getInstance();
    accountService = AccountService.getInstance();
    transactionService = TransactionService.getInstance();

    // Setup test accounts
    testAccounts = await setupAccountHierarchy();

    // Create sample transactions for comparative reports
    // Q1 2024 transactions
    await transactionService.createTransaction({
      date: new Date('2024-02-15'),
      description: 'Consulting Q1',
      debitAccountId: testAccounts.holder.customers.id,
      creditAccountId: testAccounts.holder.consulting.id,
      amount: 35500,
      reference: 'INV-Q1-001',
    });

    await transactionService.createTransaction({
      date: new Date('2024-03-10'),
      description: 'Solutions Q1',
      debitAccountId: testAccounts.holder.customers.id,
      creditAccountId: testAccounts.holder.solutions.id,
      amount: 68425,
      reference: 'INV-Q1-002',
    });

    await transactionService.createTransaction({
      date: new Date('2024-03-20'),
      description: 'Training Q1',
      debitAccountId: testAccounts.holder.customers.id,
      creditAccountId: testAccounts.holder.training.id,
      amount: 16500,
      reference: 'INV-Q1-003',
    });

    // Q2 2024 transactions
    await transactionService.createTransaction({
      date: new Date('2024-05-15'),
      description: 'Consulting Q2',
      debitAccountId: testAccounts.holder.customers.id,
      creditAccountId: testAccounts.holder.consulting.id,
      amount: 42000,
      reference: 'INV-Q2-001',
    });

    await transactionService.createTransaction({
      date: new Date('2024-06-10'),
      description: 'Solutions Q2',
      debitAccountId: testAccounts.holder.customers.id,
      creditAccountId: testAccounts.holder.solutions.id,
      amount: 75000,
      reference: 'INV-Q2-002',
    });

    await transactionService.createTransaction({
      date: new Date('2024-06-20'),
      description: 'Training Q2',
      debitAccountId: testAccounts.holder.customers.id,
      creditAccountId: testAccounts.holder.training.id,
      amount: 18000,
      reference: 'INV-Q2-003',
    });
  });

  describe('generateAccountReport', () => {
    it('should generate an account report with transactions', async () => {
      const testAccount = testAccounts.holder.consulting;

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const report = await reportService.generateAccountReport(
        testAccount.id,
        startDate,
        endDate
      );

      expect(report).toBeDefined();
      expect(report.accountId).toBe(testAccount.id);
      expect(report.accountName).toBe(testAccount.name);
      expect(report.accountCode).toBe(testAccount.code);
      expect(report.period.startDate).toEqual(startDate);
      expect(report.period.endDate).toEqual(endDate);
      expect(Array.isArray(report.transactions)).toBe(true);
      expect(report.transactions.length).toBeGreaterThan(0);
      expect(typeof report.openingBalance).toBe('number');
      expect(typeof report.closingBalance).toBe('number');
      expect(typeof report.totalDebits).toBe('number');
      expect(typeof report.totalCredits).toBe('number');
      expect(report.generatedAt).toBeInstanceOf(Date);
    });

    it('should calculate opening and closing balances correctly', async () => {
      const testAccount = testAccounts.holder.consulting;

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const report = await reportService.generateAccountReport(
        testAccount.id,
        startDate,
        endDate
      );

      // Closing balance should equal opening balance + total debits - total credits
      const calculatedClosing = report.openingBalance + report.totalDebits - report.totalCredits;
      expect(Math.abs(report.closingBalance - calculatedClosing)).toBeLessThan(0.01);
    });

    it('should throw error for non-existent account', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      await expect(
        reportService.generateAccountReport('non-existent-id', startDate, endDate)
      ).rejects.toThrow('Failed to generate account report');
    });
  });

  describe('generateComparativeAccountReport', () => {
    it('should generate a comparative account report with multiple periods', async () => {
      const secondaryAccount = testAccounts.secondary.sales;

      const startDate = new Date('2024-01-01');
      const numberOfPeriods = 4; // 4 quarters
      const periodType = 'QUARTERLY';

      const report = await reportService.generateComparativeAccountReport(
        secondaryAccount.id,
        startDate,
        numberOfPeriods,
        periodType
      );

      expect(report).toBeDefined();
      expect(report.accountId).toBe(secondaryAccount.id);
      expect(report.accountName).toBe(secondaryAccount.name);
      expect(report.accountCode).toBe(secondaryAccount.code);
      expect(report.periodType).toBe(periodType);
      expect(report.periods).toHaveLength(numberOfPeriods);
      expect(Array.isArray(report.subAccounts)).toBe(true);
      expect(report.subAccounts.length).toBeGreaterThan(0);
      expect(Array.isArray(report.totals)).toBe(true);
      expect(report.totals).toHaveLength(numberOfPeriods);
      expect(report.generatedAt).toBeInstanceOf(Date);
    });

    it('should have correct period structure', async () => {
      const secondaryAccount = testAccounts.secondary.sales;

      const startDate = new Date('2024-01-01');
      const numberOfPeriods = 2;
      const periodType = 'QUARTERLY';

      const report = await reportService.generateComparativeAccountReport(
        secondaryAccount.id,
        startDate,
        numberOfPeriods,
        periodType
      );

      report.periods.forEach((period) => {
        expect(period).toHaveProperty('startDate');
        expect(period).toHaveProperty('endDate');
        expect(period.startDate).toBeInstanceOf(Date);
        expect(period.endDate).toBeInstanceOf(Date);
        expect(period.endDate.getTime()).toBeGreaterThan(period.startDate.getTime());
      });
    });

    it('should have sub-accounts with amounts for each period', async () => {
      const secondaryAccount = testAccounts.secondary.sales;

      const startDate = new Date('2024-01-01');
      const numberOfPeriods = 2;
      const periodType = 'QUARTERLY';

      const report = await reportService.generateComparativeAccountReport(
        secondaryAccount.id,
        startDate,
        numberOfPeriods,
        periodType
      );

      expect(report.subAccounts.length).toBeGreaterThan(0);
      
      report.subAccounts.forEach((subAccount) => {
        expect(subAccount).toHaveProperty('accountId');
        expect(subAccount).toHaveProperty('accountName');
        expect(subAccount).toHaveProperty('amounts');
        expect(Array.isArray(subAccount.amounts)).toBe(true);
        expect(subAccount.amounts).toHaveLength(numberOfPeriods);
        subAccount.amounts.forEach((amount) => {
          expect(typeof amount).toBe('number');
          expect(amount).toBeGreaterThanOrEqual(0);
        });
      });
    });

    it('should calculate totals correctly for each period', async () => {
      const secondaryAccount = testAccounts.secondary.sales;

      const startDate = new Date('2024-01-01');
      const numberOfPeriods = 2;
      const periodType = 'QUARTERLY';

      const report = await reportService.generateComparativeAccountReport(
        secondaryAccount.id,
        startDate,
        numberOfPeriods,
        periodType
      );

      report.totals.forEach((total, periodIndex) => {
        const calculatedTotal = report.subAccounts.reduce(
          (sum, subAccount) => sum + subAccount.amounts[periodIndex],
          0
        );
        expect(Math.abs(total - calculatedTotal)).toBeLessThan(0.01);
      });
    });

    it('should support different period types', async () => {
      const secondaryAccount = testAccounts.secondary.sales;

      const startDate = new Date('2024-01-01');
      const numberOfPeriods = 2;

      const periodTypes: Array<'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUALLY' | 'ANNUALLY'> = [
        'MONTHLY',
        'QUARTERLY',
        'SEMI_ANNUALLY',
        'ANNUALLY',
      ];

      for (const periodType of periodTypes) {
        const report = await reportService.generateComparativeAccountReport(
          secondaryAccount.id,
          startDate,
          numberOfPeriods,
          periodType
        );

        expect(report.periodType).toBe(periodType);
        expect(report.periods).toHaveLength(numberOfPeriods);
      }
    });

    it('should only include sub-accounts with activity', async () => {
      const secondaryAccount = testAccounts.secondary.sales;

      const startDate = new Date('2024-01-01');
      const numberOfPeriods = 2;
      const periodType = 'QUARTERLY';

      const report = await reportService.generateComparativeAccountReport(
        secondaryAccount.id,
        startDate,
        numberOfPeriods,
        periodType
      );

      // Each sub-account should have at least one non-zero amount
      expect(report.subAccounts.length).toBeGreaterThan(0);
      report.subAccounts.forEach((subAccount) => {
        const hasActivity = subAccount.amounts.some((amount) => amount > 0);
        expect(hasActivity).toBe(true);
      });
    });

    it('should throw error for non-existent parent account', async () => {
      const startDate = new Date('2024-01-01');
      const numberOfPeriods = 2;
      const periodType = 'QUARTERLY';

      await expect(
        reportService.generateComparativeAccountReport(
          'non-existent-id',
          startDate,
          numberOfPeriods,
          periodType
        )
      ).rejects.toThrow('Failed to generate comparative account report');
    });

    it('should handle quarterly periods correctly', async () => {
      const secondaryAccount = testAccounts.secondary.sales;

      const startDate = new Date('2024-01-01');
      const numberOfPeriods = 4;
      const periodType = 'QUARTERLY';

      const report = await reportService.generateComparativeAccountReport(
        secondaryAccount.id,
        startDate,
        numberOfPeriods,
        periodType
      );

      // Check that periods are approximately 3 months apart
      for (let i = 0; i < report.periods.length - 1; i++) {
        const period1End = report.periods[i].endDate;
        const period2Start = report.periods[i + 1].startDate;
        
        // Periods should be consecutive
        const daysDiff = Math.abs(
          (period2Start.getTime() - period1End.getTime()) / (1000 * 60 * 60 * 24)
        );
        expect(daysDiff).toBeLessThan(2); // Should be 1 day apart or same day
      }
    });
  });
});
