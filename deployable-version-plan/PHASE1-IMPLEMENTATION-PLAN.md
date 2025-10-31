# Phase 1: Foundation Setup - Detailed Implementation Plan

## Executive Summary

This document provides a comprehensive, step-by-step implementation plan for Phase 1 of the migration from localStorage to Supabase/Prisma. This phase focuses on setting up the foundation: Prisma schema, database migrations, environment configuration, and authentication setup.

**Duration**: 7-10 days  
**Status**: Ready to Start  
**Priority**: Critical - Blocks all other phases

---

## Pre-Implementation Checklist

### ✅ Prerequisites Confirmed
- [x] Supabase API Key configured: `DATABASE_URL` in `.env`
- [x] Existing localStorage-based code analyzed
- [x] Repository patterns understood
- [x] Business logic documented
- [x] Cursor rules updated with migration guidelines

### 📋 Dependencies Installed
- [x] `@prisma/client` (production dependency)
- [x] `prisma` (dev dependency)
- [x] Supabase connection string configured

---

## Task Breakdown

### Task 1.1: Prisma Setup & Configuration (Day 1)

#### **Objective**: Initialize Prisma and connect to Supabase

#### **Steps**:

1. **Install Prisma CLI** (if not already installed)
```bash
npm install -D prisma
npm install @prisma/client
```

2. **Initialize Prisma**
```bash
npx prisma init
```

3. **Configure .env file** (Already done ✓)
```env
# Database connection
DATABASE_URL="postgresql://postgres:[YOUR_PASSWORD]@db.[YOUR_PROJECT_REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"

# Direct connection for migrations
DIRECT_URL="postgresql://postgres:[YOUR_PASSWORD]@db.[YOUR_PROJECT_REF].supabase.co:5432/postgres"

# Supabase API keys
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR_PROJECT_REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR_ANON_KEY]"
SUPABASE_SERVICE_ROLE_KEY="[YOUR_SERVICE_ROLE_KEY]"
```

4. **Update prisma/schema.prisma configuration**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

#### **Expected Outcomes**:
- ✅ Prisma is initialized
- ✅ Connection to Supabase is configured
- ✅ Environment variables are properly set

---

### Task 1.2: Define Prisma Schema (Day 1-2)

#### **Objective**: Create comprehensive Prisma schema based on existing types

#### **Files to Reference**:
- `types/accounts.ts` → Account models
- `types/transactions.ts` → Transaction models
- `types/products.ts` → Product/Sales models
- `types/payroll.ts` → Employee/Payroll models
- `types/fixedAssets.ts` → Fixed Asset models
- `types/clients.ts` → Client models

#### **Implementation Strategy**:

**Create `prisma/schema.prisma`** with the following structure:

