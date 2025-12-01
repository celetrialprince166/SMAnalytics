# Database Design - Optimized Schema for Reports

**Document Version**: 1.0  
**Created**: November 17, 2025  
**Purpose**: Complete database design optimizations for report performance and security

---

## 🎯 Overview

This document addresses:
- **Critical Gap #20**: Database indexes strategy
- **Critical Gap #22**: Transaction isolation
- **Critical Gap #5**: Multi-tenancy security at database level
- Performance optimization for all 22 reports
- Prisma query patterns and best practices

---

## 📊 Required Database Indexes

### Critical Indexes for Report Performance

```sql
-- Transaction queries (used by ALL reports)
CREATE INDEX CONCURRENTLY idx_transactions_org_date 
  ON transactions(organization_id, date DESC);

CREATE INDEX CONCURRENTLY idx_transactions_org_debit_date 
  ON transactions(organization_id, debit_account_id, date DESC);

CREATE INDEX CONCURRENTLY idx_transactions_org_credit_date 
  ON transactions(organization_id, credit_account_id, date DESC);

-- Account queries
CREATE INDEX CONCURRENTLY idx_accounts_org_active 
  ON holder_accounts(organization_id, is_active);

CREATE INDEX CONCURRENTLY idx_accounts_org_type 
  ON holder_accounts(organization_id, account_type);

-- Sales queries
CREATE INDEX CONCURRENTLY idx_sales_org_date 
  ON sales_entries(organization_id, date DESC);

CREATE INDEX CONCURRENTLY idx_sales_org_product 
  ON sales_entries(organization_id, product_id, date DESC);

-- Payroll queries
CREATE INDEX CONCURRENTLY idx_salaries_org_month 
  ON salary_payments(organization_id, month, year);

CREATE INDEX CONCURRENTLY idx_employees_org_active 
  ON employees(organization_id, is_active);
```

---

## 🔒 Multi-Tenancy Security (Gap #5)

### Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE holder_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_payments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY tenant_isolation_transactions ON transactions
  FOR ALL TO authenticated
  USING (organization_id = current_setting('app.current_organization_id')::uuid);

CREATE POLICY tenant_isolation_accounts ON holder_accounts
  FOR ALL TO authenticated
  USING (organization_id = current_setting('app.current_organization_id')::uuid);
```

### Prisma Middleware for Organization Filtering

```typescript
// lib/prisma/middleware.ts
export const organizationFilterMiddleware = (organizationId: string) => {
  return async (params: any, next: any) => {
    // Add organizationId to all queries
    if (params.model && params.action !== 'count') {
      if (!params.args) params.args = {};
      if (!params.args.where) params.args.where = {};
      
      params.args.where.organizationId = organizationId;
    }
    
    return next(params);
  };
};
```

---

## 🔄 Transaction Isolation (Gap #22)

### Report Generation with Consistent Snapshot

```typescript
// Specification for report generation
async function generateReportWithIsolation<T>(
  organizationId: string,
  reportFn: (tx: PrismaTransaction) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(
    async (tx) => {
      // All queries see consistent snapshot
      return await reportFn(tx);
    },
    {
      isolationLevel: 'ReadCommitted',
      timeout: 30000, // 30 seconds
      maxWait: 5000   // 5 seconds max wait for transaction
    }
  );
}

// Usage example
const trialBalance = await generateReportWithIsolation(
  user.organizationId,
  async (tx) => {
    const accounts = await tx.holderAccount.findMany({
      where: { organizationId: user.organizationId }
    });
    
    const transactions = await tx.transaction.findMany({
      where: {
        organizationId: user.organizationId,
        date: { lte: asOfDate }
      }
    });
    
    return calculateTrialBalance(accounts, transactions);
  }
);
```

---

## 📈 Optimized Prisma Queries

### Trial Balance Query Pattern

```typescript
// Specification: Optimized query for trial balance
interface TrialBalanceQuerySpec {
  // Use transaction to ensure consistency
  isolation: 'ReadCommitted';
  
