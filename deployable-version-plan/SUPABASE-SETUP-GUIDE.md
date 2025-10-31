# Supabase Setup Guide for Phase 1

## Overview
This guide walks you through setting up Supabase for the SNM Analytics application migration.

---

## Step 1: Access Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Sign in with your account
3. Select your project (or create a new one if needed)

---

## Step 2: Get Database Connection String

### Navigate to Database Settings
1. In Supabase Dashboard, click **Settings** (gear icon)
2. Click **Database** in the left sidebar

### Connection String Format

You'll see different connection strings. We need two:

#### 1. Connection Pooling URL (for app runtime)
**Use with**: PgBouncer (recommended for serverless)

```
postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

or the simplified format:

```
postgresql://postgres:[YOUR_PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1
```

#### 2. Direct Connection URL (for migrations)
**Use with**: Prisma migrations

```
postgresql://postgres:[YOUR_PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
```

### Update Your .env

```env
# Pooled connection for app (handles multiple connections)
DATABASE_URL="postgresql://postgres:[YOUR_PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"

# Direct connection for migrations (bypasses connection pooler)
DIRECT_URL="postgresql://postgres:[YOUR_PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"
```

---

## Step 3: Get Supabase API Keys

### Navigate to API Settings
1. In Supabase Dashboard, click **Settings** (gear icon)
2. Click **API** in the left sidebar

### Keys You Need

#### 1. Project URL
```
https://[PROJECT_REF].supabase.co
```

#### 2. Anon (public) Key
This key is safe to use in browser/frontend code:
```
eyJhbGc...very_long_string...
```

#### 3. Service Role Key (⚠️ SECRET)
**NEVER expose this in frontend code or commit to Git:**
```
eyJhbGc...different_very_long_string...
```

### Update Your .env

```env
# Public keys (safe for frontend)
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT_REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key_here"

# Secret key (backend only, never expose!)
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"
```

---

## Step 4: Verify Database Connection

### Using Supabase SQL Editor

1. In Supabase Dashboard, click **SQL Editor** (database icon)
2. Create a new query
3. Run this test query:

```sql
SELECT version();
```

You should see PostgreSQL version information.

### Using Connection String

Test the connection from your local machine:

```bash
# Install PostgreSQL client if not already installed
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client

# Test connection
psql "postgresql://postgres:[YOUR_PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"
```

If successful, you'll see:
```
psql (14.x)
Type "help" for help.