```prisma
// ============================================
// STEP 1: Core Models (Organization & Users)
// ============================================

model Organization {
  id        String   @id @default(uuid())
  name      String
  slug      String   @unique
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations (to be added progressively)
  users              User[]
  primaryAccounts    PrimaryAccount[]
  secondaryAccounts  SecondaryAccount[]
  holderAccounts     HolderAccount[]
  transactions       Transaction[]
  splitTransactions  SplitTransaction[]
  products           Product[]
  salesEntries       SalesEntry[]
  clients            Client[]
  employees          Employee[]
  fixedAssets        FixedAsset[]
  taxConfigurations  TaxConfiguration[]
  pensionConfigurations PensionConfiguration[]
  salaryEntries      SalaryEntry[]
  commissions        Commission[]
  companySettings    CompanySettings?

  @@index([slug])
  @@map("organizations")
}

model User {
  id             String   @id @default(uuid())
  organizationId String
  email          String   @unique
  username       String   @unique
  passwordHash   String
  firstName      String?
  lastName       String?
  role           UserRole @default(USER)
  isActive       Boolean  @default(true)
  lastLoginAt    DateTime?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Relations
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@index([organizationId])
  @@index([email])
  @@index([username])
  @@map("users")
}

enum UserRole {
  ADMIN
  MANAGER
  ACCOUNTANT
  USER
}

// ============================================
// STEP 2: Account Hierarchy Models
// ============================================

model PrimaryAccount {
  id             String   @id @default(uuid())
  organizationId String
  name           String
  type           AccountType
  description    String?
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Relations
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  secondaryAccounts SecondaryAccount[]

  @@unique([organizationId, name])
  @@index([organizationId, type])
  @@map("primary_accounts")
}

enum AccountType {
  ASSETS
  LIABILITIES
  EQUITY
  REVENUE
  EXPENSES
}

model SecondaryAccount {
  id               String   @id @default(uuid())
  organizationId   String
  primaryAccountId String
  name             String
  code             String
  description      String?
  isActive         Boolean  @default(true)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  // Relations
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  primaryAccount PrimaryAccount @relation(fields: [primaryAccountId], references: [id], onDelete: Cascade)
  holderAccounts HolderAccount[]

  @@unique([organizationId, code])
  @@index([organizationId, primaryAccountId])
  @@map("secondary_accounts")
}

model HolderAccount {
  id                 String   @id @default(uuid())
  organizationId     String
  secondaryAccountId String
  code               String
  name               String
  description        String?
  balance            Decimal  @default(0) @db.Decimal(15, 2)
  isActive           Boolean  @default(true)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  // Relations
  organization     Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  secondaryAccount SecondaryAccount @relation(fields: [secondaryAccountId], references: [id], onDelete: Cascade)
  debitTransactions  Transaction[] @relation("DebitAccount")
  creditTransactions Transaction[] @relation("CreditAccount")
  products           Product[]

  @@unique([organizationId, code])
  @@index([organizationId, secondaryAccountId])
  @@index([organizationId, balance])
  @@map("holder_accounts")
}

// Continue with remaining models...
// (See 02-DATABASE-SCHEMA.md for complete schema)
```

#### **Implementation Phases**:

1. **Phase 1.2.1**: Core models (Organization, User)
2. **Phase 1.2.2**: Account hierarchy (Primary, Secondary, Holder)
3. **Phase 1.2.3**: Transactions
4. **Phase 1.2.4**: Products & Sales
5. **Phase 1.2.5**: Clients
6. **Phase 1.2.6**: Employees & Payroll
7. **Phase 1.2.7**: Fixed Assets
8. **Phase 1.2.8**: Company Settings

#### **Expected Outcomes**:
- ✅ Complete Prisma schema matching existing types
- ✅ All relationships properly defined
- ✅ Proper indexes for performance
- ✅ Multi-tenancy support via organizationId

---

### Task 1.3: Generate and Review Migrations (Day 2-3)

#### **Objective**: Create SQL migration files

#### **Steps**:

1. **Create initial migration** (without applying)
```bash
npx prisma migrate dev --create-only --name init
```

2. **Review generated SQL**
   - Check `prisma/migrations/[timestamp]_init/migration.sql`
   - Verify table structures
   - Confirm indexes and constraints
   - Review foreign key relationships

3. **Add custom SQL if needed**
   - Supabase-specific configurations
   - Custom functions for account code generation
   - Row Level Security (RLS) policies
   - Triggers for audit logging

4. **Test migration in development**
```bash
npx prisma migrate dev
```

5. **Generate Prisma Client**
```bash
npx prisma generate
```

#### **Custom SQL to Add** (append to migration file):

