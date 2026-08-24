-- AlterTable
ALTER TABLE "companies" ADD COLUMN "standardMileageRate" DOUBLE PRECISION DEFAULT 0.67;

-- DropTable
DROP TABLE IF EXISTS "organizations";
