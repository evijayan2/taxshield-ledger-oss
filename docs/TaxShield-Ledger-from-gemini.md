# TaxShield Ledger

## Expanded Product Requirements Document

### Micro-LLC Expense, Mileage, Payroll & Tax Compliance Platform

**Product:** TaxShield Ledger
**Target:** Single LLC / Micro-businesses with 1–5 employees or contractors
**Primary market:** U.S. LLCs, initially Pennsylvania-focused
**Document status:** Product Design / Architecture Expansion
**Vision:** Build a low-cost, audit-ready financial and tax compliance system that automatically applies the correct tax rules for the company's tax year and jurisdiction without hardcoded tax rates.

---

## 1. Product Vision

TaxShield Ledger should become the **system of record for a micro-LLC's expenses, mileage, payroll, reimbursements, tax calculations, compliance tasks, and supporting documents**.

The owner should be able to answer four questions at any time:

1. **What did my company spend?**
1. **Why was each expense a legitimate business expense?**
1. **How was every tax amount calculated?**
1. **Can I produce the supporting evidence if the IRS or another tax authority asks for it?**
The application should not merely calculate taxes.

It should maintain an **audit trail explaining how the calculation was produced**.

---

## 2. Core Product Principle: Never Hardcode Tax Rates

This should become one of the most important architectural principles of TaxShield Ledger.

### 2.1 Bad architecture

Do not implement:

```text
PA_STATE_TAX_RATE = 0.0307
SOCIAL_SECURITY_RATE = 0.062
MEDICARE_RATE = 0.0145
MILEAGE_RATE = 0.76
```

inside application code.

This creates a maintenance problem every time legislation, regulations, local rates, thresholds, or effective dates change.

---

## 3. Tax Rules as Data

Tax rates, brackets, thresholds, deductions, limits, formulas, and filing requirements should exist as **versioned data**.

Example:

```text
TaxRule
---------
id
jurisdiction
tax_type
tax_year
effective_from
effective_to
rule_type
value
formula
source_document
source_url
source_date
version
status
created_at
approved_at
Example:
jurisdiction = US-FEDERAL
tax_type = FEDERAL_WITHHOLDING
tax_year = 2026
effective_from = 2026-01-01
effective_to = 2026-12-31
source = IRS Publication 15-T
source_version = 2026
```

The payroll engine retrieves the applicable rule rather than knowing the rate itself.

---

## 4. Tax Year Setup

TaxShield Ledger should introduce a first-class **Tax Year** concept.

### 4.1 Tax Year Dashboard

When the owner creates a new year:

Create Tax Year

```text
2026
│
├── Federal
├── State
├── Local
├── Payroll
├── Mileage
├── Filing requirements
├── Tax forms
└── Business deductions
```

The system determines which rules apply based on:

- Tax year
- Business state
- Business locality
- Employee residence
- Employee work location
- Local tax jurisdiction
- LLC tax classification
- Filing status where relevant
- Payroll frequency
- Effective date

---

## 5. Automatic Tax Rule Update Engine

The application should have a **Tax Rules Update Service**.

Its job is to monitor authoritative sources and create new rule versions.

### 5.1 Source hierarchy

The system should distinguish between:

**Tier 1 — Authoritative**

- IRS
- U.S. Treasury
- Pennsylvania Department of Revenue
- Pennsylvania Department of Labor & Industry
- Applicable local tax authorities
- SSA
- Official government publications
**Tier 2 — Supporting**

Official government APIs, XML feeds, downloadable publications, government datasets.

**Tier 3 — Reference only**

Third-party tax data providers should never silently override an authoritative source.

---

## 6. IRS Source Registry

Every tax rule should have a source record.

Example:

Federal Income Tax Withholding

Source:

IRS Publication 15-T

Tax Year:

2026

Publication Date:

12/11/2025

Retrieved:

2026-01-02

Effective:

2026-01-01

Source URL:

IRS publication URL

Checksum:

SHA-256

Status:

Validated

The IRS currently publishes Publication 15-T specifically for federal income-tax withholding methods, including percentage-method and wage-bracket tables.

The IRS also provides XML source files for instructions and publications, which should be evaluated as an ingestion source instead of relying exclusively on HTML scraping.

---

## 7. Tax Rule Lifecycle

Every rule should move through a controlled lifecycle:

DISCOVERED

↓

DOWNLOADED

↓

PARSED

↓

NORMALIZED

↓

VALIDATED

↓

TESTED

↓

APPROVED

↓

ACTIVE

↓

SUPERSEDED

This is important because tax rules are effectively **financial configuration with legal consequences**.

---

## 8. Effective-Dated Rules

Rules must support more than one rate during a year.

This is especially important for mileage.

For example, IRS 2026 business mileage is:

01/01/2026 – 06/30/2026 = $0.725/mile

07/01/2026 – 12/31/2026 = $0.76/mile

The system therefore needs:

TaxRule

effective_from

effective_to

rather than:

tax_year

rate

This prevents historical transactions from being recalculated incorrectly when a new rate becomes active.

---

## 9. Calculation Snapshot

This is a critical audit feature.

When TaxShield calculates payroll, mileage, reimbursement, or another tax amount, it should save the exact rules used.

Example:

Payroll Run #2026-0034

Gross:

$2,400.00

Federal withholding:

$182.44

Rule Version:

US-FEDERAL-2026-PUB15T-v3

PA withholding:

$73.68

Rule Version:

PA-2026-SIT-v2

FICA:

$183.60

Rule Version:

FED-FICA-2026-v1

If the government changes a rule later, **old payroll records must not silently change**.

Historical calculations should remain reproducible.

---

## 10. Tax Calculation Reproducibility

Every calculation should answer:

"Why is this number $X?"

The UI should provide:

**View Calculation**

Gross wages                         $2,400.00

Federal taxable wages              $2,400.00

Federal withholding                $182.44

```text
└── IRS Pub 15-T
└── 2026
└── Married filing status
└── Biweekly
└── W-4 configuration
```

Social Security                    $148.80

```text
└── Applicable 2026 rule
```

Medicare                             $34.80

```text
└── Applicable 2026 rule
```

PA withholding                       $73.68

```text
└── PA rule version
```

Net pay                            $1,960.28

This is much more valuable than simply displaying the final number.

---

## 11. Company Expense Tracker

Add a completely separate **Expense Management module**.

The current PRD mentions parking, tolls, supplies and travel, but the product should evolve into a full company expense ledger. The existing PRD already establishes the need for receipt attachments and audit-ready records.

### 11.1 Expense Entry

Each expense should contain:

Date

Vendor

Amount

Tax

Payment method

Category

Subcategory

Business purpose

Employee / owner

Location

Project / client

Receipt

Notes

Reimbursement status

Tax treatment

---

## 12. Receipt Management

Receipt storage should be a major product feature.

The owner should be able to:

**Take photo → upload → categorize → save**

Supported:

- JPG
- PNG
- HEIC
- PDF
- scanned documents

---

## 13. Receipt OCR

Future feature:

Upload receipt

↓

OCR

↓

Vendor detected

↓

Date detected

↓

Amount detected

↓

Tax detected

↓

Category suggested

↓

User confirms

Example:

Home Depot

Date: 08/22/2026

Total: $184.27

Tax: $11.04

Suggested category:

Equipment / Supplies

Business purpose:

[Enter purpose]

Payment:

Company Card

The system should clearly indicate which information was automatically extracted versus manually confirmed.

---

## 14. Receipt-to-Transaction Matching

A powerful future feature:

Receipt

↓

Expense

↓

Bank transaction

The system can eventually identify:

Home Depot

$184.27

08/22/2026

and match it against a bank/credit-card transaction.

Status:

MATCHED

UNMATCHED

DUPLICATE

NEEDS REVIEW

---

## 15. Receipt Audit Evidence

The product should not only save the receipt.

It should preserve the entire evidence chain:

```text
Expense
│
├── Receipt
├── Business purpose
├── Payment method
├── Bank transaction
├── Employee/owner
├── Related mileage
├── Related reimbursement
└── Tax treatment
This produces an audit evidence package.
```

---

## 16. Expense Categories

Create configurable categories mapped to tax reporting categories.

Example:

Vehicle

Travel

Meals

Tolls

Parking

Office Supplies

Equipment

Software

Professional Services

Legal

Accounting

Insurance

Advertising

Bank Fees

Education

Telephone

Internet

Rent

Utilities

Payroll

Payroll Taxes

Employee Benefits

Contract Labor

Other

The categories should be configurable by tax year because tax reporting requirements can evolve.

---

## 17. Business Purpose Requirement

For selected expense categories, the application should require a business purpose.

Example:

Expense:

$325.00

Category:

Travel

Business purpose:

[Required]

