/**
 * Split Transaction Repository
 * 
 * Data access layer for split transactions
 */

import { SplitTransaction } from '@/types';
import { BaseRepository } from './BaseRepository';

export class SplitTransactionRepository extends BaseRepository<SplitTransaction> {
  private static instance: SplitTransactionRepository;
  protected storageKey: keyof import('@/types').AppData = 'splitTransactions';

  private constructor() {
    super();
  }

  public static getInstance(): SplitTransactionRepository {
    if (!SplitTransactionRepository.instance) {
      SplitTransactionRepository.instance = new SplitTransactionRepository();
    }
    return SplitTransactionRepository.instance;
  }

  /**
   * Find split transactions by date range
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<SplitTransaction[]> {
    const all = await this.findAll();
    return all.filter(split => {
      const splitDate = new Date(split.date);
      return splitDate >= startDate && splitDate <= endDate;
    });
  }

  /**
   * Find split transactions by base account
   */
  async findByBaseAccount(accountId: string): Promise<SplitTransaction[]> {
    const all = await this.findAll();
    return all.filter(split => split.baseAccountId === accountId);
  }

  /**
   * Find split transactions by split account (any split that includes this account)
   */
  async findBySplitAccount(accountId: string): Promise<SplitTransaction[]> {
    const all = await this.findAll();
    return all.filter(split => 
      split.splits.some(s => s.accountId === accountId)
    );
  }

  /**
   * Find split transactions by date
   */
  async findByDate(date: Date): Promise<SplitTransaction[]> {
    const all = await this.findAll();
    const targetDate = new Date(date).toDateString();
    return all.filter(split => 
      new Date(split.date).toDateString() === targetDate
    );
  }

  /**
   * Get next split transaction code for a date
   */
  async getNextCode(date: Date): Promise<string> {
    const dateStr = new Date(date).toISOString().split('T')[0].replace(/-/g, '');
    const existing = await this.findByDate(date);
    const maxNumber = existing.reduce((max, split) => {
      const match = split.code.match(/SPL-(\d+)-(\d+)/);
      if (match) {
        const num = parseInt(match[2]);
        return num > max ? num : max;
      }
      return max;
    }, 0);
    
    const nextNumber = (maxNumber + 1).toString().padStart(3, '0');
    return `SPL-${dateStr}-${nextNumber}`;
  }

  /**
   * Get first split transaction for a date
   */
  async getFirstSplitTransaction(date?: Date): Promise<SplitTransaction | null> {
    let splits = await this.findAll();
    
    if (date) {
      splits = splits.filter(s => new Date(s.date).toDateString() === new Date(date).toDateString());
    }
    
    if (splits.length === 0) return null;
    
    splits.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return splits[0];
  }

  /**
   * Get last split transaction for a date
   */
  async getLastSplitTransaction(date?: Date): Promise<SplitTransaction | null> {
    let splits = await this.findAll();
    
    if (date) {
      splits = splits.filter(s => new Date(s.date).toDateString() === new Date(date).toDateString());
    }
    
    if (splits.length === 0) return null;
    
    splits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return splits[0];
  }
}

// Export singleton instance
export const splitTransactionRepository = SplitTransactionRepository.getInstance();
