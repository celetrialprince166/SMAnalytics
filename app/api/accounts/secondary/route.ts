import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/accounts/secondary
 * Get all secondary accounts
 */
export async function GET(request: NextRequest) {
  try {
    // For now, get all secondary accounts (TODO: Add auth middleware)
    // Get all secondary accounts
    const secondaryAccounts = await prisma.secondaryAccount.findMany({
      where: {
        isActive: true,
      },
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
