/**
 * Account Service
 * 
 * Business logic for account management operations
 */

import {
  PrimaryAccount,
  SecondaryAccount,
  HolderAccount,
  AccountHierarchy,
  CreateHolderAccountRequest,
  UpdateHolderAccountRequest,
  AccountOption,
} from '@/types';
import {
  primaryAccountRepository,
  secondaryAccountRepository,
  holderAccountRepository,
} from '../repositories';

export class AccountService {
  private static instance: AccountService;

  private constructor() {}

  public static getInstance(): AccountService {
    if (!AccountService.instance) {
      AccountService.instance = new AccountService();
    }
    return AccountService.instance;
  }

  /**
   * Get complete account hierarchy
   */
  async getAccountHierarchy(): Promise<AccountHierarchy> {
    const [primary, secondary, holder] = await Promise.all([
      primaryAccountRepository.findAll(),
      secondaryAccountRepository.findAll(),
      holderAccountRepository.findAll(),
    ]);

    return {
      primary: primary.filter(a => a.isActive),
      secondary: secondary.filter(a => a.isActive),
      holder: holder.filter(a => a.isActive),
    };
  }

  /**
   * Get primary accounts
   */
  async getPrimaryAccounts(): Promise<PrimaryAccount[]> {
    return await primaryAccountRepository.findAll();
  }

  /**
   * Get secondary accounts by primary account
   */
  async getSecondaryAccounts(primaryAccountId: string): Promise<SecondaryAccount[]> {
    return await secondaryAccountRepository.findByPrimaryAccount(primaryAccountId);
  }

  /**
   * Get holder accounts by secondary account
   */
  async getHolderAccounts(secondaryAccountId: string): Promise<HolderAccount[]> {
    return await holderAccountRepository.findBySecondaryAccount(secondaryAccountId);
  }

  /**
   * Create a new holder account
   */
  async createHolderAccount(request: CreateHolderAccountRequest): Promise<HolderAccount> {
    // Generate account code
    const code = await holderAccountRepository.generateCode(request.secondaryAccountId);

    // Validate account
    const { validateHolderAccount } = await import('../validation');
    const validation = await validateHolderAccount({
      name: request.name,
      code,
      secondaryAccountId: request.secondaryAccountId,
      description: request.description,
    });

    if (!validation.isValid) {
      const { formatValidationErrors } = await import('../validation');
      throw new Error(formatValidationErrors(validation.errors));
    }

    // Create account
    const account = await holderAccountRepository.create({
      secondaryAccountId: request.secondaryAccountId,
      code,
      name: request.name,
      description: request.description,
      balance: 0,
      isActive: true,
    });

    return account;
  }

  /**
   * Update holder account
   */
  async updateHolderAccount(
    accountId: string,
    updates: UpdateHolderAccountRequest
  ): Promise<HolderAccount> {
    // Validate updates
    const { validateAccountUpdate } = await import('../validation');
    const validation = await validateAccountUpdate(accountId, updates);

    if (!validation.isValid) {
      const { formatValidationErrors } = await import('../validation');
      throw new Error(formatValidationErrors(validation.errors));
    }

    return await holderAccountRepository.update(accountId, updates);
  }

  /**
   * Get holder account by ID
   */
  async getHolderAccountById(accountId: string): Promise<HolderAccount | null> {
    return await holderAccountRepository.findById(accountId);
  }

  /**
   * Get secondary account by ID
   */
  async getSecondaryAccountById(accountId: string): Promise<SecondaryAccount | null> {
    return await secondaryAccountRepository.findById(accountId);
  }

  /**
   * Get holder account by code
   */
  async getHolderAccountByCode(code: string): Promise<HolderAccount | null> {
    return await holderAccountRepository.findByCode(code);
  }

  /**
   * Get account balance
   */
  async getAccountBalance(accountId: string, asOfDate?: Date): Promise<number> {
    return await holderAccountRepository.getBalance(accountId, asOfDate);
  }

  /**
   * Get account balance (synchronous version for internal use)
   */
  getAccountBalanceSync(accountId: string, asOfDate?: Date): number {
    // This is a synchronous wrapper that directly accesses the repository
    // Used internally by ReportService for performance
    const account = holderAccountRepository.findByIdSync(accountId);
    if (!account) return 0;
    
    // If no date specified, return current balance
    if (!asOfDate) return account.balance;
    
    // For historical balance, we need to calculate from transactions
    // This is a simplified version - in production, you'd want to cache this
    return account.balance; // TODO: Implement historical balance calculation
  }

