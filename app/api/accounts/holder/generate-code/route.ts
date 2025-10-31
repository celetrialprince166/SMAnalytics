/**
 * Generate Holder Account Code API
 * 
 * Generates the next available code for a holder account
 */

import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api/utils/response';
import { prisma } from '@/lib/prisma';

// GET /api/accounts/holder/generate-code?secondaryAccountId=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const secondaryAccountId = searchParams.get('secondaryAccountId');

    if (!secondaryAccountId) {
      return errorResponse('secondaryAccountId is required', 400);
    }

    // Get the secondary account to get its code
    const secondaryAccount = await prisma.secondaryAccount.findUnique({
      where: { id: secondaryAccountId },
      select: { code: true },
    });

    if (!secondaryAccount) {
      return errorResponse('Secondary account not found', 404);
    }

    // Get the count of existing holder accounts for this secondary account
    const count = await prisma.holderAccount.count({
      where: { secondaryAccountId },
    });

    // Generate the next code (e.g., if secondary code is "01-01", generate "01-01-001")
    const nextNumber = String(count + 1).padStart(3, '0');
    const code = `${secondaryAccount.code}-${nextNumber}`;

    return successResponse({ code });
  } catch (error: any) {
    console.error('Error generating holder account code:', error);
    return errorResponse('Failed to generate account code', 500);
  }
}


