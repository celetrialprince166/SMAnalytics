/**
 * Fixed Asset Depreciation API Endpoints
 * 
 * Handles depreciation operations for fixed assets
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { successResponse, errorResponse, validationErrorResponse, notFoundResponse, createdResponse } from '@/lib/api/utils/response';

// GET /api/fixed-assets/[id]/depreciation - Get depreciation entries for a fixed asset
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7';

    // Check if fixed asset exists
    const fixedAsset = await prisma.fixedAsset.findFirst({
      where: { 
        id,
        organizationId,
      },
    });

    if (!fixedAsset) {
      return notFoundResponse('Fixed asset not found');
    }

    // Get depreciation entries
    const depreciationEntries = await prisma.depreciationEntry.findMany({
      where: { assetId: id },
      orderBy: { period: 'desc' },
    });

    return successResponse(depreciationEntries);
  } catch (error) {
    console.error('Error fetching depreciation entries:', error);
    return errorResponse('Failed to fetch depreciation entries', 500);
  }
}

// POST /api/fixed-assets/[id]/depreciation - Record depreciation entry
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7';

    // Validation
    if (!body.period) {
      return validationErrorResponse([{
        field: 'period',
        message: 'Period is required',
        code: 'REQUIRED',
      }]);
    }

    if (!body.depreciationAmount || body.depreciationAmount <= 0) {
      return validationErrorResponse([{
        field: 'depreciationAmount',
        message: 'Depreciation amount must be greater than zero',
        code: 'INVALID',
      }]);
    }

    // Check if fixed asset exists
    const fixedAsset = await prisma.fixedAsset.findFirst({
      where: { 
        id,
        organizationId,
      },
    });

    if (!fixedAsset) {
      return notFoundResponse('Fixed asset not found');
    }

    // Check if depreciation entry already exists for this period
    const existingEntry = await prisma.depreciationEntry.findFirst({
      where: {
        assetId: id,
        period: new Date(body.period),
      },
    });

    if (existingEntry) {
      return validationErrorResponse([{
        field: 'period',
        message: 'Depreciation entry already exists for this period',
        code: 'DUPLICATE',
      }]);
    }

    // Calculate new accumulated depreciation and net book value
    const currentAccumulatedDepreciation = Number(fixedAsset.accumulatedDepreciation);
    const depreciationAmount = parseFloat(body.depreciationAmount);
    const newAccumulatedDepreciation = currentAccumulatedDepreciation + depreciationAmount;
    const valueAtCost = Number(fixedAsset.valueAtCost);
    const residualValue = Number(fixedAsset.residualValue);
    const newNetBookValue = valueAtCost - newAccumulatedDepreciation;

    // Create depreciation entry
    const depreciationEntry = await prisma.depreciationEntry.create({
      data: {
        assetId: id,
        period: new Date(body.period),
        depreciationAmount: depreciationAmount,
        accumulatedDepreciation: newAccumulatedDepreciation,
        netBookValue: Math.max(newNetBookValue, residualValue),
      },
    });

    // Update fixed asset with new values
    await prisma.fixedAsset.update({
      where: { id },
      data: {
        accumulatedDepreciation: newAccumulatedDepreciation,
        netBookValue: Math.max(newNetBookValue, residualValue),
      },
    });

    return createdResponse(depreciationEntry);
  } catch (error: any) {
    console.error('Error recording depreciation entry:', error);
    return errorResponse('Failed to record depreciation entry: ' + error.message, 500);
  }
}