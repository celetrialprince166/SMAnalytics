/**
 * Account Repository
 * 
 * Data access layer for account management
 */

import { BaseRepository } from './BaseRepository';
import { PrimaryAccount, SecondaryAccount, HolderAccount } from '@/types';
import { storageService } from '../storage/LocalStorageService';

export class PrimaryAccountRepository extends BaseRepository<PrimaryAccount> {
  protected storageKey = 'accounts' as const;

  protected getAll(): PrimaryAccount[] {
    const accounts = storageService.getData('accounts');
    return accounts.primary || [];
  }

  protected saveAll(entities: PrimaryAccount[]): void {
    const accounts = storageService.getData('accounts');
    accounts.primary = entities;
    storageService.updateData('accounts', accounts);
  }

  async findByType(type: PrimaryAccount['type']): Promise<PrimaryAccount[]> {
    const accounts = this.getAll();
    return accounts.filter(a => a.type === type && a.isActive);
  }
}

export class SecondaryAccountRepository extends BaseRepository<SecondaryAccount> {
  protected storageKey = 'accounts' as const;

  protected getAll(): SecondaryAccount[] {
    const accounts = storageService.getData('accounts');
    return accounts.secondary || [];
  }

  protected saveAll(entities: SecondaryAccount[]): void {
    const accounts = storageService.getData('accounts');
    accounts.secondary = entities;
    storageService.updateData('accounts', accounts);
  }

  async findByPrimaryAccount(primaryAccountId: string): Promise<SecondaryAccount[]> {
    const accounts = this.getAll();
    return accounts.filter(a => a.primaryAccountId === primaryAccountId && a.isActive);
  }

  async findByCode(code: string): Promise<SecondaryAccount | null> {
    const accounts = this.getAll();
    return accounts.find(a => a.code === code) || null;
  }

  async generateCode(primaryAccountId: string): Promise<string> {
    const accounts = await this.findByPrimaryAccount(primaryAccountId);
    const maxCode = accounts.reduce((max, acc) => {
      const num = parseInt(acc.code.split('-')[1] || '0');
      return Math.max(max, num);
    }, 0);
    
    return `${primaryAccountId.split('-')[1]}-${String(maxCode + 1).padStart(3, '0')}`;
  }
}

export class HolderAccountRepository extends BaseRepository<HolderAccount> {
  protected storageKey = 'accounts' as const;

  protected getAll(): HolderAccount[] {
    const accounts = storageService.getData('accounts');
    return accounts.holder || [];
  }

  protected saveAll(entities: HolderAccount[]): void {
    const accounts = storageService.getData('accounts');
    accounts.holder = entities;
    storageService.updateData('accounts', accounts);
  }

  async findBySecondaryAccount(secondaryAccountId: string): Promise<HolderAccount[]> {
    const accounts = this.getAll();
    return accounts.filter(a => a.secondaryAccountId === secondaryAccountId && a.isActive);
  }

  async findByCode(code: string): Promise<HolderAccount | null> {
    const accounts = this.getAll();
    return accounts.find(a => a.code === code) || null;
  }

  async generateCode(secondaryAccountId: string): Promise<string> {
    const accounts = await this.findBySecondaryAccount(secondaryAccountId);
    const { secondaryAccountRepository } = await import('./index');
    const secondaryAccount = await secondaryAccountRepository.findById(secondaryAccountId);
    
    if (!secondaryAccount) {
      throw new Error('Secondary account not found');
    }

    const maxCode = accounts.reduce((max, acc) => {
      const parts = acc.code.split('-');
      const num = parseInt(parts[parts.length - 1] || '0');
      return Math.max(max, num);
    }, 0);
    
    return `${secondaryAccount.code}-${String(maxCode + 1).padStart(3, '0')}`;
  }

  async updateBalance(accountId: string, amount: number, isDebit: boolean): Promise<void> {
    const account = await this.findById(accountId);
    if (!account) {
      throw new Error('Account not found');
    }

    const newBalance = isDebit ? account.balance + amount : account.balance - amount;
    await this.update(accountId, { balance: newBalance });
  }

  async getBalance(accountId: string, asOfDate?: Date): Promise<number> {
    const account = await this.findById(accountId);
    if (!account) {
      return 0;
    }

    // If no date specified, return current balance
    if (!asOfDate) {
      return account.balance;
    }

    // Calculate balance as of specific date by replaying transactions
    // This will be implemented when transaction repository is ready
    return account.balance;
  }

  async search(query: string): Promise<HolderAccount[]> {
    const accounts = this.getAll();
    const lowerQuery = query.toLowerCase();
    
    return accounts.filter(a => 
      a.isActive && (
        a.name.toLowerCase().includes(lowerQuery) ||
        a.code.toLowerCase().includes(lowerQuery) ||
        a.description?.toLowerCase().includes(lowerQuery)
      )
    );
  }
}

// Export singleton instances
export const primaryAccountRepository = new PrimaryAccountRepository();
export const secondaryAccountRepository = new SecondaryAccountRepository();
export const holderAccountRepository = new HolderAccountRepository();
