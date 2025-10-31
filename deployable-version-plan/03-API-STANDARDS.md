# API Design Standards & Best Practices

## Overview

This document defines the API design standards for SNM Analytics, ensuring consistency, maintainability, and developer experience.

## API Design Principles

### 1. RESTful Design
- Use HTTP methods correctly (GET, POST, PUT, PATCH, DELETE)
- Resource-based URLs
- Stateless communication
- Standard HTTP status codes

### 2. Consistency
- Uniform naming conventions
- Predictable response structures
- Consistent error handling
- Standard pagination

### 3. Security
- Authentication required for all endpoints
- Authorization checks
- Input validation
- Rate limiting

### 4. Performance
- Efficient queries
- Caching strategies
- Pagination for large datasets
- Compression

## URL Structure

### Base URL
```
Production:  https://api.snmanalytics.com/v1
Development: http://localhost:3000/api/v1
```

### Resource Naming

```
✅ Good:
/api/v1/accounts
/api/v1/transactions
/api/v1/employees

❌ Bad:
/api/v1/getAccounts
/api/v1/transaction_list
/api/v1/Employees
```

### URL Patterns

```
# Collection
GET    /api/v1/accounts
POST   /api/v1/accounts

# Single Resource
GET    /api/v1/accounts/:id
PUT    /api/v1/accounts/:id
PATCH  /api/v1/accounts/:id
DELETE /api/v1/accounts/:id

# Nested Resources
GET    /api/v1/accounts/:id/transactions
POST   /api/v1/accounts/:id/transactions

# Actions (when REST doesn't fit)
POST   /api/v1/transactions/:id/reconcile
POST   /api/v1/reports/income-statement/generate
```

## HTTP Methods

| Method | Purpose | Idempotent | Safe |
|--------|---------|------------|------|
| GET | Retrieve resource(s) | Yes | Yes |
| POST | Create resource | No | No |
| PUT | Replace resource | Yes | No |
| PATCH | Update resource | No | No |
| DELETE | Delete resource | Yes | No |

## Request Format

### Headers

```http
Content-Type: application/json
Authorization: Bearer <token>
X-Organization-ID: <org-id>
Accept: application/json
```

### Query Parameters

```typescript
// Pagination
?page=1&limit=20

// Filtering
?status=ACTIVE&type=ASSETS

// Sorting
?sortBy=createdAt&order=desc

// Search
?search=petty%20cash

// Date Range
?startDate=2025-01-01&endDate=2025-01-31

// Field Selection
?fields=id,name,balance

// Include Relations
?include=transactions,account
```

### Request Body

```typescript
// POST /api/v1/accounts
{
  "name": "Petty Cash",
  "secondaryAccountId": "uuid",
  "description": "Office petty cash"
}

// PATCH /api/v1/accounts/:id
{
  "name": "Updated Name",
  "isActive": false
}
```

## Response Format

### Success Response Structure

```typescript
interface ApiResponse<T> {
  success: true;
  statusCode: number;
  data: T;
  meta?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

interface PaginatedResponse<T> {
  success: true;
  statusCode: number;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  meta?: {
    timestamp: string;
    requestId: string;
  };
}
```

### Examples

```json
// Single Resource (200 OK)
{
  "success": true,
  "statusCode": 200,
  "data": {
    "id": "uuid",
    "name": "Petty Cash",
    "balance": 5000.00,
    "createdAt": "2025-01-01T00:00:00Z"
  },
  "meta": {
    "timestamp": "2025-01-10T12:00:00Z",
    "requestId": "req_123",
    "version": "1.0.0"
  }
}

// Collection (Paginated) - 200 OK
{
  "success": true,
  "statusCode": 200,
  "data": [
    {
      "id": "uuid1",
      "name": "Account 1"
    },
    {
      "id": "uuid2",
      "name": "Account 2"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3,
    "hasNext": true,
    "hasPrevious": false
  },
  "meta": {
    "timestamp": "2025-01-10T12:00:00Z",
    "requestId": "req_124"
  }
}

// Created Resource - 201 Created
{
  "success": true,
  "statusCode": 201,
  "data": {
    "id": "uuid",
    "name": "New Account",
    "balance": 0.00,
    "createdAt": "2025-01-10T12:00:00Z"
  },
  "meta": {
    "timestamp": "2025-01-10T12:00:00Z",
    "requestId": "req_125"
  }
}

// No Content - 204 No Content
// Note: 204 responses have no body
```

