/**
 * Balance Sheet Report API Endpoints
 * 
 * Generates balance sheet reports
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getBalanceSheetSchema, GetBalanceSheetInput } from '@/lib/validation/schemas';
import { successResponse, errorResponse } from '@/lib/api/utils/response';
import { withAuth } from '@/lib/api/middleware/auth';
import { withValidation } from '@/lib/api/middleware/validation';
import { withRateLimit } from '@/lib/api/middleware/rateLimit';
import { withRequestLogging } from '@/lib/api/middleware/requestLogging';

// GET /api/reports/balance-sheet - Generate balance sheet report
export const GET = withRequestLogging(
  withRateLimit()(
    withAuth(
      withValidation(getBalanceSheetSchema)(
        async (req: NextRequest, context: { validated: GetBalanceSheetInput }) => {
          try {
            const validatedData = context.validated;
            const { date, organizationId } = validatedData;

            // Get assets
            const assets = await prisma.$queryRaw<Array<{
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
                ha.balance as current_balance,
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
                AND t.date <= ${date}
              WHERE pa.organization_id = ${organizationId}
                AND pa.type = 'ASSETS'
                AND pa.is_active = true
                AND sa.is_active = true
                AND ha.is_active = true
              GROUP BY pa.name, sa.name, ha.name, ha.code, ha.balance
              ORDER BY sa.code, ha.code
            `;

            // Get liabilities
            const liabilities = await prisma.$queryRaw<Array<{
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
                ha.balance as current_balance,
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
                AND t.date <= ${date}
              WHERE pa.organization_id = ${organizationId}
                AND pa.type = 'LIABILITIES'
                AND pa.is_active = true
                AND sa.is_active = true
                AND ha.is_active = true
              GROUP BY pa.name, sa.name, ha.name, ha.code, ha.balance
              ORDER BY sa.code, ha.code
            `;

            // Get equity
            const equity = await prisma.$queryRaw<Array<{
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
                ha.balance as current_balance,
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
                AND t.date <= ${date}
              WHERE pa.organization_id = ${organizationId}
                AND pa.type = 'EQUITY'
                AND pa.is_active = true
                AND sa.is_active = true
                AND ha.is_active = true
              GROUP BY pa.name, sa.name, ha.name, ha.code, ha.balance
              ORDER BY sa.code, ha.code
            `;

            // Calculate totals
            const totalAssets = assets.reduce((sum: number, asset: any) => sum + parseFloat(asset.calculated_balance || 0), 0);
            const totalLiabilities = liabilities.reduce((sum: number, liability: any) => sum + parseFloat(liability.calculated_balance || 0), 0);
            const totalEquity = equity.reduce((sum: number, equityItem: any) => sum + parseFloat(equityItem.calculated_balance || 0), 0);

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
                balance: totalAssets - (totalLiabilities + totalEquity),
              },
              reportDate: date,
              generatedAt: new Date().toISOString(),
              organizationId,
            });
          } catch (error) {
            console.error('Error generating balance sheet report:', error);
            return errorResponse('Failed to generate balance sheet report', 500);
          }
        }
      )
    )
  )
);















