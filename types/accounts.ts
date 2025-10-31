/**
 * Account Management Domain Models
 * 
 * This file contains all TypeScript interfaces related to the account management system
 * including the three-tier account hierarchy: Primary -> Secondary -> Holder accounts
 */

export type AccountType = 'ASSETS' | 'LIABILITIES' | 'EQUITY' | 'REVENUE' | 'EXPENSES';

export interface PrimaryAccount {
  id: string;
  name: string;
  type: AccountType;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SecondaryAccount {
  id: string;
  primaryAccountId: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface HolderAccount {
  id: string;
  secondaryAccountId: string;
  code: string;
  name: string;
  description?: string;
  balance: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Account hierarchy view for UI components
export interface AccountHierarchy {
  primary: PrimaryAccount[];
  secondary: SecondaryAccount[];
  holder: HolderAccount[];
}

// Request/Response types for account operations
export interface CreateHolderAccountRequest {
  secondaryAccountId: string;
  name: string;
  description?: string;
}

export interface UpdateHolderAccountRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface AccountBalance {
  accountId: string;
  balance: number;
  asOfDate: Date;
}

// Account selection for dropdowns and forms
export interface AccountOption {
  id: string;
  code: string;
  name: string;
  balance?: number;
  fullPath: string; // e.g., "Assets > Current Assets > Cash"
}