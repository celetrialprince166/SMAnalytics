/**
 * Commissions API Endpoints
 * 
 * Handles commission tracking and management
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  successResponse, 
  errorResponse, 
  validationErrorResponse
} from '@/lib/api/utils/response';

// GET /api/payroll/commissions - List commissions
export async function GET(req: NextRequest) {
  try {
    // Get organization ID (for now, use default)
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7'; // SNM Analytics Demo org ID
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;
    const employeeId = searchParams.get('employeeId');
    const isPaid = searchParams.get('isPaid');

    // Build where clause
    const where: any = {
      organizationId,
    };

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (isPaid !== null && isPaid !== undefined) {
      where.isPaid = isPaid === 'true';
    }

    // Get commissions
    const commissions = await prisma.commission.findMany({
      where,
      skip,
      take: limit,
      orderBy: { commissionDate: 'desc' },
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

    // Get total count
    const total = await prisma.commission.count({ where });

    return successResponse({
      commissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching commissions:', error);
    return errorResponse('Failed to fetch commissions', 500);
  }
}

// POST /api/payroll/commissions - Create commission
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Get organization ID (for now, use default)
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7'; // SNM Analytics Demo org ID

    // Validate required fields
    if (!body.employeeId || !body.commissionDate || 
        body.amount === undefined || body.rate === undefined || 
        body.salesAmount === undefined) {
      return validationErrorResponse([{
        field: 'general',
        message: 'Employee ID, commission date, amount, rate, and sales amount are required',
        code: 'REQUIRED',
      }]);
    }

    // Validate employee exists
    const employee = await prisma.employee.findFirst({
      where: {
        id: body.employeeId,
        organizationId,
      },
    });

    if (!employee) {
      return validationErrorResponse([{
        field: 'employeeId',
        message: 'Employee not found',
        code: 'NOT_FOUND',
      }]);
    }

    // Validate amounts
    if (body.amount < 0) {
      return validationErrorResponse([{
        field: 'amount',
        message: 'Commission amount cannot be negative',
        code: 'INVALID_VALUE',
      }]);
    }

    if (body.rate < 0 || body.rate > 100) {
      return validationErrorResponse([{
        field: 'rate',
        message: 'Commission rate must be between 0 and 100',
        code: 'INVALID_VALUE',
      }]);
    }

    if (body.salesAmount < 0) {
      return validationErrorResponse([{
        field: 'salesAmount',
        message: 'Sales amount cannot be negative',
        code: 'INVALID_VALUE',
      }]);
    }

    // Create commission
    const commission = await prisma.commission.create({
      data: {
        organizationId,
        employeeId: body.employeeId,
        salesEntryId: body.salesEntryId || null,
        commissionDate: new Date(body.commissionDate),
        amount: body.amount,
        rate: body.rate,
        salesAmount: body.salesAmount,
        remarks: body.remarks || null,
        isPaid: false,
      },
    });

    return successResponse(commission, 201);
  } catch (error: any) {
    console.error('Error creating commission:', error);
    return errorResponse('Failed to create commission: ' + error.message, 500);
  }
}
