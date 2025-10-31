/**
 * API-Based Account Service
 * 
 * Business logic for account management operations using API routes
 * Replaces localStorage-based AccountService
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

export class ApiAccountService {
  private static instance: ApiAccountService;
  private baseUrl = '/api/accounts';

  private constructor() {}

  public static getInstance(): ApiAccountService {
    if (!ApiAccountService.instance) {
      ApiAccountService.instance = new ApiAccountService();
    }
    return ApiAccountService.instance;
  }

  /**
   * Helper method to make API requests
   */
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'Request failed',
      }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  }

  /**
   * Get complete account hierarchy
   */
  async getAccountHierarchy(): Promise<AccountHierarchy> {
    const [primary, secondary, holder] = await Promise.all([
      this.getPrimaryAccounts(),
      this.getAllSecondaryAccounts(),
      this.getAllHolderAccounts(),
    ]);

    return {
      primary: primary.filter(a => a.isActive),
      secondary: secondary.filter(a => a.isActive),
      holder: holder.filter(a => a.isActive),
    };
  }

  /**
   * Get all primary accounts
   */
  async getPrimaryAccounts(): Promise<PrimaryAccount[]> {
    const response = await this.request<any>('/primary?limit=1000');
    return response.data || response;
  }

  /**
   * Get all secondary accounts
   */
  async getAllSecondaryAccounts(): Promise<SecondaryAccount[]> {
    const response = await this.request<any>('/secondary?limit=1000');
    return response.data || response;
  }

  /**
   * Get all holder accounts
   */
  async getAllHolderAccounts(): Promise<HolderAccount[]> {
    const response = await this.request<any>('/holder?limit=1000');
    return response.data || response;
  }

  /**
   * Get secondary accounts by primary account
   */
  async getSecondaryAccounts(primaryAccountId: string): Promise<SecondaryAccount[]> {
    const response = await this.request<any>(
      `/secondary?primaryAccountId=${primaryAccountId}&limit=1000`
    );
    return response.data || response;
  }

  /**
   * Get holder accounts by secondary account
   */
  async getHolderAccounts(secondaryAccountId: string): Promise<HolderAccount[]> {
    const response = await this.request<any>(
      `/holder?secondaryAccountId=${secondaryAccountId}&limit=1000`
    );
    return response.data || response;
  }

  /**
   * Get Operating Expense accounts (EXPENSES type)
   */
  async getOperatingExpenseAccounts(): Promise<AccountOption[]> {
    try {
      // Get all primary accounts and filter for EXPENSES type
      const primaryAccounts = await this.getPrimaryAccounts();
      const expensePrimary = primaryAccounts.filter(p => p.type === 'EXPENSES' && p.isActive);
      
      if (expensePrimary.length === 0) {
        return [];
      }

      // Get all secondary and holder accounts
      const [allSecondary, allHolder] = await Promise.all([
        this.getAllSecondaryAccounts(),
        this.getAllHolderAccounts(),
      ]);

      // Filter secondary accounts that belong to expense primary accounts
      const expensePrimaryIds = new Set(expensePrimary.map(p => p.id));
      const expenseSecondary = allSecondary.filter(s => 
        expensePrimaryIds.has(s.primaryAccountId) && s.isActive
      );

      // Filter holder accounts that belong to expense secondary accounts
      const expenseSecondaryIds = new Set(expenseSecondary.map(s => s.id));
      const expenseHolder = allHolder.filter(h => 
        expenseSecondaryIds.has(h.secondaryAccountId) && h.isActive
      );

      // Build account options with full path
      return expenseHolder.map(holder => {
        const secondary = expenseSecondary.find(s => s.id === holder.secondaryAccountId);
        const primary = secondary 
          ? expensePrimary.find(p => p.id === secondary.primaryAccountId)
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
    } catch (error) {
      console.error('Error fetching operating expense accounts:', error);
      throw error;
    }
  }

  /**
   * Create a new holder account
   */
  async createHolderAccount(request: CreateHolderAccountRequest): Promise<HolderAccount> {
    // Verify secondary account exists
    const secondary = await this.getSecondaryAccountById(request.secondaryAccountId);
    if (!secondary) {
      throw new Error('Secondary account not found');
    }

    // Generate account code
    const code = await this.generateHolderAccountCode(request.secondaryAccountId);

    // Create the account - organizationId will be handled by the API
    const account = await this.request<HolderAccount>('/holder', {
      method: 'POST',
      body: JSON.stringify({
        secondaryAccountId: request.secondaryAccountId,
        code,
        name: request.name,
        description: request.description || '',
        balance: 0,
        isActive: true,
      }),
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
    const account = await this.request<HolderAccount>(`/holder/${accountId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });

    return account;
  }

  /**
   * Get holder account by ID
   */
  async getHolderAccountById(accountId: string): Promise<HolderAccount | null> {
    try {
      const account = await this.request<HolderAccount>(`/holder/${accountId}`);
      return account;
    } catch (error) {
      console.error('Error fetching holder account:', error);
      return null;
    }
  }

  /**
   * Get secondary account by ID
   */
  async getSecondaryAccountById(accountId: string): Promise<SecondaryAccount | null> {
    try {
      const account = await this.request<SecondaryAccount>(`/secondary/${accountId}`);
      return account;
    } catch (error) {
      console.error('Error fetching secondary account:', error);
      return null;
    }
  }

  /**
   * Get holder account by code
   */
  async getHolderAccountByCode(code: string): Promise<HolderAccount | null> {
    try {
      const response = await this.request<any>(`/holder?search=${code}&limit=1`);
      const accounts = response.data || response;
      return accounts.find((a: HolderAccount) => a.code === code) || null;
    } catch (error) {
      console.error('Error fetching holder account by code:', error);
      return null;
    }
  }

  /**
   * Generate holder account code
   */
  async generateHolderAccountCode(secondaryAccountId: string): Promise<string> {
    // Get existing holder accounts for this secondary account
    const holderAccounts = await this.getHolderAccounts(secondaryAccountId);
    const secondary = await this.getSecondaryAccountById(secondaryAccountId);
    
    if (!secondary) {
      throw new Error('Secondary account not found');
    }

    // Find the highest number in existing codes
    const maxNumber = holderAccounts.reduce((max, account) => {
      const parts = account.code.split('-');
      const num = parseInt(parts[2] || '0', 10);
      return Math.max(max, num);
    }, 0);

    // Generate new code: {secondary.code}-{nextNumber}
    const nextNumber = (maxNumber + 1).toString().padStart(3, '0');
    return `${secondary.code}-${nextNumber}`;
  }

  /**
   * Get account balance
   */
  async getAccountBalance(accountId: string, asOfDate?: Date): Promise<number> {
    const account = await this.getHolderAccountById(accountId);
    return account?.balance || 0;
  }

  /**
   * Search accounts
   */
  async searchAccounts(query: string): Promise<HolderAccount[]> {
    const response = await this.request<any>(`/holder?search=${query}&limit=100`);
    return response.data || response;
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
   * Delete holder account
   */
  async deleteHolderAccount(accountId: string): Promise<void> {
    await this.request(`/holder/${accountId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get account hierarchy path
   */
  async getAccountPath(holderAccountId: string): Promise<string> {
    const holder = await this.getHolderAccountById(holderAccountId);
    if (!holder) return '';

    const secondary = await this.getSecondaryAccountById(holder.secondaryAccountId);
    if (!secondary) return holder.name;

    const primary = await this.request<PrimaryAccount>(`/primary/${secondary.primaryAccountId}`);
    if (!primary) return `${secondary.name} > ${holder.name}`;

    return `${primary.name} > ${secondary.name} > ${holder.name}`;
  }

  /**
   * Get accounts by type
   */
  async getAccountsByType(type: PrimaryAccount['type']): Promise<HolderAccount[]> {
    const response = await this.request<any>(`/primary?type=${type}&limit=1000`);
    const primaryAccounts = response.data || response;
    const primaryIds = primaryAccounts.map((p: PrimaryAccount) => p.id);

    const allSecondary = await this.getAllSecondaryAccounts();
    const secondaryIds = allSecondary
      .filter(s => primaryIds.includes(s.primaryAccountId))
      .map(s => s.id);

    const allHolder = await this.getAllHolderAccounts();
    return allHolder.filter(h => secondaryIds.includes(h.secondaryAccountId));
  }

  /**
   * Get total balance by account type
   */
  async getTotalBalanceByType(type: PrimaryAccount['type']): Promise<number> {
    const accounts = await this.getAccountsByType(type);
    return accounts.reduce((total, account) => total + account.balance, 0);
  }

  /**
   * Validate account code uniqueness
   */
  async isAccountCodeUnique(code: string): Promise<boolean> {
    const existing = await this.getHolderAccountByCode(code);
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
}

// Export singleton instance
export const apiAccountService = ApiAccountService.getInstance();
