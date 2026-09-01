# Prisma Schema Design for Shared Core + SaaS Wrapper

## Objective

Define the database model that supports:
- one shared core for payroll, tax, ledger, and employee operations
- SaaS multi-user and multi-company access above the core
- open-source single-owner default company mode
- one person working for multiple companies without cross-company contamination
- strict company and employment scoping for all payroll and employee records

---

## 1. Core design principle

The schema should separate:
- identity: Person
- company: Company
- relationship: Employment
- financial/payroll records: always tied to company + employment + tax year

This is the key rule that prevents one company’s payroll from contaminating another company’s data.

---

## 2. Core entities

### Person
Represents the human being.

Fields:
- id
- legal_name
- preferred_name
- email
- phone
- ssn_last4
- status
- created_at
- updated_at

Notes:
- Person is global to the system
- Person is not the payroll record owner
- Person can have multiple Employment rows across many companies

### Company
Represents a legal LLC or entity.

Fields:
- id
- legal_name
- ein
- state_tax_id
- default_tax_year_id
- status
- created_at
- updated_at

Notes:
- Company is the primary ledger boundary
- Company must own tax years, payroll runs, expense sets, and compliance state

### TaxYear
Represents a tax year for a company.

Fields:
- id
- company_id
- year
- status
- start_date
- end_date
- created_at
- updated_at

Notes:
- TaxYear is company-scoped
- Payroll and W-2 records belong to the company tax year

### Employment
The relationship between a person and a company.

Fields:
- id
- person_id
- company_id
- employee_number
- employment_status
- start_date
- end_date
- job_title
- pay_frequency
- work_state
- pay_rate
- manager_person_id
- tax_withholding_profile_id
- leave_policy_id
- created_at
- updated_at

Notes:
- This is the core join model for employee data
- Every payroll and leave record should tie back to an Employment
- One person may have many Employment rows in different companies

### User
Represents login identity for SaaS and OSS.

Fields:
- id
- email
- password_hash
- name
- status
- created_at
- updated_at

Notes:
- This sits in the access wrapper, not the core ledger logic
- In OSS mode, one user likely maps to one default company

### CompanyMembership
Connects a user to a company in SaaS mode.

Fields:
- id
- company_id
- user_id
- role
- invited_by
- status
- created_at
- updated_at

Notes:
- This is SaaS-only access control
- It should not be used to model payroll ownership

---

## 3. Payroll and employee tables

### Timesheet
Fields:
- id
- company_id
- employment_id
- tax_year_id
- work_date
- hours_worked
- overtime_hours
- break_minutes
- notes
- submitted_by
- approved_by
- status
- created_at
- updated_at

Notes:
- Must be scoped to company and employment
- Never keyed only by person_id

### PayPeriod
Fields:
- id
- company_id
- tax_year_id
- label
- start_date
- end_date
- status
- created_at
- updated_at

### PayrollRun
Fields:
- id
- company_id
- employment_id
- tax_year_id
- pay_period_id
- gross_pay
- federal_tax
- state_tax
- fica_ss
- medicare
- net_pay
- run_status
- created_by
- created_at
- updated_at

Notes:
- Scoped to company + employment + tax year
- Never use person_id as the sole access key

### PayStub
Fields:
- id
- company_id
- employment_id
- tax_year_id
- payroll_run_id
- pdf_url
- status
- issued_at
- created_at
- updated_at

### W9Document
Fields:
- id
- person_id
- company_id
- file_url
- verified_at
- status
- created_at
- updated_at

Notes:
- Person is the owner of the identity record
- Company is the context where the document is used

### W2Record
Fields:
- id
- company_id
- employment_id
- tax_year_id
- form_year
- pdf_url
- status
- issued_at
- created_at
- updated_at

### LeaveRequest
Fields:
- id
- company_id
- employment_id
- tax_year_id
- leave_type
- start_date
- end_date
- hours_requested
- status
- requested_by
- approved_by
- created_at
- updated_at

### LeaveBalance
Fields:
- id
- company_id
- employment_id
- tax_year_id
- leave_type
- available_hours
- used_hours
- accrued_hours
- updated_at

---

## 4. Recommended database constraints

### Required foreign keys
- Employment.company_id → Company.id
- Employment.person_id → Person.id
- Timesheet.company_id → Company.id
- Timesheet.employment_id → Employment.id
- PayrollRun.company_id → Company.id
- PayrollRun.employment_id → Employment.id
- PayStub.company_id → Company.id
- PayStub.employment_id → Employment.id
- LeaveRequest.company_id → Company.id
- LeaveRequest.employment_id → Employment.id
- W2Record.company_id → Company.id
- W2Record.employment_id → Employment.id

### Required validation rule
Every payroll/leave/timesheet/paystub write must validate that:
- employment.company_id = requested company_id
- payroll tax year belongs to that company
- data is not being written under a person-only lookup

---

## 5. SaaS wrapper entities

These are outside the shared core but needed for the hosted product.

### Account / Workspace
- id
- name
- owner_user_id
- status

### Role
- id
- name
- permissions

### UserCompanyPermission
- id
- user_id
- company_id
- role_id
- status

### SubscriptionPlan
- id
- name
- monthly_price
- seat_limit
- status

### BillingRecord
- id
- account_id
- company_id
- plan_id
- amount
- invoice_status
- created_at

Notes:
- These are wrapper concerns, not ledger concerns.
- They must not alter how tax calculation or payroll logic works.

---

## 6. Why this schema keeps SaaS and OSS aligned

The same core tables work in both modes:
- Person exists in both SaaS and OSS
- Employment exists in both
- Company exists in both
- Timesheet, PayrollRun, PayStub, W-2, PTO exist in both

The difference is in the access wrapper:
- SaaS adds User + CompanyMembership + Role + billing
- OSS uses a simplified default-user default-company setup

This keeps the business logic common while the access profile changes.

---

## 7. Practical implementation guidance

### Keep the core stable
Do not couple the payroll engine to auth, billing, or workspace membership.

### Put access checks in one service layer
Create a single permission service that answers:
- canUserAccessCompany(userId, companyId)
- canUserAccessEmployment(userId, employmentId)
- canUserViewPayStub(userId, payStubId)

### Require company-scope in every service method
Example service signatures:
- createTimesheet({ companyId, employmentId, taxYearId, ... })
- runPayroll({ companyId, employmentId, taxYearId, ... })
- approveLeave({ companyId, employmentId, ... })

not:
- createTimesheetForPerson(personId)

---

## 8. Phase-by-phase schema alignment

### Phase 0
- Company
- TaxYear
- TaxJurisdiction
- TaxRule
- TaxRuleVersion
- CalculationSnapshot
- AuditLogEntry

### Phase 1
- Expense
- MileageLog
- PayrollRun
- PayStub
- Reimbursement

### Phase 1.5 (new)
- Person
- Employment
- Timesheet
- LeaveRequest
- LeaveBalance
- W9Document
- W2Record
- CompanyMembership

### Phase 2 onward
- add automation tables, rule ingestion, matching and audit scoring records

---

## 9. Final rule

The product must enforce this invariant:

A payroll record is never owned by a person alone; it is owned by a company and an employment record within that company.

That is the architectural foundation that allows:
- one person to work for multiple companies
- one user to access multiple companies in SaaS mode
- one local open-source user to manage one company cleanly
- strict data isolation without contamination
