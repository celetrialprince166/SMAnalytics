/**
 * Tax Configuration API Endpoints - Single Configuration Operations
 * 
 * Handles GET, PUT, DELETE for individual tax configurations
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  successResponse, 
  errorResponse, 
  validationErrorResponse
} from '@/lib/api/utils/response';

// GET /api/payroll/tax-configurations/[id] - Get tax configuration by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get organization ID (for now, use default)
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7'; // SNM Analytics Demo org ID

    const config = await prisma.taxConfiguration.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
    });

    if (!config) {
      return errorResponse('Tax configuration not found', 404);
    }

    return successResponse(config);
  } catch (error) {
    console.error('Error fetching tax configuration:', error);
    return errorResponse('Failed to fetch tax configuration', 500);
  }
}

// PUT /api/payroll/tax-configurations/[id] - Update tax configuration
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    
    // Get organization ID (for now, use default)
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7'; // SNM Analytics Demo org ID

    // Check if configuration exists
    const existingConfig = await prisma.taxConfiguration.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
    });

    if (!existingConfig) {
      return errorResponse('Tax configuration not found', 404);
    }

    // Prepare update data
    const updateData: any = {};
    
    if (body.effectiveDate !== undefined) {
      updateData.effectiveDate = new Date(body.effectiveDate);
    }
    
    if (body.brackets !== undefined) {
      if (!Array.isArray(body.brackets) || body.brackets.length === 0) {
        return validationErrorResponse([{
          field: 'brackets',
          message: 'At least one tax bracket is required',
          code: 'REQUIRED',
        }]);
      }
      updateData.brackets = body.brackets;
    }
    
    if (body.nonResidentRate !== undefined) {
      if (body.nonResidentRate < 0 || body.nonResidentRate > 100) {
        return validationErrorResponse([{
          field: 'nonResidentRate',
          message: 'Non-resident rate must be between 0 and 100',
          code: 'INVALID_VALUE',
        }]);
      }
      updateData.nonResidentRate = body.nonResidentRate;
    }
    
    if (body.personalRelief !== undefined) {
      if (body.personalRelief < 0) {
        return validationErrorResponse([{
          field: 'personalRelief',
          message: 'Personal relief cannot be negative',
          code: 'INVALID_VALUE',
        }]);
      }
      updateData.personalRelief = body.personalRelief;
    }
    
    if (body.isActive !== undefined) {
      updateData.isActive = body.isActive;
    }

    // Update configuration
    const config = await prisma.taxConfiguration.update({
      where: {
        id: params.id,
      },
      data: updateData,
    });

    return successResponse(config);
  } catch (error: any) {
    console.error('Error updating tax configuration:', error);
    return errorResponse('Failed to update tax configuration: ' + error.message, 500);
  }
}

// DELETE /api/payroll/tax-configurations/[id] - Delete tax configuration
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get organization ID (for now, use default)
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7'; // SNM Analytics Demo org ID

    // Check if configuration exists
    const existingConfig = await prisma.taxConfiguration.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
    });

    if (!existingConfig) {
      return errorResponse('Tax configuration not found', 404);
    }

    // Check if configuration is being used
    const salaryCount = await prisma.salaryEntry.count({
      where: { taxConfigId: params.id },
    });

    if (salaryCount > 0) {
      return errorResponse(
        'Cannot delete tax configuration that is being used in salary entries',
        400
      );
    }

    // Delete configuration
    await prisma.taxConfiguration.delete({
      where: { id: params.id },
    });

    return successResponse({ message: 'Tax configuration deleted' });
  } catch (error: any) {
    console.error('Error deleting tax configuration:', error);
    return errorResponse('Failed to delete tax configuration: ' + error.message, 500);
  }
}
