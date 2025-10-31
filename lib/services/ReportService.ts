/**
 * Report Service
 * 
 * Aggregates data from all services to generate financial reports
 */

import { AccountService } from './AccountService';
import { TransactionService } from './TransactionService';
import { ProductService } from './ProductService';
import { SalesService } from './SalesService';
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
  AgeingAnalysisItem,
  AgeingAnalysisSummary,
  IncomeStatement,
  IncomeStatementLineItem,
  BalanceSheet,
  BalanceSheetLineItem,
  BalanceSheetSubsection,
  BalanceSheetCategory,
  CashFlowStatement,
  CashFlowLineItem,
  ComparativeCashFlowStatement,
  ComparativeCashFlowLineItem,
  InventoryLevelReport,
  InventoryLevelItem,
  InventoryBaseReport,
  InventoryMovementItem,
  SalesLevelsReport,
  SalesLevelsItem,
  SalesLevelsPeriod,
  SalesLevelsTotals,
  EmployeeSalariesReport,
  EmployeesRegisterReport,
  ResourceCommissionsReport,
  PayslipReport,
  SalariesRegisterReport,
  SalesMovementReport,
  SalesMovementItem,
  SalesMovementTotals,
} from '@/types/reports';

export class ReportService {
  private static instance: ReportService;
  private accountService: AccountService;
  private transactionService: TransactionService;
  private productService: ProductService;
  private salesService: SalesService;

  private constructor() {
    this.accountService = AccountService.getInstance();
    this.transactionService = TransactionService.getInstance();
    this.productService = ProductService.getInstance();
    this.salesService = SalesService.getInstance();
  }