Client:

[Optional]

Project:

[Optional]

A vague description such as:

"Business"

should generate a warning.

Better:

"Travel to vendor warehouse to inspect equipment for LLC purchase."

---

## 18. Expense Confidence / Audit Readiness Score

Add an **Audit Readiness Score**.

Example:

Expense: $450

Audit readiness: 92%

✓ Receipt attached

✓ Date recorded

✓ Vendor recorded

✓ Business purpose recorded

✓ Payment source recorded

✓ Category assigned

⚠ Client/project not specified

For the company:

## 2026 Audit Readiness

━━━━━━━━━━━━━━━━━━

94%

Receipts        98%

Expenses        95%

Mileage         100%

Payroll         92%

Reimbursements  89%

This turns "audit anxiety" into an actionable dashboard.

---

## 19. Mileage Module Expansion

The existing 5-point model is a strong foundation and should remain strict. The PRD currently requires date, origin/destination, business purpose, starting odometer and ending odometer.

Add:

**Vehicle**

Vehicle

VIN

Make

Model

Year

License plate

Ownership

Business-use percentage

Starting odometer

Ending odometer

**Mileage audit trail**

Each trip should record:

Created timestamp

Created by

Original values

Modified values

Modification timestamp

Modification reason

Do not overwrite historical values without preserving the change history.

---

## 20. Mileage Rate Engine

Mileage must use the effective rate for the date of the trip.

Example:

Trip date: 06/15/2026

Miles: 100

Rate: $0.725

Deduction: $72.50

versus:

Trip date: 07/15/2026

Miles: 100

Rate: $0.76

Deduction: $76.00

The user should never manually enter the IRS mileage rate.

---

## 21. Expense + Mileage Relationship

A trip should allow associated expenses.

Example:

Business Trip

Philadelphia → Harrisburg

Mileage:

## 210 miles

Mileage deduction:

$152.25

Toll:

$28.40

Parking:

$12.00

Total travel-related deduction:

$192.65

The system should warn against accidental duplicate treatment.

---

## 22. Employee Reimbursement Module

Create:

**Reimbursement Center**

Employees can submit:

Mileage

Parking

Tolls

Supplies

Travel

Other approved expenses

Workflow:

Submitted

↓

Manager/Owner Review

↓

Approved

↓

Reimbursed

↓

Reconciled

---

## 23. Accountable Plan Ledger

Expand the existing accountable-plan functionality into a dedicated ledger.

Each reimbursement should have:

Employee

Expense

Business purpose

Receipt

Amount

Approval

Reimbursement date

Payment method

Tax treatment

The system should distinguish:

Taxable compensation

vs.

Non-taxable reimbursement

The existing PRD already identifies mileage, toll and parking reimbursements as non-taxable accountable-plan reimbursements in its payroll design.

---

## 24. Payroll Module

Keep the current assisted-payroll model but make it driven entirely by tax rules.

The current PRD correctly identifies federal withholding, FICA, PA withholding, local EIT and LST as separate payroll calculations.

Add:

- Employee profile
- W-4 data
- State withholding profile
- Local tax jurisdiction
- Pay frequency
- Compensation history
- Deduction history
- Benefit deductions
- Reimbursements
- YTD reconciliation
- Payroll lock
- Payroll reversal/correction workflow

---

## 25. Employee Location / Jurisdiction Engine

This should be a major feature.

Do not simply store:

employee_state = PA

Instead:

```text
Employee
│
├── Home address
├── Residence jurisdiction
├── Work location
├── Work jurisdiction
├── Local tax jurisdiction
└── Effective dates
```

This allows the application to determine which rules apply.

For example:

Employee moves:

Before 06/30:

Residence = Locality A

07/01:

Residence = Locality B

The payroll engine should use the correct jurisdiction based on the payroll date.

---

## 26. Jurisdiction Resolver

Create a service:

JurisdictionResolver

Input:

Address

Date

Employee/Company

Output:

Country

State

County

Municipality

School district, if applicable

Local tax jurisdiction

Payroll jurisdictions

Applicable filing agencies

The system should store the result with the transaction rather than repeatedly recalculating historical transactions.

---

## 27. Tax Configuration Dashboard

Add an administrative screen:

**Tax Configuration**

Tax Year: 2026

Federal

✓ Loaded

✓ Validated

✓ Active

Pennsylvania

✓ Loaded

✓ Validated

✓ Active

Local

✓ Loaded

⚠ 2 jurisdictions need review

Mileage

✓ 2026 rates loaded

Payroll

✓ 2026 rules loaded

Last verification:

08/23/2026

---

## 28. Tax Rule Change Alerts

The owner should not need to understand tax legislation.

Display:

**Tax Rule Update Available**

Example:

## 2027 Federal Withholding Rules

New IRS publication detected.

Effective:

01/01/2027

Impact:

Payroll calculations

Action:

Review update

For normal updates, the system can automatically activate them.

For potentially significant changes, require approval.

---

## 29. Rule Update Safety

Never immediately replace an active rule.

Instead:

Current Rule

↓

New Rule Detected

↓

Automated Validation

↓

Regression Tests

↓

Impact Analysis

↓

Approval

↓

Activation

---

## 30. Tax Rule Regression Testing

This should be built into the backend.

Every new tax rule version should run historical test cases.

Example:

Test Case #104

Gross wages:

$1,000

Expected federal withholding:

$XX.XX

New engine:

$XX.XX

Result:

PASS

If the result changes unexpectedly:

RULE ACTIVATION BLOCKED

---

## 31. Tax Rule Diff

Before activating a new version:

## 2026 Rule → 2027 Rule

Federal withholding:

Bracket 1: changed

Bracket 2: unchanged

Bracket 3: changed

Mileage:

72.5¢ → new rate

Threshold:

Changed

Estimated payroll impact:

+$XX/month

This gives the owner confidence that the update was intentional.

---

## 32. Government Source Archive

TaxShield should preserve the source used to calculate historical values.

For each source:

Source document

Version

Publication date

Effective date

URL

Downloaded file

Checksum

Parser version

Imported timestamp

This is essential for audit reproducibility.

---

## 33. Don't Depend on Live IRS Availability

The calculation engine should work even if IRS.gov is unavailable.

Architecture:

Government Source

↓

Tax Data Ingestion

↓

Validated Tax Rules Database

↓

Calculation Engine

↓

Application

The application should calculate from its **locally stored, approved rules**.

It should not call IRS.gov every time payroll is calculated.

---

## 34. Tax Rule Data Model

Recommended conceptual model:

TaxJurisdiction

TaxYear

TaxRule

TaxRuleVersion

TaxRuleComponent

TaxRate

TaxBracket

TaxThreshold

TaxDeduction

TaxCredit

TaxLimit

TaxFormula

TaxForm

FilingRequirement

GovernmentSource

SourceDocument

EffectivePeriod

This provides flexibility for future federal, state and local expansion.

---

## 35. Company Ledger

Add a lightweight accounting ledger.

It does not need to become QuickBooks.

Its purpose is tax preparation and audit support.

Transactions:

Income

Expense

Payroll

Payroll Tax

Mileage

Reimbursement

Owner Contribution

Owner Distribution

Loan

Bank Fee

Asset Purchase

---

## 36. Bank Reconciliation — Future Feature

Allow manual CSV import initially.

Later:

Bank CSV

↓

Transaction Import

↓

Auto Categorization

↓

Receipt Matching

↓

Duplicate Detection

↓

Reconciliation

This maintains the zero-subscription philosophy while still reducing manual work.

---

## 37. Asset & Equipment Tracking

Add:

Asset

Purchase date

Purchase price

Category

Business-use %

Receipt

Placed-in-service date

Depreciation method

Tax treatment

Disposition date

This becomes important when an LLC purchases:

- Computers
- Tools
- Machinery
- Furniture
- Vehicles
- Equipment

---

## 38. Home Office Module

Future feature:

Home office

Total home area

Office area

Business-use percentage

Eligible expenses

Supporting documents

The engine should determine applicable treatment from the tax-year rules rather than embedding assumptions.

---

## 39. Tax Deduction Dashboard

Replace the simple loss dashboard with:

**Tax Position**

## 2026 YTD

Gross Revenue                  $XX,XXX

Business Expenses              $XX,XXX

Payroll                         $XX,XXX

Payroll Taxes                   $X,XXX

Mileage                          $X,XXX

Reimbursements                   $X,XXX

Estimated Business Profit/Loss

$XX,XXX

Then:

Expense Breakdown

Vehicle              18%

Payroll               31%

Software               8%

Travel                12%

Professional Services  9%

Other                 22%

---

## 40. Tax Impact Simulator

The existing PRD proposes a pass-through benefit simulator.

Expand it into scenarios:

