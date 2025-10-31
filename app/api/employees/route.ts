/**
 * Employees API Endpoints
 * 
 * Handles CRUD operations for employees
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  successResponse, 
  errorResponse, 
  validationErrorResponse
} from '@/lib/api/utils/response';

// GET /api/employees - List employees
export async function GET(req: NextRequest) {
  try {
    // Get organization ID (for now, use default)
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7'; // SNM Analytics Demo org ID
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const skip = (page - 1) * limit;
    const status = searchParams.get('status');
    const department = searchParams.get('department');
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {
      organizationId,
    };

    if (status) {
      where.status = status;
    }

    if (department) {
      where.department = department;
    }

    if (search) {
      where.OR = [
        { employeeId: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { surname: { contains: search, mode: 'insensitive' } },
        { emailAddress: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search } },
      ];
    }

    // Get employees
    const employees = await prisma.employee.findMany({
      where,
      skip,
      take: limit,
      orderBy: { employeeId: 'asc' },
    });

    // Get total count for pagination
    const total = await prisma.employee.count({ where });

    // Return employees array directly in data field
    return successResponse(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    return errorResponse('Failed to fetch employees', 500);
  }
}

// POST /api/employees - Create employee
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Get organization ID (for now, use default)
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7'; // SNM Analytics Demo org ID

    // Validate required fields
    if (!body.surname || !body.firstName || !body.dateOfBirth || 
        !body.emailAddress || !body.phoneNumber || !body.entryDate ||
        body.basicSalary === undefined || !body.status || !body.nationality ||
        !body.gender || !body.maritalStatus) {
      return validationErrorResponse([{
        field: 'general',
        message: 'Surname, first name, date of birth, email, phone, entry date, basic salary, status, nationality, gender, and marital status are required',
        code: 'REQUIRED',
      }]);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.emailAddress)) {
      return validationErrorResponse([{
        field: 'emailAddress',
        message: 'Invalid email address format',
        code: 'INVALID_FORMAT',
      }]);
    }

    // Validate basic salary
    if (body.basicSalary < 0) {
      return validationErrorResponse([{
        field: 'basicSalary',
        message: 'Basic salary cannot be negative',
        code: 'INVALID_VALUE',
      }]);
    }

    // Check for duplicate email
    const existingEmail = await prisma.employee.findFirst({
      where: {
        organizationId,
        emailAddress: body.emailAddress,
        isActive: true,
      },
    });

    if (existingEmail) {
      return validationErrorResponse([{
        field: 'emailAddress',
        message: 'Email address already exists',
        code: 'DUPLICATE',
      }]);
    }

    // Create employee using a transaction
    const employee = await prisma.$transaction(async (tx) => {
      // Generate unique employee ID atomically
      const existingEmployees = await tx.employee.findMany({
        where: { organizationId },
        select: { employeeId: true },
        orderBy: { employeeId: 'desc' },
      });

      const maxNumber = existingEmployees.reduce((max, emp) => {
        const match = emp.employeeId.match(/EMP-(\d+)/);
        if (match) {
          const num = parseInt(match[1]);
          return num > max ? num : max;
        }
        return max;
      }, 0);

      const employeeId = `EMP-${String(maxNumber + 1).padStart(4, '0')}`;

      // Create employee record
      const newEmployee = await tx.employee.create({
        data: {
          organizationId,
          employeeId,
          entryDate: new Date(body.entryDate),
          status: body.status,
          surname: body.surname.trim(),
          firstName: body.firstName.trim(),
          otherNames: body.otherNames?.trim() || null,
          dateOfBirth: new Date(body.dateOfBirth),
          placeOfBirth: body.placeOfBirth?.trim() || null,
          nationality: body.nationality,
          gender: body.gender,
          maritalStatus: body.maritalStatus,
          numberOfChildren: body.numberOfChildren || 0,
          residentialAddress: body.residentialAddress?.trim() || null,
          emailAddress: body.emailAddress.trim().toLowerCase(),
          phoneNumber: body.phoneNumber.trim(),
          position: body.position?.trim() || null,
          department: body.department?.trim() || null,
          basicSalary: body.basicSalary,
          supervisor: body.supervisor?.trim() || null,
          entryLevel: body.entryLevel?.trim() || null,
          currentLevel: body.currentLevel?.trim() || null,
          entryBasicSalary: body.entryBasicSalary || null,
          holdingBank: body.holdingBank?.trim() || null,
          bankBranch: body.bankBranch?.trim() || null,
          bankAccountNo: body.bankAccountNo?.trim() || null,
          taxNumber: body.taxNumber?.trim() || null,
          ssnitNumber: body.ssnitNumber?.trim() || null,
          isActive: true,
          createdBy: body.createdBy || null,
        },
      });

      return newEmployee;
    });

    return successResponse(employee, 201);
  } catch (error: any) {
    console.error('Error creating employee:', error);
    return errorResponse('Failed to create employee: ' + error.message, 500);
  }
}