```sql
-- Custom functions for business logic

-- Function to calculate account balance
CREATE OR REPLACE FUNCTION calculate_account_balance(account_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
  balance DECIMAL := 0;
BEGIN
  SELECT COALESCE(
    SUM(
      CASE 
        WHEN debit_account_id = account_uuid THEN amount
        WHEN credit_account_id = account_uuid THEN -amount
        ELSE 0
      END
    ), 0
  ) INTO balance
  FROM transactions
  WHERE (debit_account_id = account_uuid OR credit_account_id = account_uuid);
  
  RETURN balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate account codes
CREATE OR REPLACE FUNCTION generate_account_code(
  secondary_account_id UUID,
  organization_id UUID
)
RETURNS TEXT AS $$
DECLARE
  primary_code TEXT;
  secondary_code TEXT;
  next_number INTEGER;
  account_code TEXT;
BEGIN
  -- Get primary and secondary codes
  SELECT pa.code, sa.code
  INTO primary_code, secondary_code
  FROM secondary_accounts sa
  JOIN primary_accounts pa ON sa.primary_account_id = pa.id
  WHERE sa.id = secondary_account_id
    AND sa.organization_id = generate_account_code.organization_id;
  
  -- Get next sequential number
  SELECT COALESCE(MAX(CAST(SPLIT_PART(ha.code, '-', 3) AS INTEGER)), 0) + 1
  INTO next_number
  FROM holder_accounts ha
  WHERE ha.secondary_account_id = secondary_account_id
    AND ha.organization_id = generate_account_code.organization_id;
  
  -- Format account code
  account_code := primary_code || '-' || secondary_code || '-' || 
                  LPAD(next_number::TEXT, 3, '0');
  
  RETURN account_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE primary_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE secondary_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE holder_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (basic - to be enhanced)
CREATE POLICY "Users can access their organization's data" ON organizations
  FOR ALL
  USING (
    id IN (
      SELECT organization_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can access their organization's accounts" ON holder_accounts
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );
```

#### **Expected Outcomes**:
- ✅ Migration files generated
- ✅ SQL reviewed and validated
- ✅ Custom functions added
- ✅ RLS policies configured
- ✅ Database schema created in Supabase

---

### Task 1.4: Create Prisma Client Singleton (Day 3)

#### **Objective**: Set up Prisma client for use across the application

#### **Create `lib/prisma/client.ts`**:

```typescript
/**
 * Prisma Client Singleton
 * 
 * Ensures single instance of PrismaClient across the application
 * Prevents connection pool exhaustion in development
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Disconnect on process termination
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
```

#### **Create `lib/prisma/index.ts`**:

```typescript
/**
 * Prisma Module Exports
 */

export { prisma } from './client';
export * from '@prisma/client';

// Helper types
export type PrismaTransactionClient = Parameters<
  Parameters<typeof prisma.$transaction>[0]
>[0];
```

#### **Expected Outcomes**:
- ✅ Prisma client singleton created
- ✅ Proper logging configured
- ✅ Connection management handled
- ✅ Type exports available

---

### Task 1.5: Create Prisma Base Repository (Day 3-4)

#### **Objective**: Build a Prisma-based repository that matches existing interface

#### **Create `lib/repositories/prisma/PrismaBaseRepository.ts`**:

