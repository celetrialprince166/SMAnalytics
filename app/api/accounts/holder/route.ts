/**
 * Holder Accounts API Endpoints
 * 
 * Handles CRUD operations for holder accounts
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  createHolderAccountSchema, 
  getHolderAccountsSchema,
  CreateHolderAccountInput,
  GetHolderAccountsInput
} from '@/lib/validation/schemas';
import { 
  successResponse, 
  errorResponse, 
  validationErrorResponse,
  paginatedResponse 
} from '@/lib/api/utils/response';
import { withAuth } from '@/lib/api/middleware/auth';
import { withValidation, withQueryValidation } from '@/lib/api/middleware/validation';
import { withRateLimit } from '@/lib/api/middleware/rateLimit';
import { withRequestLogging } from '@/lib/api/middleware/requestLogging';

// GET /api/accounts/holder - List holder accounts
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || undefined;
    const secondaryAccountId = searchParams.get('secondaryAccountId') || undefined;
    const isActive = searchParams.get('isActive') === 'true' ? true : searchParams.get('isActive') === 'false' ? false : undefined;
    
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (secondaryAccountId) where.secondaryAccountId = secondaryAccountId;
    if (isActive !== undefined) where.isActive = isActive;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.holderAccount.count({ where });

    // Get holder accounts
    const holderAccounts = await prisma.holderAccount.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: 'asc' },
      include: {
        secondaryAccount: {
          select: {
            id: true,
            name: true,
            code: true,
            isActive: true,
            primaryAccount: {
              select: {
                id: true,
                name: true,
                type: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    return paginatedResponse(holderAccounts, page, limit, total);
  } catch (error) {
    console.error('Error fetching holder accounts:', error);
    return errorResponse('Failed to fetch holder accounts', 500);
  }
}

// POST /api/accounts/holder - Create holder account
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate required fields
    if (!body.secondaryAccountId || !body.name) {
      return errorResponse('secondaryAccountId and name are required', 400);
    }

    // Get organization ID from authenticated user (for now, use a default or from request)
    // In production, this should come from the authenticated session
    const organizationId = body.organizationId || '1759897262597-d7qeu594i'; // Default org ID

    // Generate code if not provided
    let code = body.code;
    if (!code) {
      const secondaryAccount = await prisma.secondaryAccount.findUnique({
        where: { id: body.secondaryAccountId },
        select: { code: true },
      });

      if (!secondaryAccount) {
        return errorResponse('Secondary account not found', 404);
      }

      const count = await prisma.holderAccount.count({
        where: { secondaryAccountId: body.secondaryAccountId },
      });

      const nextNumber = String(count + 1).padStart(3, '0');
      code = `${secondaryAccount.code}-${nextNumber}`;
    }

    // Verify secondary account exists and is active
    const secondaryAccount = await prisma.secondaryAccount.findUnique({
      where: { id: body.secondaryAccountId },
      include: {
        primaryAccount: {
          select: { id: true, isActive: true },
        },
      },
    });

    if (!secondaryAccount) {
      return errorResponse('Secondary account not found', 404);
    }

    if (!secondaryAccount.isActive) {
      return errorResponse('Cannot create holder account under inactive secondary account', 400);
    }

    if (!secondaryAccount.primaryAccount.isActive) {
      return errorResponse('Cannot create holder account under inactive primary account', 400);
    }

    // Check if code already exists
    const existingAccount = await prisma.holderAccount.findFirst({
      where: {
        code,
        organizationId,
      },
    });

    if (existingAccount) {
      return errorResponse('Holder account code already exists', 409);
    }

    // Check if name already exists under the same secondary account
    const existingNameAccount = await prisma.holderAccount.findFirst({
      where: {
        secondaryAccountId: body.secondaryAccountId,
        name: body.name,
        isActive: true,
      },
    });

    if (existingNameAccount) {
      return validationErrorResponse([{
        field: 'name',
        message: 'An account with this name already exists under the selected secondary account',
        code: 'DUPLICATE_NAME',
      }]);
    }

    // Create holder account
    const holderAccount = await prisma.holderAccount.create({
      data: {
        organizationId,
        secondaryAccountId: body.secondaryAccountId,
        code,
        name: body.name,
        description: body.description || '',
        balance: 0, // Always start with zero balance
        isActive: true,
      },
      include: {
        secondaryAccount: {
          select: {
            id: true,
            name: true,
            code: true,
            isActive: true,
            primaryAccount: {
              select: {
                id: true,
                name: true,
                type: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    return successResponse(holderAccount, 201);
  } catch (error: any) {
    console.error('Error creating holder account:', error);
    return errorResponse('Failed to create holder account: ' + error.message, 500);
  }
}

