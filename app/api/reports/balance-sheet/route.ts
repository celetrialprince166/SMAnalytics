/**
 * Balance Sheet Report API Endpoints
 * 
 * Generates balance sheet reports (Statement of Financial Position)
 * 
 * ACCOUNTING PRINCIPLES:
 * - Asset accounts are DEBIT-NORMAL (balance = debits - credits)
 * - Liability accounts are CREDIT-NORMAL (balance = credits - debits)
 * - Equity accounts are CREDIT-NORMAL (balance = credits - debits)
 * - Balance Sheet Equation: Assets = Liabilities + Equity
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api/utils/response';

// Default organization ID for testing
const DEFAULT_ORGANIZATION_ID = '7224ab64-5bd7-4382-839d-6c415d872ba7';

// GET /api/reports/balance-sheet - Generate balance sheet report
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get('date');
    const organizationId = searchParams.get('organizationId') || DEFAULT_ORGANIZATION_ID;
    const includeUnreconciled = searchParams.get('includeUnreconciled') === 'true';

    // Parse date
    const date = dateStr ? new Date(dateStr) : new Date();

    // Validate date
    if (isNaN(date.getTime())) {
      return errorResponse('Invalid date format', 400);
    }

    // Build transaction where clause - optionally include unreconciled
    const transactionWhere = {
      ...(includeUnreconciled ? {} : { reconciled: true }),
      date: {
        lte: date,
      },
    };

    // Get assets using Prisma (DEBIT-NORMAL)
    const assetAccounts = await prisma.holderAccount.findMany({
      where: {
        isActive: true,
        secondaryAccount: {
          isActive: true,
          primaryAccount: {
            isActive: true,
            organizationId,
            type: 'ASSETS',
          },
        },
      },
      include: {
        secondaryAccount: {
          include: {
            primaryAccount: true,
          },
        },
        debitTransactions: {
          where: transactionWhere,
        },
        creditTransactions: {
          where: transactionWhere,
        },
      },
      orderBy: {
        code: 'asc',
      },
    });

    // Get liabilities using Prisma (CREDIT-NORMAL)
    const liabilityAccounts = await prisma.holderAccount.findMany({
      where: {
        isActive: true,
        secondaryAccount: {
          isActive: true,
          primaryAccount: {
            isActive: true,
            organizationId,
            type: 'LIABILITIES',
          },
        },
      },
      include: {
        secondaryAccount: {
          include: {
            primaryAccount: true,
          },
        },
        debitTransactions: {
          where: transactionWhere,
        },
        creditTransactions: {
          where: transactionWhere,
        },
      },
      orderBy: {
        code: 'asc',
      },
    });

    // Get equity using Prisma (CREDIT-NORMAL)
    const equityAccounts = await prisma.holderAccount.findMany({
      where: {
        isActive: true,
        secondaryAccount: {
          isActive: true,
          primaryAccount: {
            isActive: true,
            organizationId,
            type: 'EQUITY',
          },
        },
      },
      include: {
        secondaryAccount: {
          include: {
            primaryAccount: true,
          },
        },
        debitTransactions: {
          where: transactionWhere,
        },
        creditTransactions: {
          where: transactionWhere,
        },
      },
      orderBy: {
        code: 'asc',
      },
    });

    // Calculate balances for assets (DEBIT-NORMAL: balance = debits - credits)
    const assets = assetAccounts.map(account => {
      const debitTotal = account.debitTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
      const creditTotal = account.creditTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
      // Assets are DEBIT-NORMAL: positive balance when debits > credits
      const calculatedBalance = debitTotal - creditTotal;

      return {
        primary_account_name: account.secondaryAccount.primaryAccount.name,
        secondary_account_name: account.secondaryAccount.name,
        holder_account_name: account.name,
        holder_account_id: account.id,
        account_code: account.code,
        debit_total: debitTotal,
        credit_total: creditTotal,
        current_balance: Number(account.balance),
        calculated_balance: calculatedBalance,
      };
    });

    // Calculate balances for liabilities (CREDIT-NORMAL: balance = credits - debits)
    const liabilities = liabilityAccounts.map(account => {
      const debitTotal = account.debitTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
      const creditTotal = account.creditTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
      // Liabilities are CREDIT-NORMAL: positive balance when credits > debits
      const calculatedBalance = creditTotal - debitTotal;

      return {
        primary_account_name: account.secondaryAccount.primaryAccount.name,
        secondary_account_name: account.secondaryAccount.name,
        holder_account_name: account.name,
        holder_account_id: account.id,
        account_code: account.code,
        debit_total: debitTotal,
        credit_total: creditTotal,
        current_balance: Number(account.balance),
        calculated_balance: calculatedBalance,
      };
    });

    // Calculate balances for equity (CREDIT-NORMAL: balance = credits - debits)
    const equity = equityAccounts.map(account => {
      const debitTotal = account.debitTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
      const creditTotal = account.creditTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
      // Equity is CREDIT-NORMAL: positive balance when credits > debits
      const calculatedBalance = creditTotal - debitTotal;

      return {
        primary_account_name: account.secondaryAccount.primaryAccount.name,
        secondary_account_name: account.secondaryAccount.name,
        holder_account_name: account.name,
        holder_account_id: account.id,
        account_code: account.code,
        debit_total: debitTotal,
        credit_total: creditTotal,
        current_balance: Number(account.balance),
        calculated_balance: calculatedBalance,
      };
    });

    // Calculate totals
    const totalAssets = assets.reduce((sum, asset) => sum + asset.calculated_balance, 0);
    const totalLiabilities = liabilities.reduce((sum, liability) => sum + liability.calculated_balance, 0);
    const totalEquity = equity.reduce((sum, equityItem) => sum + equityItem.calculated_balance, 0);

    // Balance check: Assets should equal Liabilities + Equity
    const liabilitiesPlusEquity = totalLiabilities + totalEquity;
    const isBalanced = Math.abs(totalAssets - liabilitiesPlusEquity) < 0.01; // Allow for floating point errors

    return successResponse({
      assets: {
        accounts: assets,
        total: totalAssets,
      },
      liabilities: {
        accounts: liabilities,
        total: totalLiabilities,
      },
      equity: {
        accounts: equity,
        total: totalEquity,
      },
      totals: {
        totalAssets,
        totalLiabilities,
        totalEquity,
        liabilitiesPlusEquity,
        difference: totalAssets - liabilitiesPlusEquity,
        isBalanced,
      },
      reportDate: date,
      generatedAt: new Date().toISOString(),
      organizationId,
      includeUnreconciled,
      accountingNote: 'Assets are debit-normal (debits increase balance). Liabilities and Equity are credit-normal (credits increase balance). Assets should equal Liabilities + Equity.',
    });
  } catch (error: any) {
    console.error('Error generating balance sheet report:', error);
    return errorResponse(`Failed to generate balance sheet report: ${error.message}`, 500);
  }
}
