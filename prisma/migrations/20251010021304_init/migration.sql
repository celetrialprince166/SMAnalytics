-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'ACCOUNTANT', 'USER');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('ASSETS', 'LIABILITIES', 'EQUITY', 'REVENUE', 'EXPENSES');

-- CreateEnum
CREATE TYPE "SplitSide" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'RECONCILE', 'UNRECONCILE');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('PURCHASE', 'SALE', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED');

-- CreateEnum
CREATE TYPE "Nationality" AS ENUM ('GHANAIAN', 'OTHER');

-- CreateEnum
CREATE TYPE "AssetCategory" AS ENUM ('BUILDING', 'EQUIPMENT', 'VEHICLE', 'FURNITURE', 'LAND', 'OTHER');

-- CreateEnum
CREATE TYPE "DepreciationType" AS ENUM ('STRAIGHT_LINE', 'DECLINING_BALANCE', 'UNITS_OF_PRODUCTION');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('ACTIVE', 'DISPOSED', 'UNDER_MAINTENANCE', 'RETIRED');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "primary_accounts" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AccountType" NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "primary_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "secondary_accounts" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "primaryAccountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "secondary_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holder_accounts" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "secondaryAccountId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "holder_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "number" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "debitAccountId" TEXT NOT NULL,
    "creditAccountId" TEXT NOT NULL,
    "reconciled" BOOLEAN NOT NULL DEFAULT false,
    "splitTransactionId" TEXT,
    "isPettyCash" BOOLEAN NOT NULL DEFAULT false,
    "parentTransactionId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "split_transactions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "code" TEXT NOT NULL,
    "baseAccountId" TEXT NOT NULL,
    "baseAccountSide" "SplitSide" NOT NULL,
    "splits" JSONB NOT NULL,
    "totalAmount" DECIMAL(15,2) NOT NULL,
    "reconciled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "split_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_entries" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "userId" TEXT,
    "action" "AuditAction" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "previousValues" JSONB,
    "newValues" JSONB,

    CONSTRAINT "audit_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "unitPrice" DECIMAL(15,2) NOT NULL,
    "costPrice" DECIMAL(15,2) NOT NULL,
    "quantityOnHand" INTEGER NOT NULL DEFAULT 0,
    "reorderLevel" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "inventoryAccountId" TEXT NOT NULL,
    "salesAccountId" TEXT NOT NULL,
    "costOfSalesAccountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_entries" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "salesCode" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "salesValue" DECIMAL(15,2) NOT NULL,
    "costValue" DECIMAL(15,2) NOT NULL,
    "customerAccountId" TEXT NOT NULL,
    "costTransactionNumber" TEXT NOT NULL,
    "salesTransactionNumber" TEXT NOT NULL,
    "invoiceNumber" TEXT,
    "applyVat" BOOLEAN NOT NULL DEFAULT false,
    "vatRate" DECIMAL(5,2),
    "vatAmount" DECIMAL(15,2),
    "totalWithVat" DECIMAL(15,2),
    "orderNumber" TEXT,
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_movements" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "productId" TEXT NOT NULL,
    "type" "MovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCost" DECIMAL(15,2) NOT NULL,
    "totalCost" DECIMAL(15,2) NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "registrationDate" TIMESTAMP(3) NOT NULL,
    "status" "ClientStatus" NOT NULL,
    "companyName" TEXT NOT NULL,
    "companyRegNo" TEXT,
    "address" TEXT,
    "contactPerson" TEXT NOT NULL,
    "emailAddress" TEXT NOT NULL,
    "phoneNumbers" TEXT NOT NULL,
    "remarks" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "entryDate" TIMESTAMP(3) NOT NULL,
    "status" "EmployeeStatus" NOT NULL,
    "surname" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "otherNames" TEXT,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "placeOfBirth" TEXT,
    "nationality" "Nationality" NOT NULL,
    "gender" "Gender" NOT NULL,
    "maritalStatus" "MaritalStatus" NOT NULL,
    "numberOfChildren" INTEGER NOT NULL DEFAULT 0,
    "residentialAddress" TEXT,
    "emailAddress" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "position" TEXT,
    "department" TEXT,
    "basicSalary" DECIMAL(15,2) NOT NULL,
    "supervisor" TEXT,
    "entryLevel" TEXT,
    "currentLevel" TEXT,
    "entryBasicSalary" DECIMAL(15,2),
    "holdingBank" TEXT,
    "bankBranch" TEXT,
    "bankAccountNo" TEXT,
    "taxNumber" TEXT,
    "ssnitNumber" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_configurations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "brackets" JSONB NOT NULL,
    "nonResidentRate" DECIMAL(5,2) NOT NULL,
    "personalRelief" DECIMAL(15,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pension_configurations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "tier1EmployerRate" DECIMAL(5,2) NOT NULL,
    "tier1EmployeeRate" DECIMAL(5,2) NOT NULL,
    "tier1PensionRate" DECIMAL(5,2) NOT NULL,
    "tier1NHISRate" DECIMAL(5,2) NOT NULL,
    "tier2Rate" DECIMAL(5,2) NOT NULL,
    "tier3EmployerRate" DECIMAL(5,2) NOT NULL,
    "tier3EmployeeRate" DECIMAL(5,2) NOT NULL,
    "tier3MaxAmount" DECIMAL(15,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pension_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salary_entries" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "salaryDate" TIMESTAMP(3) NOT NULL,
    "processedDate" TIMESTAMP(3) NOT NULL,
    "basicSalary" DECIMAL(15,2) NOT NULL,
    "allowances" DECIMAL(15,2) NOT NULL,
    "commission" DECIMAL(15,2) NOT NULL,
    "grossSalary" DECIMAL(15,2) NOT NULL,
    "incomeTax" DECIMAL(15,2) NOT NULL,
    "tier1Employee" DECIMAL(15,2) NOT NULL,
    "tier2" DECIMAL(15,2) NOT NULL,
    "tier3Employee" DECIMAL(15,2) NOT NULL,
    "totalSSNIT" DECIMAL(15,2) NOT NULL,
    "otherDeductions" DECIMAL(15,2) NOT NULL,
    "totalDeductions" DECIMAL(15,2) NOT NULL,
    "netSalary" DECIMAL(15,2) NOT NULL,
    "taxConfigId" TEXT,
    "pensionConfigId" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "salary_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commissions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "salesEntryId" TEXT,
    "commissionDate" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "rate" DECIMAL(5,2) NOT NULL,
    "salesAmount" DECIMAL(15,2) NOT NULL,
    "remarks" TEXT,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidDate" TIMESTAMP(3),
    "salaryEntryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fixed_assets" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "assetCode" TEXT NOT NULL,
    "acquisitionDate" TIMESTAMP(3) NOT NULL,
    "referenceNumber" TEXT,
    "category" "AssetCategory" NOT NULL,
    "assetClass" TEXT,
    "description" TEXT NOT NULL,
    "valueAtCost" DECIMAL(15,2) NOT NULL,
    "usefulLife" INTEGER NOT NULL,
    "depreciationRate" DECIMAL(5,2) NOT NULL,
    "depreciationType" "DepreciationType" NOT NULL,
    "residualValue" DECIMAL(15,2) NOT NULL,
    "primaryAccountId" TEXT,
    "secondaryAccountId" TEXT,
    "holderAccountId" TEXT,
    "status" "AssetStatus" NOT NULL,
    "remarks" TEXT,
    "accumulatedDepreciation" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "netBookValue" DECIMAL(15,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "fixed_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "depreciation_entries" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "period" TIMESTAMP(3) NOT NULL,
    "depreciationAmount" DECIMAL(15,2) NOT NULL,
    "accumulatedDepreciation" DECIMAL(15,2) NOT NULL,
    "netBookValue" DECIMAL(15,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "depreciation_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_settings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "logo" TEXT,
    "bankName" TEXT,
    "bankAccountNumber" TEXT,
    "bankSortCode" TEXT,
    "bankSwiftCode" TEXT,
    "vatRate" DECIMAL(5,2) NOT NULL,
    "vatRegistrationNumber" TEXT,
    "taxId" TEXT,
    "invoicePrefix" TEXT NOT NULL,
    "invoiceNumberFormat" TEXT NOT NULL,
    "invoiceTermsDays" INTEGER NOT NULL,
    "invoiceFooterText" TEXT,
    "fiscalYearStart" TEXT NOT NULL,
    "baseCurrency" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "organizations_slug_idx" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_organizationId_idx" ON "users"("organizationId");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE INDEX "primary_accounts_organizationId_type_idx" ON "primary_accounts"("organizationId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "primary_accounts_organizationId_name_key" ON "primary_accounts"("organizationId", "name");

-- CreateIndex
CREATE INDEX "secondary_accounts_organizationId_primaryAccountId_idx" ON "secondary_accounts"("organizationId", "primaryAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "secondary_accounts_organizationId_code_key" ON "secondary_accounts"("organizationId", "code");

-- CreateIndex
CREATE INDEX "holder_accounts_organizationId_secondaryAccountId_idx" ON "holder_accounts"("organizationId", "secondaryAccountId");

-- CreateIndex
CREATE INDEX "holder_accounts_organizationId_balance_idx" ON "holder_accounts"("organizationId", "balance");

-- CreateIndex
CREATE UNIQUE INDEX "holder_accounts_organizationId_code_key" ON "holder_accounts"("organizationId", "code");

-- CreateIndex
CREATE INDEX "transactions_organizationId_date_idx" ON "transactions"("organizationId", "date");

-- CreateIndex
CREATE INDEX "transactions_organizationId_debitAccountId_idx" ON "transactions"("organizationId", "debitAccountId");

-- CreateIndex
CREATE INDEX "transactions_organizationId_creditAccountId_idx" ON "transactions"("organizationId", "creditAccountId");

-- CreateIndex
CREATE INDEX "transactions_organizationId_reconciled_idx" ON "transactions"("organizationId", "reconciled");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_organizationId_number_key" ON "transactions"("organizationId", "number");

-- CreateIndex
CREATE INDEX "split_transactions_organizationId_date_idx" ON "split_transactions"("organizationId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "split_transactions_organizationId_code_key" ON "split_transactions"("organizationId", "code");

-- CreateIndex
CREATE INDEX "audit_entries_organizationId_transactionId_idx" ON "audit_entries"("organizationId", "transactionId");

-- CreateIndex
CREATE INDEX "audit_entries_organizationId_timestamp_idx" ON "audit_entries"("organizationId", "timestamp");

-- CreateIndex
CREATE INDEX "products_organizationId_isActive_idx" ON "products"("organizationId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "products_organizationId_code_key" ON "products"("organizationId", "code");

-- CreateIndex
CREATE INDEX "sales_entries_organizationId_date_idx" ON "sales_entries"("organizationId", "date");

-- CreateIndex
CREATE INDEX "sales_entries_organizationId_productId_idx" ON "sales_entries"("organizationId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "sales_entries_organizationId_salesCode_key" ON "sales_entries"("organizationId", "salesCode");

-- CreateIndex
CREATE INDEX "inventory_movements_organizationId_date_idx" ON "inventory_movements"("organizationId", "date");

-- CreateIndex
CREATE INDEX "inventory_movements_organizationId_productId_idx" ON "inventory_movements"("organizationId", "productId");

-- CreateIndex
CREATE INDEX "clients_organizationId_status_idx" ON "clients"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "clients_organizationId_clientId_key" ON "clients"("organizationId", "clientId");

-- CreateIndex
CREATE INDEX "employees_organizationId_status_idx" ON "employees"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "employees_organizationId_employeeId_key" ON "employees"("organizationId", "employeeId");

-- CreateIndex
CREATE INDEX "tax_configurations_organizationId_effectiveDate_idx" ON "tax_configurations"("organizationId", "effectiveDate");

-- CreateIndex
CREATE INDEX "tax_configurations_organizationId_isActive_idx" ON "tax_configurations"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "pension_configurations_organizationId_effectiveDate_idx" ON "pension_configurations"("organizationId", "effectiveDate");

-- CreateIndex
CREATE INDEX "pension_configurations_organizationId_isActive_idx" ON "pension_configurations"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "salary_entries_organizationId_salaryDate_idx" ON "salary_entries"("organizationId", "salaryDate");

-- CreateIndex
CREATE INDEX "salary_entries_organizationId_employeeId_idx" ON "salary_entries"("organizationId", "employeeId");

-- CreateIndex
CREATE INDEX "commissions_organizationId_commissionDate_idx" ON "commissions"("organizationId", "commissionDate");

-- CreateIndex
CREATE INDEX "commissions_organizationId_employeeId_idx" ON "commissions"("organizationId", "employeeId");

-- CreateIndex
CREATE INDEX "commissions_organizationId_isPaid_idx" ON "commissions"("organizationId", "isPaid");

-- CreateIndex
CREATE INDEX "fixed_assets_organizationId_status_idx" ON "fixed_assets"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "fixed_assets_organizationId_assetCode_key" ON "fixed_assets"("organizationId", "assetCode");

-- CreateIndex
CREATE INDEX "depreciation_entries_assetId_period_idx" ON "depreciation_entries"("assetId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "company_settings_organizationId_key" ON "company_settings"("organizationId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "primary_accounts" ADD CONSTRAINT "primary_accounts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secondary_accounts" ADD CONSTRAINT "secondary_accounts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secondary_accounts" ADD CONSTRAINT "secondary_accounts_primaryAccountId_fkey" FOREIGN KEY ("primaryAccountId") REFERENCES "primary_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holder_accounts" ADD CONSTRAINT "holder_accounts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holder_accounts" ADD CONSTRAINT "holder_accounts_secondaryAccountId_fkey" FOREIGN KEY ("secondaryAccountId") REFERENCES "secondary_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_debitAccountId_fkey" FOREIGN KEY ("debitAccountId") REFERENCES "holder_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_creditAccountId_fkey" FOREIGN KEY ("creditAccountId") REFERENCES "holder_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_splitTransactionId_fkey" FOREIGN KEY ("splitTransactionId") REFERENCES "split_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "split_transactions" ADD CONSTRAINT "split_transactions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_entries" ADD CONSTRAINT "audit_entries_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_entries" ADD CONSTRAINT "audit_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_inventoryAccountId_fkey" FOREIGN KEY ("inventoryAccountId") REFERENCES "holder_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_entries" ADD CONSTRAINT "sales_entries_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_entries" ADD CONSTRAINT "sales_entries_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_configurations" ADD CONSTRAINT "tax_configurations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pension_configurations" ADD CONSTRAINT "pension_configurations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_entries" ADD CONSTRAINT "salary_entries_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_entries" ADD CONSTRAINT "salary_entries_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixed_assets" ADD CONSTRAINT "fixed_assets_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "depreciation_entries" ADD CONSTRAINT "depreciation_entries_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "fixed_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_settings" ADD CONSTRAINT "company_settings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Custom functions for business logic

-- Function to calculate account balance
CREATE OR REPLACE FUNCTION calculate_account_balance(account_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
  balance DECIMAL := 0;
BEGIN
  SELECT COALESCE(
    SUM(
      CASE 
        WHEN "debitAccountId" = account_uuid THEN amount
        WHEN "creditAccountId" = account_uuid THEN -amount
        ELSE 0
      END
    ), 0
  ) INTO balance
  FROM transactions
  WHERE ("debitAccountId" = account_uuid OR "creditAccountId" = account_uuid);
  
  RETURN balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate account codes
CREATE OR REPLACE FUNCTION generate_account_code(
  secondary_account_id UUID,
  organization_id UUID
)
RETURNS TEXT AS $$
DECLARE
  primary_code TEXT;
  secondary_code TEXT;
  next_number INTEGER;
  account_code TEXT;
BEGIN
  -- Get primary and secondary codes
  SELECT pa.code, sa.code
  INTO primary_code, secondary_code
  FROM secondary_accounts sa
  JOIN primary_accounts pa ON sa."primaryAccountId" = pa.id
  WHERE sa.id = secondary_account_id
    AND sa."organizationId" = generate_account_code.organization_id;
  
  -- Get next sequential number
  SELECT COALESCE(MAX(CAST(SPLIT_PART(ha.code, '-', 3) AS INTEGER)), 0) + 1
  INTO next_number
  FROM holder_accounts ha
  WHERE ha."secondaryAccountId" = secondary_account_id
    AND ha."organizationId" = generate_account_code.organization_id;
  
  -- Format account code
  account_code := primary_code || '-' || secondary_code || '-' || 
                  LPAD(next_number::TEXT, 3, '0');
  
  RETURN account_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE primary_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE secondary_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE holder_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE split_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pension_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE depreciation_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (to be enhanced later)
CREATE POLICY "Users can access their organization's data" ON organizations
  FOR ALL
  USING (
    id IN (
      SELECT "organizationId" 
      FROM users 
      WHERE id = auth.uid()::text
    )
  );

CREATE POLICY "Users can access their organization's accounts" ON holder_accounts
  FOR ALL
  USING (
    "organizationId" IN (
      SELECT "organizationId" 
      FROM users 
      WHERE id = auth.uid()::text
    )
  );

CREATE POLICY "Users can access their organization's transactions" ON transactions
  FOR ALL
  USING (
    "organizationId" IN (
      SELECT "organizationId" 
      FROM users 
      WHERE id = auth.uid()::text
    )
  );
