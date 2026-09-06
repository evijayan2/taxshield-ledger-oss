# TaxShield Ledger — Phase Implementation & Verification Status

**Last Updated:** September 2, 2026
**Current Phase Status:** Phase 0 & Phase 1 complete — self-hosted email/password authentication with server-side sessions, two-step bootstrap with full business address, ZIP code, verified supported states dropdown (`PA`, `DE`, `FL`, `NJ`, `NY`, `OH`, `TX`), payroll schedule, state tax filing schedule, automated staff invite dispatch, inactive employee read-only mode, owner & employee settings security management (owner User ID & password change, owner-triggered staff password resets, employee password-only change), single-owner enforcement, and multi-state address-based state/local tax resolution in Staff Onboarding is fully implemented and verified.
**Test Suite Status:** 21 test files passed / 116 tests passed in OSS; 13 test files passed / 71 tests passed in shared-core; 1 regression suite passed / 6 tests passed; TypeScript check (`pnpm lint`) and production build (`pnpm build`) passed.
## Repository Split Initiation Status

- [x] Shared-core package scaffold created in `shared-core/`
- [x] OSS runtime profile scaffold created in `taxshield-ledger-oss/`
- [x] SaaS runtime profile scaffold created in `taxshield-ledger-saas/`
- [x] Tax Rule Packaging Engine (Module 1) created in `tax-rule-packaging-engine/` (validation pipeline, regression test harness, diff engine, canonical JSON, SHA-256 sealing, CLI)
- [x] Automated Government Source Ingestion Engine (Module 1 Subsystem) created with IRS, PA DOR, TX Comptroller, and DE Division of Revenue adapters
- [x] Multi-state reference seed packages authored and cryptographically sealed: `US-FED-2026`, `PA-STATE-2026`, `TX-STATE-2026`, `DE-STATE-2026`
- [x] Step-by-Step Authoring & Rollover Guide (`tax-rule-packaging-engine/HOW_TO_ADD_TAX_RULES.md`) created for onboarding new states and annual tax year rollover
- [x] Official Regulatory Sources Directory (`tax-rule-packaging-engine/OFFICIAL_SOURCES_DIRECTORY.md`) created cataloguing Federal and all 50 states + DC authorities, publications, and locator patterns for 2025, 2026, and future years
- [x] Local Package Distribution HTTP Server (`tax-rule-packaging-engine/src/server/server.ts`, `pnpm serve`, `pnpm cli serve [port]`) serving sealed packages and catalog over HTTP
- [x] Package Ingestion & Verification Subsystem (`taxshield-ledger-oss/server/services/taxPackageClient.ts`, `server.ts`) with SHA-256 tamper verification, database upserts, and audit logging
- [x] Modern Slide-Over Drawer UI (`taxshield-ledger-oss/src/components/PackageSyncDrawer.tsx`) in `TaxRuleAdminView` with confirmation safety guardrails
- [x] Root workspace configuration updated to include all split packages
- [x] Shared-core package build configuration repaired and type-check verified (`pnpm prisma generate && pnpm build` completes successfully in `shared-core/`)
- [x] Initial split boundary implemented: shared-core owns the domain contract and wrapper packages re-export the core types instead of duplicating them
- [ ] Promote the split into separate remote repositories and validate the package boundary after the workspace is stable

This document tracks the current implementation status, verification metrics, pending backlog, and newly added capabilities across all development phases of TaxShield Ledger.

---

## 1. Phase 0 & Phase 1 Completion Matrix

