/**
 * Zod Validation Schemas
 * 
 * Comprehensive validation schemas for all API resources using Zod
 */

import { z } from 'zod';

// Base schemas for common patterns
const idSchema = z.string().uuid('Invalid ID format');
const optionalIdSchema = z.string().uuid('Invalid ID format').optional();
const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});
const sortSchema = z.object({
  field: z.string().min(1),
  order: z.enum(['asc', 'desc']).default('asc'),
});

// Organization schemas
export const createOrganizationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  slug: z.string().min(1, 'Slug is required').max(50, 'Slug too long').regex(/^[a-z0-9-]+$/, 'Invalid slug format'),
  isActive: z.boolean().default(true),
});

export const updateOrganizationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  slug: z.string().min(1, 'Slug is required').max(50, 'Slug too long').regex(/^[a-z0-9-]+$/, 'Invalid slug format').optional(),
  isActive: z.boolean().optional(),
});

export const getOrganizationsSchema = z.object({
  ...paginationSchema.shape,
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});

// User schemas
export const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  username: z.string().min(3, 'Username too short').max(50, 'Username too long'),
  passwordHash: z.string().min(8, 'Password too short'),
  role: z.enum(['ADMIN', 'MANAGER', 'ACCOUNTANT', 'USER']).default('USER'),
  isActive: z.boolean().default(true),
  organizationId: idSchema,
});

export const updateUserSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  username: z.string().min(3, 'Username too short').max(50, 'Username too long').optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'ACCOUNTANT', 'USER']).optional(),
  isActive: z.boolean().optional(),
});

export const getUsersSchema = z.object({
  ...paginationSchema.shape,
  search: z.string().optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'ACCOUNTANT', 'USER']).optional(),
  isActive: z.coerce.boolean().optional(),
  organizationId: idSchema.optional(),
});

// Primary Account schemas
export const createPrimaryAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  type: z.enum(['ASSETS', 'LIABILITIES', 'EQUITY', 'INCOME', 'REVENUE', 'EXPENSES']),
  description: z.string().max(500, 'Description too long').optional(),
  isActive: z.boolean().default(true),
  organizationId: idSchema,
});

export const updatePrimaryAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
  isActive: z.boolean().optional(),
});

export const getPrimaryAccountsSchema = z.object({
  ...paginationSchema.shape,
  search: z.string().optional(),
  type: z.enum(['ASSETS', 'LIABILITIES', 'EQUITY', 'INCOME', 'REVENUE', 'EXPENSES']).optional(),
  isActive: z.coerce.boolean().optional(),
  organizationId: idSchema.optional(),
});

// Secondary Account schemas
export const createSecondaryAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  code: z.string().min(1, 'Code is required').max(10, 'Code too long'),
  description: z.string().max(500, 'Description too long').optional(),
  isActive: z.boolean().default(true),
  organizationId: idSchema,
  primaryAccountId: idSchema,
});

export const updateSecondaryAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  code: z.string().min(1, 'Code is required').max(10, 'Code too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
  isActive: z.boolean().optional(),
  primaryAccountId: idSchema.optional(),
});

export const getSecondaryAccountsSchema = z.object({
  ...paginationSchema.shape,
  search: z.string().optional(),
  primaryAccountId: idSchema.optional(),
  isActive: z.coerce.boolean().optional(),
  organizationId: idSchema.optional(),
});

// Holder Account schemas
export const createHolderAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  code: z.string().min(1, 'Code is required').max(20, 'Code too long'),
  description: z.string().max(500, 'Description too long').optional(),
  balance: z.coerce.number().default(0),
  isActive: z.boolean().default(true),
  organizationId: idSchema,
  secondaryAccountId: idSchema,
});

export const updateHolderAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  code: z.string().min(1, 'Code is required').max(20, 'Code too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
  isActive: z.boolean().optional(),
  secondaryAccountId: idSchema.optional(),
});

