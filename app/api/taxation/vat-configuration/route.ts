import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  errorResponse,
  validationErrorResponse
} from '@/lib/api/utils/response';

// GET /api/taxation/vat-configuration - Get VAT tax configuration
export async function GET(req: NextRequest) {
  try {
    // Get organization ID (for now, use default)
    // In production, this should come from the authenticated session
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7'; // SNM Analytics Demo org ID

    const vatConfig = await prisma.vATTaxConfiguration.findFirst({
      where: { 
        organizationId,
        isActive: true 
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(vatConfig);
  } catch (error) {
    console.error('Error fetching VAT tax configuration:', error);
    return errorResponse('Failed to fetch VAT tax configuration', 500);
  }
}

// POST /api/taxation/vat-configuration - Create or update VAT tax configuration
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate required fields
    if (
      body.nhil === undefined || 
      body.getfund === undefined || 
      body.covid19 === undefined || 
      body.vat === undefined
    ) {
      return validationErrorResponse([{
        field: 'general',
        message: 'NHIL, GETFund, COVID-19, and VAT rates are required',
        code: 'REQUIRED',
      }]);
    }

    // Validate rates are within valid range (0-100)
    const rates = { nhil: body.nhil, getfund: body.getfund, covid19: body.covid19, vat: body.vat };
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
    const existingConfig = await prisma.vATTaxConfiguration.findFirst({
      where: { 
        organizationId,
        isActive: true 
      },
    });

    let vatConfig;

    if (existingConfig) {
      // Update existing configuration
      vatConfig = await prisma.vATTaxConfiguration.update({
        where: { id: existingConfig.id },
        data: {
          nhil: parseFloat(body.nhil),
          getfund: parseFloat(body.getfund),
          covid19: parseFloat(body.covid19),
          vat: parseFloat(body.vat),
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new configuration
      vatConfig = await prisma.vATTaxConfiguration.create({
        data: {
          organizationId,
          nhil: parseFloat(body.nhil),
          getfund: parseFloat(body.getfund),
          covid19: parseFloat(body.covid19),
          vat: parseFloat(body.vat),
          isActive: true,
        },
      });
    }

    return successResponse(vatConfig, existingConfig ? 200 : 201);
  } catch (error: any) {
    console.error('Error saving VAT tax configuration:', error);
    return errorResponse('Failed to save VAT tax configuration: ' + error.message, 500);
  }
}

