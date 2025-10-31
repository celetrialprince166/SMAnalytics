/**
 * Individual Transaction API Endpoints
 * 
 * Handles GET, PUT, DELETE operations for individual transactions
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  successResponse, 
  errorResponse, 
  validationErrorResponse
} from '@/lib/api/utils/response';


// Optimized helper function - now O(1) lookup
function getAccountType(accountId: string, accountTypeMap: Record<string, string>): string | undefined {
  return accountTypeMap[accountId];
}

// Helper function to update account balance based on account type
async function updateAccountBalance(
  accountId: string,
  amount: number,
  isDebit: boolean,
  isReverse: boolean,
  tx: any,
  accountTypeMap: Record<string, string>
) {
  const accountType = getAccountType(accountId, accountTypeMap);

  // ASSETS, EXPENSES: Debit increases, Credit decreases
  // LIABILITIES, EQUITY, REVENUE: Credit increases, Debit decreases

  let shouldIncrement: boolean;

  if (isDebit) {
    // Debit side
    if (accountType === 'ASSETS' || accountType === 'EXPENSES') {
      shouldIncrement = !isReverse; // Normal: increase, Reverse: decrease
    } else {
      shouldIncrement = isReverse; // Normal: decrease, Reverse: increase
    }
  } else {
    // Credit side
    if (accountType === 'LIABILITIES' || accountType === 'EQUITY' || accountType === 'REVENUE') {
      shouldIncrement = !isReverse; // Normal: increase, Reverse: decrease
    } else {
      shouldIncrement = isReverse; // Normal: decrease, Reverse: increase
    }
  }

  await tx.holderAccount.update({
    where: { id: accountId },
    data: {
      balance: shouldIncrement
        ? { increment: amount }
        : { decrement: amount },
    },
  });
}

// GET /api/transactions/[id] - Get single transaction
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7';

    const transaction = await prisma.transaction.findUnique({
      where: { id },
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

    if (!transaction || transaction.organizationId !== organizationId) {
      return errorResponse('Transaction not found', 404);
    }

    return successResponse(transaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return errorResponse('Failed to fetch transaction', 500);
  }
}

// PUT /api/transactions/[id] - Update transaction
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7';

    // Get existing transaction
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!existingTransaction || existingTransaction.organizationId !== organizationId) {
      return errorResponse('Transaction not found', 404);
    }

    // Validate accounts if being updated
    if (body.debitAccountId) {
      const debitAccount = await prisma.holderAccount.findUnique({
        where: { id: body.debitAccountId },
      });
      if (!debitAccount || !debitAccount.isActive) {
        return validationErrorResponse([{
          field: 'debitAccountId',
          message: 'Debit account not found or inactive',
          code: 'NOT_FOUND',
        }]);
      }
    }

    if (body.creditAccountId) {
      const creditAccount = await prisma.holderAccount.findUnique({
        where: { id: body.creditAccountId },
      });
      if (!creditAccount || !creditAccount.isActive) {
        return validationErrorResponse([{
          field: 'creditAccountId',
          message: 'Credit account not found or inactive',
          code: 'NOT_FOUND',
        }]);
      }
    }

    // Business rule: Debit and credit accounts must be different
    const newDebitId = body.debitAccountId || existingTransaction.debitAccountId;
    const newCreditId = body.creditAccountId || existingTransaction.creditAccountId;
    if (newDebitId === newCreditId) {
      return validationErrorResponse([{
        field: 'creditAccountId',
        message: 'Debit and credit accounts must be different',
        code: 'SAME_ACCOUNTS',
      }]);
    }

    // Update transaction with balance reversal and reapplication
    const updatedTransaction = await prisma.$transaction(async (tx) => {
      // Pre-load all account types for O(1) lookups
      const accountTypes = await tx.holderAccount.findMany({
        where: {
          organizationId,
          isActive: true,
        },
        select: {
          id: true,
          secondaryAccount: {
            select: {
              primaryAccount: {
                select: {
                  type: true,
                },
              },
            },
          },
        },
      });

      // Create a lookup map for O(1) access
      const accountTypeMap: Record<string, string> = {};
      for (const account of accountTypes) {
        if (account.secondaryAccount?.primaryAccount?.type) {
          accountTypeMap[account.id] = account.secondaryAccount.primaryAccount.type;
        }
      }

      // Step 1: Reverse old transaction balances
      await updateAccountBalance(
        existingTransaction.debitAccountId,
        Number(existingTransaction.amount),
        true,  // isDebit
        true,  // isReverse
        tx,
        accountTypeMap
      );
      await updateAccountBalance(
        existingTransaction.creditAccountId,
        Number(existingTransaction.amount),
        false, // isCredit
        true,  // isReverse
        tx,
        accountTypeMap
      );

      // Step 2: Update transaction record
      const updated = await tx.transaction.update({
        where: { id },
        data: {
          ...(body.date && { date: new Date(body.date) }),
          ...(body.description && { description: body.description }),
          ...(body.amount && { amount: parseFloat(body.amount) }),
          ...(body.debitAccountId && { debitAccountId: body.debitAccountId }),
          ...(body.creditAccountId && { creditAccountId: body.creditAccountId }),
          ...(body.reconciled !== undefined && { reconciled: body.reconciled }),
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
      });

      // Step 3: Apply new transaction balances
      const newAmount = body.amount ? parseFloat(body.amount) : Number(existingTransaction.amount);
      await updateAccountBalance(
        updated.debitAccountId,
        newAmount,
        true,  // isDebit
        false, // not reverse
        tx,
        accountTypeMap
      );
      await updateAccountBalance(
        updated.creditAccountId,
        newAmount,
        false, // isCredit
        false, // not reverse
        tx,
        accountTypeMap
      );

      // Create audit entry
      await tx.auditEntry.create({
        data: {
          organizationId,
          transactionId: id,
          action: 'UPDATE',
          timestamp: new Date(),
          previousValues: {
            date: existingTransaction.date,
            description: existingTransaction.description,
            amount: existingTransaction.amount,
            debitAccountId: existingTransaction.debitAccountId,
            creditAccountId: existingTransaction.creditAccountId,
            reconciled: existingTransaction.reconciled,
          },
          newValues: {
            date: updated.date,
            description: updated.description,
            amount: updated.amount,
            debitAccountId: updated.debitAccountId,
            creditAccountId: updated.creditAccountId,
            reconciled: updated.reconciled,
          },
        },
      });

      return updated;
    });

    return successResponse(updatedTransaction);
  } catch (error: any) {
    console.error('Error updating transaction:', error);
    return errorResponse('Failed to update transaction: ' + error.message, 500);
  }
}

// DELETE /api/transactions/[id] - Delete transaction
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7';

    // Get existing transaction
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!existingTransaction || existingTransaction.organizationId !== organizationId) {
      return errorResponse('Transaction not found', 404);
    }

    // Delete transaction with balance reversal
    await prisma.$transaction(async (tx) => {
      // Pre-load all account types for O(1) lookups
      const accountTypes = await tx.holderAccount.findMany({
        where: {
          organizationId,
          isActive: true,
        },
        select: {
          id: true,
          secondaryAccount: {
            select: {
              primaryAccount: {
                select: {
                  type: true,
                },
              },
            },
          },
        },
      });

      // Create a lookup map for O(1) access
      const accountTypeMap: Record<string, string> = {};
      for (const account of accountTypes) {
        if (account.secondaryAccount?.primaryAccount?.type) {
          accountTypeMap[account.id] = account.secondaryAccount.primaryAccount.type;
        }
      }

      // Step 1: Reverse transaction balances
      await updateAccountBalance(
        existingTransaction.debitAccountId,
        Number(existingTransaction.amount),
        true,  // isDebit
        true,  // isReverse
        tx,
        accountTypeMap
      );
      await updateAccountBalance(
        existingTransaction.creditAccountId,
        Number(existingTransaction.amount),
        false, // isCredit
        true,  // isReverse
        tx,
        accountTypeMap
      );

      // Step 2: Create audit entry
      await tx.auditEntry.create({
        data: {
          organizationId,
          transactionId: id,
          action: 'DELETE',
          timestamp: new Date(),
          previousValues: {
            date: existingTransaction.date,
            number: existingTransaction.number,
            description: existingTransaction.description,
            amount: existingTransaction.amount,
            debitAccountId: existingTransaction.debitAccountId,
            creditAccountId: existingTransaction.creditAccountId,
            reconciled: existingTransaction.reconciled,
          },
        },
      });

      // Step 3: Delete transaction
      await tx.transaction.delete({
        where: { id },
      });
    });

    return successResponse({ message: 'Transaction deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting transaction:', error);
    return errorResponse('Failed to delete transaction: ' + error.message, 500);
  }
}
