/**
 * Local Storage Service
 * 
 * Handles all data persistence operations using browser local storage
 * with encryption, compression, and backup capabilities
 */

import { AppData, AppSettings, AppMetadata } from '@/types';

const STORAGE_KEY = 'snm_accounts_data';
const ENCRYPTION_KEY = 'snm_encryption_key_v1';

export class LocalStorageService {
  private static instance: LocalStorageService;

  private constructor() {
    this.initializeStorage();
  }

  public static getInstance(): LocalStorageService {
    if (!LocalStorageService.instance) {
      LocalStorageService.instance = new LocalStorageService();
    }
    return LocalStorageService.instance;
  }

  /**
   * Initialize storage with default data if empty
   */
  private initializeStorage(): void {
    if (typeof window === 'undefined') return;

    const existingData = localStorage.getItem(STORAGE_KEY);
    if (!existingData) {
      const defaultData = this.getDefaultData();
      this.saveData(defaultData);
    }
  }

  /**
   * Get default application data structure
   */
  private getDefaultData(): AppData {
    return {
      version: '1.0.0',
      users: [],
      accounts: {
        primary: this.getDefaultPrimaryAccounts(),
        secondary: [],
        holder: [],
      },
      transactions: [],
      splitTransactions: [],
      products: [],
      salesEntries: [],
      inventoryMovements: [],
      accessCodes: [],
      taxation: {
        config: null,
        withholdingTax: null,
      },
      serviceLines: [],
      services: [],
      teamLeaders: [],
      clients: [],
      fixedAssets: [],
      depreciationEntries: [],
      employees: [],
      taxConfigurations: [],
      pensionConfigurations: [],
      salaryEntries: [],
      commissions: [],
      settings: this.getDefaultSettings(),
      metadata: this.getDefaultMetadata(),
    };
  }

