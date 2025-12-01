# Transaction Dependency Matrix

**Document Version**: 1.0  
**Last Updated**: November 16, 2025  
**Purpose**: Complete mapping of transaction dependencies across all 22 report components

---

## 🎯 Executive Summary

This document maps the complete dependency chain from transactions to reports, identifying:
- Which reports depend on which transaction types
- Data flow patterns from TransactionService → ReportService → UI Components
- Shared query patterns that can be optimized
- Migration priorities based on transaction usage

---

## 📊 Transaction Types in System

### Core Transaction Types

| Transaction Type | Storage Location | Used By | Migration Status |
|-----------------|------------------|---------|------------------|
| **Single Transaction** | `Transaction` table | All financial reports | ✅ API exists |
| **Split Transaction** | `SplitTransaction` table | Petty Cash, Account Reports | ✅ API exists |
| **Sales Transaction** | `SalesEntry` table | Sales Reports, Ageing Analysis | ✅ API exists |
| **Payroll Transaction** | `Salary`, `Commission` tables | Payroll Reports | ✅ API exists |
| **Fixed Asset Transaction** | `FixedAsset`, `Depreciation` tables | Balance Sheet, Cash Flow | ✅ API exists |

### Transaction Service Methods

From `lib/services/TransactionService.ts`:

```typescript
// Core CRUD
- createTransaction(request: CreateTransactionRequest): Promise<Transaction>
- updateTransaction(id: string, updates: UpdateTransactionRequest): Promise<Transaction>
- deleteTransaction(id: string): Promise<void>
- getTransactionById(id: string): Promise<Transaction | null>

// Query Methods
- getTransactions(filters?: TransactionFilters): Promise<Transaction[]>
- getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]>
- getTransactionsByAccount(accountId: string): Promise<Transaction[]>
- getTransactionsByDate(date: Date): Promise<Transaction[]>

// Balance Calculations
- getAccountBalanceAtDate(accountId: string, date: Date): Promise<number>

// Audit & Navigation
- getAuditLog(transactionId: string): Promise<TransactionAuditLog | null>
- getTransactionNavigation(id: string, filters?: TransactionFilters): Promise<TransactionNavigation | null>
- toggleReconciliation(id: string): Promise<Transaction>
```

---

## 🔗 Report → Transaction Dependency Map

### Financial Reports (Category 1)

#### 1. Trial Balance Report
**Component**: `TrialBalanceReport.tsx`  
**Service Method**: `ReportService.generateTrialBalance()`

**Transaction Dependencies**:
```
DIRECT:
- None (uses account balances directly)

INDIRECT:
- All transactions affect account balances
- Balance calculation: Sum of all transactions up to asOfDate
```

**Data Flow**:
```
AccountService.getAccountHierarchy()
  → For each account:
    → AccountService.getAccountBalance(accountId, asOfDate)
      → TransactionRepository.findByAccount(accountId)
        → Filter by date <= asOfDate
        → Calculate: debit - credit
```

**Query Pattern**:
- **Type**: Account-centric
- **Volume**: O(n) where n = number of accounts
- **Optimization**: Pre-calculate balances, cache results

---

#### 2. Income Statement Report
**Component**: `IncomeStatementReport.tsx`  
**Service Method**: `ReportService.generateIncomeStatement()`

**Transaction Dependencies**:
```
DIRECT:
- TransactionService.getTransactionsByDateRange(startDate, endDate)

INDIRECT:
- Account categorization by keywords
- Revenue accounts (credit side)
- Expense accounts (debit side)
```

**Data Flow**:
```
TransactionService.getTransactionsByDateRange(start, end)
  → AccountService.getAccountHierarchy()
    → For each account category (Revenue, Expenses, etc.):
      → Filter transactions by account keywords
      → Aggregate amounts by debit/credit side
      → Calculate: Revenue - Expenses = Profit
```

**Calculation Logic**:
```typescript
// Revenue (Credit side of revenue accounts)
revenue = Σ(transactions where creditAccountId matches revenue keywords)

// Direct Costs (Debit side of cost accounts)
directCosts = Σ(transactions where debitAccountId matches cost keywords)

// Gross Profit
grossProfit = revenue - directCosts

// Operating Expenses (Debit side of expense accounts)
operatingExpenses = Σ(transactions where debitAccountId matches expense keywords)

// EBITDA
ebitda = grossProfit + otherIncome - operatingExpenses

// EBIT
ebit = ebitda - depreciationAmortization

// Profit Before Tax
profitBeforeTax = ebit + netInterestCharges

// Profit After Tax
profitAfterTax = profitBeforeTax - taxExpenses
```

