/**
 * Demo Email Lookup API
 * 
 * Simplified version for testing without full database setup
 * POST /api/auth/lookup-email-demo
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Demo response - in real implementation this would query the database
    if (username === 'demo') {
      return NextResponse.json({ email: 'demo@example.com' });
    }

    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Email lookup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



