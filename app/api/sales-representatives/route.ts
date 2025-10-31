import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSalesRepresentativeSchema } from '@/lib/validation/salesRepresentativeValidation';

const ORG_ID = '7224ab64-5bd7-4382-839d-6c415d872ba7';

// Helper functions for responses
function successResponse(data: any, status = 200) {
  return Response.json({ success: true, data }, { status });
}

function errorResponse(error: string, status = 500) {
  return Response.json({ success: false, error }, { status });
}

function validationErrorResponse(errors: any[]) {
  return Response.json({ success: false, errors }, { status: 400 });
}

function createdResponse(data: any) {
  return Response.json({ success: true, data }, { status: 201 });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const salesEntryId = searchParams.get('salesEntryId');
    const employeeId = searchParams.get('employeeId');

    const where: any = { organizationId: ORG_ID };
    if (salesEntryId) where.salesEntryId = salesEntryId;
    if (employeeId) where.employeeId = employeeId;

    const reps = await prisma.salesRepresentative.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            surname: true,
            department: true,
            position: true,
            status: true,
          },
        },
        salesEntry: {
          select: {
            id: true,
            salesCode: true,
            salesValue: true,
            date: true,
            description: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(reps);
  } catch (error) {
    console.error('Error fetching sales representatives:', error);
    return errorResponse('Failed to fetch sales representatives', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate with Zod
    const validation = createSalesRepresentativeSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(
        validation.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: 'INVALID',
        }))
      );
    }

    const data = validation.data;

    // Check sales entry exists
    const salesEntry = await prisma.salesEntry.findUnique({
      where: { id: data.salesEntryId },
    });
    if (!salesEntry) {
      return validationErrorResponse([{
        field: 'salesEntryId',
        message: 'Sales entry not found',
        code: 'NOT_FOUND',
      }]);
    }

    // Check employee exists and is active
    const employee = await prisma.employee.findUnique({
      where: { id: data.employeeId },
    });
    if (!employee) {
      return validationErrorResponse([{
        field: 'employeeId',
        message: 'Employee not found',
        code: 'NOT_FOUND',
      }]);
    }
    if (employee.status !== 'ACTIVE') {
      return validationErrorResponse([{
        field: 'employeeId',
        message: 'Employee must be active',
        code: 'INVALID',
      }]);
    }

    // Check for duplicate
    const existing = await prisma.salesRepresentative.findFirst({
      where: {
        salesEntryId: data.salesEntryId,
        employeeId: data.employeeId,
      },
    });
    if (existing) {
      return validationErrorResponse([{
        field: 'employeeId',
        message: 'Employee already assigned to this sales entry',
        code: 'DUPLICATE',
      }]);
    }

    // Calculate amounts
    const relevantSales = Number(salesEntry.salesValue) * (data.salesStake / 100);
    const commissionAmount = relevantSales * (data.commissionRate / 100);

    // Create representative
    const rep = await prisma.salesRepresentative.create({
      data: {
        organizationId: ORG_ID,
        salesEntryId: data.salesEntryId,
        employeeId: data.employeeId,
        resourceType: data.resourceType,
        salesStake: data.salesStake,
        relevantSales,
        salesTarget: data.salesTarget,
        commissionRate: data.commissionRate,
        commissionAmount,
        status: data.status || 'ACTIVE',
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            surname: true,
          },
        },
      },
    });

    // Auto-create commission
    await prisma.commission.create({
      data: {
        organizationId: ORG_ID,
        employeeId: data.employeeId,
        salesEntryId: data.salesEntryId,
        commissionDate: salesEntry.date,
        amount: commissionAmount,
        rate: data.commissionRate,
        salesAmount: relevantSales,
        remarks: `${data.resourceType} resource - ${salesEntry.salesCode}`,
        isPaid: false,
      },
    });

    return createdResponse(rep);
  } catch (error: any) {
    console.error('Error creating sales representative:', error);
    return errorResponse('Failed to create: ' + error.message, 500);
  }
}
