/**
 * Primary Accounts API Endpoints
 * 
 * Handles CRUD operations for primary accounts
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { 
  createPrimaryAccountSchema, 
  updatePrimaryAccountSchema, 
  getPrimaryAccountsSchema,
  CreatePrimaryAccountInput,
  UpdatePrimaryAccountInput,
  GetPrimaryAccountsInput
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

// GET /api/accounts/primary - List primary accounts
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || undefined;
    const type = searchParams.get('type') || undefined;
    const isActive = searchParams.get('isActive') === 'true' ? true : searchParams.get('isActive') === 'false' ? false : undefined;
    
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (type) where.type = type;
    if (isActive !== undefined) where.isActive = isActive;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.primaryAccount.count({ where });

    // Get primary accounts
    const primaryAccounts = await prisma.primaryAccount.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: 'asc' },
      include: {
        secondaryAccounts: {
          select: {
            id: true,
            name: true,
            code: true,
            isActive: true,
          },
        },
      },
    });

    return paginatedResponse(primaryAccounts, page, limit, total);
  } catch (error) {
    console.error('Error fetching primary accounts:', error);
    return errorResponse('Failed to fetch primary accounts', 500);
  }
}

// POST /api/accounts/primary - Create primary account
export const POST = withRequestLogging(
  withRateLimit()(
    withAuth(
      withValidation(createPrimaryAccountSchema)(
        async (req: NextRequest, { validated }: { validated: CreatePrimaryAccountInput }) => {
          try {
            const validatedData = validated;
            // Check if name already exists for this organization
            const existingAccount = await prisma.primaryAccount.findFirst({
              where: {
                name: validatedData.name,
                organizationId: validatedData.organizationId,
              },
            });

            if (existingAccount) {
              return validationErrorResponse([{
                field: 'name',
                message: 'Primary account name already exists for this organization',
                code: 'DUPLICATE',
              }]);
            }

            // Create primary account
            const primaryAccount = await prisma.primaryAccount.create({
              data: {
                name: validatedData.name,
                type: validatedData.type,
                description: validatedData.description ?? null,
                isActive: validatedData.isActive ?? true,
                organizationId: validatedData.organizationId,
              },
              include: {
                secondaryAccounts: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                    isActive: true,
                  },
                },
              },
            });

            return createdResponse(primaryAccount);
          } catch (error) {
            console.error('Error creating primary account:', error);
            return errorResponse('Failed to create primary account', 500);
          }
        }
      )
    )
  )
);

