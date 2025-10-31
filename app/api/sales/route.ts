/**
 * Sales Entries API Endpoints
 * 
 * Handles CRUD operations for sales entries
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/sales - List sales entries
export async function GET(req: NextRequest) {
  try {
    // Use default organization ID for now
    const defaultOrgId = '7224ab64-5bd7-4382-839d-6c415d872ba7';

    const url = new URL(req.url);
    const search = url.searchParams.get('search');
    
    // Build where clause
    const where: any = {
      organizationId: defaultOrgId,
    };
    
    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { salesCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get sales entries
    const salesEntries = await prisma.salesEntry.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            code: true,
            unitPrice: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            code: true,
            averageFee: true,
            serviceLine: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      take: 100, // Limit for performance
    });

    // Enrich with customer account details
    const enrichedEntries = await Promise.all(
      salesEntries.map(async (entry) => {
        const customerAccount = await prisma.holderAccount.findUnique({
          where: { id: entry.customerAccountId },
          include: {
            secondaryAccount: {
              select: {
                id: true,
                name: true,
                code: true,
              }
            }
          }
        });
        
        return {
          ...entry,
          customerAccount: {
            secondaryAccount: customerAccount?.secondaryAccount,
            holderAccount: customerAccount,
          }
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        data: enrichedEntries,
        meta: {
          total: enrichedEntries.length,
          page: 1,
          limit: 100,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching sales entries:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to fetch sales entries',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/sales - Create sales entry with automatic transaction creation
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Use default organization ID for now
    const defaultOrgId = '7224ab64-5bd7-4382-839d-6c415d872ba7';

    // Basic validation - Either productId OR serviceId must be provided
    if (!body.date || (!body.productId && !body.serviceId) || !body.description || !body.salesValue || !body.costValue || !body.customerAccountId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Missing required fields. Either product or service must be selected.',
          },
        },
        { status: 400 }
      );
    }

    // Get product with account IDs (if productId is provided)
    let product = null;
    if (body.productId) {
      product = await prisma.product.findFirst({
        where: {
          id: body.productId,
          organizationId: defaultOrgId,
          isActive: true,
        },
      });

      if (!product) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Product not found or inactive',
            },
          },
          { status: 400 }
        );
      }
    }

    // Get service (if serviceId is provided)
    let service = null;
    if (body.serviceId) {
      service = await prisma.service.findFirst({
        where: {
          id: body.serviceId,
          organizationId: defaultOrgId,
          isActive: true,
        },
      });

      if (!service) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Service not found or inactive',
            },
          },
          { status: 400 }
        );
      }
    }

    // Verify customer account exists
    const customerAccount = await prisma.holderAccount.findFirst({
      where: {
        id: body.customerAccountId,
        organizationId: defaultOrgId,
        isActive: true,
      },
    });

    if (!customerAccount) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Customer account not found or inactive',
          },
        },
        { status: 400 }
      );
    }

    // Generate sales code and transaction numbers
    const today = new Date(body.date);
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    // Get the last sales entry for today
    const lastEntry = await prisma.salesEntry.findFirst({
      where: {
        organizationId: defaultOrgId,
        date: {
          gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
          lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let sequence = 1;
    if (lastEntry) {
      // Extract sequence from last sales code
      const codeParts = lastEntry.salesCode.split('-');
      if (codeParts.length >= 3) {
        sequence = parseInt(codeParts[2]) + 1;
      }
    }

    const salesCode = `S-${dateStr}-${sequence.toString().padStart(3, '0')}`;
    const costTransactionNumber = `CT-${dateStr}-${sequence.toString().padStart(3, '0')}`;
    const salesTransactionNumber = `ST-${dateStr}-${sequence.toString().padStart(3, '0')}`;

    // Calculate VAT if applicable
    let vatAmount = 0;
    let totalWithVat = parseFloat(body.salesValue);
    if (body.applyVat && body.vatRate) {
      vatAmount = (parseFloat(body.salesValue) * parseFloat(body.vatRate)) / 100;
      totalWithVat = parseFloat(body.salesValue) + vatAmount;
    }

    // Simplified transaction logic to avoid timeouts
    const result = await prisma.$transaction(async (tx) => {
      console.log('Starting simplified transaction for sales entry creation...');

      // 1. Create Sales Entry first
      const salesEntry = await tx.salesEntry.create({
        data: {
          date: new Date(body.date),
          salesCode,
          productId: body.productId || null,
          serviceId: body.serviceId || null,
          description: body.description,
          salesValue: parseFloat(body.salesValue),
          costValue: parseFloat(body.costValue),
          customerAccountId: body.customerAccountId,
          costTransactionNumber,
          salesTransactionNumber,
          applyVat: body.applyVat || false,
          vatRate: body.applyVat ? parseFloat(body.vatRate) : null,
          vatAmount: body.applyVat ? vatAmount : null,
          totalWithVat: body.applyVat ? totalWithVat : null,
          organizationId: defaultOrgId,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              code: true,
              unitPrice: true,
            }
          },
          service: {
            select: {
              id: true,
              name: true,
              code: true,
              averageFee: true,
            }
          }
        }
      });
      
      console.log('Sales entry created:', salesEntry.id);

      // 2. Create essential transactions (simplified)
      let costTransaction = null;
      let salesTransaction = null;

      if (product) {
        // Product-based transactions
        costTransaction = await tx.transaction.create({
          data: {
            organizationId: defaultOrgId,
            date: new Date(body.date),
            number: costTransactionNumber,
            description: `Cost of Sales - ${body.description}`,
            amount: parseFloat(body.costValue),
            debitAccountId: product.costOfSalesAccountId,
            creditAccountId: product.inventoryAccountId,
          }
        });

        salesTransaction = await tx.transaction.create({
          data: {
            organizationId: defaultOrgId,
            date: new Date(body.date),
            number: salesTransactionNumber,
            description: `Sales - ${body.description}`,
            amount: totalWithVat,
            debitAccountId: body.customerAccountId,
            creditAccountId: product.salesAccountId,
          }
        });
      } else if (service) {
        // Service-based transactions - simplified for now
        // For services, we typically don't have inventory, so we'll create a simpler transaction structure
        salesTransaction = await tx.transaction.create({
          data: {
            organizationId: defaultOrgId,
            date: new Date(body.date),
            number: salesTransactionNumber,
            description: `Service Revenue - ${body.description}`,
            amount: totalWithVat,
            debitAccountId: body.customerAccountId,
            creditAccountId: body.customerAccountId, // Using customer account for both sides as placeholder
          }
        });
      }

      console.log('Transactions created successfully');

      // Update account balances for all transactions (consistent with transaction API)
      if (costTransaction) {
        // Cost of Sales: Update both debit and credit accounts
        await tx.holderAccount.update({
          where: { id: costTransaction.debitAccountId },
          data: { balance: { increment: costTransaction.amount } }
        });

        await tx.holderAccount.update({
          where: { id: costTransaction.creditAccountId },
          data: { balance: { increment: costTransaction.amount } }
        });
      }

      if (salesTransaction) {
        // Sales: Update both debit and credit accounts
        await tx.holderAccount.update({
          where: { id: salesTransaction.debitAccountId },
          data: { balance: { increment: salesTransaction.amount } }
        });

        await tx.holderAccount.update({
          where: { id: salesTransaction.creditAccountId },
          data: { balance: { increment: salesTransaction.amount } }
        });
      }

      console.log('Account balances updated successfully');

      return {
        salesEntry,
        transactions: [costTransaction, salesTransaction].filter(t => t !== null)
      };
    }, {
      timeout: 10000, // 10 second timeout
    });

    return NextResponse.json({
      success: true,
      data: result.salesEntry,
      message: `Sales entry created: ${salesCode} with ${result.transactions.length} transactions`
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating sales entry:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to create sales entry',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}