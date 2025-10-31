/**
 * Prisma Primary Account Repository
 * 
 * Mirrors functionality of existing PrimaryAccountRepository
 * Reference: lib/repositories/AccountRepository.ts (lines 11-29)
 */

import { PrismaBaseRepository } from './PrismaBaseRepository';
import { PrimaryAccount, Prisma } from '@prisma/client';

export class PrismaPrimaryAccountRepository extends PrismaBaseRepository<PrimaryAccount> {
  protected modelName: Prisma.ModelName = 'PrimaryAccount';

  /**
   * Find accounts by type
   * 
   * Mirrors: PrimaryAccountRepository.findByType()
   */
  async findByType(type: string): Promise<PrimaryAccount[]> {
    return this.findAll({
      type: type as any,
      isActive: true,
    });
  }

  /**
   * Get account hierarchy with counts
   */
  async getAccountsWithCounts(): Promise<any[]> {
    const delegate = this.getDelegate();
    
    return delegate.findMany({
      where: this.addOrgFilter({ isActive: true }),
      include: {
        _count: {
          select: {
            secondaryAccounts: true,
          },
        },
      },
    });
  }
}















