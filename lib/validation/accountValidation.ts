/**
 * Account Validation
 * 
 * Validation rules and utilities for account management
 */

import { ValidationResult, ValidationError } from '@/types';
import { holderAccountRepository, transactionRepository, secondaryAccountRepository, primaryAccountRepository } from '../repositories';

/**
 * Validate account name
 */
export function validateAccountName(name: string): ValidationError | null {
  if (!name || name.trim().length === 0) {
    return {
      field: 'name',
      message: 'Account name is required',
      code: 'REQUIRED',
    };
  }

  if (name.length < 3) {
    return {
      field: 'name',
      message: 'Account name must be at least 3 characters',
      code: 'MIN_LENGTH',
    };
  }

  if (name.length > 100) {
    return {
      field: 'name',
      message: 'Account name must not exceed 100 characters',
      code: 'MAX_LENGTH',
    };
  }

  return null;
}

/**
 * Validate account code format
 */
export function validateAccountCode(code: string): ValidationError | null {
  if (!code || code.trim().length === 0) {
    return {
      field: 'code',
      message: 'Account code is required',
      code: 'REQUIRED',
    };
  }

  // Account code format: XX-XXX-XXX (e.g., 01-001-001)
  const codePattern = /^\d+-\d+-\d+$/;
  if (!codePattern.test(code)) {
    return {
      field: 'code',
      message: 'Invalid account code format',
      code: 'INVALID_FORMAT',
    };
  }

  return null;
}

/**
 * Validate account code uniqueness
 */
export async function validateAccountCodeUniqueness(
  code: string,
  excludeAccountId?: string
): Promise<ValidationError | null> {
  const existingAccount = await holderAccountRepository.findByCode(code);

  if (existingAccount && existingAccount.id !== excludeAccountId) {
    return {
      field: 'code',
      message: 'Account code already exists',
      code: 'DUPLICATE',
    };
  }

  return null;
}

/**
 * Validate account name uniqueness within the same secondary account
 */
export async function validateAccountNameUniqueness(
  name: string,
  secondaryAccountId: string,
  excludeAccountId?: string
): Promise<ValidationError | null> {
  const accounts = await holderAccountRepository.findBySecondaryAccount(secondaryAccountId);
  
  const duplicate = accounts.find(
    account => 
      account.name.toLowerCase() === name.toLowerCase() && 
      account.id !== excludeAccountId
  );

  if (duplicate) {
    return {
      field: 'name',
      message: 'An account with this name already exists in the selected secondary account',
      code: 'DUPLICATE_NAME',
    };
  }

  return null;
}

/**
 * Validate account hierarchy
 */
export async function validateAccountHierarchy(
  secondaryAccountId: string
): Promise<ValidationError | null> {
  if (!secondaryAccountId) {
    return {
      field: 'secondaryAccountId',
      message: 'Secondary account is required',
      code: 'REQUIRED',
    };
  }

  const secondaryAccount = await secondaryAccountRepository.findById(secondaryAccountId);
  if (!secondaryAccount) {
    return {
      field: 'secondaryAccountId',
      message: 'Invalid secondary account',
      code: 'INVALID',
    };
  }

  // Check if secondary account is active
  if (!secondaryAccount.isActive) {
    return {
      field: 'secondaryAccountId',
      message: 'Cannot create account under an inactive secondary account',
      code: 'INACTIVE_PARENT',
    };
  }

  // Validate primary account exists and is active
  const primaryAccount = await primaryAccountRepository.findById(secondaryAccount.primaryAccountId);
  if (!primaryAccount) {
    return {
      field: 'secondaryAccountId',
      message: 'Invalid account hierarchy: primary account not found',
      code: 'INVALID_HIERARCHY',
    };
  }

  if (!primaryAccount.isActive) {
    return {
      field: 'secondaryAccountId',
      message: 'Cannot create account under an inactive primary account',
      code: 'INACTIVE_PARENT',
    };
  }

  return null;
}

/**
 * Validate account hierarchy consistency for updates
 */
export async function validateAccountHierarchyConsistency(
  accountId: string
): Promise<ValidationError | null> {
  const holderAccount = await holderAccountRepository.findById(accountId);
  if (!holderAccount) {
    return {
      field: 'accountId',
      message: 'Account not found',
      code: 'NOT_FOUND',
    };
  }

  // Verify secondary account exists and is active
  const secondaryAccount = await secondaryAccountRepository.findById(holderAccount.secondaryAccountId);
  if (!secondaryAccount) {
    return {
      field: 'accountId',
      message: 'Account hierarchy is broken: secondary account not found',
      code: 'BROKEN_HIERARCHY',
    };
  }

  // Verify primary account exists and is active
  const primaryAccount = await primaryAccountRepository.findById(secondaryAccount.primaryAccountId);
  if (!primaryAccount) {
    return {
      field: 'accountId',
      message: 'Account hierarchy is broken: primary account not found',
      code: 'BROKEN_HIERARCHY',
    };
  }

  return null;
}

