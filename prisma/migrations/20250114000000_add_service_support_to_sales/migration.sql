-- AlterTable
ALTER TABLE "sales_entries" ALTER COLUMN "product_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "sales_entries" ADD COLUMN "service_id" TEXT;

-- CreateIndex
CREATE INDEX "sales_entries_service_id_idx" ON "sales_entries"("service_id");

-- AddForeignKey
ALTER TABLE "sales_entries" ADD CONSTRAINT "sales_entries_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;









