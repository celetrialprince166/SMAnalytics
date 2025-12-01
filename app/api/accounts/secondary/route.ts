import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/accounts/secondary
 * Get all secondary accounts, optionally filtered by primaryAccountId
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const primaryAccountId = searchParams.get('primaryAccountId');
    
    // Build where clause
    const where: any = {
      isActive: true,
    };
    
    // Filter by primaryAccountId if provided
    if (primaryAccountId) {
      where.primaryAccountId = primaryAccountId;
    }
    
    // Get secondary accounts with optional filter
    const secondaryAccounts = await prisma.secondaryAccount.findMany({
      where,
      include: {
        primaryAccount: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: [
        { code: 'asc' },
      ],
    });

    // Transform to match expected format
    const transformed = secondaryAccounts.map((account) => ({
      id: account.id,
      code: account.code,
      name: account.name,
      description: account.description,
      primaryAccountId: account.primaryAccountId,
      primaryAccount: account.primaryAccount,
      isActive: account.isActive,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: transformed,
    });
  } catch (error) {
    console.error('Error fetching secondary accounts:', error);
    return NextResponse.json(
      {
        error: {
          message: 'Failed to fetch secondary accounts',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
