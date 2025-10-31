/**
 * Tax Configurations API Endpoints
 * 
 * Handles CRUD operations for tax configurations
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  successResponse, 
  errorResponse, 
  validationErrorResponse
} from '@/lib/api/utils/response';

// GET /api/payroll/tax-configurations - List tax configurations
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

    // Get tax configurations
    const configs = await prisma.taxConfiguration.findMany({
      where,
      orderBy: { effectiveDate: 'desc' },
    });

    return successResponse(configs);
  } catch (error) {
    console.error('Error fetching tax configurations:', error);
    return errorResponse('Failed to fetch tax configurations', 500);
  }
}

// POST /api/payroll/tax-configurations - Create tax configuration
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Get organization ID (for now, use default)
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7'; // SNM Analytics Demo org ID

    // Validate required fields
    if (!body.effectiveDate || !body.brackets || !Array.isArray(body.brackets) ||
        body.nonResidentRate === undefined || body.personalRelief === undefined) {
      return validationErrorResponse([{
        field: 'general',
        message: 'Effective date, brackets, non-resident rate, and personal relief are required',
        code: 'REQUIRED',
      }]);
    }

    // Validate brackets
    if (body.brackets.length === 0) {
      return validationErrorResponse([{
        field: 'brackets',
        message: 'At least one tax bracket is required',
        code: 'REQUIRED',
      }]);
    }

    // Validate bracket structure
    for (const bracket of body.brackets) {
      if (bracket.order === undefined || bracket.amount === undefined || bracket.rate === undefined) {
        return validationErrorResponse([{
          field: 'brackets',
          message: 'Each bracket must have order, amount, and rate',
          code: 'INVALID_STRUCTURE',
        }]);
      }

      if (bracket.rate < 0 || bracket.rate > 100) {
        return validationErrorResponse([{
          field: 'brackets',
          message: 'Tax rate must be between 0 and 100',
          code: 'INVALID_VALUE',
        }]);
      }
    }

    // Validate non-resident rate
    if (body.nonResidentRate < 0 || body.nonResidentRate > 100) {
      return validationErrorResponse([{
        field: 'nonResidentRate',
        message: 'Non-resident rate must be between 0 and 100',
        code: 'INVALID_VALUE',
      }]);
    }

    // Validate personal relief
    if (body.personalRelief < 0) {
      return validationErrorResponse([{
        field: 'personalRelief',
        message: 'Personal relief cannot be negative',
        code: 'INVALID_VALUE',
      }]);
    }

    // Create tax configuration using a transaction
    const config = await prisma.$transaction(async (tx) => {
      // Deactivate existing active configurations
      await tx.taxConfiguration.updateMany({
        where: {
          organizationId,
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });

      // Create new configuration
      const newConfig = await tx.taxConfiguration.create({
        data: {
          organizationId,
          effectiveDate: new Date(body.effectiveDate),
          brackets: body.brackets, // Store as JSON
          nonResidentRate: body.nonResidentRate,
          personalRelief: body.personalRelief,
          isActive: true,
        },
      });

      return newConfig;
    });

    return successResponse(config, 201);
  } catch (error: any) {
    console.error('Error creating tax configuration:', error);
    return errorResponse('Failed to create tax configuration: ' + error.message, 500);
  }
}
