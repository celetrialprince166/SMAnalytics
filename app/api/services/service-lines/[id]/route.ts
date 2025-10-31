/**
 * Service Line by ID API Endpoints
 * 
 * Handles individual service line operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  successResponse, 
  errorResponse, 
  validationErrorResponse,
  notFoundResponse 
} from '@/lib/api/utils/response';

// GET /api/services/service-lines/[id] - Get service line by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const serviceLine = await prisma.serviceLine.findUnique({
      where: { id },
    });

    if (!serviceLine) {
      return notFoundResponse('Service line not found');
    }

    return successResponse(serviceLine);
  } catch (error) {
    console.error('Error fetching service line:', error);
    return errorResponse('Failed to fetch service line', 500);
  }
}

// PUT /api/services/service-lines/[id] - Update service line
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();

    // Check if service line exists
    const existing = await prisma.serviceLine.findUnique({
      where: { id },
    });

    if (!existing) {
      return notFoundResponse('Service line not found');
    }

    // Validate required fields
    if (!body.name || body.name.trim().length === 0) {
      return validationErrorResponse([{
        field: 'name',
        message: 'Service line name is required',
        code: 'REQUIRED',
      }]);
    }

    // Check for duplicate name if name is being updated
    if (body.name !== existing.name) {
      const duplicate = await prisma.serviceLine.findFirst({
        where: {
          name: body.name.trim(),
          id: { not: id },
        },
      });

      if (duplicate) {
        return validationErrorResponse([{
          field: 'name',
          message: 'A service line with this name already exists',
          code: 'DUPLICATE',
        }]);
      }
    }

    // Update service line
    const updatedServiceLine = await prisma.serviceLine.update({
      where: { id },
      data: {
        name: body.name.trim(),
        description: body.description?.trim() || existing.description,
        isActive: body.isActive !== undefined ? body.isActive : existing.isActive,
      },
    });

    return successResponse(updatedServiceLine);
  } catch (error: any) {
    console.error('Error updating service line:', error);
    return errorResponse('Failed to update service line: ' + error.message, 500);
  }
}

// DELETE /api/services/service-lines/[id] - Delete service line
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if service line exists
    const existing = await prisma.serviceLine.findUnique({
      where: { id },
    });

    if (!existing) {
      return notFoundResponse('Service line not found');
    }

    // Check if any services are using this service line
    const services = await prisma.service.findMany({
      where: { serviceLineId: id },
    });

    if (services.length > 0) {
      return validationErrorResponse([{
        field: 'id',
        message: `Cannot delete service line with existing services. This service line has ${services.length} service(s).`,
        code: 'HAS_DEPENDENCIES',
      }]);
    }

    // Delete service line
    await prisma.serviceLine.delete({
      where: { id },
    });

    return successResponse({ message: 'Service line deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting service line:', error);
    return errorResponse('Failed to delete service line: ' + error.message, 500);
  }
}
