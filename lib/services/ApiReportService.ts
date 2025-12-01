/**
 * API Report Service
 * 
 * Central service for generating all financial reports using API-based services
 * Replaces localStorage-based ReportService for Supabase integration
 */

import { ApiAccountService } from './ApiAccountService';
import { ApiTransactionService } from './ApiTransactionService';
import type { DateRange } from '@/types';
import type {
  TrialBalance,
  TrialBalanceAccount,
  AccountReport,
  ComparativeAccountReport,
  ComparativeAccountSubAccount,
  StatementOfAccounts,
  PettyCashAnalysis,
  AgeingAnalysis,
  IncomeStatement,
  IncomeStatementLineItem,
  BalanceSheet,
  BalanceSheetSection,
  BalanceSheetSubsection,
  BalanceSheetCategory,
  BalanceSheetLineItem,
  CashFlowStatement,
  CashFlowSection,
  CashFlowLineItem,
  ComparativeCashFlowStatement,
  ComparativeCashFlowLineItem,
} from '@/types/reports';

// Default organization ID for testing
const DEFAULT_ORGANIZATION_ID = '7224ab64-5bd7-4382-839d-6c415d872ba7';

export class ApiReportService {
  private static instance: ApiReportService;
  private accountService: ApiAccountService;
  private transactionService: ApiTransactionService;

  private constructor() {
    this.accountService = ApiAccountService.getInstance();
    this.transactionService = ApiTransactionService.getInstance();
  }

  public static getInstance(): ApiReportService {
    if (!ApiReportService.instance) {
      ApiReportService.instance = new ApiReportService();
    }
    return ApiReportService.instance;
  }

  // ==================== Trial Balance ====================

