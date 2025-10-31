/**
 * Individual Split Transaction API Endpoints
 * 
 * Handles operations on specific split transactions
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { 
  successResponse, 
  errorResponse, 
  validationErrorResponse,
  notFoundResponse 
} from '@/lib/api/utils/response';

// Schema for split transaction updates
const updateSplitTransactionSchema = z.object({
  date: z.string().datetime('Invalid date format').optional(),
  baseAccountId: z.string().uuid('Invalid base account ID').optional(),
  baseAccountSide: z.enum(['DEBIT', 'CREDIT']).optional(),
  splits: z.array(z.object({
    accountId: z.string().uuid('Invalid account ID'),
    amount: z.number().positive('Amount must be positive'),
    description: z.string().min(1, 'Description is required'),
  })).min(1, 'At least one split is required').optional(),
  reconciled: z.boolean().optional(),
});

type UpdateSplitTransactionInput = z.infer<typeof updateSplitTransactionSchema>;

// GET /api/transactions/split/[id] - Get split transaction by ID
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7';

    const splitTransaction = await prisma.splitTransaction.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        transactions: {
          include: {
            debitAccount: {
              select: {
                id: true,
                name: true,
                code: true,
                balance: true,
                secondaryAccount: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                    primaryAccount: {
                      select: {
                        id: true,
                        name: true,
                        type: true,
                      },
                    },
                  },
                },
              },
            },
            creditAccount: {
              select: {
                id: true,
                name: true,
                code: true,
                balance: true,
                secondaryAccount: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                    primaryAccount: {
                      select: {
                        id: true,
                        name: true,
                        type: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { number: 'asc' },
        },
      },
    });

    if (!splitTransaction) {
      return notFoundResponse('Split transaction not found');
    }

    return successResponse(splitTransaction);
  } catch (error) {
    console.error('Error fetching split transaction:', error);
    return errorResponse('Failed to fetch split transaction', 500);
  }
}

// PUT /api/transactions/split/[id] - Update split transaction
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const validatedData = updateSplitTransactionSchema.parse(body);
    
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7';

    // Check if split transaction exists
    const existingSplitTransaction = await prisma.splitTransaction.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!existingSplitTransaction) {
      return notFoundResponse('Split transaction not found');
    }

    // If updating splits, validate the data
    if (validatedData.splits) {
      const baseAccountId = validatedData.baseAccountId || existingSplitTransaction.baseAccountId;
      
      // Validate base account exists
      const baseAccount = await prisma.holderAccount.findFirst({
        where: { 
          id: baseAccountId,
          organizationId,
          isActive: true,
        },
      });

      if (!baseAccount) {
        return validationErrorResponse([{
          field: 'baseAccountId',
          message: 'Base account not found or inactive',
          code: 'NOT_FOUND',
        }]);
      }

      // Validate all split accounts exist
      const splitAccountIds = validatedData.splits.map(s => s.accountId);
      const splitAccounts = await prisma.holderAccount.findMany({
        where: {
          id: { in: splitAccountIds },
          organizationId,
          isActive: true,
        },
      });

      if (splitAccounts.length !== splitAccountIds.length) {
        return validationErrorResponse([{
          field: 'splits',
          message: 'One or more split accounts not found or inactive',
          code: 'NOT_FOUND',
        }]);
      }

      // Check if any split account is the same as base account
      const duplicateAccount = validatedData.splits.find(
        s => s.accountId === baseAccountId
      );
      if (duplicateAccount) {
        return validationErrorResponse([{
          field: 'splits',
          message: 'Split account cannot be the same as base account',
          code: 'DUPLICATE_ACCOUNT',
        }]);
      }

      // Calculate total amount
      const totalAmount = validatedData.splits.reduce((sum, split) => sum + split.amount, 0);
      if (totalAmount <= 0) {
        return validationErrorResponse([{
          field: 'splits',
          message: 'Total split amount must be greater than zero',
          code: 'INVALID_AMOUNT',
        }]);
      }

      // Update split transaction and recreate individual transactions
      const result = await prisma.$transaction(async (tx) => {
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

        // Optimized helper function - now O(1) lookup
        const getAccountType = (accountId: string): string | undefined => {
          return accountTypeMap[accountId];
        };

        // Get existing transactions for balance reversal
        const existingTransactions = await tx.transaction.findMany({
          where: { splitTransactionId: id },
        });

        // Step 1: Reverse balances for existing transactions
        for (const existingTransaction of existingTransactions) {
          const debitAccountType = getAccountType(existingTransaction.debitAccountId);
          const creditAccountType = getAccountType(existingTransaction.creditAccountId);

          // Reverse debit account
          if (debitAccountType === 'ASSETS' || debitAccountType === 'EXPENSES') {
            await tx.holderAccount.update({
              where: { id: existingTransaction.debitAccountId },
              data: { balance: { decrement: existingTransaction.amount } },
            });
          } else {
            await tx.holderAccount.update({
              where: { id: existingTransaction.debitAccountId },
              data: { balance: { increment: existingTransaction.amount } },
            });
          }

          // Reverse credit account
          if (creditAccountType === 'LIABILITIES' || creditAccountType === 'EQUITY' || creditAccountType === 'REVENUE') {
            await tx.holderAccount.update({
              where: { id: existingTransaction.creditAccountId },
              data: { balance: { decrement: existingTransaction.amount } },
            });
          } else {
            await tx.holderAccount.update({
              where: { id: existingTransaction.creditAccountId },
              data: { balance: { increment: existingTransaction.amount } },
            });
          }
        }

        // Step 2: Delete existing transactions
        await tx.transaction.deleteMany({
          where: { splitTransactionId: id },
        });

        // Step 3: Update split transaction
        const updatedSplitTransaction = await tx.splitTransaction.update({
          where: { id },
          data: {
            ...(validatedData.date && { date: new Date(validatedData.date) }),
            ...(validatedData.baseAccountId && { baseAccountId }),
            ...(validatedData.baseAccountSide && { baseAccountSide: validatedData.baseAccountSide }),
            ...(validatedData.splits && { splits: validatedData.splits }),
            ...(validatedData.splits && { totalAmount }),
            ...(validatedData.reconciled !== undefined && { reconciled: validatedData.reconciled }),
          },
        });

        // Step 4: Create new individual transaction records
        const transactions = [];
        const splits = validatedData.splits || existingSplitTransaction.splits as any[];
        const baseAccountSide = validatedData.baseAccountSide || existingSplitTransaction.baseAccountSide;

        for (const split of splits) {
          const transaction = await tx.transaction.create({
            data: {
              organizationId,
              date: new Date(validatedData.date || existingSplitTransaction.date),
              number: `${existingSplitTransaction.code}-${String(splits.indexOf(split) + 1).padStart(2, '0')}`,
              description: split.description,
              amount: split.amount,
              debitAccountId: baseAccountSide === 'DEBIT'
                ? baseAccountId
                : split.accountId,
              creditAccountId: baseAccountSide === 'CREDIT'
                ? baseAccountId
                : split.accountId,
              reconciled: validatedData.reconciled !== undefined ? validatedData.reconciled : false,
              splitTransactionId: id,
            },
          });
          transactions.push(transaction);
        }

        // Step 5: Apply balances for new transactions
        for (const transaction of transactions) {
          const debitAccountType = getAccountType(transaction.debitAccountId);
          const creditAccountType = getAccountType(transaction.creditAccountId);

          // Apply debit account
          if (debitAccountType === 'ASSETS' || debitAccountType === 'EXPENSES') {
            await tx.holderAccount.update({
              where: { id: transaction.debitAccountId },
              data: { balance: { increment: transaction.amount } },
            });
          } else {
            await tx.holderAccount.update({
              where: { id: transaction.debitAccountId },
              data: { balance: { decrement: transaction.amount } },
            });
          }

          // Apply credit account
          if (creditAccountType === 'LIABILITIES' || creditAccountType === 'EQUITY' || creditAccountType === 'REVENUE') {
            await tx.holderAccount.update({
              where: { id: transaction.creditAccountId },
              data: { balance: { increment: transaction.amount } },
            });
          } else {
            await tx.holderAccount.update({
              where: { id: transaction.creditAccountId },
              data: { balance: { decrement: transaction.amount } },
            });
          }
        }

        return { splitTransaction: updatedSplitTransaction, transactions };
      });

      return successResponse(result);
    } else {
      // Simple update without changing splits
      const updatedSplitTransaction = await prisma.splitTransaction.update({
        where: { id },
        data: {
          ...(validatedData.date && { date: new Date(validatedData.date) }),
          ...(validatedData.baseAccountId && { baseAccountId: validatedData.baseAccountId }),
          ...(validatedData.baseAccountSide && { baseAccountSide: validatedData.baseAccountSide }),
          ...(validatedData.reconciled !== undefined && { reconciled: validatedData.reconciled }),
        },
        include: {
          transactions: {
            include: {
              debitAccount: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  balance: true,
                  secondaryAccount: {
                    select: {
                      id: true,
                      name: true,
                      code: true,
                      primaryAccount: {
                        select: {
                          id: true,
                          name: true,
                          type: true,
                        },
                      },
                    },
                  },
                },
              },
              creditAccount: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  balance: true,
                  secondaryAccount: {
                    select: {
                      id: true,
                      name: true,
                      code: true,
                      primaryAccount: {
                        select: {
                          id: true,
                          name: true,
                          type: true,
                        },
                      },
                    },
                  },
                },
              },
            },
            orderBy: { number: 'asc' },
          },
        },
      });

      return successResponse(updatedSplitTransaction);
    }
  } catch (error) {
    console.error('Error updating split transaction:', error);
    if (error instanceof z.ZodError) {
      return validationErrorResponse(error.errors);
    }
    return errorResponse('Failed to update split transaction: ' + (error as Error).message, 500);
  }
}

// DELETE /api/transactions/split/[id] - Delete split transaction
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7';

    // Check if split transaction exists
    const existingSplitTransaction = await prisma.splitTransaction.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!existingSplitTransaction) {
      return notFoundResponse('Split transaction not found');
    }

    // Delete split transaction and all associated transactions
    await prisma.$transaction(async (tx) => {
      // Delete associated transactions first (foreign key constraint)
      await tx.transaction.deleteMany({
        where: { splitTransactionId: id },
      });

      // Delete split transaction
      await tx.splitTransaction.delete({
        where: { id },
      });
    });

    return successResponse(null);
  } catch (error) {
    console.error('Error deleting split transaction:', error);
    return errorResponse('Failed to delete split transaction', 500);
  }
}





