-- CreateTable
CREATE TABLE "vat_tax_configurations" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "nhil" DECIMAL(5,2) NOT NULL,
    "getfund" DECIMAL(5,2) NOT NULL,
    "covid19" DECIMAL(5,2) NOT NULL,
    "vat" DECIMAL(5,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "organization_id" TEXT NOT NULL,

    CONSTRAINT "vat_tax_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "withholding_tax_configurations" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "non_individual_threshold" DECIMAL(10,2) NOT NULL,
    "non_individual_rate" DECIMAL(5,2) NOT NULL,
    "individual_rate" DECIMAL(5,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "organization_id" TEXT NOT NULL,

    CONSTRAINT "withholding_tax_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vat_tax_configurations_organization_id_idx" ON "vat_tax_configurations"("organization_id");

-- CreateIndex
CREATE INDEX "withholding_tax_configurations_organization_id_idx" ON "withholding_tax_configurations"("organization_id");

-- AddForeignKey
ALTER TABLE "vat_tax_configurations" ADD CONSTRAINT "vat_tax_configurations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withholding_tax_configurations" ADD CONSTRAINT "withholding_tax_configurations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

