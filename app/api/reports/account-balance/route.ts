/**
 * Account Balance Report API Endpoints
 * 
 * Generates account balance reports
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAccountBalanceReportSchema, GetAccountBalanceReportInput } from '@/lib/validation/schemas';
import { successResponse, errorResponse } from '@/lib/api/utils/response';
import { withAuth } from '@/lib/api/middleware/auth';
import { withValidation } from '@/lib/api/middleware/validation';
import { withRateLimit } from '@/lib/api/middleware/rateLimit';
import { withRequestLogging } from '@/lib/api/middleware/requestLogging';

// GET /api/reports/account-balance - Generate account balance report
export const GET = withRequestLogging(
  withRateLimit()(
    withAuth(
      withValidation(getAccountBalanceReportSchema)(
        async (req: NextRequest, context: { validated: GetAccountBalanceReportInput }) => {
          try {
            const validatedData = context.validated;
            const { dateFrom, dateTo, accountId, organizationId } = validatedData;

            // Build where clause for transactions
            const transactionWhere: any = {
              organizationId: organizationId,
              reconciled: true,
            };

            if (dateFrom || dateTo) {
              transactionWhere.date = {};
              if (dateFrom) transactionWhere.date.gte = dateFrom;
              if (dateTo) transactionWhere.date.lte = dateTo;
            }

            if (accountId) {
              transactionWhere.OR = [
                { debitAccountId: accountId },
                { creditAccountId: accountId },
              ];
            }

            // Get account balances using raw SQL for better performance
            const accountBalances = await prisma.$queryRaw`
              SELECT 
                ha.id,
                ha.name,
                ha.code,
                ha.balance,
                sa.name as secondary_account_name,
                sa.code as secondary_account_code,
                pa.name as primary_account_name,
                pa.code as primary_account_code,
                pa.type as primary_account_type,
                COALESCE(
                  SUM(
                    CASE 
                      WHEN t.debit_account_id = ha.id THEN t.amount
                      WHEN t.credit_account_id = ha.id THEN -t.amount
                      ELSE 0
                    END
                  ), 0
                ) as calculated_balance
              FROM holder_accounts ha
              JOIN secondary_accounts sa ON ha.secondary_account_id = sa.id
              JOIN primary_accounts pa ON sa.primary_account_id = pa.id
              LEFT JOIN transactions t ON (t.debit_account_id = ha.id OR t.credit_account_id = ha.id)
                AND t.reconciled = true
                ${dateFrom ? prisma.$queryRaw`AND t.date >= ${dateFrom}` : prisma.$queryRaw``}
                ${dateTo ? prisma.$queryRaw`AND t.date <= ${dateTo}` : prisma.$queryRaw``}
              WHERE ha.organization_id = ${organizationId}
                AND ha.is_active = true
                ${accountId ? prisma.$queryRaw`AND ha.id = ${accountId}` : prisma.$queryRaw``}
              GROUP BY ha.id, ha.name, ha.code, ha.balance, sa.name, sa.code, pa.name, pa.code, pa.type
              ORDER BY pa.type, sa.code, ha.code
            `;

            // Calculate summary by account type
            const summary = await prisma.$queryRaw`
              SELECT 
                pa.type,
                COUNT(ha.id) as account_count,
                SUM(ha.balance) as total_balance,
                SUM(
                  COALESCE(
                    SUM(
                      CASE 
                        WHEN t.debit_account_id = ha.id THEN t.amount
                        WHEN t.credit_account_id = ha.id THEN -t.amount
                        ELSE 0
                      END
                    ), 0
                  )
                ) as calculated_total
              FROM primary_accounts pa
              JOIN secondary_accounts sa ON pa.id = sa.primary_account_id
              JOIN holder_accounts ha ON sa.id = ha.secondary_account_id
              LEFT JOIN transactions t ON (t.debit_account_id = ha.id OR t.credit_account_id = ha.id)
                AND t.reconciled = true
                ${dateFrom ? prisma.$queryRaw`AND t.date >= ${dateFrom}` : prisma.$queryRaw``}
                ${dateTo ? prisma.$queryRaw`AND t.date <= ${dateTo}` : prisma.$queryRaw``}
              WHERE pa.organization_id = ${organizationId}
                AND pa.is_active = true
                AND sa.is_active = true
                AND ha.is_active = true
                ${accountId ? prisma.$queryRaw`AND ha.id = ${accountId}` : prisma.$queryRaw``}
              GROUP BY pa.type
              ORDER BY pa.type
            `;

            return successResponse({
              accountBalances,
              summary,
              reportDate: new Date().toISOString(),
              filters: {
                dateFrom,
                dateTo,
                accountId,
                organizationId,
              },
            });
          } catch (error) {
            console.error('Error generating account balance report:', error);
            return errorResponse('Failed to generate account balance report', 500);
          }
        }
      )
    )
  )
);















