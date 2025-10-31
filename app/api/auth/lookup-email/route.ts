/**
 * Email Lookup API
 * 
 * Looks up user email from username for authentication
 * POST /api/auth/lookup-email
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Look up user by username
    const user = await prisma.user.findUnique({
      where: { username },
      select: { email: true, isActive: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is inactive' },
        { status: 403 }
      );
    }

    return NextResponse.json({ email: user.email });
  } catch (error) {
    console.error('Email lookup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