```typescript
/**
 * Prisma Base Repository
 * 
 * Generic Prisma repository pattern implementation
 * Mirrors the existing BaseRepository interface for seamless migration
 */

import { prisma, PrismaTransactionClient } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Re-export the Repository interface from existing BaseRepository
export interface Repository<T> {
  create(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  findById(id: string): Promise<T | null>;
  findAll(filters?: any): Promise<T[]>;
  update(id: string, updates: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

/**
 * Base Prisma Repository
 * 
 * Provides common CRUD operations using Prisma
 * Maintains same interface as localStorage BaseRepository for compatibility
 */
export abstract class PrismaBaseRepository<T extends { id: string }> implements Repository<T> {
  protected abstract modelName: Prisma.ModelName;
  protected organizationId?: string;

  /**
   * Get Prisma delegate for the model
   */
  protected getDelegate(tx?: PrismaTransactionClient) {
    const client = tx || prisma;
    return (client as any)[this.modelNameLowercase()];
  }

  /**
   * Convert model name to lowercase (prisma convention)
   */
  protected modelNameLowercase(): string {
    return this.modelName.charAt(0).toLowerCase() + this.modelName.slice(1);
  }

  /**
   * Set organization context for multi-tenancy
   */
  setOrganizationId(organizationId: string): this {
    this.organizationId = organizationId;
    return this;
  }

  /**
   * Add organization filter if context is set
   */
  protected addOrgFilter<W>(where?: W): W {
    if (this.organizationId && where) {
      return { ...where, organizationId: this.organizationId } as W;
    }
    return where || ({} as W);
  }

  /**
   * Create a new entity
   */
  async create(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const delegate = this.getDelegate();
    const data = this.organizationId
      ? { ...entity, organizationId: this.organizationId }
      : entity;

    return delegate.create({ data }) as Promise<T>;
  }

  /**
   * Find entity by ID
   */
  async findById(id: string): Promise<T | null> {
    const delegate = this.getDelegate();
    const where = this.addOrgFilter({ id });
    return delegate.findUnique({ where }) as Promise<T | null>;
  }

  /**
   * Find all entities with optional filtering
   */
  async findAll(filters?: any): Promise<T[]> {
    const delegate = this.getDelegate();
    const where = this.addOrgFilter(filters);
    return delegate.findMany({ where }) as Promise<T[]>;
  }

  /**
   * Update an entity
   */
  async update(id: string, updates: Partial<T>): Promise<T> {
    const delegate = this.getDelegate();
    const where = this.addOrgFilter({ id });
    
    // Remove fields that shouldn't be updated
    const { id: _, createdAt, ...data } = updates as any;
    
    return delegate.update({
      where,
      data,
    }) as Promise<T>;
  }

  /**
   * Delete an entity (soft delete by default)
   */
  async delete(id: string): Promise<void> {
    const delegate = this.getDelegate();
    const where = this.addOrgFilter({ id });
    
    // Try soft delete first
    try {
      await delegate.update({
        where,
        data: { isActive: false },
      });
    } catch (error) {
      // If no isActive field, do hard delete
      await delegate.delete({ where });
    }
  }

  /**
   * Count entities
   */
  async count(filters?: any): Promise<number> {
    const delegate = this.getDelegate();
    const where = this.addOrgFilter(filters);
    return delegate.count({ where });
  }

  /**
   * Check if entity exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.count({ id });
    return count > 0;
  }

  /**
   * Execute operation in transaction
   */
  protected async executeInTransaction<R>(
    fn: (tx: PrismaTransactionClient) => Promise<R>
  ): Promise<R> {
    return prisma.$transaction(fn);
  }
}
```

#### **Expected Outcomes**:
- ✅ Prisma base repository created
- ✅ Interface matches existing BaseRepository
- ✅ Multi-tenancy support included
- ✅ Transaction support available

---

### Task 1.6: Create Prisma Account Repositories (Day 4-5)

#### **Objective**: Implement Prisma versions of account repositories

#### **Create `lib/repositories/prisma/PrismaPrimaryAccountRepository.ts`**:

```typescript
/**
 * Prisma Primary Account Repository
 * 
 * Mirrors functionality of existing PrimaryAccountRepository
 * Reference: lib/repositories/AccountRepository.ts (lines 11-29)
 */

import { PrismaBaseRepository } from './PrismaBaseRepository';
import { PrimaryAccount, Prisma } from '@prisma/client';

export class PrismaPrimaryAccountRepository extends PrismaBaseRepository<PrimaryAccount> {
  protected modelName: Prisma.ModelName = 'PrimaryAccount';

  /**
   * Find accounts by type
   * 
   * Mirrors: PrimaryAccountRepository.findByType()
   */
  async findByType(type: string): Promise<PrimaryAccount[]> {
    return this.findAll({
      type,
      isActive: true,
    });
  }

  /**
   * Get account hierarchy with counts
   */
  async getAccountsWithCounts(): Promise<any[]> {
    const delegate = this.getDelegate();
    
    return delegate.findMany({
      where: this.addOrgFilter({ isActive: true }),
      include: {
        _count: {
          select: {
            secondaryAccounts: true,
          },
        },
      },
    });
  }
}
```

#### **Create `lib/repositories/prisma/PrismaSecondaryAccountRepository.ts`**:

