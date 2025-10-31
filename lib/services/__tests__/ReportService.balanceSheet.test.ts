/**
 * Report Service Tests - Balance Sheet & Cash Flow Statement
 * 
 * Tests for Phase 3: Operational Reports
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ReportService } from '../ReportService';
import { AccountService } from '../AccountService';
import { TransactionService } from '../TransactionService';
import { setupAccountHierarchy } from './helpers/accountSetup';

describe('ReportService - Balance Sheet', () => {
  let reportService: ReportService;
  let accountService: AccountService;
  let transactionService: TransactionService;

  beforeEach(async () => {
    // Clear localStorage
    localStorage.clear();

    reportService = ReportService.getInstance();
    accountService = AccountService.getInstance();
    transactionService = TransactionService.getInstance();

    // Setup test accounts
    await setupAccountHierarchy();
  });

  describe('generateBalanceSheet', () => {
    it('should generate a balance sheet with assets, liabilities, and equity', async () => {
      const asOfDate = new Date('2024-12-31');
      
      const balanceSheet = await reportService.generateBalanceSheet(asOfDate);

      expect(balanceSheet).toBeDefined();
      expect(balanceSheet.asOfDate).toEqual(asOfDate);
      expect(balanceSheet.assets).toBeDefined();
      expect(balanceSheet.liabilities).toBeDefined();
      expect(balanceSheet.equity).toBeDefined();
      expect(balanceSheet.generatedAt).toBeInstanceOf(Date);
    });

    it('should have current and non-current assets', async () => {
      const asOfDate = new Date('2024-12-31');
      
      const balanceSheet = await reportService.generateBalanceSheet(asOfDate);

      expect(balanceSheet.assets.subsections).toHaveLength(2);
      expect(balanceSheet.assets.subsections[0].title).toBe('Current Assets');
      expect(balanceSheet.assets.subsections[1].title).toBe('Non-current Assets');
    });

    it('should have current and non-current liabilities', async () => {
      const asOfDate = new Date('2024-12-31');
      
      const balanceSheet = await reportService.generateBalanceSheet(asOfDate);

      expect(balanceSheet.liabilities.subsections).toHaveLength(2);
      expect(balanceSheet.liabilities.subsections[0].title).toBe('Current Liabilities');
      expect(balanceSheet.liabilities.subsections[1].title).toBe('Non-current Liabilities');
    });

    it('should calculate total assets correctly', async () => {
      const asOfDate = new Date('2024-12-31');
      
      const balanceSheet = await reportService.generateBalanceSheet(asOfDate);

      const calculatedTotal = balanceSheet.assets.subsections.reduce(
        (sum, subsection) => sum + subsection.subtotal,
        0
      );

      expect(balanceSheet.totalAssets).toBe(calculatedTotal);
      expect(balanceSheet.assets.total).toBe(calculatedTotal);
    });

    it('should calculate total liabilities correctly', async () => {
      const asOfDate = new Date('2024-12-31');
      
      const balanceSheet = await reportService.generateBalanceSheet(asOfDate);

      const calculatedTotal = balanceSheet.liabilities.subsections.reduce(
        (sum, subsection) => sum + subsection.subtotal,
        0
      );

      expect(balanceSheet.totalLiabilities).toBe(calculatedTotal);
      expect(balanceSheet.liabilities.total).toBe(calculatedTotal);
    });

    it('should balance: Assets = Liabilities + Equity', async () => {
      const asOfDate = new Date('2024-12-31');
      
      const balanceSheet = await reportService.generateBalanceSheet(asOfDate);

      const liabilitiesAndEquity = balanceSheet.totalLiabilities + balanceSheet.totalEquity;
      
      // Allow for small rounding errors
      expect(Math.abs(balanceSheet.totalAssets - liabilitiesAndEquity)).toBeLessThan(0.01);
    });

    it('should have categories in current assets subsection', async () => {
      const asOfDate = new Date('2024-12-31');
      
      const balanceSheet = await reportService.generateBalanceSheet(asOfDate);

      const currentAssets = balanceSheet.assets.subsections.find(s => s.title === 'Current Assets');
      expect(currentAssets).toBeDefined();
      expect(currentAssets?.categories).toBeDefined();
      expect(Array.isArray(currentAssets?.categories)).toBe(true);
    });

    it('should have categories in non-current assets subsection', async () => {
      const asOfDate = new Date('2024-12-31');
      
      const balanceSheet = await reportService.generateBalanceSheet(asOfDate);

      const nonCurrentAssets = balanceSheet.assets.subsections.find(s => s.title === 'Non-current Assets');
      expect(nonCurrentAssets).toBeDefined();
      expect(nonCurrentAssets?.categories).toBeDefined();
      expect(Array.isArray(nonCurrentAssets?.categories)).toBe(true);
    });

    it('should have categories in current liabilities subsection', async () => {
      const asOfDate = new Date('2024-12-31');
      
      const balanceSheet = await reportService.generateBalanceSheet(asOfDate);

      const currentLiabilities = balanceSheet.liabilities.subsections.find(s => s.title === 'Current Liabilities');
      expect(currentLiabilities).toBeDefined();
      expect(currentLiabilities?.categories).toBeDefined();
      expect(Array.isArray(currentLiabilities?.categories)).toBe(true);
    });

    it('should have categories in non-current liabilities subsection', async () => {
      const asOfDate = new Date('2024-12-31');
      
      const balanceSheet = await reportService.generateBalanceSheet(asOfDate);

      const nonCurrentLiabilities = balanceSheet.liabilities.subsections.find(s => s.title === 'Non-current Liabilities');
      expect(nonCurrentLiabilities).toBeDefined();
      expect(nonCurrentLiabilities?.categories).toBeDefined();
      expect(Array.isArray(nonCurrentLiabilities?.categories)).toBe(true);
    });

    it('should have categories in equity subsection', async () => {
      const asOfDate = new Date('2024-12-31');
      
      const balanceSheet = await reportService.generateBalanceSheet(asOfDate);

      const equity = balanceSheet.equity.subsections[0];
      expect(equity).toBeDefined();
      expect(equity.categories).toBeDefined();
      expect(Array.isArray(equity.categories)).toBe(true);
    });

    it('should have proper category structure with title, lineItems, and subtotal', async () => {
      const asOfDate = new Date('2024-12-31');
      
      const balanceSheet = await reportService.generateBalanceSheet(asOfDate);

      const currentAssets = balanceSheet.assets.subsections.find(s => s.title === 'Current Assets');
      
      if (currentAssets?.categories && currentAssets.categories.length > 0) {
        const firstCategory = currentAssets.categories[0];
        expect(firstCategory).toHaveProperty('title');
        expect(firstCategory).toHaveProperty('lineItems');
        expect(firstCategory).toHaveProperty('subtotal');
        expect(Array.isArray(firstCategory.lineItems)).toBe(true);
        expect(typeof firstCategory.subtotal).toBe('number');
      }
    });

    it('should calculate category subtotals correctly', async () => {
      const asOfDate = new Date('2024-12-31');
      
      const balanceSheet = await reportService.generateBalanceSheet(asOfDate);

      const currentAssets = balanceSheet.assets.subsections.find(s => s.title === 'Current Assets');
      
      if (currentAssets?.categories) {
        currentAssets.categories.forEach(category => {
          const calculatedSubtotal = category.lineItems.reduce((sum, item) => sum + item.amount, 0);
          expect(Math.abs(category.subtotal - calculatedSubtotal)).toBeLessThan(0.01);
        });
      }
    });

    it('should have subsection subtotal equal to sum of category subtotals', async () => {
      const asOfDate = new Date('2024-12-31');
      
      const balanceSheet = await reportService.generateBalanceSheet(asOfDate);

      const currentAssets = balanceSheet.assets.subsections.find(s => s.title === 'Current Assets');
      
      if (currentAssets?.categories) {
        const sumOfCategories = currentAssets.categories.reduce((sum, cat) => sum + cat.subtotal, 0);
        expect(Math.abs(currentAssets.subtotal - sumOfCategories)).toBeLessThan(0.01);
      }
    });

    it('should only show categories with line items', async () => {
      const asOfDate = new Date('2024-12-31');
      
      const balanceSheet = await reportService.generateBalanceSheet(asOfDate);

      // Check all subsections
      const allSubsections = [
        ...balanceSheet.assets.subsections,
        ...balanceSheet.liabilities.subsections,
        ...balanceSheet.equity.subsections,
      ];

      allSubsections.forEach(subsection => {
        if (subsection.categories) {
          subsection.categories.forEach(category => {
            expect(category.lineItems.length).toBeGreaterThan(0);
          });
        }
      });
    });
  });
});

describe('ReportService - Cash Flow Statement', () => {
  let reportService: ReportService;
  let accountService: AccountService;
  let transactionService: TransactionService;

  beforeEach(async () => {
    // Clear localStorage
    localStorage.clear();

    reportService = ReportService.getInstance();
    accountService = AccountService.getInstance();
    transactionService = TransactionService.getInstance();

    // Setup test accounts
    await setupAccountHierarchy();
  });

  describe('generateCashFlowStatement', () => {
    it('should generate a cash flow statement with three sections', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      
      const cashFlow = await reportService.generateCashFlowStatement(startDate, endDate);

      expect(cashFlow).toBeDefined();
      expect(cashFlow.period.startDate).toEqual(startDate);
      expect(cashFlow.period.endDate).toEqual(endDate);
      expect(cashFlow.operatingActivities).toBeDefined();
      expect(cashFlow.investingActivities).toBeDefined();
      expect(cashFlow.financingActivities).toBeDefined();
      expect(cashFlow.generatedAt).toBeInstanceOf(Date);
    });

    it('should have operating activities section', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      
      const cashFlow = await reportService.generateCashFlowStatement(startDate, endDate);

      expect(cashFlow.operatingActivities.title).toBe('Cash from Operating Activities');
      expect(cashFlow.operatingActivities.lineItems).toBeDefined();
      expect(Array.isArray(cashFlow.operatingActivities.lineItems)).toBe(true);
      expect(cashFlow.operatingActivities.total).toBeDefined();
    });

    it('should have investing activities section', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      
      const cashFlow = await reportService.generateCashFlowStatement(startDate, endDate);

      expect(cashFlow.investingActivities.title).toBe('Cash Flow from Investing Activities');
      expect(cashFlow.investingActivities.lineItems).toBeDefined();
      expect(Array.isArray(cashFlow.investingActivities.lineItems)).toBe(true);
      expect(cashFlow.investingActivities.total).toBeDefined();
    });

    it('should have financing activities section', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      
      const cashFlow = await reportService.generateCashFlowStatement(startDate, endDate);

      expect(cashFlow.financingActivities.title).toBe('Cash Flow from Financing Activities');
      expect(cashFlow.financingActivities.lineItems).toBeDefined();
      expect(Array.isArray(cashFlow.financingActivities.lineItems)).toBe(true);
      expect(cashFlow.financingActivities.total).toBeDefined();
    });

    it('should calculate net cash flow correctly', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      
      const cashFlow = await reportService.generateCashFlowStatement(startDate, endDate);

      const calculatedNetCashFlow =
        cashFlow.operatingActivities.total +
        cashFlow.investingActivities.total +
        cashFlow.financingActivities.total;

      expect(cashFlow.netCashFlow).toBe(calculatedNetCashFlow);
    });

    it('should reconcile beginning and ending cash', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      
      const cashFlow = await reportService.generateCashFlowStatement(startDate, endDate);

      const calculatedEndingCash = cashFlow.beginningCash + cashFlow.netCashFlow;

      expect(Math.abs(cashFlow.endingCash - calculatedEndingCash)).toBeLessThan(0.01);
    });

    it('should include EBIT in operating activities', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      
      const cashFlow = await reportService.generateCashFlowStatement(startDate, endDate);

      const ebitItem = cashFlow.operatingActivities.lineItems.find(
        item => item.description === 'EBIT'
      );

      expect(ebitItem).toBeDefined();
    });

    it('should include depreciation adjustment in operating activities', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      
      const cashFlow = await reportService.generateCashFlowStatement(startDate, endDate);

      const depreciationItem = cashFlow.operatingActivities.lineItems.find(
        item => item.description === 'Adjustment for Depreciation & Amortization'
      );

      expect(depreciationItem).toBeDefined();
    });
  });
});
