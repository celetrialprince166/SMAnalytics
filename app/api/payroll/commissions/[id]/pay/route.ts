/**
 * Commission Payment API Endpoint
 * 
 * Marks a commission as paid
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  successResponse, 
  errorResponse, 
  validationErrorResponse
} from '@/lib/api/utils/response';

// PUT /api/payroll/commissions/[id]/pay - Mark commission as paid
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    
    // Get organization ID (for now, use default)
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7'; // SNM Analytics Demo org ID

    // Check if commission exists
    const existingCommission = await prisma.commission.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
    });

    if (!existingCommission) {
      return errorResponse('Commission not found', 404);
    }

    if (existingCommission.isPaid) {
      return validationErrorResponse([{
        field: 'general',
        message: 'Commission is already marked as paid',
        code: 'ALREADY_PAID',
      }]);
    }

    // Mark commission as paid
    // Note: paymentMethod and paymentReference can be added to schema later
    const commission = await prisma.commission.update({
      where: {
        id: params.id,
      },
      data: {
        isPaid: true,
        paidDate: new Date(),
        salaryEntryId: body.salaryEntryId || null,
        // paymentMethod: body.paymentMethod || null, // TODO: Add to schema
        // paymentReference: body.paymentReference || null, // TODO: Add to schema
      },
    });

    return successResponse(commission);
  } catch (error: any) {
    console.error('Error marking commission as paid:', error);
    return errorResponse('Failed to mark commission as paid: ' + error.message, 500);
  }
}