  /**
   * Get default primary accounts (standard chart of accounts)
   */
  private getDefaultPrimaryAccounts() {
    const now = new Date();
    return [
      {
        id: 'primary-1',
        name: 'Assets',
        type: 'ASSETS' as const,
        description: 'Resources owned by the business',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'primary-2',
        name: 'Liabilities',
        type: 'LIABILITIES' as const,
        description: 'Obligations owed by the business',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'primary-3',
        name: 'Equity',
        type: 'EQUITY' as const,
        description: 'Owner\'s interest in the business',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'primary-4',
        name: 'Revenue',
        type: 'REVENUE' as const,
        description: 'Income from business operations',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'primary-5',
        name: 'Expenses',
        type: 'EXPENSES' as const,
        description: 'Costs of business operations',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ];
  }

  /**
   * Get default application settings
   */
  private getDefaultSettings(): AppSettings {
    return {
      companyName: 'My Company',
      companyAddress: '',
      companyEmail: '',
      companyPhone: '',
      fiscalYearStart: '01-01',
      currency: 'USD',
      dateFormat: 'MM/DD/YYYY',
      autoBackup: true,
      backupInterval: 7,
      theme: 'system',
    };
  }

  /**
   * Get default metadata
   */
  private getDefaultMetadata(): AppMetadata {
    const now = new Date();
    return {
      transactionCounter: 0,
      salesCounter: 0,
      productCounter: 0,
      invoiceCounter: 0,
      splitTransactionCounter: 0,
      dataVersion: '1.0.0',
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Load all data from storage
   */
  public loadData(): AppData {
    if (typeof window === 'undefined') {
      return this.getDefaultData();
    }

    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (!storedData) {
        return this.getDefaultData();
      }

      // Try to parse directly first (new format)
      try {
        const data = JSON.parse(storedData, this.dateReviver);
        return data;
      } catch (parseError) {
        // If direct parse fails, try decrypt/decompress (old format)
        try {
          const decryptedData = this.decrypt(storedData);
          const decompressedData = this.decompress(decryptedData);
          const data = JSON.parse(decompressedData, this.dateReviver);
          return data;
        } catch (decryptError) {
          console.error('Error loading data from storage:', decryptError);
          // Clear corrupted data and return default
          localStorage.removeItem(STORAGE_KEY);
          return this.getDefaultData();
        }
      }
    } catch (error) {
      console.error('Error loading data from storage:', error);
      localStorage.removeItem(STORAGE_KEY);
      return this.getDefaultData();
    }
  }

  /**
   * Save all data to storage
   */
  public saveData(data: AppData): void {
    if (typeof window === 'undefined') return;

    try {
      data.metadata.updatedAt = new Date();
      const jsonData = JSON.stringify(data);
      
      // Save directly without encryption/compression for now
      // This prevents data corruption issues
      localStorage.setItem(STORAGE_KEY, jsonData);
    } catch (error) {
      console.error('Error saving data to storage:', error);
      throw new Error('Failed to save data. Storage may be full.');
    }
  }

  /**
   * Get specific data subset
   */
  public getData<K extends keyof AppData>(key: K): AppData[K] {
    const data = this.loadData();
    return data[key];
  }

  /**
   * Update specific data subset
   */
  public updateData<K extends keyof AppData>(key: K, value: AppData[K]): void {
    const data = this.loadData();
    data[key] = value;
    this.saveData(data);
  }

  /**
   * Clear all data from storage
   */
  public clearData(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
    this.initializeStorage();
  }

  /**
   * Create a backup of current data
   */
  public createBackup(backupName?: string): string {
    const data = this.loadData();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const name = backupName || `snm-backup-${timestamp}`;
    
    const backupData = {
      name,
      timestamp: new Date(),
      version: data.version,
      data,
    };

    return JSON.stringify(backupData, null, 2);
  }

  /**
   * Restore data from backup
   */
  public restoreBackup(backupJson: string): void {
    try {
      const backup = JSON.parse(backupJson, this.dateReviver);
      
      if (!backup.data || !backup.version) {
        throw new Error('Invalid backup format');
      }

      this.saveData(backup.data);
    } catch (error) {
      console.error('Error restoring backup:', error);
      throw new Error('Failed to restore backup. Invalid backup file.');
    }
  }

  /**
   * Export data in various formats
   */
  public exportData(format: 'json' | 'csv' = 'json'): string {
    const data = this.loadData();
    
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }
    
    // CSV export would require more complex logic per entity type
    throw new Error('CSV export not yet implemented');
  }

  /**
   * Import data from JSON
   */
  public importData(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData, this.dateReviver);
      
      // Validate data structure
      if (!this.validateDataStructure(data)) {
        throw new Error('Invalid data structure');
      }

      this.saveData(data);
    } catch (error) {
      console.error('Error importing data:', error);
      throw new Error('Failed to import data. Invalid format.');
    }
  }

  /**
   * Get storage usage information
   */
  public getStorageInfo(): { used: number; available: number; percentage: number } {
    if (typeof window === 'undefined') {
      return { used: 0, available: 0, percentage: 0 };
    }

    try {
      const data = localStorage.getItem(STORAGE_KEY) || '';
      const used = new Blob([data]).size;
      const available = 5 * 1024 * 1024; // Assume 5MB limit
      const percentage = (used / available) * 100;

      return { used, available, percentage };
    } catch (error) {
      return { used: 0, available: 0, percentage: 0 };
    }
  }

  /**
   * Simple encryption (Base64 encoding with XOR cipher)
   * Note: This is basic obfuscation, not cryptographically secure
   */
  private encrypt(data: string): string {
    const key = ENCRYPTION_KEY;
    let encrypted = '';
    
    for (let i = 0; i < data.length; i++) {
      const charCode = data.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      encrypted += String.fromCharCode(charCode);
    }
    
    return btoa(encrypted);
  }

  /**
   * Simple decryption
   */
  private decrypt(encryptedData: string): string {
    const key = ENCRYPTION_KEY;
    const decoded = atob(encryptedData);
    let decrypted = '';
    
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      decrypted += String.fromCharCode(charCode);
    }
    
    return decrypted;
  }

  /**
   * Simple compression using LZW algorithm
   */
  private compress(data: string): string {
    const dict: { [key: string]: number } = {};
    let dictSize = 256;
    let w = '';
    const result: number[] = [];

    for (let i = 0; i < data.length; i++) {
      const c = data.charAt(i);
      const wc = w + c;

      if (dict[wc]) {
        w = wc;
      } else {
        result.push(w.length > 0 ? (dict[w] ?? w.charCodeAt(0)) : 0);
        dict[wc] = dictSize++;
        w = c;
      }
    }

    if (w.length > 0) {
      result.push(dict[w] ?? w.charCodeAt(0));
    }

    return result.join(',');
  }

  /**
   * Simple decompression
   */
  private decompress(compressed: string): string {
    const dict: { [key: number]: string } = {};
    let dictSize = 256;
    const codes = compressed.split(',').map(Number);
    let w = String.fromCharCode(codes[0]);
    let result = w;

    for (let i = 1; i < codes.length; i++) {
      const k = codes[i];
      let entry: string;

      if (dict[k]) {
        entry = dict[k];
      } else if (k === dictSize) {
        entry = w + w.charAt(0);
      } else {
        entry = String.fromCharCode(k);
      }

      result += entry;
      dict[dictSize++] = w + entry.charAt(0);
      w = entry;
    }

    return result;
  }

  /**
   * JSON reviver to convert date strings back to Date objects
   */
  private dateReviver(key: string, value: any): any {
    const dateFields = ['date', 'createdAt', 'updatedAt', 'lastLogin', 'expiresAt', 'timestamp', 'asOfDate', 'lastBackup', 'lastMovementDate'];
    
    if (dateFields.some(field => key.toLowerCase().includes(field.toLowerCase())) && typeof value === 'string') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    return value;
  }

  /**
   * Validate data structure
   */
  private validateDataStructure(data: any): boolean {
    return (
      data &&
      typeof data === 'object' &&
      'version' in data &&
      'users' in data &&
      'accounts' in data &&
      'transactions' in data &&
      'settings' in data &&
      'metadata' in data
    );
  }
}

// Export singleton instance
export const storageService = LocalStorageService.getInstance();
