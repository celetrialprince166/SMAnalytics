# Phase 3 Architecture - Developer Quick Start

**Last Updated**: November 17, 2025  
**Purpose**: Quick reference for developers implementing reports

---

## 🚀 Quick Start Checklist

### Before You Start
- [ ] Read `PHASE3_COMPLETE.md` for overview
- [ ] Review `01_GAP_ANALYSIS_COMPLETE.md` for critical gaps
- [ ] Understand security requirements in `06_SECURITY_PLAN.md`

### For Each Report Implementation
- [ ] Check API specification in `02_API_SPECIFICATIONS.md`
- [ ] Review database queries in `03_DATABASE_DESIGN.md`
- [ ] Follow React Query hook pattern in `04_REACT_QUERY_HOOKS.md`
- [ ] Use utilities from `05_UTILITY_LIBRARIES.md`
- [ ] Test performance against targets in `07_PERFORMANCE_PLAN.md`

---

## 📋 Implementation Pattern

### 1. Create API Endpoint

```typescript
// app/api/reports/trial-balance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireOrganizationAccess } from '@/lib/middleware/auth';
import { checkReportPermission } from '@/lib/middleware/permissions';
import { generateTrialBalance } from '@/lib/services/ReportService';

export async function GET(req: NextRequest) {
  // 1. Authentication & Authorization
  const authError = await requireOrganizationAccess(req);
  if (authError) return authError;
  
  const user = await getCurrentUser(req);
  const hasAccess = await checkReportPermission(user.id, 'trial-balance', user.organizationId);
  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // 2. Parse & Validate Parameters
  const { searchParams } = new URL(req.url);
  const asOfDate = new Date(searchParams.get('asOfDate') || '');
  const accountType = searchParams.get('accountType') || 'SECONDARY';
  
  // 3. Generate Report with Transaction Isolation
  const report = await generateReportWithIsolation(
    user.organizationId,
    async (tx) => {
      return await generateTrialBalance(tx, asOfDate, accountType);
    }
  );
  
  // 4. Audit Log
  await logReportAccess({
    userId: user.id,
    organizationId: user.organizationId,
    reportType: 'trial-balance',
    action: 'GENERATED',
    parameters: { asOfDate, accountType }
  });
  
  // 5. Return Response
  return NextResponse.json({
    success: true,
    data: report,
    metadata: {
      generatedAt: new Date(),
      recordCount: report.accounts.length
    }
  });
}
```

### 2. Create React Query Hook

```typescript
// lib/hooks/useTrialBalance.ts
import { useQuery } from '@tanstack/react-query';
import { apiReportService } from '@/lib/services/ApiReportService';

export function useTrialBalance(
  asOfDate: Date,
  accountType: 'SECONDARY' | 'HOLDER',
  options?: UseQueryOptions
) {
  return useQuery({
    queryKey: ['reports', 'trial-balance', { asOfDate, accountType }],
    queryFn: () => apiReportService.generateTrialBalance(asOfDate, accountType),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options
  });
}
```

### 3. Create Report Component

```typescript
// components/reports/TrialBalanceReport.tsx
import { useTrialBalance } from '@/lib/hooks/useTrialBalance';
import { ReportErrorBoundary } from './shared/ReportErrorBoundary';
import { ReportSkeleton } from './shared/ReportSkeleton';
import { ReportEmptyState } from './shared/ReportEmptyState';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';

export function TrialBalanceReport({ asOfDate, accountType }) {
  const { data, isLoading, isError, error } = useTrialBalance(asOfDate, accountType);
  
  // Loading state
  if (isLoading) {
    return <ReportSkeleton type="table" />;
  }
  
  // Error state
  if (isError) {
    throw error; // Caught by ErrorBoundary
  }
  
  // Empty state
  if (!data || data.accounts.length === 0) {
    return <ReportEmptyState reportType="trial-balance" />;
  }
  
  // Render report
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Trial Balance</h2>
        <p className="text-sm text-gray-500">
          As of {formatDate(asOfDate, 'long')}
        </p>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Account Code</TableHead>
            <TableHead>Account Name</TableHead>
            <TableHead className="text-right">Debit</TableHead>
            <TableHead className="text-right">Credit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.accounts.map((account) => (
            <TableRow key={account.accountId}>
              <TableCell>{account.accountCode}</TableCell>
              <TableCell>{account.accountName}</TableCell>
              <TableCell className="text-right">
                {formatCurrency(account.debitBalance)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(account.creditBalance)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={2} className="font-bold">Total</TableCell>
            <TableCell className="text-right font-bold">
              {formatCurrency(data.totalDebits)}
            </TableCell>
            <TableCell className="text-right font-bold">
              {formatCurrency(data.totalCredits)}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
      
      {!data.isBalanced && (
        <Alert variant="destructive">
          <AlertTitle>Trial Balance Not Balanced</AlertTitle>
          <AlertDescription>
            Variance: {formatCurrency(data.variance)}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// Wrap with error boundary
export default function TrialBalanceReportWithBoundary(props) {
  return (
    <ReportErrorBoundary reportType="trial-balance">
      <TrialBalanceReport {...props} />
    </ReportErrorBoundary>
  );
}
```

