/**
 * Signup API
 * 
 * Handles user registration with Supabase and database
 * POST /api/auth/signup
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/auth/supabase';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { userId, accessCode, username, email, password, confirmPassword } = await request.json();

    // Validate inputs
    if (!userId || !accessCode || !username || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      );
    }

    // For now, we'll create a default organization and access code validation
    // TODO: Implement proper access code validation when database is ready
    let organizationId = 'default-org-id';
    
    // Try to find existing organization or create default
    try {
      const org = await prisma.organization.findFirst({
        where: { slug: 'default-org' },
      });
      
      if (org) {
        organizationId = org.id;
      } else {
        const newOrg = await prisma.organization.create({
          data: {
            name: 'Default Organization',
            slug: 'default-org',
          },
        });
        organizationId = newOrg.id;
      }
    } catch (error) {
      console.log('Organization creation skipped, using default ID');
    }

    // Create Supabase auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        username,
        organizationId,
      },
    });

    if (authError) {
      console.error('Supabase auth error:', authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    // Create user in database
    const user = await prisma.user.create({
      data: {
        id: authData.user.id,
        email,
        username,
        passwordHash: 'managed_by_supabase', // Placeholder
        organizationId,
        role: 'USER', // Default role
        firstName: username, // Use username as firstName for now
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
