/*
  Warnings:

  - You are about to drop the column `filingFrequencyPa` on the `companies` table. All the data in the column will be lost.
  - You are about to drop the column `pa_lst_annual` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `pa_lst_exempt` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `pa_psd_code` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `pa_psd_name` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `pa_resident_eit_rate` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `pa_work_eit_rate` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `pa_work_psd_code` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `employer_pa_uc` on the `pay_stubs` table. All the data in the column will be lost.
  - You are about to drop the column `pa_local_eit` on the `pay_stubs` table. All the data in the column will be lost.
  - You are about to drop the column `pa_lst` on the `pay_stubs` table. All the data in the column will be lost.
  - You are about to drop the column `pa_state_tax` on the `pay_stubs` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "OssRole" AS ENUM ('OWNER', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'INVITED', 'DEACTIVATED');

-- AlterTable
ALTER TABLE "companies" DROP COLUMN "filingFrequencyPa",
ADD COLUMN     "stateFilingFrequency" TEXT NOT NULL DEFAULT 'MONTHLY';

-- AlterTable
ALTER TABLE "employees" DROP COLUMN "pa_lst_annual",
DROP COLUMN "pa_lst_exempt",
DROP COLUMN "pa_psd_code",
DROP COLUMN "pa_psd_name",
DROP COLUMN "pa_resident_eit_rate",
DROP COLUMN "pa_work_eit_rate",
DROP COLUMN "pa_work_psd_code",
ADD COLUMN     "local_flat_tax_annual" DOUBLE PRECISION NOT NULL DEFAULT 52.0,
ADD COLUMN     "local_flat_tax_exempt" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "local_tax_jurisdiction_code" TEXT,
ADD COLUMN     "local_tax_jurisdiction_name" TEXT,
ADD COLUMN     "local_tax_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "state_allowances" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "state_w4_filing_status" TEXT,
ADD COLUMN     "tax_attributes" JSONB,
ADD COLUMN     "work_state" TEXT;

-- AlterTable
ALTER TABLE "pay_stubs" DROP COLUMN "employer_pa_uc",
DROP COLUMN "pa_local_eit",
DROP COLUMN "pa_lst",
DROP COLUMN "pa_state_tax",
ADD COLUMN     "employer_state_unemployment" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "local_flat_tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "local_income_tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "locality_code" TEXT,
ADD COLUMN     "locality_name" TEXT,
ADD COLUMN     "state_code" TEXT NOT NULL DEFAULT 'PA',
ADD COLUMN     "state_income_tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "tax_breakdown" JSONB;

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "display_name" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_credentials" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "password_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_memberships" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "role" "OssRole" NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'INVITED',
    "invited_by" TEXT,
    "invited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "company_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "password_credentials_user_id_key" ON "password_credentials"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "password_reset_tokens"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "company_memberships_user_id_company_id_key" ON "company_memberships"("user_id", "company_id");

-- AddForeignKey
ALTER TABLE "password_credentials" ADD CONSTRAINT "password_credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_memberships" ADD CONSTRAINT "company_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_memberships" ADD CONSTRAINT "company_memberships_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
