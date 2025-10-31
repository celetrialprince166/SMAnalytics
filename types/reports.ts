/**
 * Reporting Domain Models
 * 
 * This file contains all TypeScript interfaces related to financial reports,
 * statements, and analytics
 */

import { ReportPeriod, DateRange } from './index';

// Financial Statement Types
export interface IncomeStatement {
  period: DateRange;
  
  // Revenue Section
  revenue: number;
  revenueDetails: IncomeStatementLineItem[];
  
  // Direct Costs
  directCosts: number;
  directCostsDetails: IncomeStatementLineItem[];
  
  // Gross Profit
  grossProfit: number;
  
  // Other Income
  otherIncome: number;
  otherIncomeDetails: IncomeStatementLineItem[];
  
  // Operating Expenses (Detailed)
  staffCost: number;
  staffCostDetails: IncomeStatementLineItem[];
  
  rentalCost: number;
  rentalCostDetails: IncomeStatementLineItem[];
  
  sellingGeneralAdmin: number;
  sellingGeneralAdminDetails: IncomeStatementLineItem[];
  
  marketingAdvertising: number;
  marketingAdvertisingDetails: IncomeStatementLineItem[];
  
  taxesLevies: number;
  taxesLeviesDetails: IncomeStatementLineItem[];
  
  giftsPromotions: number;
  giftsPromotionsDetails: IncomeStatementLineItem[];
  
  otherOperatingExpenses: number;
  otherOperatingExpensesDetails: IncomeStatementLineItem[];
  
  totalOperatingExpenses: number;
  
  // EBITDA
  ebitda: number;
  
  // Depreciation & Amortization
  depreciationAmortization: number;
  depreciationAmortizationDetails: IncomeStatementLineItem[];
  
  // EBIT
  ebit: number;
  
  // Interest
  interestIncome: number;
  interestIncomeDetails: IncomeStatementLineItem[];
  
  interestExpense: number;
  interestExpenseDetails: IncomeStatementLineItem[];
  
  netInterestCharges: number;
  
  // Profit Before Tax
  profitBeforeTax: number;
  
  // Tax
  taxExpenses: number;
  taxExpensesDetails: IncomeStatementLineItem[];
  
  // Profit After Tax
  profitAfterTax: number;
  
  generatedAt: Date;
}

export interface IncomeStatementSection {
  title: string;
  lineItems: IncomeStatementLineItem[];
  total: number;
}

export interface IncomeStatementLineItem {
  accountId: string;
  accountName: string;
  amount: number;
  percentage?: number;
}

export interface BalanceSheet {
  asOfDate: Date;
  assets: BalanceSheetSection;
  liabilities: BalanceSheetSection;
  equity: BalanceSheetSection;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  generatedAt: Date;
}

export interface BalanceSheetSection {
  title: string;
  subsections: BalanceSheetSubsection[];
  total: number;
}

export interface BalanceSheetSubsection {
  title: string;
  categories?: BalanceSheetCategory[];
  lineItems: BalanceSheetLineItem[];
  subtotal: number;
}

export interface BalanceSheetCategory {
  title: string;
  lineItems: BalanceSheetLineItem[];
  subtotal: number;
}

export interface BalanceSheetLineItem {
  accountId: string;
  accountName: string;
  amount: number;
}

export interface CashFlowStatement {
  period: DateRange;
  operatingActivities: CashFlowSection;
  investingActivities: CashFlowSection;
  financingActivities: CashFlowSection;
  netCashFlow: number;
  beginningCash: number;
  endingCash: number;
  generatedAt: Date;
}

export interface ComparativeCashFlowStatement {
  periods: DateRange[];
  operatingActivities: ComparativeCashFlowSection;
  investingActivities: ComparativeCashFlowSection;
  financingActivities: ComparativeCashFlowSection;
  netCashFlows: number[];
  beginningCash: number[];
  endingCash: number[];
  generatedAt: Date;
}

export interface ComparativeCashFlowSection {
  title: string;
  lineItems: ComparativeCashFlowLineItem[];
  totals: number[];
}

export interface ComparativeCashFlowLineItem {
  description: string;
  amounts: number[];
  accountId?: string;
}

export interface CashFlowSection {
  title: string;
  lineItems: CashFlowLineItem[];
  total: number;
}

export interface CashFlowLineItem {
  description: string;
  amount: number;
  accountId?: string;
}

// Trial Balance
export interface TrialBalance {
  asOfDate: Date;
  accountType: 'SECONDARY' | 'HOLDER';
  accounts: TrialBalanceAccount[];
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
  generatedAt: Date;
}

export interface TrialBalanceAccount {
  accountId: string;
  accountCode: string;
  accountName: string;
  debitBalance: number;
  creditBalance: number;
}

