/**
 * Debug Visualization Type Definitions
 */

export type TransactionType = 
  | 'single' 
  | 'split' 
  | 'petty' 
  | 'sales' 
  | 'payroll' 
  | 'fixed-asset-depreciation'
  | 'fixed-asset-disposal';

export type AccountType = 'ASSETS' | 'LIABILITIES' | 'EQUITY' | 'REVENUE' | 'EXPENSES';

export interface AccountDebugInfo {
  id: string;
  name: string;
  code: string;
  type: AccountType;
  hierarchy: {
    primary: string;
    secondary: string;
    holder: string;
  };
  balanceBefore: number;
  balanceAfter: number;
  balanceChange: number;
}

export interface TransactionFlow {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  direction: 'debit' | 'credit';
  description: string;
  transactionNumber?: string;
  label?: string;
}

export interface TransactionDebugData {
  transactionId: string;
  transactionType: TransactionType;
  timestamp: Date;
  
  // Accounts involved
  accounts: AccountDebugInfo[];
  
  // Transaction flows
  flows: TransactionFlow[];
  
  // Metadata
  metadata: {
    totalAmount: number;
    description: string;
    date: Date;
    user?: string;
    vatAmount?: number;
    grossProfit?: number;
    netSalary?: number;
    [key: string]: any;
  };
}

export interface DebugModeSettings {
  enabled: boolean;
  autoShow: boolean;
  layout: 'horizontal' | 'vertical';
  colorScheme: 'account-type' | 'balance-change' | 'combined';
  showBalances: boolean;
  showAccountCodes: boolean;
  showTransactionNumbers: boolean;
  animateFlows: boolean;
}
