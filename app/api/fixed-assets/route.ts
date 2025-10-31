/**
 * Fixed Assets API Endpoints
 * 
 * Handles CRUD operations for fixed assets
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  successResponse, 
  errorResponse, 
  validationErrorResponse
} from '@/lib/api/utils/response';

// GET /api/fixed-assets - List fixed assets
export async function GET(req: NextRequest) {
  try {
    // Get organization ID (for now, use default)
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7'; // SNM Analytics Demo org ID
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {
      organizationId,
    };

    if (category) {
      where.category = category;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { assetCode: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { referenceNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get fixed assets
    const assets = await prisma.fixedAsset.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        depreciationEntries: {
          orderBy: { period: 'desc' },
          take: 1, // Latest entry
        },
      },
    });

    return successResponse(assets);
  } catch (error) {
    console.error('Error fetching fixed assets:', error);
    return errorResponse('Failed to fetch fixed assets', 500);
  }
}

// POST /api/fixed-assets - Create fixed asset
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Get organization ID (for now, use default)
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7'; // SNM Analytics Demo org ID

    // Validate required fields
    if (!body.description || !body.category || !body.acquisitionDate || 
        !body.valueAtCost || !body.usefulLife || !body.depreciationRate || 
        !body.depreciationType || body.residualValue === undefined) {
      return validationErrorResponse([{
        field: 'general',
        message: 'Description, category, acquisition date, value at cost, useful life, depreciation rate, depreciation type, and residual value are required',
        code: 'REQUIRED',
      }]);
    }

    // Validate values
    if (body.valueAtCost <= 0) {
      return validationErrorResponse([{
        field: 'valueAtCost',
        message: 'Value at cost must be greater than zero',
        code: 'INVALID_VALUE',
      }]);
    }

    if (body.residualValue < 0 || body.residualValue >= body.valueAtCost) {
      return validationErrorResponse([{
        field: 'residualValue',
        message: 'Residual value must be between 0 and value at cost',
        code: 'INVALID_VALUE',
      }]);
    }

    if (body.usefulLife <= 0) {
      return validationErrorResponse([{
        field: 'usefulLife',
        message: 'Useful life must be greater than zero',
        code: 'INVALID_VALUE',
      }]);
    }

    if (body.depreciationRate < 0 || body.depreciationRate > 100) {
      return validationErrorResponse([{
        field: 'depreciationRate',
        message: 'Depreciation rate must be between 0 and 100',
        code: 'INVALID_VALUE',
      }]);
    }

    // Verify holder account exists if provided
    if (body.holderAccountId) {
      const holderAccount = await prisma.holderAccount.findUnique({
        where: { id: body.holderAccountId },
      });

      if (!holderAccount || !holderAccount.isActive) {
        return validationErrorResponse([{
          field: 'holderAccountId',
          message: 'Holder account not found or inactive',
          code: 'NOT_FOUND',
        }]);
      }
    }

    // Create asset using a transaction
    const asset = await prisma.$transaction(async (tx) => {
      // Generate unique asset code atomically
      const existingAssets = await tx.fixedAsset.findMany({
        where: { organizationId },
        select: { assetCode: true },
        orderBy: { assetCode: 'desc' },
      });

      const maxNumber = existingAssets.reduce((max, asset) => {
        const match = asset.assetCode.match(/FA-(\d+)/);
        if (match) {
          const num = parseInt(match[1]);
          return num > max ? num : max;
        }
        return max;
      }, 0);

      const assetCode = `FA-${String(maxNumber + 1).padStart(4, '0')}`;

      // Calculate initial net book value
      const netBookValue = body.valueAtCost;

      // Create asset record
      const newAsset = await tx.fixedAsset.create({
        data: {
          organizationId,
          assetCode,
          acquisitionDate: new Date(body.acquisitionDate),
          referenceNumber: body.referenceNumber?.trim() || null,
          category: body.category,
          assetClass: body.assetClass?.trim() || null,
          description: body.description.trim(),
          valueAtCost: body.valueAtCost,
          usefulLife: body.usefulLife,
          depreciationRate: body.depreciationRate,
          depreciationType: body.depreciationType,
          residualValue: body.residualValue,
          primaryAccountId: body.primaryAccountId || null,
          secondaryAccountId: body.secondaryAccountId || null,
          holderAccountId: body.holderAccountId || null,
          status: body.status || 'ACTIVE',
          remarks: body.remarks?.trim() || null,
          accumulatedDepreciation: 0,
          netBookValue: netBookValue,
          isActive: true,
          createdBy: body.createdBy || null,
        },
      });

      return newAsset;
    });

    return successResponse(asset, 201);
  } catch (error: any) {
    console.error('Error creating fixed asset:', error);
    return errorResponse('Failed to create fixed asset: ' + error.message, 500);
  }
}
