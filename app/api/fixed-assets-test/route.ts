import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api/utils/response';

export async function GET(req: NextRequest) {
  try {
    // Return mock data to test if API routes work
    const mockFixedAssets = [
      {
        id: 'test-asset-1',
        organizationId: '7224ab64-5bd7-4382-839d-6c415d872ba7',
        assetCode: 'FA-001',
        acquisitionDate: new Date('2024-01-01'),
        referenceNumber: 'REF-001',
        category: 'EQUIPMENT',
        assetClass: 'Computer',
        description: 'Test Asset',
        valueAtCost: 10000,
        usefulLife: 5,
        depreciationRate: 20,
        depreciationType: 'STRAIGHT_LINE',
        residualValue: 1000,
        primaryAccountId: null,
        secondaryAccountId: null,
        holderAccountId: null,
        status: 'ACTIVE',
        remarks: 'Test asset',
        accumulatedDepreciation: 2000,
        netBookValue: 8000,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        createdBy: null
      }
    ];

    return successResponse(mockFixedAssets);
  } catch (error) {
    console.error('Error in test route:', error);
    return errorResponse('Test route failed', 500);
  }
}
