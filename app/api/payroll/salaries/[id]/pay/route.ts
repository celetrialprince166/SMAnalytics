/**
 * Pay Salary API Endpoint
 * 
 * POST /api/payroll/salaries/[id]/pay - Mark salary as paid
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, notFoundResponse } from '@/lib/api/utils/response';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();

    // Get organization ID (for now, use default)
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7';

    // Check if salary entry exists
    const salaryEntry = await prisma.salaryEntry.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!salaryEntry) {
      return notFoundResponse('Salary entry');
    }

    // Check if already paid
    if (salaryEntry.isPaid) {
      return errorResponse('Salary entry is already marked as paid', 400);
    }

    // Update salary entry
    const updatedSalary = await prisma.salaryEntry.update({
      where: { id },
      data: {
        isPaid: true,
        paidDate: new Date(),
        paymentMethod: body.paymentMethod || 'BANK_TRANSFER',
        paymentReference: body.paymentReference || null,
        updatedAt: new Date(),
      },
      include: {
        employee: {
          select: {
            employeeId: true,
            firstName: true,
            surname: true,
          },
        },
      },
    });

    return successResponse(updatedSalary);
  } catch (error: any) {
    console.error('Error marking salary as paid:', error);
    return errorResponse('Failed to mark salary as paid: ' + error.message, 500);
  }
}
