/**
 * Transaction Management Domain Models
 * 
 * This file contains all TypeScript interfaces related to the transaction system
 * including double-entry transactions and split transactions
 */

export interface Transaction {
  id: string;
  date: Date;
  number: string;
  description: string;
  amount: number;
  debitAccountId: string;
  creditAccountId: string;
  reconciled: boolean;
  splitTransactionId?: string;
  isPettyCash?: boolean;
  parentTransactionId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  // Account information included from API
  debitAccount?: {
    id: string;
    name: string;
    code: string;
  };
  creditAccount?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface SplitTransaction {
  id: string;
  date: Date;
  code: string;
  baseAccountId: string;
  baseAccountSide: 'DEBIT' | 'CREDIT';
  splits: TransactionSplit[];
  totalAmount: number;
  reconciled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionSplit {
  id: string;
  transactionNumber: string;
  accountId: string;
  amount: number;
  description: string;
  reconciled: boolean;
}

// Request/Response types for transaction operations
export interface CreateTransactionRequest {
  date: Date;
  description: string;
  amount: number;
  debitAccountId: string;
  creditAccountId: string;
  reconciled?: boolean;
}

export interface UpdateTransactionRequest {
  date?: Date;
  description?: string;
  amount?: number;
  debitAccountId?: string;
  creditAccountId?: string;
  reconciled?: boolean;
}

export interface CreateSplitTransactionRequest {
  date: Date;
  baseAccountId: string;
  baseAccountSide: 'DEBIT' | 'CREDIT';
  splits: Omit<TransactionSplit, 'id' | 'transactionNumber'>[];
}

// Transaction filters for queries
export interface TransactionFilters {
  startDate?: Date;
  endDate?: Date;
  accountId?: string;
  reconciled?: boolean;
  searchTerm?: string;
  minAmount?: number;
  maxAmount?: number;
}

// Transaction summary for display
export interface TransactionSummary {
  id: string;
  date: Date;
  number: string;
  description: string;
  amount: number;
  debitAccount: string;
  creditAccount: string;
  reconciled: boolean;
}

// Transaction navigation
export interface TransactionNavigation {
  current: Transaction;
  position: number;
  total: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Transaction audit trail
export interface TransactionAuditEntry {
  id: string;
  transactionId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RECONCILE' | 'UNRECONCILE';
  timestamp: Date;
  userId?: string;
  username?: string;
  changes?: TransactionAuditChanges;
  previousValues?: Partial<Transaction>;
  newValues?: Partial<Transaction>;
}

export interface TransactionAuditChanges {
  field: string;
  oldValue: any;
  newValue: any;
}

export interface TransactionAuditLog {
  transactionId: string;
  transactionNumber: string;
  entries: TransactionAuditEntry[];
}

// Company Settings
export interface CompanySettings {
  id: string;
  companyName: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo?: string;
  // Bank details
  bankName?: string;
  bankAccountNumber?: string;
  bankSortCode?: string;
  bankSwiftCode?: string;
  // Tax settings
  vatRate: number;
  vatRegistrationNumber?: string;
  taxId?: string;
  // Invoice settings
  invoicePrefix: string;
  invoiceNumberFormat: string;
  invoiceTermsDays: number;
  invoiceFooterText?: string;
  // Accounting settings
  fiscalYearStart: string; // MM-DD format
  baseCurrency: string;
  updatedAt: Date;
}

export interface UpdateCompanySettingsRequest {
  companyName?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankSortCode?: string;
  bankSwiftCode?: string;
  vatRate?: number;
  vatRegistrationNumber?: string;
  taxId?: string;
  invoicePrefix?: string;
  invoiceNumberFormat?: string;
  invoiceTermsDays?: number;
  invoiceFooterText?: string;
  fiscalYearStart?: string;
  baseCurrency?: string;
}