## Error Response Format

### Error Structure

```typescript
interface ErrorResponse {
  success: false;
  statusCode: number;
  error: {
    code: string;
    message: string;
    details?: any;
    field?: string;
    stack?: string; // Only in development
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}
```

### Error Examples

```json
// Validation Error - 422 Unprocessable Entity
{
  "success": false,
  "statusCode": 422,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      },
      {
        "field": "amount",
        "message": "Amount must be greater than zero"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-01-10T12:00:00Z",
    "requestId": "req_126"
  }
}

// Not Found - 404 Not Found
{
  "success": false,
  "statusCode": 404,
  "error": {
    "code": "NOT_FOUND",
    "message": "Account not found",
    "details": {
      "accountId": "uuid"
    }
  },
  "meta": {
    "timestamp": "2025-01-10T12:00:00Z",
    "requestId": "req_127"
  }
}

// Unauthorized - 401 Unauthorized
{
  "success": false,
  "statusCode": 401,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  },
  "meta": {
    "timestamp": "2025-01-10T12:00:00Z",
    "requestId": "req_128"
  }
}

// Forbidden - 403 Forbidden
{
  "success": false,
  "statusCode": 403,
  "error": {
    "code": "FORBIDDEN",
    "message": "You don't have permission to access this resource"
  },
  "meta": {
    "timestamp": "2025-01-10T12:00:00Z",
    "requestId": "req_129"
  }
}

// Business Logic Error - 400 Bad Request
{
  "success": false,
  "statusCode": 400,
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "Account balance is insufficient for this transaction",
    "details": {
      "accountId": "uuid",
      "currentBalance": 1000.00,
      "requiredAmount": 5000.00
    }
  },
  "meta": {
    "timestamp": "2025-01-10T12:00:00Z",
    "requestId": "req_130"
  }
}

// Conflict - 409 Conflict
{
  "success": false,
  "statusCode": 409,
  "error": {
    "code": "DUPLICATE_ENTRY",
    "message": "An account with this code already exists",
    "details": {
      "field": "code",
      "value": "01-001-001"
    }
  },
  "meta": {
    "timestamp": "2025-01-10T12:00:00Z",
    "requestId": "req_131"
  }
}

// Rate Limit - 429 Too Many Requests
{
  "success": false,
  "statusCode": 429,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "details": {
      "retryAfter": 60,
      "limit": 1000,
      "remaining": 0
    }
  },
  "meta": {
    "timestamp": "2025-01-10T12:00:00Z",
    "requestId": "req_132"
  }
}

// Internal Server Error - 500 Internal Server Error
{
  "success": false,
  "statusCode": 500,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred. Please try again later.",
    "details": {
      "errorId": "err_abc123"
    }
  },
  "meta": {
    "timestamp": "2025-01-10T12:00:00Z",
    "requestId": "req_133"
  }
}
```

## HTTP Status Codes

### Success Codes
- `200 OK` - Successful GET, PUT, PATCH
- `201 Created` - Successful POST
- `204 No Content` - Successful DELETE

### Client Error Codes
- `400 Bad Request` - Invalid request format
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource doesn't exist
- `409 Conflict` - Resource conflict (duplicate)
- `422 Unprocessable Entity` - Validation error
- `429 Too Many Requests` - Rate limit exceeded

### Server Error Codes
- `500 Internal Server Error` - Unexpected server error
- `502 Bad Gateway` - Upstream service error
- `503 Service Unavailable` - Service temporarily down
- `504 Gateway Timeout` - Request timeout

## Error Codes

