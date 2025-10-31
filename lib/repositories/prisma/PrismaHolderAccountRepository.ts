/**
 * Prisma Holder Account Repository
 * 
 * Mirrors functionality of existing HolderAccountRepository
 * Reference: lib/repositories/AccountRepository.ts (lines 66-152)
 */

import { PrismaBaseRepository } from './PrismaBaseRepository';
import { HolderAccount, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export class PrismaHolderAccountRepository extends PrismaBaseRepository<HolderAccount> {
  protected modelName: Prisma.ModelName = 'HolderAccount';

  /**
   * Find accounts by secondary account
   * 
   * Mirrors: HolderAccountRepository.findBySecondaryAccount()
   */
  async findBySecondaryAccount(secondaryAccountId: string): Promise<HolderAccount[]> {
    return this.findAll({
      secondaryAccountId,
      isActive: true,
    });
  }

  /**
   * Find account by code
   * 
   * Mirrors: HolderAccountRepository.findByCode()
   */
  async findByCode(code: string): Promise<HolderAccount | null> {
    const delegate = this.getDelegate();
    const where = this.addOrgFilter({ code });
    return delegate.findUnique({ where });
  }

  /**
   * Generate next account code
   * 
   * Mirrors: HolderAccountRepository.generateCode()
   */
  async generateCode(secondaryAccountId: string): Promise<string> {
    if (!this.organizationId) {
      throw new Error('Organization ID is required for code generation');
    }

    // Use Supabase function
    const result = await prisma.$queryRaw<{ code: string }[]>`
      SELECT generate_account_code(
        ${secondaryAccountId}::uuid,
        ${this.organizationId}::uuid
      ) as code
    `;

    return result[0]?.code || '';
  }

  /**
   * Update account balance
   * 
   * Mirrors: HolderAccountRepository.updateBalance()
   */
  async updateBalance(accountId: string, amount: number, isDebit: boolean): Promise<void> {
    const delegate = this.getDelegate();
    const where = this.addOrgFilter({ id: accountId });

    const newBalance = isDebit ? amount : -amount;

    await delegate.update({
      where,
      data: {
        balance: {
          increment: newBalance,
        },
      },
    });
  }

  /**
   * Get account balance
   * 
   * Mirrors: HolderAccountRepository.getBalance()
   */
  async getBalance(accountId: string, asOfDate?: Date): Promise<number> {
    const account = await this.findById(accountId);
    if (!account) {
      return 0;
    }

    // If no date specified, return current balance
    if (!asOfDate) {
      return Number(account.balance);
    }

    // Calculate balance as of specific date by replaying transactions
    // This will be implemented when transaction repository is ready
    return Number(account.balance);
  }

  /**
   * Search accounts by query
   * 
   * Mirrors: HolderAccountRepository.search()
   */
  async search(query: string): Promise<HolderAccount[]> {
    const delegate = this.getDelegate();
    const where = this.addOrgFilter({
      isActive: true,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { code: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    });

    return delegate.findMany({ where });
  }

  /**
   * Get account with full hierarchy
   */
  async findByIdWithHierarchy(id: string): Promise<any> {
    const delegate = this.getDelegate();
    const where = this.addOrgFilter({ id });

    return delegate.findUnique({
      where,
      include: {
        secondaryAccount: {
          include: {
            primaryAccount: true,
          },
        },
      },
    });
  }

  /**
   * Get accounts with transaction counts
   */
  async findAllWithStats(): Promise<any[]> {
    const delegate = this.getDelegate();
    const where = this.addOrgFilter({ isActive: true });

    return delegate.findMany({
      where,
      include: {
        _count: {
          select: {
            debitTransactions: true,
            creditTransactions: true,
          },
        },
        secondaryAccount: {
          select: {
            name: true,
            code: true,
            primaryAccount: {
              select: {
                name: true,
                type: true,
              },
            },
          },
        },
      },
      orderBy: {
        code: 'asc',
      },
    });
  }
}