  // Query pattern
  query: {
    accounts: {
      where: {
        organizationId: string;
        isActive: true;
        accountType?: 'SECONDARY' | 'HOLDER';
      };
      include: {
        secondaryAccount: {
          include: {
            primaryAccount: true
          }
        }
      };
    };
    
    transactions: {
      where: {
        organizationId: string;
        date: { lte: Date };
      };
      select: {
        debitAccountId: true;
        creditAccountId: true;
        amount: true;
      };
    };
  };
  
  // Performance considerations
  performance: {
    useIndex: 'idx_transactions_org_date';
    estimatedRows: '<10000';
    estimatedTime: '<2s';
  };
}
```

### Income Statement Query Pattern

```typescript
// Specification: Optimized query for income statement
interface IncomeStatementQuerySpec {
  // Query pattern
  query: {
    revenueAccounts: {
      where: {
        organizationId: string;
        accountType: 'REVENUE';
      };
    };
    
    expenseAccounts: {
      where: {
        organizationId: string;
        accountType: 'EXPENSES';
      };
    };
    
    transactions: {
      where: {
        organizationId: string;
        date: { gte: Date; lte: Date };
        OR: [
          { debitAccount: { accountType: 'REVENUE' } },
          { creditAccount: { accountType: 'REVENUE' } },
          { debitAccount: { accountType: 'EXPENSES' } },
          { creditAccount: { accountType: 'EXPENSES' } }
        ];
      };
    };
  };
  
  // Performance optimization
  performance: {
    useIndexes: [
      'idx_transactions_org_date',
      'idx_accounts_org_type'
    ];
    cacheStrategy: 'historical-periods-permanent';
  };
}
```

---

## 🚀 Performance Optimization Strategies

### 1. Query Batching

```typescript
// Specification: Batch multiple report queries
interface QueryBatchingSpec {
  pattern: 'Promise.all';
  
  example: {
    // Instead of sequential
    sequential: 'await query1(); await query2(); await query3();';
    
    // Use parallel
    parallel: 'await Promise.all([query1(), query2(), query3()]);';
  };
  
  benefit: 'Reduce total query time by 60-70%';
}
```

### 2. Materialized Views for Complex Reports

```sql
-- Specification: Monthly account balances view
CREATE MATERIALIZED VIEW monthly_account_balances AS
SELECT 
  organization_id,
  account_id,
  DATE_TRUNC('month', date) as month,
  SUM(CASE WHEN debit_account_id = account_id THEN amount ELSE 0 END) as total_debits,
  SUM(CASE WHEN credit_account_id = account_id THEN amount ELSE 0 END) as total_credits
FROM transactions
GROUP BY organization_id, account_id, DATE_TRUNC('month', date);

-- Refresh strategy
CREATE INDEX ON monthly_account_balances(organization_id, month);
REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_account_balances;
```

---

## 📋 Database Schema Additions

### Report Metadata Storage (Gap #21)

```prisma
model ReportHistory {
  id             String   @id @default(cuid())
  reportType     String
  parameters     Json
  generatedBy    String
  generatedAt    DateTime @default(now())
  organizationId String
  executionTime  Int      // milliseconds
  recordCount    Int
  
  organization   Organization @relation(fields: [organizationId], references: [id])
  user          User         @relation(fields: [generatedBy], references: [id])
  
  @@index([organizationId, reportType, generatedAt])
}

model ReportFavorite {
  id             String   @id @default(cuid())
  reportType     String
  parameters     Json
  name           String
  userId         String
  organizationId String
  createdAt      DateTime @default(now())
  
  user          User         @relation(fields: [userId], references: [id])
  organization  Organization @relation(fields: [organizationId], references: [id])
  
  @@unique([userId, reportType, name])
}
```

---

## ✅ Implementation Checklist

### Week 1: Critical Indexes
- [ ] Create transaction indexes
- [ ] Create account indexes
- [ ] Create sales indexes
- [ ] Create payroll indexes
- [ ] Test query performance

### Week 2: Security
- [ ] Implement RLS policies
- [ ] Create Prisma middleware
- [ ] Test multi-tenancy isolation
- [ ] Audit all queries

### Week 3: Optimization
- [ ] Implement transaction isolation
- [ ] Create materialized views
- [ ] Implement query batching
- [ ] Performance testing

---

*This database design ensures optimal performance and security for all report queries.*