```typescript
enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Resource
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  
  // Business Logic
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  ACCOUNT_INACTIVE = 'ACCOUNT_INACTIVE',
  TRANSACTION_RECONCILED = 'TRANSACTION_RECONCILED',
  INVALID_ACCOUNT_TYPE = 'INVALID_ACCOUNT_TYPE',
  
  // System
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}
```

## Pagination

### Request
```
GET /api/v1/transactions?page=2&limit=50
```

### Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 50,
    "total": 1250,
    "totalPages": 25,
    "hasNext": true,
    "hasPrevious": true
  }
}
```

### Default Values
- Default page: 1
- Default limit: 20
- Max limit: 100

## Filtering & Sorting

### Filtering
```
# Single filter
GET /api/v1/accounts?type=ASSETS

# Multiple filters
GET /api/v1/accounts?type=ASSETS&isActive=true

# Range filter
GET /api/v1/transactions?startDate=2025-01-01&endDate=2025-01-31

# Search
GET /api/v1/accounts?search=cash
```

### Sorting
```
# Single sort
GET /api/v1/accounts?sortBy=name&order=asc

# Multiple sorts
GET /api/v1/accounts?sortBy=type,name&order=asc,desc
```

## Field Selection

```
# Select specific fields
GET /api/v1/accounts?fields=id,name,balance

# Exclude fields
GET /api/v1/accounts?exclude=metadata,createdBy
```

## Including Relations

```
# Include related data
GET /api/v1/accounts/:id?include=transactions

# Multiple includes
GET /api/v1/accounts/:id?include=transactions,secondaryAccount
```

## Versioning

### URL Versioning (Recommended)
```
/api/v1/accounts
/api/v2/accounts
```

### Header Versioning (Alternative)
```http
Accept: application/vnd.snm.v1+json
```

## Rate Limiting

### Headers
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1609459200
```

### Limits
- Anonymous: 100 requests/hour
- Authenticated: 1000 requests/hour
- Premium: 5000 requests/hour

## Caching

### Headers
```http
Cache-Control: public, max-age=3600
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"
Last-Modified: Wed, 21 Oct 2025 07:28:00 GMT
```

### Strategy
- GET requests: Cache for 5 minutes
- Reports: Cache for 1 hour
- Static data: Cache for 24 hours

## Security Headers

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
```

## CORS Configuration

```typescript
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Organization-ID'],
  credentials: true,
  maxAge: 86400, // 24 hours
};
```

## Request Validation

### Using Zod

```typescript
import { z } from 'zod';

const createAccountSchema = z.object({
  name: z.string().min(3).max(100),
  secondaryAccountId: z.string().uuid(),
  description: z.string().max(500).optional(),
  balance: z.number().min(0).optional(),
});

type CreateAccountInput = z.infer<typeof createAccountSchema>;
```

## Logging

### Request Logging
```typescript
{
  timestamp: '2025-01-10T12:00:00Z',
  requestId: 'req_123',
  method: 'POST',
  path: '/api/v1/accounts',
  userId: 'user_123',
  organizationId: 'org_123',
  duration: 45, // ms
  statusCode: 201,
  userAgent: 'Mozilla/5.0...',
  ip: '192.168.1.1'
}
```

### Error Logging
```typescript
{
  timestamp: '2025-01-10T12:00:00Z',
  requestId: 'req_124',
  level: 'error',
  error: {
    message: 'Database connection failed',
    stack: '...',
    code: 'DATABASE_ERROR'
  },
  context: {
    userId: 'user_123',
    organizationId: 'org_123',
    path: '/api/v1/accounts'
  }
}
```

## Implementation Examples

### Next.js API Route Handler

```typescript
// app/api/v1/accounts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Success response helper
function successResponse<T>(data: T, statusCode: number = 200) {
  return NextResponse.json(
    {
      success: true,
      statusCode,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
        version: '1.0.0',
      },
    },
    { status: statusCode }
  );
}

