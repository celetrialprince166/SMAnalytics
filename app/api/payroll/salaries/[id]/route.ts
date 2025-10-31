/**
 * Salary Entry API Endpoints - Single Entry Operations
 * 
 * Handles GET for individual salary entries
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  successResponse, 
  errorResponse
} from '@/lib/api/utils/response';

// GET /api/payroll/salaries/[id] - Get salary entry by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get organization ID (for now, use default)
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7'; // SNM Analytics Demo org ID

    const salaryEntry = await prisma.salaryEntry.findFirst({
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
            otherNames: true,
            department: true,
            position: true,
            emailAddress: true,
            phoneNumber: true,
            nationality: true,
            gender: true,
            maritalStatus: true,
          },
        },
      },
    });

    if (!salaryEntry) {
      return errorResponse('Salary entry not found', 404);
    }

    return successResponse(salaryEntry);
  } catch (error) {
    console.error('Error fetching salary entry:', error);
    return errorResponse('Failed to fetch salary entry', 500);
  }
}
