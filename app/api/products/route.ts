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

// GET /api/products - List products with pagination and search
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const skip = (page - 1) * limit;

    // Get organization ID (for now, use default)
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7'; // SNM Analytics Demo org ID

    // Build where clause
    const where: any = { 
      organizationId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Execute queries in parallel
    const [products, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return successResponse({
      data: products,
      meta: {
        total,
        page,
        limit,
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return errorResponse('Failed to fetch products', 500);
  }
}

// POST /api/products - Create product (simplified)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate required fields
    if (!body.name || body.name.trim().length === 0) {
      return errorResponse('Product name is required', 400);
    }

    if (!body.code || body.code.trim().length === 0) {
      return errorResponse('Product code is required', 400);
    }

    // Get organization ID (for now, use default)
    const organizationId = body.organizationId || '7224ab64-5bd7-4382-839d-6c415d872ba7';

    // Check if code already exists for this organization
    const existingProduct = await prisma.product.findFirst({
      where: {
        code: body.code.trim(),
        organizationId,
      },
    });

    if (existingProduct) {
      return errorResponse('Product code already exists', 400);
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        organizationId,
        code: body.code.trim(),
        name: body.name.trim(),
        description: body.description?.trim() || '',
        category: body.category?.trim() || '',
        unitPrice: Number(body.unitPrice) || 0,
        costPrice: Number(body.costPrice) || 0,
        quantityOnHand: Number(body.quantityOnHand) || 0,
        reorderLevel: Number(body.reorderLevel) || 0,
        isActive: body.isActive !== false,
        inventoryAccountId: body.inventoryAccountId,
        salesAccountId: body.salesAccountId,
        costOfSalesAccountId: body.costOfSalesAccountId,
      },
    });

    return successResponse(product, 201);
  } catch (error: any) {
    console.error('Error creating product:', error);
    return errorResponse('Failed to create product: ' + error.message, 500);
  }
}