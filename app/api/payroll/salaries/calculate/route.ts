/**
 * Salary Calculation API Endpoint
 * 
 * Calculates salary without saving (preview mode)
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  successResponse, 
  errorResponse, 
  validationErrorResponse
} from '@/lib/api/utils/response';

// POST /api/payroll/salaries/calculate - Calculate salary (preview)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Get organization ID (for now, use default)
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7'; // SNM Analytics Demo org ID

    // Validate required fields
    if (!body.employeeId) {
      return validationErrorResponse([{
        field: 'employeeId',
        message: 'Employee ID is required',
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
    const basicSalary = body.basicSalary !== undefined ? body.basicSalary : employee.basicSalary;
    const allowances = body.allowances || 0;
    const commission = body.commission || 0;
    const grossSalary = basicSalary + allowances + commission;

    // Calculate pension deductions
    const tier1Employee = basicSalary * (Number(pensionConfig.tier1EmployeeRate) / 100);
    const tier1Employer = basicSalary * (Number(pensionConfig.tier1EmployerRate) / 100);
    const tier2 = basicSalary * (Number(pensionConfig.tier2Rate) / 100);
    const tier3Employee = pensionConfig.tier3MaxAmount 
      ? Math.min(basicSalary * (Number(pensionConfig.tier3EmployeeRate) / 100), Number(pensionConfig.tier3MaxAmount))
      : basicSalary * (Number(pensionConfig.tier3EmployeeRate) / 100);
    const tier3Employer = pensionConfig.tier3MaxAmount 
      ? Math.min(basicSalary * (Number(pensionConfig.tier3EmployerRate) / 100), Number(pensionConfig.tier3MaxAmount))
      : basicSalary * (Number(pensionConfig.tier3EmployerRate) / 100);
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

    // Return calculation breakdown
    return successResponse({
      employee: {
        id: employee.id,
        employeeId: employee.employeeId,
        fullName: `${employee.firstName} ${employee.surname}`,
        nationality: employee.nationality,
      },
      earnings: {
        basicSalary,
        allowances,
        commission,
        grossSalary,
      },
      deductions: {
        incomeTax,
        pension: {
          tier1Employee,
          tier1Employer,
          tier2,
          tier3Employee,
          tier3Employer,
          totalSSNIT,
        },
        otherDeductions,
        totalDeductions,
      },
      netSalary,
      taxableIncome,
      configurations: {
        taxConfigId: taxConfig.id,
        pensionConfigId: pensionConfig.id,
      },
    });
  } catch (error: any) {
    console.error('Error calculating salary:', error);
    return errorResponse('Failed to calculate salary: ' + error.message, 500);
  }
}
