import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { successResponse, errorResponse } from '@/lib/api/utils/response';

export async function GET(req: NextRequest) {
  try {
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7'; // Default org for testing
    
    const nonCurrentAssetAccounts = await prisma.secondaryAccount.findMany({
      where: { 
        organizationId,
        isActive: true,
        primaryAccount: {
          type: 'ASSETS',
          name: 'Non-current Assets'
        }
      },
      select: {
        id: true,
        name: true,
        code: true,
      },
      orderBy: { code: 'asc' },
    });

    return successResponse(nonCurrentAssetAccounts);
  } catch (error) {
    console.error('Error fetching non-current asset categories:', error);
    return errorResponse('Failed to fetch non-current asset categories', 500);
  }
}
