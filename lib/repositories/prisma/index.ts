/**
 * Prisma Repositories Export
 * 
 * Central export point for all Prisma repositories
 */

export { PrismaBaseRepository } from './PrismaBaseRepository';
export { PrismaPrimaryAccountRepository } from './PrismaPrimaryAccountRepository';
export { PrismaSecondaryAccountRepository } from './PrismaSecondaryAccountRepository';
export { PrismaHolderAccountRepository } from './PrismaHolderAccountRepository';

// Repository instances (to be instantiated with organization context)
import { PrismaPrimaryAccountRepository } from './PrismaPrimaryAccountRepository';
import { PrismaSecondaryAccountRepository } from './PrismaSecondaryAccountRepository';
import { PrismaHolderAccountRepository } from './PrismaHolderAccountRepository';

// Factory function to create repositories with organization context
export function createPrismaRepositories(organizationId: string) {
  return {
    primaryAccount: new PrismaPrimaryAccountRepository().setOrganizationId(organizationId),
    secondaryAccount: new PrismaSecondaryAccountRepository().setOrganizationId(organizationId),
    holderAccount: new PrismaHolderAccountRepository().setOrganizationId(organizationId),
  };
}















