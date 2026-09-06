-- AlterTable
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "payFrequency" TEXT DEFAULT 'BI_WEEKLY';
