/**
 * Test Helper: Account Setup
 * 
 * Creates proper account hierarchy for testing
 */

import { primaryAccountRepository, secondaryAccountRepository, holderAccountRepository } from '../../../repositories';

/**
 * Set up basic account hierarchy for product and sales tests
 */
export async function setupAccountHierarchy() {
  // Create primary accounts with proper codes
  const inventoryPrimary = await primaryAccountRepository.create({
    name: 'Inventory',
    code: '02',
    type: 'ASSETS',
    description: 'Product inventory accounts',
    isActive: true,
  });

  const salesPrimary = await primaryAccountRepository.create({
    name: 'Sales',
    code: '40',
    type: 'REVENUE',
    description: 'Product sales accounts',
    isActive: true,
  });

  const costPrimary = await primaryAccountRepository.create({
    name: 'Cost of Sales',
    code: '50',
    type: 'EXPENSES',
    description: 'Cost of goods sold accounts',
    isActive: true,
  });

  const arPrimary = await primaryAccountRepository.create({
    name: 'Accounts Receivable',
    code: '01',
    type: 'ASSETS',
    description: 'Customer accounts',
    isActive: true,
  });

  // Create secondary accounts
  const inventorySecondary = await secondaryAccountRepository.create({
    name: 'Products',
    code: '02-001',
    primaryAccountId: inventoryPrimary.id,
    description: 'Product inventory',
    isActive: true,
  });

  const salesSecondary = await secondaryAccountRepository.create({
    name: 'Product Sales',
    code: '40-001',
    primaryAccountId: salesPrimary.id,
    description: 'Revenue from product sales',
    isActive: true,
  });

  const costSecondary = await secondaryAccountRepository.create({
    name: 'Product Costs',
    code: '50-001',
    primaryAccountId: costPrimary.id,
    description: 'Cost of products sold',
    isActive: true,
  });

  const customersSecondary = await secondaryAccountRepository.create({
    name: 'Customers',
    code: '01-001',
    primaryAccountId: arPrimary.id,
    description: 'Customer accounts',
    isActive: true,
  });

  // Create holder accounts under sales secondary for comparative reports
  const consultingHolder = await holderAccountRepository.create({
    name: 'Analytics Consulting',
    code: '40-001-001',
    secondaryAccountId: salesSecondary.id,
    description: 'Consulting services revenue',
    isActive: true,
  });

  const solutionsHolder = await holderAccountRepository.create({
    name: 'Analytics Solutions',
    code: '40-001-002',
    secondaryAccountId: salesSecondary.id,
    description: 'Solutions revenue',
    isActive: true,
  });

  const trainingHolder = await holderAccountRepository.create({
    name: 'Analytics Training',
    code: '40-001-003',
    secondaryAccountId: salesSecondary.id,
    description: 'Training revenue',
    isActive: true,
  });

  // Create holder account for customers (AR)
  const customerHolder = await holderAccountRepository.create({
    name: 'General Customers',
    code: '01-001-001',
    secondaryAccountId: customersSecondary.id,
    description: 'General customer accounts receivable',
    isActive: true,
  });

  return {
    primary: {
      inventory: inventoryPrimary,
      sales: salesPrimary,
      cost: costPrimary,
      ar: arPrimary,
    },
    secondary: {
      inventory: inventorySecondary,
      sales: salesSecondary,
      cost: costSecondary,
      customers: customersSecondary,
    },
    holder: {
      consulting: consultingHolder,
      solutions: solutionsHolder,
      training: trainingHolder,
      customers: customerHolder,
    },
  };
}