  /**
   * Search accounts
   */
  async searchAccounts(query: string): Promise<HolderAccount[]> {
    return await holderAccountRepository.search(query);
  }

  /**
   * Get account options for dropdowns (with full path)
   */
  async getAccountOptions(secondaryAccountId?: string): Promise<AccountOption[]> {
    const hierarchy = await this.getAccountHierarchy();
    let holderAccounts = hierarchy.holder;

    if (secondaryAccountId) {
      holderAccounts = holderAccounts.filter(
        h => h.secondaryAccountId === secondaryAccountId
      );
    }

    return holderAccounts.map(holder => {
      const secondary = hierarchy.secondary.find(s => s.id === holder.secondaryAccountId);
      const primary = secondary
        ? hierarchy.primary.find(p => p.id === secondary.primaryAccountId)
        : null;

      const fullPath = [primary?.name, secondary?.name, holder.name]
        .filter(Boolean)
        .join(' > ');

      return {
        id: holder.id,
        code: holder.code,
        name: holder.name,
        balance: holder.balance,
        fullPath,
      };
    });
  }

  /**
   * Create a new secondary account
   */
  async createSecondaryAccount(
    primaryAccountId: string,
    name: string,
    description?: string
  ): Promise<SecondaryAccount> {
    const code = await secondaryAccountRepository.generateCode(primaryAccountId);

    return await secondaryAccountRepository.create({
      primaryAccountId,
      name,
      code,
      description,
      isActive: true,
    });
  }

  /**
   * Update secondary account
   */
  async updateSecondaryAccount(
    accountId: string,
    updates: Partial<SecondaryAccount>
  ): Promise<SecondaryAccount> {
    return await secondaryAccountRepository.update(accountId, updates);
  }

  /**
   * Validate account code uniqueness
   */
  async isAccountCodeUnique(code: string): Promise<boolean> {
    const existing = await holderAccountRepository.findByCode(code);
    return existing === null;
  }

  /**
   * Check if account can be deleted (no transactions)
   */
  async canDeleteAccount(accountId: string): Promise<boolean> {
    // This will be implemented when transaction service is ready
    // For now, allow deletion
    return true;
  }

  /**
   * Delete holder account
   */
  async deleteHolderAccount(accountId: string): Promise<void> {
    // Validate deletion
    const { validateAccountDeletion } = await import('../validation');
    const validationError = await validateAccountDeletion(accountId);

    if (validationError) {
      throw new Error(validationError.message);
    }

    await holderAccountRepository.delete(accountId);
  }

  /**
   * Get account hierarchy path
   */
  async getAccountPath(holderAccountId: string): Promise<string> {
    const holder = await holderAccountRepository.findById(holderAccountId);
    if (!holder) return '';

    const secondary = await secondaryAccountRepository.findById(holder.secondaryAccountId);
    if (!secondary) return holder.name;

    const primary = await primaryAccountRepository.findById(secondary.primaryAccountId);
    if (!primary) return `${secondary.name} > ${holder.name}`;

    return `${primary.name} > ${secondary.name} > ${holder.name}`;
  }

  /**
   * Get accounts by type
   */
  async getAccountsByType(type: PrimaryAccount['type']): Promise<HolderAccount[]> {
    const primaryAccounts = await primaryAccountRepository.findByType(type);
    const primaryIds = primaryAccounts.map(p => p.id);

    const secondaryAccounts = await secondaryAccountRepository.findAll();
    const secondaryIds = secondaryAccounts
      .filter(s => primaryIds.includes(s.primaryAccountId))
      .map(s => s.id);

    const holderAccounts = await holderAccountRepository.findAll();
    return holderAccounts.filter(h => secondaryIds.includes(h.secondaryAccountId));
  }

  /**
   * Get total balance by account type
   */
  async getTotalBalanceByType(type: PrimaryAccount['type']): Promise<number> {
    const accounts = await this.getAccountsByType(type);
    return accounts.reduce((total, account) => total + account.balance, 0);
  }
}

// Export singleton instance
export const accountService = AccountService.getInstance();
