/**
 * Primary Account by ID API Endpoints
 * 
 * Handles individual primary account operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updatePrimaryAccountSchema, UpdatePrimaryAccountInput } from '@/lib/validation/schemas';
import { 
  successResponse, 
  errorResponse, 
  validationErrorResponse,
  notFoundResponse 
} from '@/lib/api/utils/response';
import { withAuth } from '@/lib/api/middleware/auth';
import { withValidation } from '@/lib/api/middleware/validation';
import { withRateLimit } from '@/lib/api/middleware/rateLimit';
import { withRequestLogging } from '@/lib/api/middleware/requestLogging';

// GET /api/accounts/primary/[id] - Get primary account by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const primaryAccount = await prisma.primaryAccount.findUnique({
      where: { id },
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

    if (!primaryAccount) {
      return notFoundResponse('Primary account not found');
    }

    return successResponse(primaryAccount);
  } catch (error) {
    console.error('Error fetching primary account:', error);
    return errorResponse('Failed to fetch primary account', 500);
  }
}

// PUT /api/accounts/primary/[id] - Update primary account
export const PUT = withRequestLogging(
  withRateLimit()(
    withAuth(
      withValidation(updatePrimaryAccountSchema)(
        async (req: NextRequest, { params, validated }: { params: { id: string }; validated: UpdatePrimaryAccountInput }) => {
          try {
            const { id } = params;
            const validatedData = validated;

            // Check if primary account exists
            const existingAccount = await prisma.primaryAccount.findUnique({
              where: { id },
            });

            if (!existingAccount) {
              return notFoundResponse('Primary account not found');
            }

            // Update primary account
            const updatedAccount = await prisma.primaryAccount.update({
              where: { id },
              data: validatedData,
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

            return successResponse(updatedAccount);
          } catch (error) {
            console.error('Error updating primary account:', error);
            return errorResponse('Failed to update primary account', 500);
          }
        }
      )
    )
  )
);

// DELETE /api/accounts/primary/[id] - Delete primary account
export const DELETE = withRequestLogging(
  withRateLimit()(
    withAuth(
      async (req: NextRequest, context: any) => {
        const { params } = context;
        try {
          const { id } = params;

          // Check if primary account exists
          const existingAccount = await prisma.primaryAccount.findUnique({
            where: { id },
            include: {
              secondaryAccounts: {
                select: { id: true, name: true },
              },
            },
          });

          if (!existingAccount) {
            return notFoundResponse('Primary account not found');
          }

          // Check if primary account has secondary accounts
          if (existingAccount.secondaryAccounts.length > 0) {
            return validationErrorResponse([{
              field: 'id',
              message: 'Cannot delete primary account with existing secondary accounts',
              code: 'HAS_DEPENDENCIES',
            }]);
          }

          // Delete primary account
          await prisma.primaryAccount.delete({
            where: { id },
          });

          return successResponse(null);
        } catch (error) {
          console.error('Error deleting primary account:', error);
          return errorResponse('Failed to delete primary account', 500);
        }
      }
    )
  )
);


