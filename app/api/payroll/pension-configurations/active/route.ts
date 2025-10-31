/**
 * Active Pension Configuration API Endpoint
 * 
 * Returns the currently active pension configuration
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  successResponse, 
  errorResponse
} from '@/lib/api/utils/response';

// GET /api/payroll/pension-configurations/active - Get active pension configuration
export async function GET(req: NextRequest) {
  try {
    // Get organization ID (for now, use default)
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7'; // SNM Analytics Demo org ID

    // Get active pension configuration
    const config = await prisma.pensionConfiguration.findFirst({
      where: {
        organizationId,
        isActive: true,
      },
      orderBy: {
        effectiveDate: 'desc',
      },
    });

    if (!config) {
      return errorResponse('No active pension configuration found', 404);
    }

    return successResponse(config);
  } catch (error) {
    console.error('Error fetching active pension configuration:', error);
    return errorResponse('Failed to fetch active pension configuration', 500);
  }
}
