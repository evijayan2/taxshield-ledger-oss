/*
  Warnings:

  - You are about to drop the column `amountDue` on the `compliance_tasks` table. All the data in the column will be lost.
  - You are about to drop the column `boxValues` on the `compliance_tasks` table. All the data in the column will be lost.
  - You are about to drop the column `companyId` on the `compliance_tasks` table. All the data in the column will be lost.
  - You are about to drop the column `confirmationNumber` on the `compliance_tasks` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `compliance_tasks` table. All the data in the column will be lost.
  - You are about to drop the column `dueDate` on the `compliance_tasks` table. All the data in the column will be lost.
  - You are about to drop the column `filedDate` on the `compliance_tasks` table. All the data in the column will be lost.
  - You are about to drop the column `filingMethod` on the `compliance_tasks` table. All the data in the column will be lost.
  - You are about to drop the column `formIdentifier` on the `compliance_tasks` table. All the data in the column will be lost.
  - You are about to drop the column `portalUrl` on the `compliance_tasks` table. All the data in the column will be lost.
  - You are about to drop the column `taxPeriodLabel` on the `compliance_tasks` table. All the data in the column will be lost.
  - You are about to drop the column `bankAccountMasked` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `companyId` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `employmentType` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `firstName` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `paLstAnnual` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `paLstExempt` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `paPsdCode` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `paPsdName` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `paResidentEitRate` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `paWorkEitRate` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `paWorkPsdCode` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `payFrequency` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `payRate` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `relationshipToOwner` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `ssnLastFour` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `streetAddress` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `w4Deductions` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `w4DependentCredit` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `w4ExtraWithholding` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `w4FilingStatus` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `w4MultipleJobs` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `w4OtherIncome` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `zelleHandle` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `companyId` on the `general_expenses` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `general_expenses` table. All the data in the column will be lost.
  - You are about to drop the column `expenseDate` on the `general_expenses` table. All the data in the column will be lost.
  - You are about to drop the column `isTaxDeductible` on the `general_expenses` table. All the data in the column will be lost.
  - You are about to drop the column `scheduleCLine` on the `general_expenses` table. All the data in the column will be lost.
  - You are about to drop the column `businessPurpose` on the `mileage_logs` table. All the data in the column will be lost.
  - You are about to drop the column `calculatedMiles` on the `mileage_logs` table. All the data in the column will be lost.
  - You are about to drop the column `companyId` on the `mileage_logs` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `mileage_logs` table. All the data in the column will be lost.
  - You are about to drop the column `destinationLocation` on the `mileage_logs` table. All the data in the column will be lost.
  - You are about to drop the column `employeeId` on the `mileage_logs` table. All the data in the column will be lost.
  - You are about to drop the column `endOdometer` on the `mileage_logs` table. All the data in the column will be lost.
  - You are about to drop the column `isReimbursableAccountablePlan` on the `mileage_logs` table. All the data in the column will be lost.
  - You are about to drop the column `linkedPayStubId` on the `mileage_logs` table. All the data in the column will be lost.
  - You are about to drop the column `mileageAllowance` on the `mileage_logs` table. All the data in the column will be lost.
  - You are about to drop the column `originLocation` on the `mileage_logs` table. All the data in the column will be lost.
  - You are about to drop the column `rateApplied` on the `mileage_logs` table. All the data in the column will be lost.
  - You are about to drop the column `startOdometer` on the `mileage_logs` table. All the data in the column will be lost.
  - You are about to drop the column `tripDate` on the `mileage_logs` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `pay_stubs` table. All the data in the column will be lost.
  - You are about to drop the column `disbursementMethod` on the `pay_stubs` table. All the data in the column will be lost.
  - You are about to drop the column `disbursementStatus` on the `pay_stubs` table. All the data in the column will be lost.
  - You are about to drop the column `employeeId` on the `pay_stubs` table. All the data in the column will be lost.
  - You are about to drop the column `employerMedicare` on the `pay_stubs` table. All the data in the column will be lost.
  - You are about to drop the column `employerPaUc` on the `pay_stubs` table. All the data in the column will be lost.
  - You are about to drop the column `employerSocialSecurity` on the `pay_stubs` table. All the data in the column will be lost.
  - You are about to drop the column `federalIncomeTax` on the `pay_stubs` table. All the data in the column will be lost.
  - You are about to drop the column `grossEarnings` on the `pay_stubs` table. All the data in the column will be lost.
  - You are about to drop the column `hourlyRate` on the `pay_stubs` table. All the data in the column will be lost.
  - You are about to drop the column `hoursWorked` on the `pay_stubs` table. All the data in the column will be lost.
  - You are about to drop the column `medicareTax` on the `pay_stubs` table. All the data in the column will be lost.
  - You are about to drop the column `mileageReimbursement` on the `pay_stubs` table. All the data in the column will be lost.
  - You are about to drop the column `netPay` on the `pay_stubs` table. All the data in the column will be lost.
  - You are about to drop the column `overtimeHours` on the `pay_stubs` table. All the data in the column will be lost.
  - You are about to drop the column `paLocalEit` on the `pay_stubs` table. All the data in the column will be lost.
  - You are about to drop the column `paLst` on the `pay_stubs` table. All the data in the column will be lost.
  - You are about to drop the column `paStateTax` on the `pay_stubs` table. All the data in the column will be lost.
  - You are about to drop the column `paidAt` on the `pay_stubs` table. All the data in the column will be lost.
  - You are about to drop the column `payDate` on the `pay_stubs` table. All the data in the column will be lost.
  - You are about to drop the column `payrollRunId` on the `pay_stubs` table. All the data in the column will be lost.
  - You are about to drop the column `periodEnd` on the `pay_stubs` table. All the data in the column will be lost.
  - You are about to drop the column `periodStart` on the `pay_stubs` table. All the data in the column will be lost.
  - You are about to drop the column `socialSecurityTax` on the `pay_stubs` table. All the data in the column will be lost.
  - You are about to drop the column `totalCompanyCost` on the `pay_stubs` table. All the data in the column will be lost.
  - You are about to drop the column `totalEmployeeTaxes` on the `pay_stubs` table. All the data in the column will be lost.
  - You are about to drop the column `totalEmployerTaxes` on the `pay_stubs` table. All the data in the column will be lost.
  - You are about to drop the column `totalReimbursements` on the `pay_stubs` table. All the data in the column will be lost.
  - You are about to drop the column `travelExpensesReimbursement` on the `pay_stubs` table. All the data in the column will be lost.
  - You are about to drop the column `zelleConfirmationRef` on the `pay_stubs` table. All the data in the column will be lost.
  - You are about to drop the column `companyId` on the `payroll_runs` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `payroll_runs` table. All the data in the column will be lost.
  - You are about to drop the column `lockedAt` on the `payroll_runs` table. All the data in the column will be lost.
  - You are about to drop the column `payDate` on the `payroll_runs` table. All the data in the column will be lost.
  - You are about to drop the column `periodEnd` on the `payroll_runs` table. All the data in the column will be lost.
  - You are about to drop the column `periodStart` on the `payroll_runs` table. All the data in the column will be lost.
  - You are about to drop the column `stubsCount` on the `payroll_runs` table. All the data in the column will be lost.
  - You are about to drop the column `totalCompanyCost` on the `payroll_runs` table. All the data in the column will be lost.
  - You are about to drop the column `totalEmployeeTaxes` on the `payroll_runs` table. All the data in the column will be lost.
  - You are about to drop the column `totalEmployerTaxes` on the `payroll_runs` table. All the data in the column will be lost.
  - You are about to drop the column `totalGross` on the `payroll_runs` table. All the data in the column will be lost.
  - You are about to drop the column `totalNetPay` on the `payroll_runs` table. All the data in the column will be lost.
  - You are about to drop the column `totalReimbursements` on the `payroll_runs` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `timesheets` table. All the data in the column will be lost.
  - You are about to drop the column `employeeId` on the `timesheets` table. All the data in the column will be lost.
  - You are about to drop the column `endTime` on the `timesheets` table. All the data in the column will be lost.
  - You are about to drop the column `linkedPayStubId` on the `timesheets` table. All the data in the column will be lost.
  - You are about to drop the column `overtimeHours` on the `timesheets` table. All the data in the column will be lost.
  - You are about to drop the column `regularHours` on the `timesheets` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `timesheets` table. All the data in the column will be lost.
  - You are about to drop the column `unpaidBreakMinutes` on the `timesheets` table. All the data in the column will be lost.
  - You are about to drop the column `workDate` on the `timesheets` table. All the data in the column will be lost.
  - You are about to drop the column `companyId` on the `travel_expenses` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `travel_expenses` table. All the data in the column will be lost.
  - You are about to drop the column `employeeId` on the `travel_expenses` table. All the data in the column will be lost.
  - You are about to drop the column `expenseDate` on the `travel_expenses` table. All the data in the column will be lost.
  - You are about to drop the column `isReimbursable` on the `travel_expenses` table. All the data in the column will be lost.
  - You are about to drop the column `linkedPayStubId` on the `travel_expenses` table. All the data in the column will be lost.
  - You are about to drop the column `mileageLogId` on the `travel_expenses` table. All the data in the column will be lost.
  - You are about to drop the column `paymentSource` on the `travel_expenses` table. All the data in the column will be lost.
  - You are about to drop the column `receiptNote` on the `travel_expenses` table. All the data in the column will be lost.
  - You are about to drop the column `receiptUrl` on the `travel_expenses` table. All the data in the column will be lost.
  - Added the required column `amount_due` to the `compliance_tasks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `box_values` to the `compliance_tasks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `due_date` to the `compliance_tasks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `form_identifier` to the `compliance_tasks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tax_period_label` to the `compliance_tasks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `employment_type` to the `employees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `first_name` to the `employees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last_name` to the `employees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pa_psd_code` to the `employees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pa_psd_name` to the `employees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pa_resident_eit_rate` to the `employees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pa_work_eit_rate` to the `employees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pa_work_psd_code` to the `employees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pay_frequency` to the `employees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pay_rate` to the `employees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ssn_last_four` to the `employees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `w4_filing_status` to the `employees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `zelle_handle` to the `employees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expense_date` to the `general_expenses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `business_purpose` to the `mileage_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `calculated_miles` to the `mileage_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `destination_location` to the `mileage_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `employee_id` to the `mileage_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `end_odometer` to the `mileage_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mileage_allowance` to the `mileage_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `origin_location` to the `mileage_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rate_applied` to the `mileage_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_odometer` to the `mileage_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `trip_date` to the `mileage_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `disbursement_method` to the `pay_stubs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `disbursement_status` to the `pay_stubs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `employee_id` to the `pay_stubs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `employer_medicare` to the `pay_stubs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `employer_pa_uc` to the `pay_stubs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `employer_social_security` to the `pay_stubs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `federal_income_tax` to the `pay_stubs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gross_earnings` to the `pay_stubs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hourly_rate` to the `pay_stubs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hours_worked` to the `pay_stubs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `medicare_tax` to the `pay_stubs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mileage_reimbursement` to the `pay_stubs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `net_pay` to the `pay_stubs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `overtime_hours` to the `pay_stubs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pa_local_eit` to the `pay_stubs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pa_lst` to the `pay_stubs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pa_state_tax` to the `pay_stubs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pay_date` to the `pay_stubs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `payroll_run_id` to the `pay_stubs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `period_end` to the `pay_stubs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `period_start` to the `pay_stubs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `social_security_tax` to the `pay_stubs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_company_cost` to the `pay_stubs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_employee_taxes` to the `pay_stubs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_employer_taxes` to the `pay_stubs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_reimbursements` to the `pay_stubs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `travel_expenses_reimbursement` to the `pay_stubs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pay_date` to the `payroll_runs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `period_end` to the `payroll_runs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `period_start` to the `payroll_runs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stubs_count` to the `payroll_runs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_company_cost` to the `payroll_runs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_employee_taxes` to the `payroll_runs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_employer_taxes` to the `payroll_runs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_gross` to the `payroll_runs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_net_pay` to the `payroll_runs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_reimbursements` to the `payroll_runs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `employee_id` to the `timesheets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `end_time` to the `timesheets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `overtime_hours` to the `timesheets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `regular_hours` to the `timesheets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_time` to the `timesheets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `work_date` to the `timesheets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `employee_id` to the `travel_expenses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expense_date` to the `travel_expenses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `payment_source` to the `travel_expenses` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "compliance_tasks" DROP CONSTRAINT "compliance_tasks_companyId_fkey";

-- DropForeignKey
ALTER TABLE "employees" DROP CONSTRAINT "employees_companyId_fkey";

-- DropForeignKey
ALTER TABLE "general_expenses" DROP CONSTRAINT "general_expenses_companyId_fkey";

-- DropForeignKey
ALTER TABLE "mileage_logs" DROP CONSTRAINT "mileage_logs_companyId_fkey";

-- DropForeignKey
ALTER TABLE "mileage_logs" DROP CONSTRAINT "mileage_logs_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "pay_stubs" DROP CONSTRAINT "pay_stubs_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "pay_stubs" DROP CONSTRAINT "pay_stubs_payrollRunId_fkey";

-- DropForeignKey
ALTER TABLE "payroll_runs" DROP CONSTRAINT "payroll_runs_companyId_fkey";

-- DropForeignKey
ALTER TABLE "timesheets" DROP CONSTRAINT "timesheets_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "travel_expenses" DROP CONSTRAINT "travel_expenses_companyId_fkey";

-- DropForeignKey
ALTER TABLE "travel_expenses" DROP CONSTRAINT "travel_expenses_employeeId_fkey";

-- AlterTable
ALTER TABLE "compliance_tasks" DROP COLUMN "amountDue",
DROP COLUMN "boxValues",
DROP COLUMN "companyId",
DROP COLUMN "confirmationNumber",
DROP COLUMN "createdAt",
DROP COLUMN "dueDate",
DROP COLUMN "filedDate",
DROP COLUMN "filingMethod",
DROP COLUMN "formIdentifier",
DROP COLUMN "portalUrl",
DROP COLUMN "taxPeriodLabel",
ADD COLUMN     "amount_due" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "box_values" JSONB NOT NULL,
ADD COLUMN     "company_id" TEXT,
ADD COLUMN     "confirmation_number" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "due_date" TEXT NOT NULL,
ADD COLUMN     "filed_date" TEXT,
ADD COLUMN     "filing_method" TEXT,
ADD COLUMN     "form_identifier" TEXT NOT NULL,
ADD COLUMN     "portal_url" TEXT,
ADD COLUMN     "tax_period_label" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "employees" DROP COLUMN "bankAccountMasked",
DROP COLUMN "companyId",
DROP COLUMN "createdAt",
DROP COLUMN "employmentType",
DROP COLUMN "firstName",
DROP COLUMN "isActive",
DROP COLUMN "lastName",
DROP COLUMN "paLstAnnual",
DROP COLUMN "paLstExempt",
DROP COLUMN "paPsdCode",
DROP COLUMN "paPsdName",
DROP COLUMN "paResidentEitRate",
DROP COLUMN "paWorkEitRate",
DROP COLUMN "paWorkPsdCode",
DROP COLUMN "payFrequency",
DROP COLUMN "payRate",
DROP COLUMN "relationshipToOwner",
DROP COLUMN "ssnLastFour",
DROP COLUMN "streetAddress",
DROP COLUMN "w4Deductions",
DROP COLUMN "w4DependentCredit",
DROP COLUMN "w4ExtraWithholding",
DROP COLUMN "w4FilingStatus",
DROP COLUMN "w4MultipleJobs",
DROP COLUMN "w4OtherIncome",
DROP COLUMN "zelleHandle",
ADD COLUMN     "bank_account_masked" TEXT,
ADD COLUMN     "company_id" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "employment_type" TEXT NOT NULL,
ADD COLUMN     "first_name" TEXT NOT NULL,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "last_name" TEXT NOT NULL,
ADD COLUMN     "pa_lst_annual" DOUBLE PRECISION NOT NULL DEFAULT 52.0,
ADD COLUMN     "pa_lst_exempt" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pa_psd_code" TEXT NOT NULL,
ADD COLUMN     "pa_psd_name" TEXT NOT NULL,
ADD COLUMN     "pa_resident_eit_rate" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "pa_work_eit_rate" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "pa_work_psd_code" TEXT NOT NULL,
ADD COLUMN     "pay_frequency" TEXT NOT NULL,
ADD COLUMN     "pay_rate" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "relationship_to_owner" TEXT NOT NULL DEFAULT 'NONE',
ADD COLUMN     "ssn_last_four" TEXT NOT NULL,
ADD COLUMN     "street_address" TEXT,
ADD COLUMN     "w4_deductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "w4_dependent_credit" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "w4_extra_withholding" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "w4_filing_status" TEXT NOT NULL,
ADD COLUMN     "w4_multiple_jobs" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "w4_other_income" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "zelle_handle" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "general_expenses" DROP COLUMN "companyId",
DROP COLUMN "createdAt",
DROP COLUMN "expenseDate",
DROP COLUMN "isTaxDeductible",
DROP COLUMN "scheduleCLine",
ADD COLUMN     "company_id" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "expense_date" TEXT NOT NULL,
ADD COLUMN     "is_tax_deductible" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "schedule_c_line" TEXT;

-- AlterTable
ALTER TABLE "mileage_logs" DROP COLUMN "businessPurpose",
DROP COLUMN "calculatedMiles",
DROP COLUMN "companyId",
DROP COLUMN "createdAt",
DROP COLUMN "destinationLocation",
DROP COLUMN "employeeId",
DROP COLUMN "endOdometer",
DROP COLUMN "isReimbursableAccountablePlan",
DROP COLUMN "linkedPayStubId",
DROP COLUMN "mileageAllowance",
DROP COLUMN "originLocation",
DROP COLUMN "rateApplied",
DROP COLUMN "startOdometer",
DROP COLUMN "tripDate",
ADD COLUMN     "business_purpose" TEXT NOT NULL,
ADD COLUMN     "calculated_miles" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "company_id" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "destination_location" TEXT NOT NULL,
ADD COLUMN     "employee_id" TEXT NOT NULL,
ADD COLUMN     "end_odometer" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "is_reimbursable_accountable_plan" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "linked_pay_stub_id" TEXT,
ADD COLUMN     "mileage_allowance" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "origin_location" TEXT NOT NULL,
ADD COLUMN     "rate_applied" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "start_odometer" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "trip_date" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "pay_stubs" DROP COLUMN "createdAt",
DROP COLUMN "disbursementMethod",
DROP COLUMN "disbursementStatus",
DROP COLUMN "employeeId",
DROP COLUMN "employerMedicare",
DROP COLUMN "employerPaUc",
DROP COLUMN "employerSocialSecurity",
DROP COLUMN "federalIncomeTax",
DROP COLUMN "grossEarnings",
DROP COLUMN "hourlyRate",
DROP COLUMN "hoursWorked",
DROP COLUMN "medicareTax",
DROP COLUMN "mileageReimbursement",
DROP COLUMN "netPay",
DROP COLUMN "overtimeHours",
DROP COLUMN "paLocalEit",
DROP COLUMN "paLst",
DROP COLUMN "paStateTax",
DROP COLUMN "paidAt",
DROP COLUMN "payDate",
DROP COLUMN "payrollRunId",
DROP COLUMN "periodEnd",
DROP COLUMN "periodStart",
DROP COLUMN "socialSecurityTax",
DROP COLUMN "totalCompanyCost",
DROP COLUMN "totalEmployeeTaxes",
DROP COLUMN "totalEmployerTaxes",
DROP COLUMN "totalReimbursements",
DROP COLUMN "travelExpensesReimbursement",
DROP COLUMN "zelleConfirmationRef",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "disbursement_method" TEXT NOT NULL,
ADD COLUMN     "disbursement_status" TEXT NOT NULL,
ADD COLUMN     "employee_id" TEXT NOT NULL,
ADD COLUMN     "employer_medicare" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "employer_pa_uc" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "employer_social_security" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "federal_income_tax" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "gross_earnings" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "hourly_rate" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "hours_worked" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "medicare_tax" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "mileage_reimbursement" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "net_pay" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "overtime_hours" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "pa_local_eit" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "pa_lst" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "pa_state_tax" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "paid_at" TIMESTAMP(3),
ADD COLUMN     "pay_date" TEXT NOT NULL,
ADD COLUMN     "payroll_run_id" TEXT NOT NULL,
ADD COLUMN     "period_end" TEXT NOT NULL,
ADD COLUMN     "period_start" TEXT NOT NULL,
ADD COLUMN     "social_security_tax" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "total_company_cost" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "total_employee_taxes" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "total_employer_taxes" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "total_reimbursements" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "travel_expenses_reimbursement" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "zelle_confirmation_ref" TEXT;

-- AlterTable
ALTER TABLE "payroll_runs" DROP COLUMN "companyId",
DROP COLUMN "createdAt",
DROP COLUMN "lockedAt",
DROP COLUMN "payDate",
DROP COLUMN "periodEnd",
DROP COLUMN "periodStart",
DROP COLUMN "stubsCount",
DROP COLUMN "totalCompanyCost",
DROP COLUMN "totalEmployeeTaxes",
DROP COLUMN "totalEmployerTaxes",
DROP COLUMN "totalGross",
DROP COLUMN "totalNetPay",
DROP COLUMN "totalReimbursements",
ADD COLUMN     "company_id" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "locked_at" TIMESTAMP(3),
ADD COLUMN     "pay_date" TEXT NOT NULL,
ADD COLUMN     "period_end" TEXT NOT NULL,
ADD COLUMN     "period_start" TEXT NOT NULL,
ADD COLUMN     "stubs_count" INTEGER NOT NULL,
ADD COLUMN     "total_company_cost" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "total_employee_taxes" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "total_employer_taxes" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "total_gross" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "total_net_pay" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "total_reimbursements" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "timesheets" DROP COLUMN "createdAt",
DROP COLUMN "employeeId",
DROP COLUMN "endTime",
DROP COLUMN "linkedPayStubId",
DROP COLUMN "overtimeHours",
DROP COLUMN "regularHours",
DROP COLUMN "startTime",
DROP COLUMN "unpaidBreakMinutes",
DROP COLUMN "workDate",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "employee_id" TEXT NOT NULL,
ADD COLUMN     "end_time" TEXT NOT NULL,
ADD COLUMN     "linked_pay_stub_id" TEXT,
ADD COLUMN     "overtime_hours" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "regular_hours" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "start_time" TEXT NOT NULL,
ADD COLUMN     "unpaid_break_minutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "work_date" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "travel_expenses" DROP COLUMN "companyId",
DROP COLUMN "createdAt",
DROP COLUMN "employeeId",
DROP COLUMN "expenseDate",
DROP COLUMN "isReimbursable",
DROP COLUMN "linkedPayStubId",
DROP COLUMN "mileageLogId",
DROP COLUMN "paymentSource",
DROP COLUMN "receiptNote",
DROP COLUMN "receiptUrl",
ADD COLUMN     "company_id" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "employee_id" TEXT NOT NULL,
ADD COLUMN     "expense_date" TEXT NOT NULL,
ADD COLUMN     "is_reimbursable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "linked_pay_stub_id" TEXT,
ADD COLUMN     "mileage_log_id" TEXT,
ADD COLUMN     "payment_source" TEXT NOT NULL,
ADD COLUMN     "receipt_note" TEXT,
ADD COLUMN     "receipt_url" TEXT;

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ein" TEXT NOT NULL,
    "state_tax_id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "owner_name" TEXT NOT NULL,
    "owner_email" TEXT NOT NULL,
    "owner_tax_bracket" DOUBLE PRECISION DEFAULT 24,
    "filing_frequency_pa" TEXT DEFAULT 'MONTHLY',
    "standard_mileage_rate" DOUBLE PRECISION DEFAULT 0.67,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_state_snapshots" (
    "id" TEXT NOT NULL DEFAULT 'current_state',
    "data" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_state_snapshots_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mileage_logs" ADD CONSTRAINT "mileage_logs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mileage_logs" ADD CONSTRAINT "mileage_logs_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "travel_expenses" ADD CONSTRAINT "travel_expenses_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "travel_expenses" ADD CONSTRAINT "travel_expenses_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "general_expenses" ADD CONSTRAINT "general_expenses_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pay_stubs" ADD CONSTRAINT "pay_stubs_payroll_run_id_fkey" FOREIGN KEY ("payroll_run_id") REFERENCES "payroll_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pay_stubs" ADD CONSTRAINT "pay_stubs_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_tasks" ADD CONSTRAINT "compliance_tasks_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