Current expenses

↓

Estimated taxable income

↓

Estimated tax impact

Allow:

What if I spend another $2,000 on equipment?

What if payroll increases by $5,000?

What if I drive another 2,000 business miles?

Clearly label results as **estimates**, not tax advice or guaranteed savings.

---

## 41. Year-End Close

Create a guided workflow:

**Close 2026**

✓ All expenses categorized

✓ All receipts attached

✓ Mileage complete

✓ Payroll reconciled

✓ Reimbursements reconciled

✓ Bank transactions reconciled

✓ Missing documents reviewed

✓ Duplicate expenses checked

✓ Tax rules locked

✓ W-2 data verified

✓ CPA package generated

Then:

**Lock Tax Year**

Once locked, historical calculations cannot be silently changed.

---

## 42. CPA / Tax Preparer Package

The existing PRD already proposes a CPA export.

Make this much more powerful.

Generate:

## 2026 Tax Package

## 01 Executive Summary

## 02 Income Summary

## 03 Expense Summary

## 04 Mileage Report

## 05 Vehicle Report

## 06 Payroll Summary

## 07 Payroll Tax Summary

## 08 Reimbursement Report

## 09 Asset Report

## 10 Receipt Index

## 11 Missing Documentation Report

## 12 Tax Rule Sources

## 13 Calculation Audit Trail

## 14 W-2 Data

## 15 Form Mapping

---

## 43. IRS Audit Package

Add a one-click feature:

**Generate Audit Package**

Output:

TaxShield_2026_Audit_Package.zip

/company-summary.pdf

/expense-ledger.xlsx

/mileage-log.xlsx

/payroll-summary.xlsx

/reimbursements.xlsx

/receipt-index.xlsx

