# Security Implementation Plan

**Document Version**: 1.0  
**Created**: November 17, 2025  
**Purpose**: Comprehensive security plan addressing critical security gaps

---

## 🎯 Overview

This document addresses critical security gaps:
- **Gap #5**: Multi-tenancy security (CRITICAL)
- **Gap #10**: Report permissions & access control (CRITICAL)
- **Gap #22**: Transaction isolation (CRITICAL)

---

## 🔒 Multi-Tenancy Security (Gap #5)

### Database Level Security

```sql
-- Row Level Security (RLS) Policies
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE holder_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_payments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their organization's data
CREATE POLICY tenant_isolation_transactions ON transactions
  FOR ALL TO authenticated
  USING (organization_id = current_setting('app.current_organization_id')::uuid);

CREATE POLICY tenant_isolation_accounts ON holder_accounts
  FOR ALL TO authenticated
  USING (organization_id = current_setting('app.current_organization_id')::uuid);
```

### Application Level Security

```typescript
/**
 * Organization Filter Middleware Specification
 * 
 * Purpose: Ensure ALL queries include organizationId filter
 * Implementation: Prisma middleware
 */
interface OrganizationFilterSpec {
  middleware: 'Prisma middleware';
  
  implementation: {
    hook: 'before query execution';
    action: 'inject organizationId filter';
    validation: 'verify user belongs to organization';
  };
  
  example: `
    prisma.$use(async (params, next) => {
      if (params.model && params.action !== 'count') {
        if (!params.args) params.args = {};
        if (!params.args.where) params.args.where = {};
        
        // CRITICAL: Always add organizationId
        params.args.where.organizationId = user.organizationId;
      }
      
      return next(params);
    });
  `;
  
  testing: {
    testCase1: 'User A cannot access User B organization data';
    testCase2: 'Switching organizations updates filter';
    testCase3: 'No query bypasses organization filter';
  };
}
```

### API Endpoint Security

```typescript
/**
 * API Security Middleware Specification
 * 
 * Purpose: Validate organization access on every request
 */
interface ApiSecuritySpec {
  middleware: 'requireOrganizationAccess';
  
  checks: [
    'User is authenticated',
    'User belongs to organization',
    'Organization is active',
    'User has not been removed from organization'
  ];
  
  implementation: `
    export async function requireOrganizationAccess(req: NextRequest) {
      const user = await getCurrentUser(req);
      
      if (!user) {
        return new Response('Unauthorized', { status: 401 });
      }
      
      // Verify organization membership
      const membership = await prisma.organizationMember.findFirst({
        where: {
          userId: user.id,
          organizationId: user.organizationId,
          isActive: true
        }
      });
      
      if (!membership) {
        return new Response('Forbidden', { status: 403 });
      }
      
      // Inject organization context
      req.organizationId = user.organizationId;
      return null; // Continue
    }
  `;
}
```

---

## 👤 Report Permissions & Access Control (Gap #10)

### Role-Based Access Control Matrix

```typescript
/**
 * Report Permissions Matrix Specification
 */
interface ReportPermissionsSpec {
  roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'SALES', 'VIEW_ONLY'];
  
  permissions: {
    // Financial Reports
    'trial-balance': ['ADMIN', 'MANAGER', 'ACCOUNTANT'];
    'income-statement': ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'VIEW_ONLY'];
    'balance-sheet': ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'VIEW_ONLY'];
    'cash-flow': ['ADMIN', 'MANAGER', 'ACCOUNTANT'];
    
    // Account Reports
    'account-transactions': ['ADMIN', 'MANAGER', 'ACCOUNTANT'];
    'account-balances': ['ADMIN', 'MANAGER', 'ACCOUNTANT'];
    'comparative-account': ['ADMIN', 'MANAGER', 'ACCOUNTANT'];
    'ageing-analysis': ['ADMIN', 'MANAGER', 'ACCOUNTANT'];
    'statement-of-accounts': ['ADMIN', 'MANAGER', 'ACCOUNTANT'];
    'petty-cash-analysis': ['ADMIN', 'MANAGER', 'ACCOUNTANT'];
    
    // Sales Reports
    'sales-movement': ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'SALES'];
    'sales-levels': ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'SALES'];
    
    // Payroll Reports (SENSITIVE)
    'salaries-register': ['ADMIN', 'MANAGER'];
    'payslip': ['ADMIN', 'MANAGER', 'SELF']; // Users can view own payslip
    'commissions': ['ADMIN', 'MANAGER'];
    'employees-register': ['ADMIN', 'MANAGER'];
    'employee-salaries': ['ADMIN', 'MANAGER'];
  };
}
```

### Permission Check Middleware

```typescript
/**
 * Permission Check Middleware Specification
 */
interface PermissionCheckSpec {
  middleware: 'checkReportPermission';
  
  implementation: `
    export async function checkReportPermission(
      userId: string,
      reportType: string,
      organizationId: string
    ): Promise<boolean> {
      // Get user with roles
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          organizationMembers: {
            where: { organizationId },
            include: { role: true }
          }
        }
      });
      
      if (!user) return false;
      
      // Get allowed roles for report
      const allowedRoles = REPORT_PERMISSIONS[reportType];
      if (!allowedRoles) return false;
      
      // Check if user has required role
      const userRole = user.organizationMembers[0]?.role.name;
      return allowedRoles.includes(userRole);
    }
  `;
  
  usage: `
    // In API endpoint
    const hasAccess = await checkReportPermission(
      user.id,
      'salaries-register',
      user.organizationId
    );
    
    if (!hasAccess) {
      return new Response('Forbidden', { status: 403 });
    }
  `;
}
```

### Audit Logging

