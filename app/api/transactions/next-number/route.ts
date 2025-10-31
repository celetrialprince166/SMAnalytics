/**
 * Next Transaction Number API Endpoint
 * 
 * Generates sequential transaction numbers per day with format:
 * - Single: 1.00, 2.00, 3.00
 * - Split: 2.01, 2.02, 2.03 (children of transaction 2)
 * - Petty Cash: 4.01, 4.02, 4.03 (children of transaction 4)
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api/utils/response';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');
    const type = searchParams.get('type'); // 'single' | 'split' | 'petty'

    if (!dateParam || !type) {
      return errorResponse('Date and type parameters are required', 400);
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
      select: {
        number: true,
      },
      orderBy: {
        number: 'desc',
      },
    });

    // Parse max base number from existing transactions
    // Numbers are in format: "1.00", "2.01", "2.02", "3.00"
    let maxBase = 0;
    const baseCounts: Record<number, number> = {}; // Track how many children each base has

    for (const transaction of transactions) {
      try {
        const num = parseFloat(transaction.number);
        if (!isNaN(num)) {
          const base = Math.floor(num);
          const decimal = Math.round((num - base) * 100);
          
          maxBase = Math.max(maxBase, base);
          
          // Track children count for each base
          if (decimal > 0) {
            baseCounts[base] = Math.max(baseCounts[base] || 0, decimal);
          }
        }
      } catch (error) {
        console.error('Error parsing transaction number:', transaction.number, error);
      }
    }

    // Generate next number based on type
    if (type === 'single') {
      // For single transactions, return next base with .00
      const nextBase = maxBase + 1;
      return successResponse({
        number: `${nextBase}.00`,
        base: nextBase,
      });
    } else if (type === 'split' || type === 'petty') {
      // For split/petty cash, we need to return the base number
      // The children will be numbered as base.01, base.02, etc.
      const nextBase = maxBase + 1;
      return successResponse({
        base: nextBase,
        startNumber: `${nextBase}.01`,
      });
    } else {
      return errorResponse('Invalid type. Must be: single, split, or petty', 400);
    }
  } catch (error) {
    console.error('Error generating next transaction number:', error);
    return errorResponse('Failed to generate next transaction number', 500);
  }
}