/**
 * Validate account can be deleted
 */
export async function validateAccountDeletion(
  accountId: string
): Promise<ValidationError | null> {
  // Check if account exists
  const account = await holderAccountRepository.findById(accountId);
  if (!account) {
    return {
      field: 'accountId',
      message: 'Account not found',
      code: 'NOT_FOUND',
    };
  }

  // Check if account has transactions
  const transactions = await transactionRepository.findByAccount(accountId);

  if (transactions.length > 0) {
    return {
      field: 'accountId',
      message: `Cannot delete account with existing transactions. This account has ${transactions.length} transaction(s).`,
      code: 'HAS_TRANSACTIONS',
    };
  }

  // Check if account has non-zero balance
  if (account.balance !== 0) {
    return {
      field: 'accountId',
      message: `Cannot delete account with non-zero balance. Current balance: ${account.balance}`,
      code: 'NON_ZERO_BALANCE',
    };
  }

  return null;
}

/**
 * Validate account balance
 */
export function validateAccountBalance(balance: number): ValidationError | null {
  if (isNaN(balance)) {
    return {
      field: 'balance',
      message: 'Invalid balance value',
      code: 'INVALID',
    };
  }

  return null;
}

/**
 * Validate business rules for account creation
 */
export async function validateAccountBusinessRules(data: {
  name: string;
  secondaryAccountId: string;
  balance?: number;
}): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];

  // Business Rule: Initial balance must be zero for new accounts
  if (data.balance !== undefined && data.balance !== 0) {
    errors.push({
      field: 'balance',
      message: 'New accounts must have an initial balance of zero',
      code: 'INVALID_INITIAL_BALANCE',
    });
  }

  return errors;
}

/**
 * Validate holder account creation
 */
export async function validateHolderAccount(data: {
  name: string;
  code: string;
  secondaryAccountId: string;
  description?: string;
}): Promise<ValidationResult> {
  const errors: ValidationError[] = [];

  // Validate name
  const nameError = validateAccountName(data.name);
  if (nameError) errors.push(nameError);

  // Validate name uniqueness
  const nameUniquenessError = await validateAccountNameUniqueness(
    data.name,
    data.secondaryAccountId
  );
  if (nameUniquenessError) errors.push(nameUniquenessError);

  // Validate code
  const codeError = validateAccountCode(data.code);
  if (codeError) errors.push(codeError);

  // Validate code uniqueness
  const codeUniquenessError = await validateAccountCodeUniqueness(data.code);
  if (codeUniquenessError) errors.push(codeUniquenessError);

  // Validate hierarchy
  const hierarchyError = await validateAccountHierarchy(data.secondaryAccountId);
  if (hierarchyError) errors.push(hierarchyError);

  // Validate description length if provided
  if (data.description && data.description.length > 500) {
    errors.push({
      field: 'description',
      message: 'Description must not exceed 500 characters',
      code: 'MAX_LENGTH',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate account update
 */
export async function validateAccountUpdate(
  accountId: string,
  updates: {
    name?: string;
    description?: string;
    isActive?: boolean;
  }
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];

  // Validate account exists
  const account = await holderAccountRepository.findById(accountId);
  if (!account) {
    errors.push({
      field: 'accountId',
      message: 'Account not found',
      code: 'NOT_FOUND',
    });
    return { isValid: false, errors };
  }

  // Validate name if provided
  if (updates.name !== undefined) {
    const nameError = validateAccountName(updates.name);
    if (nameError) errors.push(nameError);
  }

  // Validate description if provided
  if (updates.description && updates.description.length > 500) {
    errors.push({
      field: 'description',
      message: 'Description must not exceed 500 characters',
      code: 'MAX_LENGTH',
    });
  }

  // Validate deactivation
  if (updates.isActive === false) {
    const transactions = await transactionRepository.findByAccount(accountId);
    if (transactions.length > 0) {
      errors.push({
        field: 'isActive',
        message: 'Cannot deactivate account with existing transactions',
        code: 'HAS_TRANSACTIONS',
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) return '';
  if (errors.length === 1) return errors[0].message;
  return errors.map(e => `• ${e.message}`).join('\n');
}
