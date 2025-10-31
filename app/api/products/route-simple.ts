/**
 * Products API Endpoints (Simplified)
 * 
 * Handles CRUD operations for products without complex middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  successResponse, 
  errorResponse
} from '@/lib/api/utils/response';

// GET /api/products - List products (simplified)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get('active') === 'true';

    // Get organization ID (for now, use default)
    // In production, this should come from the authenticated session
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7'; // SNM Analytics Demo org ID

    let whereClause: any = { organizationId };
    if (activeOnly) {
      whereClause.isActive = true;
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
    });

    return successResponse(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return errorResponse('Failed to fetch products', 500);
  }
}










