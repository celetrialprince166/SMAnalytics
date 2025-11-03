/**
 * Transaction Debug Data Capture Utility
 * 
 * Captures transaction data and converts it to debug visualization format
 */

import { TransactionDebugData, AccountDebugInfo, TransactionFlow, TransactionType } from '@/types/debug';

interface CaptureOptions {
  transactionType: TransactionType;
  transactionId: string;
  description: string;
  date: Date;
  totalAmount: number;
  metadata?: Record<string, any>;
}

/**
 * Capture single transaction debug data
 */
export async function captureSingleTransaction(
  transactionId: string,
  debitAccountId: string,
  creditAccountId: string,
  amount: number,
  description: string,
  date: Date
): Promise<TransactionDebugData> {
  // Fetch account details with balances
  const [debitAccount, creditAccount] = await Promise.all([
    fetchAccountDetails(debitAccountId),
    fetchAccountDetails(creditAccountId),
  ]);

  const accounts: AccountDebugInfo[] = [
    {
      ...debitAccount,
      balanceChange: calculateBalanceChange(debitAccount.type, amount, 'debit'),
      balanceAfter: debitAccount.balanceBefore + calculateBalanceChange(debitAccount.type, amount, 'debit'),
    },
    {
      ...creditAccount,
      balanceChange: calculateBalanceChange(creditAccount.type, amount, 'credit'),
      balanceAfter: creditAccount.balanceBefore + calculateBalanceChange(creditAccount.type, amount, 'credit'),
    },
  ];

  const flows: TransactionFlow[] = [
    {
      id: `flow-${transactionId}`,
      fromAccountId: creditAccountId,
      toAccountId: debitAccountId,
      amount,
      direction: 'debit',
      description,
    },
  ];

  return {
    transactionId,
    transactionType: 'single',
    timestamp: new Date(),
    accounts,
    flows,
    metadata: {
      totalAmount: amount,
      description,
      date,
    },
  };
}

/**
 * Capture split transaction debug data
 */
export async function captureSplitTransaction(
  splitTransactionId: string,
  baseAccountId: string,
  baseAccountSide: 'DEBIT' | 'CREDIT',
  splits: Array<{ accountId: string; amount: number; description: string }>,
  date: Date,
  isPettyCash: boolean = false
): Promise<TransactionDebugData> {
  // Fetch base account
  const baseAccount = await fetchAccountDetails(baseAccountId);
  
  // Fetch all split accounts
  const splitAccounts = await Promise.all(
    splits.map(split => fetchAccountDetails(split.accountId))
  );

  const totalAmount = splits.reduce((sum, split) => sum + split.amount, 0);

  // Calculate base account balance change
  const baseBalanceChange = baseAccountSide === 'DEBIT' 
    ? calculateBalanceChange(baseAccount.type, totalAmount, 'debit')
    : calculateBalanceChange(baseAccount.type, totalAmount, 'credit');

  const accounts: AccountDebugInfo[] = [
    {
      ...baseAccount,
      balanceChange: baseBalanceChange,
      balanceAfter: baseAccount.balanceBefore + baseBalanceChange,
    },
    ...splitAccounts.map((account, index) => {
      const splitAmount = splits[index].amount;
      const splitSide = baseAccountSide === 'DEBIT' ? 'credit' : 'debit';
      const balanceChange = calculateBalanceChange(account.type, splitAmount, splitSide);
      
      return {
        ...account,
        balanceChange,
        balanceAfter: account.balanceBefore + balanceChange,
      };
    }),
  ];

  const flows: TransactionFlow[] = splits.map((split, index) => ({
    id: `flow-${splitTransactionId}-${index}`,
    fromAccountId: baseAccountSide === 'DEBIT' ? split.accountId : baseAccountId,
    toAccountId: baseAccountSide === 'DEBIT' ? baseAccountId : split.accountId,
    amount: split.amount,
    direction: baseAccountSide === 'DEBIT' ? 'debit' : 'credit',
    description: split.description,
    label: `Split ${index + 1}`,
  }));

  return {
    transactionId: splitTransactionId,
    transactionType: isPettyCash ? 'petty' : 'split',
    timestamp: new Date(),
    accounts,
    flows,
    metadata: {
      totalAmount,
      description: `Split transaction - ${splits.length} splits`,
      date,
      splitCount: splits.length,
    },
  };
}

/**
 * Capture sales transaction debug data
 */