  public static getInstance(): ReportService {
    if (!ReportService.instance) {
      ReportService.instance = new ReportService();
    }
    return ReportService.instance;
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

      if (accountType === 'SECONDARY') {
        // Get all secondary accounts
        const hierarchy = await this.accountService.getAccountHierarchy();

        for (const secondary of hierarchy.secondary) {
          if (!secondary.isActive) continue;

          // Get balance for this secondary account
          const balance = await this.accountService.getAccountBalance(
            secondary.id,
            asOfDate
          );

          const debitBalance = balance > 0 ? balance : 0;
          const creditBalance = balance < 0 ? Math.abs(balance) : 0;

          accounts.push({
            accountId: secondary.id,
            accountCode: secondary.code,
            accountName: secondary.name,
            debitBalance,
            creditBalance,
          });

          totalDebits += debitBalance;
          totalCredits += creditBalance;
        }
      } else {
        // Get all holder accounts
        const hierarchy = await this.accountService.getAccountHierarchy();

        for (const holder of hierarchy.holder) {
          if (!holder.isActive) continue;

          // Get balance for this holder account
          const balance = await this.accountService.getAccountBalance(
            holder.id,
            asOfDate
          );

          const debitBalance = balance > 0 ? balance : 0;
          const creditBalance = balance < 0 ? Math.abs(balance) : 0;

          accounts.push({
            accountId: holder.id,
            accountCode: holder.code,
            accountName: holder.name,
            debitBalance,
            creditBalance,
          });

          totalDebits += debitBalance;
          totalCredits += creditBalance;
        }
      }

      // Sort accounts by code
      accounts.sort((a, b) => a.accountCode.localeCompare(b.accountCode));

      // Check if trial balance is balanced (debits = credits)
      const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01; // Allow for rounding errors

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
      // Get account details
      const account = await this.accountService.getHolderAccountById(accountId);
      if (!account) {
        throw new Error('Account not found');
      }

      // Get opening balance (balance before start date)
      const openingBalance = await this.accountService.getAccountBalance(
        accountId,
        new Date(startDate.getTime() - 1)
      );

      // Get all transactions for this account in the period
      const allTransactions = await this.transactionService.getTransactionsByDateRange(
        startDate,
        endDate
      );

      // Filter transactions for this account
      const accountTransactions = allTransactions.filter(
        (t) => t.debitAccountId === accountId || t.creditAccountId === accountId
      );

      // Build transaction list with running balance
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
   * Generate Comparative Account Report
   * Shows account activity across multiple periods (e.g., quarterly)
   * Groups by sub-accounts under a parent account
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
        periodEnd.setDate(0); // Last day of previous month
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
              netAmount += t.amount; // Credit increases revenue
            } else if (t.debitAccountId === holderAccount.id) {
              netAmount -= t.amount; // Debit decreases revenue (returns/discounts)
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
      throw new Error('Failed to generate comparative account report');
    }
  }

  // ==================== Statement of Accounts ====================

  /**
   * Generate Statement of Accounts
   * Similar to Account Report but formatted for client/supplier statements
   */
  async generateStatementOfAccounts(
    accountId: string,
    startDate: Date,
    endDate: Date
  ): Promise<StatementOfAccounts> {
    try {
      // Get account details
      const account = await this.accountService.getHolderAccountById(accountId);
      if (!account) {
        throw new Error('Account not found');
      }

      // Get opening balance
      const openingBalance = await this.accountService.getAccountBalance(
        accountId,
        new Date(startDate.getTime() - 1)
      );

      // Get transactions
      const allTransactions = await this.transactionService.getTransactionsByDateRange(
        startDate,
        endDate
      );

      const accountTransactions = allTransactions.filter(
        (t) => t.debitAccountId === accountId || t.creditAccountId === accountId
      );

      // Build transaction list
      let runningBalance = openingBalance;
      const transactions = accountTransactions.map((t) => {
        const isDebit = t.debitAccountId === accountId;
        const debit = isDebit ? t.amount : 0;
        const credit = !isDebit ? t.amount : 0;

        runningBalance += debit - credit;

        return {
          date: t.date,
          reference: t.number,
          description: t.description,
          debit,
          credit,
          balance: runningBalance,
        };
      });

      return {
        accountId: account.id,
        accountName: account.name,
        period: { startDate, endDate },
        openingBalance,
        transactions,
        closingBalance: runningBalance,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error generating statement of accounts:', error);
      throw new Error('Failed to generate statement of accounts');
    }
  }

  // ==================== Ageing Analysis ====================

  /**
   * Generate Ageing Analysis
   * Shows outstanding invoices grouped by age brackets
   */
  async generateAgeingAnalysis(
    asOfDate: Date,
    accountType: 'RECEIVABLES' | 'PAYABLES' = 'RECEIVABLES'
  ): Promise<AgeingAnalysis> {
    try {
      // Get all sales entries (invoices)
      const allSales = await this.salesService.getSalesEntries();

      const items: AgeingAnalysisItem[] = [];
      const summary: AgeingAnalysisSummary = {
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

      for (const sale of allSales) {
        const invoiceDate = new Date(sale.date);
        const daysDiff = Math.floor((asOfDate.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));

        // Use salesValue with VAT if applicable
        const invoiceAmount = sale.totalWithVat || sale.salesValue;
        // For now, assume unpaid (in real implementation, check payment records)
        const totalPaid = 0;
        const amountOutstanding = invoiceAmount - totalPaid;

        // Skip if fully paid
        if (amountOutstanding <= 0) continue;

        // Categorize by age
        let current = 0;
        let days31to45 = 0;
        let days46to60 = 0;
        let days61to75 = 0;
        let days76to90 = 0;
        let over90days = 0;

        if (daysDiff <= 30) {
          current = amountOutstanding;
        } else if (daysDiff <= 45) {
          days31to45 = amountOutstanding;
        } else if (daysDiff <= 60) {
          days46to60 = amountOutstanding;
        } else if (daysDiff <= 75) {
          days61to75 = amountOutstanding;
        } else if (daysDiff <= 90) {
          days76to90 = amountOutstanding;
        } else {
          over90days = amountOutstanding;
        }

        items.push({
          salesCode: sale.salesCode,
          invoiceNumber: sale.invoiceNumber || sale.salesTransactionNumber,
          clientName: sale.customerAccountId,
          date: invoiceDate,
          invoiceAmount,
          totalPaid,
          amountOutstanding,
          current,
          days31to45,
          days46to60,
          days61to75,
          days76to90,
          over90days,
        });

        // Update summary
        summary.totalInvoiceAmount += invoiceAmount;
        summary.totalPaid += totalPaid;
        summary.totalOutstanding += amountOutstanding;
        summary.current += current;
        summary.days31to45 += days31to45;
        summary.days46to60 += days46to60;
        summary.days61to75 += days61to75;
        summary.days76to90 += days76to90;
        summary.over90days += over90days;
      }

      // Sort by date (oldest first)
      items.sort((a, b) => a.date.getTime() - b.date.getTime());

      return {
        asOfDate,
        accountType,
        items,
        summary,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error generating ageing analysis:', error);
      throw new Error('Failed to generate ageing analysis');
    }
  }

  // ==================== Petty Cash Analysis ====================

  /**
   * Generate Petty Cash Analysis
   * Shows petty cash transactions for a specific month
   */
  async generatePettyCashAnalysis(
    month: number,
    year: number
  ): Promise<PettyCashAnalysis> {
    try {
      // Find petty cash account
      const hierarchy = await this.accountService.getAccountHierarchy();
      const pettyCashAccount = hierarchy.holder.find(
        (h) => h.name.toLowerCase().includes('petty cash')
      );

      if (!pettyCashAccount) {
        throw new Error('Petty cash account not found. Please create a holder account with "Petty Cash" in the name.');
      }

      // Calculate date range for the month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      // Get opening balance (end of previous month)
      const openingBalance = await this.accountService.getAccountBalance(
        pettyCashAccount.id,
        new Date(startDate.getTime() - 1)
      );

      // Get transactions for the month
      const allTransactions = await this.transactionService.getTransactionsByDateRange(
        startDate,
        endDate
      );

      const pettyCashTransactions = allTransactions.filter(
        (t) =>
          t.debitAccountId === pettyCashAccount.id ||
          t.creditAccountId === pettyCashAccount.id
      );

      // Separate receipts and payments
      const receipts = pettyCashTransactions
        .filter((t) => t.debitAccountId === pettyCashAccount.id)
        .map((t) => ({
          date: t.date,
          description: t.description,
          amount: t.amount,
          category: t.metadata?.category as string | undefined,
        }));

      const payments = pettyCashTransactions
        .filter((t) => t.creditAccountId === pettyCashAccount.id)
        .map((t) => ({
          date: t.date,
          description: t.description,
          amount: t.amount,
          category: t.metadata?.category as string | undefined,
        }));

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
      throw new Error('Failed to generate petty cash analysis');
    }
  }

  // ==================== Income Statement ====================

  /**
   * Generate Income Statement
   * Shows detailed revenue, expenses, and profit/loss for a period
   * Format: Revenue -> Direct Costs -> Gross Profit -> Operating Expenses -> EBITDA -> EBIT -> PBT -> PAT
   */
  async generateIncomeStatement(
    startDate: Date,
    endDate: Date
  ): Promise<IncomeStatement> {
    try {
      // Get all transactions in the period
      const transactions = await this.transactionService.getTransactionsByDateRange(
        startDate,
        endDate
      );

      // Get account hierarchy
      const hierarchy = await this.accountService.getAccountHierarchy();

      // Helper to calculate amount for accounts matching keywords
      const calculateByKeywords = (keywords: string[], isRevenue: boolean = false): {
        total: number;
        details: IncomeStatementLineItem[];
      } => {
        const details: IncomeStatementLineItem[] = [];
        let total = 0;

        hierarchy.holder.forEach((account) => {
          if (!account.isActive) return;

          const accountNameLower = account.name.toLowerCase();
          // Use word boundary matching to avoid false positives
          // e.g., "sales" in "Sales Revenue" shouldn't match "salaries"
          const matches = keywords.some((keyword) => {
            const keywordLower = keyword.toLowerCase();
            // Check if keyword appears as a whole word or at word boundaries
            const regex = new RegExp(`\\b${keywordLower}\\b`, 'i');
            return regex.test(accountNameLower);
          });

          if (matches) {
            const amount = transactions
              .filter((t) =>
                isRevenue
                  ? t.creditAccountId === account.id
                  : t.debitAccountId === account.id
              )
              .reduce((sum, t) => sum + t.amount, 0);

            if (amount > 0) {
              details.push({
                accountId: account.id,
                accountName: account.name,
                amount,
              });
              total += amount;
            }
          }
        });

        return { total, details };
      };

      // Calculate Revenue
      const revenue = calculateByKeywords(['revenue', 'sales', 'income'], true);

      // Calculate Direct Costs
      const directCosts = calculateByKeywords(['direct cost', 'cost of sales', 'cost of goods sold', 'cogs']);

      // Calculate Gross Profit
      const grossProfit = revenue.total - directCosts.total;

      // Calculate Other Income
      const otherIncome = calculateByKeywords(['other income', 'miscellaneous income'], true);

      // Calculate Operating Expenses (Detailed)
      const staffCost = calculateByKeywords(['staff', 'salary', 'salaries', 'wage', 'wages', 'payroll', 'employee']);
      const rentalCost = calculateByKeywords(['rent', 'rental', 'lease']);
      const sellingGeneralAdmin = calculateByKeywords(['admin', 'general', 'selling', 'office']);
      const marketingAdvertising = calculateByKeywords(['marketing', 'advertis', 'promotion']);
      const taxesLevies = calculateByKeywords(['tax', 'levy', 'levies', 'duty']);
      const giftsPromotions = calculateByKeywords(['gift', 'donation', 'promotional']);

      // Other operating expenses (expenses not categorized above)
      const categorizedExpenseKeywords = [
        'staff', 'salary', 'salaries', 'wage', 'wages', 'payroll', 'employee',
        'rent', 'rental', 'lease',
        'admin', 'general', 'selling', 'office',
        'marketing', 'advertis', 'promotion',
        'tax', 'levy', 'levies', 'duty',
        'gift', 'donation', 'promotional',
        'direct cost', 'cost of sales', 'cost of goods sold', 'cogs',
        'depreciation', 'amortization',
        'interest',
        'revenue', 'sales', 'income' // Exclude revenue accounts from operating expenses
      ];

      const otherOperatingExpenses: { total: number; details: IncomeStatementLineItem[] } = {
        total: 0,
        details: [],
      };

      hierarchy.holder.forEach((account) => {
        if (!account.isActive) return;

        const accountNameLower = account.name.toLowerCase();
        // Use word boundary matching to check if account is categorized
        const isCategorized = categorizedExpenseKeywords.some((keyword) => {
          const keywordLower = keyword.toLowerCase();
          const regex = new RegExp(`\\b${keywordLower}\\b`, 'i');
          return regex.test(accountNameLower);
        });

        if (!isCategorized) {
          const amount = transactions
            .filter((t) => t.debitAccountId === account.id)
            .reduce((sum, t) => sum + t.amount, 0);

          if (amount > 0) {
            otherOperatingExpenses.details.push({
              accountId: account.id,
              accountName: account.name,
              amount,
            });
            otherOperatingExpenses.total += amount;
          }
        }
      });

      // Calculate Total Operating Expenses
      const totalOperatingExpenses =
        staffCost.total +
        rentalCost.total +
        sellingGeneralAdmin.total +
        marketingAdvertising.total +
        taxesLevies.total +
        giftsPromotions.total +
        otherOperatingExpenses.total;

      // Calculate EBITDA
      const ebitda = grossProfit + otherIncome.total - totalOperatingExpenses;

      // Calculate Depreciation & Amortization
      const depreciationAmortization = calculateByKeywords(['depreciation', 'amortization']);

      // Calculate EBIT
      const ebit = ebitda - depreciationAmortization.total;

      // Calculate Interest
      const interestIncome = calculateByKeywords(['interest income', 'interest receivable'], true);
      const interestExpense = calculateByKeywords(['interest expense', 'interest payable']);

      // Calculate Net Interest Charges
      const netInterestCharges = interestIncome.total - interestExpense.total;

      // Calculate Profit Before Tax
      const profitBeforeTax = ebit + netInterestCharges;

      // Calculate Tax Expenses
      const taxExpenses = calculateByKeywords(['income tax', 'tax expense', 'corporate tax']);

      // Calculate Profit After Tax
      const profitAfterTax = profitBeforeTax - taxExpenses.total;

      return {
        period: { startDate, endDate },

        revenue: revenue.total,
        revenueDetails: revenue.details,

        directCosts: directCosts.total,
        directCostsDetails: directCosts.details,

        grossProfit,

        otherIncome: otherIncome.total,
        otherIncomeDetails: otherIncome.details,

        staffCost: staffCost.total,
        staffCostDetails: staffCost.details,

        rentalCost: rentalCost.total,
        rentalCostDetails: rentalCost.details,

        sellingGeneralAdmin: sellingGeneralAdmin.total,
        sellingGeneralAdminDetails: sellingGeneralAdmin.details,

        marketingAdvertising: marketingAdvertising.total,
        marketingAdvertisingDetails: marketingAdvertising.details,

        taxesLevies: taxesLevies.total,
        taxesLeviesDetails: taxesLevies.details,

        giftsPromotions: giftsPromotions.total,
        giftsPromotionsDetails: giftsPromotions.details,

        otherOperatingExpenses: otherOperatingExpenses.total,
        otherOperatingExpensesDetails: otherOperatingExpenses.details,

        totalOperatingExpenses,

        ebitda,

        depreciationAmortization: depreciationAmortization.total,
        depreciationAmortizationDetails: depreciationAmortization.details,

        ebit,

        interestIncome: interestIncome.total,
        interestIncomeDetails: interestIncome.details,

        interestExpense: interestExpense.total,
        interestExpenseDetails: interestExpense.details,

        netInterestCharges,

        profitBeforeTax,

        taxExpenses: taxExpenses.total,
        taxExpensesDetails: taxExpenses.details,

        profitAfterTax,

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
   * Shows ALL assets, liabilities, and equity accounts as of a specific date
   */
  async generateBalanceSheet(asOfDate: Date): Promise<BalanceSheet> {
    try {
      const hierarchy = await this.accountService.getAccountHierarchy();

      // Get all primary accounts to determine account types
      const primaryAccounts = await this.accountService.getPrimaryAccounts();

      // Helper to get ALL accounts by primary account type
      const getAllAccountsByType = (primaryType: 'ASSETS' | 'LIABILITIES' | 'EQUITY'): BalanceSheetLineItem[] => {
        const items: BalanceSheetLineItem[] = [];

        // Get primary accounts of this type
        const relevantPrimaries = primaryAccounts.filter(p => p.type === primaryType && p.isActive);
        const primaryIds = relevantPrimaries.map(p => p.id);

        // Get all secondary accounts under these primaries
        hierarchy.secondary.forEach((secondary) => {
          if (!secondary.isActive || !primaryIds.includes(secondary.primaryAccountId)) return;

          // Get all holder accounts under this secondary
          hierarchy.holder.forEach((holder) => {
            if (!holder.isActive || holder.secondaryAccountId !== secondary.id) return;

            const balance = this.accountService.getAccountBalanceSync(holder.id, asOfDate);
            if (Math.abs(balance) > 0.01) {
              items.push({
                accountId: holder.id,
                accountName: holder.name,
                amount: Math.abs(balance),
              });
            }
          });
        });

        return items;
      };

      // Helper to categorize accounts by keywords within a type
      const categorizeAccounts = (accounts: BalanceSheetLineItem[], keywords: string[]): BalanceSheetLineItem[] => {
        return accounts.filter(account => {
          const accountNameLower = account.accountName.toLowerCase();
          return keywords.some((keyword) => {
            const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'i');
            return regex.test(accountNameLower);
          });
        });
      };

      // ASSETS - Get ALL asset accounts with detailed categorization
      const allAssetAccounts = getAllAccountsByType('ASSETS');

      // Current Assets - Create categories
      const cashBankAccounts = categorizeAccounts(allAssetAccounts, ['cash', 'bank']);
      const accountsReceivableAccounts = categorizeAccounts(allAssetAccounts, ['receivable', 'debtor']);
      const shortTermInvestmentsAccounts = categorizeAccounts(allAssetAccounts, ['short-term investment', 'short term investment']);
      const shortTermAdvancesAccounts = categorizeAccounts(allAssetAccounts, ['short-term advance', 'short term advance']);
      const inventoryAccounts = categorizeAccounts(allAssetAccounts, ['inventory', 'stock']);

      // Other current assets (not in above categories)
      const categorizedCurrentIds = new Set([
        ...cashBankAccounts.map(a => a.accountId),
        ...accountsReceivableAccounts.map(a => a.accountId),
        ...shortTermInvestmentsAccounts.map(a => a.accountId),
        ...shortTermAdvancesAccounts.map(a => a.accountId),
        ...inventoryAccounts.map(a => a.accountId),
      ]);
      const otherCurrentAssetsAccounts = categorizeAccounts(allAssetAccounts, ['prepaid', 'current asset', 'other current'])
        .filter(a => !categorizedCurrentIds.has(a.accountId));

      const currentAssetCategories: BalanceSheetCategory[] = [
        { title: 'Cash & Bank Balances', lineItems: cashBankAccounts, subtotal: cashBankAccounts.reduce((s, i) => s + i.amount, 0) },
        { title: 'Accounts Receivable', lineItems: accountsReceivableAccounts, subtotal: accountsReceivableAccounts.reduce((s, i) => s + i.amount, 0) },
        { title: 'Short-term Investments', lineItems: shortTermInvestmentsAccounts, subtotal: shortTermInvestmentsAccounts.reduce((s, i) => s + i.amount, 0) },
        { title: 'Short-term Advances', lineItems: shortTermAdvancesAccounts, subtotal: shortTermAdvancesAccounts.reduce((s, i) => s + i.amount, 0) },
        { title: 'Inventory', lineItems: inventoryAccounts, subtotal: inventoryAccounts.reduce((s, i) => s + i.amount, 0) },
        { title: 'Other Current Assets', lineItems: otherCurrentAssetsAccounts, subtotal: otherCurrentAssetsAccounts.reduce((s, i) => s + i.amount, 0) },
      ].filter(cat => cat.lineItems.length > 0);

      // Non-current Assets - Create categories
      const ppeAccounts = categorizeAccounts(allAssetAccounts, ['property', 'plant', 'equipment', 'fixed asset', 'building', 'land', 'vehicle', 'furniture']);
      const intangibleAccounts = categorizeAccounts(allAssetAccounts, ['intangible', 'goodwill', 'patent', 'trademark', 'copyright']);
      const deferredTaxAssetAccounts = categorizeAccounts(allAssetAccounts, ['deferred tax asset']);

      // Other non-current assets
      const categorizedNonCurrentIds = new Set([
        ...cashBankAccounts.map(a => a.accountId),
        ...accountsReceivableAccounts.map(a => a.accountId),
        ...shortTermInvestmentsAccounts.map(a => a.accountId),
        ...shortTermAdvancesAccounts.map(a => a.accountId),
        ...inventoryAccounts.map(a => a.accountId),
        ...otherCurrentAssetsAccounts.map(a => a.accountId),
        ...ppeAccounts.map(a => a.accountId),
        ...intangibleAccounts.map(a => a.accountId),
        ...deferredTaxAssetAccounts.map(a => a.accountId),
      ]);
      const otherNonCurrentAssetsAccounts = allAssetAccounts.filter(a => !categorizedNonCurrentIds.has(a.accountId));

      const nonCurrentAssetCategories: BalanceSheetCategory[] = [
        { title: 'Property, Plant & Equipment', lineItems: ppeAccounts, subtotal: ppeAccounts.reduce((s, i) => s + i.amount, 0) },
        { title: 'Intangible Assets', lineItems: intangibleAccounts, subtotal: intangibleAccounts.reduce((s, i) => s + i.amount, 0) },
        { title: 'Deferred Tax Asset', lineItems: deferredTaxAssetAccounts, subtotal: deferredTaxAssetAccounts.reduce((s, i) => s + i.amount, 0) },
        { title: 'Other Non-current Assets', lineItems: otherNonCurrentAssetsAccounts, subtotal: otherNonCurrentAssetsAccounts.reduce((s, i) => s + i.amount, 0) },
      ].filter(cat => cat.lineItems.length > 0);

      const currentAssets: BalanceSheetSubsection = {
        title: 'Current Assets',
        categories: currentAssetCategories,
        lineItems: [],
        subtotal: currentAssetCategories.reduce((sum, cat) => sum + cat.subtotal, 0),
      };

      const nonCurrentAssets: BalanceSheetSubsection = {
        title: 'Non-current Assets',
        categories: nonCurrentAssetCategories,
        lineItems: [],
        subtotal: nonCurrentAssetCategories.reduce((sum, cat) => sum + cat.subtotal, 0),
      };

      const totalAssets = currentAssets.subtotal + nonCurrentAssets.subtotal;

      // LIABILITIES - Get ALL liability accounts with detailed categorization
      const allLiabilityAccounts = getAllAccountsByType('LIABILITIES');

      // Current Liabilities - Create categories
      const accountsPayableAccounts = categorizeAccounts(allLiabilityAccounts, ['payable', 'creditor']);
      const taxPayableAccounts = categorizeAccounts(allLiabilityAccounts, ['tax payable', 'income tax payable', 'vat payable']);
      const accrualsAccounts = categorizeAccounts(allLiabilityAccounts, ['accrual', 'accrued']);
      const shortTermDebtAccounts = categorizeAccounts(allLiabilityAccounts, ['short-term debt', 'short term debt', 'current portion']);

      // Other current liabilities
      const categorizedCurrentLiabIds = new Set([
        ...accountsPayableAccounts.map(a => a.accountId),
        ...taxPayableAccounts.map(a => a.accountId),
        ...accrualsAccounts.map(a => a.accountId),
        ...shortTermDebtAccounts.map(a => a.accountId),
      ]);
      const otherCurrentLiabilitiesAccounts = categorizeAccounts(allLiabilityAccounts, ['current liabilit', 'other current'])
        .filter(a => !categorizedCurrentLiabIds.has(a.accountId));

      const currentLiabilityCategories: BalanceSheetCategory[] = [
        { title: 'Accounts Payable', lineItems: accountsPayableAccounts, subtotal: accountsPayableAccounts.reduce((s, i) => s + i.amount, 0) },
        { title: 'Tax Payable', lineItems: taxPayableAccounts, subtotal: taxPayableAccounts.reduce((s, i) => s + i.amount, 0) },
        { title: 'Accruals', lineItems: accrualsAccounts, subtotal: accrualsAccounts.reduce((s, i) => s + i.amount, 0) },
        { title: 'Short-term Debt', lineItems: shortTermDebtAccounts, subtotal: shortTermDebtAccounts.reduce((s, i) => s + i.amount, 0) },
        { title: 'Other Current Liabilities', lineItems: otherCurrentLiabilitiesAccounts, subtotal: otherCurrentLiabilitiesAccounts.reduce((s, i) => s + i.amount, 0) },
      ].filter(cat => cat.lineItems.length > 0);

      // Non-current Liabilities - Create categories
      const longTermDebtAccounts = categorizeAccounts(allLiabilityAccounts, ['long-term debt', 'long term debt', 'bonds payable', 'loan']);
      const deferredTaxLiabilityAccounts = categorizeAccounts(allLiabilityAccounts, ['deferred tax liabilit']);
      const shareholdersLoanAccounts = categorizeAccounts(allLiabilityAccounts, ['shareholders loan', 'shareholder loan']);

      // Other non-current liabilities
      const categorizedNonCurrentLiabIds = new Set([
        ...accountsPayableAccounts.map(a => a.accountId),
        ...taxPayableAccounts.map(a => a.accountId),
        ...accrualsAccounts.map(a => a.accountId),
        ...shortTermDebtAccounts.map(a => a.accountId),
        ...otherCurrentLiabilitiesAccounts.map(a => a.accountId),
        ...longTermDebtAccounts.map(a => a.accountId),
        ...deferredTaxLiabilityAccounts.map(a => a.accountId),
        ...shareholdersLoanAccounts.map(a => a.accountId),
      ]);
      const otherNonCurrentLiabilitiesAccounts = allLiabilityAccounts.filter(a => !categorizedNonCurrentLiabIds.has(a.accountId));

      const nonCurrentLiabilityCategories: BalanceSheetCategory[] = [
        { title: 'Long-term Debt', lineItems: longTermDebtAccounts, subtotal: longTermDebtAccounts.reduce((s, i) => s + i.amount, 0) },
        { title: 'Deferred Tax Liability', lineItems: deferredTaxLiabilityAccounts, subtotal: deferredTaxLiabilityAccounts.reduce((s, i) => s + i.amount, 0) },
        { title: 'Shareholders Loan', lineItems: shareholdersLoanAccounts, subtotal: shareholdersLoanAccounts.reduce((s, i) => s + i.amount, 0) },
        { title: 'Other Non-current Liabilities', lineItems: otherNonCurrentLiabilitiesAccounts, subtotal: otherNonCurrentLiabilitiesAccounts.reduce((s, i) => s + i.amount, 0) },
      ].filter(cat => cat.lineItems.length > 0);

      const currentLiabilities: BalanceSheetSubsection = {
        title: 'Current Liabilities',
        categories: currentLiabilityCategories,
        lineItems: [],
        subtotal: currentLiabilityCategories.reduce((sum, cat) => sum + cat.subtotal, 0),
      };

      const nonCurrentLiabilities: BalanceSheetSubsection = {
        title: 'Non-current Liabilities',
        categories: nonCurrentLiabilityCategories,
        lineItems: [],
        subtotal: nonCurrentLiabilityCategories.reduce((sum, cat) => sum + cat.subtotal, 0),
      };

      const totalLiabilities = currentLiabilities.subtotal + nonCurrentLiabilities.subtotal;

      // EQUITY - Get ALL equity accounts with detailed categorization
      const allEquityAccounts = getAllAccountsByType('EQUITY');

      // Equity - Create categories
      const statedCapitalAccounts = categorizeAccounts(allEquityAccounts, ['stated capital', 'share capital', 'common stock', 'capital stock']);
      const shareholdersAccountAccounts = categorizeAccounts(allEquityAccounts, ['shareholders account', 'shareholder account', 'directors account']);
      const retainedEarningsAccounts = categorizeAccounts(allEquityAccounts, ['retained earnings', 'accumulated profit', 'accumulated loss']);

      // Other equity accounts
      const categorizedEquityIds = new Set([
        ...statedCapitalAccounts.map(a => a.accountId),
        ...shareholdersAccountAccounts.map(a => a.accountId),
        ...retainedEarningsAccounts.map(a => a.accountId),
      ]);
      const otherEquityAccounts = allEquityAccounts.filter(a => !categorizedEquityIds.has(a.accountId));

      const equityCategories: BalanceSheetCategory[] = [
        { title: 'Stated Capital', lineItems: statedCapitalAccounts, subtotal: statedCapitalAccounts.reduce((s, i) => s + i.amount, 0) },
        { title: 'Shareholders Account', lineItems: shareholdersAccountAccounts, subtotal: shareholdersAccountAccounts.reduce((s, i) => s + i.amount, 0) },
        { title: 'Retained Earnings', lineItems: retainedEarningsAccounts, subtotal: retainedEarningsAccounts.reduce((s, i) => s + i.amount, 0) },
        { title: 'Other Equity', lineItems: otherEquityAccounts, subtotal: otherEquityAccounts.reduce((s, i) => s + i.amount, 0) },
      ].filter(cat => cat.lineItems.length > 0);

      const equity: BalanceSheetSubsection = {
        title: 'Shareholders Equity',
        categories: equityCategories,
        lineItems: [],
        subtotal: equityCategories.reduce((sum, cat) => sum + cat.subtotal, 0),
      };

      const totalEquity = equity.subtotal;

      return {
        asOfDate,
        assets: {
          title: 'Assets',
          subsections: [currentAssets, nonCurrentAssets],
          total: totalAssets,
        },
        liabilities: {
          title: 'Liabilities',
          subsections: [currentLiabilities, nonCurrentLiabilities],
          total: totalLiabilities,
        },
        equity: {
          title: 'Shareholders Equity',
          subsections: [equity],
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
      const hierarchy = await this.accountService.getAccountHierarchy();
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
            const openingBalance = this.accountService.getAccountBalanceSync(
              account.id,
              new Date(startDate.getTime() - 1)
            );
            const closingBalance = this.accountService.getAccountBalanceSync(account.id, endDate);
            total += closingBalance - openingBalance;
          }
        });

        return total;
      };

      // Get EBIT from income statement
      const incomeStatement = await this.generateIncomeStatement(startDate, endDate);
      const ebit = incomeStatement.ebit;

      // OPERATING ACTIVITIES
      const operatingItems: CashFlowLineItem[] = [
        { description: 'EBIT', amount: ebit },
        { description: 'Adjustment for Depreciation & Amortization', amount: incomeStatement.depreciationAmortization },
      ];

      // Working capital changes (negative = cash outflow for assets, positive = cash inflow)
      const shortTermInvestmentsChange = -calculateMovement(['short-term investment', 'short term investment']);
      const accountsReceivableChange = -calculateMovement(['accounts receivable', 'receivable', 'debtors']);
      const shortTermAdvancesChange = -calculateMovement(['short-term advance', 'short term advance']);
      const otherCurrentAssetsChange = -calculateMovement(['other current asset', 'prepaid']);
      const accountsPayableChange = calculateMovement(['accounts payable', 'payable', 'creditors']);
      const taxPayableChange = calculateMovement(['tax payable']);
      const accrualsChange = calculateMovement(['accrual', 'accrued']);
      const otherCurrentLiabilitiesChange = calculateMovement(['other current liabilit']);

      operatingItems.push(
        { description: 'Short-term investments', amount: shortTermInvestmentsChange },
        { description: 'Accounts Receivable', amount: accountsReceivableChange },
        { description: 'Short-term advances', amount: shortTermAdvancesChange },
        { description: 'Other Current Assets', amount: otherCurrentAssetsChange },
        { description: 'Accounts Payable', amount: accountsPayableChange },
        { description: 'Tax Payable', amount: taxPayableChange },
        { description: 'Accruals', amount: accrualsChange },
        { description: 'Other Current Liabilities', amount: otherCurrentLiabilitiesChange },
        { description: 'Tax Paid', amount: -incomeStatement.taxExpenses }
      );

      const netCashFromOperating = operatingItems.reduce((sum, item) => sum + item.amount, 0);

      // INVESTING ACTIVITIES
      const ppeChange = -calculateMovement(['property', 'plant', 'equipment', 'fixed asset']);
      const intangiblesChange = -calculateMovement(['intangible', 'goodwill', 'patent']);
      const otherNonCurrentAssetsChange = -calculateMovement(['long-term investment', 'other non-current asset']);

      const investingItems: CashFlowLineItem[] = [
        { description: 'Purchase of Property, Plant & Equipment', amount: ppeChange },
        { description: 'Purchase of Intangible Assets', amount: intangiblesChange },
        { description: 'Investment in Other Non-current Assets', amount: otherNonCurrentAssetsChange },
      ];

      const netCashFromInvesting = investingItems.reduce((sum, item) => sum + item.amount, 0);

      // FINANCING ACTIVITIES
      const equityChange = calculateMovement(['stated capital', 'share capital', 'common stock']);
      const shareholdersAccountChange = calculateMovement(['shareholders account', 'shareholder account']);
      const shareholdersLoanChange = calculateMovement(['shareholders loan', 'shareholder loan']);
      const longTermDebtChange = calculateMovement(['long-term debt', 'long term debt', 'bonds payable']);
      const otherNonCurrentLiabilitiesChange = calculateMovement(['other non-current liabilit']);
      const shortTermDebtChange = calculateMovement(['short-term debt', 'short term debt']);

      const financingItems: CashFlowLineItem[] = [
        { description: 'Shareholders Equity Injection', amount: equityChange },
        { description: 'Movement in Shareholders Account', amount: shareholdersAccountChange },
        { description: 'Movement in Shareholders Loan', amount: shareholdersLoanChange },
        { description: 'Drawdown of Long-term Debt', amount: Math.max(0, longTermDebtChange) },
        { description: 'Repayment of Long-term Debt', amount: Math.min(0, longTermDebtChange) },
        { description: 'Movement in Other Non-Current Liabilities', amount: otherNonCurrentLiabilitiesChange },
        { description: 'Movement in Short-term Debt', amount: shortTermDebtChange },
        { description: 'Net Interest Charges', amount: -incomeStatement.netInterestCharges },
        { description: 'Dividend Paid', amount: 0 }, // TODO: Track dividends
      ];

      const netCashFromFinancing = financingItems.reduce((sum, item) => sum + item.amount, 0);

      // Calculate net cash flow
      const netCashFlow = netCashFromOperating + netCashFromInvesting + netCashFromFinancing;

      // Get beginning and ending cash balances
      const beginningCash = this.accountService.getAccountBalanceSync(
        hierarchy.holder.find((h) => h.name.toLowerCase().includes('cash') || h.name.toLowerCase().includes('bank'))?.id || '',
        new Date(startDate.getTime() - 1)
      );
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
   * Shows cash flows side-by-side for multiple periods (month-by-month or year-by-year)
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

      // Build comparative line items for operating activities
      allOperatingDescriptions.forEach(description => {
        const amounts = cashFlowStatements.map(cf => {
          const item = cf.operatingActivities.lineItems.find(li => li.description === description);
          return item ? item.amount : 0;
        });
        operatingLineItems.push({ description, amounts });
      });

      // Build comparative line items for investing activities
      allInvestingDescriptions.forEach(description => {
        const amounts = cashFlowStatements.map(cf => {
          const item = cf.investingActivities.lineItems.find(li => li.description === description);
          return item ? item.amount : 0;
        });
        investingLineItems.push({ description, amounts });
      });

      // Build comparative line items for financing activities
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

  // ==================== Inventory Reports ====================

  /**
   * Generate Inventory Level Report
   * Shows current inventory levels and values
   */
  async generateInventoryLevelReport(
    reportDate: Date,
    reportType: 'ON_DATE' | 'AS_AT_DATE' | 'PERIOD' = 'AS_AT_DATE',
    period?: { startDate: Date; endDate: Date }
  ): Promise<InventoryLevelReport> {
    try {
      const products = await this.productService.getProducts();
      const items: InventoryLevelItem[] = [];
      let totalValue = 0;

      for (const product of products) {
        if (!product.isActive) continue;

        // Get current quantity from product
        const quantity = product.quantityOnHand || 0;
        const averageCost = product.costPrice || 0;
        const value = quantity * averageCost;

        if (quantity > 0 || reportType === 'PERIOD') {
          items.push({
            productId: product.id,
            productCode: product.code,
            productName: product.name,
            quantity,
            averageCost,
            totalValue: value,
          });

          totalValue += value;
        }
      }

      // Sort by product code
      items.sort((a, b) => a.productCode.localeCompare(b.productCode));

      return {
        reportDate,
        reportType,
        period,
        products: items,
        totalValue,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error generating inventory level report:', error);
      throw new Error('Failed to generate inventory level report');
    }
  }

  /**
   * Generate Inventory Movement Report
   * Shows purchases, sales, or all movements for products
   */
  async generateInventoryMovementReport(
    category: 'PURCHASES' | 'SALES' | 'MOVEMENTS',
    startDate: Date,
    endDate: Date,
    productId?: string
  ): Promise<InventoryBaseReport> {
    try {
      const movements: InventoryMovementItem[] = [];
      let totalQuantity = 0;
      let totalValue = 0;

      if (category === 'PURCHASES' || category === 'MOVEMENTS') {
        // Get purchase transactions
        const transactions = await this.transactionService.getTransactionsByDateRange(
          startDate,
          endDate
        );

        // Filter for purchase-related transactions
        const purchaseTransactions = transactions.filter((t) => {
          const desc = t.description.toLowerCase();
          return desc.includes('purchase') || desc.includes('inventory');
        });

        for (const transaction of purchaseTransactions) {
          if (productId && transaction.metadata?.productId !== productId) continue;

          const quantity = transaction.metadata?.quantity as number || 0;
          const unitCost = transaction.metadata?.unitCost as number || 0;

          movements.push({
            date: transaction.date,
            referenceNumber: transaction.number,
            description: transaction.description,
            type: 'PURCHASE',
            quantity,
            unitCost,
            totalCost: quantity * unitCost,
          });

          totalQuantity += quantity;
          totalValue += quantity * unitCost;
        }
      }

      if (category === 'SALES' || category === 'MOVEMENTS') {
        // Get sales entries
        const allSales = await this.salesService.getSalesEntries();
        const salesInPeriod = allSales.filter(
          (s) => s.date >= startDate && s.date <= endDate
        );

        for (const sale of salesInPeriod) {
          if (productId && sale.productId !== productId) continue;

          movements.push({
            date: sale.date,
            referenceNumber: sale.invoiceNumber || sale.salesTransactionNumber,
            description: `Sale: ${sale.description}`,
            type: 'SALE',
            quantity: 1, // SalesEntry doesn't have quantity field
            unitCost: sale.salesValue,
            totalCost: sale.salesValue,
          });

          totalQuantity += 1;
          totalValue += sale.salesValue;
        }
      }

      // Sort by date
      movements.sort((a, b) => a.date.getTime() - b.date.getTime());

      // Get product name if filtering by product
      let productName: string | undefined;
      if (productId) {
        const product = await this.productService.getProductById(productId);
        productName = product?.name;
      }

      return {
        category,
        productId,
        productName,
        reportType: 'PERIOD',
        period: { startDate, endDate },
        movements,
        totalQuantity,
        totalValue,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error generating inventory movement report:', error);
      throw new Error('Failed to generate inventory movement report');
    }
  }

  // ==================== Sales Reports ====================

  /**
   * Generate Sales Levels Report (P-Levels or G-Levels)
   * P-Levels: Product/Service level detail
   * G-Levels: Grouped by service lines
   */
  async generateSalesLevelsReport(
    reportType: 'P_LEVELS' | 'G_LEVELS',
    mode: 'SERVICE_MODE' | 'SERVICE_LINES' | 'SERVICES',
    startDate: Date,
    numberOfPeriods: number,
    periodType: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUALLY' | 'ANNUALLY'
  ): Promise<any> {
    try {
      // Get all sales entries
      const allSales = await this.salesService.getSalesEntries();

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

      // Group sales by service/product
      const serviceMap = new Map<string, number[]>();

      for (const sale of allSales) {
        const saleDate = new Date(sale.date);
        const serviceName = sale.description || 'Unknown Service';

        if (!serviceMap.has(serviceName)) {
          serviceMap.set(serviceName, new Array(numberOfPeriods).fill(0));
        }

        // Find which period this sale belongs to
        for (let i = 0; i < periods.length; i++) {
          if (saleDate >= periods[i].startDate && saleDate <= periods[i].endDate) {
            const values = serviceMap.get(serviceName)!;
            values[i] += sale.totalWithVat || sale.salesValue;
            break;
          }
        }
      }

      // Convert to items array
      const items = Array.from(serviceMap.entries()).map(([name, values]) => ({
        name,
        values,
      }));

      // Calculate totals for each period
      const totals = new Array(numberOfPeriods).fill(0);
      for (const item of items) {
        for (let i = 0; i < numberOfPeriods; i++) {
          totals[i] += item.values[i];
        }
      }

      return {
        reportType,
        mode,
        periodType,
        periods,
        items,
        totals,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error generating sales levels report:', error);
      throw new Error('Failed to generate sales levels report');
    }
  }

  /**
   * Generate Sales Movement Report
   * Shows detailed sales transactions
   */
  async generateSalesMovementReport(
    startDate: Date,
    endDate: Date,
    dateMode: 'PERIODIC' | 'ON' | 'AS_AT',
    productId?: string
  ): Promise<any> {
    try {
      // Get all sales entries
      const allSales = await this.salesService.getSalesEntries();

      // Filter by date range
      let salesInPeriod = allSales.filter(s => s.date >= startDate && s.date <= endDate);

      // Filter by product if specified
      if (productId) {
        salesInPeriod = salesInPeriod.filter(s => s.productId === productId);
      }

      const movements: any[] = [];
      let totalQuantity = 0;
      let totalValue = 0;

      for (const sale of salesInPeriod) {
        const quantity = 1; // SalesEntry doesn't have quantity
        const value = sale.totalWithVat || sale.salesValue;

        movements.push({
          date: sale.date,
          description: sale.description,
          quantity,
          value,
          salesCode: sale.salesCode,
          client: sale.customerAccountId,
        });

        totalQuantity += quantity;
        totalValue += value;
      }

      // Sort by date
      movements.sort((a, b) => a.date.getTime() - b.date.getTime());

      return {
        period: { startDate, endDate },
        dateMode,
        movements,
        totalQuantity,
        totalValue,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error generating sales movement report:', error);
      throw new Error('Failed to generate sales movement report');
    }
  }

  /**
   * Helper: Extract service line from description
   */
  private extractServiceLine(description: string): string {
    // Simple extraction logic - can be enhanced
    if (description.toLowerCase().includes('consulting')) return 'Analytics Consulting';
    if (description.toLowerCase().includes('solution')) return 'Analytics Solutions';
    if (description.toLowerCase().includes('training')) return 'Analytics Training';
    if (description.toLowerCase().includes('financial model')) return 'Financial Model Build & Valuation';
    if (description.toLowerCase().includes('erp')) return 'ERP Systems';
    if (description.toLowerCase().includes('account')) return 'Accounts Management Systems';
    return 'Other Services';
  }

  // ==================== Payroll Reports ====================

  /**
   * Generate Employee Salaries Report
   * Shows earnings breakdown for employees in a period
   */
  async generateEmployeeSalariesReport(
    startDate: Date,
    endDate: Date
  ): Promise<EmployeeSalariesReport> {
    const { employeeRepository } = await import('../repositories/EmployeeRepository');
    const { salaryEntryRepository } = await import('../repositories/PayrollRepository');

    // Get all salary entries in the period
    const salaryEntries = await salaryEntryRepository.findByPeriod(startDate, endDate);

    // Get all employees
    const employees = await employeeRepository.search({});
    const employeeMap = new Map(employees.map(e => [e.id, e]));

    // Build report data
    const reportEmployees = salaryEntries.map(entry => {
      const employee = employeeMap.get(entry.employeeId);
      if (!employee) {
        throw new Error(`Employee not found: ${entry.employeeId}`);
      }

      // Calculate allowances (simplified - in real system these would be stored separately)
      const rentAllowance = entry.allowances * 0.4; // Example: 40% of allowances
      const utilityAllowance = entry.allowances * 0.3; // 30%
      const transportAllowance = entry.allowances * 0.3; // 30%

      return {
        employeeId: employee.employeeId,
        employeeName: `${employee.firstName} ${employee.surname}`,
        level: employee.currentLevel || employee.position || 'Staff',
        department: employee.department || 'N/A',
        nationality: employee.nationality,
        bankAccount: employee.bankAccountNo || 'N/A',
        bankBranch: employee.bankBranch || 'N/A',
        holdingBank: employee.holdingBank || 'N/A',
        processedDate: entry.processedDate,
        for: new Date(entry.salaryDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        basicSalary: entry.basicSalary,
        rentAllowance,
        utilityAllowance,
        transportAllowance,
        commission: entry.commission,
        eoyBonus: 0, // Would need separate tracking
        grossSalary: entry.grossSalary,
        netSalary: entry.netSalary,
        salaryPaid: entry.netSalary, // Assuming all paid
        outstanding: 0,
      };
    });

    // Calculate totals
    const totals = reportEmployees.reduce(
      (acc, emp) => ({
        basicSalary: acc.basicSalary + emp.basicSalary,
        rentAllowance: acc.rentAllowance + emp.rentAllowance,
        utilityAllowance: acc.utilityAllowance + emp.utilityAllowance,
        transportAllowance: acc.transportAllowance + emp.transportAllowance,
        commission: acc.commission + emp.commission,
        eoyBonus: acc.eoyBonus + emp.eoyBonus,
        grossSalary: acc.grossSalary + emp.grossSalary,
        netSalary: acc.netSalary + emp.netSalary,
        salaryPaid: acc.salaryPaid + emp.salaryPaid,
        outstanding: acc.outstanding + emp.outstanding,
      }),
      {
        basicSalary: 0,
        rentAllowance: 0,
        utilityAllowance: 0,
        transportAllowance: 0,
        commission: 0,
        eoyBonus: 0,
        grossSalary: 0,
        netSalary: 0,
        salaryPaid: 0,
        outstanding: 0,
      }
    );

    return {
      title: 'Employee Salaries Report: Earnings',
      period: { from: startDate, to: endDate },
      employees: reportEmployees,
      totals,
    };
  }

  /**
   * Generate Employees Register Report
   * Official employee list with levels and salaries
   */
  async generateEmployeesRegisterReport(asOfDate?: Date): Promise<EmployeesRegisterReport> {
    const { employeeRepository } = await import('../repositories/EmployeeRepository');

    const employees = await employeeRepository.findActive();

    const reportEmployees = employees.map(emp => ({
      employeeId: emp.employeeId,
      employeeName: `${emp.firstName} ${emp.surname}`,
      status: emp.status,
      department: emp.department || 'N/A',
      supervisor: emp.supervisor || 'N/A',
      entryLevel: emp.entryLevel || emp.position || 'Staff',
      currentLevel: emp.currentLevel || emp.position || 'Staff',
      entryBasicSalary: emp.entryBasicSalary || emp.basicSalary,
      currentBasicSalary: emp.basicSalary,
    }));

    return {
      title: 'Employees Register - Official',
      asOfDate: asOfDate || new Date(),
      employees: reportEmployees,
    };
  }

  /**
   * Generate Resource Commissions Report
   * Comprehensive commission tracking
   */
  async generateResourceCommissionsReport(
    startDate: Date,
    endDate: Date
  ): Promise<ResourceCommissionsReport> {
    const { commissionRepository } = await import('../repositories/PayrollRepository');
    const { employeeRepository } = await import('../repositories/EmployeeRepository');

    // Get all commissions in the period
    const allCommissions = await commissionRepository.findAll();
    const commissions = allCommissions.filter(c => {
      const commDate = new Date(c.commissionDate);
      return commDate >= startDate && commDate <= endDate;
    });

    // Get all employees
    const employees = await employeeRepository.search({});
    const employeeMap = new Map(employees.map(e => [e.id, e]));

    // Build report data
    const reportCommissions = commissions.map(comm => {
      const employee = employeeMap.get(comm.employeeId);
      if (!employee) {
        throw new Error(`Employee not found: ${comm.employeeId}`);
      }

      // Calculate WHT (Withholding Tax) - typically 5% in Ghana
      const wht = comm.amount * 0.05;
      const netCommission = comm.amount - wht;

      return {
        commissionCode: comm.id.substring(0, 12),
        dateProcessed: comm.createdAt,
        employeeId: employee.employeeId,
        employeeName: `${employee.firstName} ${employee.surname}`,
        for: new Date(comm.commissionDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        totalRelevantSales: comm.salesAmount,
        totalEffectiveSales: comm.salesAmount,
        totalExpectedCommission: comm.amount,
        availableEffectiveSales: comm.isPaid ? 0 : comm.salesAmount,
        availableCommission: comm.isPaid ? 0 : netCommission,
        appliedWHT: wht,
        commissionPaid: comm.isPaid ? netCommission : 0,
        commissionsOutstanding: comm.isPaid ? 0 : netCommission,
      };
    });

    // Calculate totals
    const totals = reportCommissions.reduce(
      (acc, comm) => ({
        totalRelevantSales: acc.totalRelevantSales + comm.totalRelevantSales,
        totalEffectiveSales: acc.totalEffectiveSales + comm.totalEffectiveSales,
        totalExpectedCommission: acc.totalExpectedCommission + comm.totalExpectedCommission,
        availableEffectiveSales: acc.availableEffectiveSales + comm.availableEffectiveSales,
        availableCommission: acc.availableCommission + comm.availableCommission,
        appliedWHT: acc.appliedWHT + comm.appliedWHT,
        commissionPaid: acc.commissionPaid + comm.commissionPaid,
        commissionsOutstanding: acc.commissionsOutstanding + comm.commissionsOutstanding,
      }),
      {
        totalRelevantSales: 0,
        totalEffectiveSales: 0,
        totalExpectedCommission: 0,
        availableEffectiveSales: 0,
        availableCommission: 0,
        appliedWHT: 0,
        commissionPaid: 0,
        commissionsOutstanding: 0,
      }
    );

    return {
      title: 'Resource Commissions Report: Comprehensive',
      period: { from: startDate, to: endDate },
      commissions: reportCommissions,
      totals,
    };
  }

  /**
   * Generate Payslip Report
   * Individual employee payment details
   */
  async generatePayslipReport(
    employeeId: string,
    year: number,
    month: number
  ): Promise<PayslipReport> {
    const { employeeRepository } = await import('../repositories/EmployeeRepository');
    const { salaryEntryRepository } = await import('../repositories/PayrollRepository');

    // Get employee
    const employee = await employeeRepository.findById(employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    // Get salary entry for the month
    const salaries = await salaryEntryRepository.findByMonth(year, month);
    const salaryEntry = salaries.find(s => s.employeeId === employeeId);

    if (!salaryEntry) {
      throw new Error('No salary entry found for this period');
    }

    // Calculate allowances breakdown
    const rentAllowance = salaryEntry.allowances * 0.4;
    const utilityAllowance = salaryEntry.allowances * 0.3;
    const transportationAllowance = salaryEntry.allowances * 0.3;

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const payPeriod = `${monthNames[month - 1]} ${year}`;

    return {
      employeeName: `${employee.firstName} ${employee.surname}`,
      employeeId: employee.employeeId,
      currentLevel: employee.currentLevel || employee.position || 'Officer',
      payPeriod,
      lastPaymentDate: salaryEntry.processedDate,
      totalPayment: salaryEntry.netSalary,
      earnings: {
        basicSalary: salaryEntry.basicSalary,
        rentAllowance,
        utilityAllowance,
        transportationAllowance,
        endOfYearBonus: 0,
        commissions: salaryEntry.commission,
        grossSalary: salaryEntry.grossSalary,
      },
      deductions: {
        incomeTax: salaryEntry.incomeTax,
        ssnitTier1: salaryEntry.tier1Employee,
        ssnitTier2: salaryEntry.tier2,
        staffLoan: salaryEntry.otherDeductions,
        netSalary: salaryEntry.netSalary,
      },
    };
  }

  /**
   * Generate Salaries Register Report
   * Basic salary register with bank details
   */
  async generateSalariesRegisterReport(
    startDate: Date,
    endDate: Date
  ): Promise<SalariesRegisterReport> {
    const { employeeRepository } = await import('../repositories/EmployeeRepository');
    const { salaryEntryRepository } = await import('../repositories/PayrollRepository');

    // Get all salary entries in the period
    const salaryEntries = await salaryEntryRepository.findByPeriod(startDate, endDate);

    // Get all employees
    const employees = await employeeRepository.search({});
    const employeeMap = new Map(employees.map(e => [e.id, e]));

    // Build report data
    const entries = salaryEntries.map(entry => {
      const employee = employeeMap.get(entry.employeeId);
      if (!employee) {
        throw new Error(`Employee not found: ${entry.employeeId}`);
      }

      return {
        salaryDate: entry.salaryDate,
        processedDate: entry.processedDate,
        employeeId: employee.employeeId,
        employeeName: `${employee.firstName} ${employee.surname}`,
        holdingBank: employee.holdingBank || 'N/A',
        bankBranch: employee.bankBranch || 'N/A',
        bankAccountNo: employee.bankAccountNo || 'N/A',
        basicSalary: entry.basicSalary,
        netSalary: entry.netSalary,
        salaryPaid: entry.netSalary, // Assuming all paid
        outstanding: 0,
      };
    });

    // Calculate totals
    const totals = entries.reduce(
      (acc, entry) => ({
        basicSalary: acc.basicSalary + entry.basicSalary,
        netSalary: acc.netSalary + entry.netSalary,
        salaryPaid: acc.salaryPaid + entry.salaryPaid,
        outstanding: acc.outstanding + entry.outstanding,
      }),
      {
        basicSalary: 0,
        netSalary: 0,
        salaryPaid: 0,
        outstanding: 0,
      }
    );

    return {
      title: 'Salaries Register Report: Basic',
      period: { from: startDate, to: endDate },
      entries,
      totals,
    };
  }

  // ==================== Helper Methods ====================

  /**
   * Get default date range (current month)
   */
  getDefaultDateRange(): { startDate: Date; endDate: Date } {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return { startDate, endDate };
  }

  /**
   * Get date range for a specific period
   */
  getDateRangeForPeriod(
    period: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUALLY' | 'ANNUALLY',
    startDate: Date,
    periods: number = 1
  ): { startDate: Date; endDate: Date } {
    const start = new Date(startDate);
    let end: Date;

    switch (period) {
      case 'MONTHLY':
        end = new Date(start.getFullYear(), start.getMonth() + periods, 0, 23, 59, 59);
        break;
      case 'QUARTERLY':
        end = new Date(start.getFullYear(), start.getMonth() + periods * 3, 0, 23, 59, 59);
        break;
      case 'SEMI_ANNUALLY':
        end = new Date(start.getFullYear(), start.getMonth() + periods * 6, 0, 23, 59, 59);
        break;
      case 'ANNUALLY':
        end = new Date(start.getFullYear() + periods, start.getMonth(), 0, 23, 59, 59);
        break;
      default:
        end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59);
    }

    return { startDate: start, endDate: end };
  }
}

// Export singleton instance
export const reportService = ReportService.getInstance();
