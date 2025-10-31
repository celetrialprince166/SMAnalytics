import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Simple POST /api/sales-simple - Create sales entry without complex transactions
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Received body:', JSON.stringify(body, null, 2));
    
    // Use default organization ID for now
    const defaultOrgId = '7224ab64-5bd7-4382-839d-6c415d872ba7';

    // Basic validation
    if (!body.date || !body.productId || !body.description || !body.salesValue || !body.costValue || !body.customerAccountId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Missing required fields',
            received: Object.keys(body)
          },
        },
        { status: 400 }
      );
    }

    // Get product
    const product = await prisma.product.findFirst({
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
    const sequence = Math.floor(Math.random() * 1000) + 1; // Simple random sequence for testing
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

    // Create Sales Entry ONLY (no transactions for now)
    const salesEntry = await prisma.salesEntry.create({
      data: {
        date: new Date(body.date),
        salesCode,
        productId: body.productId,
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
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: salesEntry,
      message: `Simple sales entry created: ${salesCode}`
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating simple sales entry:', error);
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










