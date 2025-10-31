/**
 * Salary Processing API Endpoints
 * 
 * Handles salary processing and listing
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  successResponse, 
  errorResponse, 
  validationErrorResponse
} from '@/lib/api/utils/response';

// GET /api/payroll/salaries - List salary entries
export async function GET(req: NextRequest) {
  try {
    // Get organization ID (for now, use default)
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7'; // SNM Analytics Demo org ID
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;
    const employeeId = searchParams.get('employeeId');
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    // Build where clause
    const where: any = {
      organizationId,
    };

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (year && month) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      where.salaryDate = {
        gte: startDate,
        lte: endDate,
      };
    }

    // Get salary entries
    const salaries = await prisma.salaryEntry.findMany({
      where,
      skip,
      take: limit,
      orderBy: { salaryDate: 'desc' },
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
    const total = await prisma.salaryEntry.count({ where });

    return successResponse({
      salaries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching salary entries:', error);
    return errorResponse('Failed to fetch salary entries', 500);
  }
}

// POST /api/payroll/salaries - Process salary
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Get organization ID (for now, use default)
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7'; // SNM Analytics Demo org ID

    // Validate required fields
    if (!body.employeeId || !body.salaryDate) {
      return validationErrorResponse([{
        field: 'general',
        message: 'Employee ID and salary date are required',
        code: 'REQUIRED',
      }]);
    }

    // Get employee
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

    if (employee.status !== 'ACTIVE') {
      return validationErrorResponse([{
        field: 'employeeId',
        message: 'Cannot process salary for inactive employee',
        code: 'INVALID_STATUS',
      }]);
    }

    // Get active tax configuration
    const taxConfig = await prisma.taxConfiguration.findFirst({
      where: {
        organizationId,
        isActive: true,
      },
      orderBy: { effectiveDate: 'desc' },
    });

    if (!taxConfig) {
      return errorResponse('No active tax configuration found', 400);
    }

    // Get active pension configuration
    const pensionConfig = await prisma.pensionConfiguration.findFirst({
      where: {
        organizationId,
        isActive: true,
      },
      orderBy: { effectiveDate: 'desc' },
    });

    if (!pensionConfig) {
      return errorResponse('No active pension configuration found', 400);
    }

    // Calculate salary components
    const basicSalary = Number(employee.basicSalary);
    const allowances = body.allowances || 0;
    const commission = body.commission || 0;
    const grossSalary = basicSalary + allowances + commission;

    // Calculate pension deductions
    const tier1Employee = basicSalary * (Number(pensionConfig.tier1EmployeeRate) / 100);
    const tier2 = basicSalary * (Number(pensionConfig.tier2Rate) / 100);
    const tier3Employee = pensionConfig.tier3MaxAmount 
      ? Math.min(basicSalary * (Number(pensionConfig.tier3EmployeeRate) / 100), Number(pensionConfig.tier3MaxAmount))
      : basicSalary * (Number(pensionConfig.tier3EmployeeRate) / 100);
    const totalSSNIT = tier1Employee + tier2 + tier3Employee;

    // Calculate taxable income (gross minus SSNIT)
    const taxableIncome = grossSalary - totalSSNIT;

    // Calculate income tax using progressive brackets
    let incomeTax = 0;
    if (employee.nationality === 'GHANAIAN') {
      // Progressive tax for Ghanaians
      const brackets = taxConfig.brackets as any[];
      const sortedBrackets = brackets.sort((a, b) => a.order - b.order);
      
      let remainingIncome = taxableIncome;
      for (const bracket of sortedBrackets) {
        if (remainingIncome <= 0) break;
        
        const bracketAmount = bracket.amount === 0 ? remainingIncome : Math.min(Number(bracket.amount), remainingIncome);
        incomeTax += bracketAmount * (Number(bracket.rate) / 100);
        remainingIncome -= bracketAmount;
      }
      
      // Apply personal relief
      incomeTax = Math.max(0, incomeTax - Number(taxConfig.personalRelief));
    } else {
      // Flat rate for non-residents
      incomeTax = taxableIncome * (Number(taxConfig.nonResidentRate) / 100);
    }

    // Calculate total deductions
    const otherDeductions = body.otherDeductions || 0;
    const totalDeductions = incomeTax + totalSSNIT + otherDeductions;

    // Calculate net salary
    const netSalary = grossSalary - totalDeductions;

    // Create salary entry in a transaction
    const salaryEntry = await prisma.$transaction(async (tx) => {
      // Create salary entry
      const entry = await tx.salaryEntry.create({
        data: {
          organizationId,
          employeeId: employee.id,
          salaryDate: new Date(body.salaryDate),
          processedDate: new Date(),
          basicSalary,
          allowances,
          commission,
          grossSalary,
          incomeTax,
          tier1Employee,
          tier2,
          tier3Employee,
          totalSSNIT,
          otherDeductions,
          totalDeductions,
          netSalary,
          taxConfigId: taxConfig.id,
          pensionConfigId: pensionConfig.id,
          remarks: body.remarks || null,
          createdBy: body.createdBy || null,
        },
      });

      // TODO: Create accounting transaction
      // This would create a transaction entry linking to the accounting system
      // Debit: Salary Expense Account
      // Credit: Bank/Cash Account

      return entry;
    });

    return successResponse(salaryEntry, 201);
  } catch (error: any) {
    console.error('Error processing salary:', error);
    return errorResponse('Failed to process salary: ' + error.message, 500);
  }
}