  /**
   * Generate Trial Balance Report
   * Shows all account balances as of a specific date
   */
  async generateTrialBalance(
    asOfDate: Date,
    accountType: 'SECONDARY' | 'HOLDER' = 'SECONDARY'
  ): Promise<TrialBalance> {
    try {
      const accounts: TrialBalanceAccount[] = [];
      let totalDebits = 0;
      let totalCredits = 0;

      // Get account hierarchy from API (includes balances)
      const hierarchy = await this.accountService.getAccountHierarchy();

      // Helper to parse balance - handles string decimals from Prisma
      const parseBalance = (balance: any): number => {
        if (typeof balance === 'string') return parseFloat(balance) || 0;
        if (typeof balance === 'number') return balance;
        return 0;
      };

      if (accountType === 'HOLDER') {
        // For HOLDER accounts, use balances already in hierarchy
        for (const account of hierarchy.holder) {
          if (!account.isActive) continue;

          // Use balance from hierarchy (already fetched)
          const balance = parseBalance(account.balance);

          const debitBalance = balance > 0 ? balance : 0;
          const creditBalance = balance < 0 ? Math.abs(balance) : 0;

          accounts.push({
            accountId: account.id,
            accountCode: account.code,
            accountName: account.name,
            debitBalance,
            creditBalance,
          });

          totalDebits += debitBalance;
          totalCredits += creditBalance;
        }
      } else {
        // For SECONDARY accounts, aggregate balances from holder accounts under each secondary
        for (const secondaryAccount of hierarchy.secondary) {
          if (!secondaryAccount.isActive) continue;

          // Get holder accounts under this secondary account
          const holderAccounts = hierarchy.holder.filter(
            h => h.secondaryAccountId === secondaryAccount.id && h.isActive
          );

          // Calculate aggregate balance from holder accounts (using cached balances)
          let secondaryBalance = 0;
          for (const holder of holderAccounts) {
            secondaryBalance += parseBalance(holder.balance);
          }

          const debitBalance = secondaryBalance > 0 ? secondaryBalance : 0;
          const creditBalance = secondaryBalance < 0 ? Math.abs(secondaryBalance) : 0;

          accounts.push({
            accountId: secondaryAccount.id,
            accountCode: secondaryAccount.code,
            accountName: secondaryAccount.name,
            debitBalance,
            creditBalance,
          });

          totalDebits += debitBalance;
          totalCredits += creditBalance;
        }
      }

      // Sort accounts by code
      accounts.sort((a, b) => a.accountCode.localeCompare(b.accountCode));

      // Check if trial balance is balanced
      const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

      return {
        asOfDate,
        accountType,
        accounts,
        totalDebits,
        totalCredits,
        isBalanced,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error generating trial balance:', error);
      throw new Error('Failed to generate trial balance');
    }
  }

  // ==================== Income Statement ====================

  /**
   * Generate Income Statement
   * Shows detailed revenue, expenses, and profit/loss for a period
   */
  async generateIncomeStatement(
    startDate: Date,
    endDate: Date,
    includeUnreconciled: boolean = true
  ): Promise<IncomeStatement> {
    try {
      // Call the profit-loss API endpoint
      // By default, include unreconciled transactions to show current activity
      const params = new URLSearchParams({
        dateFrom: startDate.toISOString(),
        dateTo: endDate.toISOString(),
        organizationId: DEFAULT_ORGANIZATION_ID,
        includeUnreconciled: includeUnreconciled.toString(),
      });

      const response = await fetch(`/api/reports/profit-loss?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch profit-loss report: ${response.statusText}`);
      }

      const result = await response.json();
      const data = result.data;

      // Transform API response to IncomeStatement format
      const revenueDetails: IncomeStatementLineItem[] = (data.revenue?.accounts || []).map((acc: any) => ({
        accountId: acc.account_code || '',
        accountName: acc.holder_account_name || acc.secondary_account_name || '',
        amount: Math.abs(parseFloat(acc.calculated_balance) || 0),
      }));

      const expenseDetails: IncomeStatementLineItem[] = (data.expenses?.accounts || []).map((acc: any) => ({
        accountId: acc.account_code || '',
        accountName: acc.holder_account_name || acc.secondary_account_name || '',
        amount: Math.abs(parseFloat(acc.calculated_balance) || 0),
      }));

      const revenue = data.summary?.totalRevenue || 0;
      const totalExpenses = data.summary?.totalExpenses || 0;
      const netIncome = data.summary?.netIncome || 0;

      // Create a simplified income statement structure
      return {
        period: { startDate, endDate },
        
        revenue: Math.abs(revenue),
        revenueDetails,
        
        directCosts: 0,
        directCostsDetails: [],
        
        grossProfit: Math.abs(revenue),
        
        otherIncome: 0,
        otherIncomeDetails: [],
        
        staffCost: 0,
        staffCostDetails: [],
        
        rentalCost: 0,
        rentalCostDetails: [],
        
        sellingGeneralAdmin: 0,
        sellingGeneralAdminDetails: [],
        
        marketingAdvertising: 0,
        marketingAdvertisingDetails: [],
        
        taxesLevies: 0,
        taxesLeviesDetails: [],
        
        giftsPromotions: 0,
        giftsPromotionsDetails: [],
        
        otherOperatingExpenses: Math.abs(totalExpenses),
        otherOperatingExpensesDetails: expenseDetails,
        
        totalOperatingExpenses: Math.abs(totalExpenses),
        
        ebitda: netIncome,
        
        depreciationAmortization: 0,
        depreciationAmortizationDetails: [],
        
        ebit: netIncome,
        
        interestIncome: 0,
        interestIncomeDetails: [],
        
        interestExpense: 0,
        interestExpenseDetails: [],
        
        netInterestCharges: 0,
        
        profitBeforeTax: netIncome,
        
        taxExpenses: 0,
        taxExpensesDetails: [],
        
        profitAfterTax: netIncome,
        
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error generating income statement:', error);
      throw new Error('Failed to generate income statement');
    }
  }

  // ==================== Balance Sheet ====================

  /**
   * Generate Balance Sheet (Statement of Financial Position)
   * Shows all assets, liabilities, and equity accounts as of a specific date
   */
  async generateBalanceSheet(asOfDate: Date, includeUnreconciled: boolean = true): Promise<BalanceSheet> {
    try {
      // Call the balance-sheet API endpoint
      // By default, include unreconciled transactions to show current balances
      const params = new URLSearchParams({
        date: asOfDate.toISOString(),
        organizationId: DEFAULT_ORGANIZATION_ID,
        includeUnreconciled: includeUnreconciled.toString(),
      });

      const response = await fetch(`/api/reports/balance-sheet?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch balance sheet: ${response.statusText}`);
      }

      const result = await response.json();
      const data = result.data;

      // Helper to transform API accounts to BalanceSheetLineItem[]
      const transformAccounts = (accounts: any[]): BalanceSheetLineItem[] => {
        return (accounts || []).map((acc: any) => ({
          accountId: acc.account_code || '',
          accountName: acc.holder_account_name || acc.secondary_account_name || '',
          amount: Math.abs(parseFloat(acc.calculated_balance) || 0),
        })).filter((item: BalanceSheetLineItem) => item.amount > 0.01);
      };

      // Helper to categorize accounts by keywords
      const categorizeAccounts = (accounts: BalanceSheetLineItem[], keywords: string[]): BalanceSheetLineItem[] => {
        return accounts.filter(account => {
          const accountNameLower = account.accountName.toLowerCase();
          return keywords.some(keyword => {
            const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'i');
            return regex.test(accountNameLower);
          });
        });
      };

      // Transform assets
      const allAssetAccounts = transformAccounts(data.assets?.accounts);
      
      // Categorize current assets
      const cashBankAccounts = categorizeAccounts(allAssetAccounts, ['cash', 'bank']);
      const accountsReceivableAccounts = categorizeAccounts(allAssetAccounts, ['receivable', 'debtor']);
      const inventoryAccounts = categorizeAccounts(allAssetAccounts, ['inventory', 'stock']);
      
      // Get remaining as other current assets
      const categorizedCurrentIds = new Set([
        ...cashBankAccounts.map(a => a.accountId),
        ...accountsReceivableAccounts.map(a => a.accountId),
        ...inventoryAccounts.map(a => a.accountId),
      ]);
      const otherCurrentAssets = allAssetAccounts.filter(a => !categorizedCurrentIds.has(a.accountId));

      const currentAssetCategories: BalanceSheetCategory[] = [
        { title: 'Cash & Bank Balances', lineItems: cashBankAccounts, subtotal: cashBankAccounts.reduce((s, i) => s + i.amount, 0) },
        { title: 'Accounts Receivable', lineItems: accountsReceivableAccounts, subtotal: accountsReceivableAccounts.reduce((s, i) => s + i.amount, 0) },
        { title: 'Inventory', lineItems: inventoryAccounts, subtotal: inventoryAccounts.reduce((s, i) => s + i.amount, 0) },
        { title: 'Other Current Assets', lineItems: otherCurrentAssets, subtotal: otherCurrentAssets.reduce((s, i) => s + i.amount, 0) },
      ].filter(cat => cat.lineItems.length > 0);

      const currentAssets: BalanceSheetSubsection = {
        title: 'Current Assets',
        categories: currentAssetCategories,
        lineItems: [],
        subtotal: currentAssetCategories.reduce((sum, cat) => sum + cat.subtotal, 0),
      };

      const nonCurrentAssets: BalanceSheetSubsection = {
        title: 'Non-current Assets',
        categories: [],
        lineItems: [],
        subtotal: 0,
      };

      const totalAssets = data.totals?.totalAssets || (currentAssets.subtotal + nonCurrentAssets.subtotal);

      // Transform liabilities
      const allLiabilityAccounts = transformAccounts(data.liabilities?.accounts);
      
      const accountsPayableAccounts = categorizeAccounts(allLiabilityAccounts, ['payable', 'creditor']);
      const otherLiabilities = allLiabilityAccounts.filter(a => 
        !accountsPayableAccounts.find(ap => ap.accountId === a.accountId)
      );

      const currentLiabilityCategories: BalanceSheetCategory[] = [
        { title: 'Accounts Payable', lineItems: accountsPayableAccounts, subtotal: accountsPayableAccounts.reduce((s, i) => s + i.amount, 0) },
        { title: 'Other Current Liabilities', lineItems: otherLiabilities, subtotal: otherLiabilities.reduce((s, i) => s + i.amount, 0) },
      ].filter(cat => cat.lineItems.length > 0);

      const currentLiabilities: BalanceSheetSubsection = {
        title: 'Current Liabilities',
        categories: currentLiabilityCategories,
        lineItems: [],
        subtotal: currentLiabilityCategories.reduce((sum, cat) => sum + cat.subtotal, 0),
      };

      const nonCurrentLiabilities: BalanceSheetSubsection = {
        title: 'Non-current Liabilities',
        categories: [],
        lineItems: [],
        subtotal: 0,
      };

      const totalLiabilities = data.totals?.totalLiabilities || (currentLiabilities.subtotal + nonCurrentLiabilities.subtotal);

      // Transform equity
      const allEquityAccounts = transformAccounts(data.equity?.accounts);
      
      const equityCategories: BalanceSheetCategory[] = [
        { title: 'Shareholders Equity', lineItems: allEquityAccounts, subtotal: allEquityAccounts.reduce((s, i) => s + i.amount, 0) },
      ].filter(cat => cat.lineItems.length > 0);

      const equitySubsection: BalanceSheetSubsection = {
        title: 'Shareholders Equity',
        categories: equityCategories,
        lineItems: [],
        subtotal: equityCategories.reduce((sum, cat) => sum + cat.subtotal, 0),
      };

      const totalEquity = data.totals?.totalEquity || equitySubsection.subtotal;

      return {
        asOfDate,
        assets: {
          title: 'Assets',
          subsections: [currentAssets, nonCurrentAssets].filter(s => s.subtotal > 0 || s.categories?.length),
          total: totalAssets,
        },
        liabilities: {
          title: 'Liabilities',
          subsections: [currentLiabilities, nonCurrentLiabilities].filter(s => s.subtotal > 0 || s.categories?.length),
          total: totalLiabilities,
        },
        equity: {
          title: 'Shareholders Equity',
          subsections: [equitySubsection].filter(s => s.subtotal > 0 || s.categories?.length),
          total: totalEquity,
        },
        totalAssets,
        totalLiabilities,
        totalEquity,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error generating balance sheet:', error);
      throw new Error('Failed to generate balance sheet');
    }
  }

