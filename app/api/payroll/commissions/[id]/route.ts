/**
 * Commission API Endpoints - Single Commission Operations
 * 
 * Handles GET for individual commissions
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  successResponse, 
  errorResponse
} from '@/lib/api/utils/response';

// GET /api/payroll/commissions/[id] - Get commission by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get organization ID (for now, use default)
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7'; // SNM Analytics Demo org ID

    const commission = await prisma.commission.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
      include: {
        employee: {
          select: {
            employeeId: true,
            firstName: true,
            surname: true,
            department: true,
            position: true,
            emailAddress: true,
          },
        },
      },
    });

    if (!commission) {
      return errorResponse('Commission not found', 404);
    }

    return successResponse(commission);
  } catch (error) {
    console.error('Error fetching commission:', error);
    return errorResponse('Failed to fetch commission', 500);
  }
}