| Phase | Feature / Module | Status | Core Implementation & File References |
|---|---|---|---|
| **Phase 0** | Core Data Model | **Complete (100%)** | `prisma/schema.prisma` (`Company`, `TaxYear`, `TaxJurisdiction`, `TaxRule`, `TaxRuleVersion`, `CalculationSnapshot`, `AuditLogEntry`, `Employee`, `PayrollRun`, `PayStub`, `MileageLog`, `TravelExpense`, `GeneralExpense`, `ComplianceTask`, `Timesheet`, `User`, `PasswordCredential`, `Session`, `PasswordResetToken`, `CompanyMembership`). Migration `20260902083600_add_pay_frequency_to_company` applied. |
| **Phase 0** | Tax Rule Admin UI | **Complete (100%)** | `src/components/TaxRuleAdminView.tsx` — Allows manual rule entry, citations, tier assignment, activation, and rule diffing. |
| **Phase 0** | Regression Harness | **Complete (100%)** | `tests/regression/ruleRegression.test.ts` — Validates withholding calculations against active tax rules before activation. |
| **Phase 0** | Self-Hosted Authentication & Sessions | **Complete (100%)** | `server/auth/` (`password.ts`, `session.ts`, `companyContext.ts`, `email/`, `rateLimiter.ts`, `middleware.ts`, `routes.ts`), `src/context/AuthContext.tsx`, `src/components/AuthGate.tsx` — Replaced Firebase with PostgreSQL bcrypt hashing, SHA-256 session cookies, 2-step bootstrap wizard, single active owner constraint, invite-only employee onboarding, pluggable email providers (Resend, SendGrid, SMTP, console), and server-enforced route authorization. |
| **Phase 1** | 1. LLC Setup | **Complete (100%)** | `src/components/LLCOnboardingModal.tsx`, `src/components/SettingsView.tsx`, `src/components/AuthGate.tsx`, `src/utils/supportedStates.ts` — Configures LLC legal profile, EIN, state tax ID, full street address, city, ZIP code, supported state selection (PA, DE, FL, NJ, NY, OH, TX with active tax rules), payroll schedule (Weekly, Bi-Weekly, Semi-Monthly, Monthly), state tax filing schedule, marginal tax bracket, and bank info. |
| **Phase 1** | 2. Tax-Year Setup | **Complete (100%)** | `src/components/TaxYearSetupModal.tsx` — Creates tax year records and links federal/state jurisdictions. |
| **Phase 1** | 3. Expense Tracker | **Complete (100%)** | `src/components/ExpenseTrackerView.tsx` — General expense logging, Schedule C line mapping, deductibility toggle. |
| **Phase 1** | 4. Receipt Storage | **Complete (100%)** | `src/components/ExpenseTrackerView.tsx` & `src/components/MileageAndTravelView.tsx` — Receipt photo/file attachment, URL, and note storage. *(Automated OCR parsing scheduled for Phase 2)*. |
| **Phase 1** | 5. Mileage Tracker | **Complete (100%)** | `src/components/MileageAndTravelView.tsx` & `src/server/rules-engine/taxRulesEngine.ts` — Dynamic IRS mileage rate lookup based on trip date ($0.67/mi). Accountable plan tracking included. |
| **Phase 1** | 5b. Staff Onboarding & Roster | **Complete (100%)** | `src/components/StaffOnboardingView.tsx`, `src/components/StaffManagementSection.tsx`, `src/components/StaffFormModal.tsx`, `src/components/staff/` — Multi-state aware onboarding with address-based state/local tax resolution (supporting cross-border setups e.g. DE company with PA resident employee, PA/NJ reciprocity, single-state PA/DE/OH/NY). |
| **Phase 1** | 6. Single-State Payroll | **Complete (100%)** | `src/components/AssistedPayrollView.tsx`, `src/server/rules-engine/taxRulesEngine.ts`, `server/dataService.ts` — Rule-driven withholding (Federal W-4, FICA SS 6.2%, Medicare 1.45%, PA State 3.07%, PA Local EIT/LST, employer taxes). Writes `CalculationSnapshot` for auditability. |
| **Phase 1** | 7. Reimbursement Workflow | **Complete (100%)** | `src/components/MileageAndTravelView.tsx` & `src/components/PayStubModal.tsx` — Accountable plan approval and linking mileage/travel expenses into payroll runs (`linkedPayStubId`). |
| **Phase 1** | 8. Compliance Calendar | **Complete (100%)** | `src/components/ComplianceFilingsView.tsx`, `src/components/ComplianceBoxMappingTable.tsx`, `src/components/TaxPaymentInstructionsDrawer.tsx` — Due dates for Form 941, PA REV-1667, Local EIT, W-2/W-3, 1099-NEC, with state remittance instruction guides. |
| **Phase 1** | 9. Audit Trail Logging | **Complete (100%)** | `src/components/AuditTrailView.tsx` & `src/lib/audit.ts` — Writes `AuditLogEntry` on every edit (actor, timestamp, previous state, new state, reason). |
| **Phase 1** | 10. Year-End CPA Export | **Complete (100%)** | `src/components/YearEndExportView.tsx` & `src/server/services/exportService.ts` — Accountant-ready CSV spreadsheets and PDF reports for expenses, payroll, mileage, tax summaries. |