postgres=>
```

---

## Step 5: Configure Prisma Schema

Update your `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")      // Pooled connection
  directUrl = env("DIRECT_URL")        // Direct connection for migrations
}
```

**Why two URLs?**
- `url`: Used for app queries (through PgBouncer for efficiency)
- `directUrl`: Used for migrations (needs direct access)

---

## Step 6: Test Prisma Connection

Create a test script: `scripts/test-supabase-connection.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  console.log('🔄 Testing Supabase connection...\n');

  try {
    // Test 1: Basic query
    console.log('Test 1: Basic database query');
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('✅ Database version:', result);

    // Test 2: Check if we can create tables
    console.log('\nTest 2: Check database permissions');
    const canCreate = await prisma.$queryRaw`
      SELECT has_database_privilege(current_user, current_database(), 'CREATE') as can_create
    `;
    console.log('✅ Can create tables:', canCreate);

    // Test 3: List existing tables
    console.log('\nTest 3: List existing tables');
    const tables = await prisma.$queryRaw`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;
    console.log('✅ Existing tables:', tables);

    console.log('\n🎉 All connection tests passed!');

  } catch (error) {
    console.error('\n❌ Connection test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
```

Run the test:

```bash
npx ts-node scripts/test-supabase-connection.ts
```

---

## Step 7: Enable Required Extensions

Some features require PostgreSQL extensions. Enable them in Supabase:

### Via Supabase Dashboard

1. Go to **Database** → **Extensions**
2. Search and enable:
   - ✅ `uuid-ossp` (UUID generation)
   - ✅ `pgcrypto` (Encryption functions)
   - ✅ Already enabled: `pg_stat_statements` (Query stats)

### Via SQL Editor

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Verify extensions
SELECT * FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgcrypto');
```

---

## Step 8: Configure Row Level Security (RLS)

Supabase has RLS enabled by default. We'll configure it after migrations.

### Check RLS Status

```sql
-- Check which tables have RLS enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

---

## Step 9: Set Up Database Backups

### Automatic Backups

Supabase provides automatic backups:

1. Go to **Database** → **Backups**
2. View backup schedule:
   - Daily backups (retained for 7 days)
   - Point-in-time recovery (if enabled)

### Manual Backup

Create a manual backup before migration:

1. Click **Create backup** button
2. Add a note: "Pre-migration backup - Phase 1"
3. Wait for completion

### Restore Process

If you need to restore:
1. Go to **Database** → **Backups**
2. Find the backup
3. Click **Restore**
4. Confirm restoration

---

## Step 10: Monitor Database Performance

### Using Supabase Dashboard

1. Go to **Database** → **Roles** to check user permissions
2. Go to **Database** → **Extensions** to verify installed extensions
3. Go to **Database** → **Settings** to review configuration

### Key Metrics to Monitor

- **Active connections**: Should stay below 100
- **Database size**: Monitor growth
- **Slow queries**: Check query performance
- **Error logs**: Watch for connection issues

---

## Common Issues & Solutions

### Issue 1: "connection refused"

**Symptoms:**
```
Error: Connection refused
```

**Solutions:**
1. Check if DATABASE_URL is correct
2. Verify Supabase project is active (not paused)
3. Check firewall/network settings
4. Ensure you're using the correct port (5432)

### Issue 2: "authentication failed"

**Symptoms:**
```
Error: password authentication failed for user "postgres"
```

**Solutions:**
1. Verify password in connection string
2. Check if you're using the correct project
3. Reset database password in Supabase dashboard
4. Update .env with new password

### Issue 3: "too many connections"

**Symptoms:**
```
Error: remaining connection slots are reserved for non-replication superuser connections
```

**Solutions:**
1. Use connection pooling (DATABASE_URL with `pgbouncer=true`)
2. Add `connection_limit=1` to DATABASE_URL
3. Close unused connections
4. Use Prisma client singleton

### Issue 4: "SSL required"

**Symptoms:**
```
Error: server does not support SSL
```

**Solutions:**
Add SSL mode to connection string:
```
postgresql://...?sslmode=require
```

Or disable SSL (not recommended for production):
```
postgresql://...?sslmode=disable
```

---

## Security Best Practices

### 1. Environment Variables

**DO:**
- ✅ Store all keys in `.env` file
- ✅ Add `.env` to `.gitignore`
- ✅ Use environment variables for all secrets
- ✅ Different `.env` for dev/staging/production

**DON'T:**
- ❌ Commit `.env` to Git
- ❌ Share API keys in code
- ❌ Use production keys in development
- ❌ Expose service role key to frontend

### 2. Database Access

**DO:**
- ✅ Use connection pooling
- ✅ Limit connection count
- ✅ Enable RLS policies
- ✅ Use prepared statements (Prisma does this)

**DON'T:**
- ❌ Use direct connection in production
- ❌ Disable RLS without reason
- ❌ Run raw SQL without validation
- ❌ Store passwords in plain text

### 3. API Keys

**Service Role Key:**
- Only use server-side
- Never expose to frontend
- Use for admin operations only

**Anon Key:**
- Safe for frontend use
- Limited permissions
- RLS policies apply

---

## Verification Checklist

Before proceeding to Phase 1 implementation, verify:

### Connection
- [ ] Database connection string works
- [ ] Can connect via psql
- [ ] Prisma connection test passes
- [ ] Supabase dashboard accessible

### Configuration
- [ ] All keys added to `.env`
- [ ] `.env` in `.gitignore`
- [ ] Database URL with pooling
- [ ] Direct URL for migrations

### Extensions
- [ ] `uuid-ossp` enabled
- [ ] `pgcrypto` enabled
- [ ] Other required extensions enabled

### Backup
- [ ] Automatic backups configured
- [ ] Manual pre-migration backup created
- [ ] Backup restoration process understood

### Security
- [ ] Service role key secured
- [ ] Connection string not committed
- [ ] RLS policies reviewed
- [ ] Firewall rules configured (if applicable)

---

## Next Steps

Once Supabase is configured:

1. ✅ Return to **PHASE1-QUICK-START.md**
2. ✅ Continue with Prisma initialization
3. ✅ Apply database migrations
4. ✅ Test CRUD operations

---

## Support Resources

### Supabase Documentation
- **Getting Started**: https://supabase.com/docs/guides/getting-started
- **Database**: https://supabase.com/docs/guides/database
- **Connection Pooling**: https://supabase.com/docs/guides/database/connecting-to-postgres

### PostgreSQL Documentation
- **Connection Strings**: https://www.postgresql.org/docs/current/libpq-connect.html
- **pg_hba.conf**: https://www.postgresql.org/docs/current/auth-pg-hba-conf.html

### Prisma Documentation
- **Connection URLs**: https://www.prisma.io/docs/reference/database-reference/connection-urls
- **Connection Pooling**: https://www.prisma.io/docs/guides/performance-and-optimization/connection-management

---

**Supabase Setup Complete! ✅**

You're now ready to proceed with Phase 1 implementation.

**Next**: Follow `PHASE1-QUICK-START.md` starting at Step 4