export const getHolderAccountsSchema = z.object({
  ...paginationSchema.shape,
  search: z.string().optional(),
  secondaryAccountId: idSchema.optional(),
  isActive: z.coerce.boolean().optional(),
  organizationId: idSchema.optional(),
});

// Transaction schemas
export const createTransactionSchema = z.object({
  number: z.string().min(1, 'Transaction number is required').max(50, 'Number too long'),
  date: z.coerce.date(),
  description: z.string().min(1, 'Description is required').max(500, 'Description too long'),
  amount: z.coerce.number().positive('Amount must be positive'),
  reconciled: z.boolean().default(false),
  organizationId: idSchema,
  debitAccountId: idSchema,
  creditAccountId: idSchema,
});

export const updateTransactionSchema = z.object({
  number: z.string().min(1, 'Transaction number is required').max(50, 'Number too long').optional(),
  date: z.coerce.date().optional(),
  description: z.string().min(1, 'Description is required').max(500, 'Description too long').optional(),
  amount: z.coerce.number().positive('Amount must be positive').optional(),
  reconciled: z.boolean().optional(),
  debitAccountId: idSchema.optional(),
  creditAccountId: idSchema.optional(),
});

export const getTransactionsSchema = z.object({
  ...paginationSchema.shape,
  search: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  accountId: idSchema.optional(),
  reconciled: z.coerce.boolean().optional(),
  organizationId: idSchema.optional(),
});

// Product schemas
export const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  sku: z.string().min(1, 'SKU is required').max(50, 'SKU too long'),
  unitPrice: z.coerce.number().nonnegative('Unit price must be non-negative'),
  unitCost: z.coerce.number().nonnegative('Unit cost must be non-negative').optional(),
  category: z.string().max(50, 'Category too long').optional(),
  isActive: z.boolean().default(true),
  organizationId: idSchema,
});

export const updateProductSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
  sku: z.string().min(1, 'SKU is required').max(50, 'SKU too long').optional(),
  unitPrice: z.coerce.number().nonnegative('Unit price must be non-negative').optional(),
  unitCost: z.coerce.number().nonnegative('Unit cost must be non-negative').optional(),
  category: z.string().max(50, 'Category too long').optional(),
  isActive: z.boolean().optional(),
});

export const getProductsSchema = z.object({
  ...paginationSchema.shape,
  search: z.string().optional(),
  category: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  organizationId: idSchema.optional(),
});

// Sales Entry schemas
export const createSalesEntrySchema = z.object({
  date: z.coerce.date(),
  productId: idSchema,
  description: z.string().min(1, 'Description is required').max(500, 'Description too long'),
  salesValue: z.coerce.number().nonnegative('Sales value must be non-negative'),
  costValue: z.coerce.number().nonnegative('Cost value must be non-negative'),
  customerAccountId: idSchema,
  applyVat: z.boolean().default(false),
  vatRate: z.coerce.number().min(0).max(100).optional(),
  organizationId: idSchema,
});

export const updateSalesEntrySchema = z.object({
  date: z.coerce.date().optional(),
  productId: idSchema.optional(),
  description: z.string().min(1, 'Description is required').max(500, 'Description too long').optional(),
  salesValue: z.coerce.number().nonnegative('Sales value must be non-negative').optional(),
  costValue: z.coerce.number().nonnegative('Cost value must be non-negative').optional(),
  customerAccountId: idSchema.optional(),
  applyVat: z.boolean().optional(),
  vatRate: z.coerce.number().min(0).max(100).optional(),
});

export const getSalesEntriesSchema = z.object({
  ...paginationSchema.shape,
  search: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  organizationId: idSchema.optional(),
});