  // ==================== Cash Flow Statement ====================

  /**
   * Generate Cash Flow Statement
   * Shows cash flows from operating, investing, and financing activities
   */
  async generateCashFlowStatement(
    startDate: Date,
    endDate: Date
  ): Promise<CashFlowStatement> {
    try {
      // Get income statement for EBIT and other details
      const incomeStatement = await this.generateIncomeStatement(startDate, endDate);
      const ebit = incomeStatement.ebit;

      // Get account hierarchy
      const hierarchy = await this.accountService.getAccountHierarchy();

      // Get all transactions in period
      const transactions = await this.transactionService.getTransactionsByDateRange(startDate, endDate);

      // Helper to calculate movement for accounts matching keywords
      const calculateMovement = (keywords: string[]): number => {
        let total = 0;

        hierarchy.holder.forEach((account) => {
          if (!account.isActive) return;

          const accountNameLower = account.name.toLowerCase();
          const matches = keywords.some((keyword) => {
            const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'i');
            return regex.test(accountNameLower);
          });

          if (matches) {
            // Calculate balance change from transactions
            const accountTxns = transactions.filter(
              t => t.debitAccountId === account.id || t.creditAccountId === account.id
            );
            
            let change = 0;
            accountTxns.forEach(t => {
              if (t.debitAccountId === account.id) {
                change += t.amount;
              } else if (t.creditAccountId === account.id) {
                change -= t.amount;
              }
            });
            
            total += change;
          }
        });

        return total;
      };

      // OPERATING ACTIVITIES
      const operatingItems: CashFlowLineItem[] = [
        { description: 'EBIT', amount: ebit },
        { description: 'Adjustment for Depreciation & Amortization', amount: incomeStatement.depreciationAmortization },
      ];

      // Working capital changes
      const accountsReceivableChange = -calculateMovement(['accounts receivable', 'receivable', 'debtors']);
      const accountsPayableChange = calculateMovement(['accounts payable', 'payable', 'creditors']);

      operatingItems.push(
        { description: 'Accounts Receivable', amount: accountsReceivableChange },
        { description: 'Accounts Payable', amount: accountsPayableChange },
        { description: 'Tax Paid', amount: -incomeStatement.taxExpenses }
      );

      const netCashFromOperating = operatingItems.reduce((sum, item) => sum + item.amount, 0);

      // INVESTING ACTIVITIES
      const ppeChange = -calculateMovement(['property', 'plant', 'equipment', 'fixed asset']);
      const intangiblesChange = -calculateMovement(['intangible', 'goodwill', 'patent']);

      const investingItems: CashFlowLineItem[] = [
        { description: 'Purchase of Property, Plant & Equipment', amount: ppeChange },
        { description: 'Purchase of Intangible Assets', amount: intangiblesChange },
      ];

      const netCashFromInvesting = investingItems.reduce((sum, item) => sum + item.amount, 0);

      // FINANCING ACTIVITIES
      const equityChange = calculateMovement(['stated capital', 'share capital', 'common stock']);
      const longTermDebtChange = calculateMovement(['long-term debt', 'long term debt', 'bonds payable', 'loan']);

      const financingItems: CashFlowLineItem[] = [
        { description: 'Shareholders Equity Injection', amount: equityChange },
        { description: 'Movement in Long-term Debt', amount: longTermDebtChange },
        { description: 'Net Interest Charges', amount: -incomeStatement.netInterestCharges },
        { description: 'Dividend Paid', amount: 0 },
      ];

      const netCashFromFinancing = financingItems.reduce((sum, item) => sum + item.amount, 0);

      // Calculate net cash flow
      const netCashFlow = netCashFromOperating + netCashFromInvesting + netCashFromFinancing;

      // Find cash account for beginning/ending balance
      const cashAccount = hierarchy.holder.find((h) => 
        h.name.toLowerCase().includes('cash') || h.name.toLowerCase().includes('bank')
      );
      const beginningCash = cashAccount?.balance || 0;
      const endingCash = beginningCash + netCashFlow;

      return {
        period: { startDate, endDate },
        operatingActivities: {
          title: 'Cash from Operating Activities',
          lineItems: operatingItems,
          total: netCashFromOperating,
        },
        investingActivities: {
          title: 'Cash Flow from Investing Activities',
          lineItems: investingItems,
          total: netCashFromInvesting,
        },
        financingActivities: {
          title: 'Cash Flow from Financing Activities',
          lineItems: financingItems,
          total: netCashFromFinancing,
        },
        netCashFlow,
        beginningCash,
        endingCash,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error generating cash flow statement:', error);
      throw new Error('Failed to generate cash flow statement');
    }
  }

