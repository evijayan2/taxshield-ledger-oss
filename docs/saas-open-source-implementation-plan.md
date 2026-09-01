# SaaS + Open-Source Shared-Core Implementation Plan

## Goal

Build one shared product core for payroll, accounting, tax workflow, and employee operations, while keeping the SaaS product and the open-source product as different runtime configurations of the same engine.

The core must remain stable and product-true in both modes:
- open-source mode = one owner, one default company, many tax years
- SaaS mode = multi-user, multi-company, shared company access, employee cross-company support, billing/roles

The design should enforce strict company isolation so no company data can contaminate another company, even when one person works for multiple companies.

---

## 1. Architecture principle

The project should be split into three layers:

1. Core business domain
   - Company
   - TaxYear
   - TaxJurisdiction
   - TaxRule / TaxRuleVersion
   - Expense
   - Mileage
   - PayrollRun
   - PayStub
   - AuditLogEntry
   - CalculationSnapshot
   - Employee / Person / Employment records
   - Leave / PTO / timesheets

2. Access / tenancy layer
   - User
   - Account / Workspace
   - CompanyMembership
   - Role
   - Permission
   - Invitation
   - Subscription / Plan

3. Runtime adapter layer
   - OSS runtime profile
   - SaaS runtime profile
   - both call the same core services with different access policies

Important rule:
- the core layer must never contain business logic about SaaS billing or multi-user access
- the wrapper layer must never change tax logic, payroll logic, or audit behavior

---

## 2. Required data separation model

### 2.1 Person vs Company vs Employment

This model is required to support one employee working for multiple companies without cross-company contamination.

#### Person
A person is the human identity.
- id
- legal_name
- preferred_name
- email
- phone
- SSN last 4 / masked identifier
- W-9 status
- document references

A person can exist across many companies.

#### Company
A company is a legal entity / LLC.
- id
- legal_name
- EIN
- state tax id
- tax_years
- employees
- bank settings
- compliance state

#### Employment
Employment is the relationship between a Person and a Company.
- id
- person_id
- company_id
- employee_number
- status
- start_date
- end_date
- job_title
- pay_frequency
- work_state
- pay_rate
- manager_id
- withholding_profile_id
- leave_policy_id

This is the critical boundary. Payroll, leave, and timesheets are always scoped to an Employment record, not just a Person.

---

## 3. Strict no-cross-company data rules

These rules are mandatory and should be treated as architecture constraints, not optional product preferences.

### 3.1 Every employee/payroll record must have company scope
Every table touching payroll, timesheets, paystubs, PTO, W-2, W-9, or employment data must include:
- company_id
- employment_id
- tax_year_id where relevant

### 3.2 No person-only payroll queries
A query must never resolve an employee by person_id alone when it is operating on payroll data.

The required lookup path is:
- user / company context
- employment_id specific to that company
- tax_year_id scoped to that company

### 3.3 No global company rollups without explicit context
A user or system process may not combine payroll across companies unless a company-scoped run is intentionally requested.

### 3.4 Company boundaries are enforced at the service layer
The service layer must validate:
- the requested company belongs to the active account / workspace
- the employment belongs to the company
- the record belongs to the same company
- the tax year belongs to the same company

If any check fails, the operation is rejected.

### 3.5 Audit logging must record company scope
Every write path touching payroll, leave, or tax records must log:
- company_id
- employment_id
- previous value
- new value
- actor
- timestamp
- reason

---

## 4. Multi-user / multi-company wrapper design

### SaaS mode
SaaS mode should add only the outer access layer:
- Account
- Workspace / tenant
- User
- CompanyMembership
- Role
- Billing / plan
- Invite / onboarding flow
- permission checks

The SaaS layer decides:
- which users can access which companies
- which companies belong to which workspace
- which roles can approve payroll or view financials

It does not change the ledger logic.

### OSS mode
Open-source mode should be a single-owner runtime profile:
- one account
- one default user
- one default company
- many tax years
- many employees within that company
- no team roles or billing
- no invitation layer

