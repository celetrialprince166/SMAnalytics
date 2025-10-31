/**
 * Split Transaction Accounts API Endpoint
 *
 * GET /api/transactions/split/accounts - Get available accounts for dropdowns
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api/utils/response';

export async function GET(req: NextRequest) {
  try {
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7';

    // Get primary accounts
    const primaryAccounts = await prisma.primaryAccount.findMany({
      where: { organizationId, isActive: true },
      select: { id: true, name: true, type: true },
      orderBy: { name: 'asc' },
    });

    // Get secondary accounts
    const secondaryAccounts = await prisma.secondaryAccount.findMany({
      where: { organizationId, isActive: true },
      include: {
        primaryAccount: {
          select: { id: true, name: true, type: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Get holder accounts
    const holderAccounts = await prisma.holderAccount.findMany({
      where: { organizationId, isActive: true },
      include: {
        secondaryAccount: {
          select: {
            id: true,
            name: true,
            code: true,
            primaryAccount: {
              select: { id: true, name: true, type: true },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return successResponse({
      primaryAccounts,
      secondaryAccounts,
      holderAccounts,
    });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return errorResponse('Failed to fetch accounts', 500);
  }
}








