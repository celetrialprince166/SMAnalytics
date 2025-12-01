/**
 * Profit & Loss Report API Endpoints
 * 
 * Generates profit and loss reports
 * 
 * ACCOUNTING PRINCIPLES:
 * - Revenue/Income accounts are CREDIT-NORMAL (balance = credits - debits)
 * - Expense accounts are DEBIT-NORMAL (balance = debits - credits)
 * - Net Income = Total Revenue - Total Expenses
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api/utils/response';

// Default organization ID for testing
const DEFAULT_ORGANIZATION_ID = '7224ab64-5bd7-4382-839d-6c415d872ba7';

// GET /api/reports/profit-loss - Generate profit and loss report
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateFromStr = searchParams.get('dateFrom');
    const dateToStr = searchParams.get('dateTo');
    const organizationId = searchParams.get('organizationId') || DEFAULT_ORGANIZATION_ID;
    const includeUnreconciled = searchParams.get('includeUnreconciled') === 'true';

    // Parse dates
    const dateFrom = dateFromStr ? new Date(dateFromStr) : new Date(new Date().getFullYear(), 0, 1);
    const dateTo = dateToStr ? new Date(dateToStr) : new Date();

    // Validate dates
    if (isNaN(dateFrom.getTime()) || isNaN(dateTo.getTime())) {
      return errorResponse('Invalid date format', 400);
    }

    // Build transaction where clause - optionally include unreconciled
    const transactionWhere = {
      ...(includeUnreconciled ? {} : { reconciled: true }),
      date: {
        gte: dateFrom,
        lte: dateTo,
      },
    };

    // Get revenue/income accounts (both REVENUE and INCOME types)
    // These are CREDIT-NORMAL accounts
    const revenueAccounts = await prisma.holderAccount.findMany({
      where: {
        isActive: true,
        secondaryAccount: {
          isActive: true,
          primaryAccount: {
            isActive: true,
            organizationId,
            type: { in: ['REVENUE', 'INCOME'] }, // Query both types
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

    // Get expense accounts
    // These are DEBIT-NORMAL accounts
    const expenseAccounts = await prisma.holderAccount.findMany({
      where: {
        isActive: true,
        secondaryAccount: {
          isActive: true,
          primaryAccount: {
            isActive: true,
            organizationId,
            type: 'EXPENSES',
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

    // Calculate balances for revenue (CREDIT-NORMAL: balance = credits - debits)
    const revenue = revenueAccounts.map(account => {
      const debitTotal = account.debitTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
      const creditTotal = account.creditTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
      // Revenue is CREDIT-NORMAL: positive balance when credits > debits
      const calculatedBalance = creditTotal - debitTotal;

      return {
        primary_account_name: account.secondaryAccount.primaryAccount.name,
        secondary_account_name: account.secondaryAccount.name,
        holder_account_name: account.name,
        holder_account_id: account.id,
        account_code: account.code,
        debit_total: debitTotal,
        credit_total: creditTotal,
        calculated_balance: calculatedBalance,
      };
    });

    // Calculate balances for expenses (DEBIT-NORMAL: balance = debits - credits)
    const expenses = expenseAccounts.map(account => {
      const debitTotal = account.debitTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
      const creditTotal = account.creditTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
      // Expenses are DEBIT-NORMAL: positive balance when debits > credits
      const calculatedBalance = debitTotal - creditTotal;

      return {
        primary_account_name: account.secondaryAccount.primaryAccount.name,
        secondary_account_name: account.secondaryAccount.name,
        holder_account_name: account.name,
        holder_account_id: account.id,
        account_code: account.code,
        debit_total: debitTotal,
        credit_total: creditTotal,
        calculated_balance: calculatedBalance,
      };
    });

    // Calculate totals
    const totalRevenue = revenue.reduce((sum, item) => sum + item.calculated_balance, 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + item.calculated_balance, 0);
    const netIncome = totalRevenue - totalExpenses;

    return successResponse({
      revenue: {
        accounts: revenue,
        total: totalRevenue,
      },
      expenses: {
        accounts: expenses,
        total: totalExpenses,
      },
      summary: {
        totalRevenue,
        totalExpenses,
        netIncome,
        profitMargin: totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0,
      },
      reportPeriod: {
        dateFrom,
        dateTo,
      },
      generatedAt: new Date().toISOString(),
      organizationId,
      includeUnreconciled,
      accountingNote: 'Revenue accounts are credit-normal (credits increase balance). Expense accounts are debit-normal (debits increase balance).',
    });
  } catch (error: any) {
    console.error('Error generating profit and loss report:', error);
    return errorResponse(`Failed to generate profit and loss report: ${error.message}`, 500);
  }
}
