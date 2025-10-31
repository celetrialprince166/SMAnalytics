/**
 * Split Transactions API Endpoints
 * 
 * Handles CRUD operations for split transactions
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { 
  successResponse, 
  errorResponse, 
  validationErrorResponse,
  paginatedResponse 
} from '@/lib/api/utils/response';

// Schema for split transaction creation
const createSplitTransactionSchema = z.object({
  date: z.string().datetime('Invalid date format'),
  baseAccountId: z.string().uuid('Invalid base account ID'),
  baseAccountSide: z.enum(['DEBIT', 'CREDIT'], {
    errorMap: () => ({ message: 'Base account side must be DEBIT or CREDIT' }),
  }),
  splits: z.array(z.object({
    accountId: z.string().uuid('Invalid account ID'),
    amount: z.number().positive('Amount must be positive'),
    description: z.string().min(1, 'Description is required'),
  })).min(1, 'At least one split is required'),
});

const getSplitTransactionsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  baseAccountId: z.string().uuid().optional(),
  reconciled: z.coerce.boolean().optional(),
});

const getAccountBalanceSchema = z.object({
  accountId: z.string().uuid('Invalid account ID'),
});

type CreateSplitTransactionInput = z.infer<typeof createSplitTransactionSchema>;
type GetSplitTransactionsInput = z.infer<typeof getSplitTransactionsSchema>;
type GetAccountBalanceInput = z.infer<typeof getAccountBalanceSchema>;

// GET /api/transactions/split - List split transactions
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    
    const validatedData = getSplitTransactionsSchema.parse(queryParams);
    const { page, limit, search, dateFrom, dateTo, baseAccountId, reconciled } = validatedData;
    const skip = (page - 1) * limit;
    
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7'; // Default org

    // Build where clause
    const where: any = { organizationId };
    if (reconciled !== undefined) where.reconciled = reconciled;
    if (baseAccountId) where.baseAccountId = baseAccountId;
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { splits: { path: '$', string_contains: search } },
      ];
    }

    // Get total count
    const total = await prisma.splitTransaction.count({ where });

    // Get split transactions
    const splitTransactions = await prisma.splitTransaction.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
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
        },
      },
    });

    return paginatedResponse(splitTransactions, total, page, limit);
  } catch (error) {
    console.error('Error fetching split transactions:', error);
    if (error instanceof z.ZodError) {
      return validationErrorResponse(error.errors);
    }
    return errorResponse('Failed to fetch split transactions', 500);
  }
}


// POST /api/transactions/split - Create split transaction
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = createSplitTransactionSchema.parse(body);
    
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7';
    
    // Validate base account exists
    const baseAccount = await prisma.holderAccount.findFirst({
      where: { 
        id: validatedData.baseAccountId,
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

    // Validate all split accounts exist and are different from base account
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
      s => s.accountId === validatedData.baseAccountId
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

    // Generate split transaction code
    const existingCount = await prisma.splitTransaction.count({
      where: { organizationId },
    });
    const code = `SPL-${String(existingCount + 1).padStart(4, '0')}`;

    // Create split transaction with individual transactions
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

      // Create split transaction record
      const splitTransaction = await tx.splitTransaction.create({
        data: {
          organizationId,
          date: new Date(validatedData.date),
          code,
          baseAccountId: validatedData.baseAccountId,
          baseAccountSide: validatedData.baseAccountSide,
          splits: validatedData.splits,
          totalAmount,
          reconciled: false,
        },
      });

      // Create individual transaction records for each split
      const transactions = [];
      for (const split of validatedData.splits) {
        const transaction = await tx.transaction.create({
          data: {
            organizationId,
            date: new Date(validatedData.date),
            number: `${code}-${String(validatedData.splits.indexOf(split) + 1).padStart(2, '0')}`,
            description: split.description,
            amount: split.amount,
            debitAccountId: validatedData.baseAccountSide === 'DEBIT'
              ? validatedData.baseAccountId
              : split.accountId,
            creditAccountId: validatedData.baseAccountSide === 'CREDIT'
              ? validatedData.baseAccountId
              : split.accountId,
            reconciled: false,
            splitTransactionId: splitTransaction.id,
          },
        });
        transactions.push(transaction);
      }

      // Update account balances for all transactions with correct accounting rules
      for (const transaction of transactions) {
        const debitAccountType = getAccountType(transaction.debitAccountId);
        const creditAccountType = getAccountType(transaction.creditAccountId);

        // ASSETS, EXPENSES: Debit increases, Credit decreases
        // LIABILITIES, EQUITY, REVENUE: Credit increases, Debit decreases

        // Update debit account
        if (debitAccountType === 'ASSETS' || debitAccountType === 'EXPENSES') {
          // Debit increases these accounts
          await tx.holderAccount.update({
            where: { id: transaction.debitAccountId },
            data: { balance: { increment: transaction.amount } },
          });
        } else {
          // Debit decreases Liabilities, Equity, Revenue
          await tx.holderAccount.update({
            where: { id: transaction.debitAccountId },
            data: { balance: { decrement: transaction.amount } },
          });
        }

        // Update credit account
        if (creditAccountType === 'LIABILITIES' || creditAccountType === 'EQUITY' || creditAccountType === 'REVENUE') {
          // Credit increases these accounts
          await tx.holderAccount.update({
            where: { id: transaction.creditAccountId },
            data: { balance: { increment: transaction.amount } },
          });
        } else {
          // Credit decreases Assets, Expenses
          await tx.holderAccount.update({
            where: { id: transaction.creditAccountId },
            data: { balance: { decrement: transaction.amount } },
          });
        }
      }

      return { splitTransaction, transactions };
    });

    return successResponse(result, 201);
  } catch (error) {
    console.error('Error creating split transaction:', error);
    if (error instanceof z.ZodError) {
      return validationErrorResponse(error.errors);
    }
    return errorResponse('Failed to create split transaction: ' + (error as Error).message, 500);
  }
}