---

## 🔒 Security Checklist

For every report implementation:

- [ ] **Multi-tenancy**: All queries include `organizationId` filter
- [ ] **Authentication**: Endpoint requires valid JWT token
- [ ] **Authorization**: Check user has permission for report
- [ ] **Audit Logging**: Log all report access
- [ ] **Input Validation**: Validate all parameters with Zod
- [ ] **SQL Injection**: Use Prisma query builder (no raw SQL)
- [ ] **XSS Prevention**: Never use `dangerouslySetInnerHTML`
- [ ] **Transaction Isolation**: Use transaction wrapper for consistency

---

## 🚀 Performance Checklist

For every report implementation:

- [ ] **Database Indexes**: Verify required indexes exist
- [ ] **Query Optimization**: Select only needed fields
- [ ] **Caching**: Configure appropriate staleTime/cacheTime
- [ ] **Pagination**: Implement for large datasets
- [ ] **Loading States**: Show skeleton while loading
- [ ] **Error Handling**: Graceful error recovery
- [ ] **Bundle Size**: Lazy load report components
- [ ] **Performance Target**: Meet SLA for report type

---

## 📦 Required Utilities

### Formatters
```typescript
import { formatCurrency, formatDate, formatNumber, formatPercent } from '@/lib/utils/formatters';
```

### Validation
```typescript
import { TrialBalanceSchema } from '@/lib/validation/reportSchemas';
const validated = TrialBalanceSchema.parse(data);
```

### Components
```typescript
import { ReportErrorBoundary } from '@/components/reports/shared/ReportErrorBoundary';
import { ReportSkeleton } from '@/components/reports/shared/ReportSkeleton';
import { ReportEmptyState } from '@/components/reports/shared/ReportEmptyState';
```

---

## 🧪 Testing Checklist

For every report implementation:

- [ ] **Unit Tests**: Test report generation logic
- [ ] **Integration Tests**: Test API endpoint
- [ ] **Security Tests**: Test multi-tenancy isolation
- [ ] **Performance Tests**: Verify meets SLA
- [ ] **Error Tests**: Test error handling
- [ ] **Edge Cases**: Test with no data, large datasets
- [ ] **User Acceptance**: Test with real users

---

## 📊 Common Patterns

### Date Range Reports
```typescript
const { data } = useIncomeStatement(startDate, endDate);
```

### Point-in-Time Reports
```typescript
const { data } = useTrialBalance(asOfDate, accountType);
```

### Paginated Reports
```typescript
const { data } = useAccountTransactions(accountId, startDate, endDate, page);
```

### Comparative Reports
```typescript
const { data } = useComparativeAccount(accountId, startDate, numberOfPeriods, periodType);
```

---

## 🐛 Common Issues & Solutions

### Issue: Slow Query Performance
**Solution**: Check database indexes, optimize query, add caching

### Issue: Multi-tenancy Data Leakage
**Solution**: Verify organizationId filter in all queries

### Issue: Inconsistent Formatting
**Solution**: Use centralized formatters

### Issue: Poor Error Messages
**Solution**: Use custom error messages per error type

### Issue: Cache Not Invalidating
**Solution**: Check cache invalidation rules

---

## 📚 Reference Documents

- **Gap Analysis**: `01_GAP_ANALYSIS_COMPLETE.md`
- **API Specs**: `02_API_SPECIFICATIONS.md`
- **Database Design**: `03_DATABASE_DESIGN.md`
- **React Query Hooks**: `04_REACT_QUERY_HOOKS.md`
- **Utilities**: `05_UTILITY_LIBRARIES.md`
- **Security**: `06_SECURITY_PLAN.md`
- **Performance**: `07_PERFORMANCE_PLAN.md`
- **Complete Summary**: `PHASE3_COMPLETE.md`

---

## 🎯 Success Criteria

Your report implementation is complete when:

- ✅ API endpoint follows specification
- ✅ React Query hook follows pattern
- ✅ Component uses shared utilities
- ✅ All security checks pass
- ✅ Performance meets SLA
- ✅ Tests pass
- ✅ Code review approved

---

*Quick Start Guide - Phase 3 Architecture Design*