```typescript
/**
 * Prisma Secondary Account Repository
 * 
 * Mirrors functionality of existing SecondaryAccountRepository
 * Reference: lib/repositories/AccountRepository.ts (lines 31-64)
 */

import { PrismaBaseRepository } from './PrismaBaseRepository';
import { SecondaryAccount, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export class PrismaSecondaryAccountRepository extends PrismaBaseRepository<SecondaryAccount> {
  protected modelName: Prisma.ModelName = 'SecondaryAccount';

  /**
   * Find accounts by primary account
   * 
   * Mirrors: SecondaryAccountRepository.findByPrimaryAccount()
   */
  async findByPrimaryAccount(primaryAccountId: string): Promise<SecondaryAccount[]> {
    return this.findAll({
      primaryAccountId,
      isActive: true,
    });
  }

  /**
   * Find account by code
   * 
   * Mirrors: SecondaryAccountRepository.findByCode()
   */
  async findByCode(code: string): Promise<SecondaryAccount | null> {
    const delegate = this.getDelegate();
    const where = this.addOrgFilter({ code });
    return delegate.findUnique({ where });
  }

  /**
   * Generate next account code
   * 
   * Mirrors: SecondaryAccountRepository.generateCode()
   * Uses Supabase function for code generation
   */
  async generateCode(primaryAccountId: string): Promise<string> {
    if (!this.organizationId) {
      throw new Error('Organization ID is required for code generation');
    }

    // Use Supabase function
    const result = await prisma.$queryRaw<{ code: string }[]>`
      SELECT generate_account_code(
        ${primaryAccountId}::uuid,
        ${this.organizationId}::uuid
      ) as code
    `;

    return result[0]?.code || '';
  }
}
```

#### **Create `lib/repositories/prisma/PrismaHolderAccountRepository.ts`**:

```typescript
/**
 * Prisma Holder Account Repository
 * 
 * Mirrors functionality of existing HolderAccountRepository
 * Reference: lib/repositories/AccountRepository.ts (lines 66-152)
 */

import { PrismaBaseRepository } from './PrismaBaseRepository';
import { HolderAccount, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export class PrismaHolderAccountRepository extends PrismaBaseRepository<HolderAccount> {
  protected modelName: Prisma.ModelName = 'HolderAccount';

  /**
   * Find accounts by secondary account
   * 
   * Mirrors: HolderAccountRepository.findBySecondaryAccount()
   */
  async findBySecondaryAccount(secondaryAccountId: string): Promise<HolderAccount[]> {
    return this.findAll({
      secondaryAccountId,
      isActive: true,
    });
  }

  /**
   * Find account by code
   * 
   * Mirrors: HolderAccountRepository.findByCode()
   */
  async findByCode(code: string): Promise<HolderAccount | null> {
    const delegate = this.getDelegate();
    const where = this.addOrgFilter({ code });
    return delegate.findUnique({ where });
  }

  /**
   * Generate next account code
   * 
   * Mirrors: HolderAccountRepository.generateCode()
   */
  async generateCode(secondaryAccountId: string): Promise<string> {
    if (!this.organizationId) {
      throw new Error('Organization ID is required for code generation');
    }

    // Use Supabase function
    const result = await prisma.$queryRaw<{ code: string }[]>`
      SELECT generate_account_code(
        ${secondaryAccountId}::uuid,
        ${this.organizationId}::uuid
      ) as code
    `;

    return result[0]?.code || '';
  }

  /**
   * Update account balance
   * 
   * Mirrors: HolderAccountRepository.updateBalance()
   */
  async updateBalance(id: string, amount: number): Promise<HolderAccount> {
    const delegate = this.getDelegate();
    const where = this.addOrgFilter({ id });

    return delegate.update({
      where,
      data: {
        balance: {
          increment: amount,
        },
      },
    });
  }

  /**
   * Get account with full hierarchy
   */
  async findByIdWithHierarchy(id: string): Promise<any> {
    const delegate = this.getDelegate();
    const where = this.addOrgFilter({ id });

    return delegate.findUnique({
      where,
      include: {
        secondaryAccount: {
          include: {
            primaryAccount: true,
          },
        },
      },
    });
  }

  /**
   * Get accounts with transaction counts
   */
  async findAllWithStats(): Promise<any[]> {
    const delegate = this.getDelegate();
    const where = this.addOrgFilter({ isActive: true });

    return delegate.findMany({
      where,
      include: {
        _count: {
          select: {
            debitTransactions: true,
            creditTransactions: true,
          },
        },
        secondaryAccount: {
          select: {
            name: true,
            code: true,
            primaryAccount: {
              select: {
                name: true,
                type: true,
              },
            },
          },
        },
      },
      orderBy: {
        code: 'asc',
      },
    });
  }
}
```

