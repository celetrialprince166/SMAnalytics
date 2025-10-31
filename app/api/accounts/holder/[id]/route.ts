/**
 * Holder Account by ID API Endpoints
 * 
 * Handles individual holder account operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateHolderAccountSchema, UpdateHolderAccountInput } from '@/lib/validation/schemas';
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

// GET /api/accounts/holder/[id] - Get holder account by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const holderAccount = await prisma.holderAccount.findUnique({
      where: { id },
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

    if (!holderAccount) {
      return notFoundResponse('Holder account not found');
    }

    return successResponse(holderAccount);
  } catch (error) {
    console.error('Error fetching holder account:', error);
    return errorResponse('Failed to fetch holder account', 500);
  }
}

// PUT /api/accounts/holder/[id] - Update holder account
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();

    // Check if holder account exists
    const existingAccount = await prisma.holderAccount.findUnique({
      where: { id },
    });

    if (!existingAccount) {
      return notFoundResponse('Holder account not found');
    }

    // Validate required fields
    if (!body.name) {
      return errorResponse('Name is required', 400);
    }

    // Check if name already exists under the same secondary account (excluding current account)
    const targetSecondaryAccountId = body.secondaryAccountId || existingAccount.secondaryAccountId;
    const existingNameAccount = await prisma.holderAccount.findFirst({
      where: {
        secondaryAccountId: targetSecondaryAccountId,
        name: body.name,
        isActive: true,
        id: { not: id }, // Exclude current account from check
      },
    });

    if (existingNameAccount) {
      return validationErrorResponse([{
        field: 'name',
        message: 'An account with this name already exists under the selected secondary account',
        code: 'DUPLICATE_NAME',
      }]);
    }

    // Prepare update data - only update fields that are provided
    let updateData: any = {
      name: body.name,
      description: body.description !== undefined ? body.description : existingAccount.description,
    };

    // Only regenerate code if secondary account is explicitly being changed
    // This prevents accidental code regeneration during simple name/description updates
    if (body.secondaryAccountId && body.secondaryAccountId !== existingAccount.secondaryAccountId) {
      // Get the new secondary account to generate new code
      const newSecondaryAccount = await prisma.secondaryAccount.findUnique({
        where: { id: body.secondaryAccountId },
        select: { code: true, isActive: true },
      });

      if (!newSecondaryAccount) {
        return errorResponse('New secondary account not found', 404);
      }

      if (!newSecondaryAccount.isActive) {
        return errorResponse('Cannot move account to inactive secondary account', 400);
      }

      // Count existing holder accounts under the new secondary account
      const count = await prisma.holderAccount.count({
        where: { secondaryAccountId: body.secondaryAccountId },
      });

      const nextNumber = String(count + 1).padStart(3, '0');
      const newCode = `${newSecondaryAccount.code}-${nextNumber}`;

      updateData.secondaryAccountId = body.secondaryAccountId;
      updateData.code = newCode;
    }

    // Update holder account
    const updatedAccount = await prisma.holderAccount.update({
      where: { id },
      data: updateData,
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

    return successResponse(updatedAccount);
  } catch (error: any) {
    console.error('Error updating holder account:', error);
    return errorResponse('Failed to update holder account: ' + error.message, 500);
  }
}

// DELETE /api/accounts/holder/[id] - Delete holder account
export const DELETE = withRequestLogging(
  withRateLimit()(
    withAuth(
      async (req: NextRequest, context: { params?: { id: string }; user: any; organizationId: string }) => {
        try {
          const id = context.params?.id;
          if (!id) {
            return errorResponse('Account ID not found in URL', 400);
          }

          // Check if holder account exists
          const existingAccount = await prisma.holderAccount.findUnique({
            where: { id },
          });

          if (!existingAccount) {
            return notFoundResponse('Holder account not found');
          }

          // Check if account has transactions
          const transactions = await prisma.transaction.findMany({
            where: {
              OR: [
                { debitAccountId: id },
                { creditAccountId: id },
              ],
            },
          });

          if (transactions.length > 0) {
            return validationErrorResponse([{
              field: 'id',
              message: `Cannot delete account with existing transactions. This account has ${transactions.length} transaction(s).`,
              code: 'HAS_TRANSACTIONS',
            }]);
          }

          // Check if account has non-zero balance
          if (existingAccount.balance.toNumber() !== 0) {
            return validationErrorResponse([{
              field: 'id',
              message: `Cannot delete account with non-zero balance. Current balance: ${existingAccount.balance}`,
              code: 'NON_ZERO_BALANCE',
            }]);
          }

          // Delete holder account
          await prisma.holderAccount.delete({
            where: { id },
          });

          return successResponse({ message: 'Holder account deleted successfully' });
        } catch (error) {
          console.error('Error deleting holder account:', error);
          return errorResponse('Failed to delete holder account', 500);
        }
      }
    )
  )
);


