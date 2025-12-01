# Utility Libraries - Centralized Specifications

**Document Version**: 1.0  
**Created**: November 17, 2025  
**Purpose**: Centralized utility specifications addressing Gap #13

---

## 🎯 Overview

This document provides specifications for centralized utilities:
- Formatting library (Gap #13)
- Validation library
- Error boundaries
- Loading components
- Empty state components

---

## 💰 Formatting Library Specification

### Currency Formatting

```typescript
/**
 * Currency Formatter Specification
 * 
 * Library: Native Intl.NumberFormat
 * Justification: Built-in, no dependencies, locale-aware
 * 
 * Features:
 * - Locale-aware formatting
 * - Company settings integration
 * - Zero value handling
 * - Negative value styling
 */
interface CurrencyFormatterSpec {
  function: 'formatCurrency';
  
  signature: {
    input: {
      amount: number;
      locale?: string; // Default from company settings
      currency?: string; // Default from company settings
    };
    output: string;
  };
  
  implementation: {
    library: 'Intl.NumberFormat';
    options: {
      minimumFractionDigits: 2;
      maximumFractionDigits: 2;
    };
  };
  
  examples: {
    positive: 'formatCurrency(1234.56) => "1,234.56"';
    negative: 'formatCurrency(-1234.56) => "(1,234.56)"';
    zero: 'formatCurrency(0) => "-"';
  };
}
```

### Date Formatting

```typescript
/**
 * Date Formatter Specification
 * 
 * Library: date-fns (already in project)
 * Justification: Lightweight, tree-shakeable, TypeScript support
 * 
 * Features:
 * - Multiple format options
 * - Relative dates
 * - Date range formatting
 */
interface DateFormatterSpec {
  function: 'formatDate';
  
  signature: {
    input: {
      date: Date;
      format: 'short' | 'long' | 'iso' | 'relative';
    };
    output: string;
  };
  
  implementation: {
    library: 'date-fns';
    functions: ['format', 'formatDistance', 'formatRelative'];
  };
  
  examples: {
    short: 'formatDate(date, "short") => "12/31/24"';
    long: 'formatDate(date, "long") => "December 31, 2024"';
    iso: 'formatDate(date, "iso") => "2024-12-31"';
    relative: 'formatDate(date, "relative") => "2 days ago"';
  };
}
```

### Number Formatting

```typescript
/**
 * Number Formatter Specification
 * 
 * Library: Native Intl.NumberFormat
 * Justification: Built-in, consistent with currency formatting
 * 
 * Features:
 * - Decimal formatting
 * - Percentage formatting
 * - Compact notation (1K, 1M)
 */
interface NumberFormatterSpec {
  functions: ['formatNumber', 'formatPercent', 'formatCompact'];
  
  formatNumber: {
    input: { value: number; decimals?: number };
    output: string;
    example: 'formatNumber(1234.567, 2) => "1,234.57"';
  };
  
  formatPercent: {
    input: { value: number; decimals?: number };
    output: string;
    example: 'formatPercent(0.1234, 2) => "12.34%"';
  };
  
  formatCompact: {
    input: { value: number };
    output: string;
    example: 'formatCompact(1234567) => "1.2M"';
  };
}
```

### Centralized Formatter Factory

```typescript
/**
 * Formatter Factory Specification
 * 
 * Purpose: Create formatters with company settings
 * Pattern: Factory pattern
 * 
 * Benefits:
 * - Consistent formatting across app
 * - Easy to update company settings
 * - Type-safe
 */
interface FormatterFactorySpec {
  function: 'createFormatters';
  
  signature: {
    input: {
      locale: string;
      currency: string;
      dateFormat: string;
    };
    output: {
      currency: (amount: number) => string;
      date: (date: Date, format?: string) => string;
      number: (value: number, decimals?: number) => string;
      percent: (value: number, decimals?: number) => string;
    };
  };
  
  usage: {
    pattern: 'const formatters = createFormatters(companySettings);';
    example: 'formatters.currency(1234.56) => "GH₵ 1,234.56"';
  };
}
```

---

## ✅ Validation Library Specification

### Report Data Validation

```typescript
/**
 * Validation Library Specification
 * 
 * Library: Zod (already in project)
 * Justification: TypeScript-first, runtime validation, type inference
 * 
 * Purpose: Validate report data before rendering
 * Addresses: Gap #15 (Data Validation Layer)
 */
interface ValidationLibrarySpec {
  library: 'zod';
  
  schemas: {
    TrialBalance: 'z.object({ ... })';
    IncomeStatement: 'z.object({ ... })';
    BalanceSheet: 'z.object({ ... })';
    // ... all report types
  };
  
  usage: {
    pattern: 'const validated = TrialBalanceSchema.parse(data);';
    errorHandling: 'try-catch with custom error messages';
  };
  
  benefits: [
    'Runtime type safety',
    'Automatic TypeScript types',
    'Detailed error messages',
    'Composable schemas'
  ];
}
```

### Example Schema

```typescript
/**
 * Trial Balance Schema Specification
 */
interface TrialBalanceSchemaSpec {
  schema: {
    asOfDate: 'z.date()';
    accountType: 'z.enum(["SECONDARY", "HOLDER"])';
    accounts: 'z.array(AccountSchema)';
    totalDebits: 'z.number().min(0)';
    totalCredits: 'z.number().min(0)';
    isBalanced: 'z.boolean()';
    variance: 'z.number()';
  };
  
  validation: {
    custom: [
      'Check totalDebits === totalCredits (within tolerance)',
      'Check all accounts have valid IDs',
      'Check no negative balances'
    ];
  };
}
```

---

## 🚨 Error Boundary Specification

### Report Error Boundary

```typescript
/**
 * Error Boundary Specification
 * 
 * Library: react-error-boundary
 * Justification: Standard React error boundary with hooks support
 * 
 * Purpose: Catch and handle report rendering errors
 * Addresses: Gap #18 (Error Handling UI)
 */
interface ErrorBoundarySpec {
  library: 'react-error-boundary';
  
  component: 'ReportErrorBoundary';
  
  props: {
    reportType: string;
    onError: '(error, errorInfo) => void';
    onReset: '() => void';
  };
  
  fallback: {
    component: 'ReportErrorFallback';
    features: [
      'Error message display',
      'Retry button',
      'Contact support link',
      'Error details (dev mode only)'
    ];
  };
  
  errorLogging: {
    service: 'Sentry or similar';
    metadata: ['reportType', 'userId', 'organizationId', 'timestamp'];
  };
}
```

### Error Fallback Component

```typescript
/**
 * Error Fallback Component Specification
 */
interface ReportErrorFallbackSpec {
  component: 'ReportErrorFallback';
  
  props: {
    error: Error;
    reportType: string;
    resetErrorBoundary: '() => void';
  };
  
  ui: {
    icon: 'AlertCircle (lucide-react)';
    title: 'Failed to generate report';
    message: 'Custom message based on error type';
    actions: [
      'Retry button',
      'Go back button',
      'Contact support link'
    ];
  };
  
  errorMessages: {
    NetworkError: 'Network connection lost. Please check your internet.';
    ValidationError: 'Report data is invalid. Please contact support.';
    PermissionError: 'You don\'t have permission to view this report.';
    TimeoutError: 'Report generation timed out. Please try again.';
    UnknownError: 'An unexpected error occurred. Please try again.';
  };
}
```

---

## ⏳ Loading Component Specification

### Report Skeleton Loader

```typescript
/**
 * Loading Component Specification
 * 
 * Library: Shadcn/ui Skeleton (already in project)
 * Justification: Consistent with existing UI, customizable
 * 
 * Purpose: Show loading state while report generates
 * Addresses: Gap #17 (Loading States Strategy)
 */
interface LoadingComponentSpec {
  library: 'shadcn/ui Skeleton';
  
  components: {
    TableSkeleton: {
      props: { rows: number; columns: number };
      usage: 'For tabular reports';
    };
    
    ChartSkeleton: {
      props: { height: number };
      usage: 'For chart-based reports';
    };
    
    SummarySkeleton: {
      props: { cards: number };
      usage: 'For summary cards';
    };
  };
  
  pattern: {
    usage: 'if (loading) return <ReportSkeleton type="table" />;';
    transition: 'Fade in actual content when loaded';
  };
}
```

### Progress Indicator

```typescript
/**
 * Progress Indicator Specification
 * 
 * Purpose: Show progress for long-running reports
 * Use case: Reports taking >2 seconds
 */
interface ProgressIndicatorSpec {
  component: 'ReportProgressIndicator';
  
  props: {
    reportType: string;
    estimatedTime: number; // seconds
  };
  
  ui: {
    progressBar: 'Linear progress bar';
    message: 'Generating report... (estimated X seconds)';
    cancelButton: 'Optional cancel button';
  };
  
  behavior: {
    showAfter: 2000; // ms
    updateInterval: 500; // ms
    timeout: 60000; // ms
  };
}
```

---

## 📭 Empty State Component Specification

### Report Empty State

```typescript
/**
 * Empty State Component Specification
 * 
 * Purpose: Show when report has no data
 * Addresses: Gap #19 (Empty State Handling)
 */
interface EmptyStateSpec {
  component: 'ReportEmptyState';
  
  props: {
    reportType: string;
    onAction?: '() => void';
  };
  
  configuration: {
    'trial-balance': {
      icon: 'FileText';
      title: 'No accounts found';
      description: 'Create some accounts to see your trial balance';
      actionLabel: 'Create Account';
      actionPath: '/manage/accounts';
    };
    
    'income-statement': {
      icon: 'TrendingUp';
      title: 'No transactions found';
      description: 'Add transactions to generate income statement';
      actionLabel: 'Add Transaction';
      actionPath: '/transactions/accounts';
    };
    
    // ... other report types
  };
  
  ui: {
    layout: 'Centered with icon, title, description, action button';
    styling: 'Consistent with Shadcn/ui design system';
  };
}
```

---

## 📦 File Structure

```
lib/utils/
├── formatters/
│   ├── index.ts           # Export all formatters
│   ├── currency.ts        # Currency formatting
│   ├── date.ts            # Date formatting
│   ├── number.ts          # Number formatting
│   └── factory.ts         # Formatter factory
│
├── validation/
│   ├── index.ts           # Export all schemas
│   ├── reportSchemas.ts   # Report validation schemas
│   └── validators.ts      # Custom validators
│
components/reports/shared/
├── ReportErrorBoundary.tsx
├── ReportErrorFallback.tsx
├── ReportSkeleton.tsx
├── ReportProgressIndicator.tsx
└── ReportEmptyState.tsx
```

---

## ✅ Implementation Checklist

### Week 2: Formatters
- [ ] Create currency formatter
- [ ] Create date formatter
- [ ] Create number formatter
- [ ] Create formatter factory
- [ ] Test with different locales

### Week 2: Validation
- [ ] Create Zod schemas for all reports
- [ ] Create custom validators
- [ ] Test validation with edge cases

### Week 3: UI Components
- [ ] Create error boundary
- [ ] Create error fallback
- [ ] Create skeleton loaders
- [ ] Create progress indicator
- [ ] Create empty states

### Week 4: Integration
- [ ] Integrate formatters in all reports
- [ ] Integrate validation in all reports
- [ ] Integrate error boundaries
- [ ] Integrate loading states
- [ ] Integrate empty states

---

*These utility specifications ensure consistency and maintainability across all 22 reports.*
