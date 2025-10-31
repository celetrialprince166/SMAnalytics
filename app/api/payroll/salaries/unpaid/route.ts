/**
 * Unpaid Salaries API Endpoint
 * 
 * GET /api/payroll/salaries/unpaid - Get all unpaid salary entries
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api/utils/response';

export async function GET(req: NextRequest) {
  try {
    // Get organization ID (for now, use default)
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7';

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

    // Get unpaid salary entries with employee details
    const salaries = await prisma.salaryEntry.findMany({
      where,
      include: {
        employee: {
          select: {
            employeeId: true,
            firstName: true,
            surname: true,
            department: true,
          },
        },
      },
      orderBy: { salaryDate: 'desc' },
    });

    return successResponse(salaries);
  } catch (error) {
    console.error('Error fetching unpaid salaries:', error);
    return errorResponse('Failed to fetch unpaid salaries', 500);
  }
}
