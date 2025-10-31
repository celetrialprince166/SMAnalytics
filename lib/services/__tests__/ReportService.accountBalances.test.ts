/**
 * Report Service Tests - Account Balances Reports
 * 
 * Tests for Statement of Accounts and Ageing Analysis
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ReportService } from '../ReportService';
import { AccountService } from '../AccountService';
import { TransactionService } from '../TransactionService';
import { SalesService } from '../SalesService';
import { setupAccountHierarchy } from './helpers/accountSetup';

describe('ReportService - Account Balances Reports', () => {
  let reportService: ReportService;
  let accountService: AccountService;
  let transactionService: TransactionService;
  let salesService: SalesService;
  let testAccounts: Awaited<ReturnType<typeof setupAccountHierarchy>>;

  beforeEach(async () => {
    // Clear localStorage
    localStorage.clear();

    reportService = ReportService.getInstance();
    accountService = AccountService.getInstance();
    transactionService = TransactionService.getInstance();
    salesService = SalesService.getInstance();

    // Setup test accounts
    testAccounts = await setupAccountHierarchy();

    // Create sample transactions for statement of accounts
    await transactionService.createTransaction({
      date: new Date('2024-01-15'),
      description: 'Opening balance',
      debitAccountId: testAccounts.holder.customers.id,
      creditAccountId: testAccounts.holder.consulting.id,
      amount: 10000,
      reference: 'OB-001',
    });

    await transactionService.createTransaction({
      date: new Date('2024-02-15'),
      description: 'Payment received',
      debitAccountId: testAccounts.holder.customers.id,
      creditAccountId: testAccounts.holder.consulting.id,
      amount: 5000,
      reference: 'PMT-001',
    });

    await transactionService.createTransaction({
      date: new Date('2024-03-15'),
      description: 'Invoice issued',
      debitAccountId: testAccounts.holder.customers.id,
      creditAccountId: testAccounts.holder.consulting.id,
      amount: 8000,
      reference: 'INV-001',
    });

    // Create sample sales entries for ageing analysis
    // Get a product first
    const productService = (await import('../ProductService')).ProductService.getInstance();
    const product = await productService.createProduct({
      name: 'Test Product',
      unitPrice: 100,
      costPrice: 50,
    });

    // Create sales entries with different dates for ageing
    await salesService.createSalesEntry({
      date: new Date('2024-11-01'), // 60 days old from Dec 31
      productId: product.id,
      description: 'Sale 1 - 60 days old',
      salesValue: 20000,
      costValue: 10000,
      customerAccountId: testAccounts.holder.customers.id,
      invoiceNumber: 'INV-2024-001',
      applyVat: true,
      vatRate: 15,
    });

    await salesService.createSalesEntry({
      date: new Date('2024-12-01'), // 30 days old from Dec 31
      productId: product.id,
      description: 'Sale 2 - 30 days old',
      salesValue: 30000,
      costValue: 15000,
      customerAccountId: testAccounts.holder.customers.id,
      invoiceNumber: 'INV-2024-002',
      applyVat: true,
      vatRate: 15,
    });

    await salesService.createSalesEntry({
      date: new Date('2024-10-01'), // 91 days old from Dec 31
      productId: product.id,
      description: 'Sale 3 - over 90 days',
      salesValue: 15000,
      costValue: 7500,
      customerAccountId: testAccounts.holder.customers.id,
      invoiceNumber: 'INV-2024-003',
      applyVat: true,
      vatRate: 15,
    });
  });

  describe('generateStatementOfAccounts', () => {
    it('should generate a statement of accounts with transactions', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const statement = await reportService.generateStatementOfAccounts(
        testAccounts.holder.customers.id,
        startDate,
        endDate
      );

      expect(statement).toBeDefined();
      expect(statement.accountId).toBe(testAccounts.holder.customers.id);
      expect(statement.accountName).toBe(testAccounts.holder.customers.name);
      expect(statement.period.startDate).toEqual(startDate);
      expect(statement.period.endDate).toEqual(endDate);
      expect(Array.isArray(statement.transactions)).toBe(true);
      expect(statement.transactions.length).toBeGreaterThan(0);
      expect(typeof statement.openingBalance).toBe('number');
      expect(typeof statement.closingBalance).toBe('number');
      expect(statement.generatedAt).toBeInstanceOf(Date);
    });

    it('should have correct transaction structure', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const statement = await reportService.generateStatementOfAccounts(
        testAccounts.holder.customers.id,
        startDate,
        endDate
      );

      statement.transactions.forEach((transaction) => {
        expect(transaction).toHaveProperty('date');
        expect(transaction).toHaveProperty('reference');
        expect(transaction).toHaveProperty('description');
        expect(transaction).toHaveProperty('debit');
        expect(transaction).toHaveProperty('credit');
        expect(transaction).toHaveProperty('balance');
        expect(transaction.date).toBeInstanceOf(Date);
        expect(typeof transaction.debit).toBe('number');
        expect(typeof transaction.credit).toBe('number');
        expect(typeof transaction.balance).toBe('number');
      });
    });

    it('should calculate running balance correctly', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const statement = await reportService.generateStatementOfAccounts(
        testAccounts.holder.customers.id,
        startDate,
        endDate
      );

      let expectedBalance = statement.openingBalance;
      statement.transactions.forEach((transaction) => {
        expectedBalance += transaction.debit - transaction.credit;
        expect(Math.abs(transaction.balance - expectedBalance)).toBeLessThan(0.01);
      });

      expect(Math.abs(statement.closingBalance - expectedBalance)).toBeLessThan(0.01);
    });

    it('should throw error for non-existent account', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      await expect(
        reportService.generateStatementOfAccounts('non-existent-id', startDate, endDate)
      ).rejects.toThrow('Failed to generate statement of accounts');
    });

    it('should handle empty transaction period', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-12-31');

      const statement = await reportService.generateStatementOfAccounts(
        testAccounts.holder.customers.id,
        startDate,
        endDate
      );

      expect(statement.transactions).toHaveLength(0);
      expect(statement.closingBalance).toBe(statement.openingBalance);
    });
  });

  describe('generateAgeingAnalysis', () => {
    it('should generate an ageing analysis report', async () => {
      const asOfDate = new Date('2024-12-31');

      const ageing = await reportService.generateAgeingAnalysis(asOfDate, 'RECEIVABLES');

      expect(ageing).toBeDefined();
      expect(ageing.asOfDate).toEqual(asOfDate);
      expect(ageing.accountType).toBe('RECEIVABLES');
      expect(Array.isArray(ageing.items)).toBe(true);
      expect(ageing.summary).toBeDefined();
      expect(ageing.generatedAt).toBeInstanceOf(Date);
    });

    it('should have correct summary structure', async () => {
      const asOfDate = new Date('2024-12-31');

      const ageing = await reportService.generateAgeingAnalysis(asOfDate, 'RECEIVABLES');

      expect(ageing.summary).toHaveProperty('totalInvoiceAmount');
      expect(ageing.summary).toHaveProperty('totalPaid');
      expect(ageing.summary).toHaveProperty('totalOutstanding');
      expect(ageing.summary).toHaveProperty('current');
      expect(ageing.summary).toHaveProperty('days31to45');
      expect(ageing.summary).toHaveProperty('days46to60');
      expect(ageing.summary).toHaveProperty('days61to75');
      expect(ageing.summary).toHaveProperty('days76to90');
      expect(ageing.summary).toHaveProperty('over90days');
    });

    it('should have correct item structure', async () => {
      const asOfDate = new Date('2024-12-31');

      const ageing = await reportService.generateAgeingAnalysis(asOfDate, 'RECEIVABLES');

      ageing.items.forEach((item) => {
        expect(item).toHaveProperty('salesCode');
        expect(item).toHaveProperty('invoiceNumber');
        expect(item).toHaveProperty('clientName');
        expect(item).toHaveProperty('date');
        expect(item).toHaveProperty('invoiceAmount');
        expect(item).toHaveProperty('totalPaid');
        expect(item).toHaveProperty('amountOutstanding');
        expect(item).toHaveProperty('current');
        expect(item).toHaveProperty('days31to45');
        expect(item).toHaveProperty('days46to60');
        expect(item).toHaveProperty('days61to75');
        expect(item).toHaveProperty('days76to90');
        expect(item).toHaveProperty('over90days');
        expect(item.date).toBeInstanceOf(Date);
      });
    });

    it('should calculate age brackets correctly', async () => {
      const asOfDate = new Date('2024-12-31');

      const ageing = await reportService.generateAgeingAnalysis(asOfDate, 'RECEIVABLES');

      ageing.items.forEach((item) => {
        // Each item should have amount in only one age bracket
        const brackets = [
          item.current,
          item.days31to45,
          item.days46to60,
          item.days61to75,
          item.days76to90,
          item.over90days,
        ];
        const nonZeroBrackets = brackets.filter((b) => b > 0);
        expect(nonZeroBrackets.length).toBeLessThanOrEqual(1);

        // Sum of brackets should equal outstanding amount
        const bracketSum = brackets.reduce((sum, b) => sum + b, 0);
        expect(Math.abs(bracketSum - item.amountOutstanding)).toBeLessThan(0.01);
      });
    });

    it('should calculate summary totals correctly', async () => {
      const asOfDate = new Date('2024-12-31');

      const ageing = await reportService.generateAgeingAnalysis(asOfDate, 'RECEIVABLES');

      const calculatedTotals = {
        totalInvoiceAmount: 0,
        totalPaid: 0,
        totalOutstanding: 0,
        current: 0,
        days31to45: 0,
        days46to60: 0,
        days61to75: 0,
        days76to90: 0,
        over90days: 0,
      };

      ageing.items.forEach((item) => {
        calculatedTotals.totalInvoiceAmount += item.invoiceAmount;
        calculatedTotals.totalPaid += item.totalPaid;
        calculatedTotals.totalOutstanding += item.amountOutstanding;
        calculatedTotals.current += item.current;
        calculatedTotals.days31to45 += item.days31to45;
        calculatedTotals.days46to60 += item.days46to60;
        calculatedTotals.days61to75 += item.days61to75;
        calculatedTotals.days76to90 += item.days76to90;
        calculatedTotals.over90days += item.over90days;
      });

      expect(Math.abs(ageing.summary.totalInvoiceAmount - calculatedTotals.totalInvoiceAmount)).toBeLessThan(0.01);
      expect(Math.abs(ageing.summary.totalPaid - calculatedTotals.totalPaid)).toBeLessThan(0.01);
      expect(Math.abs(ageing.summary.totalOutstanding - calculatedTotals.totalOutstanding)).toBeLessThan(0.01);
      expect(Math.abs(ageing.summary.current - calculatedTotals.current)).toBeLessThan(0.01);
      expect(Math.abs(ageing.summary.days31to45 - calculatedTotals.days31to45)).toBeLessThan(0.01);
      expect(Math.abs(ageing.summary.days46to60 - calculatedTotals.days46to60)).toBeLessThan(0.01);
      expect(Math.abs(ageing.summary.days61to75 - calculatedTotals.days61to75)).toBeLessThan(0.01);
      expect(Math.abs(ageing.summary.days76to90 - calculatedTotals.days76to90)).toBeLessThan(0.01);
      expect(Math.abs(ageing.summary.over90days - calculatedTotals.over90days)).toBeLessThan(0.01);
    });

    it('should sort items by date (oldest first)', async () => {
      const asOfDate = new Date('2024-12-31');

      const ageing = await reportService.generateAgeingAnalysis(asOfDate, 'RECEIVABLES');

      for (let i = 1; i < ageing.items.length; i++) {
        expect(ageing.items[i].date.getTime()).toBeGreaterThanOrEqual(
          ageing.items[i - 1].date.getTime()
        );
      }
    });
  });
});
