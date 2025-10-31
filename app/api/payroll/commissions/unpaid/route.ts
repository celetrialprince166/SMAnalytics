/**
 * Unpaid Commissions API Endpoint
 * 
 * Returns all unpaid commissions
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  successResponse, 
  errorResponse
} from '@/lib/api/utils/response';

// GET /api/payroll/commissions/unpaid - Get unpaid commissions
export async function GET(req: NextRequest) {
  try {
    // Get organization ID (for now, use default)
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7'; // SNM Analytics Demo org ID
    
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId');

    // Build where clause
    const where: any = {
      organizationId,
      isPaid: false,
    };

    if (employeeId) {
      where.employeeId = employeeId;
    }

    // Get unpaid commissions
    const commissions = await prisma.commission.findMany({
      where,
      orderBy: { commissionDate: 'asc' },
      include: {
        employee: {
          select: {
            employeeId: true,
            firstName: true,
            surname: true,
            department: true,
            position: true,
          },
        },
      },
    });

    // Calculate total unpaid amount
    const totalUnpaid = commissions.reduce((sum, c) => sum + Number(c.amount), 0);

    return successResponse({
      commissions,
      summary: {
        count: commissions.length,
        totalAmount: totalUnpaid,
      },
    });
  } catch (error) {
    console.error('Error fetching unpaid commissions:', error);
    return errorResponse('Failed to fetch unpaid commissions', 500);
  }
}
