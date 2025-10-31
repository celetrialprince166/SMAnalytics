/**
 * Transaction Audit Trail API Endpoint
 * 
 * Handles fetching audit entries for a specific transaction
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  successResponse, 
  errorResponse, 
  notFoundResponse 
} from '@/lib/api/utils/response';

// GET /api/transactions/[id]/audit - Get audit entries for a transaction
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7'; // Default org ID

    // Check if transaction exists
    const transaction = await prisma.transaction.findFirst({
      where: { 
        id, 
        organizationId 
      },
    });

    if (!transaction) {
      return notFoundResponse('Transaction not found');
    }

    // Get audit entries for this transaction
    const auditEntries = await prisma.auditEntry.findMany({
      where: { 
        transactionId: id,
        organizationId 
      },
      orderBy: { timestamp: 'desc' },
    });

    return successResponse(auditEntries);
  } catch (error) {
    console.error('Error fetching audit entries:', error);
    return errorResponse('Failed to fetch audit entries', 500);
  }
}





