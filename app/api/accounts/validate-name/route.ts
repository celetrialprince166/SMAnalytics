/**
 * Account Name Validation API Endpoint
 * 
 * POST /api/accounts/validate-name - Check if account name is available
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api/utils/response';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, secondaryAccountId, excludeAccountId } = body;

    // Validate required fields with specific messages
    if (!name || !name.trim()) {
      return errorResponse('Account name is required', 400);
    }
    
    if (!secondaryAccountId) {
      return errorResponse('Please select a secondary account first', 400);
    }

    // Get secondary account info for better error messages
    const secondaryAccount = await prisma.secondaryAccount.findUnique({
      where: { id: secondaryAccountId },
      select: { name: true, code: true },
    });

    if (!secondaryAccount) {
      return errorResponse('Selected secondary account not found', 404);
    }

    // Check if name already exists under the same secondary account
    const whereClause: any = {
      secondaryAccountId,
      name: name.trim(),
      isActive: true,
    };

    // Exclude current account if updating
    if (excludeAccountId) {
      whereClause.id = { not: excludeAccountId };
    }

    const existingAccount = await prisma.holderAccount.findFirst({
      where: whereClause,
      select: { id: true, name: true },
    });

    if (existingAccount) {
      return errorResponse(
        `"${name.trim()}" is already used by another account under ${secondaryAccount.name}. Please choose a different name.`, 
        400
      );
    }

    return successResponse({ 
      available: true, 
      message: `"${name.trim()}" is available under ${secondaryAccount.name}` 
    });

  } catch (error) {
    console.error('Error validating account name:', error);
    return errorResponse('Unable to validate account name. Please try again.', 500);
  }
}