#### **Create `lib/repositories/prisma/index.ts`**:

```typescript
/**
 * Prisma Repositories Export
 * 
 * Central export point for all Prisma repositories
 */

export { PrismaBaseRepository } from './PrismaBaseRepository';
export { PrismaPrimaryAccountRepository } from './PrismaPrimaryAccountRepository';
export { PrismaSecondaryAccountRepository } from './PrismaSecondaryAccountRepository';
export { PrismaHolderAccountRepository} from './PrismaHolderAccountRepository';

// Repository instances (to be instantiated with organization context)
import { PrismaPrimaryAccountRepository } from './PrismaPrimaryAccountRepository';
import { PrismaSecondaryAccountRepository } from './PrismaSecondaryAccountRepository';
import { PrismaHolderAccountRepository } from './PrismaHolderAccountRepository';

// Factory function to create repositories with organization context
export function createPrismaRepositories(organizationId: string) {
  return {
    primaryAccount: new PrismaPrimaryAccountRepository().setOrganizationId(organizationId),
    secondaryAccount: new PrismaSecondaryAccountRepository().setOrganizationId(organizationId),
    holderAccount: new PrismaHolderAccountRepository().setOrganizationId(organizationId),
  };
}
```

#### **Expected Outcomes**:
- ✅ Prisma account repositories created
- ✅ All existing methods implemented
- ✅ Business logic preserved
- ✅ Multi-tenancy enforced

---

### Task 1.7: Environment Configuration & Validation (Day 5-6)

#### **Objective**: Ensure proper configuration and validation

#### **Create `lib/config/env.ts`**:

```typescript
/**
 * Environment Configuration & Validation
 */

import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // App
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

const parseEnv = () => {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }

  return parsed.data;
};

export const env = parseEnv();

export type Env = z.infer<typeof envSchema>;
```

#### **Create database connection test**:

```typescript
// scripts/test-db-connection.ts

import { prisma } from '../lib/prisma';

async function testConnection() {
  try {
    console.log('🔄 Testing database connection...');
    
    // Test query
    await prisma.$queryRaw`SELECT 1`;
    
    console.log('✅ Database connection successful!');
    
    // Test organization table
    const orgCount = await prisma.organization.count();
    console.log(`📊 Organizations in database: ${orgCount}`);
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
```

#### **Update package.json scripts**:

```json
{
  "scripts": {
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:migrate:prod": "prisma migrate deploy",
    "db:studio": "prisma studio",
    "db:test": "ts-node scripts/test-db-connection.ts",
    "db:seed": "ts-node scripts/seed-database.ts"
  }
}
```

#### **Expected Outcomes**:
- ✅ Environment validation in place
- ✅ Database connection verified
- ✅ Helper scripts available
- ✅ Development workflow established

---

### Task 1.8: Authentication Setup (Day 6-7)

#### **Objective**: Configure Supabase authentication

#### **Create `lib/auth/supabase.ts`**:

```typescript
/**
 * Supabase Authentication Client
 */

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

// Client-side Supabase client
export const supabase = createClientComponentClient();

// Server-side Supabase client (with service role)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
```

#### **Create `lib/auth/session.ts`**:

```typescript
/**
 * Session Management
 */

import { supabase } from './supabase';

export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Session error:', error);
    return null;
  }
  
  return session;
}

export async function getUser() {
  const session = await getSession();
  return session?.user || null;
}

export async function getOrganizationId(): Promise<string | null> {
  const user = await getUser();
  
  if (!user) return null;
  
  // Fetch user's organization from database
  const { data } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single();
  
  return data?.organization_id || null;
}
```

#### **Create middleware for auth**:

```typescript
// middleware.ts

import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protected routes
  if (req.nextUrl.pathname.startsWith('/dashboard') && !session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Redirect authenticated users from auth pages
  if (req.nextUrl.pathname.startsWith('/login') && session) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};
```

#### **Expected Outcomes**:
- ✅ Supabase auth configured
- ✅ Session management implemented
- ✅ Auth middleware in place
- ✅ Protected routes secured

