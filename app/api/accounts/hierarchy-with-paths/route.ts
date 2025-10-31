/**
 * Optimized Account Hierarchy Endpoint with Paths
 * 
 * GET /api/accounts/hierarchy-with-paths - Get all accounts with their full paths in ONE call
 * This eliminates N+1 query problem by computing all paths server-side
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api/utils/response';

export async function GET(req: NextRequest) {
  try {
    const organizationId = '7224ab64-5bd7-4382-839d-6c415d872ba7';

    // Fetch all account levels in parallel
    const [primaryAccounts, secondaryAccounts, holderAccounts] = await Promise.all([
      prisma.primaryAccount.findMany({
        where: { organizationId, isActive: true },
        select: { id: true, name: true, type: true },
        orderBy: { name: 'asc' },
      }),
      prisma.secondaryAccount.findMany({
        where: { organizationId, isActive: true },
        select: { id: true, name: true, code: true, primaryAccountId: true },
        orderBy: { name: 'asc' },
      }),
      prisma.holderAccount.findMany({
        where: { organizationId, isActive: true },
        select: {
          id: true,
          name: true,
          code: true,
          description: true,
          balance: true,
          secondaryAccountId: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { name: 'asc' },
      }),
    ]);

    // Create lookup maps for O(1) access
    const primaryMap = new Map(primaryAccounts.map(p => [p.id, p]));
    const secondaryMap = new Map(secondaryAccounts.map(s => [s.id, s]));

    // Compute all paths in one go
    const holderAccountsWithPaths = holderAccounts.map(holder => {
      const secondary = secondaryMap.get(holder.secondaryAccountId);
      if (!secondary) {
        return { ...holder, path: holder.name };
      }

      const primary = primaryMap.get(secondary.primaryAccountId);
      if (!primary) {
        return { ...holder, path: `${secondary.name} > ${holder.name}` };
      }

      return {
        ...holder,
        path: `${primary.name} > ${secondary.name} > ${holder.name}`,
        primaryAccountId: primary.id,
        primaryAccountName: primary.name,
        primaryAccountType: primary.type,
        secondaryAccountName: secondary.name,
      };
    });

    return successResponse({
      primary: primaryAccounts,
      secondary: secondaryAccounts,
      holder: holderAccountsWithPaths,
    });
  } catch (error) {
    console.error('Error fetching account hierarchy with paths:', error);
    return errorResponse('Failed to fetch account hierarchy', 500);
  }
}

