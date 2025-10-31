/**
 * Prisma Secondary Account Repository
 * 
 * Mirrors functionality of existing SecondaryAccountRepository
 * Reference: lib/repositories/AccountRepository.ts (lines 31-64)
 */

import { PrismaBaseRepository } from './PrismaBaseRepository';
import { SecondaryAccount, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export class PrismaSecondaryAccountRepository extends PrismaBaseRepository<SecondaryAccount> {
  protected modelName: Prisma.ModelName = 'SecondaryAccount';

  /**
   * Find accounts by primary account
   * 
   * Mirrors: SecondaryAccountRepository.findByPrimaryAccount()
   */
  async findByPrimaryAccount(primaryAccountId: string): Promise<SecondaryAccount[]> {
    return this.findAll({
      primaryAccountId,
      isActive: true,
    });
  }

  /**
   * Find account by code
   * 
   * Mirrors: SecondaryAccountRepository.findByCode()
   */
  async findByCode(code: string): Promise<SecondaryAccount | null> {
    const delegate = this.getDelegate();
    const where = this.addOrgFilter({ code });
    return delegate.findUnique({ where });
  }

  /**
   * Generate next account code
   * 
   * Mirrors: SecondaryAccountRepository.generateCode()
   * Uses Supabase function for code generation
   */
  async generateCode(primaryAccountId: string): Promise<string> {
    if (!this.organizationId) {
      throw new Error('Organization ID is required for code generation');
    }

    // Use Supabase function
    const result = await prisma.$queryRaw<{ code: string }[]>`
      SELECT generate_account_code(
        ${primaryAccountId}::uuid,
        ${this.organizationId}::uuid
      ) as code
    `;

    return result[0]?.code || '';
  }
}















