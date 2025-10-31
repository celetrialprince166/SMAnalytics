/**
 * Employee Sales Commissions API Endpoint
 * 
 * GET /api/employees/[id]/sales-commissions - Get commission data from sales
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, notFoundResponse } from '@/lib/api/utils/response';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Get organization ID (for now, use default)
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7';

    // Check if employee exists
    const employee = await prisma.employee.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!employee) {
      return notFoundResponse('Employee');
    }

    // Build where clause for sales representatives
    const where: any = {
      organizationId,
      employeeId: id,
    };

    // Add date filter if provided
    if (startDate || endDate) {
      where.salesEntry = {};
      if (startDate) {
        where.salesEntry.date = {
          gte: new Date(startDate),
        };
      }
      if (endDate) {
        where.salesEntry.date = {
          ...where.salesEntry.date,
          lte: new Date(endDate),
        };
      }
    }

    // Get sales representatives data with sales entry details
    const salesReps = await prisma.salesRepresentative.findMany({
      where,
      include: {
        salesEntry: {
          select: {
            id: true,
            date: true,
            salesValue: true,
            description: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Aggregate data by resource type
    const salesData = {
      sales: {
        count: 0,
        totalTarget: 0,
        totalRelevantSales: 0,
        totalCommission: 0,
        avgCommissionRate: 0,
        sales: [] as any[],
      },
      support: {
        count: 0,
        totalTarget: 0,
        totalRelevantSales: 0,
        totalCommission: 0,
        avgCommissionRate: 0,
        sales: [] as any[],
      },
      overall: {
        totalSales: 0,
        totalCommission: 0,
        salesCount: 0,
      },
    };

    salesReps.forEach((rep) => {
      const type = rep.resourceType.toLowerCase() as 'sales' | 'support';
      const data = salesData[type];

      data.count++;
      data.totalTarget += Number(rep.salesTarget);
      data.totalRelevantSales += Number(rep.relevantSales);
      data.totalCommission += Number(rep.commissionAmount);
      
      data.sales.push({
        saleId: rep.salesEntryId,
        saleDate: rep.salesEntry.date,
        description: rep.salesEntry.description,
        totalAmount: Number(rep.salesEntry.salesValue),
        stake: Number(rep.salesStake),
        relevantSales: Number(rep.relevantSales),
        commissionRate: Number(rep.commissionRate),
        commissionAmount: Number(rep.commissionAmount),
      });

      salesData.overall.totalSales += Number(rep.relevantSales);
      salesData.overall.totalCommission += Number(rep.commissionAmount);
      salesData.overall.salesCount++;
    });

    // Calculate average commission rates
    if (salesData.sales.count > 0) {
      const totalRate = salesReps
        .filter(r => r.resourceType === 'SALES')
        .reduce((sum, r) => sum + Number(r.commissionRate), 0);
      salesData.sales.avgCommissionRate = totalRate / salesData.sales.count;
    }

    if (salesData.support.count > 0) {
      const totalRate = salesReps
        .filter(r => r.resourceType === 'SUPPORT')
        .reduce((sum, r) => sum + Number(r.commissionRate), 0);
      salesData.support.avgCommissionRate = totalRate / salesData.support.count;
    }

    return successResponse({
      employee: {
        id: employee.id,
        employeeId: employee.employeeId,
        firstName: employee.firstName,
        surname: employee.surname,
      },
      salesData,
      dateRange: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
    });
  } catch (error: any) {
    console.error('Error fetching employee sales commissions:', error);
    return errorResponse('Failed to fetch sales commissions: ' + error.message, 500);
  }
}
