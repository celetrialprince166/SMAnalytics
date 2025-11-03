-- Remove unique constraint on organizationId and number from transactions table
-- This allows duplicate transaction numbers within the same organization

-- Drop the unique constraint
DROP INDEX IF EXISTS "transactions_organizationId_number_key";

-- Add a regular index instead for query performance
CREATE INDEX IF NOT EXISTS "transactions_organizationId_number_idx" ON "transactions"("organizationId", "number");