  /**
   * Generate Comparative Cash Flow Statement
   * Shows cash flows side-by-side for multiple periods
   */
  async generateComparativeCashFlowStatement(
    startDate: Date,
    numberOfPeriods: number,
    periodType: 'MONTHLY' | 'YEARLY' = 'MONTHLY'
  ): Promise<ComparativeCashFlowStatement> {
    try {
      const periods: DateRange[] = [];
      const cashFlowStatements: CashFlowStatement[] = [];

      // Generate periods
      for (let i = 0; i < numberOfPeriods; i++) {
        const periodStart = new Date(startDate);
        const periodEnd = new Date(startDate);

        if (periodType === 'MONTHLY') {
          periodStart.setMonth(startDate.getMonth() + i, 1);
          periodEnd.setMonth(startDate.getMonth() + i + 1, 0);
        } else {
          periodStart.setFullYear(startDate.getFullYear() + i, 0, 1);
          periodEnd.setFullYear(startDate.getFullYear() + i, 11, 31);
        }

        periods.push({ startDate: periodStart, endDate: periodEnd });

        // Generate cash flow for this period
        const cashFlow = await this.generateCashFlowStatement(periodStart, periodEnd);
        cashFlowStatements.push(cashFlow);
      }

      // Combine into comparative format
      const operatingLineItems: ComparativeCashFlowLineItem[] = [];
      const investingLineItems: ComparativeCashFlowLineItem[] = [];
      const financingLineItems: ComparativeCashFlowLineItem[] = [];

      // Get all unique line item descriptions
      const allOperatingDescriptions = new Set<string>();
      const allInvestingDescriptions = new Set<string>();
      const allFinancingDescriptions = new Set<string>();

      cashFlowStatements.forEach(cf => {
        cf.operatingActivities.lineItems.forEach(item => allOperatingDescriptions.add(item.description));
        cf.investingActivities.lineItems.forEach(item => allInvestingDescriptions.add(item.description));
        cf.financingActivities.lineItems.forEach(item => allFinancingDescriptions.add(item.description));
      });

      // Build comparative line items
      allOperatingDescriptions.forEach(description => {
        const amounts = cashFlowStatements.map(cf => {
          const item = cf.operatingActivities.lineItems.find(li => li.description === description);
          return item ? item.amount : 0;
        });
        operatingLineItems.push({ description, amounts });
      });

      allInvestingDescriptions.forEach(description => {
        const amounts = cashFlowStatements.map(cf => {
          const item = cf.investingActivities.lineItems.find(li => li.description === description);
          return item ? item.amount : 0;
        });
        investingLineItems.push({ description, amounts });
      });

      allFinancingDescriptions.forEach(description => {
        const amounts = cashFlowStatements.map(cf => {
          const item = cf.financingActivities.lineItems.find(li => li.description === description);
          return item ? item.amount : 0;
        });
        financingLineItems.push({ description, amounts });
      });

      return {
        periods,
        operatingActivities: {
          title: 'Cash from Operating Activities',
          lineItems: operatingLineItems,
          totals: cashFlowStatements.map(cf => cf.operatingActivities.total),
        },
        investingActivities: {
          title: 'Cash Flow from Investing Activities',
          lineItems: investingLineItems,
          totals: cashFlowStatements.map(cf => cf.investingActivities.total),
        },
        financingActivities: {
          title: 'Cash Flow from Financing Activities',
          lineItems: financingLineItems,
          totals: cashFlowStatements.map(cf => cf.financingActivities.total),
        },
        netCashFlows: cashFlowStatements.map(cf => cf.netCashFlow),
        beginningCash: cashFlowStatements.map(cf => cf.beginningCash),
        endingCash: cashFlowStatements.map(cf => cf.endingCash),
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error generating comparative cash flow statement:', error);
      throw new Error('Failed to generate comparative cash flow statement');
    }
  }

  // ==================== Comparative Account Report ====================

  /**
   * Generate Comparative Account Report
   * Shows account activity across multiple periods
   */
  async generateComparativeAccountReport(
    parentAccountId: string,
    startDate: Date,
    numberOfPeriods: number,
    periodType: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUALLY' | 'ANNUALLY' = 'QUARTERLY'
  ): Promise<ComparativeAccountReport> {
    try {
      // Get parent account details
      const parentAccount = await this.accountService.getSecondaryAccountById(parentAccountId);
      if (!parentAccount) {
        throw new Error('Parent account not found');
      }

      // Get all holder accounts under this secondary account
      const holderAccounts = await this.accountService.getHolderAccounts(parentAccountId);

      if (holderAccounts.length === 0) {
        throw new Error(`No holder accounts found under "${parentAccount.name}". Please create holder accounts under this secondary account first.`);
      }

      // Generate periods
      const periods: DateRange[] = [];
      const monthsPerPeriod = periodType === 'MONTHLY' ? 1 : periodType === 'QUARTERLY' ? 3 : periodType === 'SEMI_ANNUALLY' ? 6 : 12;

      for (let i = 0; i < numberOfPeriods; i++) {
        const periodStart = new Date(startDate);
        periodStart.setMonth(startDate.getMonth() + (i * monthsPerPeriod));
        periodStart.setDate(1);

        const periodEnd = new Date(periodStart);
        periodEnd.setMonth(periodStart.getMonth() + monthsPerPeriod);
        periodEnd.setDate(0);
        periodEnd.setHours(23, 59, 59, 999);

        periods.push({ startDate: periodStart, endDate: periodEnd });
      }

      // For each holder account, calculate amounts for each period
      const subAccounts: ComparativeAccountSubAccount[] = [];

      for (const holderAccount of holderAccounts) {
        if (!holderAccount.isActive) continue;

        const amounts: number[] = [];

        for (const period of periods) {
          // Get all transactions for this account in this period
          const allTransactions = await this.transactionService.getTransactionsByDateRange(
            period.startDate,
            period.endDate
          );

          // Filter for this specific account and calculate net amount
          const accountTransactions = allTransactions.filter(
            (t) => t.debitAccountId === holderAccount.id || t.creditAccountId === holderAccount.id
          );

          // Calculate net amount (credits - debits for revenue/income accounts)
          let netAmount = 0;
          accountTransactions.forEach((t) => {
            if (t.creditAccountId === holderAccount.id) {
              netAmount += t.amount;
            } else if (t.debitAccountId === holderAccount.id) {
              netAmount -= t.amount;
            }
          });

          amounts.push(Math.abs(netAmount));
        }

        // Only include accounts that have activity in at least one period
        if (amounts.some(a => a > 0)) {
          subAccounts.push({
            accountId: holderAccount.id,
            accountName: holderAccount.name,
            amounts,
          });
        }
      }

      // Calculate totals for each period
      const totals = periods.map((_, periodIndex) => {
        return subAccounts.reduce((sum, subAccount) => sum + subAccount.amounts[periodIndex], 0);
      });

      return {
        accountId: parentAccount.id,
        accountName: parentAccount.name,
        accountCode: parentAccount.code,
        periods,
        periodType,
        subAccounts,
        totals,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error generating comparative account report:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to generate comparative account report');
    }
  }

  // ==================== Account Reports ====================

  /**
   * Generate Account Report
   * Shows all transactions for a specific account over a period
   */
  async generateAccountReport(
    accountId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AccountReport> {
    try {
      const account = await this.accountService.getHolderAccountById(accountId);
      if (!account) {
        throw new Error('Account not found');
      }

      const openingBalance = await this.accountService.getAccountBalance(
        accountId,
        new Date(startDate.getTime() - 1)
      );

      const allTransactions = await this.transactionService.getTransactionsByDateRange(
        startDate,
        endDate
      );

      const accountTransactions = allTransactions.filter(
        (t) => t.debitAccountId === accountId || t.creditAccountId === accountId
      );

      let runningBalance = openingBalance;
      let totalDebits = 0;
      let totalCredits = 0;

      const transactions = accountTransactions.map((t) => {
        const isDebit = t.debitAccountId === accountId;
        const debit = isDebit ? t.amount : 0;
        const credit = !isDebit ? t.amount : 0;

        runningBalance += debit - credit;
        totalDebits += debit;
        totalCredits += credit;

        return {
          date: t.date,
          transactionNumber: t.number,
          description: t.description,
          debit,
          credit,
          balance: runningBalance,
        };
      });

      return {
        accountId: account.id,
        accountName: account.name,
        accountCode: account.code,
        period: { startDate, endDate },
        openingBalance,
        transactions,
        closingBalance: runningBalance,
        totalDebits,
        totalCredits,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error generating account report:', error);
      throw new Error('Failed to generate account report');
    }
  }

  /**
   * Generate Statement of Accounts
   */
  async generateStatementOfAccounts(
    accountId: string,
    startDate: Date,
    endDate: Date
  ): Promise<StatementOfAccounts> {
    const report = await this.generateAccountReport(accountId, startDate, endDate);
    
    return {
      accountId: report.accountId,
      accountName: report.accountName,
      period: report.period,
      openingBalance: report.openingBalance,
      transactions: report.transactions.map(t => ({
        date: t.date,
        reference: t.transactionNumber,
        description: t.description,
        debit: t.debit,
        credit: t.credit,
        balance: t.balance,
      })),
      closingBalance: report.closingBalance,
      generatedAt: report.generatedAt,
    };
  }

  /**
   * Generate Ageing Analysis
   */
  async generateAgeingAnalysis(
    asOfDate: Date,
    accountType: 'RECEIVABLES' | 'PAYABLES' = 'RECEIVABLES'
  ): Promise<AgeingAnalysis> {
    // Basic implementation - would need sales/invoice data for full implementation
    return {
      asOfDate,
      accountType,
      items: [],
      summary: {
        totalInvoiceAmount: 0,
        totalPaid: 0,
        totalOutstanding: 0,
        current: 0,
        days31to45: 0,
        days46to60: 0,
        days61to75: 0,
        days76to90: 0,
        over90days: 0,
      },
      generatedAt: new Date(),
    };
  }

  /**
   * Generate Petty Cash Analysis
   * Shows petty cash transactions for a specific month with opening/closing balances
   */
  async generatePettyCashAnalysis(
    month: number,
    year: number
  ): Promise<PettyCashAnalysis> {
    try {
      // 1. Find petty cash account via API
      const pettyCashResponse = await fetch('/api/accounts/petty-cash');
      if (!pettyCashResponse.ok) {
        const errorData = await pettyCashResponse.json().catch(() => ({}));
        throw new Error(errorData.message || 'Petty cash account not found');
      }
      const pettyCashResult = await pettyCashResponse.json();
      const pettyCashAccount = pettyCashResult.data;

      if (!pettyCashAccount) {
        throw new Error('Petty cash account not found. Please create a holder account with "Petty Cash" in the name.');
      }

      // 2. Calculate date range for the month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);

      // 3. Get opening balance by fetching transactions before the month
      // For now, use the account's current balance and work backwards
      // or fetch transactions before start date
      const beforeStartDate = new Date(startDate.getTime() - 1);
      
      // Get all transactions up to start of month to calculate opening balance
      const transactionsBeforeMonth = await this.transactionService.getTransactionsByDateRange(
        new Date(year - 1, 0, 1), // Start of previous year
        beforeStartDate
      );

      // Calculate opening balance from historical transactions
      let openingBalance = 0;
      transactionsBeforeMonth.forEach((t) => {
        if (t.debitAccountId === pettyCashAccount.id) {
          openingBalance += t.amount; // Money coming in
        } else if (t.creditAccountId === pettyCashAccount.id) {
          openingBalance -= t.amount; // Money going out
        }
      });

      // 4. Get all transactions for the selected month
      const monthTransactions = await this.transactionService.getTransactionsByDateRange(
        startDate,
        endDate
      );

      // 5. Filter for petty cash account transactions
      const pettyCashTransactions = monthTransactions.filter(
        (t) =>
          t.debitAccountId === pettyCashAccount.id ||
          t.creditAccountId === pettyCashAccount.id
      );

      // 6. Separate receipts (debits to petty cash = money in) and payments (credits from petty cash = money out)
      const receipts = pettyCashTransactions
        .filter((t) => t.debitAccountId === pettyCashAccount.id)
        .map((t) => ({
          date: new Date(t.date),
          description: t.description,
          amount: t.amount,
          category: (t.metadata as any)?.category as string | undefined,
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      const payments = pettyCashTransactions
        .filter((t) => t.creditAccountId === pettyCashAccount.id)
        .map((t) => ({
          date: new Date(t.date),
          description: t.description,
          amount: t.amount,
          category: (t.metadata as any)?.category as string | undefined,
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      // 7. Calculate totals
      const totalReceipts = receipts.reduce((sum, r) => sum + r.amount, 0);
      const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
      const closingBalance = openingBalance + totalReceipts - totalPayments;

      return {
        month,
        year,
        openingBalance,
        receipts,
        payments,
        totalReceipts,
        totalPayments,
        closingBalance,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error generating petty cash analysis:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        throw new Error('Petty cash account not found. Please create a holder account with "Petty Cash" in the name.');
      }
      throw new Error('Failed to generate petty cash analysis');
    }
  }

  // ==================== Sales Reports ====================

  /**
   * Generate Sales Levels Report
   * Shows sales aggregated by service/product across multiple periods
   */
  async generateSalesLevelsReport(
    reportType: 'P_LEVELS' | 'G_LEVELS',
    mode: 'SERVICE_MODE' | 'SERVICE_LINES' | 'SERVICES',
    startDate: Date,
    numberOfPeriods: number,
    periodType: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUALLY' | 'ANNUALLY'
  ): Promise<any> {
    try {
      // Generate periods
      const monthsPerPeriod = periodType === 'MONTHLY' ? 1 : periodType === 'QUARTERLY' ? 3 : periodType === 'SEMI_ANNUALLY' ? 6 : 12;
      const periods: { startDate: Date; endDate: Date; label: string }[] = [];

      for (let i = 0; i < numberOfPeriods; i++) {
        const periodStart = new Date(startDate);
        periodStart.setMonth(startDate.getMonth() + (i * monthsPerPeriod));
        periodStart.setDate(1);

        const periodEnd = new Date(periodStart);
        periodEnd.setMonth(periodStart.getMonth() + monthsPerPeriod);
        periodEnd.setDate(0);
        periodEnd.setHours(23, 59, 59, 999);

        // Generate period label
        let label = '';
        if (periodType === 'MONTHLY') {
          label = periodStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        } else if (periodType === 'QUARTERLY') {
          const quarter = Math.floor(periodStart.getMonth() / 3) + 1;
          label = `Q${quarter} ${periodStart.getFullYear()}`;
        } else if (periodType === 'SEMI_ANNUALLY') {
          const half = periodStart.getMonth() < 6 ? 'H1' : 'H2';
          label = `${half} ${periodStart.getFullYear()}`;
        } else {
          label = periodStart.getFullYear().toString();
        }

        periods.push({ startDate: periodStart, endDate: periodEnd, label });
      }

      // Fetch sales entries from API
      const params = new URLSearchParams({
        dateFrom: periods[0].startDate.toISOString(),
        dateTo: periods[periods.length - 1].endDate.toISOString(),
        organizationId: DEFAULT_ORGANIZATION_ID,
      });

      const response = await fetch(`/api/reports/sales?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch sales report: ${response.statusText}`);
      }

      const result = await response.json();
      const salesEntries = result.data?.salesEntries || [];

      // Group by service/service line based on mode
      const groupedData = new Map<string, { name: string; code: string; amounts: number[] }>();

      for (const entry of salesEntries) {
        const entryDate = new Date(entry.date);
        const salesValue = parseFloat(entry.salesValue) || 0;

        // Find which period this entry belongs to
        let periodIndex = -1;
        for (let i = 0; i < periods.length; i++) {
          if (entryDate >= periods[i].startDate && entryDate <= periods[i].endDate) {
            periodIndex = i;
            break;
          }
        }

        if (periodIndex === -1) continue;

        // Determine grouping key based on mode
        let groupKey = '';
        let groupName = '';
        let groupCode = '';

        if (mode === 'SERVICES') {
          if (entry.service) {
            groupKey = entry.service.id;
            groupName = entry.service.name;
            groupCode = entry.service.code || '';
          } else if (entry.product) {
            groupKey = entry.product.id;
            groupName = entry.product.name;
            groupCode = entry.product.code || '';
          } else {
            groupKey = 'unknown';
            groupName = entry.description || 'Unknown';
            groupCode = '-';
          }
        } else if (mode === 'SERVICE_LINES') {
          if (entry.service?.serviceLine) {
            groupKey = entry.service.serviceLine.id;
            groupName = entry.service.serviceLine.name;
            groupCode = entry.service.serviceLine.code || '';
          } else if (entry.product?.category) {
            groupKey = entry.product.category;
            groupName = entry.product.category;
            groupCode = '-';
          } else {
            groupKey = 'other';
            groupName = 'Other';
            groupCode = '-';
          }
        } else {
          // SERVICE_MODE - Group by type (Product vs Service)
          groupKey = entry.service ? 'service' : 'product';
          groupName = entry.service ? 'Services' : 'Products';
          groupCode = '-';
        }

        if (!groupedData.has(groupKey)) {
          groupedData.set(groupKey, {
            name: groupName,
            code: groupCode,
            amounts: new Array(numberOfPeriods).fill(0),
          });
        }

        const group = groupedData.get(groupKey)!;
        group.amounts[periodIndex] += salesValue;
      }

      // Convert to array format - use 'values' instead of 'amounts' to match component
      const items = Array.from(groupedData.values()).map(group => ({
        name: group.name,
        code: group.code,
        values: group.amounts, // Component expects 'values'
        total: group.amounts.reduce((sum, amt) => sum + amt, 0),
      }));

      // Sort by total descending
      items.sort((a, b) => b.total - a.total);

      // Calculate period totals - use 'totals' to match component
      const totals = periods.map((_, index) => 
        items.reduce((sum, item) => sum + item.values[index], 0)
      );

      const grandTotal = totals.reduce((sum, total) => sum + total, 0);

      return {
        reportType,
        mode,
        periodType,
        periods: periods.map(p => ({
          label: p.label,
          startDate: p.startDate,
          endDate: p.endDate,
        })),
        items, // Component expects 'items'
        totals, // Component expects 'totals'
        grandTotal,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error generating sales levels report:', error);
      throw new Error('Failed to generate sales levels report');
    }
  }

  /**
   * Generate Sales Movement Report
   * Shows sales movements for products/services over a period
   */
  async generateSalesMovementReport(
    startDate: Date,
    endDate: Date,
    dateMode: 'PERIODIC' | 'ON' | 'AS_AT',
    productId?: string
  ): Promise<any> {
    try {
      // Fetch sales entries from API
      const params = new URLSearchParams({
        dateFrom: startDate.toISOString(),
        dateTo: endDate.toISOString(),
        organizationId: DEFAULT_ORGANIZATION_ID,
      });

      if (productId) {
        params.append('productId', productId);
      }

      const response = await fetch(`/api/reports/sales?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch sales report: ${response.statusText}`);
      }

      const result = await response.json();
      const salesEntries = result.data?.salesEntries || [];

      // Process movements based on date mode
      const movements: any[] = [];
      let totalQuantity = 0;
      let totalValue = 0;

      for (const entry of salesEntries) {
        const value = parseFloat(entry.totalWithVat) || parseFloat(entry.salesValue) || 0;
        const quantity = 1; // Default quantity

        movements.push({
          date: new Date(entry.date),
          description: entry.description,
          quantity,
          value,
          salesCode: entry.salesCode,
          productName: entry.product?.name || entry.service?.name || 'N/A',
          client: entry.clientName || entry.customerAccountId || 'N/A', // Use client name if available, fallback to ID
        });

        totalQuantity += quantity;
        totalValue += value;
      }

      // Sort by date
      movements.sort((a, b) => a.date.getTime() - b.date.getTime());

      // Calculate running totals if dateMode is 'AS_AT'
      if (dateMode === 'AS_AT') {
        let runningTotal = 0;
        movements.forEach(m => {
          runningTotal += m.value;
          m.runningTotal = runningTotal;
        });
      }

      return {
        dateMode,
        period: { startDate, endDate },
        productId,
        movements,
        totalQuantity, // Component expects at root level
        totalValue, // Component expects at root level
        summary: {
          totalQuantity,
          totalValue,
          averageValue: movements.length > 0 ? totalValue / movements.length : 0,
          transactionCount: movements.length,
        },
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error generating sales movement report:', error);
      throw new Error('Failed to generate sales movement report');
    }
  }
}

// Export singleton instance
export const apiReportService = ApiReportService.getInstance();
