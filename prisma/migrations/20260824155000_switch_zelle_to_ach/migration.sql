-- AlterTable
ALTER TABLE "employees" DROP COLUMN "zelle_handle",
ADD COLUMN     "account_number" TEXT,
ADD COLUMN     "account_type" TEXT NOT NULL DEFAULT 'CHECKING',
ADD COLUMN     "bank_name" TEXT,
ADD COLUMN     "routing_number" TEXT;

-- AlterTable
ALTER TABLE "pay_stubs" DROP COLUMN "zelle_confirmation_ref",
ADD COLUMN     "ach_trace_ref" TEXT,
ALTER COLUMN "disbursement_method" SET DEFAULT 'ACH';
