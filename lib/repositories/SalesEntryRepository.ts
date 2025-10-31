/**
 * Sales Entry Repository
 * 
 * Data access layer for sales entries
 */

import { SalesEntry, SalesFilters } from '@/types';
import { BaseRepository } from './BaseRepository';

export class SalesEntryRepository extends BaseRepository<SalesEntry> {
  protected storageKey = 'salesEntries' as const;

  /**
   * Find sales entry by sales code
   */
  async findBySalesCode(salesCode: string): Promise<SalesEntry | null> {
    const entries = this.getAll();
    return entries.find(e => e.salesCode === salesCode) || null;
  }

  /**
   * Find sales entries by product
   */
  async findByProduct(productId: string): Promise<SalesEntry[]> {
    const entries = this.getAll();
    return entries.filter(e => e.productId === productId);
  }

  /**
   * Find sales entries by customer
   */
  async findByCustomer(customerAccountId: string): Promise<SalesEntry[]> {
    const entries = this.getAll();
    return entries.filter(e => e.customerAccountId === customerAccountId);
  }

  /**
   * Find sales entries by date range
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<SalesEntry[]> {
    const entries = this.getAll();
    return entries.filter(e => {
      const entryDate = new Date(e.date);
      return entryDate >= startDate && entryDate <= endDate;
    });
  }

  /**
   * Search sales entries with filters
   */
  async search(filters: SalesFilters): Promise<SalesEntry[]> {
    let entries = this.getAll();

    if (filters.startDate) {
      entries = entries.filter(e => new Date(e.date) >= new Date(filters.startDate!));
    }

    if (filters.endDate) {
      entries = entries.filter(e => new Date(e.date) <= new Date(filters.endDate!));
    }

    if (filters.productId) {
      entries = entries.filter(e => e.productId === filters.productId);
    }

    if (filters.customerAccountId) {
      entries = entries.filter(e => e.customerAccountId === filters.customerAccountId);
    }

    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      entries = entries.filter(e =>
        e.salesCode.toLowerCase().includes(searchTerm) ||
        e.description.toLowerCase().includes(searchTerm)
      );
    }

    return entries;
  }

  /**
   * Generate next sales code for a given date
   * Format: SALES-YYYYMM-NNNN
   */
  async getNextSalesCode(date: Date): Promise<string> {
    const entries = this.getAll();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const prefix = `SALES-${year}${month}`;

    // Find all sales codes for this month
    const monthEntries = entries.filter(e => e.salesCode.startsWith(prefix));

    // Get the highest number
    const maxNumber = monthEntries.reduce((max, entry) => {
      const match = entry.salesCode.match(/SALES-\d{6}-(\d+)/);
      if (match) {
        const num = parseInt(match[1]);
        return num > max ? num : max;
      }
      return max;
    }, 0);

    return `${prefix}-${String(maxNumber + 1).padStart(4, '0')}`;
  }

  /**
   * Get total sales value for a period
   */
  async getTotalSalesValue(startDate: Date, endDate: Date): Promise<number> {
    const entries = await this.findByDateRange(startDate, endDate);
    return entries.reduce((total, entry) => total + entry.salesValue, 0);
  }

  /**
   * Get total cost value for a period
   */
  async getTotalCostValue(startDate: Date, endDate: Date): Promise<number> {
    const entries = await this.findByDateRange(startDate, endDate);
    return entries.reduce((total, entry) => total + entry.costValue, 0);
  }

  /**
   * Get gross profit for a period
   */
  async getGrossProfit(startDate: Date, endDate: Date): Promise<number> {
    const entries = await this.findByDateRange(startDate, endDate);
    return entries.reduce((total, entry) => total + (entry.salesValue - entry.costValue), 0);
  }
}

// Export singleton instance
export const salesEntryRepository = new SalesEntryRepository();
