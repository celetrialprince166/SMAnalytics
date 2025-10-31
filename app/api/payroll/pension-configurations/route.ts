/**
 * Pension Configurations API Endpoints
 * 
 * Handles CRUD operations for pension configurations
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  successResponse, 
  errorResponse, 
  validationErrorResponse
} from '@/lib/api/utils/response';

// GET /api/payroll/pension-configurations - List pension configurations
export async function GET(req: NextRequest) {
  try {
    // Get organization ID (for now, use default)
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7'; // SNM Analytics Demo org ID
    
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';

    // Build where clause
    const where: any = {
      organizationId,
    };

    if (activeOnly) {
      where.isActive = true;
    }

    // Get pension configurations
    const configs = await prisma.pensionConfiguration.findMany({
      where,
      orderBy: { effectiveDate: 'desc' },
    });

    return successResponse(configs);
  } catch (error) {
    console.error('Error fetching pension configurations:', error);
    return errorResponse('Failed to fetch pension configurations', 500);
  }
}

// POST /api/payroll/pension-configurations - Create pension configuration
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Get organization ID (for now, use default)
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7'; // SNM Analytics Demo org ID

    // Validate required fields
    if (!body.effectiveDate || 
        body.tier1EmployerRate === undefined || body.tier1EmployeeRate === undefined ||
        body.tier1PensionRate === undefined || body.tier1NHISRate === undefined ||
        body.tier2Rate === undefined || 
        body.tier3EmployerRate === undefined || body.tier3EmployeeRate === undefined) {
      return validationErrorResponse([{
        field: 'general',
        message: 'All tier rates are required',
        code: 'REQUIRED',
      }]);
    }

    // Validate rates (must be between 0 and 100)
    const rates = [
      { field: 'tier1EmployerRate', value: body.tier1EmployerRate },
      { field: 'tier1EmployeeRate', value: body.tier1EmployeeRate },
      { field: 'tier1PensionRate', value: body.tier1PensionRate },
      { field: 'tier1NHISRate', value: body.tier1NHISRate },
      { field: 'tier2Rate', value: body.tier2Rate },
      { field: 'tier3EmployerRate', value: body.tier3EmployerRate },
      { field: 'tier3EmployeeRate', value: body.tier3EmployeeRate },
    ];

    for (const rate of rates) {
      if (rate.value < 0 || rate.value > 100) {
        return validationErrorResponse([{
          field: rate.field,
          message: `${rate.field} must be between 0 and 100`,
          code: 'INVALID_VALUE',
        }]);
      }
    }

    // Validate tier 3 max amount if provided
    if (body.tier3MaxAmount !== undefined && body.tier3MaxAmount !== null && body.tier3MaxAmount < 0) {
      return validationErrorResponse([{
        field: 'tier3MaxAmount',
        message: 'Tier 3 max amount cannot be negative',
        code: 'INVALID_VALUE',
      }]);
    }

    // Create pension configuration using a transaction
    const config = await prisma.$transaction(async (tx) => {
      // Deactivate existing active configurations
      await tx.pensionConfiguration.updateMany({
        where: {
          organizationId,
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });

      // Create new configuration
      const newConfig = await tx.pensionConfiguration.create({
        data: {
          organizationId,
          effectiveDate: new Date(body.effectiveDate),
          tier1EmployerRate: body.tier1EmployerRate,
          tier1EmployeeRate: body.tier1EmployeeRate,
          tier1PensionRate: body.tier1PensionRate,
          tier1NHISRate: body.tier1NHISRate,
          tier2Rate: body.tier2Rate,
          tier3EmployerRate: body.tier3EmployerRate,
          tier3EmployeeRate: body.tier3EmployeeRate,
          tier3MaxAmount: body.tier3MaxAmount || null,
          isActive: true,
        },
      });

      return newConfig;
    });

    return successResponse(config, 201);
  } catch (error: any) {
    console.error('Error creating pension configuration:', error);
    return errorResponse('Failed to create pension configuration: ' + error.message, 500);
  }
}