/receipts/*

/tax-rules/*

/calculation-audit/*

Every expense in the spreadsheet should have a unique ID linking it to the receipt.

Example:

EXP-2026-00482

Receipt:

REC-2026-00482

---

## 44. Receipt Retention

Receipts should be retained independently of the expense record.

If an expense is deleted or corrected:

Original Expense

↓

Voided

↓

Replacement Expense

The original receipt and audit history remain available.

Never physically destroy historical audit records simply because the UI record was edited.

---

## 45. Document Integrity

For important documents, store:

SHA-256 hash

Upload timestamp

Uploader

Original filename

MIME type

File size

Document version

This allows the application to demonstrate that a document has not been modified.

---

## 46. Security

Continue the existing requirement for encryption of sensitive employee information. The current PRD already specifies encryption at rest and limiting SSN visibility to the last four digits.

Add:

- Field-level encryption for SSN
- Encryption for bank information
- Role-based access
- Session timeout
- MFA
- Audit logging
- Download logging
- Document access logging
- Data export
- Account deletion workflow
- Backup encryption

---

## 47. Roles

Initial version:

OWNER

Future:

OWNER

BOOKKEEPER

EMPLOYEE

CPA / TAX PREPARER

READ-ONLY AUDITOR

The CPA should be able to review records without being able to modify payroll or tax rules.

---

## 48. Audit Event Log

Every sensitive action should create an event.

WHO

WHAT

WHEN

BEFORE

AFTER

WHY

IP/device information where appropriate

Example:

User:

Owner

Action:

Changed expense category

Expense:

EXP-2026-00482

Before:

Office Supplies

After:

Equipment

Timestamp:

2026-08-23 18:42

Reason:

"Corrected categorization"

---

## 49. Dashboard Design

The home screen should answer:

**"Is my company financially and tax-wise under control?"**

```text
┌────────────────────────────────────────────┐
│ 2026 TAX YEAR                              │
│                                            │
│ Revenue                 $XX,XXX            │
│ Expenses                $XX,XXX            │
│ Estimated Profit/Loss   $XX,XXX            │
│                                            │
│ Audit Readiness             94%             │
└────────────────────────────────────────────┘

┌───────────────┐ ┌───────────────┐
│ Expenses      │ │ Mileage       │
│ $XX,XXX       │ │ 4,832 miles   │
│ 124 receipts  │ │ $3,648        │
└───────────────┘ └───────────────┘

┌───────────────┐ ┌───────────────┐
│ Payroll       │ │ Compliance    │
│ $XX,XXX       │ │ 2 tasks due   │
└───────────────┘ └───────────────┘
```

---

## 50. "Needs Attention" Center

This could become one of the most valuable screens.

Needs Attention

🔴 Missing receipt

$428.00 — Office Depot

🟠 Missing business purpose

$86.40 — Parking

🟠 Payroll reconciliation

February payroll

🟡 Tax rule update

## 2027 federal withholding rules

🟢 Mileage

All trips complete

The goal is to make compliance proactive instead of reactive.

---

## 51. Notifications

Examples:

Receipt missing for $185.20 expense.

Mileage trip cannot be finalized because ending odometer is missing.

Quarterly Form 941 task due in 12 days.

New federal tax rule available for 2027.

Pennsylvania/local tax rule update detected.

Payroll YTD totals do not reconcile.

---

## 52. Mobile-First Expense Capture

The current PRD already identifies mobile accessibility as important for mileage and parking entry.

Expand this to a mobile capture workflow:

+ Add

Expense

Mileage

Receipt

Reimbursement

Time

For receipts:

Take Photo

↓

OCR

↓

Confirm Amount

↓

Choose Category

↓

Business Purpose

↓

Save

Target:

**<30 seconds to capture an expense.**

---

## 53. Search Everything

Global search:

$450

Home Depot

08/22/2026

EXP-2026-00482

Mileage

John

Payroll

Receipt

Results should search:

- Expenses
- Receipts
- Mileage
- Payroll
- Employees
- Transactions
- Tax rules
- Documents
- Compliance tasks

---

## 54. Duplicate Detection

Detect potential duplicates:

Vendor:

Home Depot

Date:

08/22/2026

Amount:

$184.27

If another identical transaction exists:

Possible duplicate expense.

Allow:

Keep both

Mark duplicate

Review

---

## 55. Missing Evidence Detection

Rules can flag:

Expense > $X without receipt

Travel expense without business purpose

Mileage without complete odometer

Reimbursement without approval

Payroll payment without payroll record

Bank transaction without category

This turns TaxShield into an **active compliance assistant**.

---

## 56. Tax-Year Data Isolation

Every transaction should belong to a tax year.

Transaction

↓

Transaction Date

↓

Tax Year Resolver

↓

Tax Year

Do not rely solely on:

created_at.year

because tax treatment may depend on transaction date, payment date, effective date, or other rules.

---

## 57. Immutable Historical Calculations

A 2026 payroll calculation should remain a 2026 calculation.

If the rules database later contains:

## 2027 Rule

the 2026 payroll must still use:

## 2026 Rule Version

Historical reporting should be deterministic.

---

## 58. Multi-Year Architecture

The application should be designed from day one as:

```text
Company
│
├── 2025 Tax Year
│   ├── Rules
│   ├── Expenses
│   ├── Mileage
│   ├── Payroll
│   └── Compliance
│
├── 2026 Tax Year
│   ├── Rules
│   ├── Expenses
│   ├── Mileage
│   ├── Payroll
│   └── Compliance
│
└── 2027 Tax Year
├── Rules
├── Expenses
├── Mileage
├── Payroll
└── Compliance
The company profile persists.
Tax-year configuration changes.
```

---

## 59. New-Year Wizard

Every December/January:

**Start New Tax Year**

Create 2027

Company information

↓

Confirm tax classification

↓

Confirm business locations

↓

Confirm employees

↓

Resolve jurisdictions

↓

Download 2027 tax rules

↓

Validate rules

↓

Review changes

↓

Activate 2027

The user should **not manually type tax rates**.

---

## 60. Tax Rule Coverage Matrix

Create an internal dashboard:

| **Area** | **2026** | **2027** | **Source** | **Status** |
| --- | --- | --- | --- | --- |
| Federal withholding | ✓ | ✓ | IRS Pub 15-T | Active |
| Federal FICA | ✓ | ✓ | IRS | Active |
| Mileage | ✓ | Pending | IRS | Review |
| PA withholding | ✓ | Pending | PA DOR | Review |
| Local EIT | ✓ | Pending | Local authority | Review |
| LST | ✓ | Pending | Local authority | Review |
| FUTA | ✓ | Pending | IRS | Review |
| PA UC | ✓ | Pending | PA L&I | Review |

This gives the product team visibility into whether a new tax year is actually ready.

---

## 61. Important Product Architecture Decision

Separate the application into four layers:

```text
┌──────────────────────────────────────┐
│           User Interface             │
├──────────────────────────────────────┤
│          Business Services           │
│ Expense / Payroll / Mileage / Filing │
├──────────────────────────────────────┤
│          Tax Rules Engine             │
│ Versioned / Effective-Dated Rules    │
├──────────────────────────────────────┤
│       Government Source Layer         │
│ IRS / PA / Local / SSA / etc.        │
└──────────────────────────────────────┘
The most important boundary is:
```

**The calculation engine must never contain hardcoded tax rates.**

---

## 62. Recommended Backend Services

A future implementation could use:

Company Service

Employee Service

Expense Service

Receipt Service

Mileage Service

Payroll Service

Reimbursement Service

Tax Rules Service

Jurisdiction Service

Compliance Service

Document Service

Audit Service

Reporting Service

Notification Service

---

## 63. Tax Rules Service

Example API concept:

GET /tax-rules

jurisdiction=US-FEDERAL

taxYear=2026

taxType=WITHHOLDING

effectiveDate=2026-08-23

Response:

Rule Version:

US-FEDERAL-2026-PUB15T-v3

Payroll should then calculate using that rule set.

---

## 64. Tax Rules Should Be Declarative

Where practical, represent rules as data rather than executable application code.

Example:

{

"rule": "federal_withholding",

"tax_year": 2026,

"effective_from": "2026-01-01",

"effective_to": "2026-12-31",

"method": "percentage",

"source": "IRS-PUB-15T-2026",

"version": 3

}

Complex formulas can use a controlled calculation DSL or versioned calculation modules.

---

## 65. Never Allow Silent Rule Changes

If the IRS publishes an update:

NEW RULE DETECTED

## 2026 Federal Withholding

Current:

v2

New:

v3

Effective:

07/01/2026

Affected:

Payroll

Historical payroll:

UNCHANGED

Future payroll:

Will use v3

This is a major trust feature.

---

## 66. Product Differentiator

The strongest positioning is not:

"Free payroll software."

It is:

**"Your LLC's tax records, calculations, receipts, and audit trail — organized by tax year and backed by the rules used to calculate them."**

This differentiates TaxShield from a basic spreadsheet.

---

## 67. MVP Priorities

I would **not build everything above in V1**.

**Phase 1 — Core**

1. Company setup
1. Tax-year setup
1. Federal/state/local jurisdiction setup
1. Tax rules repository
1. Expense tracker
1. Receipt upload
1. Mileage tracker
1. Basic payroll
1. Reimbursements
1. Compliance calendar
1. Audit trail
1. Year-end export
**Phase 2**

1. OCR receipt extraction
1. Bank CSV import
1. Receipt matching
1. Duplicate detection
1. Audit readiness score
1. CPA package
1. Tax rule update automation
1. Tax-rule regression testing
**Phase 3**

1. Automated jurisdiction resolution
1. Advanced payroll
1. Local tax automation
1. Asset/depreciation tracking
1. Advanced tax simulator
1. CPA portal
1. Multi-user roles
1. Advanced document management

---

## 68. Success Metrics — Expanded

The existing PRD has useful metrics around zero SaaS cost, complete mileage logs, calculation accuracy and filing time.

Add:

**Record completeness**

- 95% of expenses have receipts where required
- 95% of expenses contain business purpose where required
- 100% of finalized mileage trips contain required fields
**Tax engine**

- 100% of production calculations linked to a rule version
- 0 historical calculations silently changed
- 100% of active tax rules have an authoritative source
**Audit readiness**

- Every expense traceable to supporting documentation
- Every payroll calculation traceable to tax rules
- Every reimbursement traceable to approval/payment
- Every document has immutable metadata
**User experience**

- Expense capture <30 seconds
- Mileage entry <30 seconds
- Quarterly compliance preparation <5 minutes where no exceptions exist
- New tax year setup <10 minutes

---

## 69. The "Trust Model"

TaxShield should make three promises:

**Promise 1 — I know where the number came from.**

Every tax calculation has a source.

**Promise 2 — I can reproduce the number later.**

Every calculation has a rule version.

**Promise 3 — I can prove the expense.**

Every significant deduction can be connected to evidence.

That creates the fundamental product loop:

TRANSACTION

↓

CLASSIFICATION

↓

TAX TREATMENT

↓

CALCULATION

↓

DOCUMENTATION

↓

AUDIT TRAIL

↓

TAX REPORT

---

## 70. Recommended North-Star Architecture

The long-term product should evolve into:

```text
TAXSHIELD LEDGER
│
┌────────────────┼────────────────┐
│                │                │
MONEY            TAX RULES        EVIDENCE
│                │                │
┌────┴────┐      ┌────┴────┐      ┌────┴────┐
│         │      │         │      │         │
```

Expenses   Payroll  Federal   State  Receipts  Documents

Mileage    Income   Local     IRS    Mileage   Audit Log

Payments   Reimbursements     Rules  W-2       Sources

```text
│                │                │
└────────────────┼────────────────┘
│
YEAR-END PACKAGE
│
Owner / CPA / Tax Return
```

The application is therefore not simply a **payroll calculator** or **expense tracker**.

It becomes a **multi-year tax evidence and calculation platform for the LLC**.

---

## 71. Final Product Recommendation

The three most important changes I would make to the original PRD are:

## 1. Make Tax Year + Jurisdiction first-class entities

Everything tax-related should depend on:

**Company + Tax Year + Jurisdiction + Effective Date.**

## 2. Create a versioned Tax Rules Engine

Never hardcode:

- Tax rates
- Brackets
- Thresholds
- Mileage rates
- Tax limits
- Filing deadlines
- Local rates
- Form requirements
Instead, store the rule, source, effective period and version.

The IRS's current materials demonstrate why this matters: 2026 withholding rules are published through Publication 15-T, while annual tax provisions are also published through Revenue Procedures and other IRS guidance.

## 3. Make Evidence Management a core feature

Every deduction should be thought of as:

**Money + Reason + Rule + Evidence**

rather than simply:

**Money + Category.**

That means the receipt tracker, business-purpose field, mileage log, reimbursement record, calculation snapshot and audit trail should all connect to one another.

This is what can make TaxShield Ledger substantially more useful than a collection of spreadsheets and calculators.

## 72. Multi-State Payroll & Tax Jurisdiction Engine

TaxShield Ledger must support employees and business activities occurring across multiple U.S. states and local jurisdictions.

The application must not assume that the LLC's state of formation or primary business location determines an employee's payroll tax treatment.

An employee may:

- Live in one state and work in another.
- Work remotely from their residence.
- Work from the company's office.
- Work from a temporary location.
- Travel to another state for business.
- Work in multiple states during a single payroll period.
- Change residence during the year.
- Change primary work location during the year.
- Work remotely for only certain days of the week.
- Perform services in multiple local tax jurisdictions.
The tax engine must determine applicable rules based on **employee residence, physical work location, employer nexus, jurisdiction, transaction/pay date, and effective dates**.

The IRS recognizes that state withholding becomes more complicated when employees live in a different state from where they work or perform services in multiple states.

---

## 73. Three Different Locations Must Be Modeled

Do not store a single "employee state."

TaxShield should maintain at least three independent concepts:

### 73.1 Employee Residence

Where the employee lives for tax purposes.

```text
Employee Residence
-------------------
Address
City
State
ZIP
County
Local jurisdiction
Effective From
Effective To
Example:
Employee: John Smith
```

Residence:

New Jersey

Effective:

01/01/2026

---

### 73.2 Employer Business Locations

The company can have:

```text
Company
│
├── Headquarters — PA
├── Warehouse — NJ
├── Office — NY
└── Registered location — DE
Each location should contain:
Business Location
-----------------
Address
State
County
Municipality
Location Type
Effective From
Effective To
```

---

### 73.3 Actual Work Location

This is the most important addition.

For each employee/workday or payroll allocation:

```text
Work Location
-------------
Employee
Date
State
County
City
Location Type
Hours
Source
Location types:
COMPANY_OFFICE
EMPLOYEE_HOME
CUSTOMER_SITE
TEMPORARY_WORKSITE
TRAVEL
OTHER
```

---

## 74. Work Location Must Be Time-Based

Do not store:

Employee.work_state = PA

Instead:

EmployeeWorkLocation

employee_id

date

location

state

hours

Example:

John Smith

08/24/2026

NJ home

## 8 hours

08/25/2026

PA office

## 8 hours

08/26/2026

PA office

## 8 hours

08/27/2026

NY customer site

## 8 hours

08/28/2026

NJ home

## 8 hours

This allows payroll to calculate state-specific wages.

---

## 75. Payroll State Allocation

Suppose an employee earns:

Weekly salary: $2,000

and works:

NJ: 1 day

PA: 3 days

NY: 1 day

The payroll engine should be capable of allocating wages based on the applicable state sourcing rules.

Conceptually:

```text
$2,000
│
├── NJ allocation
├── PA allocation
└── NY allocation
```

The actual allocation method must come from the applicable jurisdiction rules rather than being hardcoded.

---

## 76. Do Not Assume Simple Day-Based Allocation

This is important.

TaxShield should not blindly implement:

NY wages = 20%

PA wages = 60%

NJ wages = 20%

and assume that is legally correct.

State sourcing, withholding, reciprocity, de minimis rules, convenience-of-employer rules, and employer registration requirements vary.

Therefore the rules engine should determine the applicable method.

The product should be designed so that **state-specific sourcing rules are data/configuration**, not application code.

---

## 77. State Tax Jurisdiction Resolver

Introduce a central service:

JurisdictionResolver

Input:

Employee

+

Residence

+

Physical Work Location

+

Work Date

+

Employer Locations

+

Employer Nexus

+

Tax Year

Output:

Applicable jurisdictions

Applicable withholding

Applicable employer taxes

Applicable employee taxes

Applicable local taxes

Required registrations

Required filings

Required forms

---

## 78. Jurisdiction Resolution Example

Employee:

Residence: NJ

Work location: PA

Date: 08/25/2026

Employer: PA LLC

The engine evaluates:

Employee residence

↓

NJ rules

Physical work location

↓

PA rules

Employer nexus

↓

PA + potentially other jurisdictions

Reciprocity

↓

Check applicable agreement

Local taxation

↓

Resolve applicable local jurisdiction

The engine should then produce a **Tax Decision Record**.

---

## 79. Tax Decision Record

Every payroll calculation should preserve why a jurisdiction was selected.

Example:

Tax Decision

Employee:

EMP-00042

Payroll:

PAY-2026-0088

Work date:

08/25/2026

Residence:

NJ

Physical work state:

PA

Applicable state:

PA

Reason:

[Rule reference]

Rule version:

PA-WITHHOLDING-2026-v4

Secondary jurisdiction:

NJ

Reciprocity:

[Rule result]

Decision:

[Applicable withholding treatment]

This is extremely valuable during an audit or payroll review.

---

## 80. Employer Nexus Engine

This needs to be separate from employee withholding.

A company may create obligations in a state because of activities there.

Therefore:

Employer Nexus

should be a first-class object.

Possible triggers include:

- Employee physically working in state
- Company office
- Warehouse
- Registered location
- Business activity
- Sales activity
- Customer activity
- State registration
- Other state-specific nexus criteria
The engine should not assume that **payroll withholding = complete state tax compliance**.

---

## 81. Nexus Status

For every state:

State Compliance Matrix

State     Nexus       Payroll       Income/Business    Registration

PA        YES         Required      Required           Active

NJ        YES         Required      Review             Active

NY        REVIEW      Review        Review             Review

DE        NO           None         None               None

Use statuses:

ACTIVE

NOT_APPLICABLE

REVIEW_REQUIRED

REGISTRATION_REQUIRED

UNKNOWN

---

## 82. State-by-State Tax Configuration

TaxShield should eventually maintain rules for all 50 states + DC.

Conceptually:

```text
United States
│
├── Federal
│
├── Alabama
├── Alaska
├── Arizona
├── Arkansas
├── California
├── Colorado
├── Connecticut
├── Delaware
├── Florida
├── Georgia
├── ...
└── Wyoming
```

But **do not build 50 separate payroll engines**.

Build:

Common Tax Engine

+

State-specific Rule Sets

---

## 83. States Without Individual Income Tax

The engine must not assume every state has an individual income tax withholding requirement.

For example, some states do not impose a general individual state income tax.

Therefore:

State Income Tax

should itself be a rule:

APPLICABLE

NOT_APPLICABLE

CONDITIONAL

rather than a mandatory calculation field.

---

## 84. Local Tax Engine

State is not enough.

Some employees may be subject to:

State

County

City

Municipality

School district

Special local tax

Therefore:

Jurisdiction Tree

```text
Federal
│
└── State
│
├── County
│
├── City
│
└── Local Tax District
```

The existing PA-specific local EIT functionality should become an instance of this generalized architecture rather than remaining Pennsylvania-specific.

---

## 85. Reciprocity Engine

Reciprocal agreements should be represented as rules.

Example conceptual model:

ReciprocityRule

state_A

state_B

effective_from

effective_to

eligible_workers

required_employee_certificate

withholding_state

source

version

The engine evaluates:

Employee Residence

+

Work State

+

Reciprocity Rule

↓

Withholding Decision

The IRS explains that reciprocity can affect whether withholding is performed for the employee's residence state rather than the state where services are performed.

---

## 86. Remote Employee Scenario

TaxShield should explicitly support:

**Scenario A**

Company:

PA

Employee:

Lives NJ

Works:

100% remotely from NJ

The system should identify:

Employee residence = NJ

Physical work location = NJ

Employer location = PA

and evaluate NJ employer/payroll requirements as applicable.

The user should **not manually decide the tax state**.

---

## 87. Hybrid Employee Scenario

**Scenario B**

Company:

PA

Employee:

NJ resident

Monday:

NJ home

Tuesday:

PA office

Wednesday:

PA office

Thursday:

NJ home

Friday:

PA office

TaxShield records:

NJ: 2 workdays

PA: 3 workdays

The payroll engine then evaluates the applicable state rules.

---

## 88. Traveling Employee Scenario

**Scenario C**

Employee residence:

PA

Normal work:

PA

Customer visit:

NY

Duration:

## 2 days

The system should create:

Work Location Event

Employee:

EMP-00012

State:

NY

Dates:

08/27/2026 – 08/28/2026

Purpose:

Customer implementation

Hours:

16

The tax engine evaluates whether those NY workdays create any withholding, registration, reporting or other obligation.

Do not simply assume:

"Employee normally works in PA, so everything is PA."

---

## 89. Multi-State Payroll Period

A single paycheck can contain multiple jurisdictions.

Example:

Payroll Period

08/17 – 08/30

NJ work:

## 16 hours

PA work:

## 64 hours

NY work:

## 8 hours

The payroll engine should calculate a jurisdiction allocation:

NJ

$XXX.XX

PA

$XXX.XX

NY

$XXX.XX

Then calculate the applicable withholding and employer obligations.

---

## 90. Employee State Movement

Employees can move.

Example:

01/01 – 06/30

Residence: PA

07/01 – 12/31

Residence: NJ

Do not update the employee record in place.

Create effective-dated records:

EmployeeResidence

PA

01/01/2026 → 06/30/2026

NJ

07/01/2026 → present

Historical payroll remains unchanged.

---

## 91. Work Location Change

Same principle:

Work Location

PA Office

01/01 → 05/31

NJ Home

06/01 → 08/15

PA Office

08/16 → present

This creates a complete historical work-location record.

---

## 92. Employee Location Calendar

Add a calendar:

August 2026

Mon  Tue  Wed  Thu  Fri

NJ   PA   PA   NJ   PA

PA   PA   NY   PA   NJ

Color coding can indicate jurisdictions.

The employee or owner can correct the location before payroll is finalized.

---

## 93. Payroll Preflight

Before payroll is locked:

Payroll Preflight

────────────────────────────

✓ Employee W-4 complete

✓ Residence verified

⚠ Employee worked in NY

## 2 days

⚠ NY employer registration

status: REVIEW REQUIRED

✓ PA withholding rules loaded

✓ NJ rules loaded

⚠ Local jurisdiction unresolved

Payroll cannot be finalized

until warnings are resolved.

This is much safer than silently producing a paycheck.

---

## 94. "Why Is This Tax Being Withheld?"

Every state/local tax should have:

Tax amount

+

Jurisdiction

+

Reason

+

Rule version

+

Source

Example:

NY withholding: $XXX.XX

Why?

Employee physically performed

services in NY on 08/27 and 08/28.

Rule:

NY-WAGE-SOURCING-2026-v2

Source:

New York official guidance

---

## 95. Employer Taxes

Do not limit the engine to employee withholding.

For each state, separately model:

Employee withholding

Employer payroll tax

Unemployment tax

Disability programs

Paid leave programs

Local employer taxes

Other state-required contributions

The exact applicability should come from the state rule set.

---

## 96. State Filing Calendar

When the company becomes subject to a state:

State

↓

Registration

↓

Payroll account

↓

Withholding filings

↓

Unemployment filings

↓

Annual reconciliation

↓

W-2 / state reporting

TaxShield should automatically generate compliance tasks.

---

## 97. Multi-State W-2 Support

The year-end engine must support employees with multiple state/local wage records.

Instead of assuming:

One employee = one state

support:

```text
Employee
│
├── PA wages
├── NJ wages
├── NY wages
└── Local wages
```

The system should produce the appropriate year-end reporting data based on the applicable rules.

---

## 98. State Tax Rule Source Registry

Each state needs its own authoritative source registry.

Example:

Federal

IRS

Pennsylvania

PA Department of Revenue

PA Department of Labor & Industry

Local tax authorities

New Jersey

NJ Division of Taxation

NJ Department of Labor

New York

NY Department of Taxation and Finance

NY Department of Labor

The source registry should be data-driven.

---

## 99. Multi-State Rule Update Pipeline

The existing proposed IRS rule update system should be generalized:

Government Sources

↓

Federal

State

Local

↓

Source Monitor

↓

New/Changed Rules

↓

Parser

↓

Normalization

↓

Validation

↓

Regression Tests

↓

Human Review

↓

Active Rule Version

---

## 100. State Rule Coverage Dashboard

Add an internal product/admin dashboard:

## 2027 TAX YEAR READINESS

Federal

██████████████████ 100%

PA

██████████████████ 100%

NJ

████████████████    90%

NY

██████████████      75%

CA

██████████          55%

TX

██████████████████  100%

A payroll calculation should never silently use an incomplete rule set.

---

## 101. Rule Availability Gate

Before payroll:

Can TaxShield calculate this payroll?

Federal             ✓

PA                   ✓

NJ                   ✓

NY                   ⚠

NY rule set:

Incomplete

Result:

Payroll blocked OR

manual-review workflow

This is preferable to making an incorrect calculation.

---

## 102. Multi-State Compliance Risk Score

Add:

Company Compliance Risk

PA     LOW

NJ     MEDIUM

NY     HIGH

Reasons:

NY:

Employee worked 3 days

No state registration

No payroll account

The application should explain the risk rather than simply display a score.

---

## 103. Business Travel vs. Regular Work

The system should distinguish:

NORMAL_WORK_LOCATION

REMOTE_WORK

BUSINESS_TRAVEL

CUSTOMER_SITE

TEMPORARY_ASSIGNMENT

This distinction matters because the tax treatment of wages and travel expenses should not be inferred from the same data.

For example:

Employee travels from PA office

to NY customer site.

The system records:

Work location:

NY

Travel:

PA → NY

Business purpose:

Customer implementation

The mileage/travel engine and payroll jurisdiction engine can both use the event.

---

## 104. Work Location Evidence

For auditability, optionally preserve:

Employee confirmation

Date

Location

Hours

Manager approval

Travel record

Expense record

Do not rely on GPS as the sole source of truth.

Instead:

Declared location

+

Optional evidence

+

Payroll record

---

## 105. Employee Self-Service

Future employee portal:

Today's Work Location

Where did you work today?

○ Company office

○ Home

○ Customer site

○ Other location

State:

[Automatically detected]

Hours:

[8]

Business travel?

[Yes/No]

The employee submits it.

Owner approves exceptions.

---

## 106. Payroll Lock

Before payroll finalization:

All employee work locations

↓

Validated

↓

State allocation

↓

Tax rules resolved

↓

Payroll calculation

↓

Review

↓

LOCK

Once locked, changing a work location should trigger a payroll correction workflow.

---

## 107. Correction Workflow

Example:

Payroll already processed:

Employee actually worked in NY

but was recorded as PA.

Do not simply edit the original record.

Create:

Payroll Correction

Original:

PA

Correct:

NY

Reason:

Employee location correction

Affected payroll:

PAY-2026-0088

Tax impact:

+$XX NY

-$XX PA

Status:

Needs review

---

## 108. Architecture Change

The original PRD has a Pennsylvania-centric payroll engine.

I recommend changing:

PA Payroll Engine

to:

```text
Universal Payroll Engine
│
├── Federal Rules
│
├── State Rules
│
├── Local Rules
│
└── Jurisdiction Resolver
```

Pennsylvania then becomes simply the **first supported state implementation**.

---

## 109. Revised Core Domain Model

```text
Company
│
├── CompanyLocations
│
├── TaxYears
│
├── Employees
│     │
│     ├── ResidenceHistory
│     ├── W4History
│     └── WorkLocationHistory
│
├── Payroll
│
├── Expenses
│
├── Mileage
│
├── Reimbursements
│
└── NexusProfiles
```

```text
Tax Rules
│
├── Federal
├── State
├── County
├── City
└── Local
```

```text
Jurisdiction Engine
│
├── Residence Resolver
├── Work Location Resolver
├── Nexus Resolver
├── Reciprocity Resolver
├── Wage Sourcing Resolver
└── Filing Obligation Resolver
```

---

## 110. The Most Important New Data Object

I would introduce:

WorkLocationEvent

Example:

WorkLocationEvent

id

employee_id

date

start_time

end_time

hours

location_type

address

state

county

city

jurisdiction

business_purpose

source

employee_confirmed

manager_approved

created_at

updated_at

This becomes the bridge between:

**Employee → Payroll → State Tax → Travel → Expense → Audit**

---

## 111. Revised Payroll Calculation Pipeline

The payroll engine should work like this:

```text
PAYROLL RUN
│
▼
Employee Profile
│
┌──────────┴──────────┐
▼                     ▼
Residence History      Work Location
│                     │
└──────────┬──────────┘
▼
Jurisdiction
Resolver
│
┌───────────┼───────────┐
▼           ▼           ▼
Federal       State       Local
│           │           │
└───────────┼───────────┘
▼
Tax Rule Engine
│
▼
Payroll Calculation
│
▼
Calculation Snapshot
│
▼
Pay Stub
```

---

## 112. Product Principle

The application should never ask:

"What is the employee's tax state?"

Instead it should ask:

**"Given this employee, this employer, this date, this residence, this physical work location, this payroll period, and these applicable jurisdictions, what rules apply?"**

That is the fundamental difference between a simple payroll calculator and a true multi-state payroll engine.

---

## 113. Revised Product Vision

TaxShield Ledger should ultimately support:

**One LLC**

→ **Multiple tax years**

→ **Multiple employees**

→ **Multiple states**

→ **Multiple work locations**

→ **Multiple local jurisdictions**

→ **Multiple tax rules**

→ **Multiple payroll periods**

→ **Complete supporting evidence**

without requiring the owner to manually maintain tax rates.

The product should automatically determine the applicable rule set, calculate the amount, record the rule version used, identify compliance obligations, and preserve the evidence needed to explain the result.

---

## 114. Important Scope Boundary

Because state taxation is highly fact-specific, TaxShield should distinguish between:

**Automated**

- Rule lookup
- Jurisdiction lookup
- Payroll calculations
- Effective dates
- Reciprocity lookup
- State allocation
- Filing-calendar generation
- Rule-version tracking
- Compliance warnings
**Human Review**

- Ambiguous nexus
- Unusual remote-work arrangements
- Employer convenience rules
- Complex multi-state assignments
- Uncertain residency
- State registration decisions
- Conflicting jurisdiction rules
The UI should say:

**"****TaxShield** **cannot confidently determine this obligation. Review required."**

rather than guessing.

---

## 115. Final Recommended Positioning

This expansion changes the product significantly.

The product is no longer:

**"A Pennsylvania micro-LLC payroll and expense application."**

It becomes:

**"A multi-state tax-aware operating ledger for small U.S. businesses."**

Pennsylvania can remain the **first implementation**, but the underlying architecture should be national from day one.

The most important entities become:

Company

Tax Year

Employee

Residence

Work Location

Business Location

Jurisdiction

Nexus

Tax Rule

Tax Rule Version

Payroll

Expense

Receipt

Mileage

Reimbursement

Compliance Obligation

Audit Event

And the most important relationship becomes:

**Employee + Date + Physical Work Location → Jurisdiction → Applicable Tax Rules → Payroll Calculation → Compliance Obligation**

That architecture will let you add NJ, NY, DE, MD, VA, CA, TX, etc. without rewriting the payroll engine for every state.

**Employee Work Location Model**

TaxShield Ledger should support employees working under three supported work arrangements:

1. Full-time company office
1. Hybrid — company office + employee home
1. Fully remote — employee home
The initial product does **not** need to support customer-site work, business travel work locations, temporary worksites, or other third-party work locations.

The objective is to correctly determine payroll tax treatment when an employee's physical work location differs from their residence or changes between office and home during a payroll period.

---

## 1. Employee Residence

The employee's residence must be maintained independently from their work location.

Example:

Employee:

John Smith

Residence:

New Jersey

Residence Effective:

01/01/2026

Home Address:

NJ address

The system must maintain historical residence records because an employee may move during the tax year.

Example:

01/01/2026 – 06/30/2026

Residence: Pennsylvania

07/01/2026 – Present

Residence: New Jersey

The previous residence must remain attached to historical payroll records.

---

## 2. Company Work Location

The company can have one or more official employee work locations.

Example:

```text
Company
│
└── Main Office
```

## 123 Main Street

Downingtown, PA

Each company work location should have:

Location ID

Location Name

Address

City

State

ZIP

County

Local Jurisdiction

Effective From

Effective To

The location is used as the employee's work location when the employee works at the company office.

---

## 3. Employee Home Work Location

The employee's home should be treated as a potential work location when the employee is remote.

Example:

Employee Home

Address:

## 123 Main Street

New Jersey

Work Location Type:

EMPLOYEE_HOME

The system should resolve the applicable jurisdiction from the home address.

The home location should have effective dates because the employee may move.

---

## 4. Three Supported Work Arrangements

### 4.1 Full-Time Office

Example:

Employee:

John

Residence:

NJ

Work Arrangement:

FULL_TIME_OFFICE

Work Location:

PA Company Office

Employee work pattern:

Monday     PA Office

Tuesday    PA Office

Wednesday  PA Office

Thursday   PA Office

Friday     PA Office

The employee's residence remains NJ, while the physical work location is PA.

The tax engine evaluates both locations and determines the applicable withholding and employer obligations using the relevant jurisdiction rules.

---

### 4.2 Hybrid Employee

Example:

Employee:

John

Residence:

NJ

Work Arrangement:

HYBRID

Company Office:

PA

Home:

NJ

Example weekly schedule:

Monday       PA Office

Tuesday      PA Office

Wednesday    NJ Home

Thursday     NJ Home

Friday       PA Office

The application therefore records:

PA Office:

## 3 days

NJ Home:

## 2 days

The payroll engine evaluates the applicable rules for the work performed in each jurisdiction.

---

### 4.3 Fully Remote Employee

Example:

Employee:

Mary

Residence:

NJ

Work Arrangement:

FULLY_REMOTE

Work Location:

NJ Home

Every workday:

Monday       NJ Home

Tuesday      NJ Home

Wednesday    NJ Home

Thursday     NJ Home

Friday       NJ Home

The company may be located in another state.

The payroll engine must therefore distinguish:

Company Location

≠

Employee Residence

=

Employee Work Location

and determine the applicable employer and employee obligations accordingly.

---

## 5. Work Location Calendar

The application should maintain a simple work-location calendar for each employee.

Example:

August 2026

Mon    Tue    Wed    Thu    Fri

Week 1  PA     PA     NJ     NJ     PA

Week 2  PA     PA     NJ     NJ     PA

Week 3  PA     PA     NJ     NJ     PA

Week 4  PA     PA     NJ     NJ     PA

The user should be able to define a recurring schedule instead of entering every day manually.

For example:

Hybrid Schedule

Monday       Office

Tuesday      Office

Wednesday    Home

Thursday     Home

Friday       Office

The system automatically generates the expected work-location calendar.

---

## 6. Work Location Exceptions

The employee should be able to record an exception to their normal schedule.

Example:

Normal schedule:

Monday       Office

Tuesday      Office

Wednesday    Home

Thursday     Home

Friday       Office

Exception:

08/26/2026

Normally Home

Actual: Office

The system records:

Expected Location:

HOME

Actual Location:

COMPANY_OFFICE

Reason:

Office meeting

Only these two locations are supported in the initial product:

EMPLOYEE_HOME

COMPANY_OFFICE

---

## 7. Employee Work Location History

Do not store only the employee's current work state.

Use an effective-dated history.

EmployeeWorkArrangement

Employee

Arrangement

Effective From

Effective To

Home Location

Company Location

Schedule

Example:

01/01/2026 – 05/31/2026

FULL_TIME_OFFICE

PA Office

06/01/2026 – Present

HYBRID

PA Office + NJ Home

This ensures historical payroll can always be reproduced.

---

## 8. Payroll Work Location Allocation

For every payroll period, TaxShield should determine the employee's expected and actual work location.

Example:

Payroll Period

08/17/2026 – 08/30/2026

Employee:

John Smith

PA Office:

## 6 workdays

NJ Home:

## 4 workdays

The payroll engine then passes this information to the jurisdiction engine.

Conceptually:

```text
Payroll
│
▼
Employee
│
├── Residence
│
├── Work Arrangement
│
└── Work Location Calendar
│
▼
Jurisdiction Engine
│
▼
Tax Rule Engine
│
▼
Payroll Calculation
```

---

## 9. Jurisdiction Engine

The jurisdiction engine should consider:

Employee Residence

+

Company Work Location

+

Actual Employee Work Location

+

Tax Year

+

Payroll Date

+

Employer Nexus

+

Applicable State Rules

It should return:

Employee Tax Jurisdictions

Employer Tax Jurisdictions

Applicable Withholding Rules

Applicable Payroll Taxes

Applicable Local Taxes

Required Filings

Required Registrations

---

## 10. Residence vs. Work Location

The system must explicitly distinguish:

**Residence**

Where the employee lives.

**Company Work Location**

Where the company operates its office.

**Actual Work Location**

Where the employee physically performs work on a particular workday.

For this product, actual work location has only two possible values:

COMPANY_OFFICE

EMPLOYEE_HOME

This is a critical distinction for remote and hybrid employees.

---

## 11. Example: NJ Employee / PA Company

Company:

PA LLC

Office:

PA

Employee:

Residence:

NJ

Employee arrangement:

Hybrid

Schedule:

Mon    PA Office

Tue    PA Office

Wed    NJ Home

Thu    NJ Home

Fri    PA Office

TaxShield should not simply assign:

Employee State = NJ

or:

Payroll State = PA

Instead, it should evaluate:

Residence:

NJ

Physical Work Location:

PA / NJ

Company:

PA

Work Arrangement:

Hybrid

Payroll Period:

Specific dates

Applicable tax rules:

Determined by jurisdiction engine

---

## 12. Multi-State Rule Resolution

The tax engine should never contain logic such as:

IF employee.state == "NJ"

THEN use NJ tax rate

Instead:

Employee

↓

Residence

↓

Work Location

↓

Employer Nexus

↓

Jurisdiction Resolver

↓

Tax Rules

↓

Calculation

This allows the same engine to support:

PA company + NJ employee

PA company + DE employee

PA company + MD employee

PA company + NY employee

CA company + AZ employee

TX company + remote employee

without creating separate payroll engines.

---

## 13. Employer Nexus

Employer nexus should remain separate from employee withholding.

For every state, maintain:

Company Nexus Profile

State

Nexus Status

Effective Date

Reason

Registration Status

Payroll Account

Unemployment Account

Other Required Accounts

Example:

PA

Nexus: YES

Registration: Active

NJ

Nexus: REVIEW REQUIRED

Registration: Pending

NY

Nexus: NO

The application should flag when an employee's remote work arrangement may require the company to review its obligations in another state.

---

## 14. Multi-State Employee Dashboard

Add a section to the employee profile:

EMPLOYEE TAX PROFILE

Residence

──────────────────

NJ

Company Work Location

──────────────────

PA

Work Arrangement

──────────────────

HYBRID

Weekly Schedule

──────────────────

Mon   PA Office

Tue   PA Office

Wed   NJ Home

Thu   NJ Home

Fri   PA Office

Tax Jurisdictions

──────────────────

PA   ✓

NJ   ✓

Compliance

──────────────────

PA Payroll      ✓

NJ Payroll      ⚠ Review

---

## 15. Payroll Preflight

Before payroll is finalized:

PAYROLL PREFLIGHT

Employee: John Smith

Residence:

NJ ✓

Work arrangement:

Hybrid ✓

Work schedule:

PA / NJ ✓

Jurisdiction resolution:

PA ✓

NJ ✓

Tax rules:

PA 2026 ✓

NJ 2026 ✓

Employer nexus:

NJ ⚠ Review Required

The system should prevent a silent incorrect payroll calculation.

---

## 16. No Customer/Travel Locations in Initial Scope

The initial product should explicitly exclude:

- Customer work locations
- Client sites
- Business travel work locations
- Temporary worksites
- Conferences
- Out-of-state business trips
- Mobile workers
- Multiple customer locations
The initial supported model is intentionally limited to:

```text
EMPLOYEE
│
┌─────────┴─────────┐
│                   │
HOME                 OFFICE
│                   │
Employee              Company
residence             location
```

This significantly reduces complexity while supporting the primary remote/hybrid use cases.

---

## 17. Future Expansion

The data model should not prevent future work-location types.

For example, later versions could add:

CUSTOMER_SITE

TEMPORARY_SITE

TRAVEL

OTHER

But those should not be implemented in the initial product.

The initial jurisdiction engine should only need to resolve:

Employee Home

OR

Company Office

---

## 18. Revised Core Model

The simplified model becomes:

```text
Company
│
├── Company Locations
│
├── Tax Years
│
├── Employees
│     │
│     ├── Residence History
│     ├── Work Arrangement History
│     ├── Work Schedule
│     └── Work Location Calendar
│
├── Payroll
│
├── Expenses
│
├── Mileage
│
├── Reimbursements
│
└── Nexus Profiles
```

```text
Tax Rules
│
├── Federal
├── State
└── Local
```

```text
Jurisdiction Engine
│
├── Residence Resolver
├── Work Location Resolver
├── Employer Nexus Resolver
├── Reciprocity Resolver
└── Tax Rule Resolver
```

---

## 19. Final Product Rule

For the initial version, every employee workday must resolve to exactly one of:

EMPLOYEE_HOME

COMPANY_OFFICE

The system then determines the applicable tax jurisdictions from:

Employee Residence

+

Actual Work Location

+

Company Location

+

Employer Nexus

+

Tax Year

+

Effective Date

This gives TaxShield Ledger the multi-state capability you want without introducing unnecessary customer-site or travel complexity.

The key design principle remains:

**Never hardcode the tax state, tax rate, or tax treatment. Determine the applicable jurisdiction and retrieve the correct versioned rules for that jurisdiction and date.**

You're right. The **Timesheet module is a critical missing piece**, especially because your simplified employee-location model depends on knowing **where and when an employee worked**.

I would make **Timesheet a first-class core module**, not just a payroll sub-feature.

**Where it fits**

The core flow should become:

**Employee → Timesheet → Work Location → Payroll → Jurisdiction → Tax Rules → Calculation → Compliance**

And for your initial scope:

- **One company office only**
- Employee home
- Company office
- No branches
- No customer sites
- No travel work locations in V1
**Revised Timesheet Module**

**Timesheet**

Each employee records:

- Work date
- Start time
- End time
- Breaks
- Total hours
- Work location
  - COMPANY_OFFICE
  - EMPLOYEE_HOME
- Regular hours
- Overtime hours
- PTO
- Holiday
- Sick time
- Unpaid time
- Notes
- Employee confirmation
- Manager/owner approval
- Modification history
Example:

| **Date** | **Start** | **End** | **Break** | **Hours** | **Location** |
| --- | --- | --- | --- | --- | --- |
| Mon 8/24 | 9:00 AM | 5:00 PM | 1 hr | 7 | Company Office |
| Tue 8/25 | 9:00 AM | 5:00 PM | 1 hr | 7 | Company Office |
| Wed 8/26 | 9:00 AM | 5:00 PM | 1 hr | 7 | Employee Home |
| Thu 8/27 | 9:00 AM | 5:00 PM | 1 hr | 7 | Employee Home |
| Fri 8/28 | 9:00 AM | 5:00 PM | 1 hr | 7 | Company Office |

**Weekly total: 35 hours**

---

**Timesheet should drive payroll**

Instead of:

Payroll → ask where employee worked

use:

```text
TIMESHEET
│
├── Hours
├── Work date
├── Work location
└── Employee
│
▼
WORK LOCATION RESOLVER
│
▼
JURISDICTION RESOLVER
│
▼
TAX RULE ENGINE
│
▼
PAYROLL CALCULATION
│
▼
CALCULATION SNAPSHOT
This is much cleaner.
Example
John's biweekly timesheet:
PA Company Office: 56 hours
NJ Employee Home: 14 hours
Total:             70 hours
```

The payroll engine receives the **actual worked hours by jurisdiction** rather than trying to infer them from a generic employee state.

---

**Timesheet + Recurring Schedule**

The employee should not have to enter every work location manually.

Employee profile:

**Work Arrangement: HYBRID**

Monday       Company Office

Tuesday      Company Office

Wednesday    Employee Home

Thursday     Employee Home

Friday       Company Office

TaxShield generates the expected timesheet.

Then the employee simply confirms it.

**Exception**

Expected:

Wednesday → Employee Home

Actual:

Wednesday → Company Office

The employee changes the location and optionally enters:

"Office meeting"

The system records this as an **exception**, rather than changing the recurring schedule.

---

**Timesheet Approval Workflow**

Expected Schedule

↓

Generated Timesheet

↓

Employee Review

↓

Employee Submit

↓

Owner/Manager Review

↓

Approved

↓

Payroll

For a 1–5 employee LLC, keep this extremely simple.

The owner should be able to click:

**Approve Week**

rather than managing complicated timesheet workflows.

---

**Timesheet Status**

Each timesheet should have:

DRAFT

↓

SUBMITTED

↓

APPROVED

↓

LOCKED

Once payroll is processed:

LOCKED

A correction should **never overwrite the original timesheet**.

Instead:

Original Timesheet

↓

Correction Requested

↓

Correction Approved

↓

Payroll Adjustment

---

**Timesheet → Payroll Preflight**

Before payroll runs:

**Payroll Preflight**

**John Smith**

| **Check** | **Status** |
| --- | --- |
| Timesheet submitted | ✓ |
| Timesheet approved | ✓ |
| Hours complete | ✓ |
| Work locations complete | ✓ |
| Residence current | ✓ |
| PA rules available | ✓ |
| NJ rules available | ✓ |
| Jurisdiction resolved | ✓ |
| Employer nexus reviewed | ⚠ |
| Payroll ready | **Review Required** |

This is an important safety mechanism.

**Payroll should not silently calculate from incomplete timesheets.**

---

**Timesheet → Jurisdiction Allocation**

This is the key architectural relationship:

```text
Employee
│
├── Residence History
│
└── Work Arrangement
│
▼
Timesheet
│
├── Date
├── Hours
└── Location
│
┌───────┴───────┐
▼               ▼
COMPANY_OFFICE   EMPLOYEE_HOME
│               │
└───────┬───────┘
▼
Jurisdiction Resolver
│
▼
Tax Rules
│
▼
Payroll
```

That makes the **timesheet the factual source of where the employee actually worked**.

---

**Timesheet and Payroll Calculation Snapshot**

The calculation snapshot should preserve the timesheet inputs.

For example:

PAYROLL RUN

PAY-2026-0088

Employee:

EMP-00042

Pay Period:

08/17/2026 – 08/30/2026

Total Hours:

70

Work Location Allocation:

PA Company Office

## 56 hours

NJ Employee Home

## 14 hours

Residence:

NJ

Work Arrangement:

HYBRID

Jurisdiction Decision:

PA / NJ

Tax Rules:

PA-WITHHOLDING-2026-v4

NJ-WITHHOLDING-2026-v2

Calculation:

...

Status:

LOCKED

Now an auditor can ask:

"Why did TaxShield allocate these wages between PA and NJ?"

and the answer is traceable all the way back to the **approved timesheet**.

---

**Timesheet Module Should Also Handle PTO**

I would include basic time-off functionality in V1:

REGULAR

OVERTIME

PTO

SICK

HOLIDAY

UNPAID

But don't build a sophisticated HR/benefits system.

The goal is simply to provide enough time information for payroll.

---

**Revised Core Product Architecture**

I would now structure TaxShield around these major modules:

```text
TAXSHIELD LEDGER
│
┌───────────────────┼───────────────────┐
│                   │                   │
MONEY               PEOPLE             TAX
│                   │                   │
├─ Expenses         ├─ Employees        ├─ Tax Rules
├─ Mileage          ├─ Timesheets       ├─ Jurisdictions
├─ Reimbursements   ├─ PTO              ├─ Nexus
└─ Ledger           └─ Work Locations   └─ Compliance
│                   │                   │
└───────────────────┼───────────────────┘
│
PAYROLL ENGINE
│
CALCULATION
│
AUDIT EVIDENCE
│
YEAR-END PACKAGE
One-office constraint
The company structure should explicitly be:
COMPANY
│
└── PRIMARY / ONLY OFFICE
│
└── Company Office Location
```

**Do not introduce** **CompanyLocations****[****] or multi-branch concepts into V1.**

Instead:

```text
Company
└── Office
├── Address
├── State
├── County
├── Local Jurisdiction
└── Effective Dates
```

Employees then have two possible physical work locations:

```text
EMPLOYEE
│
├── COMPANY_OFFICE
│
└── EMPLOYEE_HOME
```

That gives you the simplicity you want while keeping the underlying jurisdiction engine extensible.

**So** **I would make Timesheet one of the six V1 pillars:**

1. **Company / Tax Year**
1. **Employees**
1. **Timesheets + Work Location**
1. **Expenses + Receipts**
1. **Mileage + Reimbursements**
1. **Payroll + Tax Rules + Compliance**
And the most important V1 data relationship becomes:

**Employee + Date + Timesheet + Hours + Work Location → Jurisdiction → Tax Rules → Payroll Calculation → Audit Trail**

That is a much stronger architecture than treating timesheets as an afterthought.