// Error response helper
function errorResponse(
  code: string,
  message: string,
  statusCode: number,
  details?: any
) {
  return NextResponse.json(
    {
      success: false,
      statusCode,
      error: {
        code,
        message,
        details,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    },
    { status: statusCode }
  );
}

// GET /api/v1/accounts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Fetch data
    const accounts = await prisma.holderAccount.findMany({
      skip: (page - 1) * limit,
      take: limit,
      where: { isActive: true },
    });
    
    const total = await prisma.holderAccount.count({
      where: { isActive: true },
    });
    
    // Return 200 OK with pagination
    return NextResponse.json(
      {
        success: true,
        statusCode: 200,
        data: accounts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrevious: page > 1,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    // Return 500 Internal Server Error
    return errorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred',
      500,
      { errorId: crypto.randomUUID() }
    );
  }
}

// POST /api/v1/accounts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const schema = z.object({
      name: z.string().min(3).max(100),
      secondaryAccountId: z.string().uuid(),
      description: z.string().max(500).optional(),
    });
    
    const validation = schema.safeParse(body);
    
    if (!validation.success) {
      // Return 422 Unprocessable Entity
      return errorResponse(
        'VALIDATION_ERROR',
        'Invalid input data',
        422,
        validation.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }))
      );
    }
    
    // Check for duplicates
    const existing = await prisma.holderAccount.findFirst({
      where: {
        name: validation.data.name,
        secondaryAccountId: validation.data.secondaryAccountId,
      },
    });
    
    if (existing) {
      // Return 409 Conflict
      return errorResponse(
        'DUPLICATE_ENTRY',
        'An account with this name already exists',
        409,
        { field: 'name', value: validation.data.name }
      );
    }
    
    // Create account
    const account = await prisma.holderAccount.create({
      data: {
        ...validation.data,
        code: await generateAccountCode(validation.data.secondaryAccountId),
        balance: 0,
        organizationId: 'org-id-from-auth',
      },
    });
    
    // Return 201 Created
    return successResponse(account, 201);
    
  } catch (error) {
    return errorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred',
      500
    );
  }
}
```

### API Route with Dynamic ID

```typescript
// app/api/v1/accounts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

// GET /api/v1/accounts/:id
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const account = await prisma.holderAccount.findUnique({
      where: { id: params.id },
      include: {
        secondaryAccount: true,
      },
    });
    
    if (!account) {
      // Return 404 Not Found
      return NextResponse.json(
        {
          success: false,
          statusCode: 404,
          error: {
            code: 'NOT_FOUND',
            message: 'Account not found',
            details: { accountId: params.id },
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID(),
          },
        },
        { status: 404 }
      );
    }
    
    // Return 200 OK
    return NextResponse.json(
      {
        success: true,
        statusCode: 200,
        data: account,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        statusCode: 500,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
      },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/accounts/:id
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const account = await prisma.holderAccount.findUnique({
      where: { id: params.id },
    });
    
    if (!account) {
      return NextResponse.json(
        {
          success: false,
          statusCode: 404,
          error: {
            code: 'NOT_FOUND',
            message: 'Account not found',
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID(),
          },
        },
        { status: 404 }
      );
    }
    
    // Soft delete
    await prisma.holderAccount.update({
      where: { id: params.id },
      data: { isActive: false },
    });
    
    // Return 204 No Content
    return new NextResponse(null, { status: 204 });
    
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        statusCode: 500,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
      },
      { status: 500 }
    );
  }
}
```

### Status Code Summary Table

| Status Code | When to Use | Response Body |
|-------------|-------------|---------------|
| 200 OK | Successful GET, PUT, PATCH | Yes - with data |
| 201 Created | Successful POST (resource created) | Yes - with created resource |
| 204 No Content | Successful DELETE | No body |
| 400 Bad Request | Business logic error | Yes - with error details |
| 401 Unauthorized | Missing/invalid authentication | Yes - with error |
| 403 Forbidden | Insufficient permissions | Yes - with error |
| 404 Not Found | Resource doesn't exist | Yes - with error |
| 409 Conflict | Duplicate resource | Yes - with error details |
| 422 Unprocessable Entity | Validation error | Yes - with validation errors |
| 429 Too Many Requests | Rate limit exceeded | Yes - with retry info |
| 500 Internal Server Error | Unexpected server error | Yes - with error ID |

---

**Next**: Complete API Route Specifications
