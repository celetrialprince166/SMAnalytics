/**
 * Transactions API Endpoints
 * 
 * Handles CRUD operations for transactions
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  successResponse, 
  errorResponse, 
  validationErrorResponse
} from '@/lib/api/utils/response';
// Simplified approach without complex middleware chains

// GET /api/transactions - List transactions
export async function GET(req: NextRequest) {
  try {
    // Get organization ID (for now, use default)
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7'; // SNM Analytics Demo org ID
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      organizationId,
    };

    // Get transactions
    const transactions = await prisma.transaction.findMany({
      where,
      skip,
      take: limit,
      orderBy: { date: 'desc' },
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

    return successResponse(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return errorResponse('Failed to fetch transactions', 500);
  }
}

// POST /api/transactions - Create transaction
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Get organization ID (for now, use default)
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7'; // SNM Analytics Demo org ID

    // Validate required fields
    if (!body.debitAccountId || !body.creditAccountId || !body.amount || !body.description || !body.date) {
      return validationErrorResponse([{
        field: 'general',
        message: 'Debit account, credit account, amount, description, and date are required',
        code: 'REQUIRED',
      }]);
    }

    // Verify debit account exists and is active
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

    // Verify credit account exists and is active
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

    // Business rule: Debit and credit accounts must be different
    if (body.debitAccountId === body.creditAccountId) {
      return validationErrorResponse([{
        field: 'creditAccountId',
        message: 'Debit and credit accounts must be different',
        code: 'SAME_ACCOUNTS',
      }]);
    }

    // Determine transaction type for number generation
    const isPettyCash = body.isPettyCash || false;
    const transactionType = body.transactionType || (isPettyCash ? 'petty' : 'single');

    // Create transaction data (number will be generated inside transaction)
    const transactionData = {
      organizationId,
      date: new Date(body.date),
      number: body.number || '', // Will be set inside transaction
      description: body.description,
      amount: parseFloat(body.amount),
      debitAccountId: body.debitAccountId,
      creditAccountId: body.creditAccountId,
      reconciled: body.reconciled || false,
      isPettyCash: isPettyCash,
    };

    // Calculate date range for transaction number generation
    const date = body.date ? new Date(body.date) : new Date();
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Retry logic for unique constraint violations (outside of Prisma transaction)
    let transaction;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        // Create transaction using a transaction to ensure atomicity
        transaction = await prisma.$transaction(async (tx) => {
          // Generate unique transaction number atomically within the transaction
          let transactionNumber: string;

          if (body.number) {
            // Use provided number if given
            transactionNumber = body.number;
          } else {
            // Generate next sequential number atomically within the transaction

            // Get ALL existing transactions for this organization to determine next number
            // Note: The unique constraint is on (organizationId, number) so numbers must be globally unique
            const existingTransactions = await tx.transaction.findMany({
              where: {
                organizationId,
              },
              select: {
                number: true,
              },
              orderBy: {
                createdAt: 'desc',
              },
              take: 100, // Only check last 100 transactions for performance
            });

            // Parse max base number from existing transactions
            let maxBase = 0;
            const baseCounts: Record<number, number> = {};

            for (const transaction of existingTransactions) {
              try {
                const num = parseFloat(transaction.number);
                if (!isNaN(num) && isFinite(num)) {
                  const base = Math.floor(num);
                  const decimal = Math.round((num - base) * 100);

                  maxBase = Math.max(maxBase, base);

                  // Track children count for each base
                  if (decimal > 0) {
                    baseCounts[base] = Math.max(baseCounts[base] || 0, decimal);
                  }
                }
                // Skip non-numeric transaction numbers (like "TEST-001", "SPL-TEST-02")
              } catch (error) {
                console.error('Error parsing transaction number:', transaction.number, error);
              }
            }

            // Generate next number based on type
            // Add retry count to ensure uniqueness on retries
            if (transactionType === 'single') {
              // For single transactions, return next base with .00
              const nextBase = maxBase + 1 + retryCount;
              transactionNumber = `${nextBase}.00`;
            } else if (transactionType === 'split' || transactionType === 'petty') {
              // For split/petty cash, we need to return the base number
              // The children will be numbered as base.01, base.02, etc.
              const nextBase = maxBase + 1 + retryCount;
              transactionNumber = `${nextBase}.01`;
            } else {
              // Fallback
              transactionNumber = `${maxBase + 1 + retryCount}.00`;
            }
          }

      // Create transaction data with generated number
      const finalTransactionData = {
        ...transactionData,
        number: transactionNumber,
      };

      // Pre-load all account types at the beginning of the transaction
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

          // Create the transaction record
          const newTransaction = await tx.transaction.create({
            data: finalTransactionData,
          });

          // Create audit entry immediately after transaction creation (while transaction context is still valid)
          await tx.auditEntry.create({
        data: {
          organizationId,
          transactionId: newTransaction.id,
          action: 'CREATE',
          timestamp: new Date(),
          newValues: {
            date: newTransaction.date,
            number: newTransaction.number,
            description: newTransaction.description,
            amount: newTransaction.amount,
            debitAccountId: newTransaction.debitAccountId,
            creditAccountId: newTransaction.creditAccountId,
            reconciled: newTransaction.reconciled,
          },
        },
      });

      // Update account balances with proper accounting rules
      const amount = parseFloat(body.amount);
      const debitAccountType = getAccountType(body.debitAccountId);
      const creditAccountType = getAccountType(body.creditAccountId);

      // ASSETS, EXPENSES: Debit increases, Credit decreases
      // LIABILITIES, EQUITY, REVENUE: Credit increases, Debit decreases

      // Update debit account
      if (debitAccountType === 'ASSETS' || debitAccountType === 'EXPENSES') {
        // Debit increases these accounts
        await tx.holderAccount.update({
          where: { id: body.debitAccountId },
          data: { balance: { increment: amount } },
        });
      } else {
        // Debit decreases Liabilities, Equity, Revenue
        await tx.holderAccount.update({
          where: { id: body.debitAccountId },
          data: { balance: { decrement: amount } },
        });
      }

      // Update credit account
      if (creditAccountType === 'LIABILITIES' || creditAccountType === 'EQUITY' || creditAccountType === 'REVENUE') {
        // Credit increases these accounts
        await tx.holderAccount.update({
          where: { id: body.creditAccountId },
          data: { balance: { increment: amount } },
        });
      } else {
        // Credit decreases Assets, Expenses
        await tx.holderAccount.update({
          where: { id: body.creditAccountId },
          data: { balance: { decrement: amount } },
        });
      }

          return newTransaction;
        });

        // If we get here, transaction was successful
        break;

      } catch (error: any) {
        if (error.code === 'P2002' && error.meta?.target?.includes('number')) {
          // Unique constraint violation on number field
          retryCount++;
          if (retryCount >= maxRetries) {
            console.error(`Failed to create transaction after ${maxRetries} retries`);
            throw error; // Give up after max retries
          }
          
          console.log(`Retry ${retryCount}: Regenerating transaction number due to unique constraint violation`);
          
          // Add small delay to reduce race condition probability
          await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
          
          // Loop will retry with fresh transaction number generation
        } else {
          // Re-throw non-unique constraint errors immediately
          throw error;
        }
      }
    }

    return successResponse(transaction, 201);
  } catch (error: any) {
    console.error('Error creating transaction:', error);
    return errorResponse('Failed to create transaction: ' + error.message, 500);
  }
}




