-- Add payment tracking fields to salary_entries table
ALTER TABLE "salary_entries" 
ADD COLUMN "isPaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "paidDate" TIMESTAMP(3),
ADD COLUMN "paymentMethod" TEXT,
ADD COLUMN "paymentReference" TEXT,
ADD COLUMN "updatedAt" TIMESTAMP(3);

-- Create index for payment queries
CREATE INDEX "salary_entries_isPaid_idx" ON "salary_entries"("organizationId", "isPaid");
