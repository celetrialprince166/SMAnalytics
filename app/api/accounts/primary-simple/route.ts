import { NextRequest } from 'next/server';
import { successResponse, errorResponse, paginatedResponse } from '@/lib/api/utils/response';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const total = await prisma.primaryAccount.count();
    const primaryAccounts = await prisma.primaryAccount.findMany({
      skip,
      take: limit,
      orderBy: { name: 'asc' },
    });

    return paginatedResponse(primaryAccounts, page, limit, total);
  } catch (error: any) {
    console.error('Error fetching primary accounts:', error);
    return errorResponse('Failed to fetch primary accounts', 500);
  }
}


