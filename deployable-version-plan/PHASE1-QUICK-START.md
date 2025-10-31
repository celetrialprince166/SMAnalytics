# Phase 1 Quick Start Guide

## Overview
This guide will get you started with Phase 1 implementation in 30 minutes.

---

## Prerequisites ✅

```bash
# Verify Node.js version (>= 18)
node --version

# Verify npm/yarn
npm --version

# Verify .env file exists with DATABASE_URL
cat .env | grep DATABASE_URL
```

---

## Step 1: Install Dependencies (5 mins)

```bash
# Install Prisma
npm install -D prisma
npm install @prisma/client

# Install Supabase auth helpers
npm install @supabase/auth-helpers-nextjs @supabase/supabase-js

# Install bcryptjs for password hashing
npm install bcryptjs
npm install -D @types/bcryptjs
```

---

## Step 2: Initialize Prisma (2 mins)

```bash
# Initialize Prisma (creates prisma/ directory)
npx prisma init

# This creates:
# - prisma/schema.prisma
# - .env (if doesn't exist)
```

---

## Step 3: Configure Environment (3 mins)

**Edit `.env` file:**

```env
# Database URLs (already configured ✓)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"

# Supabase (get from Supabase dashboard)
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key_here"
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"

# App
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**How to get Supabase keys:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings → API
4. Copy the keys

---

## Step 4: Copy Prisma Schema (5 mins)

**Update `prisma/schema.prisma`:**

Copy the complete schema from `deployable-version-plan/02-DATABASE-SCHEMA.md` (lines 18-686) into your `prisma/schema.prisma` file.

**Quick verification:**
```bash
# Check schema syntax
npx prisma validate
```

---

## Step 5: Generate Migration (3 mins)

```bash
# Create initial migration (without applying)
npx prisma migrate dev --create-only --name init

# This creates: prisma/migrations/[timestamp]_init/migration.sql
```

---

## Step 6: Review Migration SQL (5 mins)

**Open:** `prisma/migrations/[timestamp]_init/migration.sql`

**Add custom SQL at the end:**

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

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE primary_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE secondary_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE holder_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
```

---

## Step 7: Apply Migration (2 mins)

```bash
# Apply migration to database
npx prisma migrate dev

# Generate Prisma Client
npx prisma generate
```

**Expected output:**
```
✔ Applied migration(s)
✔ Generated Prisma Client
```

---

## Step 8: Create Prisma Client Singleton (3 mins)

**Create `lib/prisma/client.ts`:**

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
```

**Create `lib/prisma/index.ts`:**

```typescript
export { prisma } from './client';
export * from '@prisma/client';
```

---

## Step 9: Test Database Connection (2 mins)

**Create `scripts/test-db-connection.ts`:**

```typescript
import { prisma } from '../lib/prisma';

async function testConnection() {
  try {
    console.log('🔄 Testing database connection...');
    
    await prisma.$queryRaw`SELECT 1`;
    
    console.log('✅ Database connection successful!');
    
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

**Run test:**

```bash
npx ts-node scripts/test-db-connection.ts
```

**Expected output:**
```
🔄 Testing database connection...
✅ Database connection successful!
📊 Organizations in database: 0
```

---

## Step 10: Verify with Prisma Studio (Optional, 2 mins)

```bash
# Open Prisma Studio (database GUI)
npx prisma studio
```

**This opens:** http://localhost:5555

**You should see:**
- Empty tables (organizations, users, accounts, etc.)
- Proper relationships
- Indexes configured

---

## Verification Checklist ✓

Run through this checklist to ensure everything is set up correctly:

```bash
# 1. Prisma client works
npx prisma validate

# 2. Migration applied
npx prisma migrate status

# 3. Client generated
ls node_modules/.prisma/client

# 4. Connection test passes
npx ts-node scripts/test-db-connection.ts

# 5. Prisma Studio opens
npx prisma studio
```

---

## Common Issues & Solutions

### Issue 1: "Environment variable not found: DATABASE_URL"
**Solution:**
```bash
# Check .env file exists
ls -la .env

# Verify DATABASE_URL is set
cat .env | grep DATABASE_URL

# Make sure .env is in project root
pwd
```

### Issue 2: "Migration failed: connection refused"
**Solution:**
```bash
# Verify Supabase URL is correct
# Check if you're using the correct format:
# postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres

# Test connection with psql
psql $DATABASE_URL
```

### Issue 3: "Prisma Client did not initialize yet"
**Solution:**
```bash
# Regenerate Prisma Client
npx prisma generate

# Clear node_modules and reinstall
rm -rf node_modules node_modules/.prisma
npm install
```

### Issue 4: "Cannot find module '@prisma/client'"
**Solution:**
```bash
# Install Prisma Client
npm install @prisma/client

# Generate client
npx prisma generate
```

---

## Next Steps

Now that Phase 1 foundation is set up, you can:

1. **Run seed script** (create test data)
   ```bash
   npx ts-node scripts/seed-database.ts
   ```

2. **Create Prisma repositories** (follow PHASE1-IMPLEMENTATION-PLAN.md Task 1.5)

3. **Set up authentication** (follow PHASE1-IMPLEMENTATION-PLAN.md Task 1.8)

4. **Start Phase 2** (API Layer Development)

---

## Helpful Commands

```bash
# Generate Prisma Client
npx prisma generate

# Create new migration
npx prisma migrate dev --name [migration_name]

# Apply migrations to production
npx prisma migrate deploy

# Reset database (⚠️ deletes all data)
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio

# Format schema file
npx prisma format

# Validate schema
npx prisma validate

# Pull schema from database
npx prisma db pull

# Push schema to database (without migration)
npx prisma db push
```

---

## Support

### Documentation
- Prisma: https://www.prisma.io/docs
- Supabase: https://supabase.com/docs
- Full implementation plan: `PHASE1-IMPLEMENTATION-PLAN.md`

### Troubleshooting
- Check migration gaps: `11-MIGRATION-GAPS.md`
- Review database schema: `02-DATABASE-SCHEMA.md`
- API standards: `03-API-STANDARDS.md`

---

**Phase 1 Quick Start Complete! 🎉**

You now have:
- ✅ Prisma configured and connected
- ✅ Database schema created
- ✅ Migrations applied
- ✅ Prisma Client generated
- ✅ Connection verified

**Time to complete**: ~30 minutes  
**Ready for**: Repository implementation (Task 1.5)




