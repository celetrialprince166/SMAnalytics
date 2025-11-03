/**
 * Signup API
 *
 * Handles user registration with Supabase and database
 * POST /api/auth/signup
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/auth/supabase';
import { prisma } from '@/lib/prisma';

type UserRole = 'ADMIN' | 'MANAGER' | 'ACCOUNTANT' | 'USER';

/**
 * Map access code level to UserRole enum
 */
function mapLevelToRole(level: string): UserRole {
  const mapping: Record<string, UserRole> = {
    USER_1: 'USER',
    USER_2: 'ACCOUNTANT',
    ADMIN: 'ADMIN',
    SUPER_USER: 'ADMIN',
    MANAGER: 'MANAGER',
    ACCOUNTANT: 'ACCOUNTANT',
    USER: 'USER',
  };
  return mapping[level] || 'USER';
}

/**
 * Generate unique username from email
 */
async function generateUniqueUsername(email: string): Promise<string> {
  let username = email.split('@')[0].toLowerCase();
  let counter = 1;

  while (await prisma.user.findUnique({ where: { username } })) {
    username = `${email.split('@')[0].toLowerCase()}${counter}`;
    counter++;
  }

  return username;
}

export async function POST(request: NextRequest) {
  try {
    const { email, accessCode, password } = await request.json();

    // Validate inputs
    if (!email || !accessCode || !password) {
      return NextResponse.json(
        { error: 'Email, access code, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Validate access code (using composite index for fast lookup)
    const code = await prisma.accessCode.findFirst({
      where: {
        email: email.toLowerCase(),
        code: accessCode.toUpperCase(),
        isUsed: false,
      },
    });

    if (!code || (code.expiresAt && code.expiresAt < new Date())) {
      return NextResponse.json(
        { error: 'Invalid or expired access code' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      );
    }

    // Create Supabase auth user
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: email.toLowerCase(),
        password,
        email_confirm: true,
        user_metadata: {
          name: code.name,
          organizationId: code.organizationId,
        },
      });

    if (authError) {
      console.error('Supabase auth error:', authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Generate unique username
    const username = await generateUniqueUsername(email);

    // Map role
    const role = mapLevelToRole(code.level);

    try {
      // Create user record + mark code as used (transaction for atomicity)
      await prisma.$transaction([
        prisma.user.create({
          data: {
            id: authData.user.id,
            email: email.toLowerCase(),
            username,
            passwordHash: 'managed_by_supabase',
            organizationId: code.organizationId,
            role,
            firstName: code.name,
            isActive: true,
          },
        }),
        prisma.accessCode.update({
          where: { id: code.id },
          data: { isUsed: true, usedAt: new Date() },
        }),
      ]);

      return NextResponse.json({
        success: true,
        message: 'Account created successfully',
      });
    } catch (dbError) {
      // Rollback: Delete Supabase user if database creation fails
      console.error('Database error, rolling back:', dbError);
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);

      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