**Query Pattern**:
- **Type**: Date range + account filtering
- **Volume**: O(t × a) where t = transactions, a = accounts
- **Optimization**: Index on date + accountId, cache keyword matches

---

#### 3. Balance Sheet Report
**Component**: `BalanceSheetReport.tsx`  
**Service Method**: `ReportService.generateBalanceSheet()`

**Transaction Dependencies**:
```
DIRECT:
- None (uses account balances at point in time)

INDIRECT:
- All transactions up to asOfDate
- Account categorization by primary account type
```

**Data Flow**:
```
AccountService.getAccountHierarchy()
  → Get primary accounts by type (ASSETS, LIABILITIES, EQUITY)
    → For each holder account:
      → AccountService.getAccountBalanceSync(accountId, asOfDate)
        → Sum all transactions where date <= asOfDate
      → Categorize by keywords (Cash, Receivables, PPE, etc.)
```

**Categorization Logic**:
```typescript
// ASSETS
Current Assets:
  - Cash & Bank: keywords = ['cash', 'bank']
  - Accounts Receivable: keywords = ['receivable', 'debtor']
  - Short-term Investments: keywords = ['short-term investment']
  - Inventory: keywords = ['inventory', 'stock']
  
Non-current Assets:
  - PPE: keywords = ['property', 'plant', 'equipment', 'fixed asset']
  - Intangible: keywords = ['intangible', 'goodwill', 'patent']

// LIABILITIES
Current Liabilities:
  - Accounts Payable: keywords = ['payable', 'creditor']
  - Tax Payable: keywords = ['tax payable', 'vat payable']
  
Non-current Liabilities:
  - Long-term Debt: keywords = ['long-term debt', 'bonds payable']

// EQUITY
  - Stated Capital: keywords = ['stated capital', 'share capital']
  - Retained Earnings: keywords = ['retained earnings']
```

**Query Pattern**:
- **Type**: Account balance snapshot
- **Volume**: O(a) where a = number of accounts
- **Optimization**: Pre-calculate balances, cache categorization

---

#### 4. Cash Flow Statement Report
**Component**: `CashFlowStatementReport.tsx`  
**Service Method**: `ReportService.generateCashFlowStatement()`

**Transaction Dependencies**:
```
DIRECT:
- TransactionService.getTransactionsByDateRange(startDate, endDate)
- IncomeStatement data (for EBIT)

INDIRECT:
- Account balance changes (movement analysis)
- Categorization by activity type
```

**Data Flow**:
```
1. Get EBIT from Income Statement
2. Calculate working capital changes:
   → For each account category:
     → openingBalance = getAccountBalance(accountId, startDate - 1)
     → closingBalance = getAccountBalance(accountId, endDate)
     → movement = closingBalance - openingBalance
3. Categorize movements:
   → Operating Activities (working capital, depreciation)
   → Investing Activities (PPE, intangibles)
   → Financing Activities (debt, equity)
```

**Calculation Logic**:
```typescript
// Operating Activities
netCashFromOperating = EBIT 
  + depreciationAmortization
  - Δ(accounts receivable)
  - Δ(inventory)
  + Δ(accounts payable)
  - taxPaid

// Investing Activities
netCashFromInvesting = 
  - Δ(PPE)
  - Δ(intangible assets)
  - Δ(long-term investments)

// Financing Activities
netCashFromFinancing = 
  + Δ(equity)
  + Δ(long-term debt)
  - dividendsPaid
  - interestPaid

// Net Cash Flow
netCashFlow = netCashFromOperating + netCashFromInvesting + netCashFromFinancing

// Ending Cash
endingCash = beginningCash + netCashFlow
```

**Query Pattern**:
- **Type**: Balance movement analysis
- **Volume**: O(a × 2) where a = accounts (2 balance queries per account)
- **Optimization**: Batch balance queries, cache movements

---

#### 5. Comparative Cash Flow Report
**Component**: `ComparativeCashFlowReport.tsx`  
**Service Method**: `ReportService.generateComparativeCashFlowStatement()`

**Transaction Dependencies**:
```
DIRECT:
- Multiple calls to generateCashFlowStatement() for each period

INDIRECT:
- All dependencies of Cash Flow Statement × number of periods
```

**Data Flow**:
```
For each period (1 to numberOfPeriods):
  → Generate Cash Flow Statement for period
  → Store results
→ Combine into comparative format
→ Align line items across periods
```

