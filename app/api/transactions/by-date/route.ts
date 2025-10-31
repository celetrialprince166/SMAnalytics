/**
 * Transactions By Date API Endpoint
 * 
 * Get all transactions for a specific date (for date-based navigation)
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api/utils/response';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');

    if (!dateParam) {
      return errorResponse('Date parameter is required', 400);
    }

    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7';

    // Parse date and create start/end of day
    const date = new Date(dateParam);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all transactions for the date
    const transactions = await prisma.transaction.findMany({
      where: {
        organizationId,
        date: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
      include: {
        debitAccount: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        creditAccount: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: [
        { number: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    return successResponse({
      date: dateParam,
      count: transactions.length,
      transactions,
    });
  } catch (error) {
    console.error('Error fetching transactions by date:', error);
    return errorResponse('Failed to fetch transactions by date', 500);
  }
}


