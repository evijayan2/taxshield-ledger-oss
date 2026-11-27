-- CreateTable
CREATE TABLE "company_tax_settings" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "tax_kind" TEXT NOT NULL DEFAULT 'SUTA',
    "state_account_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_tax_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experience_rate_histories" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "company_tax_setting_id" TEXT NOT NULL,
    "tax_year_id" TEXT,
    "rate_decimal" DECIMAL(10,5) NOT NULL,
    "rate_bps" INTEGER NOT NULL,
    "wage_base_override" DECIMAL(12,2),
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "notice_reference" TEXT,
    "notice_date" DATE,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "verified_by" TEXT,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "experience_rate_histories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "company_tax_settings_company_id_jurisdiction_tax_kind_key" ON "company_tax_settings"("company_id", "jurisdiction", "tax_kind");

-- CreateIndex
CREATE INDEX "company_tax_settings_company_id_jurisdiction_idx" ON "company_tax_settings"("company_id", "jurisdiction");

-- CreateIndex
CREATE INDEX "experience_rate_histories_company_id_effective_from_idx" ON "experience_rate_histories"("company_id", "effective_from");

-- CreateIndex
CREATE INDEX "experience_rate_histories_company_tax_setting_id_effective_from_idx" ON "experience_rate_histories"("company_tax_setting_id", "effective_from");

-- CreateIndex
CREATE INDEX "experience_rate_histories_company_tax_setting_id_status_idx" ON "experience_rate_histories"("company_tax_setting_id", "status");

-- AddForeignKey
ALTER TABLE "company_tax_settings" ADD CONSTRAINT "company_tax_settings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experience_rate_histories" ADD CONSTRAINT "experience_rate_histories_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experience_rate_histories" ADD CONSTRAINT "experience_rate_histories_company_tax_setting_id_fkey" FOREIGN KEY ("company_tax_setting_id") REFERENCES "company_tax_settings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experience_rate_histories" ADD CONSTRAINT "experience_rate_histories_tax_year_id_fkey" FOREIGN KEY ("tax_year_id") REFERENCES "tax_years"("id") ON DELETE SET NULL ON UPDATE CASCADE;