---

### Task 1.9: Initial Seed Data Script (Day 7)

#### **Objective**: Create script to seed initial organization and test data

#### **Create `scripts/seed-database.ts`**:

```typescript
/**
 * Database Seeding Script
 * 
 * Seeds initial organization and account hierarchy
 */

import { prisma } from '../lib/prisma';
import { hash } from 'bcryptjs';

async function seed() {
  console.log('🌱 Starting database seed...');

  try {
    // Create demo organization
    const organization = await prisma.organization.upsert({
      where: { slug: 'demo-org' },
      update: {},
      create: {
        name: 'Demo Organization',
        slug: 'demo-org',
      },
    });

    console.log('✅ Organization created:', organization.name);

    // Create admin user
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@demo.com' },
      update: {},
      create: {
        organizationId: organization.id,
        email: 'admin@demo.com',
        username: 'admin',
        passwordHash: await hash('admin123', 10),
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
      },
    });

    console.log('✅ Admin user created:', adminUser.email);

    // Create primary accounts (based on existing seedData)
    const assets = await prisma.primaryAccount.upsert({
      where: { 
        organizationId_name: {
          organizationId: organization.id,
          name: 'Assets'
        }
      },
      update: {},
      create: {
        organizationId: organization.id,
        name: 'Assets',
        type: 'ASSETS',
        description: 'All company assets',
      },
    });

    const liabilities = await prisma.primaryAccount.upsert({
      where: { 
        organizationId_name: {
          organizationId: organization.id,
          name: 'Liabilities'
        }
      },
      update: {},
      create: {
        organizationId: organization.id,
        name: 'Liabilities',
        type: 'LIABILITIES',
        description: 'All company liabilities',
      },
    });

    console.log('✅ Primary accounts created');

    // Create secondary accounts
    const currentAssets = await prisma.secondaryAccount.create({
      data: {
        organizationId: organization.id,
        primaryAccountId: assets.id,
        name: 'Current Assets',
        code: '01',
        description: 'Assets that can be converted to cash within one year',
      },
    });

    console.log('✅ Secondary accounts created');

    // Create holder accounts
    await prisma.holderAccount.createMany({
      data: [
        {
          organizationId: organization.id,
          secondaryAccountId: currentAssets.id,
          code: '01-001-001',
          name: 'Cash',
          description: 'Cash on hand',
          balance: 0,
        },
        {
          organizationId: organization.id,
          secondaryAccountId: currentAssets.id,
          code: '01-001-002',
          name: 'Petty Cash',
          description: 'Small cash transactions',
          balance: 0,
        },
      ],
    });

    console.log('✅ Holder accounts created');
    console.log('🎉 Database seeded successfully!');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed();
```

#### **Expected Outcomes**:
- ✅ Seed script created
- ✅ Initial organization seeded
- ✅ Test admin user created
- ✅ Basic account hierarchy in place

---

### Task 1.10: Documentation & Testing (Day 7-8)

#### **Objective**: Document setup and verify everything works

#### **Create `PHASE1-COMPLETION-CHECKLIST.md`**:

```markdown
# Phase 1 Completion Checklist

## Setup Verification

- [ ] Prisma installed and configured
- [ ] Database connection successful
- [ ] Migrations applied
- [ ] Prisma client generated
- [ ] Custom SQL functions working

## Repository Implementation

- [ ] PrismaBaseRepository created
- [ ] Account repositories implemented
- [ ] All methods match existing interface
- [ ] Multi-tenancy working

## Authentication

- [ ] Supabase auth configured
- [ ] Session management working
- [ ] Middleware protecting routes
- [ ] User authentication tested

## Database

- [ ] Schema matches types
- [ ] All relationships correct
- [ ] Indexes in place
- [ ] RLS policies configured
- [ ] Seed data loaded

## Documentation

- [ ] Environment variables documented
- [ ] Setup instructions complete
- [ ] Migration notes written
- [ ] Known issues documented

## Testing

- [ ] Database connection test passes
- [ ] Seed script runs successfully
- [ ] CRUD operations work
- [ ] Auth flow tested
- [ ] Query performance acceptable
```

