/**
 * Seed Secondary Accounts Script
 * 
 * Creates initial secondary accounts for testing
 */

import { accountService } from '../lib/services/AccountService';

export async function seedSecondaryAccounts() {
  try {
    const primaryAccounts = await accountService.getPrimaryAccounts();
    
    // Assets secondary accounts
    const assets = primaryAccounts.find(p => p.name === 'Assets');
    if (assets) {
      await accountService.createSecondaryAccount(
        assets.id,
        'Current Assets',
        'Assets that can be converted to cash within one year'
      );
      await accountService.createSecondaryAccount(
        assets.id,
        'Fixed Assets',
        'Long-term tangible assets'
      );
    }
    
    // Liabilities secondary accounts
    const liabilities = primaryAccounts.find(p => p.name === 'Liabilities');
    if (liabilities) {
      await accountService.createSecondaryAccount(
        liabilities.id,
        'Current Liabilities',
        'Obligations due within one year'
      );
      await accountService.createSecondaryAccount(
        liabilities.id,
        'Long-term Liabilities',
        'Obligations due after one year'
      );
    }
    
    // Equity secondary accounts
    const equity = primaryAccounts.find(p => p.name === 'Equity');
    if (equity) {
      await accountService.createSecondaryAccount(
        equity.id,
        'Capital',
        'Owner\'s capital contributions'
      );
      await accountService.createSecondaryAccount(
        equity.id,
        'Retained Earnings',
        'Accumulated profits'
      );
    }
    
    // Revenue secondary accounts
    const revenue = primaryAccounts.find(p => p.name === 'Revenue');
    if (revenue) {
      await accountService.createSecondaryAccount(
        revenue.id,
        'Sales Revenue',
        'Income from sales'
      );
      await accountService.createSecondaryAccount(
        revenue.id,
        'Other Income',
        'Non-operating income'
      );
    }
    
    // Expenses secondary accounts
    const expenses = primaryAccounts.find(p => p.name === 'Expenses');
    if (expenses) {
      await accountService.createSecondaryAccount(
        expenses.id,
        'Operating Expenses',
        'Day-to-day business expenses'
      );
      await accountService.createSecondaryAccount(
        expenses.id,
        'Cost of Sales',
        'Direct costs of goods sold'
      );
    }
    
    console.log('Secondary accounts seeded successfully');
    return { success: true };
  } catch (error) {
    console.error('Error seeding secondary accounts:', error);
    return { success: false, error };
  }
}