// Client schemas
export const createClientSchema = z.object({
  registrationDate: z.string().datetime(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
  companyName: z.string().min(1, 'Company name is required').max(200, 'Company name too long'),
  companyRegNo: z.string().max(50, 'Company registration number too long').optional(),
  address: z.string().max(500, 'Address too long').optional(),
  contactPerson: z.string().min(1, 'Contact person is required').max(100, 'Contact person name too long'),
  emailAddress: z.string().email('Invalid email format'),
  phoneNumbers: z.string().min(1, 'Phone number is required').max(50, 'Phone number too long'),
  remarks: z.string().max(1000, 'Remarks too long').optional(),
  organizationId: idSchema,
});

export const updateClientSchema = z.object({
  registrationDate: z.string().datetime().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  companyName: z.string().min(1, 'Company name is required').max(200, 'Company name too long').optional(),
  companyRegNo: z.string().max(50, 'Company registration number too long').optional(),
  address: z.string().max(500, 'Address too long').optional(),
  contactPerson: z.string().min(1, 'Contact person is required').max(100, 'Contact person name too long').optional(),
  emailAddress: z.string().email('Invalid email format').optional(),
  phoneNumbers: z.string().min(1, 'Phone number is required').max(50, 'Phone number too long').optional(),
  remarks: z.string().max(1000, 'Remarks too long').optional(),
  isActive: z.boolean().optional(),
});

export const getClientsSchema = z.object({
  ...paginationSchema.shape,
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  isActive: z.coerce.boolean().optional(),
  organizationId: idSchema.optional(),
});

// Employee schemas
export const createEmployeeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().max(20, 'Phone number too long').optional(),
  position: z.string().max(50, 'Position too long').optional(),
  hireDate: z.coerce.date(),
  isActive: z.boolean().default(true),
  organizationId: idSchema,
});

export const updateEmployeeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().max(20, 'Phone number too long').optional(),
  position: z.string().max(50, 'Position too long').optional(),
  hireDate: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
});

export const getEmployeesSchema = z.object({
  ...paginationSchema.shape,
  search: z.string().optional(),
  position: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  organizationId: idSchema.optional(),
});

// Fixed Asset schemas
export const createFixedAssetSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  category: z.string().max(50, 'Category too long').optional(),
  purchaseDate: z.coerce.date(),
  purchasePrice: z.coerce.number().nonnegative('Purchase price must be non-negative'),
  usefulLife: z.coerce.number().int().positive('Useful life must be positive'),
  depreciationMethod: z.enum(['STRAIGHT_LINE', 'DECLINING_BALANCE']).default('STRAIGHT_LINE'),
  isActive: z.boolean().default(true),
  organizationId: idSchema,
});

export const updateFixedAssetSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
  category: z.string().max(50, 'Category too long').optional(),
  purchaseDate: z.coerce.date().optional(),
  purchasePrice: z.coerce.number().nonnegative('Purchase price must be non-negative').optional(),
  usefulLife: z.coerce.number().int().positive('Useful life must be positive').optional(),
  depreciationMethod: z.enum(['STRAIGHT_LINE', 'DECLINING_BALANCE']).optional(),
  isActive: z.boolean().optional(),
});

export const getFixedAssetsSchema = z.object({
  ...paginationSchema.shape,
  search: z.string().optional(),
  category: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  organizationId: idSchema.optional(),
});

// Company Settings schemas
export const createCompanySettingsSchema = z.object({
  companyName: z.string().min(1, 'Company name is required').max(100, 'Company name too long'),
  address: z.string().max(200, 'Address too long').optional(),
  phone: z.string().max(20, 'Phone number too long').optional(),
  email: z.string().email('Invalid email format').optional(),
  website: z.string().url('Invalid website URL').optional(),
  fiscalYearStart: z.coerce.date(),
  currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
  organizationId: idSchema,
});

export const updateCompanySettingsSchema = z.object({
  companyName: z.string().min(1, 'Company name is required').max(100, 'Company name too long').optional(),
  address: z.string().max(200, 'Address too long').optional(),
  phone: z.string().max(20, 'Phone number too long').optional(),
  email: z.string().email('Invalid email format').optional(),
  website: z.string().url('Invalid website URL').optional(),
  fiscalYearStart: z.coerce.date().optional(),
  currency: z.string().length(3, 'Currency must be 3 characters').optional(),
});