#### **Create `PHASE1-HANDOFF.md`**:

```markdown
# Phase 1 Handoff Document

## What Was Completed

1. **Prisma Setup**
   - Schema created with full type coverage
   - Migrations generated and applied
   - Custom SQL functions added
   - RLS policies configured

2. **Repository Layer**
   - Base Prisma repository created
   - Account repositories implemented
   - Business logic preserved
   - Multi-tenancy enforced

3. **Authentication**
   - Supabase auth configured
   - Session management implemented
   - Protected routes secured

4. **Database**
   - Schema deployed to Supabase
   - Seed data loaded
   - Indexes optimized
   - Functions tested

## Files Created

```
lib/
├── prisma/
│   ├── client.ts           # Prisma singleton
│   └── index.ts            # Exports
├── repositories/
│   └── prisma/
│       ├── PrismaBaseRepository.ts
│       ├── PrismaPrimaryAccountRepository.ts
│       ├── PrismaSecondaryAccountRepository.ts
│       ├── PrismaHolderAccountRepository.ts
│       └── index.ts
├── auth/
│   ├── supabase.ts         # Auth clients
│   └── session.ts          # Session management
└── config/
    └── env.ts              # Environment validation

prisma/
├── schema.prisma           # Database schema
└── migrations/             # Migration files

scripts/
├── test-db-connection.ts   # Connection test
└── seed-database.ts        # Seeding script
```

## Next Steps for Phase 2

1. **API Layer Development**
   - Create Next.js API routes
   - Implement request/response standards
   - Add validation middleware
   - Set up error handling

2. **Service Layer Adaptation**
   - Create Prisma-based services
   - Maintain existing business logic
   - Add transaction support
   - Implement caching

3. **Testing**
   - Write unit tests for repositories
   - Create integration tests
   - Test auth flows
   - Performance testing

## Known Issues & Notes

- None at this time

## Questions for Phase 2

- Authentication strategy finalized?
- API versioning approach confirmed?
- Caching strategy decided?
```

#### **Expected Outcomes**:
- ✅ Complete documentation
- ✅ Handoff document ready
- ✅ All tests passing
- ✅ Ready for Phase 2

---

## Phase 1 Success Criteria

### Functional Requirements
- ✅ Database schema created and deployed
- ✅ Prisma client operational
- ✅ Basic CRUD operations working
- ✅ Authentication configured
- ✅ Multi-tenancy enforced
- ✅ Seed data loaded

### Technical Requirements
- ✅ All migrations applied successfully
- ✅ RLS policies active
- ✅ Custom functions working
- ✅ Proper indexing in place
- ✅ Connection pooling configured

### Documentation Requirements
- ✅ Setup instructions complete
- ✅ Environment variables documented
- ✅ API reference started
- ✅ Migration notes written

### Testing Requirements
- ✅ Connection test passing
- ✅ CRUD operations verified
- ✅ Auth flow tested
- ✅ Seed script working

---

## Risk Mitigation

### Data Safety
- **Risk**: Data loss during migration
- **Mitigation**: 
  - Keep localStorage code intact
  - Test thoroughly before production
  - Create backup procedures
  - Implement rollback plan

### Performance
- **Risk**: Slow query performance
- **Mitigation**:
  - Proper indexing strategy
  - Query optimization
  - Connection pooling
  - Monitor slow queries

### Authentication
- **Risk**: Auth integration issues
- **Mitigation**:
  - Test all auth flows
  - Implement proper error handling
  - Use Supabase best practices
  - Monitor auth logs

---

## Support & Resources

### Documentation
- Prisma Docs: https://www.prisma.io/docs
- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs

### Team Contacts
- Database: [DBA Contact]
- Backend: [Backend Lead]
- DevOps: [DevOps Contact]

### Tools
- Prisma Studio: `npm run db:studio`
- Supabase Dashboard: [Your Project URL]
- Database Logs: Supabase Dashboard

---

**Phase 1 Status**: Ready to Execute  
**Estimated Duration**: 7-10 days  
**Risk Level**: Low  
**Dependencies**: None




