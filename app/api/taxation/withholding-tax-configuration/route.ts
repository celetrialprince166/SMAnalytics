import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  errorResponse,
  validationErrorResponse
} from '@/lib/api/utils/response';

// GET /api/taxation/withholding-tax-configuration - Get withholding tax configuration
export async function GET(req: NextRequest) {
  try {
    // Get organization ID (for now, use default)
    // In production, this should come from the authenticated session
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7'; // SNM Analytics Demo org ID

    const withholdingConfig = await prisma.withholdingTaxConfiguration.findFirst({
      where: { 
        organizationId,
        isActive: true 
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(withholdingConfig);
  } catch (error) {
    console.error('Error fetching withholding tax configuration:', error);
    return errorResponse('Failed to fetch withholding tax configuration', 500);
  }
}

// POST /api/taxation/withholding-tax-configuration - Create or update withholding tax configuration
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate required fields
    if (
      body.nonIndividualThreshold === undefined || 
      body.nonIndividualRate === undefined || 
      body.individualRate === undefined
    ) {
      return validationErrorResponse([{
        field: 'general',
        message: 'Non-individual threshold, non-individual rate, and individual rate are required',
        code: 'REQUIRED',
      }]);
    }

    // Validate threshold is positive
    if (typeof body.nonIndividualThreshold !== 'number' || body.nonIndividualThreshold < 0) {
      return validationErrorResponse([{
        field: 'nonIndividualThreshold',
        message: 'Non-individual threshold must be a positive number',
        code: 'INVALID_RANGE',
      }]);
    }

    // Validate rates are within valid range (0-100)
    const rates = { nonIndividualRate: body.nonIndividualRate, individualRate: body.individualRate };
    const invalidRates = Object.entries(rates).filter(([key, value]) => 
      typeof value !== 'number' || value < 0 || value > 100
    );

    if (invalidRates.length > 0) {
      return validationErrorResponse([{
        field: 'rates',
        message: 'All rates must be numbers between 0 and 100',
        code: 'INVALID_RANGE',
      }]);
    }

    // Get organization ID (for now, use default)
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7'; // SNM Analytics Demo org ID

    // Check if there's an existing active configuration
    const existingConfig = await prisma.withholdingTaxConfiguration.findFirst({
      where: { 
        organizationId,
        isActive: true 
      },
    });

    let withholdingConfig;

    if (existingConfig) {
      // Update existing configuration
      withholdingConfig = await prisma.withholdingTaxConfiguration.update({
        where: { id: existingConfig.id },
        data: {
          nonIndividualThreshold: parseFloat(body.nonIndividualThreshold),
          nonIndividualRate: parseFloat(body.nonIndividualRate),
          individualRate: parseFloat(body.individualRate),
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new configuration
      withholdingConfig = await prisma.withholdingTaxConfiguration.create({
        data: {
          organizationId,
          nonIndividualThreshold: parseFloat(body.nonIndividualThreshold),
          nonIndividualRate: parseFloat(body.nonIndividualRate),
          individualRate: parseFloat(body.individualRate),
          isActive: true,
        },
      });
    }

    return successResponse(withholdingConfig, existingConfig ? 200 : 201);
  } catch (error: any) {
    console.error('Error saving withholding tax configuration:', error);
    return errorResponse('Failed to save withholding tax configuration: ' + error.message, 500);
  }
}

