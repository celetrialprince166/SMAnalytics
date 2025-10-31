# Phase 2: API Layer Development - Implementation Plan

**Phase**: 2 of 6  
**Duration**: 2-3 weeks  
**Complexity**: High  
**Dependencies**: Phase 1 (Foundation Setup) ✅ Complete

---

## Table of Contents

1. [Overview](#overview)
2. [Objectives](#objectives)
3. [Prerequisites](#prerequisites)
4. [Architecture](#architecture)
5. [Implementation Tasks](#implementation-tasks)
6. [API Standards](#api-standards)
7. [Testing Strategy](#testing-strategy)
8. [Success Criteria](#success-criteria)
9. [Timeline](#timeline)
10. [Risk Mitigation](#risk-mitigation)

---

## Overview

Phase 2 focuses on building a robust, production-ready API layer that bridges the frontend with the Prisma/Supabase backend. This phase implements RESTful API endpoints following the standards defined in `03-API-STANDARDS.md`.

### What We're Building

- **RESTful API Routes** for all core resources
- **Request/Response Standardization** across all endpoints
- **Input Validation** using Zod schemas
- **Error Handling Middleware** for consistent error responses
- **Authentication & Authorization** integration
- **API Client Library** for frontend consumption
- **Comprehensive API Documentation**

### Key Principles

1. **Consistency**: All endpoints follow the same patterns
2. **Type Safety**: Full TypeScript coverage with Zod validation
3. **Security**: Authentication, authorization, and input sanitization
4. **Performance**: Efficient queries and proper caching
5. **Developer Experience**: Clear documentation and helpful errors

---

## Objectives

### Primary Objectives

1. ✅ Create RESTful API endpoints for all core resources
2. ✅ Implement standardized request/response formats
3. ✅ Add comprehensive input validation
4. ✅ Build error handling middleware
5. ✅ Integrate authentication and authorization
6. ✅ Create API client for frontend
7. ✅ Document all endpoints

### Secondary Objectives

1. ✅ Implement pagination, filtering, and sorting
2. ✅ Add rate limiting for security
3. ✅ Set up API versioning (v1)
4. ✅ Create API testing suite
5. ✅ Add request logging and monitoring

---

## Prerequisites

### From Phase 1 ✅

- [x] Prisma schema defined and migrated
- [x] Prisma client configured
- [x] Repository pattern established
- [x] Authentication configured
- [x] Environment variables set up
- [x] Seed data loaded

### Additional Requirements

- [ ] API standards document reviewed (`03-API-STANDARDS.md`)
- [ ] Zod validation library installed
- [ ] API testing tools set up (Vitest, Supertest)
- [ ] Postman/Insomnia collection created (optional)

---

## Architecture

### API Layer Structure

```
app/api/v1/
├── accounts/
│   ├── primary/
│   │   ├── route.ts              # GET, POST /api/v1/accounts/primary
│   │   └── [id]/
│   │       └── route.ts          # GET, PUT, DELETE /api/v1/accounts/primary/:id
│   ├── secondary/
│   │   ├── route.ts              # GET, POST /api/v1/accounts/secondary
│   │   └── [id]/
│   │       └── route.ts          # GET, PUT, DELETE /api/v1/accounts/secondary/:id
│   └── holder/
│       ├── route.ts              # GET, POST /api/v1/accounts/holder
│       └── [id]/
│           ├── route.ts          # GET, PUT, DELETE /api/v1/accounts/holder/:id
│           ├── transactions/
│           │   └── route.ts      # GET /api/v1/accounts/holder/:id/transactions
│           └── balance/
│               └── route.ts      # GET /api/v1/accounts/holder/:id/balance
├── transactions/
│   ├── route.ts                  # GET, POST /api/v1/transactions
│   └── [id]/
│       ├── route.ts              # GET, PUT, DELETE /api/v1/transactions/:id
│       ├── reconcile/
│       │   └── route.ts          # POST /api/v1/transactions/:id/reconcile
│       └── split/
│           └── route.ts          # POST /api/v1/transactions/:id/split
├── products/
│   ├── route.ts                  # GET, POST /api/v1/products
│   └── [id]/
│       └── route.ts              # GET, PUT, DELETE /api/v1/products/:id
├── sales/
│   ├── route.ts                  # GET, POST /api/v1/sales
│   └── [id]/
│       └── route.ts              # GET, PUT, DELETE /api/v1/sales/:id
├── clients/
│   ├── route.ts                  # GET, POST /api/v1/clients
│   └── [id]/
│       └── route.ts              # GET, PUT, DELETE /api/v1/clients/:id
├── employees/
│   ├── route.ts                  # GET, POST /api/v1/employees
│   └── [id]/
│       ├── route.ts              # GET, PUT, DELETE /api/v1/employees/:id
│       └── salary/
│           └── route.ts          # GET, POST /api/v1/employees/:id/salary
├── fixed-assets/
│   ├── route.ts                  # GET, POST /api/v1/fixed-assets
│   └── [id]/
│       ├── route.ts              # GET, PUT, DELETE /api/v1/fixed-assets/:id
│       └── depreciation/
│           └── route.ts          # GET, POST /api/v1/fixed-assets/:id/depreciation
├── reports/
│   ├── balance-sheet/
│   │   └── route.ts              # GET /api/v1/reports/balance-sheet
│   ├── income-statement/
│   │   └── route.ts              # GET /api/v1/reports/income-statement
│   ├── trial-balance/
│   │   └── route.ts              # GET /api/v1/reports/trial-balance
│   └── cash-flow/
│       └── route.ts              # GET /api/v1/reports/cash-flow
└── auth/
    ├── login/
    │   └── route.ts              # POST /api/v1/auth/login
    ├── register/
    │   └── route.ts              # POST /api/v1/auth/register
    ├── logout/
    │   └── route.ts              # POST /api/v1/auth/logout
    └── refresh/
        └── route.ts              # POST /api/v1/auth/refresh
```

### Supporting Infrastructure

```
lib/
├── api/
│   ├── middleware/
│   │   ├── auth.ts               # Authentication middleware
│   │   ├── error-handler.ts     # Error handling middleware
│   │   ├── rate-limiter.ts      # Rate limiting middleware
│   │   ├── logger.ts            # Request logging middleware
│   │   └── validator.ts         # Input validation middleware
│   ├── utils/
│   │   ├── response.ts          # Response helpers
│   │   ├── pagination.ts        # Pagination utilities
│   │   ├── filtering.ts         # Filtering utilities
│   │   └── sorting.ts           # Sorting utilities
│   ├── schemas/
│   │   ├── accounts.ts          # Zod schemas for accounts
│   │   ├── transactions.ts      # Zod schemas for transactions
│   │   ├── products.ts          # Zod schemas for products
│   │   ├── sales.ts             # Zod schemas for sales
│   │   ├── clients.ts           # Zod schemas for clients
│   │   ├── employees.ts         # Zod schemas for employees
│   │   ├── fixed-assets.ts      # Zod schemas for fixed assets
│   │   └── common.ts            # Common schemas (pagination, etc.)
│   └── client/
│       ├── api-client.ts        # Main API client
│       ├── accounts-client.ts   # Accounts API client
│       ├── transactions-client.ts # Transactions API client
│       └── types.ts             # API types
└── errors/
    ├── api-error.ts             # Custom API error classes
    └── error-codes.ts           # Error code constants
```

---

## Implementation Tasks

### Task 2.1: API Infrastructure Setup

**Duration**: 2-3 days  
**Priority**: Critical  
**Dependencies**: None

#### Subtasks

1. **Create API Utilities** (Day 1)
   - [ ] Response helpers (`lib/api/utils/response.ts`)
   - [ ] Pagination utilities (`lib/api/utils/pagination.ts`)
   - [ ] Filtering utilities (`lib/api/utils/filtering.ts`)
   - [ ] Sorting utilities (`lib/api/utils/sorting.ts`)

2. **Create Error Handling** (Day 1)
   - [ ] Custom error classes (`lib/errors/api-error.ts`)
   - [ ] Error code constants (`lib/errors/error-codes.ts`)
   - [ ] Error handler middleware (`lib/api/middleware/error-handler.ts`)

3. **Create Middleware** (Day 2)
   - [ ] Authentication middleware (`lib/api/middleware/auth.ts`)
   - [ ] Rate limiting middleware (`lib/api/middleware/rate-limiter.ts`)
   - [ ] Request logger middleware (`lib/api/middleware/logger.ts`)
   - [ ] Validation middleware (`lib/api/middleware/validator.ts`)

#### Implementation Details

##### Response Helpers (`lib/api/utils/response.ts`)

```typescript
/**
 * API Response Utilities
 * 
 * Standardized response helpers for API routes
 */

import { NextResponse } from 'next/server';

export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta: {
    timestamp: string;
    requestId: string;
    version?: string;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * Success response helper
 */
export function successResponse<T>(
  data: T,
  statusCode: number = 200,
  pagination?: ApiResponse['pagination']
): NextResponse<ApiResponse<T>> {
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
      ...(pagination && { pagination }),
    },
    { status: statusCode }
  );
}

/**
 * Error response helper
 */
export function errorResponse(
  code: string,
  message: string,
  statusCode: number,
  details?: any
): NextResponse<ApiResponse> {
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

/**
 * Created response (201)
 */
export function createdResponse<T>(data: T): NextResponse<ApiResponse<T>> {
  return successResponse(data, 201);
}

/**
 * No content response (204)
 */
export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

/**
 * Bad request response (400)
 */
export function badRequestResponse(
  message: string,
  details?: any
): NextResponse<ApiResponse> {
  return errorResponse('BAD_REQUEST', message, 400, details);
}

/**
 * Unauthorized response (401)
 */
export function unauthorizedResponse(
  message: string = 'Unauthorized'
): NextResponse<ApiResponse> {
  return errorResponse('UNAUTHORIZED', message, 401);
}

/**
 * Forbidden response (403)
 */
export function forbiddenResponse(
  message: string = 'Forbidden'
): NextResponse<ApiResponse> {
  return errorResponse('FORBIDDEN', message, 403);
}

/**
 * Not found response (404)
 */
export function notFoundResponse(
  resource: string = 'Resource'
): NextResponse<ApiResponse> {
  return errorResponse('NOT_FOUND', `${resource} not found`, 404);
}

/**
 * Conflict response (409)
 */
export function conflictResponse(
  message: string,
  details?: any
): NextResponse<ApiResponse> {
  return errorResponse('CONFLICT', message, 409, details);
}

/**
 * Internal server error response (500)
 */
export function internalServerErrorResponse(
  message: string = 'Internal server error',
  details?: any
): NextResponse<ApiResponse> {
  return errorResponse('INTERNAL_SERVER_ERROR', message, 500, details);
}
```

##### Pagination Utilities (`lib/api/utils/pagination.ts`)

```typescript
/**
 * Pagination Utilities
 * 
 * Helpers for paginating API responses
 */

import { NextRequest } from 'next/server';

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Extract pagination parameters from request
 */
export function getPaginationParams(request: NextRequest): PaginationParams {
  const searchParams = request.nextUrl.searchParams;
  
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get('limit') || '10', 10))
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Calculate pagination metadata
 */
export function calculatePaginationMeta(
  total: number,
  page: number,
  limit: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  const hasMore = page < totalPages;

  return {
    page,
    limit,
    total,
    totalPages,
    hasMore,
  };
}

/**
 * Apply pagination to Prisma query
 */
export function applyPagination<T extends { skip?: number; take?: number }>(
  query: T,
  params: PaginationParams
): T {
  return {
    ...query,
    skip: params.skip,
    take: params.limit,
  };
}
```

##### Authentication Middleware (`lib/api/middleware/auth.ts`)

```typescript
/**
 * Authentication Middleware
 * 
 * Validates user authentication and attaches user context
 */

import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/ssr';
import { unauthorizedResponse } from '../utils/response';

export interface AuthContext {
  userId: string;
  organizationId: string;
  role: string;
  email: string;
}

/**
 * Authenticate request and get user context
 */
export async function authenticate(
  request: NextRequest
): Promise<{ context: AuthContext | null; error: NextResponse | null }> {
  const supabase = createMiddlewareClient({ req: request, res: NextResponse.next() });

  // Get session from Supabase
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return {
      context: null,
      error: unauthorizedResponse('Authentication required'),
    };
  }

  // Get user data from database
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, organizationId, role, email')
    .eq('id', session.user.id)
    .single();

  if (userError || !userData) {
    return {
      context: null,
      error: unauthorizedResponse('User not found'),
    };
  }

  return {
    context: {
      userId: userData.id,
      organizationId: userData.organizationId,
      role: userData.role,
      email: userData.email,
    },
    error: null,
  };
}

/**
 * Require authentication middleware
 */
export async function requireAuth(
  request: NextRequest,
  handler: (request: NextRequest, context: AuthContext) => Promise<NextResponse>
): Promise<NextResponse> {
  const { context, error } = await authenticate(request);

  if (error) {
    return error;
  }

  return handler(request, context!);
}

/**
 * Require specific role
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: string[],
  handler: (request: NextRequest, context: AuthContext) => Promise<NextResponse>
): Promise<NextResponse> {
  const { context, error } = await authenticate(request);

  if (error) {
    return error;
  }

  if (!allowedRoles.includes(context!.role)) {
    return unauthorizedResponse('Insufficient permissions');
  }

  return handler(request, context!);
}
```

##### Error Handler Middleware (`lib/api/middleware/error-handler.ts`)

```typescript
/**
 * Error Handler Middleware
 * 
 * Catches and formats errors consistently
 */

import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { errorResponse } from '../utils/response';

export class ApiError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Handle API errors and return appropriate response
 */
export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);

  // Custom API errors
  if (error instanceof ApiError) {
    return errorResponse(error.code, error.message, error.statusCode, error.details);
  }

  // Zod validation errors
  if (error instanceof ZodError) {
    return errorResponse(
      'VALIDATION_ERROR',
      'Invalid request data',
      400,
      error.errors
    );
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return errorResponse(
          'DUPLICATE_ERROR',
          'A record with this value already exists',
          409,
          { field: error.meta?.target }
        );
      case 'P2003':
        return errorResponse(
          'FOREIGN_KEY_ERROR',
          'Referenced record does not exist',
          400,
          { field: error.meta?.field_name }
        );
      case 'P2025':
        return errorResponse('NOT_FOUND', 'Record not found', 404);
      default:
        return errorResponse(
          'DATABASE_ERROR',
          'Database operation failed',
          500,
          { code: error.code }
        );
    }
  }

  // Generic errors
  if (error instanceof Error) {
    return errorResponse('INTERNAL_ERROR', error.message, 500);
  }

  // Unknown errors
  return errorResponse('UNKNOWN_ERROR', 'An unexpected error occurred', 500);
}

/**
 * Wrap async handler with error handling
 */
export function withErrorHandler<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}
```

#### Success Criteria

- [ ] All utility functions created and tested
- [ ] Response format matches API standards
- [ ] Error handling covers all common cases
- [ ] Middleware functions work correctly
- [ ] Authentication properly validates users
- [ ] Pagination works with various page sizes

---

### Task 2.2: Zod Validation Schemas

**Duration**: 2-3 days  
**Priority**: Critical  
**Dependencies**: Task 2.1

#### Subtasks

1. **Common Schemas** (Day 1)
   - [ ] Pagination schema (`lib/api/schemas/common.ts`)
   - [ ] Filtering schema
   - [ ] Sorting schema
   - [ ] Date range schema

2. **Account Schemas** (Day 1)
   - [ ] Primary account schemas (`lib/api/schemas/accounts.ts`)
   - [ ] Secondary account schemas
   - [ ] Holder account schemas

3. **Transaction Schemas** (Day 2)
   - [ ] Transaction schemas (`lib/api/schemas/transactions.ts`)
   - [ ] Split transaction schemas

4. **Other Resource Schemas** (Day 2-3)
   - [ ] Product schemas (`lib/api/schemas/products.ts`)
   - [ ] Sales schemas (`lib/api/schemas/sales.ts`)
   - [ ] Client schemas (`lib/api/schemas/clients.ts`)
   - [ ] Employee schemas (`lib/api/schemas/employees.ts`)
   - [ ] Fixed asset schemas (`lib/api/schemas/fixed-assets.ts`)

#### Implementation Details

##### Common Schemas (`lib/api/schemas/common.ts`)

```typescript
/**
 * Common Validation Schemas
 * 
 * Reusable Zod schemas for common patterns
 */

import { z } from 'zod';

/**
 * UUID schema
 */
export const uuidSchema = z.string().uuid('Invalid UUID format');

/**
 * Pagination schema
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

/**
 * Date range schema
 */
export const dateRangeSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
}).refine(
  (data) => data.startDate <= data.endDate,
  { message: 'Start date must be before or equal to end date' }
);

/**
 * Sorting schema
 */
export const sortingSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

/**
 * Filtering schema
 */
export const filteringSchema = z.object({
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});

/**
 * Decimal schema for financial values
 */
export const decimalSchema = z.union([
  z.number(),
  z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid decimal format'),
]).transform((val) => (typeof val === 'string' ? parseFloat(val) : val));

/**
 * Positive decimal schema
 */
export const positiveDecimalSchema = decimalSchema.refine(
  (val) => val > 0,
  { message: 'Value must be positive' }
);
```

##### Account Schemas (`lib/api/schemas/accounts.ts`)

```typescript
/**
 * Account Validation Schemas
 * 
 * Zod schemas for account-related requests
 */

import { z } from 'zod';
import { uuidSchema, decimalSchema } from './common';

/**
 * Primary Account Schemas
 */
export const createPrimaryAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  type: z.enum(['ASSETS', 'LIABILITIES', 'EQUITY', 'REVENUE', 'EXPENSES']),
  description: z.string().max(500).optional(),
});

export const updatePrimaryAccountSchema = createPrimaryAccountSchema.partial();

/**
 * Secondary Account Schemas
 */
export const createSecondaryAccountSchema = z.object({
  primaryAccountId: uuidSchema,
  name: z.string().min(1, 'Name is required').max(100),
  code: z.string().min(1, 'Code is required').max(10),
  description: z.string().max(500).optional(),
});

export const updateSecondaryAccountSchema = createSecondaryAccountSchema.partial();

/**
 * Holder Account Schemas
 */
export const createHolderAccountSchema = z.object({
  secondaryAccountId: uuidSchema,
  code: z.string().min(1, 'Code is required').max(20),
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  balance: decimalSchema.default(0),
});

export const updateHolderAccountSchema = createHolderAccountSchema.partial();

/**
 * Account filtering schema
 */
export const accountFilterSchema = z.object({
  type: z.enum(['ASSETS', 'LIABILITIES', 'EQUITY', 'REVENUE', 'EXPENSES']).optional(),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  primaryAccountId: uuidSchema.optional(),
  secondaryAccountId: uuidSchema.optional(),
});
```

##### Transaction Schemas (`lib/api/schemas/transactions.ts`)

```typescript
/**
 * Transaction Validation Schemas
 * 
 * Zod schemas for transaction-related requests
 */

import { z } from 'zod';
import { uuidSchema, positiveDecimalSchema } from './common';

/**
 * Transaction schemas
 */
export const createTransactionSchema = z.object({
  date: z.coerce.date(),
  number: z.string().min(1, 'Transaction number is required').max(50),
  description: z.string().min(1, 'Description is required').max(500),
  amount: positiveDecimalSchema,
  debitAccountId: uuidSchema,
  creditAccountId: uuidSchema,
  isPettyCash: z.boolean().default(false),
  metadata: z.record(z.any()).optional(),
}).refine(
  (data) => data.debitAccountId !== data.creditAccountId,
  { message: 'Debit and credit accounts must be different' }
);

export const updateTransactionSchema = createTransactionSchema.partial();

/**
 * Reconcile transaction schema
 */
export const reconcileTransactionSchema = z.object({
  reconciled: z.boolean(),
});

/**
 * Split transaction schema
 */
export const createSplitTransactionSchema = z.object({
  date: z.coerce.date(),
  code: z.string().min(1, 'Code is required').max(50),
  baseAccountId: uuidSchema,
  baseAccountSide: z.enum(['DEBIT', 'CREDIT']),
  splits: z.array(
    z.object({
      accountId: uuidSchema,
      amount: positiveDecimalSchema,
      description: z.string().min(1).max(500),
    })
  ).min(2, 'At least 2 splits are required'),
});

/**
 * Transaction filtering schema
 */
export const transactionFilterSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  debitAccountId: uuidSchema.optional(),
  creditAccountId: uuidSchema.optional(),
  reconciled: z.coerce.boolean().optional(),
  isPettyCash: z.coerce.boolean().optional(),
  search: z.string().optional(),
});
```

#### Success Criteria

- [ ] All schemas created and validated
- [ ] Schemas match Prisma models
- [ ] Proper error messages for validation failures
- [ ] Schemas handle edge cases
- [ ] Type inference works correctly

---

### Task 2.3: Accounts API Endpoints

**Duration**: 3-4 days  
**Priority**: Critical  
**Dependencies**: Tasks 2.1, 2.2

#### Subtasks

1. **Primary Accounts API** (Day 1)
   - [ ] GET `/api/v1/accounts/primary` - List all primary accounts
   - [ ] POST `/api/v1/accounts/primary` - Create primary account
   - [ ] GET `/api/v1/accounts/primary/:id` - Get single primary account
   - [ ] PUT `/api/v1/accounts/primary/:id` - Update primary account
   - [ ] DELETE `/api/v1/accounts/primary/:id` - Delete primary account

2. **Secondary Accounts API** (Day 2)
   - [ ] GET `/api/v1/accounts/secondary` - List all secondary accounts
   - [ ] POST `/api/v1/accounts/secondary` - Create secondary account
   - [ ] GET `/api/v1/accounts/secondary/:id` - Get single secondary account
   - [ ] PUT `/api/v1/accounts/secondary/:id` - Update secondary account
   - [ ] DELETE `/api/v1/accounts/secondary/:id` - Delete secondary account

3. **Holder Accounts API** (Day 3-4)
   - [ ] GET `/api/v1/accounts/holder` - List all holder accounts
   - [ ] POST `/api/v1/accounts/holder` - Create holder account
   - [ ] GET `/api/v1/accounts/holder/:id` - Get single holder account
   - [ ] PUT `/api/v1/accounts/holder/:id` - Update holder account
   - [ ] DELETE `/api/v1/accounts/holder/:id` - Delete holder account
   - [ ] GET `/api/v1/accounts/holder/:id/transactions` - Get account transactions
   - [ ] GET `/api/v1/accounts/holder/:id/balance` - Get account balance

#### Implementation Example

##### Primary Accounts List/Create (`app/api/v1/accounts/primary/route.ts`)

```typescript
/**
 * Primary Accounts API
 * 
 * GET  /api/v1/accounts/primary - List primary accounts
 * POST /api/v1/accounts/primary - Create primary account
 */

import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/api/middleware/auth';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { successResponse, createdResponse } from '@/lib/api/utils/response';
import { getPaginationParams, calculatePaginationMeta } from '@/lib/api/utils/pagination';
import { createPrimaryAccountSchema } from '@/lib/api/schemas/accounts';
import { createPrismaRepositories } from '@/lib/repositories/prisma';

/**
 * GET /api/v1/accounts/primary
 * List all primary accounts with pagination and filtering
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  return requireAuth(request, async (req, context) => {
    // Get pagination params
    const { page, limit, skip } = getPaginationParams(req);

    // Get repositories
    const repos = createPrismaRepositories(context.organizationId);

    // Get filter params
    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get('type');
    const search = searchParams.get('search');

    // Build filters
    const filters: any = { isActive: true };
    if (type) filters.type = type;
    if (search) {
      filters.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get data with count
    const [accounts, total] = await Promise.all([
      repos.primaryAccount.findAll({ ...filters, skip, take: limit }),
      repos.primaryAccount.count(filters),
    ]);

    // Calculate pagination meta
    const pagination = calculatePaginationMeta(total, page, limit);

    return successResponse(accounts, 200, pagination);
  });
});

/**
 * POST /api/v1/accounts/primary
 * Create a new primary account
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  return requireAuth(request, async (req, context) => {
    // Parse and validate request body
    const body = await req.json();
    const data = createPrimaryAccountSchema.parse(body);

    // Get repositories
    const repos = createPrismaRepositories(context.organizationId);

    // Create account
    const account = await repos.primaryAccount.create(data);

    return createdResponse(account);
  });
});
```

##### Primary Account Details (`app/api/v1/accounts/primary/[id]/route.ts`)

```typescript
/**
 * Primary Account Details API
 * 
 * GET    /api/v1/accounts/primary/:id - Get primary account
 * PUT    /api/v1/accounts/primary/:id - Update primary account
 * DELETE /api/v1/accounts/primary/:id - Delete primary account
 */

import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/api/middleware/auth';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import {
  successResponse,
  noContentResponse,
  notFoundResponse,
} from '@/lib/api/utils/response';
import { updatePrimaryAccountSchema } from '@/lib/api/schemas/accounts';
import { createPrismaRepositories } from '@/lib/repositories/prisma';

/**
 * GET /api/v1/accounts/primary/:id
 * Get a single primary account by ID
 */
export const GET = withErrorHandler(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    return requireAuth(request, async (req, context) => {
      const repos = createPrismaRepositories(context.organizationId);
      const account = await repos.primaryAccount.findById(params.id);

      if (!account) {
        return notFoundResponse('Primary account');
      }

      return successResponse(account);
    });
  }
);

/**
 * PUT /api/v1/accounts/primary/:id
 * Update a primary account
 */
export const PUT = withErrorHandler(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    return requireAuth(request, async (req, context) => {
      // Parse and validate request body
      const body = await req.json();
      const data = updatePrimaryAccountSchema.parse(body);

      // Get repositories
      const repos = createPrismaRepositories(context.organizationId);

      // Check if account exists
      const existing = await repos.primaryAccount.findById(params.id);
      if (!existing) {
        return notFoundResponse('Primary account');
      }

      // Update account
      const account = await repos.primaryAccount.update(params.id, data);

      return successResponse(account);
    });
  }
);

/**
 * DELETE /api/v1/accounts/primary/:id
 * Delete (soft delete) a primary account
 */
export const DELETE = withErrorHandler(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    return requireAuth(request, async (req, context) => {
      const repos = createPrismaRepositories(context.organizationId);

      // Check if account exists
      const existing = await repos.primaryAccount.findById(params.id);
      if (!existing) {
        return notFoundResponse('Primary account');
      }

      // Delete account (soft delete)
      await repos.primaryAccount.delete(params.id);

      return noContentResponse();
    });
  }
);
```

#### Success Criteria

- [ ] All account endpoints implemented
- [ ] CRUD operations work correctly
- [ ] Pagination works on list endpoints
- [ ] Filtering and search work correctly
- [ ] Validation errors return proper messages
- [ ] Multi-tenancy enforced (organizationId)
- [ ] Soft deletes work correctly

---

### Task 2.4: Transactions API Endpoints

**Duration**: 3-4 days  
**Priority**: Critical  
**Dependencies**: Tasks 2.1, 2.2, 2.3

#### Subtasks

1. **Basic Transaction API** (Day 1-2)
   - [ ] GET `/api/v1/transactions` - List transactions
   - [ ] POST `/api/v1/transactions` - Create transaction
   - [ ] GET `/api/v1/transactions/:id` - Get transaction
   - [ ] PUT `/api/v1/transactions/:id` - Update transaction
   - [ ] DELETE `/api/v1/transactions/:id` - Delete transaction

2. **Transaction Operations** (Day 3)
   - [ ] POST `/api/v1/transactions/:id/reconcile` - Reconcile transaction
   - [ ] POST `/api/v1/transactions/:id/unreconcile` - Unreconcile transaction

3. **Split Transactions** (Day 4)
   - [ ] POST `/api/v1/transactions/split` - Create split transaction
   - [ ] GET `/api/v1/transactions/split/:id` - Get split transaction details

#### Implementation Notes

- Transactions must update account balances
- Reconciled transactions cannot be edited
- Split transactions create multiple transaction records
- Validate debit/credit accounts exist
- Ensure accounting equation balance

#### Success Criteria

- [ ] All transaction endpoints implemented
- [ ] Account balances update correctly
- [ ] Reconciliation logic works
- [ ] Split transactions create correctly
- [ ] Validation prevents invalid transactions
- [ ] Audit trail created for all changes

---

### Task 2.5: Products & Sales API Endpoints

**Duration**: 2-3 days  
**Priority**: High  
**Dependencies**: Tasks 2.1, 2.2

#### Subtasks

1. **Products API** (Day 1-2)
   - [ ] GET `/api/v1/products` - List products
   - [ ] POST `/api/v1/products` - Create product
   - [ ] GET `/api/v1/products/:id` - Get product
   - [ ] PUT `/api/v1/products/:id` - Update product
   - [ ] DELETE `/api/v1/products/:id` - Delete product

2. **Sales API** (Day 2-3)
   - [ ] GET `/api/v1/sales` - List sales entries
   - [ ] POST `/api/v1/sales` - Create sale
   - [ ] GET `/api/v1/sales/:id` - Get sale
   - [ ] PUT `/api/v1/sales/:id` - Update sale
   - [ ] DELETE `/api/v1/sales/:id` - Delete sale

#### Implementation Notes

- Sales create transactions automatically
- Inventory updates on sales
- VAT calculations if applicable
- Cost of sales calculations

#### Success Criteria

- [ ] All product/sales endpoints implemented
- [ ] Inventory tracking works
- [ ] Sales create transactions correctly
- [ ] VAT calculations accurate
- [ ] Cost of sales calculated correctly

---

### Task 2.6: Clients & Employees API Endpoints

**Duration**: 2-3 days  
**Priority**: High  
**Dependencies**: Tasks 2.1, 2.2

#### Subtasks

1. **Clients API** (Day 1-2)
   - [ ] GET `/api/v1/clients` - List clients
   - [ ] POST `/api/v1/clients` - Create client
   - [ ] GET `/api/v1/clients/:id` - Get client
   - [ ] PUT `/api/v1/clients/:id` - Update client
   - [ ] DELETE `/api/v1/clients/:id` - Delete client

2. **Employees API** (Day 2-3)
   - [ ] GET `/api/v1/employees` - List employees
   - [ ] POST `/api/v1/employees` - Create employee
   - [ ] GET `/api/v1/employees/:id` - Get employee
   - [ ] PUT `/api/v1/employees/:id` - Update employee
   - [ ] DELETE `/api/v1/employees/:id` - Delete employee
   - [ ] GET `/api/v1/employees/:id/salary` - Get salary history
   - [ ] POST `/api/v1/employees/:id/salary` - Process salary

#### Success Criteria

- [ ] All client/employee endpoints implemented
- [ ] Validation works correctly
- [ ] Status updates work
- [ ] Salary processing works
- [ ] Filtering and search work

---

### Task 2.7: Fixed Assets API Endpoints

**Duration**: 2 days  
**Priority**: Medium  
**Dependencies**: Tasks 2.1, 2.2

#### Subtasks

1. **Fixed Assets API** (Day 1)
   - [ ] GET `/api/v1/fixed-assets` - List assets
   - [ ] POST `/api/v1/fixed-assets` - Create asset
   - [ ] GET `/api/v1/fixed-assets/:id` - Get asset
   - [ ] PUT `/api/v1/fixed-assets/:id` - Update asset
   - [ ] DELETE `/api/v1/fixed-assets/:id` - Delete asset

2. **Depreciation API** (Day 2)
   - [ ] GET `/api/v1/fixed-assets/:id/depreciation` - Get depreciation history
   - [ ] POST `/api/v1/fixed-assets/:id/depreciation` - Calculate depreciation
   - [ ] POST `/api/v1/fixed-assets/depreciation/batch` - Batch depreciation

#### Success Criteria

- [ ] All fixed asset endpoints implemented
- [ ] Depreciation calculations correct
- [ ] Batch depreciation works
- [ ] Asset status updates work

---

### Task 2.8: Reports API Endpoints

**Duration**: 2-3 days  
**Priority**: High  
**Dependencies**: Tasks 2.1, 2.2, 2.3, 2.4

#### Subtasks

1. **Financial Reports** (Day 1-2)
   - [ ] GET `/api/v1/reports/balance-sheet` - Balance sheet
   - [ ] GET `/api/v1/reports/income-statement` - Income statement
   - [ ] GET `/api/v1/reports/trial-balance` - Trial balance
   - [ ] GET `/api/v1/reports/cash-flow` - Cash flow statement

2. **Operational Reports** (Day 2-3)
   - [ ] GET `/api/v1/reports/sales-summary` - Sales summary
   - [ ] GET `/api/v1/reports/payroll-summary` - Payroll summary
   - [ ] GET `/api/v1/reports/inventory-summary` - Inventory summary
   - [ ] GET `/api/v1/reports/account-statement` - Account statement

#### Implementation Notes

- Reports use existing report services
- Date range filtering required
- Export formats (JSON, PDF, Excel)
- Caching for performance

#### Success Criteria

- [ ] All report endpoints implemented
- [ ] Reports generate correctly
- [ ] Date filtering works
- [ ] Performance is acceptable
- [ ] Export formats work

---

### Task 2.9: API Client Library

**Duration**: 2-3 days  
**Priority**: High  
**Dependencies**: All API endpoints

#### Subtasks

1. **Base API Client** (Day 1)
   - [ ] HTTP client with authentication
   - [ ] Request/response interceptors
   - [ ] Error handling
   - [ ] Type definitions

2. **Resource Clients** (Day 2-3)
   - [ ] Accounts client
   - [ ] Transactions client
   - [ ] Products client
   - [ ] Sales client
   - [ ] Clients client
   - [ ] Employees client
   - [ ] Fixed assets client
   - [ ] Reports client

#### Implementation Example

##### Base API Client (`lib/api/client/api-client.ts`)

```typescript
/**
 * API Client
 * 
 * Type-safe API client for frontend consumption
 */

import { ApiResponse } from '../utils/response';

export class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = '/api/v1') {
    this.baseUrl = baseUrl;
  }

  /**
   * Set authentication token
   */
  setToken(token: string) {
    this.token = token;
  }

  /**
   * Make HTTP request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data: ApiResponse<T> = await response.json();

    if (!data.success) {
      throw new ApiError(
        data.error?.code || 'UNKNOWN_ERROR',
        data.error?.message || 'An error occurred',
        response.status,
        data.error?.details
      );
    }

    return data;
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const queryString = params
      ? '?' + new URLSearchParams(params).toString()
      : '';
    
    return this.request<T>(`${endpoint}${queryString}`, {
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

export class ApiError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
```

##### Accounts Client (`lib/api/client/accounts-client.ts`)

```typescript
/**
 * Accounts API Client
 * 
 * Type-safe client for accounts endpoints
 */

import { ApiClient } from './api-client';
import { PrimaryAccount, SecondaryAccount, HolderAccount } from '@prisma/client';

export class AccountsClient {
  constructor(private client: ApiClient) {}

  // Primary Accounts
  async listPrimaryAccounts(params?: {
    page?: number;
    limit?: number;
    type?: string;
    search?: string;
  }) {
    return this.client.get<PrimaryAccount[]>('/accounts/primary', params);
  }

  async createPrimaryAccount(data: Omit<PrimaryAccount, 'id' | 'createdAt' | 'updatedAt'>) {
    return this.client.post<PrimaryAccount>('/accounts/primary', data);
  }

  async getPrimaryAccount(id: string) {
    return this.client.get<PrimaryAccount>(`/accounts/primary/${id}`);
  }

  async updatePrimaryAccount(id: string, data: Partial<PrimaryAccount>) {
    return this.client.put<PrimaryAccount>(`/accounts/primary/${id}`, data);
  }

  async deletePrimaryAccount(id: string) {
    return this.client.delete(`/accounts/primary/${id}`);
  }

  // Secondary Accounts
  async listSecondaryAccounts(params?: {
    page?: number;
    limit?: number;
    primaryAccountId?: string;
    search?: string;
  }) {
    return this.client.get<SecondaryAccount[]>('/accounts/secondary', params);
  }

  // ... similar methods for secondary and holder accounts
}
```

#### Success Criteria

- [ ] API client created and tested
- [ ] All endpoints have client methods
- [ ] Type safety maintained
- [ ] Error handling works
- [ ] Authentication works
- [ ] Easy to use from frontend

---

### Task 2.10: API Documentation & Testing

**Duration**: 2-3 days  
**Priority**: High  
**Dependencies**: All API endpoints

#### Subtasks

1. **API Documentation** (Day 1)
   - [ ] OpenAPI/Swagger specification
   - [ ] Endpoint documentation
   - [ ] Request/response examples
   - [ ] Error code documentation

2. **API Testing** (Day 2-3)
   - [ ] Integration tests for all endpoints
   - [ ] Authentication tests
   - [ ] Validation tests
   - [ ] Error handling tests
   - [ ] Performance tests

#### Implementation Notes

- Use Swagger/OpenAPI for documentation
- Create Postman/Insomnia collection
- Write integration tests with Vitest
- Test all success and error paths

#### Success Criteria

- [ ] Complete API documentation
- [ ] All endpoints documented
- [ ] Test coverage > 80%
- [ ] All tests passing
- [ ] Postman collection created

---

## API Standards

### Request/Response Format

All API endpoints follow the standardized format defined in `03-API-STANDARDS.md`:

#### Success Response
```json
{
  "success": true,
  "statusCode": 200,
  "data": { ... },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "uuid",
    "version": "1.0.0"
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasMore": true
  }
}
```

#### Error Response
```json
{
  "success": false,
  "statusCode": 400,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": { ... }
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "uuid"
  }
}
```

### HTTP Status Codes

- `200 OK` - Successful GET, PUT
- `201 Created` - Successful POST
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Duplicate resource
- `500 Internal Server Error` - Server error

### Authentication

All protected endpoints require authentication via Supabase session:

```typescript
// Request headers
Authorization: Bearer <access_token>
```

### Pagination

List endpoints support pagination:

```
GET /api/v1/accounts/primary?page=1&limit=10
```

### Filtering

List endpoints support filtering:

```
GET /api/v1/accounts/primary?type=ASSETS&search=cash
```

### Sorting

List endpoints support sorting:

```
GET /api/v1/accounts/primary?sortBy=name&sortOrder=asc
```

---

## Testing Strategy

### Unit Tests

- Test utility functions
- Test validation schemas
- Test middleware functions
- Test error handling

### Integration Tests

- Test all API endpoints
- Test authentication flow
- Test authorization rules
- Test data validation
- Test error responses

### Performance Tests

- Test response times
- Test concurrent requests
- Test pagination performance
- Test database query performance

### Test Tools

- **Vitest** - Test runner
- **Supertest** - HTTP testing
- **MSW** - API mocking
- **Prisma Test Environment** - Database testing

---

## Success Criteria

### Functional Requirements

- [ ] All API endpoints implemented
- [ ] CRUD operations work correctly
- [ ] Authentication/authorization work
- [ ] Input validation works
- [ ] Error handling works
- [ ] Pagination works
- [ ] Filtering/sorting work
- [ ] Multi-tenancy enforced

### Technical Requirements

- [ ] Response format standardized
- [ ] Error codes consistent
- [ ] Type safety maintained
- [ ] Performance acceptable (<200ms avg)
- [ ] Test coverage > 80%
- [ ] API documentation complete

### Quality Requirements

- [ ] Code follows standards
- [ ] No security vulnerabilities
- [ ] Proper error messages
- [ ] Clean code structure
- [ ] Good documentation

---

## Timeline

### Week 1: Infrastructure & Core Endpoints
- Days 1-2: API infrastructure (Task 2.1)
- Days 3-4: Validation schemas (Task 2.2)
- Day 5: Start accounts API (Task 2.3)

### Week 2: Accounts & Transactions
- Days 1-2: Complete accounts API (Task 2.3)
- Days 3-5: Transactions API (Task 2.4)

### Week 3: Other Resources & Client
- Days 1-2: Products & Sales (Task 2.5)
- Day 3: Clients & Employees (Task 2.6)
- Day 4: Fixed Assets (Task 2.7)
- Day 5: Reports (Task 2.8)

### Week 4: Client Library & Testing (if needed)
- Days 1-2: API client (Task 2.9)
- Days 3-4: Documentation & Testing (Task 2.10)
- Day 5: Bug fixes and polish

**Total Duration**: 2-3 weeks

---

## Risk Mitigation

### Technical Risks

1. **Performance Issues**
   - **Risk**: Slow API responses
   - **Mitigation**: Implement caching, optimize queries, use indexes
   - **Monitoring**: Track response times

2. **Authentication Complexity**
   - **Risk**: Complex auth integration
   - **Mitigation**: Use Supabase Auth, follow best practices
   - **Fallback**: Simplified auth for MVP

3. **Data Validation Errors**
   - **Risk**: Invalid data getting through
   - **Mitigation**: Comprehensive Zod schemas, database constraints
   - **Testing**: Extensive validation tests

### Process Risks

1. **Scope Creep**
   - **Risk**: Adding too many features
   - **Mitigation**: Stick to defined endpoints, defer nice-to-haves
   - **Control**: Regular progress reviews

2. **Testing Delays**
   - **Risk**: Insufficient testing time
   - **Mitigation**: Write tests alongside implementation
   - **Buffer**: Extra time allocated in week 4

### Dependencies

1. **Phase 1 Completion**
   - **Status**: ✅ Complete
   - **Impact**: None

2. **Supabase Availability**
   - **Risk**: Supabase downtime
   - **Mitigation**: Use local development database
   - **Monitoring**: Check Supabase status

---

## Next Steps After Phase 2

Upon successful completion of Phase 2:

1. **Phase 3**: Frontend Migration
   - Integrate API client
   - Update React Query hooks
   - Replace localStorage calls
   - Test frontend integration

2. **Phase 4**: Advanced Features
   - Real-time updates
   - Batch operations
   - Advanced reporting
   - Export functionality

3. **Phase 5**: Testing & Optimization
   - Performance optimization
   - Security audit
   - Load testing
   - Bug fixes

---

## Appendix

### Useful Commands

```bash
# Start development server
npm run dev

# Run tests
npm test

# Run specific test file
npm test -- accounts.test.ts

# Generate Prisma client
npx prisma generate

# View database in Prisma Studio
npx prisma studio

# Seed database
npm run seed
```

### Environment Variables

```bash
# Required for Phase 2
DATABASE_URL=
DIRECT_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### Resources

- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Zod Documentation](https://zod.dev/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [RESTful API Design](https://restfulapi.net/)

---

**Document Version**: 1.0  
**Last Updated**: October 10, 2025  
**Status**: Ready for Implementation  
**Prerequisites**: Phase 1 ✅ Complete




