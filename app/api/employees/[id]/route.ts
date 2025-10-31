/**
 * Employee API Endpoints - Single Employee Operations
 * 
 * Handles GET, PUT, DELETE for individual employees
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  successResponse, 
  errorResponse, 
  validationErrorResponse
} from '@/lib/api/utils/response';

// GET /api/employees/[id] - Get employee by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get organization ID (for now, use default)
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7'; // SNM Analytics Demo org ID

    const employee = await prisma.employee.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
      include: {
        salaryEntries: {
          orderBy: { salaryDate: 'desc' },
          take: 5, // Latest 5 salary entries
        },
        commissions: {
          where: { isPaid: false },
          orderBy: { commissionDate: 'desc' },
        },
        salesRepresentatives: {
          include: {
            salesEntry: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!employee) {
      return errorResponse('Employee not found', 404);
    }

    return successResponse(employee);
  } catch (error) {
    console.error('Error fetching employee:', error);
    return errorResponse('Failed to fetch employee', 500);
  }
}

// PUT /api/employees/[id] - Update employee
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    
    // Get organization ID (for now, use default)
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7'; // SNM Analytics Demo org ID

    // Check if employee exists
    const existingEmployee = await prisma.employee.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
    });

    if (!existingEmployee) {
      return errorResponse('Employee not found', 404);
    }

    // Validate email if provided
    if (body.emailAddress) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.emailAddress)) {
        return validationErrorResponse([{
          field: 'emailAddress',
          message: 'Invalid email address format',
          code: 'INVALID_FORMAT',
        }]);
      }

      // Check for duplicate email (excluding current employee)
      const duplicateEmail = await prisma.employee.findFirst({
        where: {
          organizationId,
          emailAddress: body.emailAddress,
          isActive: true,
          id: { not: params.id },
        },
      });

      if (duplicateEmail) {
        return validationErrorResponse([{
          field: 'emailAddress',
          message: 'Email address already exists',
          code: 'DUPLICATE',
        }]);
      }
    }

    // Validate basic salary if provided
    if (body.basicSalary !== undefined && body.basicSalary < 0) {
      return validationErrorResponse([{
        field: 'basicSalary',
        message: 'Basic salary cannot be negative',
        code: 'INVALID_VALUE',
      }]);
    }

    // Prepare update data
    const updateData: any = {};
    
    // Only update fields that are provided
    if (body.entryDate !== undefined) updateData.entryDate = new Date(body.entryDate);
    if (body.status !== undefined) updateData.status = body.status;
    if (body.surname !== undefined) updateData.surname = body.surname.trim();
    if (body.firstName !== undefined) updateData.firstName = body.firstName.trim();
    if (body.otherNames !== undefined) updateData.otherNames = body.otherNames?.trim() || null;
    if (body.dateOfBirth !== undefined) updateData.dateOfBirth = new Date(body.dateOfBirth);
    if (body.placeOfBirth !== undefined) updateData.placeOfBirth = body.placeOfBirth?.trim() || null;
    if (body.nationality !== undefined) updateData.nationality = body.nationality;
    if (body.gender !== undefined) updateData.gender = body.gender;
    if (body.maritalStatus !== undefined) updateData.maritalStatus = body.maritalStatus;
    if (body.numberOfChildren !== undefined) updateData.numberOfChildren = body.numberOfChildren;
    if (body.residentialAddress !== undefined) updateData.residentialAddress = body.residentialAddress?.trim() || null;
    if (body.emailAddress !== undefined) updateData.emailAddress = body.emailAddress.trim().toLowerCase();
    if (body.phoneNumber !== undefined) updateData.phoneNumber = body.phoneNumber.trim();
    if (body.position !== undefined) updateData.position = body.position?.trim() || null;
    if (body.department !== undefined) updateData.department = body.department?.trim() || null;
    if (body.basicSalary !== undefined) updateData.basicSalary = body.basicSalary;
    if (body.supervisor !== undefined) updateData.supervisor = body.supervisor?.trim() || null;
    if (body.entryLevel !== undefined) updateData.entryLevel = body.entryLevel?.trim() || null;
    if (body.currentLevel !== undefined) updateData.currentLevel = body.currentLevel?.trim() || null;
    if (body.entryBasicSalary !== undefined) updateData.entryBasicSalary = body.entryBasicSalary;
    if (body.holdingBank !== undefined) updateData.holdingBank = body.holdingBank?.trim() || null;
    if (body.bankBranch !== undefined) updateData.bankBranch = body.bankBranch?.trim() || null;
    if (body.bankAccountNo !== undefined) updateData.bankAccountNo = body.bankAccountNo?.trim() || null;
    if (body.taxNumber !== undefined) updateData.taxNumber = body.taxNumber?.trim() || null;
    if (body.ssnitNumber !== undefined) updateData.ssnitNumber = body.ssnitNumber?.trim() || null;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    // Update employee
    const employee = await prisma.employee.update({
      where: {
        id: params.id,
      },
      data: updateData,
    });

    return successResponse(employee);
  } catch (error: any) {
    console.error('Error updating employee:', error);
    return errorResponse('Failed to update employee: ' + error.message, 500);
  }
}

// DELETE /api/employees/[id] - Soft delete employee
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get organization ID (for now, use default)
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7'; // SNM Analytics Demo org ID

    // Check if employee exists
    const existingEmployee = await prisma.employee.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
    });

    if (!existingEmployee) {
      return errorResponse('Employee not found', 404);
    }

    // Check if employee has salary entries
    const salaryCount = await prisma.salaryEntry.count({
      where: { employeeId: params.id },
    });

    if (salaryCount > 0) {
      // Soft delete - just mark as inactive
      await prisma.employee.update({
        where: { id: params.id },
        data: { 
          isActive: false,
          status: 'TERMINATED',
        },
      });

      return successResponse({ 
        message: 'Employee deactivated (has salary history)',
        softDelete: true,
      });
    } else {
      // Hard delete if no salary history
      await prisma.employee.delete({
        where: { id: params.id },
      });

      return successResponse({ 
        message: 'Employee deleted',
        softDelete: false,
      });
    }
  } catch (error: any) {
    console.error('Error deleting employee:', error);
    return errorResponse('Failed to delete employee: ' + error.message, 500);
  }
}
