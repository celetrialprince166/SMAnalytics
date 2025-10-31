import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { userId, accessCode } = await request.json();

    if (!userId || !accessCode) {
      return NextResponse.json(
        { error: 'User ID and Access Code are required' },
        { status: 400 }
      );
    }

    // Find the access code in the database
    const codeRecord = await prisma.accessCode.findFirst({
      where: {
        code: accessCode,
        userId: userId,
        isUsed: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
    });

    if (!codeRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired access code' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      level: codeRecord.level,
      name: codeRecord.name,
      organizationId: codeRecord.organizationId,
    });
  } catch (error) {
    console.error('Validate access code error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}