```typescript
/**
 * Audit Logging Specification
 */
interface AuditLoggingSpec {
  purpose: 'Track all report access for compliance';
  
  logEvents: [
    'Report generated',
    'Report exported',
    'Report access denied',
    'Suspicious access pattern'
  ];
  
  schema: `
    model ReportAuditLog {
      id             String   @id @default(cuid())
      userId         String
      organizationId String
      reportType     String
      action         String   // 'GENERATED', 'EXPORTED', 'DENIED'
      parameters     Json
      ipAddress      String?
      userAgent      String?
      timestamp      DateTime @default(now())
      
      user          User         @relation(fields: [userId], references: [id])
      organization  Organization @relation(fields: [organizationId], references: [id])
      
      @@index([organizationId, reportType, timestamp])
      @@index([userId, timestamp])
    }
  `;
  
  implementation: `
    export async function logReportAccess(params: {
      userId: string;
      organizationId: string;
      reportType: string;
      action: 'GENERATED' | 'EXPORTED' | 'DENIED';
      parameters: any;
      ipAddress?: string;
      userAgent?: string;
    }) {
      await prisma.reportAuditLog.create({
        data: params
      });
      
      // Alert on suspicious patterns
      if (params.action === 'DENIED') {
        await checkSuspiciousActivity(params.userId);
      }
    }
  `;
}
```

---

## 🔐 Authentication & Authorization

### JWT Token Security

```typescript
/**
 * JWT Token Specification
 */
interface JWTSecuritySpec {
  algorithm: 'HS256';
  expiresIn: '8h';
  refreshToken: '7d';
  
  payload: {
    userId: 'string';
    organizationId: 'string';
    role: 'string';
    permissions: 'string[]';
  };
  
  security: {
    secret: 'Environment variable (never hardcoded)';
    rotation: 'Rotate secret every 90 days';
    revocation: 'Maintain revoked token list';
  };
  
  implementation: `
    export function generateToken(user: User): string {
      return jwt.sign(
        {
          userId: user.id,
          organizationId: user.organizationId,
          role: user.role,
          permissions: user.permissions
        },
        process.env.JWT_SECRET!,
        { expiresIn: '8h' }
      );
    }
    
    export function verifyToken(token: string): TokenPayload {
      try {
        return jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
      } catch (error) {
        throw new UnauthorizedError('Invalid token');
      }
    }
  `;
}
```

### Session Management

```typescript
/**
 * Session Management Specification
 */
interface SessionManagementSpec {
  storage: 'Database (not localStorage)';
  timeout: '8 hours of inactivity';
  
  features: [
    'Automatic session refresh',
    'Session timeout warning',
    'Concurrent session limit',
    'Force logout on password change'
  ];
  
  implementation: `
    model Session {
      id             String   @id @default(cuid())
      userId         String
      token          String   @unique
      expiresAt      DateTime
      lastActivity   DateTime @default(now())
      ipAddress      String?
      userAgent      String?
      isActive       Boolean  @default(true)
      
      user          User     @relation(fields: [userId], references: [id])
      
      @@index([userId, isActive])
      @@index([expiresAt])
    }
  `;
}
```

---

## 🛡️ Data Protection

### SQL Injection Prevention

```typescript
/**
 * SQL Injection Prevention Specification
 */
interface SQLInjectionPreventionSpec {
  strategy: 'Use Prisma ORM (parameterized queries)';
  
  rules: [
    'NEVER use raw SQL with user input',
    'ALWAYS use Prisma query builder',
    'If raw SQL needed, use parameterized queries',
    'Validate and sanitize all inputs'
  ];
  
  example: `
    // ❌ NEVER DO THIS
    const result = await prisma.$queryRaw\`
      SELECT * FROM transactions WHERE id = \${userId}
    \`;
    
    // ✅ DO THIS
    const result = await prisma.transaction.findMany({
      where: { userId }
    });
    
    // ✅ OR THIS (if raw SQL needed)
    const result = await prisma.$queryRaw\`
      SELECT * FROM transactions WHERE id = \${Prisma.sql\`\${userId}\`}
    \`;
  `;
}
```

### XSS Prevention

```typescript
/**
 * XSS Prevention Specification
 */
interface XSSPreventionSpec {
  strategy: 'React automatic escaping + Content Security Policy';
  
  rules: [
    'Never use dangerouslySetInnerHTML',
    'Sanitize user input before display',
    'Use Content Security Policy headers',
    'Validate all data from API'
  ];
  
  csp: `
    Content-Security-Policy: 
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      font-src 'self' data:;
      connect-src 'self' https://api.supabase.co;
  `;
}
```

### CSRF Protection

```typescript
/**
 * CSRF Protection Specification
 */
interface CSRFProtectionSpec {
  strategy: 'SameSite cookies + CSRF tokens';
  
  implementation: {
    cookies: {
      sameSite: 'strict';
      secure: true;
      httpOnly: true;
    };
    
    tokens: {
      generate: 'On session creation';
      validate: 'On state-changing requests';
      rotate: 'After each use';
    };
  };
}
```

---

## ✅ Security Checklist

### Week 1: Critical Security
- [ ] Implement RLS policies
- [ ] Create organization filter middleware
- [ ] Test multi-tenancy isolation
- [ ] Implement permission checks
- [ ] Create audit logging

### Week 2: Authentication
- [ ] Implement JWT security
- [ ] Create session management
- [ ] Add session timeout
- [ ] Test authentication flow

### Week 3: Data Protection
- [ ] Review all queries for SQL injection
- [ ] Implement CSP headers
- [ ] Add CSRF protection
- [ ] Security testing

### Week 4: Monitoring
- [ ] Set up security monitoring
- [ ] Create alert system
- [ ] Document security procedures
- [ ] Security audit

---

*This security plan ensures all reports are protected against common vulnerabilities and comply with security best practices.*
