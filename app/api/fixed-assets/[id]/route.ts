/**
 * Individual Fixed Asset API Endpoints
 * 
 * Handles GET, PUT, DELETE operations for individual fixed assets
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { 
  successResponse, 
  errorResponse, 
  validationErrorResponse
} from '@/lib/api/utils/response';

// GET /api/fixed-assets/[id] - Get single fixed asset
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7';

    const asset = await prisma.fixedAsset.findUnique({
      where: { id },
      include: {
        depreciationEntries: {
          orderBy: { period: 'desc' },
        },
      },
    });

    if (!asset || asset.organizationId !== organizationId) {
      return errorResponse('Fixed asset not found', 404);
    }

    return successResponse(asset);
  } catch (error) {
    console.error('Error fetching fixed asset:', error);
    return errorResponse('Failed to fetch fixed asset', 500);
  }
}

// PUT /api/fixed-assets/[id] - Update fixed asset
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7';

    // Get existing asset
    const existingAsset = await prisma.fixedAsset.findUnique({
      where: { id },
    });

    if (!existingAsset || existingAsset.organizationId !== organizationId) {
      return errorResponse('Fixed asset not found', 404);
    }

    // Validate values if being updated
    if (body.valueAtCost !== undefined && body.valueAtCost <= 0) {
      return validationErrorResponse([{
        field: 'valueAtCost',
        message: 'Value at cost must be greater than zero',
        code: 'INVALID_VALUE',
      }]);
    }

    if (body.residualValue !== undefined) {
      const valueAtCost = body.valueAtCost ?? existingAsset.valueAtCost;
      if (body.residualValue < 0 || body.residualValue >= Number(valueAtCost)) {
        return validationErrorResponse([{
          field: 'residualValue',
          message: 'Residual value must be between 0 and value at cost',
          code: 'INVALID_VALUE',
        }]);
      }
    }

    if (body.usefulLife !== undefined && body.usefulLife <= 0) {
      return validationErrorResponse([{
        field: 'usefulLife',
        message: 'Useful life must be greater than zero',
        code: 'INVALID_VALUE',
      }]);
    }

    if (body.depreciationRate !== undefined && (body.depreciationRate < 0 || body.depreciationRate > 100)) {
      return validationErrorResponse([{
        field: 'depreciationRate',
        message: 'Depreciation rate must be between 0 and 100',
        code: 'INVALID_VALUE',
      }]);
    }

    // Verify holder account exists if being updated
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

    // Recalculate net book value if cost or depreciation changed
    let netBookValue: Prisma.Decimal | undefined = undefined;
    if (body.valueAtCost !== undefined || body.accumulatedDepreciation !== undefined) {
      const newCost = body.valueAtCost ?? existingAsset.valueAtCost;
      const newAccDepr = body.accumulatedDepreciation ?? existingAsset.accumulatedDepreciation;
      const calculatedValue = Number(newCost) - Number(newAccDepr);
      
      const residualValue = body.residualValue ?? existingAsset.residualValue;
      const finalValue = Math.max(calculatedValue, Number(residualValue));
      netBookValue = new Prisma.Decimal(finalValue);
    }

    // Update asset
    const updatedAsset = await prisma.fixedAsset.update({
      where: { id },
      data: {
        ...(body.acquisitionDate && { acquisitionDate: new Date(body.acquisitionDate) }),
        ...(body.referenceNumber !== undefined && { referenceNumber: body.referenceNumber?.trim() || null }),
        ...(body.category && { category: body.category }),
        ...(body.assetClass !== undefined && { assetClass: body.assetClass?.trim() || null }),
        ...(body.description && { description: body.description.trim() }),
        ...(body.valueAtCost !== undefined && { valueAtCost: body.valueAtCost }),
        ...(body.usefulLife !== undefined && { usefulLife: body.usefulLife }),
        ...(body.depreciationRate !== undefined && { depreciationRate: body.depreciationRate }),
        ...(body.depreciationType && { depreciationType: body.depreciationType }),
        ...(body.residualValue !== undefined && { residualValue: body.residualValue }),
        ...(body.primaryAccountId !== undefined && { primaryAccountId: body.primaryAccountId || null }),
        ...(body.secondaryAccountId !== undefined && { secondaryAccountId: body.secondaryAccountId || null }),
        ...(body.holderAccountId !== undefined && { holderAccountId: body.holderAccountId || null }),
        ...(body.status && { status: body.status }),
        ...(body.remarks !== undefined && { remarks: body.remarks?.trim() || null }),
        ...(body.accumulatedDepreciation !== undefined && { accumulatedDepreciation: body.accumulatedDepreciation }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(netBookValue !== undefined && { netBookValue }),
      },
      include: {
        depreciationEntries: {
          orderBy: { period: 'desc' },
          take: 1,
        },
      },
    });

    return successResponse(updatedAsset);
  } catch (error: any) {
    console.error('Error updating fixed asset:', error);
    return errorResponse('Failed to update fixed asset: ' + error.message, 500);
  }
}

// DELETE /api/fixed-assets/[id] - Soft delete fixed asset
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7';

    // Get existing asset
    const existingAsset = await prisma.fixedAsset.findUnique({
      where: { id },
    });

    if (!existingAsset || existingAsset.organizationId !== organizationId) {
      return errorResponse('Fixed asset not found', 404);
    }

    // Soft delete by setting isActive to false
    await prisma.fixedAsset.update({
      where: { id },
      data: { isActive: false },
    });

    return successResponse({ message: 'Fixed asset deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting fixed asset:', error);
    return errorResponse('Failed to delete fixed asset: ' + error.message, 500);
  }
}
