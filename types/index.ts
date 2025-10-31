/**
 * Central Type Exports
 * 
 * This file exports all domain models and types for the SNM Accounts Management System
 */

// Account types
export * from './accounts';

// Transaction types
export * from './transactions';

// Product and Sales types
export * from './products';

// User and Authentication types
export * from './users';

// Report types
export * from './reports';

// Taxation types
export * from './taxation';

// Services types
export * from './services';

// Clients types
export * from './clients';

// Fixed Assets types
export * from './fixedAssets';

// Payroll types
export * from './payroll';

// Sales Representatives types
export * from './salesRepresentatives';

// Common types and utilities
export interface AppData {
  version: string;
  users: import('./users').User[];
  accounts: {
    primary: import('./accounts').PrimaryAccount[];
    secondary: import('./accounts').SecondaryAccount[];
    holder: import('./accounts').HolderAccount[];
  };
  transactions: import('./transactions').Transaction[];
  splitTransactions: import('./transactions').SplitTransaction[];
  products: import('./products').Product[];
  salesEntries: import('./products').SalesEntry[];
  inventoryMovements: import('./products').InventoryMovement[];
  accessCodes: import('./users').AccessCode[];
  taxation: {
    config: import('./taxation').VATTaxConfiguration | null;
    withholdingTax: import('./taxation').WithholdingTaxConfiguration | null;
  };
  serviceLines: import('./services').ServiceLine[];
  services: import('./services').Service[];
  teamLeaders: import('./services').TeamLeader[];
  clients: import('./clients').Client[];
  fixedAssets: import('./fixedAssets').FixedAsset[];
  depreciationEntries: import('./fixedAssets').DepreciationEntry[];
  employees: import('./payroll').Employee[];
  taxConfigurations: import('./payroll').TaxConfiguration[];
  pensionConfigurations: import('./payroll').PensionConfiguration[];
  salaryEntries: import('./payroll').SalaryEntry[];
  commissions: import('./payroll').Commission[];
  companySettings?: import('./transactions').CompanySettings;
  settings: AppSettings;
  metadata: AppMetadata;
}

export interface AppSettings {
  companyName: string;
  companyAddress?: string;
  companyEmail?: string;
  companyPhone?: string;
  fiscalYearStart: string; // MM-DD format
  currency: string;
  dateFormat: string;
  autoBackup: boolean;
  backupInterval: number; // in days
  theme: 'light' | 'dark' | 'system';
}

export interface AppMetadata {
  lastBackup?: Date;
  transactionCounter: number;
  salesCounter: number;
  productCounter: number;
  invoiceCounter: number;
  splitTransactionCounter: number;
  dataVersion: string;
  createdAt: Date;
  updatedAt: Date;
}

// Validation error types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: ValidationError[];
}

// Pagination types
export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// Date range types
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export type ReportPeriod = 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL';

export interface ReportPeriodConfig {
  mode: ReportPeriod;
  startDate: Date;
  periods: number;
}

// Storage types
export interface StorageQuota {
  used: number;
  available: number;
  total: number;
  percentage: number;
}

export interface BackupFile {
  id: string;
  name: string;
  size: number;
  createdAt: Date;
  dataVersion: string;
}

// Audit trail
export interface AuditLog {
  id: string;
  userId: string;
  username: string;
  action: string;
  entityType: string;
  entityId: string;
  changes?: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
}