export const getCompanySettingsSchema = z.object({
  organizationId: idSchema.optional(),
});

// Report schemas
export const getAccountBalanceReportSchema = z.object({
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  accountId: idSchema.optional(),
  organizationId: idSchema.optional(),
});

export const getBalanceSheetSchema = z.object({
  date: z.coerce.date(),
  organizationId: idSchema.optional(),
});

export const getProfitLossSchema = z.object({
  dateFrom: z.coerce.date(),
  dateTo: z.coerce.date(),
  organizationId: idSchema.optional(),
});

export const getCashFlowSchema = z.object({
  dateFrom: z.coerce.date(),
  dateTo: z.coerce.date(),
  organizationId: idSchema.optional(),
});

export const getSalesReportSchema = z.object({
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  productId: idSchema.optional(),
  organizationId: idSchema.optional(),
});

export const getPayrollReportSchema = z.object({
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  employeeId: idSchema.optional(),
  organizationId: idSchema.optional(),
});

// Type exports for use in API routes
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type GetOrganizationsInput = z.infer<typeof getOrganizationsSchema>;

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type GetUsersInput = z.infer<typeof getUsersSchema>;

export type CreatePrimaryAccountInput = z.infer<typeof createPrimaryAccountSchema>;
export type UpdatePrimaryAccountInput = z.infer<typeof updatePrimaryAccountSchema>;
export type GetPrimaryAccountsInput = z.infer<typeof getPrimaryAccountsSchema>;

export type CreateSecondaryAccountInput = z.infer<typeof createSecondaryAccountSchema>;
export type UpdateSecondaryAccountInput = z.infer<typeof updateSecondaryAccountSchema>;
export type GetSecondaryAccountsInput = z.infer<typeof getSecondaryAccountsSchema>;

export type CreateHolderAccountInput = z.infer<typeof createHolderAccountSchema>;
export type UpdateHolderAccountInput = z.infer<typeof updateHolderAccountSchema>;
export type GetHolderAccountsInput = z.infer<typeof getHolderAccountsSchema>;

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type GetTransactionsInput = z.infer<typeof getTransactionsSchema>;

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type GetProductsInput = z.infer<typeof getProductsSchema>;

export type CreateSalesEntryInput = z.infer<typeof createSalesEntrySchema>;
export type UpdateSalesEntryInput = z.infer<typeof updateSalesEntrySchema>;
export type GetSalesEntriesInput = z.infer<typeof getSalesEntriesSchema>;

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type GetClientsInput = z.infer<typeof getClientsSchema>;

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type GetEmployeesInput = z.infer<typeof getEmployeesSchema>;

export type CreateFixedAssetInput = z.infer<typeof createFixedAssetSchema>;
export type UpdateFixedAssetInput = z.infer<typeof updateFixedAssetSchema>;
export type GetFixedAssetsInput = z.infer<typeof getFixedAssetsSchema>;

export type CreateCompanySettingsInput = z.infer<typeof createCompanySettingsSchema>;
export type UpdateCompanySettingsInput = z.infer<typeof updateCompanySettingsSchema>;
export type GetCompanySettingsInput = z.infer<typeof getCompanySettingsSchema>;

export type GetAccountBalanceReportInput = z.infer<typeof getAccountBalanceReportSchema>;
export type GetBalanceSheetInput = z.infer<typeof getBalanceSheetSchema>;
export type GetProfitLossInput = z.infer<typeof getProfitLossSchema>;
export type GetCashFlowInput = z.infer<typeof getCashFlowSchema>;
export type GetSalesReportInput = z.infer<typeof getSalesReportSchema>;
export type GetPayrollReportInput = z.infer<typeof getPayrollReportSchema>;