// Account Reports
export interface AccountReport {
  accountId: string;
  accountName: string;
  accountCode: string;
  period: DateRange;
  openingBalance: number;
  transactions: AccountReportTransaction[];
  closingBalance: number;
  totalDebits: number;
  totalCredits: number;
  generatedAt: Date;
}

export interface ComparativeAccountReport {
  accountId: string;
  accountName: string;
  accountCode: string;
  periods: DateRange[];
  periodType: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUALLY' | 'ANNUALLY';
  subAccounts: ComparativeAccountSubAccount[];
  totals: number[];
  generatedAt: Date;
}

export interface ComparativeAccountSubAccount {
  accountId: string;
  accountName: string;
  amounts: number[];
}

export interface AccountReportTransaction {
  date: Date;
  transactionNumber: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

// Statement of Accounts
export interface StatementOfAccounts {
  accountId: string;
  accountName: string;
  period: DateRange;
  openingBalance: number;
  transactions: StatementTransaction[];
  closingBalance: number;
  generatedAt: Date;
}

export interface StatementTransaction {
  date: Date;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

// Petty Cash Analysis
export interface PettyCashAnalysis {
  month: number;
  year: number;
  openingBalance: number;
  receipts: PettyCashEntry[];
  payments: PettyCashEntry[];
  totalReceipts: number;
  totalPayments: number;
  closingBalance: number;
  generatedAt: Date;
}

export interface PettyCashEntry {
  date: Date;
  description: string;
  amount: number;
  category?: string;
}

// Inventory Reports
export interface InventoryLevelReport {
  reportDate: Date;
  reportType: 'ON_DATE' | 'AS_AT_DATE' | 'PERIOD';
  period?: DateRange;
  products: InventoryLevelItem[];
  totalValue: number;
  generatedAt: Date;
}

export interface InventoryLevelItem {
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
  averageCost: number;
  totalValue: number;
}

export interface InventoryBaseReport {
  category: 'PURCHASES' | 'SALES' | 'MOVEMENTS';
  productId?: string;
  productName?: string;
  reportType: 'ON_DATE' | 'AS_AT_DATE' | 'PERIOD';
  reportDate?: Date;
  period?: DateRange;
  movements: InventoryMovementItem[];
  totalQuantity: number;
  totalValue: number;
  generatedAt: Date;
}

export interface InventoryMovementItem {
  date: Date;
  referenceNumber: string;
  description: string;
  type: 'PURCHASE' | 'SALE' | 'ADJUSTMENT';
  quantity: number;
  unitCost: number;
  totalCost: number;
}

// Dashboard Analytics
export interface DashboardData {
  period: DateRange;
  kpis: DashboardKPI[];
  trends: DashboardTrend[];
  generatedAt: Date;
}

export interface DashboardKPI {
  name: string;
  value: number;
  previousValue: number;
  change: number;
  changePercentage: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
}

export interface DashboardTrend {
  name: string;
  data: DashboardTrendPoint[];
  chartType: 'LINE' | 'COLUMN';
}

export interface DashboardTrendPoint {
  date: Date;
  label: string;
  value: number;
}

// Report filters and parameters
export interface ReportFilters {
  reportType: string;
  period?: ReportPeriod;
  startDate?: Date;
  endDate?: Date;
  asOfDate?: Date;
  accountId?: string;
  productId?: string;
  customerId?: string;
}

export interface ReportExportOptions {
  format: 'PDF' | 'EXCEL' | 'CSV' | 'JSON';
  includeCharts: boolean;
  includeDetails: boolean;
  fileName?: string;
}


// Ageing Analysis
export interface AgeingAnalysis {
  asOfDate: Date;
  accountType: 'RECEIVABLES' | 'PAYABLES';
  items: AgeingAnalysisItem[];
  summary: AgeingAnalysisSummary;
  generatedAt: Date;
}

export interface AgeingAnalysisItem {
  salesCode?: string;
  invoiceNumber: string;
  clientName: string;
  date: Date;
  invoiceAmount: number;
  totalPaid: number;
  amountOutstanding: number;
  current: number;        // 0-30 days
  days31to45: number;     // 31-45 days
  days46to60: number;     // 46-60 days
  days61to75: number;     // 61-75 days
  days76to90: number;     // 76-90 days
  over90days: number;     // > 90 days
}

export interface AgeingAnalysisSummary {
  totalInvoiceAmount: number;
  totalPaid: number;
  totalOutstanding: number;
  current: number;
  days31to45: number;
  days46to60: number;
  days61to75: number;
  days76to90: number;
  over90days: number;
}

// Payroll Reports Types
export interface EmployeeSalariesReport {
  title: string;
  period: {
    from: Date;
    to: Date;
  };
  employees: Array<{
    employeeId: string;
    employeeName: string;
    level: string;
    department: string;
    nationality: string;
    bankAccount: string;
    bankBranch: string;
    holdingBank: string;
    processedDate: Date;
    for: string; // Month/Year
    basicSalary: number;
    rentAllowance: number;
    utilityAllowance: number;
    transportAllowance: number;
    commission: number;
    eoyBonus: number;
    grossSalary: number;
    netSalary: number;
    salaryPaid: number;
    outstanding: number;
  }>;
  totals: {
    basicSalary: number;
    rentAllowance: number;
    utilityAllowance: number;
    transportAllowance: number;
    commission: number;
    eoyBonus: number;
    grossSalary: number;
    netSalary: number;
    salaryPaid: number;
    outstanding: number;
  };
}

export interface EmployeesRegisterReport {
  title: string;
  asOfDate: Date;
  employees: Array<{
    employeeId: string;
    employeeName: string;
    status: string;
    department: string;
    supervisor: string;
    entryLevel: string;
    currentLevel: string;
    entryBasicSalary: number;
    currentBasicSalary: number;
  }>;
}

export interface ResourceCommissionsReport {
  title: string;
  period: {
    from: Date;
    to: Date;
  };
  commissions: Array<{
    commissionCode: string;
    dateProcessed: Date;
    employeeId: string;
    employeeName: string;
    for: string; // Month/Year
    totalRelevantSales: number;
    totalEffectiveSales: number;
    totalExpectedCommission: number;
    availableEffectiveSales: number;
    availableCommission: number;
    appliedWHT: number;
    commissionPaid: number;
    commissionsOutstanding: number;
  }>;
  totals: {
    totalRelevantSales: number;
    totalEffectiveSales: number;
    totalExpectedCommission: number;
    availableEffectiveSales: number;
    availableCommission: number;
    appliedWHT: number;
    commissionPaid: number;
    commissionsOutstanding: number;
  };
}

export interface PayslipReport {
  employeeName: string;
  employeeId: string;
  currentLevel: string;
  payPeriod: string; // e.g., "Feb 2025"
  lastPaymentDate?: Date;
  totalPayment: number;
  earnings: {
    basicSalary: number;
    rentAllowance: number;
    utilityAllowance: number;
    transportationAllowance: number;
    endOfYearBonus: number;
    commissions: number;
    grossSalary: number;
  };
  deductions: {
    incomeTax: number;
    ssnitTier1: number;
    ssnitTier2: number;
    staffLoan: number;
    netSalary: number;
  };
}

export interface SalariesRegisterReport {
  title: string;
  period: {
    from: Date;
    to: Date;
  };
  entries: Array<{
    salaryDate: Date;
    processedDate: Date;
    employeeId: string;
    employeeName: string;
    holdingBank: string;
    bankBranch: string;
    bankAccountNo: string;
    basicSalary: number;
    netSalary: number;
    salaryPaid: number;
    outstanding: number;
  }>;
  totals: {
    basicSalary: number;
    netSalary: number;
    salaryPaid: number;
    outstanding: number;
  };
}

// Sales Reports
export interface SalesLevelsReport {
  reportType: 'P_LEVELS' | 'G_LEVELS';
  mode: 'SERVICE_MODE' | 'SERVICE_LINES' | 'SERVICES';
  dateMode: 'PERIODIC' | 'ON' | 'AS_AT';
  period: DateRange;
  periodType?: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUALLY' | 'ANNUALLY';
  numberOfPeriods?: number;
  items: SalesLevelsItem[];
  totals: SalesLevelsTotals;
  generatedAt: Date;
}

export interface SalesLevelsItem {
  name: string; // Service name or Service line name
  periods: SalesLevelsPeriod[];
}

export interface SalesLevelsPeriod {
  periodLabel: string;
  totalFees: number;
  totalDiscount: number;
  totalSales: number;
  totalVAT: number;
  totalInvoice: number;
  totalReceipts: number;
}

export interface SalesLevelsTotals {
  totalFees: number;
  totalDiscount: number;
  totalSales: number;
  totalVAT: number;
  totalInvoice: number;
  totalReceipts: number;
}

export interface SalesMovementReport {
  period: DateRange;
  dateMode: 'PERIODIC' | 'ON' | 'AS_AT';
  serviceLines: string[];
  productId?: string;
  items: SalesMovementItem[];
  totals: SalesMovementTotals;
  generatedAt: Date;
}

export interface SalesMovementItem {
  salesCode: string;
  date: Date;
  description: string;
  client: string;
  totalFees: number;
  totalDiscount: number;
  totalSales: number;
  totalVAT: number;
  totalInvoice: number;
  totalReceipts: number;
}

export interface SalesMovementTotals {
  totalFees: number;
  totalDiscount: number;
  totalSales: number;
  totalVAT: number;
  totalInvoice: number;
  totalReceipts: number;
}