**Query Pattern**:
- **Type**: Multiple period analysis
- **Volume**: O(p × a × 2) where p = periods, a = accounts
- **Optimization**: Parallel period processing, shared cache

---

### Account Reports (Category 2)

#### 6. Account Balances Tab
**Component**: `AccountBalancesTab.tsx`  
**Service Method**: Multiple report methods

**Transaction Dependencies**:
```
DIRECT:
- Trial Balance: No direct transactions
- Comparative Account Report: TransactionService.getTransactionsByDateRange()

INDIRECT:
- Account balances from all transactions
```

**Query Pattern**:
- **Type**: Account-centric with period comparison
- **Volume**: O(a + t) where a = accounts, t = transactions in period
- **Optimization**: Cache trial balance, optimize comparative queries

---

#### 7. Account Transactions Report
**Component**: `AccountTransactionsReportComponent.tsx`  
**Service Method**: `ReportService.generateAccountReport()`

**Transaction Dependencies**:
```
DIRECT:
- TransactionService.getTransactionsByDateRange(startDate, endDate)
- Filter by accountId

INDIRECT:
- Opening balance calculation
```

**Data Flow**:
```
AccountService.getHolderAccountById(accountId)
  → AccountService.getAccountBalance(accountId, startDate - 1) // Opening
  → TransactionService.getTransactionsByDateRange(startDate, endDate)
    → Filter: debitAccountId === accountId OR creditAccountId === accountId
    → For each transaction:
      → Calculate running balance
      → Track debits and credits
```

**Calculation Logic**:
```typescript
openingBalance = getAccountBalance(accountId, startDate - 1)
runningBalance = openingBalance

for each transaction in period:
  if (transaction.debitAccountId === accountId):
    debit = transaction.amount
    credit = 0
    runningBalance += debit
  else:
    debit = 0
    credit = transaction.amount
    runningBalance -= credit
    
closingBalance = runningBalance
totalDebits = Σ(debits)
totalCredits = Σ(credits)
```

**Query Pattern**:
- **Type**: Account-specific transaction list
- **Volume**: O(t) where t = transactions for account in period
- **Optimization**: Index on (accountId, date), pagination

---

#### 8. Comparative Account Report
**Component**: `ComparativeAccountReportComponent.tsx`  
**Service Method**: `ReportService.generateComparativeAccountReport()`

**Transaction Dependencies**:
```
DIRECT:
- TransactionService.getTransactionsByDateRange() for each period
- Filter by secondary account's holder accounts

INDIRECT:
- Account hierarchy navigation
```

**Data Flow**:
```
AccountService.getSecondaryAccountById(parentAccountId)
  → AccountService.getHolderAccounts(parentAccountId)
  → For each period:
    → TransactionService.getTransactionsByDateRange(period.start, period.end)
      → For each holder account:
        → Filter transactions
        → Calculate net amount (credits - debits for revenue)
```

**Calculation Logic**:
```typescript
for each holderAccount under secondaryAccount:
  for each period:
    transactions = getTransactionsByDateRange(period.start, period.end)
    netAmount = 0
    
    for each transaction:
      if (transaction.creditAccountId === holderAccount.id):
        netAmount += transaction.amount  // Credit increases revenue
      else if (transaction.debitAccountId === holderAccount.id):
        netAmount -= transaction.amount  // Debit decreases revenue
    
    amounts[period] = Math.abs(netAmount)
    
totals[period] = Σ(amounts for all subAccounts in period)
```

**Query Pattern**:
- **Type**: Multi-period, multi-account aggregation
- **Volume**: O(p × h × t) where p = periods, h = holder accounts, t = transactions
- **Optimization**: Batch queries, cache period results

---

#### 9. Statement of Accounts
**Component**: `StatementOfAccountsComponent.tsx`  
**Service Method**: `ReportService.generateStatementOfAccounts()`

**Transaction Dependencies**:
```
DIRECT:
- Same as Account Transactions Report
- Formatted for client/supplier statements

INDIRECT:
- Opening balance calculation
```

**Data Flow**: Same as Account Transactions Report

**Query Pattern**: Same as Account Transactions Report

---

#### 10. Ageing Analysis
**Component**: `AgeingAnalysisComponent.tsx`  
**Service Method**: `ReportService.generateAgeingAnalysis()`

**Transaction Dependencies**:
```
DIRECT:
- SalesService.getSalesEntries() (not TransactionService)

INDIRECT:
- Payment records (future implementation)
```