---

## 2. Newly Added Capabilities (Beyond Baseline Phase 1)

1. **Mercury Banking API Integration (`server/services/mercuryService.ts`)**
   - Live API client to check balances, fetch ACH payment details, verify bank settings, and process payroll disbursements.
2. **State ACH Remittance TXP Generator (`server/services/txpGenerator.ts`)**
   - Generates official NACHA CCD+ TXP addenda format strings for electronic state tax withholding payments (PA REV-1667).
3. **Pay Stub & W-2 / W-3 PDF Builders (`src/utils/payStubPdfBuilder.ts` & `src/utils/w2w3PdfBuilder.ts`)**
   - High-fidelity PDF generation in browser for employee pay stubs and IRS W-2 / W-3 tax form previews.
4. **Timesheet Suite (`src/components/TimesheetsView.tsx` & `src/components/BulkTimesheetForm.tsx`)**
   - Individual & bulk timesheet entry, break time calculations, overtime logic, and direct linking to payroll runs.
5. **Multi-State Seed JSON Fixtures (`prisma/fixtures/states/`)**
   - Pre-configured tax rule JSON fixtures for PA, DE, NJ, NY, OH, FL, TX, and PA school district PSD codes (`src/utils/paSchoolDistricts.ts`).
6. **Dark/Light Glassmorphism Theme System (`src/context/ThemeContext.tsx` & `src/index.css`)**
   - Full accessibility dual-theme styling with `.glass-panel` and `.glass-card` CSS utilities.

---

## 3. Pending Backlog (Upcoming Phases)

### Authentication foundation — Phase 0 work reopened
- [ ] Replace Firebase/Google application sign-in with self-hosted email/password sessions.
- [ ] Add server-enforced authorization and company isolation.
- [ ] Add OSS and SaaS membership roles, invite-only employees, and one-owner-per-company enforcement.
- [ ] Preserve Google Docs OAuth as a separate export integration.

### Phase 2 — Automation & Reconciliation (Next Target)
- [ ] OCR engine for auto-extracting receipt fields (vendor, date, amount) for user confirmation.
- [ ] Bank CSV / live statement feed import and 4-way transaction reconciliation (`MATCHED`, `UNMATCHED`, `DUPLICATE`, `NEEDS REVIEW`).
- [ ] Automated duplicate expense detection.
- [ ] Automated Government Source Ingestion Engine (Tier 1/2/3 auto-scraping, diff views, auto-alerts).

### Phase 3 — Multi-State & Advanced Compliance
- [ ] Jurisdiction Resolver for multi-state work arrangements (residence vs work state withholding).
- [ ] Multi-state / multi-local payroll engine extension.
- [ ] New-Year Setup Wizard.
- [ ] Asset & Depreciation Tracking (Schedule C / Form 4562).

### Phase 4 — Reporting & Polish
- [ ] Advanced document management & global search.
- [ ] Notification & alert system.
- [ ] Mobile-first receipt & mileage capture (<30s).

---

## 4. Test Suite Metrics

- **Total Test Files:** 14 passed
- **Total Tests:** 70 passed
- **Regression Suite:** `pnpm test:regression` (Passed)
- **Unit & System Suite:** `pnpm test` (Passed)
