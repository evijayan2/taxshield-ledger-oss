-- CreateEnum
CREATE TYPE "RuleStatus" AS ENUM ('DISCOVERED', 'IN_REVIEW', 'VALIDATED', 'APPROVED', 'ACTIVE', 'SUPERSEDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CitationTier" AS ENUM ('TIER_1_OFFICIAL', 'TIER_2_GOV_DEPT', 'TIER_3_THIRD_PARTY');

-- CreateEnum
CREATE TYPE "RuleType" AS ENUM ('FLAT_RATE', 'BRACKET_PERCENTAGE', 'STANDARD_ALLOWANCE', 'THRESHOLD', 'EXEMPTION', 'PER_MILE_RATE');

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ein" TEXT NOT NULL,
    "stateTaxId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "ownerEmail" TEXT NOT NULL,
    "ownerTaxBracket" DOUBLE PRECISION NOT NULL DEFAULT 24.0,
    "filingFrequencyPa" TEXT NOT NULL DEFAULT 'MONTHLY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_years" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tax_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_jurisdictions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tax_jurisdictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_rules" (
    "id" TEXT NOT NULL,
    "jurisdictionId" TEXT NOT NULL,
    "ruleCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tax_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_rule_versions" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "status" "RuleStatus" NOT NULL DEFAULT 'IN_REVIEW',
    "ruleType" "RuleType" NOT NULL,
    "ruleData" JSONB NOT NULL,
    "sourceTitle" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourcePublisher" TEXT NOT NULL,
    "statuteReference" TEXT NOT NULL,
    "citationTier" "CitationTier" NOT NULL,
    "effectiveStart" TIMESTAMP(3) NOT NULL,
    "effectiveEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activatedAt" TIMESTAMP(3),
    "activatedBy" TEXT,

    CONSTRAINT "tax_rule_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calculation_snapshots" (
    "id" TEXT NOT NULL,
    "calculationType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "ruleVersionIds" JSONB NOT NULL,
    "snapshotData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calculation_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log_entries" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "previousState" JSONB,
    "newState" JSONB,
    "reason" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "age" INTEGER,
    "relationshipToOwner" TEXT NOT NULL DEFAULT 'NONE',
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "ssnLastFour" TEXT NOT NULL,
    "streetAddress" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "employmentType" TEXT NOT NULL,
    "payRate" DOUBLE PRECISION NOT NULL,
    "payFrequency" TEXT NOT NULL,
    "w4FilingStatus" TEXT NOT NULL,
    "w4MultipleJobs" BOOLEAN NOT NULL DEFAULT false,
    "w4DependentCredit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "w4OtherIncome" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "w4Deductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "w4ExtraWithholding" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paPsdCode" TEXT NOT NULL,
    "paPsdName" TEXT NOT NULL,
    "paResidentEitRate" DOUBLE PRECISION NOT NULL,
    "paWorkPsdCode" TEXT NOT NULL,
    "paWorkEitRate" DOUBLE PRECISION NOT NULL,
    "paLstAnnual" DOUBLE PRECISION NOT NULL DEFAULT 52.0,
    "paLstExempt" BOOLEAN NOT NULL DEFAULT false,
    "zelleHandle" TEXT NOT NULL,
    "bankAccountMasked" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mileage_logs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "tripDate" TEXT NOT NULL,
    "originLocation" TEXT NOT NULL,
    "destinationLocation" TEXT NOT NULL,
    "businessPurpose" TEXT NOT NULL,
    "startOdometer" DOUBLE PRECISION NOT NULL,
    "endOdometer" DOUBLE PRECISION NOT NULL,
    "calculatedMiles" DOUBLE PRECISION NOT NULL,
    "rateApplied" DOUBLE PRECISION NOT NULL,
    "mileageAllowance" DOUBLE PRECISION NOT NULL,
    "isReimbursableAccountablePlan" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL,
    "linkedPayStubId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mileage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "travel_expenses" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "mileageLogId" TEXT,
    "expenseDate" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentSource" TEXT NOT NULL,
    "receiptNote" TEXT,
    "receiptUrl" TEXT,
    "isReimbursable" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL,
    "linkedPayStubId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "travel_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "general_expenses" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "expenseDate" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "payee" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "scheduleCLine" TEXT,
    "isTaxDeductible" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "general_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_runs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "periodStart" TEXT NOT NULL,
    "periodEnd" TEXT NOT NULL,
    "payDate" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "totalGross" DOUBLE PRECISION NOT NULL,
    "totalEmployeeTaxes" DOUBLE PRECISION NOT NULL,
    "totalReimbursements" DOUBLE PRECISION NOT NULL,
    "totalNetPay" DOUBLE PRECISION NOT NULL,
    "totalEmployerTaxes" DOUBLE PRECISION NOT NULL,
    "totalCompanyCost" DOUBLE PRECISION NOT NULL,
    "stubsCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3),

    CONSTRAINT "payroll_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pay_stubs" (
    "id" TEXT NOT NULL,
    "payrollRunId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "periodStart" TEXT NOT NULL,
    "periodEnd" TEXT NOT NULL,
    "payDate" TEXT NOT NULL,
    "hoursWorked" DOUBLE PRECISION NOT NULL,
    "overtimeHours" DOUBLE PRECISION NOT NULL,
    "hourlyRate" DOUBLE PRECISION NOT NULL,
    "grossEarnings" DOUBLE PRECISION NOT NULL,
    "federalIncomeTax" DOUBLE PRECISION NOT NULL,
    "socialSecurityTax" DOUBLE PRECISION NOT NULL,
    "medicareTax" DOUBLE PRECISION NOT NULL,
    "paStateTax" DOUBLE PRECISION NOT NULL,
    "paLocalEit" DOUBLE PRECISION NOT NULL,
    "paLst" DOUBLE PRECISION NOT NULL,
    "totalEmployeeTaxes" DOUBLE PRECISION NOT NULL,
    "mileageReimbursement" DOUBLE PRECISION NOT NULL,
    "travelExpensesReimbursement" DOUBLE PRECISION NOT NULL,
    "totalReimbursements" DOUBLE PRECISION NOT NULL,
    "netPay" DOUBLE PRECISION NOT NULL,
    "employerSocialSecurity" DOUBLE PRECISION NOT NULL,
    "employerMedicare" DOUBLE PRECISION NOT NULL,
    "employerPaUc" DOUBLE PRECISION NOT NULL,
    "totalEmployerTaxes" DOUBLE PRECISION NOT NULL,
    "totalCompanyCost" DOUBLE PRECISION NOT NULL,
    "disbursementMethod" TEXT NOT NULL,
    "disbursementStatus" TEXT NOT NULL,
    "zelleConfirmationRef" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pay_stubs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_tasks" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "formIdentifier" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "taxPeriodLabel" TEXT NOT NULL,
    "dueDate" TEXT NOT NULL,
    "filingMethod" TEXT,
    "portalUrl" TEXT,
    "status" TEXT NOT NULL,
    "amountDue" DOUBLE PRECISION NOT NULL,
    "boxValues" JSONB NOT NULL,
    "confirmationNumber" TEXT,
    "filedDate" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compliance_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timesheets" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "workDate" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "unpaidBreakMinutes" INTEGER NOT NULL DEFAULT 0,
    "regularHours" DOUBLE PRECISION NOT NULL,
    "overtimeHours" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL,
    "linkedPayStubId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "timesheets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tax_years_companyId_year_key" ON "tax_years"("companyId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "tax_jurisdictions_code_key" ON "tax_jurisdictions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "tax_rules_jurisdictionId_ruleCode_key" ON "tax_rules"("jurisdictionId", "ruleCode");

-- AddForeignKey
ALTER TABLE "tax_years" ADD CONSTRAINT "tax_years_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_rules" ADD CONSTRAINT "tax_rules_jurisdictionId_fkey" FOREIGN KEY ("jurisdictionId") REFERENCES "tax_jurisdictions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_rule_versions" ADD CONSTRAINT "tax_rule_versions_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "tax_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log_entries" ADD CONSTRAINT "audit_log_entries_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mileage_logs" ADD CONSTRAINT "mileage_logs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mileage_logs" ADD CONSTRAINT "mileage_logs_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "travel_expenses" ADD CONSTRAINT "travel_expenses_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "travel_expenses" ADD CONSTRAINT "travel_expenses_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "general_expenses" ADD CONSTRAINT "general_expenses_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pay_stubs" ADD CONSTRAINT "pay_stubs_payrollRunId_fkey" FOREIGN KEY ("payrollRunId") REFERENCES "payroll_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pay_stubs" ADD CONSTRAINT "pay_stubs_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_tasks" ADD CONSTRAINT "compliance_tasks_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
