# Developer Quick Start Guide - Reports Migration

**Last Updated**: November 16, 2025  
**Target Audience**: Developers implementing the reports migration  
**Estimated Reading Time**: 10 minutes

---

## 🚀 Getting Started in 5 Minutes

### 1. Understand the Current Architecture

**Current (localStorage-based)**:
```
UI Component → ReportService → AccountService/TransactionService → LocalStorage
```

**Target (API-based)**:
```
UI Component → ApiReportService → API Endpoints → Supabase/PostgreSQL
```

### 2. Key Services You'll Work With

| Service | Status | Location | Purpose |
|---------|--------|----------|---------|
| **ApiReportService** | ❌ NEEDS CREATION | `lib/services/ApiReportService.ts` | Central report generation |
| **ApiAccountService** | ✅ EXISTS | `lib/services/ApiAccountService.ts` | Account operations |
| **ApiTransactionService** | ✅ EXISTS | `lib/services/ApiTransactionService.ts` | Transaction operations |
| **ApiSalesService** | ✅ EXISTS | `lib/services/ApiSalesService.ts` | Sales operations |
| **ApiPayrollService** | ✅ EXISTS | `lib/services/ApiPayrollService.ts` | Payroll operations |

### 3. Your First Task: Create ApiReportService

```typescript
// lib/services/ApiReportService.ts
import { ApiAccountService } from './ApiAccountService';
import { ApiTransactionService } from './ApiTransactionService';
import type { TrialBalance, IncomeStatement, BalanceSheet } from '@/types/reports';

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

  // Start with Trial Balance
  async generateTrialBalance(
    asOfDate: Date,
    accountType: 'SECONDARY' | 'HOLDER' = 'SECONDARY'
  ): Promise<TrialBalance> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  // Add other report methods as you go
}

export const apiReportService = ApiReportService.getInstance();
```

---

## 📖 Essential Reading Order

1. **Start Here**: `00_INDEX.md` (5 min)
   - Overview of all 22 reports
   - Priority assignments
   - Navigation guide

2. **Understand Dependencies**: `TRANSACTION_DEPENDENCY_MATRIX.md` (15 min)
   - How transactions flow to reports
   - Common query patterns
   - Optimization strategies

3. **Deep Dive Example**: `01_TRIAL_BALANCE.md` (20 min)
   - Complete specification for one report
   - Template for analyzing other reports
   - Migration checklist

4. **Implementation Plan**: `PHASE2_SUMMARY.md` (10 min)
   - 16-week roadmap
   - Success criteria
   - Risk mitigation

**Total Reading Time**: ~50 minutes

---

## 🛠️ Development Workflow

### Step 1: Set Up Your Environment

```bash
# Clone and install
git clone <repo-url>
cd snmanalytics
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev
```

### Step 2: Create a New Report Migration Branch

```bash
git checkout -b feature/reports-migration-trial-balance
```

### Step 3: Implement ApiReportService Method

**Example: Trial Balance**

```typescript
// lib/services/ApiReportService.ts
async generateTrialBalance(
  asOfDate: Date,
  accountType: 'SECONDARY' | 'HOLDER' = 'SECONDARY'
): Promise<TrialBalance> {
  try {
    // Get account hierarchy from API
    const hierarchy = await this.accountService.getAccountHierarchy();
    
    const accounts: TrialBalanceAccount[] = [];
    let totalDebits = 0;
    let totalCredits = 0;

    // Select account list based on type
    const accountList = accountType === 'SECONDARY' 
      ? hierarchy.secondary 
      : hierarchy.holder;

    // Get balances for all accounts
    // TODO: Optimize with batch query
    for (const account of accountList) {
      if (!account.isActive) continue;
      
      const balance = await this.accountService.getAccountBalance(
        account.id,
        asOfDate
      );
      
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
    
    // Sort by account code
    accounts.sort((a, b) => a.accountCode.localeCompare(b.accountCode));
    
    // Check if balanced
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
```

### Step 4: Create API Endpoint (Optional but Recommended)

```typescript
// app/api/reports/trial-balance/route.ts
import { NextRequest } from 'next/server';
import { apiReportService } from '@/lib/services/ApiReportService';
import { successResponse, errorResponse } from '@/lib/api/utils/response';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const asOfDate = new Date(searchParams.get('asOfDate') || new Date());
    const accountType = (searchParams.get('accountType') || 'SECONDARY') as 'SECONDARY' | 'HOLDER';
    
    const report = await apiReportService.generateTrialBalance(asOfDate, accountType);
    
    return successResponse(report);
  } catch (error) {
    console.error('Error in trial balance endpoint:', error);
    return errorResponse('Failed to generate trial balance', 500);
  }
}
```

### Step 5: Update UI Component

