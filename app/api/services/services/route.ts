/**
 * Services API Endpoints
 * 
 * Handles service operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  errorResponse,
  validationErrorResponse
} from '@/lib/api/utils/response';

// GET /api/services/services - Get all services
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get('active') === 'true';
    const serviceLineId = searchParams.get('serviceLineId');

    // Get organization ID (for now, use default)
    // In production, this should come from the authenticated session
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7'; // SNM Analytics Demo org ID

    let whereClause: any = { organizationId };
    if (activeOnly) {
      whereClause.isActive = true;
    }
    if (serviceLineId) {
      whereClause.serviceLineId = serviceLineId;
    }

    const services = await prisma.service.findMany({
      where: whereClause,
      include: {
        serviceLine: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return successResponse(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    return errorResponse('Failed to fetch services', 500);
  }
}

// POST /api/services/services - Create new service
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate required fields
    if (!body.name || body.name.trim().length === 0) {
      return validationErrorResponse([{
        field: 'name',
        message: 'Service name is required',
        code: 'REQUIRED',
      }]);
    }

    if (!body.description || body.description.trim().length === 0) {
      return validationErrorResponse([{
        field: 'description',
        message: 'Service description is required',
        code: 'REQUIRED',
      }]);
    }

    if (!body.serviceLineId) {
      return validationErrorResponse([{
        field: 'serviceLineId',
        message: 'Service line is required',
        code: 'REQUIRED',
      }]);
    }

    if (!body.averageFee || isNaN(Number(body.averageFee)) || Number(body.averageFee) < 0) {
      return validationErrorResponse([{
        field: 'averageFee',
        message: 'Valid average fee is required',
        code: 'REQUIRED',
      }]);
    }

    // Get organization ID from authenticated user (for now, use a default)
    // In production, this should come from the authenticated session
    const organizationId = body.organizationId || '7224ab64-5bd7-4382-839d-6c415d872ba7'; // SNM Analytics Demo org ID

    // Verify service line exists and is active
    const serviceLine = await prisma.serviceLine.findUnique({
      where: { id: body.serviceLineId },
      select: { id: true, isActive: true, organizationId: true },
    });

    if (!serviceLine) {
      return validationErrorResponse([{
        field: 'serviceLineId',
        message: 'Service line not found',
        code: 'NOT_FOUND',
      }]);
    }

    if (!serviceLine.isActive) {
      return validationErrorResponse([{
        field: 'serviceLineId',
        message: 'Cannot create service under inactive service line',
        code: 'INACTIVE',
      }]);
    }

    // Check for duplicate name within organization
    const existing = await prisma.service.findFirst({
      where: {
        name: body.name.trim(),
        organizationId,
      },
    });

    if (existing) {
      return validationErrorResponse([{
        field: 'name',
        message: 'A service with this name already exists',
        code: 'DUPLICATE',
      }]);
    }

    // Generate service code
    const count = await prisma.service.count({
      where: { serviceLineId: body.serviceLineId },
    });
    const code = `SVC-${String(count + 1).padStart(3, '0')}`;

    // Create service
    const service = await prisma.service.create({
      data: {
        organizationId,
        serviceLineId: body.serviceLineId,
        code,
        name: body.name.trim(),
        description: body.description.trim(),
        averageFee: Number(body.averageFee),
        remarks: body.remarks?.trim() || '',
        isActive: true,
      },
      include: {
        serviceLine: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
      },
    });

    return successResponse(service, 201);
  } catch (error: any) {
    console.error('Error creating service:', error);
    return errorResponse('Failed to create service: ' + error.message, 500);
  }
}

