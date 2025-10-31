/**
 * Sales Report API Endpoints
 * 
 * Generates sales reports
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSalesReportSchema, GetSalesReportInput } from '@/lib/validation/schemas';
import { successResponse, errorResponse } from '@/lib/api/utils/response';
import { withAuth } from '@/lib/api/middleware/auth';
import { withValidation } from '@/lib/api/middleware/validation';
import { withRateLimit } from '@/lib/api/middleware/rateLimit';
import { withRequestLogging } from '@/lib/api/middleware/requestLogging';

// GET /api/reports/sales - Generate sales report
export const GET = withRequestLogging(
  withRateLimit()(
    withAuth(
      withValidation(getSalesReportSchema)(
        async (req: NextRequest, context: { validated: GetSalesReportInput }) => {
          try {
            const validatedData = context.validated;
            const { dateFrom, dateTo, productId, organizationId } = validatedData;

            // Build where clause for sales entries
            const whereClause: any = {
              organizationId: organizationId,
            };

            if (dateFrom || dateTo) {
              whereClause.date = {};
              if (dateFrom) whereClause.date.gte = dateFrom;
              if (dateTo) whereClause.date.lte = dateTo;
            }

            // Get sales entries
            const salesEntries = await prisma.salesEntry.findMany({
              where: whereClause,
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                    category: true,
                  },
                },
                service: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                  },
                },
              },
              orderBy: { date: 'desc' },
            });

            // Filter by product if specified
            const filteredSalesEntries = productId 
              ? salesEntries.filter(entry => entry.productId === productId)
              : salesEntries;

            // Calculate summary statistics
            const totalSales = filteredSalesEntries.reduce((sum, entry) => 
              sum + Number(entry.salesValue), 0
            );
            const totalWithVat = filteredSalesEntries.reduce((sum, entry) => 
              sum + Number(entry.totalWithVat || entry.salesValue), 0
            );

            // Group by product
            const productSummary = filteredSalesEntries.reduce((acc, entry) => {
              if (entry.product) {
                const productKey = entry.product.id;
                if (!acc[productKey]) {
                  acc[productKey] = {
                    product: entry.product,
                    totalAmount: 0,
                    salesCount: 0,
                  };
                }
                acc[productKey].totalAmount += Number(entry.salesValue);
                acc[productKey].salesCount += 1;
              }
              return acc;
            }, {} as Record<string, any>);

            // Group by date
            const dailySummary = filteredSalesEntries.reduce((acc, entry) => {
              const dateKey = entry.date.toISOString().split('T')[0];
              if (!acc[dateKey]) {
                acc[dateKey] = {
                  date: dateKey,
                  totalSales: 0,
                  salesCount: 0,
                };
              }
              acc[dateKey].totalSales += Number(entry.salesValue);
              acc[dateKey].salesCount += 1;
              return acc;
            }, {} as Record<string, any>);

            return successResponse({
              salesEntries: filteredSalesEntries,
              summary: {
                totalSales,
                totalWithVat,
                salesCount: filteredSalesEntries.length,
                averageSaleAmount: filteredSalesEntries.length > 0 ? totalSales / filteredSalesEntries.length : 0,
              },
              productSummary: Object.values(productSummary),
              dailySummary: Object.values(dailySummary).sort((a: any, b: any) => a.date.localeCompare(b.date)),
              reportPeriod: {
                dateFrom,
                dateTo,
              },
              generatedAt: new Date().toISOString(),
              organizationId,
            });
          } catch (error) {
            console.error('Error generating sales report:', error);
            return errorResponse('Failed to generate sales report', 500);
          }
        }
      )
    )
  )
);