```typescript
// components/reports/TrialBalanceReport.tsx
'use client';

import { useState, useEffect } from 'react';
import { apiReportService } from '@/lib/services/ApiReportService';
import type { TrialBalance } from '@/types/reports';

export function TrialBalanceReport() {
  const [asOfDate, setAsOfDate] = useState<Date>(new Date());
  const [accountType, setAccountType] = useState<'SECONDARY' | 'HOLDER'>('SECONDARY');
  const [data, setData] = useState<TrialBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const report = await apiReportService.generateTrialBalance(asOfDate, accountType);
      setData(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [asOfDate, accountType]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} onRetry={loadReport} />;
  if (!data) return null;

  return (
    <div>
      {/* Render report */}
    </div>
  );
}
```

### Step 6: Write Tests

```typescript
// lib/services/__tests__/ApiReportService.test.ts
import { apiReportService } from '../ApiReportService';

describe('ApiReportService.generateTrialBalance', () => {
  it('should generate trial balance for secondary accounts', async () => {
    const asOfDate = new Date('2024-12-31');
    const result = await apiReportService.generateTrialBalance(asOfDate, 'SECONDARY');
    
    expect(result.accountType).toBe('SECONDARY');
    expect(result.accounts.length).toBeGreaterThan(0);
    expect(result.isBalanced).toBe(true);
    expect(result.totalDebits).toBe(result.totalCredits);
  });
  
  it('should handle errors gracefully', async () => {
    const asOfDate = new Date('invalid');
    
    await expect(
      apiReportService.generateTrialBalance(asOfDate, 'SECONDARY')
    ).rejects.toThrow();
  });
});
```

### Step 7: Test Manually

```bash
# Run dev server
npm run dev

# Navigate to report page
# http://localhost:3000/reports/accounts

# Test different scenarios:
# - Different dates
# - Different account types
# - Error cases
# - Loading states
```

### Step 8: Submit PR

```bash
git add .
git commit -m "feat: migrate Trial Balance to API"
git push origin feature/reports-migration-trial-balance

# Create PR with:
# - Description of changes
# - Screenshots/videos
# - Test results
# - Performance metrics
```

---

## 🎯 Common Patterns & Utilities

### Pattern 1: Loading State Management

```typescript
// hooks/useReport.ts
import { useState, useEffect } from 'react';

export function useReport<T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, dependencies);

  return { data, loading, error, reload: load };
}

// Usage
const { data, loading, error, reload } = useReport(
  () => apiReportService.generateTrialBalance(asOfDate, accountType),
  [asOfDate, accountType]
);
```

### Pattern 2: Formatting Utilities

```typescript
// lib/utils/formatters.ts
export const formatCurrency = (amount: number, locale = 'en-GH'): string => {
  if (amount === 0) return '-';
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (date: Date, format: 'short' | 'long' = 'long'): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: format,
    day: 'numeric',
  }).format(new Date(date));
};

export const formatPercent = (value: number, decimals = 2): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};
```

### Pattern 3: Error Handling

```typescript
// lib/utils/errors.ts
export enum ReportErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  DATA_ERROR = 'DATA_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
}

export class ReportError extends Error {
  constructor(
    public type: ReportErrorType,
    message: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'ReportError';
  }
}

// Usage
try {
  const report = await apiReportService.generateTrialBalance(asOfDate, accountType);
} catch (error) {
  if (error instanceof ReportError) {
    if (error.retryable) {
      // Show retry button
    } else {
      // Show error message only
    }
  }
}
```

### Pattern 4: Export Functionality

```typescript
// lib/utils/export.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export const exportToPDF = (data: TrialBalance) => {
  const doc = new jsPDF();
  
  doc.setFontSize(16);
  doc.text('Trial Balance', 14, 20);
  doc.setFontSize(10);
  doc.text(`As at ${formatDate(data.asOfDate)}`, 14, 28);
  
  autoTable(doc, {
    head: [['Account', 'Code', 'Debit', 'Credit']],
    body: data.accounts.map(acc => [
      acc.accountName,
      acc.accountCode,
      formatCurrency(acc.debitBalance),
      formatCurrency(acc.creditBalance),
    ]),
    foot: [[
      'Total',
      '',
      formatCurrency(data.totalDebits),
      formatCurrency(data.totalCredits),
    ]],
    startY: 35,
  });
  
  doc.save(`trial-balance-${format(data.asOfDate, 'yyyy-MM-dd')}.pdf`);
};

export const exportToExcel = (data: TrialBalance) => {
  const worksheet = XLSX.utils.json_to_sheet(
    data.accounts.map(acc => ({
      'Account': acc.accountName,
      'Code': acc.accountCode,
      'Debit': acc.debitBalance,
      'Credit': acc.creditBalance,
    }))
  );
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Trial Balance');
  XLSX.writeFile(workbook, `trial-balance-${format(data.asOfDate, 'yyyy-MM-dd')}.xlsx`);
};
```

