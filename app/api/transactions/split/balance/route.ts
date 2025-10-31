/**
 * Split Transaction Balance API Endpoint
 *
 * GET /api/transactions/split/balance?accountId=xxx - Get account balance and details
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  notFoundResponse
} from '@/lib/api/utils/response';

const getAccountBalanceSchema = z.object({
  accountId: z.string().uuid('Invalid account ID'),
});

type GetAccountBalanceInput = z.infer<typeof getAccountBalanceSchema>;

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const accountId = url.searchParams.get('accountId');

    if (!accountId) {
      return validationErrorResponse([{
        field: 'accountId',
        message: 'Account ID is required',
        code: 'REQUIRED',
      }]);
    }

    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7';

    const account = await prisma.holderAccount.findFirst({
      where: {
        id: accountId,
        organizationId,
        isActive: true,
      },
      include: {
        secondaryAccount: {
          select: {
            id: true,
            name: true,
            code: true,
            primaryAccount: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
      },
    });

    if (!account) {
      return notFoundResponse('Account not found');
    }

    return successResponse({
      id: account.id,
      name: account.name,
      code: account.code,
      balance: account.balance,
      primaryAccount: account.secondaryAccount?.primaryAccount,
      secondaryAccount: account.secondaryAccount,
    });
  } catch (error) {
    console.error('Error fetching account balance:', error);
    return errorResponse('Failed to fetch account balance', 500);
  }
}