The same core engine powers both modes.

---

## 5. Employee workflows common to both SaaS and OSS

These features should be developed as shared core features, not as SaaS-only features:

- employee onboarding
- W-9 upload / verification
- timesheet entry
- timesheet approval
- overtime handling
- leave / PTO requests
- accruals and balances
- paystub generation
- W-2/W-3 viewing and export
- payroll calculation per employment
- payslip access by employee

These workflows are common because the core business process is the same regardless of whether the deployment is local or hosted.

---

## 6. SaaS-only features should stay outside the core

The following should live in the wrapper layer and not be allowed to leak into the domain logic:

- multi-user identity management
- team membership and roles
- workspace switching
- invitation flows
- subscription / billing
- feature flags
- plan limits
- enterprise admin controls

This is essential to keep the open-source build simple and stable.

---

## 7. Recommended implementation sequence

### Phase 0 — Foundations
Keep as-is.
- core tax rule engine
- company / tax year / jurisdiction
- audit trail
- rule versions
- regression harness

### Phase 1 — Single-owner ledger MVP
Keep as-is.
- expenses
- mileage
- single-state payroll
- compliance
- basic exports

### Phase 1.5 — Workforce & access layer (new required phase)
This is the phase that adds the employee and company-bound access model.

Add:
- Person model
- Employment model
- Company membership / access rules
- employee directory / onboarding
- W-9 upload and verification
- timesheet workflow
- leave and PTO tracking
- paystub generation
- W-2 preview and export
- strict company-scoped queries
- audit logging for payroll and employee data changes

This is the most important bridge between the single-owner MVP and SaaS expansion.

### Phase 2 — Automation & reconciliation
- OCR receipt extraction
- bank imports
- duplicate detection
- government rule ingestion
- rule diff / activation workflow

### Phase 3 — Multi-state payroll
- jurisdiction resolver
- multi-location employment rules
- local tax logic
- coverage checks before payroll run

### Phase 4 — Reporting & polish
- improved exports
- dashboards
- notifications
- mobile capture improvements

---

## 8. Implementation guardrails

### 8.1 No data contamination
No user story, API route, service, or UI element may assume that a person is globally scoped to a single company.

### 8.2 No employee record without company linkage
All employee / payroll records must be connected to an employment row in a company.

### 8.3 No SaaS logic in the tax engine
Tax rules, withholding, payroll math, and audit trail logic stay in the core domain and must not depend on user accounts or SaaS permissions.

### 8.4 OSS is a thin runtime profile, not a separate codebase
The open-source distribution should only disable or simplify the outer access layer, not rewrite the ledger logic.

---

## 9. Recommended technical schema pattern

Use this pattern for every sensitive table:
- id
- company_id
- employment_id
- tax_year_id (if applicable)
- created_by
- created_at
- updated_by
- updated_at
- status

For the company-bound tables, enforce a database-level foreign key relationship:
- employment.company_id = company.id
- payroll.company_id = company.id
- timesheet.employment_id belongs to the same company

This should be backed by service-level checks plus tests.

---

## 10. Testing expectations for this architecture

Add regression tests for all company isolation scenarios:

- employee works for Company A and Company B
- timesheet for Company A cannot be shown inside Company B
- leave balance for Company A cannot affect Company B
- W-2 generated for Company A is not visible in Company B
- payroll runs are isolated by company and employment
- one user can belong to multiple companies, but cannot access another company without permission
- the same person can be linked to multiple employments with independent records

These are not edge cases — they are required product behavior.

---

## 11. Final recommendation

The cleanest plan is:

- keep the tax/ledger engine as the shared core
- separate the identity and tenancy layer as the SaaS wrapper
- model employees as Persons and company work as Employment records
- make every payroll, leave, and tax record company-scoped
- add the workforce/access phase before automation and multi-state work

This keeps the open-source version simple, download-and-run friendly, while allowing the SaaS version to scale to a true multi-user, multi-company product without rewriting the business logic.