---

## 🐛 Common Issues & Solutions

### Issue 1: N+1 Query Problem

**Problem**: Calling `getAccountBalance()` for each account separately

```typescript
// ❌ BAD: N+1 queries
for (const account of accounts) {
  const balance = await getAccountBalance(account.id, asOfDate);
}
```

**Solution**: Batch query

```typescript
// ✅ GOOD: Single batch query
const balances = await getAccountBalancesBatch(
  accounts.map(a => a.id),
  asOfDate
);
```

### Issue 2: Date Handling

**Problem**: Date timezone issues

```typescript
// ❌ BAD: Loses timezone info
const date = new Date('2024-12-31');
```

**Solution**: Use explicit timezone

```typescript
// ✅ GOOD: Explicit timezone
const date = new Date('2024-12-31T00:00:00.000Z');
// Or use date-fns
import { parseISO } from 'date-fns';
const date = parseISO('2024-12-31');
```

### Issue 3: Floating Point Precision

**Problem**: Balance calculations with floating point errors

```typescript
// ❌ BAD: Direct comparison
if (totalDebits === totalCredits) {
  // May fail due to floating point precision
}
```

**Solution**: Use epsilon comparison

```typescript
// ✅ GOOD: Epsilon comparison
const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;
```

### Issue 4: Missing Error Handling

**Problem**: Unhandled promise rejections

```typescript
// ❌ BAD: No error handling
const report = await apiReportService.generateTrialBalance(asOfDate, accountType);
```

**Solution**: Comprehensive error handling

```typescript
// ✅ GOOD: Proper error handling
try {
  const report = await apiReportService.generateTrialBalance(asOfDate, accountType);
  setData(report);
} catch (error) {
  console.error('Error generating report:', error);
  setError(error instanceof Error ? error.message : 'Unknown error');
}
```

---

## 📊 Performance Checklist

Before submitting your PR, verify:

- [ ] No N+1 query problems
- [ ] Database queries use indexes
- [ ] Large datasets are paginated
- [ ] Results are cached where appropriate
- [ ] Loading states are shown
- [ ] Error states are handled
- [ ] Response time < 1s for typical datasets
- [ ] Memory usage is reasonable
- [ ] No memory leaks

---

## ✅ PR Checklist

Before submitting your PR:

- [ ] Code follows project style guide
- [ ] All tests pass (`npm test`)
- [ ] New tests added for new functionality
- [ ] Test coverage > 80%
- [ ] No console errors or warnings
- [ ] Manual testing completed
- [ ] Performance tested
- [ ] Documentation updated
- [ ] PR description is clear
- [ ] Screenshots/videos included (if UI changes)

---

## 🆘 Getting Help

### Resources

1. **Documentation**:
   - Phase 2 Analysis: `analysis/PHASE2_REPORT_ANALYSIS/`
   - API Documentation: `docs/API.md`
   - Architecture: `ARCHITECTURE_COMPLETE.md`

2. **Code Examples**:
   - Existing API Services: `lib/services/Api*.ts`
   - Existing Reports: `components/reports/*.tsx`
   - Tests: `lib/services/__tests__/*.test.ts`

3. **Team**:
   - Tech Lead: [Name]
   - Backend Lead: [Name]
   - Frontend Lead: [Name]

### Common Questions

**Q: Should I create a dedicated API endpoint or use existing services?**  
A: For complex reports, create a dedicated endpoint. For simple queries, use existing services.

**Q: How do I handle caching?**  
A: Use React Query for client-side caching. Add server-side caching for expensive queries.

**Q: What if the report is too slow?**  
A: Profile the query, add indexes, consider materialized views, or implement pagination.

**Q: How do I test with real data?**  
A: Use the seed data script: `npm run db:seed`

---

## 🎓 Learning Path

### Week 1: Foundation
- [ ] Read all Phase 2 documentation
- [ ] Understand current architecture
- [ ] Set up development environment
- [ ] Review existing API services

### Week 2: First Migration
- [ ] Implement ApiReportService skeleton
- [ ] Migrate Trial Balance
- [ ] Write tests
- [ ] Submit first PR

### Week 3-4: Build Momentum
- [ ] Migrate 2-3 more reports
- [ ] Identify patterns
- [ ] Create reusable utilities
- [ ] Help other developers

### Week 5+: Expert Level
- [ ] Optimize performance
- [ ] Mentor other developers
- [ ] Improve documentation
- [ ] Contribute to architecture decisions

---

## 🚀 Ready to Start?

1. Read `00_INDEX.md` (5 min)
2. Read `TRANSACTION_DEPENDENCY_MATRIX.md` (15 min)
3. Read `01_TRIAL_BALANCE.md` (20 min)
4. Set up your environment
5. Create your first branch
6. Start coding!

**Good luck! 🎉**

---

*Questions? Check the documentation or ask the team!*
