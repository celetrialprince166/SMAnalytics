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
    let serviceRevenueAccountId = null;
    
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

      // Find or create holder account for this service under "Sales" secondary account
      // First, find the "Sales" secondary account
      const salesSecondaryAccount = await prisma.secondaryAccount.findFirst({
        where: {
          organizationId: defaultOrgId,
          name: 'Sales',
          isActive: true,
        },
      });

      if (!salesSecondaryAccount) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Sales secondary account not found. Please create it first.',
            },
          },
          { status: 400 }
        );
      }

      // Check if holder account exists for this service
      const serviceAccountName = `${service.name} Revenue`;
      let serviceRevenueAccount = await prisma.holderAccount.findFirst({
        where: {
          organizationId: defaultOrgId,
          secondaryAccountId: salesSecondaryAccount.id,
          name: serviceAccountName,
          isActive: true,
        },
      });

      // If not found, create it
      if (!serviceRevenueAccount) {
        // Get the count of existing holder accounts under Sales to generate code
        const existingCount = await prisma.holderAccount.count({
          where: {
            organizationId: defaultOrgId,
            secondaryAccountId: salesSecondaryAccount.id,
          },
        });

        const holderCode = `${salesSecondaryAccount.code}-${String(existingCount + 1).padStart(3, '0')}`;

        serviceRevenueAccount = await prisma.holderAccount.create({
          data: {
            organizationId: defaultOrgId,
            secondaryAccountId: salesSecondaryAccount.id,
            code: holderCode,
            name: serviceAccountName,
            description: `Revenue account for ${service.name}`,
            balance: 0,
            isActive: true,
          },
        });

        console.log(`Auto-created holder account: ${serviceAccountName} (${holderCode})`);
      }

      serviceRevenueAccountId = serviceRevenueAccount.id;
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

    // Generate sales code
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
    
    // Generate transaction numbers using the same logic as normal transactions (decimal format)
    // Get ALL existing transactions to determine next number
    const existingTransactions = await prisma.transaction.findMany({
      where: {
        organizationId: defaultOrgId,
      },
      select: {
        number: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // Only check last 100 transactions for performance
    });

    // Parse max base number from existing transactions
    let maxBase = 0;
    for (const transaction of existingTransactions) {
      try {
        const num = parseFloat(transaction.number);
        if (!isNaN(num) && isFinite(num)) {
          const base = Math.floor(num);
          maxBase = Math.max(maxBase, base);
        }
      } catch (error) {
        console.error('Error parsing transaction number:', transaction.number, error);
      }
    }

    // Generate next transaction numbers in decimal format
    const costTransactionNumber = `${maxBase + 1}.00`;
    const salesTransactionNumber = `${maxBase + 2}.00`;

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
      } else if (service && serviceRevenueAccountId) {
        // Service-based transactions
        // For services, we only create the revenue transaction (no inventory/cost of sales)
        salesTransaction = await tx.transaction.create({
          data: {
            organizationId: defaultOrgId,
            date: new Date(body.date),
            number: salesTransactionNumber,
            description: `Service Revenue - ${body.description}`,
            amount: totalWithVat,
            debitAccountId: body.customerAccountId,
            creditAccountId: serviceRevenueAccountId, // Use the auto-created service revenue account
          }
        });
      }

      console.log('Transactions created successfully');

      // Update account balances using proper double-entry accounting rules
      // Helper function to calculate balance change based on account type
      const calculateBalanceChange = (accountType: string, amount: number, side: 'debit' | 'credit'): number => {
        // ASSETS, EXPENSES: Debit increases, Credit decreases
        // LIABILITIES, EQUITY, REVENUE: Credit increases, Debit decreases
        
        if (side === 'debit') {
          if (accountType === 'ASSETS' || accountType === 'EXPENSES') {
            return amount; // Increase
          } else {
            return -amount; // Decrease
          }
        } else {
          // Credit side
          if (accountType === 'LIABILITIES' || accountType === 'EQUITY' || accountType === 'REVENUE') {
            return amount; // Increase
          } else {
            return -amount; // Decrease
          }
        }
      };

      // Update cost transaction balances (if exists)
      if (costTransaction) {
        // Fetch account types to determine proper balance changes
        const [costDebitAccount, costCreditAccount] = await Promise.all([
          tx.holderAccount.findUnique({
            where: { id: costTransaction.debitAccountId },
            include: {
              secondaryAccount: {
                include: {
                  primaryAccount: true
                }
              }
            }
          }),
          tx.holderAccount.findUnique({
            where: { id: costTransaction.creditAccountId },
            include: {
              secondaryAccount: {
                include: {
                  primaryAccount: true
                }
              }
            }
          })
        ]);

        if (costDebitAccount && costCreditAccount) {
          const debitAccountType = costDebitAccount.secondaryAccount?.primaryAccount?.type || 'ASSETS';
          const creditAccountType = costCreditAccount.secondaryAccount?.primaryAccount?.type || 'ASSETS';

          // Cost of Sales (Debit) - EXPENSES account increases
          const debitChange = calculateBalanceChange(debitAccountType, costTransaction.amount, 'debit');
          await tx.holderAccount.update({
            where: { id: costTransaction.debitAccountId },
            data: { balance: { increment: debitChange } }
          });

          // Inventory (Credit) - ASSETS account decreases
          const creditChange = calculateBalanceChange(creditAccountType, costTransaction.amount, 'credit');
          await tx.holderAccount.update({
            where: { id: costTransaction.creditAccountId },
            data: { balance: { increment: creditChange } }
          });

          console.log('Cost transaction balances updated:', {
            debit: { type: debitAccountType, change: debitChange },
            credit: { type: creditAccountType, change: creditChange }
          });
        }
      }

      // Update sales transaction balances
      if (salesTransaction) {
        // Fetch account types to determine proper balance changes
        const [salesDebitAccount, salesCreditAccount] = await Promise.all([
          tx.holderAccount.findUnique({
            where: { id: salesTransaction.debitAccountId },
            include: {
              secondaryAccount: {
                include: {
                  primaryAccount: true
                }
              }
            }
          }),
          tx.holderAccount.findUnique({
            where: { id: salesTransaction.creditAccountId },
            include: {
              secondaryAccount: {
                include: {
                  primaryAccount: true
                }
              }
            }
          })
        ]);

        if (salesDebitAccount && salesCreditAccount) {
          const debitAccountType = salesDebitAccount.secondaryAccount?.primaryAccount?.type || 'ASSETS';
          const creditAccountType = salesCreditAccount.secondaryAccount?.primaryAccount?.type || 'REVENUE';

          // Customer Account (Debit) - ASSETS account increases
          const debitChange = calculateBalanceChange(debitAccountType, salesTransaction.amount, 'debit');
          await tx.holderAccount.update({
            where: { id: salesTransaction.debitAccountId },
            data: { balance: { increment: debitChange } }
          });

          // Revenue Account (Credit) - REVENUE account increases
          const creditChange = calculateBalanceChange(creditAccountType, salesTransaction.amount, 'credit');
          await tx.holderAccount.update({
            where: { id: salesTransaction.creditAccountId },
            data: { balance: { increment: creditChange } }
          });

          console.log('Sales transaction balances updated:', {
            debit: { type: debitAccountType, change: debitChange },
            credit: { type: creditAccountType, change: creditChange }
          });
        }
      }

      console.log('Account balances updated successfully using double-entry accounting rules');

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