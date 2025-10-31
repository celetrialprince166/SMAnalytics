/**
 * Client by ID API Endpoints
 * 
 * Handles individual client operations
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  successResponse, 
  errorResponse, 
  validationErrorResponse,
  notFoundResponse 
} from '@/lib/api/utils/response';

// GET /api/clients/[id] - Get client by ID
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const client = await prisma.client.findUnique({
      where: { id },
    });

    if (!client) {
      return notFoundResponse('Client not found');
    }

    return successResponse(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    return errorResponse('Failed to fetch client', 500);
  }
}

// PUT /api/clients/[id] - Update client
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();

    // Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { id },
    });

    if (!existingClient) {
      return notFoundResponse('Client not found');
    }

    // Validate email format if provided
    if (body.emailAddress) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.emailAddress)) {
        return validationErrorResponse([{
          field: 'emailAddress',
          message: 'Invalid email format',
          code: 'INVALID_FORMAT',
        }]);
      }
    }

    // Validate status if provided
    if (body.status && !['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(body.status)) {
      return validationErrorResponse([{
        field: 'status',
        message: 'Status must be ACTIVE, INACTIVE, or SUSPENDED',
        code: 'INVALID_VALUE',
      }]);
    }

    // Check if email already exists for this organization (if email is being updated)
    if (body.emailAddress && body.emailAddress !== existingClient.emailAddress) {
      const duplicateClient = await prisma.client.findFirst({
        where: {
          emailAddress: body.emailAddress,
          organizationId: existingClient.organizationId,
          id: { not: id },
        },
      });

      if (duplicateClient) {
        return validationErrorResponse([{
          field: 'emailAddress',
          message: 'Client email already exists',
          code: 'DUPLICATE',
        }]);
      }
    }

    // Prepare update data
    const updateData: any = { ...body };
    if (body.registrationDate) {
      updateData.registrationDate = new Date(body.registrationDate);
    }

    // Update client
    const updatedClient = await prisma.client.update({
      where: { id },
      data: updateData,
    });

    return successResponse(updatedClient);
  } catch (error: any) {
    console.error('Error updating client:', error);
    return errorResponse('Failed to update client: ' + error.message, 500);
  }
}

// DELETE /api/clients/[id] - Delete client
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    // Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { id },
    });

    if (!existingClient) {
      return notFoundResponse('Client not found');
    }

    // Soft delete client (set isActive to false)
    await prisma.client.update({
      where: { id },
      data: { isActive: false },
    });

    return successResponse(null);
  } catch (error: any) {
    console.error('Error deleting client:', error);
    return errorResponse('Failed to delete client: ' + error.message, 500);
  }
}


