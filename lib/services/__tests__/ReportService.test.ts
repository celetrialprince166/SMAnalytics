import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { PrimaryAccount, SecondaryAccount, HolderAccount, Transaction } from '@/types';

// Create mock functions
const mockGetAccountHierarchy = vi.fn();
const mockGetAccountBalance = vi.fn();
const mockGetHolderAccountById = vi.fn();
const mockGetTransactionsByDateRange = vi.fn();

// Mock the services
vi.mock('../AccountService', () => ({
  AccountService: {
    getInstance: () => ({
      getAccountHierarchy: mockGetAccountHierarchy,
      getAccountBalance: mockGetAccountBalance,
      getHolderAccountById: mockGetHolderAccountById,
    }),
  },
}));

vi.mock('../TransactionService', () => ({
  TransactionService: {
    getInstance: () => ({
      getTransactionsByDateRange: mockGetTransactionsByDateRange,
    }),
  },
}));

// Import after mocks are set up
const { reportService } = await import('../ReportService');

describe('ReportService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateTrialBalance', () => {
    const mockPrimaryAccounts: PrimaryAccount[] = [
      {
        id: 'primary-1',
        name: 'Assets',
        type: 'ASSETS',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'primary-2',
        name: 'Liabilities',
        type: 'LIABILITIES',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockSecondaryAccounts: SecondaryAccount[] = [
      {
        id: 'secondary-1',
        name: 'Current Assets',
        code: '1100',
        primaryAccountId: 'primary-1',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'secondary-2',
        name: 'Current Liabilities',
        code: '2100',
        primaryAccountId: 'primary-2',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockHolderAccounts: HolderAccount[] = [
      {
        id: 'holder-1',
        name: 'Cash at Bank',
        code: '1101',
        secondaryAccountId: 'secondary-1',
        balance: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'holder-2',
        name: 'Accounts Payable',
        code: '2101',
        secondaryAccountId: 'secondary-2',
        balance: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    beforeEach(() => {
      mockGetAccountHierarchy.mockResolvedValue({
        primary: mockPrimaryAccounts,
        secondary: mockSecondaryAccounts,
        holder: mockHolderAccounts,
      });
    });

    it('should generate trial balance for secondary accounts', async () => {
      mockGetAccountBalance.mockResolvedValue(1000);

      const asOfDate = new Date('2025-01-31');
      const result = await reportService.generateTrialBalance(asOfDate, 'SECONDARY');

      expect(result).toBeDefined();
      expect(result.accountType).toBe('SECONDARY');
      expect(result.asOfDate).toEqual(asOfDate);
      expect(result.accounts).toHaveLength(2);
      expect(result.accounts[0].accountName).toBe('Current Assets');
      expect(result.accounts[1].accountName).toBe('Current Liabilities');
    });

    it('should generate trial balance for holder accounts', async () => {
      mockGetAccountBalance.mockResolvedValue(500);

      const asOfDate = new Date('2025-01-31');
      const result = await reportService.generateTrialBalance(asOfDate, 'HOLDER');

      expect(result).toBeDefined();
      expect(result.accountType).toBe('HOLDER');
      expect(result.asOfDate).toEqual(asOfDate);
      expect(result.accounts).toHaveLength(2);
      expect(result.accounts[0].accountName).toBe('Cash at Bank');
      expect(result.accounts[1].accountName).toBe('Accounts Payable');
    });

    it('should calculate correct balances', async () => {
      mockGetAccountBalance
        .mockResolvedValueOnce(500)  // Cash at Bank (positive = debit)
        .mockResolvedValueOnce(-500); // Accounts Payable (negative = credit)

      const asOfDate = new Date('2025-01-31');
      const result = await reportService.generateTrialBalance(asOfDate, 'HOLDER');

      const cashAccount = result.accounts.find(acc => acc.accountName === 'Cash at Bank');
      expect(cashAccount?.debitBalance).toBe(500);
      expect(cashAccount?.creditBalance).toBe(0);

      const payableAccount = result.accounts.find(acc => acc.accountName === 'Accounts Payable');
      expect(payableAccount?.debitBalance).toBe(0);
      expect(payableAccount?.creditBalance).toBe(500);
    });

    it('should check if trial balance is balanced', async () => {
      mockGetAccountBalance
        .mockResolvedValueOnce(500)
        .mockResolvedValueOnce(-500);

      const asOfDate = new Date('2025-01-31');
      const result = await reportService.generateTrialBalance(asOfDate, 'HOLDER');

      expect(result.totalDebits).toBe(result.totalCredits);
      expect(result.isBalanced).toBe(true);
    });

    it('should handle empty accounts', async () => {
      mockGetAccountHierarchy.mockResolvedValue({
        primary: [],
        secondary: [],
        holder: [],
      });

      const asOfDate = new Date('2025-01-31');
      const result = await reportService.generateTrialBalance(asOfDate, 'HOLDER');

      expect(result.accounts).toHaveLength(0);
      expect(result.totalDebits).toBe(0);
      expect(result.totalCredits).toBe(0);
      expect(result.isBalanced).toBe(true);
    });

    it('should handle service errors gracefully', async () => {
      mockGetAccountHierarchy.mockRejectedValue(new Error('Service error'));

      const asOfDate = new Date('2025-01-31');
      
      await expect(reportService.generateTrialBalance(asOfDate, 'HOLDER'))
        .rejects.toThrow();
    });
  });

  describe('generateAccountReport', () => {
    const mockAccount: HolderAccount = {
      id: 'holder-1',
      name: 'Cash at Bank',
      code: '1101',
      secondaryAccountId: 'secondary-1',
      balance: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockTransactions: Transaction[] = [
      {
        id: 'txn-1',
        number: 'TXN001',
        date: new Date('2025-01-15'),
        description: 'Opening Balance',
        debitAccountId: 'holder-1',
        creditAccountId: 'other-account',
        amount: 1000,
        reconciled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'txn-2',
        number: 'TXN002',
        date: new Date('2025-01-20'),
        description: 'Payment',
        debitAccountId: 'other-account',
        creditAccountId: 'holder-1',
        amount: 500,
        reconciled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    beforeEach(() => {
      mockGetHolderAccountById.mockResolvedValue(mockAccount);
      mockGetAccountBalance.mockResolvedValue(0);
      mockGetTransactionsByDateRange.mockResolvedValue(mockTransactions);
    });

    it('should generate account report', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');
      
      const result = await reportService.generateAccountReport(
        'holder-1',
        startDate,
        endDate
      );

      expect(result).toBeDefined();
      expect(result.accountName).toBe('Cash at Bank');
      expect(result.period.startDate).toEqual(startDate);
      expect(result.period.endDate).toEqual(endDate);
      expect(result.transactions).toHaveLength(2);
    });

    it('should calculate running balance correctly', async () => {
      mockGetAccountBalance.mockResolvedValue(0);

      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');
      
      const result = await reportService.generateAccountReport(
        'holder-1',
        startDate,
        endDate
      );

      expect(result.transactions[0].balance).toBe(1000); // +1000 debit
      expect(result.transactions[1].balance).toBe(500);  // -500 credit
      expect(result.closingBalance).toBe(500);
    });

    it('should handle invalid account ID', async () => {
      mockGetHolderAccountById.mockResolvedValue(null);

      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');
      
      await expect(reportService.generateAccountReport(
        'invalid-id',
        startDate,
        endDate
      )).rejects.toThrow();
    });
  });

  describe('generateStatementOfAccounts', () => {
    const mockAccount: HolderAccount = {
      id: 'holder-1',
      name: 'Customer Account',
      code: '1201',
      secondaryAccountId: 'secondary-1',
      balance: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockTransactions: Transaction[] = [
      {
        id: 'txn-1',
        number: 'INV001',
        date: new Date('2025-01-15'),
        description: 'Invoice #001',
        debitAccountId: 'holder-1',
        creditAccountId: 'revenue-account',
        amount: 1000,
        reconciled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    beforeEach(() => {
      mockGetHolderAccountById.mockResolvedValue(mockAccount);
      mockGetAccountBalance.mockResolvedValue(0);
      mockGetTransactionsByDateRange.mockResolvedValue(mockTransactions);
    });

    it('should generate statement of accounts', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');
      
      const result = await reportService.generateStatementOfAccounts(
        'holder-1',
        startDate,
        endDate
      );

      expect(result).toBeDefined();
      expect(result.accountName).toBe('Customer Account');
      expect(result.period.startDate).toEqual(startDate);
      expect(result.period.endDate).toEqual(endDate);
      expect(result.transactions).toHaveLength(1);
    });

    it('should handle invalid account ID', async () => {
      mockGetHolderAccountById.mockResolvedValue(null);

      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');
      
      await expect(reportService.generateStatementOfAccounts(
        'invalid-id',
        startDate,
        endDate
      )).rejects.toThrow();
    });
  });

  describe('generatePettyCashAnalysis', () => {
    const mockPettyCashAccount: HolderAccount = {
      id: 'petty-cash',
      name: 'Petty Cash',
      code: '1102',
      secondaryAccountId: 'secondary-1',
      balance: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockTransactions: Transaction[] = [
      {
        id: 'txn-1',
        number: 'PC001',
        date: new Date('2025-01-15'),
        description: 'Office Supplies',
        debitAccountId: 'expense-account',
        creditAccountId: 'petty-cash',
        amount: 50,
        reconciled: false,
        metadata: { category: 'Office Expenses' },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'txn-2',
        number: 'PC002',
        date: new Date('2025-01-20'),
        description: 'Cash Replenishment',
        debitAccountId: 'petty-cash',
        creditAccountId: 'bank-account',
        amount: 100,
        reconciled: false,
        metadata: { category: 'Cash Receipt' },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    beforeEach(() => {
      mockGetAccountHierarchy.mockResolvedValue({
        primary: [],
        secondary: [],
        holder: [mockPettyCashAccount],
      });
      mockGetAccountBalance.mockResolvedValue(200);
      mockGetTransactionsByDateRange.mockResolvedValue(mockTransactions);
    });

    it('should generate petty cash analysis', async () => {
      const month = 1; // January
      const year = 2025;
      
      const result = await reportService.generatePettyCashAnalysis(month, year);

      expect(result).toBeDefined();
      expect(result.month).toBe(month);
      expect(result.year).toBe(year);
      expect(result.receipts).toHaveLength(1);
      expect(result.payments).toHaveLength(1);
    });

    it('should calculate totals correctly', async () => {
      const month = 1;
      const year = 2025;
      
      const result = await reportService.generatePettyCashAnalysis(month, year);

      expect(result.totalReceipts).toBe(100);
      expect(result.totalPayments).toBe(50);
      expect(result.closingBalance).toBe(250); // 200 + 100 - 50
    });

    it('should handle missing petty cash account', async () => {
      mockGetAccountHierarchy.mockResolvedValue({
        primary: [],
        secondary: [],
        holder: [],
      });

      const month = 1;
      const year = 2025;
      
      await expect(reportService.generatePettyCashAnalysis(month, year))
        .rejects.toThrow();
    });
  });

  describe('helper methods', () => {
    it('should get default date range', () => {
      const result = reportService.getDefaultDateRange();

      expect(result.startDate).toBeDefined();
      expect(result.endDate).toBeDefined();
      expect(result.startDate.getDate()).toBe(1); // First day of month
    });

    it('should get date range for monthly period', () => {
      const startDate = new Date('2025-01-01');
      const result = reportService.getDateRangeForPeriod('MONTHLY', startDate, 2);

      expect(result.startDate).toEqual(startDate);
      expect(result.endDate.getMonth()).toBe(1); // February (0-indexed)
    });

    it('should get date range for quarterly period', () => {
      const startDate = new Date('2025-01-01');
      const result = reportService.getDateRangeForPeriod('QUARTERLY', startDate, 1);

      expect(result.startDate).toEqual(startDate);
      expect(result.endDate.getMonth()).toBe(2); // March (0-indexed)
    });

    it('should get date range for annual period', () => {
      const startDate = new Date('2025-01-01');
      const result = reportService.getDateRangeForPeriod('ANNUALLY', startDate, 1);

      expect(result.startDate).toEqual(startDate);
      expect(result.endDate.getFullYear()).toBe(2025);
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      mockGetAccountHierarchy.mockRejectedValue(
        new Error('Network error')
      );

      const asOfDate = new Date('2025-01-31');
      
      await expect(reportService.generateTrialBalance(asOfDate, 'HOLDER'))
        .rejects.toThrow();
    });
  });

  describe('generateIncomeStatement', () => {
    const mockRevenueAccount: HolderAccount = {
      id: 'revenue-1',
      name: 'Sales Revenue',
      code: '4001',
      secondaryAccountId: 'secondary-revenue',
      balance: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockExpenseAccount: HolderAccount = {
      id: 'expense-1',
      name: 'Salaries Expense',
      code: '5001',
      secondaryAccountId: 'secondary-expense',
      balance: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockCostOfSalesAccount: HolderAccount = {
      id: 'cogs-1',
      name: 'Cost of Goods Sold',
      code: '5100',
      secondaryAccountId: 'secondary-cogs',
      balance: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockRevenuePrimary: PrimaryAccount = {
      id: 'primary-revenue',
      name: 'Revenue',
      type: 'REVENUE',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockExpensePrimary: PrimaryAccount = {
      id: 'primary-expense',
      name: 'Expenses',
      type: 'EXPENSES',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockCostOfSalesPrimary: PrimaryAccount = {
      id: 'primary-cogs',
      name: 'Cost of Sales',
      type: 'EXPENSES',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockRevenueSecondary: SecondaryAccount = {
      id: 'secondary-revenue',
      name: 'Sales',
      code: '4001',
      primaryAccountId: 'primary-revenue',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockExpenseSecondary: SecondaryAccount = {
      id: 'secondary-expense',
      name: 'Operating Expenses',
      code: '5001',
      primaryAccountId: 'primary-expense',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockCostOfSalesSecondary: SecondaryAccount = {
      id: 'secondary-cogs',
      name: 'Direct Costs',
      code: '5100',
      primaryAccountId: 'primary-cogs',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockTransactions: Transaction[] = [
      {
        id: 'txn-1',
        number: 'REV001',
        date: new Date('2025-01-15'),
        description: 'Sales Revenue',
        debitAccountId: 'cash-account',
        creditAccountId: 'revenue-1',
        amount: 10000,
        reconciled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'txn-2',
        number: 'COGS001',
        date: new Date('2025-01-16'),
        description: 'Cost of Goods Sold',
        debitAccountId: 'cogs-1',
        creditAccountId: 'inventory-account',
        amount: 4000,
        reconciled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'txn-3',
        number: 'EXP001',
        date: new Date('2025-01-20'),
        description: 'Salaries',
        debitAccountId: 'expense-1',
        creditAccountId: 'cash-account',
        amount: 3000,
        reconciled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    beforeEach(() => {
      mockGetTransactionsByDateRange.mockResolvedValue(mockTransactions);
      mockGetAccountHierarchy.mockResolvedValue({
        primary: [mockRevenuePrimary, mockExpensePrimary, mockCostOfSalesPrimary],
        secondary: [mockRevenueSecondary, mockExpenseSecondary, mockCostOfSalesSecondary],
        holder: [mockRevenueAccount, mockExpenseAccount, mockCostOfSalesAccount],
      });
    });

    it('should generate income statement', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');
      
      const result = await reportService.generateIncomeStatement(startDate, endDate);

      expect(result).toBeDefined();
      expect(result.period.startDate).toEqual(startDate);
      expect(result.period.endDate).toEqual(endDate);
      expect(result.revenue).toBeDefined();
      expect(result.directCosts).toBeDefined();
      expect(result.totalOperatingExpenses).toBeDefined();
      expect(result.ebitda).toBeDefined();
      expect(result.ebit).toBeDefined();
      expect(result.profitBeforeTax).toBeDefined();
      expect(result.profitAfterTax).toBeDefined();
    });

    it('should calculate revenue correctly', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');
      
      const result = await reportService.generateIncomeStatement(startDate, endDate);

      expect(result.revenue).toBe(10000);
      expect(result.revenueDetails).toHaveLength(1);
      expect(result.revenueDetails[0].accountName).toBe('Sales Revenue');
      expect(result.revenueDetails[0].amount).toBe(10000);
    });

    it('should calculate cost of sales correctly', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');
      
      const result = await reportService.generateIncomeStatement(startDate, endDate);

      // Direct costs should include "Cost of Goods Sold"
      expect(result.directCosts).toBe(4000);
      expect(result.directCostsDetails).toHaveLength(1);
      expect(result.directCostsDetails[0].accountName).toBe('Cost of Goods Sold');
    });

    it('should calculate gross profit correctly', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');
      
      const result = await reportService.generateIncomeStatement(startDate, endDate);

      expect(result.grossProfit).toBe(6000); // 10000 - 4000 (revenue - direct costs)
    });

    it('should calculate operating expenses correctly', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');
      
      const result = await reportService.generateIncomeStatement(startDate, endDate);

      // Staff cost should capture "Salaries Expense"
      expect(result.staffCost).toBe(3000);
      expect(result.staffCostDetails).toHaveLength(1);
      expect(result.staffCostDetails[0].accountName).toBe('Salaries Expense');
      expect(result.totalOperatingExpenses).toBe(3000);
    });

    it('should calculate EBITDA correctly', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');
      
      const result = await reportService.generateIncomeStatement(startDate, endDate);

      // EBITDA = Gross Profit + Other Income - Total Operating Expenses
      expect(result.ebitda).toBe(3000); // 6000 + 0 - 3000
    });

    it('should calculate profit after tax correctly', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');
      
      const result = await reportService.generateIncomeStatement(startDate, endDate);

      // With no depreciation, interest, or taxes, PAT = EBITDA
      expect(result.profitAfterTax).toBe(3000);
    });

    it('should handle empty transactions', async () => {
      mockGetTransactionsByDateRange.mockResolvedValue([]);

      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');
      
      const result = await reportService.generateIncomeStatement(startDate, endDate);

      expect(result.revenue).toBe(0);
      expect(result.directCosts).toBe(0);
      expect(result.totalOperatingExpenses).toBe(0);
      expect(result.grossProfit).toBe(0);
      expect(result.ebitda).toBe(0);
      expect(result.profitAfterTax).toBe(0);
    });

    it('should filter transactions by date range', async () => {
      const startDate = new Date('2025-01-17'); // After first two transactions
      const endDate = new Date('2025-01-31');
      
      const filteredTransactions = mockTransactions.filter(
        t => t.date >= startDate && t.date <= endDate
      );
      mockGetTransactionsByDateRange.mockResolvedValue(filteredTransactions);

      const result = await reportService.generateIncomeStatement(startDate, endDate);

      expect(result.revenue).toBe(0); // Revenue transaction excluded
      expect(result.directCosts).toBe(0); // Direct costs transaction excluded
      expect(result.staffCost).toBe(3000); // Only expense transaction included
    });
  });

  describe('data consistency', () => {
    it('should maintain referential integrity', async () => {
      const mockHolderAccounts: HolderAccount[] = [
        {
          id: 'holder-1',
          name: 'Cash at Bank',
          code: '1101',
          secondaryAccountId: 'secondary-1',
          balance: 0,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockGetAccountHierarchy.mockResolvedValue({
        primary: [],
        secondary: [],
        holder: mockHolderAccounts,
      });
      mockGetAccountBalance.mockResolvedValue(1000);

      const asOfDate = new Date('2025-01-31');
      const result = await reportService.generateTrialBalance(asOfDate, 'HOLDER');

      expect(result.accounts).toHaveLength(1);
      expect(result.accounts[0].accountName).toBe('Cash at Bank');
    });
  });
});
