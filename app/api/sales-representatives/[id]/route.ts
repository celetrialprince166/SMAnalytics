import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateSalesRepresentativeSchema } from '@/lib/validation/salesRepresentativeValidation';

// Helper functions for responses
function successResponse(data: any, status = 200) {
  return Response.json({ success: true, data }, { status });
}

function errorResponse(error: string, status = 500) {
  return Response.json({ success: false, error }, { status });
}

function notFoundResponse(message: string) {
  return Response.json({ success: false, error: message }, { status: 404 });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rep = await prisma.salesRepresentative.findUnique({
      where: { id: params.id },
      include: { employee: true, salesEntry: true },
    });

    if (!rep) {
      return notFoundResponse('Sales representative not found');
    }

    return successResponse(rep);
  } catch (error) {
    console.error('Error fetching representative:', error);
    return errorResponse('Failed to fetch representative', 500);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const validation = updateSalesRepresentativeSchema.safeParse(body);
    
    if (!validation.success) {
      return errorResponse('Invalid data', 400);
    }

    const existing = await prisma.salesRepresentative.findUnique({
      where: { id: params.id },
      include: { salesEntry: true },
    });

    if (!existing) {
      return notFoundResponse('Representative not found');
    }

    const data = validation.data;
    const salesStake = data.salesStake ?? Number(existing.salesStake);
    const commissionRate = data.commissionRate ?? Number(existing.commissionRate);
    const relevantSales = Number(existing.salesEntry.salesValue) * (salesStake / 100);
    const commissionAmount = relevantSales * (commissionRate / 100);

    const updated = await prisma.salesRepresentative.update({
      where: { id: params.id },
      data: {
        ...data,
        salesStake,
        relevantSales,
        commissionRate,
        commissionAmount,
        updatedAt: new Date(),
      },
      include: { employee: true, salesEntry: true },
    });

    // Update commission if exists and unpaid
    await prisma.commission.updateMany({
      where: {
        employeeId: existing.employeeId,
        salesEntryId: existing.salesEntryId,
        isPaid: false,
      },
      data: {
        amount: commissionAmount,
        rate: commissionRate,
        salesAmount: relevantSales,
      },
    });

    return successResponse(updated);
  } catch (error: any) {
    console.error('Error updating representative:', error);
    return errorResponse('Failed to update: ' + error.message, 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await prisma.salesRepresentative.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return notFoundResponse('Representative not found');
    }

    // Delete unpaid commissions
    await prisma.commission.deleteMany({
      where: {
        employeeId: existing.employeeId,
        salesEntryId: existing.salesEntryId,
        isPaid: false,
      },
    });

    await prisma.salesRepresentative.delete({
      where: { id: params.id },
    });

    return successResponse({ message: 'Deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting representative:', error);
    return errorResponse('Failed to delete: ' + error.message, 500);
  }
}
