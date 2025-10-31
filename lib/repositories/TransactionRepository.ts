/**
 * Transaction Repository
 * 
 * Data access layer for transaction management
 */

import { BaseRepository } from './BaseRepository';
import { Transaction, SplitTransaction, TransactionFilters } from '@/types';
import { storageService } from '../storage/LocalStorageService';

export class TransactionRepository extends BaseRepository<Transaction> {
  protected storageKey = 'transactions' as const;

  async findByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]> {
    const transactions = this.getAll();
    return transactions.filter(t => {
      const txDate = new Date(t.date);
      return txDate >= startDate && txDate <= endDate;
    });
  }

  async findByAccount(accountId: string): Promise<Transaction[]> {
    const transactions = this.getAll();
    return transactions.filter(t => 
      t.debitAccountId === accountId || t.creditAccountId === accountId
    );
  }

  async findByDate(date: Date): Promise<Transaction[]> {
    const transactions = this.getAll();
    const targetDate = new Date(date).toDateString();
    return transactions.filter(t => new Date(t.date).toDateString() === targetDate);
  }

  async getNextTransactionNumber(date: Date): Promise<string> {
    const metadata = storageService.getData('metadata');
    const counter = metadata.transactionCounter + 1;
    
    // Update counter
    metadata.transactionCounter = counter;
    storageService.updateData('metadata', metadata);

    // Format: YYYYMMDD-NNNN
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    return `${dateStr}-${String(counter).padStart(4, '0')}`;
  }

  protected applyFilters(transactions: Transaction[], filters: TransactionFilters): Transaction[] {
    let filtered = transactions;

    if (filters.startDate) {
      filtered = filtered.filter(t => new Date(t.date) >= filters.startDate!);
    }

    if (filters.endDate) {
      filtered = filtered.filter(t => new Date(t.date) <= filters.endDate!);
    }

    if (filters.accountId) {
      filtered = filtered.filter(t => 
        t.debitAccountId === filters.accountId || t.creditAccountId === filters.accountId
      );
    }

    if (filters.reconciled !== undefined) {
      filtered = filtered.filter(t => t.reconciled === filters.reconciled);
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(term) ||
        t.number.toLowerCase().includes(term)
      );
    }

    if (filters.minAmount !== undefined) {
      filtered = filtered.filter(t => t.amount >= filters.minAmount!);
    }

    if (filters.maxAmount !== undefined) {
      filtered = filtered.filter(t => t.amount <= filters.maxAmount!);
    }

    return filtered;
  }

  async getFirstTransaction(date?: Date): Promise<Transaction | null> {
    let transactions = this.getAll();
    
    if (date) {
      transactions = await this.findByDate(date);
    }

    if (transactions.length === 0) return null;
    
    return transactions.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )[0];
  }

  async getLastTransaction(date?: Date): Promise<Transaction | null> {
    let transactions = this.getAll();
    
    if (date) {
      transactions = await this.findByDate(date);
    }

    if (transactions.length === 0) return null;
    
    return transactions.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
  }
}

// Export singleton instance
export const transactionRepository = new TransactionRepository();
