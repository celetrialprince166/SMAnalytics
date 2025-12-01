# React Query Hooks Design - Specifications

**Document Version**: 1.0  
**Created**: November 17, 2025  
**Purpose**: Complete React Query hooks specifications for all reports (Gap #2)

---

## 🎯 Overview

This document provides **specifications only** (not implementations) for React Query hooks addressing Gap #2. Each hook specification includes:
- Hook naming conventions
- Query key structure
- Caching strategy
- Error handling
- Retry logic
- Prefetching strategies

---

## 📋 Hook Naming Conventions

### Pattern
```typescript
use[ReportName](params: ReportParams, options?: UseQueryOptions)
```

### Examples
- `useTrialBalance`
- `useIncomeStatement`
- `useBalanceSheet`
- `useCashFlowStatement`
- `useAccountTransactions`
- `useSalesMovement`
- `useSalariesRegister`

---

## 🔑 Query Key Structure

### Standard Pattern
```typescript
['reports', reportType, params]
```

### Examples
```typescript
// Trial Balance
['reports', 'trial-balance', { asOfDate: '2024-12-31', accountType: 'SECONDARY' }]

// Income Statement
['reports', 'income-statement', { startDate: '2024-01-01', endDate: '2024-12-31' }]

// Account Transactions
['reports', 'account-transactions', { accountId: 'uuid', startDate, endDate, page: 1 }]
```

---

## 📊 Financial Reports Hooks

### useTrialBalance

```typescript
/**
 * Hook Specification: useTrialBalance
 * 
 * Purpose: Fetch trial balance report data
 * 
 * Query Key: ['reports', 'trial-balance', { asOfDate, accountType }]
 * 
 * Caching Strategy:
 * - staleTime: 5 minutes (historical data rarely changes)
 * - cacheTime: 30 minutes
 * - refetchOnWindowFocus: false (report data is stable)
 * - refetchOnMount: false
 * 
 * Error Handling:
 * - Retry: 3 times with exponential backoff
 * - Retry delay: 1s, 2s, 4s
 * - Custom error messages per error type:
 *   - 401: "Please log in to view reports"
 *   - 403: "You don't have permission to view this report"
 *   - 500: "Failed to generate report. Please try again."
 * 
 * Prefetching:
 * - Prefetch when user navigates to reports page
 * - Prefetch previous month's data when viewing current month
 * 
 * Optimistic Updates: Not applicable (read-only)
 */
interface UseTrialBalanceSpec {
  params: {
    asOfDate: Date;
    accountType: 'SECONDARY' | 'HOLDER';
  };
  
  options?: {
    enabled?: boolean;
    onSuccess?: (data: TrialBalance) => void;
    onError?: (error: Error) => void;
  };
  
  returns: {
    data: TrialBalance | undefined;
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
  };
}
```

### useIncomeStatement

```typescript
/**
 * Hook Specification: useIncomeStatement
 * 
 * Query Key: ['reports', 'income-statement', { startDate, endDate, comparative }]
 * 
 * Caching Strategy:
 * - staleTime: 10 minutes (more complex calculation)
 * - cacheTime: 1 hour
 * - refetchOnWindowFocus: false
 * 
 * Special Considerations:
 * - If comparative=true, prefetch previous period data
 * - Cache historical periods permanently (immutable)
 * 
 * Performance:
 * - Expected load time: <3s
 * - Timeout: 45s
 */
interface UseIncomeStatementSpec {
  params: {
    startDate: Date;
    endDate: Date;
    comparative?: boolean;
  };
  
  caching: {
    staleTime: 10 * 60 * 1000;
    cacheTime: 60 * 60 * 1000;
    refetchOnWindowFocus: false;
  };
  
  prefetching: {
    condition: 'comparative === true';
    prefetchData: 'previous period with same date range';
  };
}
```

### useBalanceSheet

```typescript
/**
 * Hook Specification: useBalanceSheet
 * 
 * Query Key: ['reports', 'balance-sheet', { asOfDate, detailed }]
 * 
 * Caching Strategy:
 * - staleTime: 5 minutes
 * - cacheTime: 30 minutes
 * - refetchOnWindowFocus: false
 * 
 * Retry Logic:
 * - Retry: 3 times
 * - Retry delay: exponential backoff
 * - Don't retry on 4xx errors (client errors)
 */
interface UseBalanceSheetSpec {
  params: {
    asOfDate: Date;
    detailed?: boolean;
  };
  
  retry: {
    count: 3;
    delay: 'exponential';
    retryOn: (error: Error) => boolean; // Don't retry 4xx
  };
}
```

### useCashFlowStatement

```typescript
/**
 * Hook Specification: useCashFlowStatement
 * 
 * Query Key: ['reports', 'cash-flow', { startDate, endDate, method }]
 * 
 * Caching Strategy:
 * - staleTime: 15 minutes (complex calculation)
 * - cacheTime: 1 hour
 * - refetchOnWindowFocus: false
 * 
 * Performance:
 * - Expected load time: <5s
 * - Show progress indicator for long-running queries
 * - Timeout: 60s
 */
interface UseCashFlowStatementSpec {
  params: {
    startDate: Date;
    endDate: Date;
    method: 'direct' | 'indirect';
  };
  
  performance: {
    expectedLoadTime: 5000; // ms
    timeout: 60000; // ms
    showProgressAfter: 2000; // ms
  };
}
```

---

## 📈 Account Reports Hooks

### useAccountTransactions

```typescript
/**
 * Hook Specification: useAccountTransactions
 * 
 * Query Key: ['reports', 'account-transactions', { accountId, startDate, endDate, page }]
 * 
 * Caching Strategy:
 * - staleTime: 2 minutes (more dynamic data)
 * - cacheTime: 15 minutes
 * - refetchOnWindowFocus: true (user may have added transactions)
 * 
 * Pagination:
 * - Use keepPreviousData: true for smooth pagination
 * - Prefetch next page when user scrolls to 80%
 * 
 * Optimistic Updates: Not applicable (read-only)
 */
interface UseAccountTransactionsSpec {
  params: {
    accountId: string;
    startDate: Date;
    endDate: Date;
    page: number;
    limit: number;
  };
  
  pagination: {
    keepPreviousData: true;
    prefetchNextPage: 'at 80% scroll';
  };
  
  caching: {
    staleTime: 2 * 60 * 1000;
    cacheTime: 15 * 60 * 1000;
    refetchOnWindowFocus: true;
  };
}
```

### useComparativeAccount

```typescript
/**
 * Hook Specification: useComparativeAccount
 * 
 * Query Key: ['reports', 'comparative-account', { parentAccountId, startDate, numberOfPeriods, periodType }]
 * 
 * Caching Strategy:
 * - staleTime: 10 minutes
 * - cacheTime: 1 hour
 * - refetchOnWindowFocus: false
 * 
 * Prefetching:
 * - Prefetch child accounts when parent is selected
 * - Prefetch adjacent periods
 */
interface UseComparativeAccountSpec {
  params: {
    parentAccountId: string;
    startDate: Date;
    numberOfPeriods: number;
    periodType: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUALLY' | 'ANNUALLY';
  };
  
  prefetching: {
    childAccounts: 'when parent selected';
    adjacentPeriods: 'previous and next period';
  };
}
```

### useAgeingAnalysis

```typescript
/**
 * Hook Specification: useAgeingAnalysis
 * 
 * Query Key: ['reports', 'ageing-analysis', { asOfDate, accountType, groupBy }]
 * 
 * Caching Strategy:
 * - staleTime: 5 minutes
 * - cacheTime: 30 minutes
 * - refetchOnWindowFocus: false
 * 
 * Error Handling:
 * - Retry: 3 times
 * - Show detailed error messages for data issues
 */
interface UseAgeingAnalysisSpec {
  params: {
    asOfDate: Date;
    accountType: 'RECEIVABLES' | 'PAYABLES';
    groupBy: 'CUSTOMER' | 'SUPPLIER' | 'ACCOUNT';
  };
  
  errorHandling: {
    retry: 3;
    customMessages: {
      noData: 'No outstanding invoices found';
      calculationError: 'Unable to calculate aging brackets';
    };
  };
}
```

---

## 💰 Sales Reports Hooks

### useSalesMovement

```typescript
/**
 * Hook Specification: useSalesMovement
 * 
 * Query Key: ['reports', 'sales-movement', { startDate, endDate, groupBy, includeVAT }]
 * 
 * Caching Strategy:
 * - staleTime: 5 minutes
 * - cacheTime: 30 minutes
 * - refetchOnWindowFocus: true (sales data changes frequently)
 * 
 * Prefetching:
 * - Prefetch when user navigates to sales reports
 * - Prefetch different groupBy options
 */
interface UseSalesMovementSpec {
  params: {
    startDate: Date;
    endDate: Date;
    groupBy: 'PRODUCT' | 'SERVICE' | 'CUSTOMER' | 'SALES_REP' | 'DATE';
    includeVAT: boolean;
  };
  
  prefetching: {
    trigger: 'navigation to sales reports';
    prefetchOptions: ['PRODUCT', 'CUSTOMER', 'DATE'];
  };
}
```

### useSalesLevels

```typescript
/**
 * Hook Specification: useSalesLevels
 * 
 * Query Key: ['reports', 'sales-levels', { reportType, mode, startDate, numberOfPeriods, periodType }]
 * 
 * Caching Strategy:
 * - staleTime: 10 minutes
 * - cacheTime: 1 hour
 * - refetchOnWindowFocus: false
 * 
 * Performance:
 * - Complex calculation, may take 3-5s
 * - Show loading skeleton
 */
interface UseSalesLevelsSpec {
  params: {
    reportType: 'P_LEVELS' | 'G_LEVELS';
    mode: 'SERVICE_MODE' | 'SERVICE_LINES' | 'SERVICES';
    startDate: Date;
    numberOfPeriods: number;
    periodType: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUALLY' | 'ANNUALLY';
  };
  
  performance: {
    expectedLoadTime: 4000; // ms
    showSkeletonAfter: 500; // ms
  };
}
```

---

## 👥 Payroll Reports Hooks

### useSalariesRegister

```typescript
/**
 * Hook Specification: useSalariesRegister
 * 
 * Query Key: ['reports', 'salaries-register', { month, year, includeInactive }]
 * 
 * Caching Strategy:
 * - staleTime: 10 minutes
 * - cacheTime: 1 hour
 * - refetchOnWindowFocus: false
 * 
 * Security:
 * - Requires ADMIN or MANAGER role
 * - Audit log all accesses
 * 
 * Error Handling:
 * - 403: "You don't have permission to view payroll data"
 */
interface UseSalariesRegisterSpec {
  params: {
    month: number; // 1-12
    year: number;
    includeInactive: boolean;
  };
  
  security: {
    requiredRoles: ['ADMIN', 'MANAGER'];
    auditLog: true;
  };
  
  errorHandling: {
    403: 'Insufficient permissions for payroll data';
  };
}
```

---

## 🔄 Export Hooks (Mutations)

### useExportReport

```typescript
/**
 * Hook Specification: useExportReport
 * 
 * Purpose: Export report to PDF/Excel/CSV
 * 
 * Mutation Key: ['reports', 'export']
 * 
 * Success Handling:
 * - Show success toast
 * - Trigger download
 * - Log export action
 * 
 * Error Handling:
 * - Retry: 2 times
 * - Show error toast with retry button
 * 
 * Rate Limiting:
 * - Max 10 exports per hour per user
 */
interface UseExportReportSpec {
  params: {
    reportType: string;
    format: 'PDF' | 'EXCEL' | 'CSV';
    reportData: any;
  };
  
  onSuccess: {
    showToast: 'Report exported successfully';
    triggerDownload: true;
    logAction: true;
  };
  
  onError: {
    retry: 2;
    showToast: 'Export failed. Please try again.';
    showRetryButton: true;
  };
  
  rateLimit: {
    maxExports: 10;
    perHour: true;
  };
}
```

---

## 🎯 Cache Invalidation Strategy

### When to Invalidate Cache

```typescript
/**
 * Cache Invalidation Specification
 * 
 * Trigger: Transaction created/updated/deleted
 * Invalidate: All financial and account reports
 * 
 * Trigger: Account modified
 * Invalidate: All reports using that account
 * 
 * Trigger: Sales entry created
 * Invalidate: Sales reports
 * 
 * Trigger: Salary payment processed
 * Invalidate: Payroll reports
 */
interface CacheInvalidationSpec {
  onTransactionChange: {
    invalidate: [
      'trial-balance',
      'income-statement',
      'balance-sheet',
      'cash-flow',
      'account-transactions'
    ];
  };
  
  onAccountChange: {
    invalidate: 'all reports using accountId';
  };
  
  onSalesChange: {
    invalidate: ['sales-movement', 'sales-levels'];
  };
  
  onPayrollChange: {
    invalidate: ['salaries-register', 'payslip', 'commissions'];
  };
}
```

---

## ✅ Implementation Checklist

### Week 2: Core Hooks
- [ ] Create hook specifications for all 22 reports
- [ ] Define query key structure
- [ ] Define caching strategies
- [ ] Define error handling patterns

### Week 3: Advanced Features
- [ ] Define prefetching strategies
- [ ] Define cache invalidation rules
- [ ] Define pagination patterns
- [ ] Define export mutation hooks

### Week 4: Testing
- [ ] Test caching behavior
- [ ] Test error handling
- [ ] Test prefetching
- [ ] Test cache invalidation

---

*These specifications provide a complete blueprint for implementing React Query hooks for all reports.*
