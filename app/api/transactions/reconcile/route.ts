/**
 * Transaction Reconciliation API Endpoints
 * 
 * Handles transaction reconciliation operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api/utils/response';
import { withAuth } from '@/lib/api/middleware/auth';
import { withValidation } from '@/lib/api/middleware/validation';
import { withRateLimit } from '@/lib/api/middleware/rateLimit';
import { withRequestLogging } from '@/lib/api/middleware/requestLogging';

// Schema for reconciliation request
const reconcileTransactionSchema = z.object({
  transactionId: z.string().uuid('Invalid transaction ID'),
  reconciled: z.boolean(),
});

const reconcileMultipleTransactionsSchema = z.object({
  transactionIds: z.array(z.string().uuid('Invalid transaction ID')).min(1, 'At least one transaction ID is required'),
  reconciled: z.boolean(),
});

type ReconcileTransactionInput = z.infer<typeof reconcileTransactionSchema>;
type ReconcileMultipleTransactionsInput = z.infer<typeof reconcileMultipleTransactionsSchema>;

// POST /api/transactions/reconcile - Reconcile a single transaction
export const POST = withRequestLogging(
  withRateLimit()(
    withAuth(
      withValidation(reconcileTransactionSchema)(
        async (req: NextRequest, context: { validated: ReconcileTransactionInput }) => {
          try {
            const validatedData = context.validated;
            const { transactionId, reconciled } = validatedData;

            // Check if transaction exists
            const transaction = await prisma.transaction.findUnique({
              where: { id: transactionId },
            });

            if (!transaction) {
              return validationErrorResponse([{
                field: 'transactionId',
                message: 'Transaction not found',
                code: 'NOT_FOUND',
              }]);
            }

            // Update transaction reconciliation status
            const updatedTransaction = await prisma.transaction.update({
              where: { id: transactionId },
              data: { reconciled },
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
            });

            const action = reconciled ? 'reconciled' : 'unreconciled';
            return successResponse(updatedTransaction);
          } catch (error) {
            console.error('Error reconciling transaction:', error);
            return errorResponse('Failed to reconcile transaction', 500);
          }
        }
      )
    )
  )
);

// PUT /api/transactions/reconcile - Reconcile multiple transactions
export const PUT = withRequestLogging(
  withRateLimit()(
    withAuth(
      withValidation(reconcileMultipleTransactionsSchema)(
        async (req: NextRequest, context: { validated: ReconcileMultipleTransactionsInput }) => {
          try {
            const validatedData = context.validated;
            const { transactionIds, reconciled } = validatedData;

            // Check if all transactions exist
            const existingTransactions = await prisma.transaction.findMany({
              where: {
                id: { in: transactionIds },
              },
              select: { id: true },
            });

            const existingIds = existingTransactions.map(t => t.id);
            const missingIds = transactionIds.filter(id => !existingIds.includes(id));

            if (missingIds.length > 0) {
              return validationErrorResponse([{
                field: 'transactionIds',
                message: `Transactions not found: ${missingIds.join(', ')}`,
                code: 'NOT_FOUND',
              }]);
            }

            // Update multiple transactions reconciliation status
            const updatedTransactions = await prisma.transaction.updateMany({
              where: {
                id: { in: transactionIds },
              },
              data: { reconciled },
            });

            const action = reconciled ? 'reconciled' : 'unreconciled';
            return successResponse(
              { updatedCount: updatedTransactions.count }
            );
          } catch (error) {
            console.error('Error reconciling multiple transactions:', error);
            return errorResponse('Failed to reconcile transactions', 500);
          }
        }
      )
    )
  )
);