**Data Flow**:
```
SalesService.getSalesEntries()
  → For each sale:
    → Calculate days outstanding = asOfDate - sale.date
    → Categorize by age bracket:
      - Current (0-30 days)
      - 31-45 days
      - 46-60 days
      - 61-75 days
      - 76-90 days
      - Over 90 days
    → Calculate outstanding amount
```

**Calculation Logic**:
```typescript
for each sale:
  daysDiff = (asOfDate - sale.date) / (1000 * 60 * 60 * 24)
  invoiceAmount = sale.totalWithVat || sale.salesValue
  totalPaid = 0  // TODO: Check payment records
  amountOutstanding = invoiceAmount - totalPaid
  
  if (amountOutstanding <= 0) continue
  
  if (daysDiff <= 30):
    current += amountOutstanding
  else if (daysDiff <= 45):
    days31to45 += amountOutstanding
  // ... etc
```

**Query Pattern**:
- **Type**: Sales-centric with date calculation
- **Volume**: O(s) where s = sales entries
- **Optimization**: Index on sale date, filter unpaid only

---

#### 11. Petty Cash Analysis
**Component**: `PettyCashAnalysisComponent.tsx`  
**Service Method**: `ReportService.generatePettyCashAnalysis()`

**Transaction Dependencies**:
```
DIRECT:
- TransactionService.getTransactionsByDateRange(monthStart, monthEnd)
- Filter by petty cash account

INDIRECT:
- Petty cash account identification
```

**Data Flow**:
```
AccountService.getAccountHierarchy()
  → Find account with name containing "petty cash"
  → Calculate opening balance (end of previous month)
  → TransactionService.getTransactionsByDateRange(monthStart, monthEnd)
    → Filter: debitAccountId === pettyCashId OR creditAccountId === pettyCashId
    → Separate into receipts (debits) and payments (credits)
```

**Calculation Logic**:
```typescript
pettyCashAccount = findAccountByName("petty cash")
openingBalance = getAccountBalance(pettyCashAccount.id, monthStart - 1)

receipts = transactions.filter(t => t.debitAccountId === pettyCashAccount.id)
payments = transactions.filter(t => t.creditAccountId === pettyCashAccount.id)

totalReceipts = Σ(receipts.amount)
totalPayments = Σ(payments.amount)
closingBalance = openingBalance + totalReceipts - totalPayments
```

**Query Pattern**:
- **Type**: Account-specific monthly analysis
- **Volume**: O(t) where t = petty cash transactions in month
- **Optimization**: Index on (accountId, date), cache account lookup

---

### Sales Reports (Category 3)

#### 12. Sales Movement Report
**Component**: `SalesMovementReportComponent.tsx`  
**Service Method**: `ReportService.generateSalesMovementReport()`

**Transaction Dependencies**:
```
DIRECT:
- SalesService.getSalesEntries()

INDIRECT:
- None (uses sales data, not general transactions)
```

**Data Flow**:
```
SalesService.getSalesEntries()
  → Filter by date range
  → Group by product/service
  → Calculate totals
```

**Query Pattern**:
- **Type**: Sales-centric aggregation
- **Volume**: O(s) where s = sales entries
- **Optimization**: Index on date, pre-aggregate by product

---

#### 13. Sales Levels Report
**Component**: `SalesLevelsReportComponent.tsx`  
**Service Method**: `ReportService.generateSalesLevelsReport()`

**Transaction Dependencies**:
```
DIRECT:
- SalesService.getSalesEntries()

INDIRECT:
- Product/Service hierarchy
```

**Data Flow**:
```
SalesService.getSalesEntries()
  → For each period:
    → Group by product/service/service line
    → Calculate totals per period
    → Compare across periods
```

**Query Pattern**:
- **Type**: Multi-period sales aggregation
- **Volume**: O(p × s) where p = periods, s = sales
- **Optimization**: Pre-aggregate by period, cache results

---

### Payroll Reports (Category 4)

#### 14-19. Payroll Reports
**Components**: Various payroll report components  
**Service Methods**: `ReportService.generatePayrollReports()`

**Transaction Dependencies**:
```
DIRECT:
- PayrollService methods (already migrated to API)
- EmployeeService methods

INDIRECT:
- None (payroll system is separate)
```

**Data Flow**:
```
PayrollService.getSalaries() / getCommissions()
  → Filter by date range
  → Calculate totals
  → Format for display
```

**Query Pattern**:
- **Type**: Payroll-specific queries
- **Volume**: O(e) where e = employees
- **Optimization**: Use existing ApiPayrollService

