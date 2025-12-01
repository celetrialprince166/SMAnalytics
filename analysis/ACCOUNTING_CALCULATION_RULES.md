# Accounting Calculation Rules & Verification

## Account Structure

The system uses a **three-level account hierarchy**:

```
Organization
└── Primary Account (type: ASSETS, LIABILITIES, EQUITY, INCOME, REVENUE, EXPENSES)
    └── Secondary Account (code: "01-01")
        └── Holder Account (code: "01-01-001", has balance)
```

## Account Types and Normal Balances

| Account Type | Normal Balance | Calculation Formula | Increases By |
|--------------|----------------|---------------------|--------------|
| **ASSETS** | Debit | `debits - credits` | Debit |
| **LIABILITIES** | Credit | `credits - debits` | Credit |
| **EQUITY** | Credit | `credits - debits` | Credit |
| **INCOME/REVENUE** | Credit | `credits - debits` | Credit |
| **EXPENSES** | Debit | `debits - credits` | Debit |

## Transaction Model

Each transaction contains:
- `amount` - The transaction amount (Decimal)
- `debitAccountId` - Reference to HolderAccount receiving the debit
- `creditAccountId` - Reference to HolderAccount receiving the credit
- `reconciled` - Boolean indicating if transaction is reconciled
- `date` - Transaction date

**Double-Entry Bookkeeping Rule**: Every transaction affects exactly two accounts:
- One account is DEBITED
- One account is CREDITED
- Debits ALWAYS equal Credits

## Report Calculations

### Income Statement (Profit & Loss)

```javascript
// Revenue (CREDIT-NORMAL)
const revenueBalance = creditTotal - debitTotal;  // Positive when earned

// Expenses (DEBIT-NORMAL)  
const expenseBalance = debitTotal - creditTotal;  // Positive when incurred

// Net Income
const netIncome = totalRevenue - totalExpenses;
```

### Balance Sheet (Statement of Financial Position)

```javascript
// Assets (DEBIT-NORMAL)
const assetBalance = debitTotal - creditTotal;  // Positive when owned

// Liabilities (CREDIT-NORMAL)
const liabilityBalance = creditTotal - debitTotal;  // Positive when owed

// Equity (CREDIT-NORMAL)
const equityBalance = creditTotal - debitTotal;  // Positive when invested

// Verification: Assets = Liabilities + Equity
const isBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01;
```

## API Parameters

Both report APIs support:
- `includeUnreconciled=true` - Include unreconciled transactions in calculations
- `organizationId` - Filter by organization (multi-tenancy)
- Date parameters (`dateFrom`/`dateTo` for P&L, `date` for Balance Sheet)

## Issues Found & Fixed

### Issue 1: Wrong Account Type Query
**Problem**: Profit-loss was querying for `type: 'REVENUE'` but data uses `type: 'INCOME'`
**Solution**: Query for both: `type: { in: ['REVENUE', 'INCOME'] }`

### Issue 2: Incorrect Revenue Calculation
**Problem**: Revenue was calculated as `debits - credits` (debit-normal)
**Solution**: Changed to `credits - debits` (credit-normal)

### Issue 3: No Option for Unreconciled Transactions
**Problem**: Reports only showed reconciled transactions, hiding test data
**Solution**: Added `includeUnreconciled` parameter

## Data Quality Observations

From the test data analysis:

1. **Asset Account Issues**:
   - Some asset accounts have more credits than debits (negative balance)
   - Example: "Fixed Assets - Equipment" shows -5000 (credits > debits)
   - This could indicate disposals or data entry errors

2. **Expense Account Issues**:
   - Some expense accounts show negative balances
   - Example: "Depreciation Expense" has more credits than debits
   - This could indicate reversed entries or corrections

3. **Balance Sheet Imbalance**:
   - Assets: 262,706.97
   - Liabilities + Equity: 0
   - Difference: 262,706.97
   - This equals the Net Income, indicating retained earnings haven't been posted

## Recommendations

1. **Data Cleanup**: Review transactions where:
   - Asset accounts have credit > debit (negative balance)
   - Expense accounts have credit > debit (negative balance)
   - Same account appears in both debit and credit of a transaction

2. **Reconciliation Process**: 
   - Regularly reconcile transactions to ensure report accuracy
   - Unreconciled transactions should be reviewed before financial close

3. **Period-End Entries**:
   - Post closing entries to transfer Net Income to Retained Earnings
   - This will balance the Balance Sheet equation

4. **Validation Rules**:
   - Prevent same account in both debit and credit
   - Warn when account balance goes negative unexpectedly

## Test Verification Commands

```powershell
# Test Profit & Loss with all transactions
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/reports/profit-loss?includeUnreconciled=true" -Method GET
$response.data.summary

# Test Balance Sheet with all transactions
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/reports/balance-sheet?includeUnreconciled=true" -Method GET
$response.data.totals
```

## Accounting Standards Reference

These calculations follow Generally Accepted Accounting Principles (GAAP):
- Double-entry bookkeeping
- Accrual basis accounting
- Matching principle
- Balance sheet equation: Assets = Liabilities + Equity



