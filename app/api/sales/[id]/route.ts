/**
 * Sales Entry by ID API Endpoints
 * 
 * Handles individual sales entry operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// GET /api/sales/[id] - Get sales entry by ID
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const defaultOrgId = '7224ab64-5bd7-4382-839d-6c415d872ba7';

    const salesEntry = await prisma.salesEntry.findFirst({
      where: { 
        id,
        organizationId: defaultOrgId,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            code: true,
            unitPrice: true,
          },
        },
      },
    });

    if (!salesEntry) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Sales entry not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: salesEntry,
    });
  } catch (error) {
    console.error('Error fetching sales entry:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to fetch sales entry',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

// PUT /api/sales/[id] - Update sales entry (with transaction updates)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const defaultOrgId = '7224ab64-5bd7-4382-839d-6c415d872ba7';

    // Check if sales entry exists and is not reconciled
    const existingSalesEntry = await prisma.salesEntry.findFirst({
      where: { 
        id,
        organizationId: defaultOrgId,
      },
    });

    if (!existingSalesEntry) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Sales entry not found',
          },
        },
        { status: 404 }
      );
    }

    // Note: Reconciled check temporarily disabled until database migration

    // Calculate VAT if applicable
    let vatAmount = existingSalesEntry.vatAmount;
    let totalWithVat = existingSalesEntry.totalWithVat;
    if (body.applyVat !== undefined && body.applyVat && body.vatRate) { 
      const salesValue = body.salesValue !== undefined ? Number(body.salesValue) : Number(existingSalesEntry.salesValue);
      const calculatedVatAmount = (salesValue * Number(body.vatRate)) / 100;
      vatAmount = new Prisma.Decimal(calculatedVatAmount);
      totalWithVat = new Prisma.Decimal(salesValue + calculatedVatAmount);
    }

    // Use transaction to update sales entry and related transactions
    const result = await prisma.$transaction(async (tx) => {
      // Update the sales entry
      const updatedSalesEntry = await tx.salesEntry.update({
        where: { id },
        data: {
          date: body.date ? new Date(body.date) : undefined,
          productId: body.productId,
          description: body.description,
          salesValue: body.salesValue ? parseFloat(body.salesValue) : undefined,
          costValue: body.costValue ? parseFloat(body.costValue) : undefined,
          customerAccountId: body.customerAccountId,
          applyVat: body.applyVat,
          vatRate: body.applyVat ? parseFloat(body.vatRate) : null,
          vatAmount: body.applyVat ? vatAmount : null,
          totalWithVat: body.applyVat ? totalWithVat : null,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              code: true,
              unitPrice: true,
            },
          },
        },
      });

      // Update related transactions if values changed
      if (body.salesValue !== undefined || body.costValue !== undefined || body.description !== undefined) {
        // Update cost transaction
        const costTransaction = await tx.transaction.findFirst({
          where: {
            organizationId: defaultOrgId,
            number: existingSalesEntry.costTransactionNumber,
          }
        });

        if (costTransaction) {
          await tx.transaction.update({
            where: { id: costTransaction.id },
            data: {
              description: `Cost of Sales - ${body.description || existingSalesEntry.description}`,
              amount: body.costValue ? parseFloat(body.costValue) : costTransaction.amount,
              reconciled: body.reconciled !== undefined ? body.reconciled : costTransaction.reconciled,
            }
          });
        }

        // Update sales transaction
        const salesTransaction = await tx.transaction.findFirst({
          where: {
            organizationId: defaultOrgId,
            number: existingSalesEntry.salesTransactionNumber,
          }
        });

        if (salesTransaction) {
          await tx.transaction.update({
            where: { id: salesTransaction.id },
            data: {
              description: `Sales - ${body.description || existingSalesEntry.description}`,
              amount: totalWithVat || salesTransaction.amount,
              reconciled: body.reconciled !== undefined ? body.reconciled : salesTransaction.reconciled,
            }
          });
        }
      }

      return updatedSalesEntry;
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Sales entry and related transactions updated successfully'
    });
  } catch (error) {
    console.error('Error updating sales entry:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to update sales entry',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

// DELETE /api/sales/[id] - Delete sales entry (with transaction reversals)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const defaultOrgId = '7224ab64-5bd7-4382-839d-6c415d872ba7';

    // Check if sales entry exists and is not reconciled
    const existingSalesEntry = await prisma.salesEntry.findFirst({
      where: { 
        id,
        organizationId: defaultOrgId,
      },
      include: {
        product: true,
      }
    });

    if (!existingSalesEntry) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Sales entry not found',
          },
        },
        { status: 404 }
      );
    }

    // Note: Reconciled check temporarily disabled until database migration

    // Use transaction to reverse all related operations
    await prisma.$transaction(async (tx) => {
      // 1. Reverse account balances
      await tx.holderAccount.update({
        where: { id: existingSalesEntry.product.costOfSalesAccountId },
        data: { balance: { decrement: existingSalesEntry.costValue } }
      });
      await tx.holderAccount.update({
        where: { id: existingSalesEntry.product.inventoryAccountId },
        data: { balance: { increment: existingSalesEntry.costValue } }
      });
      await tx.holderAccount.update({
        where: { id: existingSalesEntry.customerAccountId },
        data: { balance: { decrement: existingSalesEntry.totalWithVat || existingSalesEntry.salesValue } }
      });
      await tx.holderAccount.update({
        where: { id: existingSalesEntry.product.salesAccountId },
        data: { balance: { decrement: existingSalesEntry.salesValue } }
      });

      // 2. Reverse VAT account balance if applicable
      if (existingSalesEntry.vatAmount && Number(existingSalesEntry.vatAmount) > 0) {
        const vatAccount = await tx.holderAccount.findFirst({
          where: { 
            organizationId: defaultOrgId,
            name: { contains: 'VAT', mode: 'insensitive' }
          }
        });
        
        if (vatAccount) {
          await tx.holderAccount.update({
            where: { id: vatAccount.id },
            data: { balance: { decrement: existingSalesEntry.vatAmount } }
          });
        }
      }

      // 3. Delete related transactions
      const costTransaction = await tx.transaction.findFirst({
        where: {
          organizationId: defaultOrgId,
          number: existingSalesEntry.costTransactionNumber,
        }
      });

      if (costTransaction) {
        await tx.transaction.delete({ where: { id: costTransaction.id } });
      }

      const salesTransaction = await tx.transaction.findFirst({
        where: {
          organizationId: defaultOrgId,
          number: existingSalesEntry.salesTransactionNumber,
        }
      });

      if (salesTransaction) {
        await tx.transaction.delete({ where: { id: salesTransaction.id } });
      }

      // Delete VAT transaction if it exists
      if (existingSalesEntry.vatAmount && Number(existingSalesEntry.vatAmount) > 0) {
        const vatTransaction = await tx.transaction.findFirst({
          where: {
            organizationId: defaultOrgId,
            description: { contains: `VAT on Sales - ${existingSalesEntry.description}` }
          }
        });

        if (vatTransaction) {
          await tx.transaction.delete({ where: { id: vatTransaction.id } });
        }
      }

      // 4. Delete the sales entry
      await tx.salesEntry.delete({
        where: { id },
      });
    });

    return NextResponse.json({
      success: true,
      data: null,
      message: 'Sales entry and all related transactions deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting sales entry:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to delete sales entry',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}