export async function captureSalesTransaction(
  salesEntryId: string,
  productId: string,
  customerAccountId: string,
  salesValue: number,
  costValue: number,
  date: Date,
  vatAmount?: number,
  totalWithVat?: number
): Promise<TransactionDebugData> {
  // Fetch product to get inventory and sales accounts
  const product = await fetchProductDetails(productId);
  
  // Fetch all accounts involved
  const [customerAccount, salesAccount, costOfSalesAccount, inventoryAccount] = await Promise.all([
    fetchAccountDetails(customerAccountId),
    fetchAccountDetails(product.salesAccountId),
    fetchAccountDetails(product.costOfSalesAccountId),
    fetchAccountDetails(product.inventoryAccountId),
  ]);

  const finalSalesAmount = totalWithVat || salesValue;
  const grossProfit = salesValue - costValue;

  // Calculate balance changes
  const accounts: AccountDebugInfo[] = [
    {
      ...customerAccount,
      balanceChange: finalSalesAmount, // Debit increases assets
      balanceAfter: customerAccount.balanceBefore + finalSalesAmount,
    },
    {
      ...salesAccount,
      balanceChange: salesValue, // Credit increases revenue
      balanceAfter: salesAccount.balanceBefore + salesValue,
    },
    {
      ...costOfSalesAccount,
      balanceChange: costValue, // Debit increases expenses
      balanceAfter: costOfSalesAccount.balanceBefore + costValue,
    },
    {
      ...inventoryAccount,
      balanceChange: -costValue, // Credit decreases assets
      balanceAfter: inventoryAccount.balanceBefore - costValue,
    },
  ];

  const flows: TransactionFlow[] = [
    {
      id: `flow-${salesEntryId}-revenue`,
      fromAccountId: salesAccount.id,
      toAccountId: customerAccount.id,
      amount: finalSalesAmount,
      direction: 'debit',
      description: 'Sales Revenue',
      label: 'Revenue Flow',
    },
    {
      id: `flow-${salesEntryId}-cost`,
      fromAccountId: inventoryAccount.id,
      toAccountId: costOfSalesAccount.id,
      amount: costValue,
      direction: 'debit',
      description: 'Cost of Sales',
      label: 'Cost Flow',
    },
  ];

  return {
    transactionId: salesEntryId,
    transactionType: 'sales',
    timestamp: new Date(),
    accounts,
    flows,
    metadata: {
      totalAmount: finalSalesAmount,
      description: `Sales transaction`,
      date,
      salesValue,
      costValue,
      grossProfit,
      vatAmount,
      totalWithVat,
    },
  };
}

/**
 * Capture payroll transaction debug data
 */
export async function capturePayrollTransaction(
  salaryEntryId: string,
  employeeId: string,
  grossSalary: number,
  netSalary: number,
  deductions: {
    incomeTax: number;
    tier1Employee: number;
    tier2: number;
    tier3Employee: number;
    otherDeductions: number;
  },
  date: Date
): Promise<TransactionDebugData> {
  // This is a simplified version - in production, you'd fetch actual account IDs
  const accounts: AccountDebugInfo[] = [
    {
      id: 'salary-expense',
      name: 'Salary Expense',
      code: 'EXP-SAL',
      type: 'EXPENSES',
      hierarchy: { primary: 'Expenses', secondary: 'Operating Expenses', holder: 'Salary Expense' },
      balanceBefore: 0,
      balanceChange: grossSalary,
      balanceAfter: grossSalary,
    },
    {
      id: 'employee-payable',
      name: 'Employee Payable',
      code: 'LIA-EMP',
      type: 'LIABILITIES',
      hierarchy: { primary: 'Liabilities', secondary: 'Current Liabilities', holder: 'Employee Payable' },
      balanceBefore: 0,
      balanceChange: netSalary,
      balanceAfter: netSalary,
    },
  ];

  const flows: TransactionFlow[] = [
    {
      id: `flow-${salaryEntryId}-salary`,
      fromAccountId: 'salary-expense',
      toAccountId: 'employee-payable',
      amount: netSalary,
      direction: 'credit',
      description: 'Net Salary Payable',
    },
  ];

  return {
    transactionId: salaryEntryId,
    transactionType: 'payroll',
    timestamp: new Date(),
    accounts,
    flows,
    metadata: {
      totalAmount: grossSalary,
      description: `Payroll for employee`,
      date,
      grossSalary,
      netSalary,
      totalDeductions: grossSalary - netSalary,
      deductions,
    },
  };
}

/**
 * Helper: Fetch account details with current balance
 */
async function fetchAccountDetails(accountId: string): Promise<Omit<AccountDebugInfo, 'balanceChange' | 'balanceAfter'>> {
  try {
    const response = await fetch(`/api/accounts/holder/${accountId}`);
    if (!response.ok) throw new Error('Failed to fetch account');
    
    const data = await response.json();
    const account = data.data;
    
    return {
      id: account.id,
      name: account.name,
      code: account.code,
      type: account.secondaryAccount?.primaryAccount?.type || 'ASSETS',
      hierarchy: {
        primary: account.secondaryAccount?.primaryAccount?.name || '',
        secondary: account.secondaryAccount?.name || '',
        holder: account.name,
      },
      balanceBefore: Number(account.balance) || 0,
    };
  } catch (error) {
    console.error('Error fetching account details:', error);
    // Return fallback data
    return {
      id: accountId,
      name: 'Unknown Account',
      code: 'N/A',
      type: 'ASSETS',
      hierarchy: { primary: '', secondary: '', holder: '' },
      balanceBefore: 0,
    };
  }
}

/**
 * Helper: Fetch product details
 */
async function fetchProductDetails(productId: string): Promise<any> {
  try {
    const response = await fetch(`/api/products/${productId}`);
    if (!response.ok) throw new Error('Failed to fetch product');
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching product details:', error);
    return {
      salesAccountId: '',
      costOfSalesAccountId: '',
      inventoryAccountId: '',
    };
  }
}

/**
 * Helper: Calculate balance change based on account type and transaction side
 */
function calculateBalanceChange(
  accountType: string,
  amount: number,
  side: 'debit' | 'credit'
): number {
  // ASSETS, EXPENSES: Debit increases, Credit decreases
  // LIABILITIES, EQUITY, REVENUE: Credit increases, Debit decreases
  
  if (side === 'debit') {
    if (accountType === 'ASSETS' || accountType === 'EXPENSES') {
      return amount; // Increase
    } else {
      return -amount; // Decrease
    }
  } else {
    // Credit side
    if (accountType === 'LIABILITIES' || accountType === 'EQUITY' || accountType === 'REVENUE') {
      return amount; // Increase
    } else {
      return -amount; // Decrease
    }
  }
}