---

## 🔄 Shared Query Patterns

### Pattern 1: Date Range Filtering
**Used By**: 18 reports  
**Query**: `getTransactionsByDateRange(startDate, endDate)`

**Optimization Strategy**:
```sql
-- Index on date column
CREATE INDEX idx_transactions_date ON transactions(date);

-- Partition by date range
CREATE TABLE transactions_2024 PARTITION OF transactions
  FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
```

---

### Pattern 2: Account-Specific Queries
**Used By**: 12 reports  
**Query**: `getTransactionsByAccount(accountId)`

**Optimization Strategy**:
```sql
-- Composite index
CREATE INDEX idx_transactions_account_date 
  ON transactions(debit_account_id, date);
CREATE INDEX idx_transactions_account_date_credit 
  ON transactions(credit_account_id, date);
```

---

### Pattern 3: Balance Calculation
**Used By**: 15 reports  
**Logic**: Sum transactions up to date

**Optimization Strategy**:
```typescript
// Pre-calculate and cache balances
interface AccountBalance {
  accountId: string;
  asOfDate: Date;
  balance: number;
  lastUpdated: Date;
}

// Update on transaction create/update/delete
// Cache with TTL or invalidate on change
```

---

### Pattern 4: Account Categorization
**Used By**: 8 reports  
**Logic**: Keyword matching on account names

**Optimization Strategy**:
```typescript
// Pre-compute categories
interface AccountCategory {
  accountId: string;
  categories: string[];  // ['revenue', 'operating-expense', etc.]
}

// Store in database or cache
// Update when accounts are created/modified
```

---

## 📊 Transaction Volume Analysis

### Expected Query Volumes (Production)

| Query Type | Frequency | Avg Records | Peak Records | Response Time Target |
|------------|-----------|-------------|--------------|---------------------|
| Date range (month) | High | 500-1000 | 5000 | < 500ms |
| Date range (quarter) | Medium | 1500-3000 | 15000 | < 1s |
| Date range (year) | Low | 6000-12000 | 60000 | < 3s |
| Account-specific | High | 50-200 | 1000 | < 200ms |
| Balance calculation | Very High | N/A | N/A | < 100ms (cached) |

### Optimization Priorities

1. **P0 - Critical**:
   - Balance calculation caching
   - Date range index optimization
   - Account-specific query optimization

2. **P1 - High**:
   - Account categorization pre-computation
   - Multi-period query batching
   - Result caching for common date ranges

3. **P2 - Medium**:
   - Query result pagination
   - Partial result streaming
   - Background pre-computation

---

## 🎯 Migration Impact Assessment

### High-Impact Changes

1. **Transaction Query API**
   - **Impact**: ALL reports
   - **Risk**: HIGH
   - **Mitigation**: Comprehensive testing, gradual rollout

2. **Balance Calculation Method**
   - **Impact**: 15 reports
   - **Risk**: MEDIUM
   - **Mitigation**: Parallel run with validation

3. **Account Categorization**
   - **Impact**: 8 reports
   - **Risk**: LOW
   - **Mitigation**: Pre-compute and validate

### API Endpoint Requirements

```typescript
// Required new endpoints
GET /api/transactions?dateFrom={date}&dateTo={date}&accountId={id}
GET /api/accounts/{id}/balance?asOfDate={date}
GET /api/accounts/{id}/transactions?dateFrom={date}&dateTo={date}
GET /api/reports/trial-balance?asOfDate={date}&accountType={type}
GET /api/reports/income-statement?dateFrom={date}&dateTo={date}
GET /api/reports/balance-sheet?asOfDate={date}
GET /api/reports/cash-flow?dateFrom={date}&dateTo={date}
// ... etc for each report type
```

---

## ✅ Next Steps

1. **Create ApiReportService** (P0)
   - Implement all report generation methods
   - Use ApiTransactionService instead of TransactionService
   - Add caching layer

2. **Create Report API Endpoints** (P0)
   - One endpoint per report type
   - Support all filter parameters
   - Implement response caching

3. **Optimize Database Queries** (P1)
   - Add indexes as identified
   - Implement balance caching
   - Pre-compute categories

4. **Update UI Components** (P1)
   - Switch from ReportService to API calls
   - Add loading states
   - Implement error handling

5. **Performance Testing** (P1)
   - Baseline current performance
   - Test API performance
   - Validate optimization gains

---

*This document is part of Phase 2 Deep Dive Analysis for the Reports Migration project.*
