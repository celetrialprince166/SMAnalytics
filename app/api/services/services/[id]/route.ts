/**
 * Service by ID API Endpoints
 * 
 * Handles individual service operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  notFoundResponse
} from '@/lib/api/utils/response';

// GET /api/services/services/[id] - Get service by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const service = await prisma.service.findUnique({
      where: { id },
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

    if (!service) {
      return notFoundResponse('Service not found');
    }

    return successResponse(service);
  } catch (error) {
    console.error('Error fetching service:', error);
    return errorResponse('Failed to fetch service', 500);
  }
}

// PUT /api/services/services/[id] - Update service
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();

    // Check if service exists
    const existingService = await prisma.service.findUnique({
      where: { id },
    });

    if (!existingService) {
      return notFoundResponse('Service not found');
    }

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

    // Verify service line exists and is active
    const serviceLine = await prisma.serviceLine.findUnique({
      where: { id: body.serviceLineId },
      select: { id: true, isActive: true },
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
        message: 'Cannot update service to inactive service line',
        code: 'INACTIVE',
      }]);
    }

    // Check for duplicate name within organization (excluding current service)
    const existing = await prisma.service.findFirst({
      where: {
        name: body.name.trim(),
        organizationId: existingService.organizationId,
        NOT: { id },
      },
    });

    if (existing) {
      return validationErrorResponse([{
        field: 'name',
        message: 'A service with this name already exists',
        code: 'DUPLICATE',
      }]);
    }

    // Update service
    const updatedService = await prisma.service.update({
      where: { id },
      data: {
        serviceLineId: body.serviceLineId,
        name: body.name.trim(),
        description: body.description.trim(),
        averageFee: Number(body.averageFee),
        remarks: body.remarks?.trim() || '',
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

    return successResponse(updatedService);
  } catch (error: any) {
    console.error('Error updating service:', error);
    return errorResponse('Failed to update service: ' + error.message, 500);
  }
}

// DELETE /api/services/services/[id] - Delete service
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if service exists
    const existingService = await prisma.service.findUnique({
      where: { id },
    });

    if (!existingService) {
      return notFoundResponse('Service not found');
    }

    // Delete service
    await prisma.service.delete({
      where: { id },
    });

    return successResponse({ message: 'Service deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting service:', error);
    return errorResponse('Failed to delete service: ' + error.message, 500);
  }
}

