/**
 * Fixed Asset Depreciation API Endpoints
 * 
 * Handles depreciation recording and schedule retrieval
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  successResponse, 
  errorResponse, 
  validationErrorResponse
} from '@/lib/api/utils/response';

// Helper function to calculate monthly depreciation
function calculateMonthlyDepreciation(asset: any): number {
  const depreciableAmount = Number(asset.valueAtCost) - Number(asset.residualValue);
  
  switch (asset.depreciationType) {
    case 'STRAIGHT_LINE':
      // Annual depreciation / 12 months
      const annualDepreciation = depreciableAmount / asset.usefulLife;
      return annualDepreciation / 12;
      
    case 'DECLINING_BALANCE':
      // Declining balance method
      const currentBookValue = Number(asset.netBookValue);
      const monthlyRate = Number(asset.depreciationRate) / 100 / 12;
      return currentBookValue * monthlyRate;
      
    case 'UNITS_OF_PRODUCTION':
      // Would need units produced data - default to straight line
      return (depreciableAmount / asset.usefulLife) / 12;
      
    default:
      return 0;
  }
}

// POST /api/fixed-assets/depreciation - Record depreciation
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7';

    // Validate required fields
    if (!body.assetId || !body.period) {
      return validationErrorResponse([{
        field: 'general',
        message: 'Asset ID and period are required',
        code: 'REQUIRED',
      }]);
    }

    // Get asset
    const asset = await prisma.fixedAsset.findUnique({
      where: { id: body.assetId },
    });

    if (!asset || asset.organizationId !== organizationId) {
      return errorResponse('Fixed asset not found', 404);
    }

    if (asset.status !== 'ACTIVE') {
      return validationErrorResponse([{
        field: 'assetId',
        message: 'Cannot depreciate inactive asset',
        code: 'INVALID_STATUS',
      }]);
    }

    const period = new Date(body.period);

    // Check if depreciation already recorded for this period
    const existingEntry = await prisma.depreciationEntry.findFirst({
      where: {
        assetId: body.assetId,
        period: {
          gte: new Date(period.getFullYear(), period.getMonth(), 1),
          lt: new Date(period.getFullYear(), period.getMonth() + 1, 1),
        },
      },
    });

    if (existingEntry) {
      return validationErrorResponse([{
        field: 'period',
        message: 'Depreciation already recorded for this period',
        code: 'DUPLICATE',
      }]);
    }

    // Calculate depreciation
    const depreciationAmount = calculateMonthlyDepreciation(asset);
    const newAccumulatedDepreciation = Number(asset.accumulatedDepreciation) + depreciationAmount;
    const newNetBookValue = Number(asset.valueAtCost) - newAccumulatedDepreciation;

    // Ensure net book value doesn't go below residual value
    const residualValue = Number(asset.residualValue);
    const finalNetBookValue = Math.max(newNetBookValue, residualValue);
    const finalAccumulatedDepreciation = Number(asset.valueAtCost) - finalNetBookValue;
    const finalDepreciationAmount = finalAccumulatedDepreciation - Number(asset.accumulatedDepreciation);

    if (finalDepreciationAmount <= 0) {
      return validationErrorResponse([{
        field: 'general',
        message: 'Asset is fully depreciated',
        code: 'FULLY_DEPRECIATED',
      }]);
    }

    // Get account IDs for accounting entries
    const depreciationExpenseAccountId = '3890f64a-3a11-4900-907b-7cba78160976'; // 09-06-001
    const accumulatedDepreciationAccountId = '0bfaa2bc-971b-4caa-b4b8-d4f893aa0950'; // 01-01-005

    // Generate transaction number upfront (outside the Prisma transaction)
    // Get ALL transactions for this organization to find the max base number
    const existingTransactions = await prisma.transaction.findMany({
      where: {
        organizationId,
      },
      select: {
        number: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 1000, // Limit to last 1000 transactions for performance
    });

    // Parse max base number from existing transactions
    let maxBase = 0;
    for (const transaction of existingTransactions) {
      try {
        const num = parseFloat(transaction.number);
        if (!isNaN(num) && isFinite(num)) {
          const base = Math.floor(num);
          maxBase = Math.max(maxBase, base);
        }
      } catch (error) {
        // Skip non-numeric transaction numbers
      }
    }

    const transactionNumber = `${maxBase + 1}.00`;

    // Record depreciation in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create depreciation entry
      const entry = await tx.depreciationEntry.create({
        data: {
          assetId: body.assetId,
          period,
          depreciationAmount: finalDepreciationAmount,
          accumulatedDepreciation: finalAccumulatedDepreciation,
          netBookValue: finalNetBookValue,
        },
      });

      // Update asset
      await tx.fixedAsset.update({
        where: { id: body.assetId },
        data: {
          accumulatedDepreciation: finalAccumulatedDepreciation,
          netBookValue: finalNetBookValue,
        },
      });

      // Create accounting transaction: DR: Depreciation Expense, CR: Accumulated Depreciation
      await tx.transaction.create({
        data: {
          organizationId,
          date: period,
          number: transactionNumber,
          description: `Depreciation for ${asset.description} - ${period.toISOString().slice(0, 7)}`,
          amount: finalDepreciationAmount,
          debitAccountId: depreciationExpenseAccountId,
          creditAccountId: accumulatedDepreciationAccountId,
          reconciled: false,
        },
      });

      // Update account balances
      await tx.holderAccount.update({
        where: { id: depreciationExpenseAccountId },
        data: { balance: { increment: finalDepreciationAmount } },
      });
      await tx.holderAccount.update({
        where: { id: accumulatedDepreciationAccountId },
        data: { balance: { increment: finalDepreciationAmount } },
      });

      return entry;
    });

    return successResponse(result, 201);
  } catch (error: any) {
    console.error('Error recording depreciation:', error);
    return errorResponse('Failed to record depreciation: ' + error.message, 500);
  }
}

// GET /api/fixed-assets/depreciation?assetId=xxx - Get depreciation schedule
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const assetId = searchParams.get('assetId');
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7';

    if (!assetId) {
      return validationErrorResponse([{
        field: 'assetId',
        message: 'Asset ID is required',
        code: 'REQUIRED',
      }]);
    }

    // Verify asset exists
    const asset = await prisma.fixedAsset.findUnique({
      where: { id: assetId },
    });

    if (!asset || asset.organizationId !== organizationId) {
      return errorResponse('Fixed asset not found', 404);
    }

    // Get depreciation entries
    const entries = await prisma.depreciationEntry.findMany({
      where: { assetId },
      orderBy: { period: 'asc' },
    });

    const schedule = {
      assetId: asset.id,
      assetCode: asset.assetCode,
      description: asset.description,
      entries: entries.map(e => ({
        id: e.id,
        period: e.period,
        depreciationAmount: e.depreciationAmount,
        accumulatedDepreciation: e.accumulatedDepreciation,
        netBookValue: e.netBookValue,
        createdAt: e.createdAt,
      })),
    };

    return successResponse(schedule);
  } catch (error) {
    console.error('Error fetching depreciation schedule:', error);
    return errorResponse('Failed to fetch depreciation schedule', 500);
  }
}
