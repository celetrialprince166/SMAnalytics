/**
 * Sales Report API Endpoints (Simplified)
 * 
 * Generates sales reports without complex middleware
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api/utils/response';

// Default organization ID for testing
const DEFAULT_ORGANIZATION_ID = '7224ab64-5bd7-4382-839d-6c415d872ba7';

// GET /api/reports/sales - Generate sales report
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const productId = searchParams.get('productId');
    const organizationId = searchParams.get('organizationId') || DEFAULT_ORGANIZATION_ID;

    // Build where clause for sales entries
    const whereClause: any = {
      organizationId: organizationId,
    };

    if (dateFrom || dateTo) {
      whereClause.date = {};
      if (dateFrom) whereClause.date.gte = new Date(dateFrom);
      if (dateTo) whereClause.date.lte = new Date(dateTo);
    }

    // Get sales entries with optimized includes
    const salesEntries = await prisma.salesEntry.findMany({
      where: whereClause,
      select: {
        id: true,
        organizationId: true,
        date: true,
        salesCode: true,
        productId: true,
        serviceId: true,
        description: true,
        salesValue: true,
        costValue: true,
        customerAccountId: true,
        costTransactionNumber: true,
        salesTransactionNumber: true,
        invoiceNumber: true,
        applyVat: true,
        vatRate: true,
        vatAmount: true,
        totalWithVat: true,
        orderNumber: true,
        dueDate: true,
        createdAt: true,
        updatedAt: true,
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
            serviceLineId: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Filter by product if specified
    const filteredSalesEntries = productId 
      ? salesEntries.filter(entry => entry.productId === productId)
      : salesEntries;

    // Get unique customer account IDs from sales entries (these are holder account IDs)
    const customerAccountIds = [...new Set(filteredSalesEntries.map(entry => entry.customerAccountId).filter(Boolean))];

    // Fetch all holder accounts (customer accounts) in one optimized query
    const customerAccounts = customerAccountIds.length > 0 
      ? await prisma.holderAccount.findMany({
          where: {
            id: { in: customerAccountIds },
            organizationId: organizationId,
          },
          select: {
            id: true,
            name: true,
            code: true,
          },
        })
      : [];

    // Create a map for quick account name lookup
    const accountNameMap = new Map(customerAccounts.map(account => [account.id, account.name]));

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

    // Map sales entries to include customer account names (holder account names)
    const salesEntriesWithClients = filteredSalesEntries.map(entry => ({
      ...entry,
      clientName: accountNameMap.get(entry.customerAccountId) || null,
    }));

    return successResponse({
      salesEntries: salesEntriesWithClients,
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
