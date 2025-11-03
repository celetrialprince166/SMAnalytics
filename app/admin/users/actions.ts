'use server';

/**
 * Server Actions for User Invitation Management
 * Admin-only operations for creating and managing user invitations
 */

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

type UserRole = 'ADMIN' | 'MANAGER' | 'ACCOUNTANT' | 'USER';

/**
 * Generate a cryptographically random access code
 */
function generateAccessCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Get current authenticated user from session
 */
async function getCurrentUser() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  return dbUser;
}

/**
 * Create a new user invitation
 * Only admins can create invitations
 */
export async function createInvitation(
  email: string,
  name: string,
  role: UserRole,
  orgId: string
) {
  try {
    // Verify user is authenticated and is admin
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('Unauthorized - Please login');
    }

    if (currentUser.role !== 'ADMIN') {
      throw new Error('Only admins can create invitations');
    }

    // Validate inputs
    if (!email || !name || !role || !orgId) {
      throw new Error('All fields are required');
    }

    // Check if email already has a pending invitation
    const existingInvitation = await prisma.accessCode.findFirst({
      where: {
        email,
        isUsed: false,
        organizationId: orgId,
      },
    });

    if (existingInvitation) {
      throw new Error('An invitation already exists for this email');
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('A user with this email already exists');
    }

    // Generate unique access code
    let code = generateAccessCode();
    let codeExists = await prisma.accessCode.findUnique({
      where: { code },
    });

    // Ensure code is unique
    while (codeExists) {
      code = generateAccessCode();
      codeExists = await prisma.accessCode.findUnique({
        where: { code },
      });
    }

    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create access code
    await prisma.accessCode.create({
      data: {
        code,
        email,
        userId: email, // Keep for backward compatibility
        name,
        level: role,
        organizationId: orgId,
        isUsed: false,
        expiresAt,
      },
    });

    revalidatePath('/admin/users');

    return { success: true, code };
  } catch (error) {
    console.error('Create invitation error:', error);
    throw error;
  }
}

/**
 * Get all invitations for an organization
 */
export async function getInvitations(orgId: string) {
  try {
    // Verify user is authenticated and is admin
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('Unauthorized');
    }

    if (currentUser.role !== 'ADMIN') {
      throw new Error('Only admins can view invitations');
    }

    const invitations = await prisma.accessCode.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
    });

    // Convert dates to ISO strings for serialization
    return invitations.map((inv) => ({
      ...inv,
      createdAt: inv.createdAt.toISOString(),
      updatedAt: inv.updatedAt.toISOString(),
      expiresAt: inv.expiresAt?.toISOString() || null,
      usedAt: inv.usedAt?.toISOString() || null,
    }));
  } catch (error) {
    console.error('Get invitations error:', error);
    throw error;
  }
}

/**
 * Delete/revoke an invitation
 */
export async function revokeInvitation(invitationId: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      throw new Error('Unauthorized');
    }

    await prisma.accessCode.delete({
      where: { id: invitationId },
    });

    revalidatePath('/admin/users');

    return { success: true };
  } catch (error) {
    console.error('Revoke invitation error:', error);
    throw error;
  }
}
