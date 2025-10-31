/**
 * Petty Cash Account API Endpoint
 * 
 * Find and return the petty cash holder account
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api/utils/response';

export async function GET(req: NextRequest) {
  try {
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7';

    // Find holder account with "petty cash" in the name (case insensitive)
    const pettyCashAccount = await prisma.holderAccount.findFirst({
      where: {
        organizationId,
        isActive: true,
        name: {
          contains: 'petty cash',
          mode: 'insensitive',
        },
      },
      include: {
        secondaryAccount: {
          include: {
            primaryAccount: true,
          },
        },
      },
    });

    if (!pettyCashAccount) {
      return errorResponse('Petty cash account not found. Please create a holder account with "Petty Cash" in the name.', 404);
    }

    return successResponse(pettyCashAccount);
  } catch (error) {
    console.error('Error fetching petty cash account:', error);
    return errorResponse('Failed to fetch petty cash account', 500);
  }
}


