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
 * 
 * IMPORTANT: This should be called BEFORE the transaction is saved to get accurate "before" balances
 */
export async function captureSingleTransactionBefore(
  debitAccountId: string,
  creditAccountId: string,
  amount: number,
  description: string,
  date: Date
): Promise<{
  debitAccountBefore: Omit<AccountDebugInfo, 'balanceChange' | 'balanceAfter'>;
  creditAccountBefore: Omit<AccountDebugInfo, 'balanceChange' | 'balanceAfter'>;
}> {
  // Fetch account details BEFORE transaction is saved
  const [debitAccount, creditAccount] = await Promise.all([
    fetchAccountDetails(debitAccountId),
    fetchAccountDetails(creditAccountId),
  ]);

  return {
    debitAccountBefore: debitAccount,
    creditAccountBefore: creditAccount,
  };
}

/**
 * Complete the single transaction debug data capture
 * 
 * This should be called AFTER the transaction is saved with the "before" data
 */
export async function captureSingleTransaction(
  transactionId: string,
  debitAccountId: string,
  creditAccountId: string,
  amount: number,
  description: string,
  date: Date,
  beforeData?: {
    debitAccountBefore: Omit<AccountDebugInfo, 'balanceChange' | 'balanceAfter'>;
    creditAccountBefore: Omit<AccountDebugInfo, 'balanceChange' | 'balanceAfter'>;
  }
): Promise<TransactionDebugData> {
  // If no before data provided, fetch current balances (will be AFTER transaction)
  let debitAccountBefore, creditAccountBefore;
  
  if (beforeData) {
    debitAccountBefore = beforeData.debitAccountBefore;
    creditAccountBefore = beforeData.creditAccountBefore;
  } else {
    // Fallback: fetch current balances and try to reverse (not ideal)
    const [debitAccount, creditAccount] = await Promise.all([
      fetchAccountDetails(debitAccountId),
      fetchAccountDetails(creditAccountId),
    ]);
    
    const debitBalanceChange = calculateBalanceChange(debitAccount.type, amount, 'debit');
    const creditBalanceChange = calculateBalanceChange(creditAccount.type, amount, 'credit');
    
    debitAccountBefore = {
      ...debitAccount,
      balanceBefore: debitAccount.balanceBefore - debitBalanceChange,
    };
    creditAccountBefore = {
      ...creditAccount,
      balanceBefore: creditAccount.balanceBefore - creditBalanceChange,
    };
  }

  // Calculate balance changes
  const debitBalanceChange = calculateBalanceChange(debitAccountBefore.type, amount, 'debit');
  const creditBalanceChange = calculateBalanceChange(creditAccountBefore.type, amount, 'credit');

  // Build account info with before, change, and after
  const accounts: AccountDebugInfo[] = [
    {
      ...debitAccountBefore,
      balanceChange: debitBalanceChange,
      balanceAfter: debitAccountBefore.balanceBefore + debitBalanceChange,
    },
    {
      ...creditAccountBefore,
      balanceChange: creditBalanceChange,
      balanceAfter: creditAccountBefore.balanceBefore + creditBalanceChange,
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
  // Fetch base account (balance is AFTER transaction)
  const baseAccount = await fetchAccountDetails(baseAccountId);
  
  // Fetch all split accounts (balances are AFTER transaction)
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
      balanceBefore: baseAccount.balanceBefore - baseBalanceChange, // Reverse to get before
      balanceChange: baseBalanceChange,
      balanceAfter: baseAccount.balanceBefore, // Current balance is after
    },
    ...splitAccounts.map((account, index) => {
      const splitAmount = splits[index].amount;
      const splitSide = baseAccountSide === 'DEBIT' ? 'credit' : 'debit';
      const balanceChange = calculateBalanceChange(account.type, splitAmount, splitSide);
      
      return {
        ...account,
        balanceBefore: account.balanceBefore - balanceChange, // Reverse to get before
        balanceChange,
        balanceAfter: account.balanceBefore, // Current balance is after
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
 * Capture sales transaction debug data - BEFORE transaction
 * 
 * Fetches account balances BEFORE the sales transaction is created
 */
export async function captureSalesTransactionBefore(
  productId: string,
  customerAccountId: string
): Promise<{
  product: any;
  customerAccountBefore: Omit<AccountDebugInfo, 'balanceChange' | 'balanceAfter'>;
  salesAccountBefore: Omit<AccountDebugInfo, 'balanceChange' | 'balanceAfter'>;
  costOfSalesAccountBefore: Omit<AccountDebugInfo, 'balanceChange' | 'balanceAfter'>;
  inventoryAccountBefore: Omit<AccountDebugInfo, 'balanceChange' | 'balanceAfter'>;
}> {
  console.log('[DEBUG] captureSalesTransactionBefore called with:', { productId, customerAccountId });
  
  // Fetch product/service to get account IDs
  const productOrService = await fetchProductDetails(productId);
  
  console.log('[DEBUG] Fetching accounts for:', {
    customerAccountId,
    salesAccountId: productOrService.salesAccountId,
    costOfSalesAccountId: productOrService.costOfSalesAccountId,
    inventoryAccountId: productOrService.inventoryAccountId,
    isService: productOrService.isService,
  });
  
  // For services, we only fetch customer account
  // Sales account might not exist yet (auto-created during transaction)
  if (productOrService.isService) {
    const customerAccount = await fetchAccountDetails(customerAccountId);
    
    // Try to fetch sales account if it exists
    let salesAccount = null;
    if (productOrService.salesAccountId) {
      try {
        salesAccount = await fetchAccountDetails(productOrService.salesAccountId);
        console.log('[DEBUG] Service revenue account found');
      } catch (error) {
        console.log('[DEBUG] Service revenue account not found yet (will be auto-created)');
      }
    }
    
    console.log('[DEBUG] Service accounts fetched');
    
    return {
      product: productOrService,
      customerAccountBefore: customerAccount,
      salesAccountBefore: salesAccount as any, // May be null if not created yet
      costOfSalesAccountBefore: null as any, // Services don't have cost of sales
      inventoryAccountBefore: null as any, // Services don't have inventory
    };
  }
  
  // Fetch all accounts involved BEFORE transaction (for products)
  const [customerAccount, salesAccount, costOfSalesAccount, inventoryAccount] = await Promise.all([
    fetchAccountDetails(customerAccountId),
    fetchAccountDetails(productOrService.salesAccountId),
    fetchAccountDetails(productOrService.costOfSalesAccountId),
    fetchAccountDetails(productOrService.inventoryAccountId),
  ]);

  console.log('[DEBUG] All product accounts fetched successfully');

  return {
    product: productOrService,
    customerAccountBefore: customerAccount,
    salesAccountBefore: salesAccount,
    costOfSalesAccountBefore: costOfSalesAccount,
    inventoryAccountBefore: inventoryAccount,
  };
}

/**
 * Capture sales transaction debug data - Complete
 * 
 * EXACT SAME PATTERN AS SINGLE TRANSACTION:
 * 1. Use beforeData that was captured BEFORE the transaction
 * 2. Calculate balance changes based on transaction amounts
 * 3. Calculate AFTER balances by adding changes to BEFORE balances
 * 4. DO NOT fetch accounts again - use the beforeData
 */
export async function captureSalesTransaction(
  salesEntryId: string,
  productId: string,
  customerAccountId: string,
  salesValue: number,
  costValue: number,
  date: Date,
  vatAmount?: number,
  totalWithVat?: number,
  beforeData?: {
    product: any;
    customerAccountBefore: Omit<AccountDebugInfo, 'balanceChange' | 'balanceAfter'>;
    salesAccountBefore: Omit<AccountDebugInfo, 'balanceChange' | 'balanceAfter'>;
    costOfSalesAccountBefore: Omit<AccountDebugInfo, 'balanceChange' | 'balanceAfter'>;
    inventoryAccountBefore: Omit<AccountDebugInfo, 'balanceChange' | 'balanceAfter'>;
  }
): Promise<TransactionDebugData> {
  console.log('='.repeat(80));
  console.log('[DEBUG SALES] captureSalesTransaction START');
  console.log('[DEBUG SALES] Input parameters:', {
    salesEntryId,
    productId,
    customerAccountId,
    salesValue,
    costValue,
    vatAmount,
    totalWithVat,
    hasBeforeData: !!beforeData,
    hasSalesAccountBefore: !!beforeData?.salesAccountBefore,
  });
  
  // If no before data provided, OR if sales account is missing (auto-created), fetch from transaction
  let customerAccountBefore, salesAccountBefore, costOfSalesAccountBefore, inventoryAccountBefore;
  
  // Check if we need to fetch the actual transaction to get account IDs
  const needsTransactionFetch = !beforeData || !beforeData.salesAccountBefore;
  
  console.log('[DEBUG SALES] needsTransactionFetch:', needsTransactionFetch);
  
  if (needsTransactionFetch) {
    console.log('[DEBUG SALES] ⚠️ Sales account not captured before (auto-created), fetching from transaction...');
    
    // Fetch the sales entry to get transaction numbers
    console.log('[DEBUG SALES] Fetching sales entry:', salesEntryId);
    const salesResponse = await fetch(`/api/sales?search=${salesEntryId}`);
    console.log('[DEBUG SALES] Sales response status:', salesResponse.status);
    
    if (salesResponse.ok) {
      const salesData = await salesResponse.json();
      const salesEntries = salesData.data?.data || [];
      const salesEntry = salesEntries.find((e: any) => e.id === salesEntryId);
      
      console.log('[DEBUG SALES] Sales entry found:', {
        found: !!salesEntry,
        salesTransactionNumber: salesEntry?.salesTransactionNumber,
        costTransactionNumber: salesEntry?.costTransactionNumber,
      });
      
      if (salesEntry && salesEntry.salesTransactionNumber) {
        // Fetch the actual transaction to get the real account IDs
        console.log('[DEBUG SALES] Fetching transactions...');
        const txResponse = await fetch(`/api/transactions?limit=100`);
        console.log('[DEBUG SALES] Transactions response status:', txResponse.status);
        
        if (txResponse.ok) {
          const txData = await txResponse.json();
          const transactions = txData.data || [];
          console.log('[DEBUG SALES] Total transactions fetched:', transactions.length);
          
          const salesTx = transactions.find((t: any) => t.number === salesEntry.salesTransactionNumber);
          const costTx = transactions.find((t: any) => t.number === salesEntry.costTransactionNumber);
          
          console.log('[DEBUG SALES] Transactions found:', {
            salesTx: salesTx ? {
              number: salesTx.number,
              debitAccountId: salesTx.debitAccountId,
              creditAccountId: salesTx.creditAccountId,
              amount: salesTx.amount,
            } : null,
            costTx: costTx ? {
              number: costTx.number,
              debitAccountId: costTx.debitAccountId,
              creditAccountId: costTx.creditAccountId,
              amount: costTx.amount,
            } : null,
          });
          
          if (salesTx) {
            console.log('[DEBUG SALES] ✅ Found sales transaction, fetching actual accounts');
            
            // Fetch the actual accounts used in the transaction
            console.log('[DEBUG SALES] Fetching account details for:', {
              customerAccountId: salesTx.debitAccountId,
              salesAccountId: salesTx.creditAccountId,
            });
            
            const [customerAccountAfter, salesAccountAfter] = await Promise.all([
              fetchAccountDetails(salesTx.debitAccountId),
              fetchAccountDetails(salesTx.creditAccountId),
            ]);
            
            console.log('[DEBUG SALES] Accounts fetched:', {
              customer: {
                id: customerAccountAfter.id,
                name: customerAccountAfter.name,
                type: customerAccountAfter.type,
                balanceBefore: customerAccountAfter.balanceBefore,
              },
              sales: {
                id: salesAccountAfter.id,
                name: salesAccountAfter.name,
                type: salesAccountAfter.type,
                balanceBefore: salesAccountAfter.balanceBefore,
              },
            });
            
            const finalSalesAmount = totalWithVat || salesValue;
            const customerBalanceChange = calculateBalanceChange(customerAccountAfter.type, finalSalesAmount, 'debit');
            const salesBalanceChange = calculateBalanceChange(salesAccountAfter.type, salesValue, 'credit');
            
            console.log('[DEBUG SALES] Balance changes calculated:', {
              customerBalanceChange,
              salesBalanceChange,
            });
            
            // Calculate before balances by reversing the changes
            customerAccountBefore = {
              ...customerAccountAfter,
              balanceBefore: customerAccountAfter.balanceBefore - customerBalanceChange,
            };
            salesAccountBefore = {
              ...salesAccountAfter,
              balanceBefore: salesAccountAfter.balanceBefore - salesBalanceChange,
            };
            
            console.log('[DEBUG SALES] Before balances calculated:', {
              customerBefore: customerAccountBefore.balanceBefore,
              salesBefore: salesAccountBefore.balanceBefore,
            });
            
            // Handle cost transaction if it exists
            if (costTx && costValue > 0) {
              console.log('[DEBUG SALES] Processing cost transaction:', {
                costAccountId: costTx.debitAccountId,
                inventoryAccountId: costTx.creditAccountId,
              });
              
              const [costAccountAfter, inventoryAccountAfter] = await Promise.all([
                fetchAccountDetails(costTx.debitAccountId),
                fetchAccountDetails(costTx.creditAccountId),
              ]);
              
              console.log('[DEBUG SALES] Cost accounts fetched:', {
                cost: {
                  id: costAccountAfter.id,
                  name: costAccountAfter.name,
                  type: costAccountAfter.type,
                  balanceBefore: costAccountAfter.balanceBefore,
                },
                inventory: {
                  id: inventoryAccountAfter.id,
                  name: inventoryAccountAfter.name,
                  type: inventoryAccountAfter.type,
                  balanceBefore: inventoryAccountAfter.balanceBefore,
                },
              });
              
              const costBalanceChange = calculateBalanceChange(costAccountAfter.type, costValue, 'debit');
              const inventoryBalanceChange = calculateBalanceChange(inventoryAccountAfter.type, costValue, 'credit');
              
              console.log('[DEBUG SALES] Cost balance changes:', {
                costBalanceChange,
                inventoryBalanceChange,
              });
              
              costOfSalesAccountBefore = {
                ...costAccountAfter,
                balanceBefore: costAccountAfter.balanceBefore - costBalanceChange,
              };
              inventoryAccountBefore = {
                ...inventoryAccountAfter,
                balanceBefore: inventoryAccountAfter.balanceBefore - inventoryBalanceChange,
              };
              
              console.log('[DEBUG SALES] Cost before balances calculated:', {
                costBefore: costOfSalesAccountBefore.balanceBefore,
                inventoryBefore: inventoryAccountBefore.balanceBefore,
              });
            } else {
              console.log('[DEBUG SALES] No cost transaction (service or costValue=0)');
            }
          }
        }
      }
    }
  } else if (beforeData) {
    // Use the beforeData that was captured
    console.log('[DEBUG SALES] ✅ Using beforeData that was captured');
    customerAccountBefore = beforeData.customerAccountBefore;
    salesAccountBefore = beforeData.salesAccountBefore;
    costOfSalesAccountBefore = beforeData.costOfSalesAccountBefore;
    inventoryAccountBefore = beforeData.inventoryAccountBefore;
    
    console.log('[DEBUG SALES] BeforeData accounts:', {
      customer: customerAccountBefore ? {
        id: customerAccountBefore.id,
        name: customerAccountBefore.name,
        balanceBefore: customerAccountBefore.balanceBefore,
      } : null,
      sales: salesAccountBefore ? {
        id: salesAccountBefore.id,
        name: salesAccountBefore.name,
        balanceBefore: salesAccountBefore.balanceBefore,
      } : null,
      cost: costOfSalesAccountBefore ? {
        id: costOfSalesAccountBefore.id,
        name: costOfSalesAccountBefore.name,
        balanceBefore: costOfSalesAccountBefore.balanceBefore,
      } : null,
      inventory: inventoryAccountBefore ? {
        id: inventoryAccountBefore.id,
        name: inventoryAccountBefore.name,
        balanceBefore: inventoryAccountBefore.balanceBefore,
      } : null,
    });
  }
  
  // Final fallback if we still don't have the data
  if (!customerAccountBefore || !salesAccountBefore) {
    console.warn('[DEBUG SALES] ⚠️ Using fallback method to fetch accounts');
    const product = await fetchProductDetails(productId);
    const [customerAccount, salesAccount, costOfSalesAccount, inventoryAccount] = await Promise.all([
      fetchAccountDetails(customerAccountId),
      fetchAccountDetails(product.salesAccountId),
      fetchAccountDetails(product.costOfSalesAccountId),
      fetchAccountDetails(product.inventoryAccountId),
    ]);

    const finalSalesAmount = totalWithVat || salesValue;
    const customerBalanceChange = calculateBalanceChange(customerAccount.type, finalSalesAmount, 'debit');
    const salesBalanceChange = calculateBalanceChange(salesAccount.type, salesValue, 'credit');
    const costBalanceChange = calculateBalanceChange(costOfSalesAccount.type, costValue, 'debit');
    const inventoryBalanceChange = calculateBalanceChange(inventoryAccount.type, costValue, 'credit');

    customerAccountBefore = {
      ...customerAccount,
      balanceBefore: customerAccount.balanceBefore - customerBalanceChange,
    };
    salesAccountBefore = {
      ...salesAccount,
      balanceBefore: salesAccount.balanceBefore - salesBalanceChange,
    };
    costOfSalesAccountBefore = {
      ...costOfSalesAccount,
      balanceBefore: costOfSalesAccount.balanceBefore - costBalanceChange,
    };
    inventoryAccountBefore = {
      ...inventoryAccount,
      balanceBefore: inventoryAccount.balanceBefore - inventoryBalanceChange,
    };
  }

  const finalSalesAmount = totalWithVat || salesValue;

  // Calculate balance changes using proper accounting rules
  const customerBalanceChange = calculateBalanceChange(customerAccountBefore.type, finalSalesAmount, 'debit');
  const salesBalanceChange = calculateBalanceChange(salesAccountBefore.type, salesValue, 'credit');

  // Build account info with before, change, and after (SAME AS SINGLE TRANSACTION)
  const accounts: AccountDebugInfo[] = [
    {
      ...customerAccountBefore,
      balanceChange: customerBalanceChange,
      balanceAfter: customerAccountBefore.balanceBefore + customerBalanceChange,
    },
    {
      ...salesAccountBefore,
      balanceChange: salesBalanceChange,
      balanceAfter: salesAccountBefore.balanceBefore + salesBalanceChange,
    },
  ];

  const flows: TransactionFlow[] = [
    {
      id: `flow-${salesEntryId}-revenue`,
      fromAccountId: salesAccountBefore.id,
      toAccountId: customerAccountBefore.id,
      amount: finalSalesAmount,
      direction: 'debit',
      description: 'Sales Revenue',
      label: 'Revenue Flow',
    },
  ];

  // Only add cost/inventory accounts for products (not services)
  if (costOfSalesAccountBefore && inventoryAccountBefore && costValue > 0) {
    const costBalanceChange = calculateBalanceChange(costOfSalesAccountBefore.type, costValue, 'debit');
    const inventoryBalanceChange = calculateBalanceChange(inventoryAccountBefore.type, costValue, 'credit');

    accounts.push(
      {
        ...costOfSalesAccountBefore,
        balanceChange: costBalanceChange,
        balanceAfter: costOfSalesAccountBefore.balanceBefore + costBalanceChange,
      },
      {
        ...inventoryAccountBefore,
        balanceChange: inventoryBalanceChange,
        balanceAfter: inventoryAccountBefore.balanceBefore + inventoryBalanceChange,
      }
    );

    flows.push({
      id: `flow-${salesEntryId}-cost`,
      fromAccountId: inventoryAccountBefore.id,
      toAccountId: costOfSalesAccountBefore.id,
      amount: costValue,
      direction: 'debit',
      description: 'Cost of Sales',
      label: 'Cost Flow',
    });
  }

  console.log('[DEBUG SALES] ═══════════════════════════════════════════════════════════');
  console.log('[DEBUG SALES] FINAL DEBUG DATA:');
  console.log('[DEBUG SALES] Account count:', accounts.length);
  console.log('[DEBUG SALES] Flow count:', flows.length);
  console.log('[DEBUG SALES] Accounts:');
  accounts.forEach((a, i) => {
    console.log(`[DEBUG SALES]   ${i + 1}. ${a.name} (${a.code})`);
    console.log(`[DEBUG SALES]      Type: ${a.type}`);
    console.log(`[DEBUG SALES]      Before: ${a.balanceBefore}`);
    console.log(`[DEBUG SALES]      Change: ${a.balanceChange > 0 ? '+' : ''}${a.balanceChange}`);
    console.log(`[DEBUG SALES]      After: ${a.balanceAfter}`);
  });
  console.log('[DEBUG SALES] Flows:');
  flows.forEach((f, i) => {
    console.log(`[DEBUG SALES]   ${i + 1}. ${f.label || f.description}`);
    console.log(`[DEBUG SALES]      From: ${f.fromAccountId}`);
    console.log(`[DEBUG SALES]      To: ${f.toAccountId}`);
    console.log(`[DEBUG SALES]      Amount: ${f.amount}`);
  });
  console.log('[DEBUG SALES] ═══════════════════════════════════════════════════════════');
  console.log('[DEBUG SALES] captureSalesTransaction END');
  console.log('='.repeat(80));

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
      grossProfit: salesValue - costValue,
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
 * Helper: Fetch product OR service details
 * 
 * Note: Services don't have inventory/cost accounts like products do.
 * For services, we need to find the auto-created revenue account.
 */
async function fetchProductDetails(productOrServiceId: string): Promise<any> {
  try {
    console.log('[DEBUG] Fetching product/service details for ID:', productOrServiceId);
    
    // Try fetching as a product first
    let response = await fetch(`/api/products/${productOrServiceId}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('[DEBUG] Product data received:', data);
      
      const product = data.data || data;
      
      if (!product.salesAccountId || !product.costOfSalesAccountId || !product.inventoryAccountId) {
        console.error('[DEBUG] Product missing account IDs:', {
          salesAccountId: product.salesAccountId,
          costOfSalesAccountId: product.costOfSalesAccountId,
          inventoryAccountId: product.inventoryAccountId,
        });
        throw new Error('Product is missing required account IDs');
      }
      
      console.log('[DEBUG] Product accounts:', {
        salesAccountId: product.salesAccountId,
        costOfSalesAccountId: product.costOfSalesAccountId,
        inventoryAccountId: product.inventoryAccountId,
      });
      
      return { ...product, isProduct: true };
    }
    
    // If not a product, try as a service
    console.log('[DEBUG] Not a product, trying as service...');
    response = await fetch(`/api/services/services/${productOrServiceId}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('[DEBUG] Service data received:', data);
      
      const service = data.data || data;
      
      // For services, we need to find the auto-created revenue account
      // It should be named "{Service Name} Revenue" under the "Sales" secondary account
      console.log('[DEBUG] Looking for service revenue account...');
      
      try {
        // Find the Sales secondary account
        const secondaryResponse = await fetch('/api/accounts/secondary');
        const secondaryData = await secondaryResponse.json();
        const salesSecondary = (secondaryData.data || []).find((acc: any) => acc.name === 'Sales');
        
        if (salesSecondary) {
          // Find the holder account for this service
          const holderResponse = await fetch(`/api/accounts/holder?limit=1000`);
          const holderData = await holderResponse.json();
          const holderAccounts = holderData.data?.data || holderData.data || [];
          
          const serviceAccountName = `${service.name} Revenue`;
          const serviceRevenueAccount = holderAccounts.find((acc: any) => 
            acc.secondaryAccountId === salesSecondary.id && 
            acc.name === serviceAccountName
          );
          
          if (serviceRevenueAccount) {
            console.log('[DEBUG] Found service revenue account:', serviceRevenueAccount.id);
            
            return {
              ...service,
              isProduct: false,
              isService: true,
              salesAccountId: serviceRevenueAccount.id, // Use the found revenue account
              costOfSalesAccountId: '', // Services don't have cost of sales
              inventoryAccountId: '', // Services don't have inventory
            };
          } else {
            console.warn('[DEBUG] Service revenue account not found, may need to be created');
          }
        }
      } catch (accountError) {
        console.error('[DEBUG] Error finding service revenue account:', accountError);
      }
      
      // Fallback if we couldn't find the revenue account
      console.warn('[DEBUG] Service detected - using simplified account structure (revenue account not found)');
      
      return {
        ...service,
        isProduct: false,
        isService: true,
        salesAccountId: '', // Will be empty if not found
        costOfSalesAccountId: '', // Services don't have cost of sales
        inventoryAccountId: '', // Services don't have inventory
      };
    }
    
    throw new Error(`Neither product nor service found with ID: ${productOrServiceId}`);
    
  } catch (error) {
    console.error('[DEBUG] Error fetching product/service details:', error);
    throw error;
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
