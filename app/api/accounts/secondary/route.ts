/**
 * Secondary Accounts API Endpoints
 * 
 * Handles CRUD operations for secondary accounts
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  createSecondaryAccountSchema, 
  getSecondaryAccountsSchema,
  CreateSecondaryAccountInput,
  GetSecondaryAccountsInput
} from '@/lib/validation/schemas';
import { 
  successResponse, 
  errorResponse, 
  validationErrorResponse,
  paginatedResponse,
  createdResponse
} from '@/lib/api/utils/response';
import { withAuth } from '@/lib/api/middleware/auth';
import { withValidation, withQueryValidation } from '@/lib/api/middleware/validation';
import { withRateLimit } from '@/lib/api/middleware/rateLimit';
import { withRequestLogging } from '@/lib/api/middleware/requestLogging';

// GET /api/accounts/secondary - List secondary accounts
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || undefined;
    const primaryAccountId = searchParams.get('primaryAccountId') || undefined;
    const isActive = searchParams.get('isActive') === 'true' ? true : searchParams.get('isActive') === 'false' ? false : undefined;
    
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (primaryAccountId) where.primaryAccountId = primaryAccountId;
    if (isActive !== undefined) where.isActive = isActive;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.secondaryAccount.count({ where });

    // Get secondary accounts
    const secondaryAccounts = await prisma.secondaryAccount.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: 'asc' },
      include: {
        primaryAccount: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        holderAccounts: {
          select: {
            id: true,
            name: true,
            code: true,
            balance: true,
            isActive: true,
          },
        },
      },
    });

    return paginatedResponse(secondaryAccounts, page, limit, total);
  } catch (error) {
    console.error('Error fetching secondary accounts:', error);
    return errorResponse('Failed to fetch secondary accounts', 500);
  }
}

// POST /api/accounts/secondary - Create secondary account
export const POST = withRequestLogging(
  withRateLimit()(
      withAuth(
        withValidation(createSecondaryAccountSchema)(
          async (req: NextRequest, { validated }: { validated: CreateSecondaryAccountInput }) => {
            try {
              const validatedData = validated;
              // Verify primary account exists and is active
              const primaryAccount = await prisma.primaryAccount.findUnique({
                where: { id: validatedData.primaryAccountId },
              });

              if (!primaryAccount) {
                return validationErrorResponse([{
                  field: 'primaryAccountId',
                  message: 'Primary account not found',
                  code: 'NOT_FOUND',
                }]);
              }

              if (!primaryAccount.isActive) {
                return validationErrorResponse([{
                  field: 'primaryAccountId',
                  message: 'Cannot create secondary account under inactive primary account',
                  code: 'INACTIVE_PARENT',
                }]);
              }

              // Check if code already exists for this organization
              const existingAccount = await prisma.secondaryAccount.findFirst({
                where: {
                  code: validatedData.code,
                  organizationId: validatedData.organizationId,
                },
              });

              if (existingAccount) {
                return validationErrorResponse([{
                  field: 'code',
                  message: 'Secondary account code already exists',
                  code: 'DUPLICATE',
                }]);
              }

              // Create secondary account
              const secondaryAccount = await prisma.secondaryAccount.create({
                data: {
                  name: validatedData.name,
                  code: validatedData.code,
                  description: validatedData.description ?? null,
                  isActive: validatedData.isActive ?? true,
                  organizationId: validatedData.organizationId,
                  primaryAccountId: validatedData.primaryAccountId,
                },
                include: {
                  primaryAccount: {
                    select: {
                      id: true,
                      name: true,
                      type: true,
                      isActive: true,
                    },
                  },
                  holderAccounts: {
                    select: {
                      id: true,
                      name: true,
                      code: true,
                      balance: true,
                      isActive: true,
                    },
                  },
                },
              });

              return createdResponse(secondaryAccount);
          } catch (error) {
            console.error('Error creating secondary account:', error);
            return errorResponse('Failed to create secondary account', 500);
          }
        }
      )
    )
  )
);

