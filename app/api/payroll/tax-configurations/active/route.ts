/**
 * Active Tax Configuration API Endpoint
 * 
 * Returns the currently active tax configuration
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  successResponse, 
  errorResponse
} from '@/lib/api/utils/response';

// GET /api/payroll/tax-configurations/active - Get active tax configuration
export async function GET(req: NextRequest) {
  try {
    // Get organization ID (for now, use default)
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7'; // SNM Analytics Demo org ID

    // Get active tax configuration
    const config = await prisma.taxConfiguration.findFirst({
      where: {
        organizationId,
        isActive: true,
      },
      orderBy: {
        effectiveDate: 'desc',
      },
    });

    if (!config) {
      return errorResponse('No active tax configuration found', 404);
    }

    return successResponse(config);
  } catch (error) {
    console.error('Error fetching active tax configuration:', error);
    return errorResponse('Failed to fetch active tax configuration', 500);
  }
}
