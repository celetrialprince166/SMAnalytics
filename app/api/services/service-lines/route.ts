/**
 * Service Lines API Endpoints
 * 
 * Handles service line CRUD operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  successResponse, 
  errorResponse, 
  validationErrorResponse
} from '@/lib/api/utils/response';

// GET /api/services/service-lines - Get all service lines
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

    const serviceLines = await prisma.serviceLine.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
    });

    return successResponse(serviceLines);
  } catch (error) {
    console.error('Error fetching service lines:', error);
    return errorResponse('Failed to fetch service lines', 500);
  }
}

// POST /api/services/service-lines - Create new service line
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate required fields
    if (!body.name || body.name.trim().length === 0) {
      return validationErrorResponse([{
        field: 'name',
        message: 'Service line name is required',
        code: 'REQUIRED',
      }]);
    }

    // Get organization ID from authenticated user (for now, use a default)
    // In production, this should come from the authenticated session
    const organizationId = body.organizationId || '7224ab64-5bd7-4382-839d-6c415d872ba7'; // SNM Analytics Demo org ID

    // Check for duplicate name within organization
    const existing = await prisma.serviceLine.findFirst({
      where: {
        name: body.name.trim(),
        organizationId,
      },
    });

    if (existing) {
      return validationErrorResponse([{
        field: 'name',
        message: 'A service line with this name already exists',
        code: 'DUPLICATE',
      }]);
    }

    // Create service line
    const serviceLine = await prisma.serviceLine.create({
      data: {
        organizationId,
        name: body.name.trim(),
        description: body.description?.trim() || '',
        isActive: true,
      },
    });

    return successResponse(serviceLine, 201);
  } catch (error: any) {
    console.error('Error creating service line:', error);
    return errorResponse('Failed to create service line: ' + error.message, 500);
  }
}
