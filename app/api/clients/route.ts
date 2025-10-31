/**
 * Clients API Endpoints
 * 
 * Handles CRUD operations for clients
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  successResponse, 
  errorResponse, 
  validationErrorResponse 
} from '@/lib/api/utils/response';

// GET /api/clients - List clients
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const isActive = searchParams.get('isActive');
    const organizationId = searchParams.get('organizationId') || '7224ab64-5bd7-4382-839d-6c415d872ba7';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { organizationId };
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { clientId: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { emailAddress: { contains: search, mode: 'insensitive' } },
        { phoneNumbers: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.client.count({ where });

    // Get clients
    const clients = await prisma.client.findMany({
      where,
      skip,
      take: limit,
      orderBy: { companyName: 'asc' },
    });

    return successResponse({
      data: clients,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return errorResponse('Failed to fetch clients', 500);
  }
}

// POST /api/clients - Create client
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate required fields
    if (!body.companyName || !body.contactPerson || !body.emailAddress || !body.phoneNumbers || !body.status || !body.registrationDate) {
      return validationErrorResponse([{
        field: 'general',
        message: 'Company name, contact person, email address, phone numbers, status, and registration date are required',
        code: 'REQUIRED',
      }]);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.emailAddress)) {
      return validationErrorResponse([{
        field: 'emailAddress',
        message: 'Invalid email format',
        code: 'INVALID_FORMAT',
      }]);
    }

    // Validate status
    if (!['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(body.status)) {
      return validationErrorResponse([{
        field: 'status',
        message: 'Status must be ACTIVE, INACTIVE, or SUSPENDED',
        code: 'INVALID_VALUE',
      }]);
    }

    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7';

    // Check if email already exists for this organization
    const existingClient = await prisma.client.findFirst({
      where: {
        emailAddress: body.emailAddress,
        organizationId,
      },
    });

    if (existingClient) {
      return validationErrorResponse([{
        field: 'emailAddress',
        message: 'Client email already exists',
        code: 'DUPLICATE',
      }]);
    }

    // Generate next client ID
    const maxClient = await prisma.client.findFirst({
      where: { organizationId },
      orderBy: { clientId: 'desc' },
    });

    let nextClientId = 'CLT-0001';
    if (maxClient) {
      const match = maxClient.clientId.match(/CLT-(\d+)/);
      if (match) {
        const nextNumber = parseInt(match[1]) + 1;
        nextClientId = `CLT-${String(nextNumber).padStart(4, '0')}`;
      }
    }

    // Create client
    const client = await prisma.client.create({
      data: {
        organizationId,
        clientId: nextClientId,
        registrationDate: new Date(body.registrationDate),
        status: body.status,
        companyName: body.companyName,
        companyRegNo: body.companyRegNo,
        address: body.address,
        contactPerson: body.contactPerson,
        emailAddress: body.emailAddress,
        phoneNumbers: body.phoneNumbers,
        remarks: body.remarks,
        isActive: true,
      },
    });

    return successResponse(client, 201);
  } catch (error: any) {
    console.error('Error creating client:', error);
    return errorResponse('Failed to create client: ' + error.message, 500);
  }
}


