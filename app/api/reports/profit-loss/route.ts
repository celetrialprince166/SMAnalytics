/**
 * Profit & Loss Report API Endpoints
 * 
 * Generates profit and loss reports
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getProfitLossSchema, GetProfitLossInput } from '@/lib/validation/schemas';
import { successResponse, errorResponse } from '@/lib/api/utils/response';
import { withAuth } from '@/lib/api/middleware/auth';
import { withValidation } from '@/lib/api/middleware/validation';
import { withRateLimit } from '@/lib/api/middleware/rateLimit';
import { withRequestLogging } from '@/lib/api/middleware/requestLogging';

// GET /api/reports/profit-loss - Generate profit and loss report
export const GET = withRequestLogging(
  withRateLimit()(
    withAuth(
      withValidation(getProfitLossSchema)(
        async (req: NextRequest, context: { validated: GetProfitLossInput }) => {
          try {
            const validatedData = context.validated;
            const { dateFrom, dateTo, organizationId } = validatedData;

            // Get revenue accounts
            const revenue = await prisma.$queryRaw<Array<{
              primary_account_name: string;
              secondary_account_name: string;
              holder_account_name: string;
              account_code: string;
              current_balance: number;
              calculated_balance: string | number;
            }>>`
              SELECT 
                pa.name as primary_account_name,
                sa.name as secondary_account_name,
                ha.name as holder_account_name,
                ha.code as account_code,
                COALESCE(
                  SUM(
                    CASE 
                      WHEN t.debit_account_id = ha.id THEN t.amount
                      WHEN t.credit_account_id = ha.id THEN -t.amount
                      ELSE 0
                    END
                  ), 0
                ) as calculated_balance
              FROM primary_accounts pa
              JOIN secondary_accounts sa ON pa.id = sa.primary_account_id
              JOIN holder_accounts ha ON sa.id = ha.secondary_account_id
              LEFT JOIN transactions t ON (t.debit_account_id = ha.id OR t.credit_account_id = ha.id)
                AND t.reconciled = true
                AND t.date >= ${dateFrom}
                AND t.date <= ${dateTo}
              WHERE pa.organization_id = ${organizationId}
                AND pa.type = 'REVENUE'
                AND pa.is_active = true
                AND sa.is_active = true
                AND ha.is_active = true
              GROUP BY pa.name, sa.name, ha.name, ha.code
              ORDER BY sa.code, ha.code
            `;

            // Get expense accounts
            const expenses = await prisma.$queryRaw<Array<{
              primary_account_name: string;
              secondary_account_name: string;
              holder_account_name: string;
              account_code: string;
              calculated_balance: string | number;
            }>>`
              SELECT 
                pa.name as primary_account_name,
                sa.name as secondary_account_name,
                ha.name as holder_account_name,
                ha.code as account_code,
                COALESCE(
                  SUM(
                    CASE 
                      WHEN t.debit_account_id = ha.id THEN t.amount
                      WHEN t.credit_account_id = ha.id THEN -t.amount
                      ELSE 0
                    END
                  ), 0
                ) as calculated_balance
              FROM primary_accounts pa
              JOIN secondary_accounts sa ON pa.id = sa.primary_account_id
              JOIN holder_accounts ha ON sa.id = ha.secondary_account_id
              LEFT JOIN transactions t ON (t.debit_account_id = ha.id OR t.credit_account_id = ha.id)
                AND t.reconciled = true
                AND t.date >= ${dateFrom}
                AND t.date <= ${dateTo}
              WHERE pa.organization_id = ${organizationId}
                AND pa.type = 'EXPENSES'
                AND pa.is_active = true
                AND sa.is_active = true
                AND ha.is_active = true
              GROUP BY pa.name, sa.name, ha.name, ha.code
              ORDER BY sa.code, ha.code
            `;

            // Calculate totals
            const totalRevenue = revenue.reduce((sum: number, item: any) => sum + parseFloat(item.calculated_balance || 0), 0);
            const totalExpenses = expenses.reduce((sum: number, item: any) => sum + parseFloat(item.calculated_balance || 0), 0);
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
            });
          } catch (error) {
            console.error('Error generating profit and loss report:', error);
            return errorResponse('Failed to generate profit and loss report', 500);
          }
        }
      )
    )
  )
);















