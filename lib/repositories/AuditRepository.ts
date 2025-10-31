/**
 * Audit Repository
 * 
 * Data access layer for transaction audit trail
 */

import { TransactionAuditEntry, TransactionAuditLog } from '@/types';

const AUDIT_STORAGE_KEY = 'snm_transaction_audit';

export class AuditRepository {
  private static instance: AuditRepository;

  private constructor() {}

  public static getInstance(): AuditRepository {
    if (!AuditRepository.instance) {
      AuditRepository.instance = new AuditRepository();
    }
    return AuditRepository.instance;
  }

  /**
   * Get all audit entries from localStorage
   */
  private getAuditData(): TransactionAuditEntry[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const data = localStorage.getItem(AUDIT_STORAGE_KEY);
      if (!data) return [];
      
      const parsed = JSON.parse(data);
      // Convert date strings back to Date objects
      return parsed.map((entry: any) => ({
        ...entry,
        timestamp: new Date(entry.timestamp),
      }));
    } catch (error) {
      console.error('Failed to load audit data:', error);
      return [];
    }
  }

  /**
   * Save audit entries to localStorage
   */
  private saveAuditData(entries: TransactionAuditEntry[]): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error('Failed to save audit data:', error);
    }
  }

  /**
   * Get all audit entries
   */
  async findAll(): Promise<TransactionAuditEntry[]> {
    return this.getAuditData();
  }

  /**
   * Get audit entries for a specific transaction
   */
  async findByTransactionId(transactionId: string): Promise<TransactionAuditEntry[]> {
    const allEntries = await this.findAll();
    return allEntries.filter(entry => entry.transactionId === transactionId);
  }

  /**
   * Get audit log for a transaction (with transaction details)
   */
  async getAuditLog(transactionId: string, transactionNumber: string): Promise<TransactionAuditLog> {
    const entries = await this.findByTransactionId(transactionId);
    return {
      transactionId,
      transactionNumber,
      entries: entries.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
    };
  }

  /**
   * Create a new audit entry
   */
  async create(entry: Omit<TransactionAuditEntry, 'id'>): Promise<TransactionAuditEntry> {
    const allEntries = this.getAuditData();
    
    const newEntry: TransactionAuditEntry = {
      ...entry,
      id: this.generateId(),
      timestamp: new Date(),
    };

    allEntries.push(newEntry);
    this.saveAuditData(allEntries);

    return newEntry;
  }

  /**
   * Get audit entries by user
   */
  async findByUserId(userId: string): Promise<TransactionAuditEntry[]> {
    const allEntries = await this.findAll();
    return allEntries.filter(entry => entry.userId === userId);
  }

  /**
   * Get audit entries by action type
   */
  async findByAction(action: TransactionAuditEntry['action']): Promise<TransactionAuditEntry[]> {
    const allEntries = await this.findAll();
    return allEntries.filter(entry => entry.action === action);
  }

  /**
   * Get audit entries within date range
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<TransactionAuditEntry[]> {
    const allEntries = await this.findAll();
    return allEntries.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      return entryDate >= startDate && entryDate <= endDate;
    });
  }

  /**
   * Delete audit entries for a transaction (when transaction is permanently deleted)
   */
  async deleteByTransactionId(transactionId: string): Promise<void> {
    const allEntries = this.getAuditData();
    const filteredEntries = allEntries.filter(entry => entry.transactionId !== transactionId);
    this.saveAuditData(filteredEntries);
  }

  /**
   * Clear all audit entries (use with caution)
   */
  async clearAll(): Promise<void> {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(AUDIT_STORAGE_KEY);
  }

  /**
   * Generate a unique ID for audit entry
   */
  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const auditRepository = AuditRepository.getInstance();
