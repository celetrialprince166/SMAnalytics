/**
 * Secondary Account by ID API Endpoints
 * 
 * Handles individual secondary account operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateSecondaryAccountSchema, UpdateSecondaryAccountInput } from '@/lib/validation/schemas';
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

// GET /api/accounts/secondary/[id] - Get secondary account by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const secondaryAccount = await prisma.secondaryAccount.findUnique({
      where: { id },
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

    if (!secondaryAccount) {
      return notFoundResponse('Secondary account not found');
    }

    return successResponse(secondaryAccount);
  } catch (error) {
    console.error('Error fetching secondary account:', error);
    return errorResponse('Failed to fetch secondary account', 500);
  }
}

// PUT /api/accounts/secondary/[id] - Update secondary account
export const PUT = withRequestLogging(
  withRateLimit()(
    withAuth(
      withValidation(
        updateSecondaryAccountSchema
      )(
        async (req: NextRequest, { params, validated, user, organizationId }: {
          params?: { id: string };
          validated: UpdateSecondaryAccountInput;
          user: any;
          organizationId: string;
        }) => {
          try {
            const { id } = params;

            // Check if secondary account exists
            const existingAccount = await prisma.secondaryAccount.findUnique({
              where: { id },
            });

            if (!existingAccount) {
              return notFoundResponse('Secondary account not found');
            }

            // Check if code already exists for this organization (if code is being updated)
            if (validated.code && validated.code !== existingAccount.code) {
              const duplicateAccount = await prisma.secondaryAccount.findFirst({
                where: {
                  code: validated.code,
                  organizationId: existingAccount.organizationId,
                  id: { not: id },
                },
              });

              if (duplicateAccount) {
                return validationErrorResponse([{
                  field: 'code',
                  message: 'Secondary account code already exists',
                  code: 'DUPLICATE',
                }]);
              }
            }

            // Verify primary account exists and is active (if primaryAccountId is being updated)
            if (validated.primaryAccountId && validated.primaryAccountId !== existingAccount.primaryAccountId) {
              const primaryAccount = await prisma.primaryAccount.findUnique({
                where: { id: validated.primaryAccountId },
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
                  message: 'Cannot move secondary account to inactive primary account',
                  code: 'INACTIVE_PARENT',
                }]);
              }
            }

            // Update secondary account
            const updatedAccount = await prisma.secondaryAccount.update({
              where: { id },
              data: validated,
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

            return successResponse(updatedAccount, 200);
          } catch (error) {
            console.error('Error updating secondary account:', error);
            return errorResponse('Failed to update secondary account', 500);
          }
        }
      )
    )
  )
);

// DELETE /api/accounts/secondary/[id] - Delete secondary account
export const DELETE = withRequestLogging(
  withRateLimit()(
    withAuth(
      async (req: NextRequest, { params, user, organizationId }: { params?: { id: string }; user: any; organizationId: string }) => {
        try {
          const { id } = params;

          // Check if secondary account exists
          const existingAccount = await prisma.secondaryAccount.findUnique({
            where: { id },
            include: {
              holderAccounts: {
                select: { id: true, name: true },
              },
            },
          });

          if (!existingAccount) {
            return notFoundResponse('Secondary account not found');
          }

          // Check if secondary account has holder accounts
          if (existingAccount.holderAccounts.length > 0) {
            return validationErrorResponse([{
              field: 'id',
              message: 'Cannot delete secondary account with existing holder accounts',
              code: 'HAS_DEPENDENCIES',
            }]);
          }

          // Delete secondary account
          await prisma.secondaryAccount.delete({
            where: { id },
          });

          return successResponse(null, 200);
        } catch (error) {
          console.error('Error deleting secondary account:', error);
          return errorResponse('Failed to delete secondary account', 500);
        }
      }
    )
  )
);

