/**
 * Pension Configuration API Endpoints - Single Configuration Operations
 * 
 * Handles GET, PUT, DELETE for individual pension configurations
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  successResponse, 
  errorResponse, 
  validationErrorResponse
} from '@/lib/api/utils/response';

// GET /api/payroll/pension-configurations/[id] - Get pension configuration by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get organization ID (for now, use default)
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7'; // SNM Analytics Demo org ID

    const config = await prisma.pensionConfiguration.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
    });

    if (!config) {
      return errorResponse('Pension configuration not found', 404);
    }

    return successResponse(config);
  } catch (error) {
    console.error('Error fetching pension configuration:', error);
    return errorResponse('Failed to fetch pension configuration', 500);
  }
}

// PUT /api/payroll/pension-configurations/[id] - Update pension configuration
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    
    // Get organization ID (for now, use default)
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7'; // SNM Analytics Demo org ID

    // Check if configuration exists
    const existingConfig = await prisma.pensionConfiguration.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
    });

    if (!existingConfig) {
      return errorResponse('Pension configuration not found', 404);
    }

    // Prepare update data
    const updateData: any = {};
    
    if (body.effectiveDate !== undefined) {
      updateData.effectiveDate = new Date(body.effectiveDate);
    }
    
    // Validate and update rates
    const rateFields = [
      'tier1EmployerRate', 'tier1EmployeeRate', 'tier1PensionRate', 'tier1NHISRate',
      'tier2Rate', 'tier3EmployerRate', 'tier3EmployeeRate'
    ];

    for (const field of rateFields) {
      if (body[field] !== undefined) {
        if (body[field] < 0 || body[field] > 100) {
          return validationErrorResponse([{
            field,
            message: `${field} must be between 0 and 100`,
            code: 'INVALID_VALUE',
          }]);
        }
        updateData[field] = body[field];
      }
    }
    
    if (body.tier3MaxAmount !== undefined) {
      if (body.tier3MaxAmount !== null && body.tier3MaxAmount < 0) {
        return validationErrorResponse([{
          field: 'tier3MaxAmount',
          message: 'Tier 3 max amount cannot be negative',
          code: 'INVALID_VALUE',
        }]);
      }
      updateData.tier3MaxAmount = body.tier3MaxAmount;
    }
    
    if (body.isActive !== undefined) {
      updateData.isActive = body.isActive;
    }

    // Update configuration
    const config = await prisma.pensionConfiguration.update({
      where: {
        id: params.id,
      },
      data: updateData,
    });

    return successResponse(config);
  } catch (error: any) {
    console.error('Error updating pension configuration:', error);
    return errorResponse('Failed to update pension configuration: ' + error.message, 500);
  }
}

// DELETE /api/payroll/pension-configurations/[id] - Delete pension configuration
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get organization ID (for now, use default)
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7'; // SNM Analytics Demo org ID

    // Check if configuration exists
    const existingConfig = await prisma.pensionConfiguration.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
    });

    if (!existingConfig) {
      return errorResponse('Pension configuration not found', 404);
    }

    // Check if configuration is being used
    const salaryCount = await prisma.salaryEntry.count({
      where: { pensionConfigId: params.id },
    });

    if (salaryCount > 0) {
      return errorResponse(
        'Cannot delete pension configuration that is being used in salary entries',
        400
      );
    }

    // Delete configuration
    await prisma.pensionConfiguration.delete({
      where: { id: params.id },
    });

    return successResponse({ message: 'Pension configuration deleted' });
  } catch (error: any) {
    console.error('Error deleting pension configuration:', error);
    return errorResponse('Failed to delete pension configuration: ' + error.message, 500);
  }
}
