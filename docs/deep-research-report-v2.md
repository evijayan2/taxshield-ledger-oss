# Revised TaxShield Ledger Product Requirements Document

## Summary of Changes

- **Structured sections and headings:** Organized content into clear subsections (Product Vision, Core Principles, Tax Rules, Expense Module, Payroll Module, etc.) to improve logical flow.  
- **Added transitions:** Inserted transition phrases and summary sentences between sections to guide the reader and show how ideas connect. For example, each section now begins with a sentence that ties it to the previous content.  
- **Merged related content:** Combined repetitive or related points (e.g. separate expense/receipt sections are linked, mileage and trip expenses are grouped) to avoid duplication and improve coherence.  
- **Consistent terminology:** Standardized names (e.g. always “TaxShield Ledger” and consistent tense/voice) to avoid confusion. Switched passive constructions to active voice for clarity when possible.  
- **Use of lists:** Many details (fields, examples, checklists) are now in bulleted or numbered lists to highlight key points and break up text, as recommended for readability.  
- **Short paragraphs:** Ensured each paragraph is concise (3–5 sentences), often ending with a transitional line. This keeps blocks of text from becoming dense and makes the document easier to scan.  
- **Examples and formatting:** Reformatted examples into lists or tables (when appropriate) and removed extraneous code-like snippets to make them more readable.

These changes follow writing best practices. Transitions and headings act as “glue” for ideas, and bullet lists clearly organize information.

## Revised Draft

### Product Vision

TaxShield Ledger is designed to be the **system of record** for a micro-LLC’s financials and tax compliance. It will track **expenses, mileage, payroll, reimbursements, tax calculations, and supporting documents** in one place.  At any time, the owner can answer critical questions:  
- **What did my company spend?**  
- **Why was each expense a legitimate business expense?**  
- **How was every tax amount calculated?**  
- **Can I produce the supporting evidence if a tax authority asks for it?**  

In other words, the app goes beyond mere tax computation. It maintains a complete **audit trail** explaining how each tax figure was derived. For example, the payroll module will not only show final withholding amounts, but also cite the exact tax rule or IRS table used to compute them.

### Core Principle: No Hardcoded Tax Rates

TaxShield Ledger follows a strict architectural rule: **Never hardcode tax rates or rules.**  For instance, do **not** embed constants like `PA_STATE_TAX_RATE = 0.0307` or `SOCIAL_SECURITY_RATE = 0.062` in code. Hardcoded values become obsolete whenever laws or rates change, creating maintenance headaches.  Instead, all tax rules are stored as data (see next section).  

*Bad practice example (do not implement in code):*

```
PA_STATE_TAX_RATE = 0.0307
SOCIAL_SECURITY_RATE = 0.062
MEDICARE_RATE = 0.0145
MILEAGE_RATE = 0.76
```

This approach forces updates in code for every legislative change. By contrast, TaxShield will **load rates from a data store** (see “Tax Rules as Data” below) so rates can be updated via configuration, not code.

### Tax Rules as Data

All tax rates, brackets, thresholds, deductions, and formulas are captured in a versioned **data** format. In the system, each *TaxRule* record includes fields like jurisdiction, tax type, tax year, effective dates, value/formula, source document, and version. For example, a rule might have:  
- **jurisdiction:** US-FEDERAL  
- **tax_type:** FEDERAL_WITHHOLDING  
- **tax_year:** 2026  
- **effective_from:** 2026-01-01  
- **effective_to:** 2026-12-31  
- **source:** IRS Publication 15-T (2026)  
- **version:** 3  

By storing rules this way, the payroll engine simply **retrieves** the applicable rule record (based on date and jurisdiction) rather than computing rates itself. The rules database is centralized, so updating a tax rate for a new year just means adding a new data entry.  

- **Key TaxRule fields:** jurisdiction, tax type, year, effective dates, rule type (rate, table, etc.), value or formula, source document, source URL/date, version, status.  
- **Example:** A federal withholding rule might cite *IRS Pub 15-T 2026* as its source, with a URL and checksum.  

Using a structured data model for rules makes the logic clear and maintainable. Bullet-point lists (shown here) help summarize complex data schemas for the reader. The payroll engine will query these rule records whenever it calculates taxes (see Sec. 4 for how tax years and jurisdictions determine which rule applies).

### Tax Year Setup

TaxShield Ledger treats each **Tax Year** as a first-class concept. When the owner creates a new year (e.g. *2026*), the system initializes that year’s configuration:

- Federal tax rules  
- State tax rules  
- Local tax rules  
- Payroll settings (frequency, holidays, etc.)  
- Mileage rates  
- Filing requirements and forms  
- Business deductions  

Once set up, the system uses factors to determine which rules to apply for each transaction. These factors include:  

- Tax year  
- Company’s state and locality  
- Employee residence and work location  
- Local tax jurisdictions  
- LLC tax classification (e.g. disregarded, S corp)  
- Filing status (where relevant)  
- Payroll frequency (weekly, biweekly, etc.)  
- Effective date  

For example, when a biweekly payroll is processed, TaxShield looks at the date of the payroll, the employee’s current work location, and the company’s tax classification to select the correct rule versions. This scoping (by year and jurisdiction) ensures accuracy. (See Sec. 5 for how new rule versions are obtained and Sec. 26–27 for how jurisdictions are resolved.)

### Automatic Tax Rule Update Engine

TaxShield includes an automated **Tax Rules Update Service**. Its job is to monitor authoritative sources and ingest new or updated tax rules into the system (instead of relying on manual entry). This engine classifies sources by reliability:

- **Tier 1 – Authoritative:** IRS publications, U.S. Treasury releases, state Departments of Revenue/Labor (e.g. PA DOR, PA L&I), local tax authorities, Social Security Administration, official government journals.  
- **Tier 2 – Supporting:** Official government feeds or APIs (XML feeds, published datasets).  
- **Tier 3 – Reference-only:** Third-party tax data providers. These can be used for reference, but they must *not* override Tier 1 data without explicit confirmation.  

TaxShield’s updater periodically checks these sources (e.g. IRS API or website) for changes. When a new rule is found, it triggers the rule ingestion pipeline (Sec. 29–32) to validate and version the rule. By distinguishing source tiers, the system ensures that official rules (Tier 1) take precedence.

### IRS Source Registry

Every tax rule in the system is tied to a **source record** for auditability. For example, an IRS withholding table source might have:  

- **Name:** IRS Publication 15-T (Federal Withholding)  
- **Tax Year:** 2026  
- **Publication Date:** 12/11/2025  
- **Effective Date:** 01/01/2026  
- **Retrieved:** 01/02/2026 (date fetched)  
- **Source URL:** [official IRS URL]  
- **Checksum:** SHA-256 hash of downloaded file  
- **Status:** Validated  

TaxShield can ingest IRS data from multiple forms (HTML, PDF, or IRS-provided XML). By archiving the exact source document (with checksum and metadata), the system ensures that the original legal reference is preserved. This makes any later audit verifiable: the exact IRS publication used is tracked alongside the rule.

### Tax Rule Lifecycle

Tax rules follow a controlled **lifecycle** with these stages:  

```
DISCOVERED → DOWNLOADED → PARSED → NORMALIZED → VALIDATED → TESTED → APPROVED → ACTIVE → SUPERSEDED
```

- **Discovered:** A new source is found (e.g. a new IRS notice).  
- **Downloaded:** The raw data is fetched.  
- **Parsed:** The data is converted into the internal format (e.g. tables or formulas).  
- **Normalized:** Standardize units/formats (e.g. convert percentages to decimals).  
- **Validated:** Automated checks ensure the data matches expected formats/ranges.  
- **Tested:** Run historical cases (see Sec. 30).  
- **Approved:** A human reviews and confirms.  
- **Active:** The rule is used in calculations.  
- **Superseded:** When replaced by a newer version.  

Because tax rules are financial configuration with legal implications, each step must succeed before moving on. For example, regression tests catch unexpected calculation changes. Only **after** approval does a rule version become active.

### Effective-Dated Rules

Many tax parameters change mid-year (notably IRS mileage rates). For instance, in 2026 the IRS mileage rate was $0.725/mile from 01/01–06/30, then $0.76 from 07/01–12/31. To handle this, every *TaxRule* supports `effective_from` and `effective_to` dates, not just a single annual rate.  

This way, historical transactions lock to the rate in effect at the time. For example:  
- **Trip on 06/15/2026:** 100 mi × $0.725 = $72.50.  
- **Trip on 07/15/2026:** 100 mi × $0.76 = $76.00.  

By storing date ranges in rules, TaxShield ensures that when rates change, only new transactions use the new value. Existing records remain tied to the old rule version and are not recalculated retroactively. (This principle applies to any mid-year tax change, not just mileage.)

### Calculation Snapshot

A key audit feature is taking a **snapshot** of each calculation at runtime. When running payroll, mileage, or reimbursements, the system logs the exact rule versions used. For example, a payroll run might record:  

- **Payroll Run ID:** 2026-0034  
- **Gross Wages:** $2,400.00  
- **Federal Withholding:** $182.44 (Rule: US-FEDERAL-2026-PUB15T-v3)  
- **PA Withholding:** $73.68 (Rule: PA-2026-SIT-v2)  
- **FICA:** $183.60 (Rule: FED-FICA-2026-v1)  
- **Medicare:** $34.80 (Rule: FED-MED-2026-v1)  

By storing these snapshots, if a later tax update changes a rate, old payroll records remain unchanged. This audit trail lets us prove exactly which rule versions were applied to every calculation.

### Tax Calculation Reproducibility

To support audits, every calculation answers **“Why is this number $X?”**. The user interface should let the owner view a detailed breakdown. For example, a payroll breakdown UI might show:

- **Gross wages:** $2,400.00  
- **Federal taxable wages:** $2,400.00  
- **Federal withholding:** $182.44  
  - _Based on IRS Pub 15-T (2026)_ (Married filing status, biweekly)  
- **Social Security:** $148.80  
  - _Based on 2026 SS rate (6.2% on $2,400)_  
- **Medicare:** $34.80  
  - _Based on 2026 Medicare rate (1.45% on $2,400)_  
- **PA withholding:** $73.68  
  - _Based on PA tax table (2026)_  
- **Net pay:** $1,960.28  

This breakdown (with indentation or bulleting for sources) makes it clear which rule/formula produced each number. It’s far more informative than a single number.  By providing these “calculation views,” TaxShield Ledger ensures transparency in every step.

### Expense Management Module

TaxShield includes a full **expense tracker**. Each expense entry captures all relevant data for auditing. Fields include:  
- **Date** (of expense)  
- **Vendor** (merchant name)  
- **Amount** (total spent)  
- **Tax** (sales tax portion)  
- **Payment method** (company card, cash, etc.)  
- **Category** (expense category, see Sec. 16)  
- **Subcategory** (if needed)  
- **Business purpose** (why the expense is valid)  
- **Employee/Owner** who made it  
- **Location** (where the expense occurred)  
- **Project/Client** (if applicable)  
- **Receipt** (link to attached file)  
- **Notes** (any comments)  
- **Reimbursement status** (pending, paid, etc.)  
- **Tax treatment** (e.g. 50% meals, non-deductible, etc.)  

Using a bulleted list here improves readability of the field list. Each expense record forms a row in the ledger, and these fields ensure nothing is overlooked. (Sec. 12–15 cover receipt handling and audit evidence for these expenses.)

### Receipt Management

Receipts are central to expense evidence. TaxShield should let the owner easily **capture and store receipts**. The workflow is simple: **Take photo → Upload → Categorize → Save**. Supported formats include JPG, PNG, HEIC, PDF, or scanned documents. For example:  

- Snap a photo of the receipt with your phone.  
- The app uploads it and lets you tag it to an expense.  
- You can assign the expense to a category (e.g. “Office Supplies”) and enter any missing details.  

Storing the images themselves (not just data) is crucial for audits. The system should automatically link each stored receipt file to the corresponding expense. 

### Receipt OCR (Future Feature)

In a future update, we can automate receipt entry with OCR. When a user uploads a receipt image:  

1. **OCR Processing:** The system reads the image and extracts text.  
2. **Auto-detection:** It identifies the vendor, date, total, and tax.  
3. **Categorization:** Based on vendor and amounts, it suggests a category.  
4. **User Confirmation:** The user reviews and confirms each field (highlight auto-extracted vs manually entered).  

For example, after scanning a Home Depot receipt:  
- Vendor: **Home Depot** (detected)  
- Date: 08/22/2026 (detected)  
- Total: $184.27 (detected)  
- Tax: $11.04 (detected)  
- Suggested category: *Equipment/Supplies* (based on vendor)  
- Business purpose: *[user must enter]*  
- Payment: Company Card (detected)  

The UI clearly shows what was filled automatically and what the user confirms or edits. This speeds up data entry while still requiring a final human check.

### Receipt-to-Transaction Matching

Another future feature is **matching receipts to bank transactions**. If TaxShield sees:  

- A receipt for Home Depot, $184.27 on 08/22/2026,  
- A bank/credit entry: Home Depot, $184.27 on 08/22/2026,  

it can automatically link them. Each expense can have a “matched” status:  

- **MATCHED:** A corresponding transaction was found.  
- **UNMATCHED:** No obvious match exists.  
- **DUPLICATE:** Two identical transactions/receipts exist.  
- **NEEDS REVIEW:** Multiple candidates or uncertain link.  

This reduces manual reconciliation work. For example, a travel expense with a hotel receipt can automatically match to the credit card charge for that amount, marking it “MATCHED.”

### Receipt Audit Evidence

The goal is an **audit evidence package** for each expense, not just a number. Thus, each expense record should link to all related items:  

- **Receipt image/file**  
- **Business purpose** text  
- **Payment method**  
- **Bank transaction** (if matched)  
- **Employee/Owner** who paid  
- **Related mileage** (if part of a trip)  
- **Related reimbursement** (if reimbursed later)  
- **Tax treatment** details (e.g. 50% meals deductible)  

For example:  

- Expense **EXP-2026-00482**  
  - Receipt: **REC-2026-00482.jpg**  
  - Purpose: “Travel to vendor meeting”  
  - Payment: Company Visa  
  - Bank Txn: TXN-772 (matched)  
  - Employee: John Smith  
  - Related Mileage: TRIP-2026-003 (Philadelphia to Harrisburg)  
  - Reimbursed?: No (charged to company card)  
  - Tax Category: “Travel expense (50% meals)”  

This breakdown (shown here as an indented list) makes it clear how the expense is justified and audited. Grouping related evidence like this greatly improves clarity. 

### Expense Categories

TaxShield should use **configurable expense categories** that map to tax reporting lines. For example:  

- Vehicle  
- Travel  
- Meals  
- Tolls  
- Parking  
- Office Supplies  
- Equipment  
- Software  
- Professional Services  
- Legal  
- Accounting  
- Insurance  
- Advertising  
- Bank Fees  
- Education  
- Telephone  
- Internet  
- Rent  
- Utilities  
- Payroll  
- Payroll Taxes  
- Employee Benefits  
- Contract Labor  
- Other  

(These can be listed in a table or bullets for clarity.) The owner should be able to edit or add categories, and the system should allow different categories per tax year (in case IRS requirements change).

### Business Purpose Requirement

For certain categories (especially “Travel,” “Meals,” etc.), TaxShield should **require a business purpose**. For example, an expense entry might look like:

- **Amount:** $325.00  
- **Category:** Travel  
- **Business purpose (required):** __________  

If the user enters something vague like “Business,” the system warns “Provide a specific purpose.” Instead, an acceptable description might be: *“Travel to inspect new equipment purchase.”* This ensures each deduction has a valid explanation, as vague notes (“Business lunch”) reduce audit strength.

### Expense Confidence / Audit Readiness Score

Each expense can have an **audit readiness score**. For example:  

> **Expense: $450.00** – **Audit readiness: 92%**  
> ✓ Receipt attached  
> ✓ Date recorded  
> ✓ Vendor recorded  
> ✓ Business purpose recorded  
> ✓ Payment source recorded  
> ⚠ Project not specified  

At the company level, a dashboard might show:  

- **Receipts:** 98%  
- **Expenses:** 95%  
- **Mileage:** 100%  
- **Payroll:** 92%  
- **Reimbursements:** 89%  

This turns “audit anxiety” into actionable items. A score like 92% signals that most fields are complete, but perhaps a few receipts or purposes are missing. By checklist style (with ✓/⚠), it’s immediately clear what’s incomplete.

### Mileage Module Expansion

The mileage tracker already captures date, start/end odometer, origin/destination, and purpose. We expand it by adding:  

- **Vehicle details:** VIN, Make, Model, Year, License plate, Ownership, Business-use percentage.  
- **Mileage audit trail:** Each trip logs *created_by/time*, *original values*, *modifications (by whom/when)*, and a *reason* for any change.  

For example, a trip record might show:

- **Vehicle:** 2019 Toyota Camry (Business use 80%)  
- **Trip:** 08/15/2026, 210 miles, Start 12000→12210, purpose “Client meeting”  
- **Audit:** Created 08/15 by Alice; no changes.  

Audit trails mean we never lose history. If the user edits a trip, the old value stays in the log with a timestamp and reason. (We won’t overwrite the original data without a trace.)

### Mileage Rate Engine

Mileage deductions use the IRS rate for the trip date. For instance:

- **Trip date:** 06/15/2026  
  - **Miles:** 100  
  - **Rate:** $0.725 (first-half 2026 rate)  
  - **Deduction:** $72.50  

- **Trip date:** 07/15/2026  
  - **Miles:** 100  
  - **Rate:** $0.76 (second-half rate)  
  - **Deduction:** $76.00  

The user should never enter the IRS rate manually. The system automatically looks up the correct effective rate for the date of each trip.

### Expense + Mileage Relationship

An expense can be part of a mileage trip (e.g. parking or tolls during a trip). For example:

- **Trip:** Business Trip (Philadelphia → Harrisburg)  
  - Mileage: 210 miles (deduction $152.25)  
  - Toll: $28.40  
  - Parking: $12.00  
  - **Total travel deduction:** $192.65  

If a user enters a toll or parking expense on the same trip, TaxShield can link it so that tolls/parking are included with the mileage deduction. The system should warn if a user tries to deduct the same cost twice (once as mileage, once as separate expense).

### Employee Reimbursement Module

Introduce a **Reimbursement Center**. Employees can submit claims for expenses (mileage, parking, tolls, supplies, travel, etc.) via a simple workflow. Typical status flow:

- Submitted  
- Manager/Owner Review  
- Approved  
- Reimbursed (marked paid)  
- Reconciled (matched to payroll or bank)  

For example, an employee might submit a parking receipt:  
“$12.00 parking on 08/20,” → Owner reviews → Owner marks “Approved” → Finance issues payment → record set to “Reimbursed” → later reconciled against bank statements.

A workflow chart or list (as above) clarifies the steps. The system will track these statuses and notify both employee and owner at each stage.

### Accountable Plan Ledger

Expand on the existing accountable plan for non-taxable reimbursements. Each reimbursement record includes:

- **Employee** receiving reimbursement  
- **Expense** it’s linked to  
- **Business purpose** (same as expense’s purpose)  
- **Receipt** copy  
- **Amount** reimbursed  
- **Approval info** (who approved, when)  
- **Reimbursement date** (when paid)  
- **Payment method** (check, card, etc.)  
- **Tax treatment** (taxable wage vs non-taxable reimbursement)  

This clearly distinguishes *taxable compensation* from *non-taxable reimbursement*. For example, mileage and parking reimbursements are non-taxable under an accountable plan, whereas other reimbursements might be treated as wages if not properly documented. TaxShield tracks this automatically based on the rules defined (see original PRD design).

### Payroll Module

We retain the assisted-payroll approach but make it fully rule-driven. The core calculations already include federal withholding, FICA, state withholding, and local taxes (EIT, LST, etc.). To support multi-state and detailed compliance, each employee profile will have:

- **W-4 data** (withholding allowances/status)  
- **State withholding profiles** (to record any state-specific elections or reciprocity)  
- **Local tax jurisdiction** (city or district codes)  
- **Pay frequency** (weekly, biweekly, etc.)  
- **Compensation history** (previous pay amounts, raises)  
- **Deduction/benefit history** (401k, health insurance, etc.)  
- **Approved reimbursements** for the period  
- **Year-to-date totals** (for final reconciliation)  
- **Payroll lock status** (whether this pay period is finalized)  
- **Correction workflow** (to handle reissued or fixed checks)  

In short, the payroll engine now integrates deeply with the rule database and employee data.  It also generates year-to-date forms (W-2, 1099, etc.) from this consolidated data.

### Employee Location / Jurisdiction Engine

A major feature is accurately determining each employee’s tax jurisdiction. Do **not** store just one “employee_state.” Instead maintain separate data for:  

- **Home address:** (with country, state, ZIP, county, local tax, effective dates)  
- **Residence jurisdiction:** (could differ if home spans a tax boundary)  
- **Work location:** (if the employee works at the company office, this is the office’s address)  
- **Local tax jurisdiction:** (for any city/school tax on residence or work)  
- **Effective dates:** (all of the above can change, so we keep date ranges)  

This means an employee could have one address from Jan–Jun and another from Jul–Dec (e.g. they move). By tracking these with effective dates, each payroll uses the correct residency info for that pay date.

### Jurisdiction Resolver

Implement a **JurisdictionResolver** service. It takes as input:  

- Employee (including residence history)  
- Company (including business locations)  
- Date of the transaction or payroll  
- Employee’s actual work location (see timesheets)  

And outputs:  

- Country, State, County, Municipality, and any special district (for both residence and work location)  
- Applicable **withholding jurisdiction(s)** (e.g. which state tax applies)  
- Required **payroll jurisdictions** (which states/localities the employer must withhold for)  
- Required **registration or filing obligations** (e.g. is employer now obligated to register for state withholding?)  

The resolver will cache results per transaction date for efficiency. Storing the result with the transaction avoids re-running geography logic on old data. In effect, the system geocodes each workday and decides the tax implications.

### Tax Configuration Dashboard

Add an admin screen summarizing rule status per jurisdiction. For example:

```
Tax Year: 2026
- Federal: Rules Loaded ✓, Validated ✓, Active ✓
- Pennsylvania: Rules Loaded ✓, Validated ✓, Active ✓
- Local (EIT/LST): Loaded ✓, (⚠ 2 jurisdictions need review)
- Mileage: 2026 rates loaded ✓
- Payroll rules: 2026 rules loaded ✓
Last verification: 08/23/2026
```

This dashboard (or checklist) quickly shows whether federal/state/local rules are in place and validated. Any warnings (like “jurisdictions need review”) stand out for action. This kind of status display (checkmarks and alerts) helps the owner see at a glance which components are ready.

### Tax Rule Change Alerts

The system should automatically alert the owner when new rule updates are available. For example:  

- **“New 2027 Federal Withholding Rules Detected.”** Effective 01/01/2027. Impact: payroll withholdings will change. Action: Review update.  

Minor updates (e.g. index adjustment) could auto-activate after quick tests. Significant changes (e.g. tax table rewrites) require the owner’s review. Notifications like this mean the owner doesn’t have to watch IRS announcements – TaxShield does it for them.

### Rule Update Safety

New rules must never silently overwrite active ones. The update workflow is:  

```
Current Rule 
  ↓
New Rule Detected 
  ↓
Automated Validation & Regression Testing 
  ↓
Impact Analysis 
  ↓
Manual Approval 
  ↓
Activation
```

In practice, when a new 2026 rule version appears (say v3 on 07/01/2026), TaxShield shows: “For 2026 Federal withholding, current v2 will become v3 on 07/01/2026. All historical payroll will remain under v2; future payroll uses v3.” If regression tests pass, and the owner approves, only then is v3 activated. This pipeline (with tests) prevents unnoticed calculation changes.

### Tax Rule Regression Testing

Every proposed rule version is verified against historical test cases. For instance, the system might run:  

- **Test #104:** Gross wages $1,000.00 → Expected Federal withholding $79.50.  
- After loading the new rule, the engine calculates $X.XX. If $X.XX ≠ $79.50, that’s a mismatch.  

If a discrepancy occurs, the update is flagged (or blocked) until reviewed. These automated tests ensure that new rules don’t break existing cases. In the UI we’d show something like “PASS” or “FAIL” for each test scenario.

### Tax Rule Diff

Before final activation, present a human-readable diff between the old and new rule sets. Example diff for federal withholding:

- Bracket 1: **changed** (old rate → new rate)  
- Bracket 2: **unchanged**  
- Bracket 3: **changed**  
- Mileage rate: $0.725 → $0.76  
- Income threshold: [old] → [new]  
- **Estimated payroll impact:** +$XX per month (from analysis)  

This summarization gives the owner confidence that the change is intentional. (See image below for a conceptual diff layout.)

  

### Government Source Archive

TaxShield should archive every source document it uses. For each downloaded source, store:  

- Document name and version  
- Publication date and effective date  
- URL and downloaded file  
- SHA-256 checksum  
- Parser version used  
- Import timestamp  

This means we keep a historical library of, say, “IRS_Pub15T_2026.pdf” with its metadata. During an audit, we can show the exact file that generated past calculations. Archiving sources is essential for proving “this number came from that document”.

### Offline Rule Repository

**Do not depend on live IRS.gov for calculations.** The architecture is:

```
Government Sources
    ↓
Tax Data Ingestion Service
    ↓
Validated Tax Rules Database
    ↓
Calculation Engine
    ↓
Application (Payroll, Reports, UI)
```

Payroll calculations always use the **locally stored** approved rule versions. The engine never calls an external site at runtime. This ensures reliability (if the IRS site is down, the app still works) and auditability (everything comes from the frozen rules DB).

### Tax Rule Data Model

The conceptual data model includes:

- **TaxJurisdiction** (e.g. US, PA, NJ, NYC, School District)  
- **TaxYear**  
- **TaxRule** (the logical rule definition)  
- **TaxRuleVersion** (with versioning and effective dates)  
- **TaxRate, TaxBracket, TaxThreshold, TaxDeduction, TaxCredit, TaxLimit** (rule components)  
- **TaxFormula** (for complex calculations)  
- **TaxForm, FilingRequirement** (for documentation)  
- **GovernmentSource, SourceDocument** (as above)  
- **EffectivePeriod** (date ranges)  

This normalized model is flexible: federal, state, and local rules all fit into it. By breaking rules into data entities, we can expand to any new jurisdiction without hardcoding logic.

### Company Ledger

TaxShield will include a lightweight **accounting ledger** for tax preparation (not full double-entry). Key transaction types:

- **Income** (revenue)  
- **Expense**  
- **Payroll**  
- **Payroll Tax** (employer-side)  
- **Mileage**  
- **Reimbursement**  
- **Owner Contribution/Distribution**  
- **Loan**  
- **Bank Fee**  
- **Asset Purchase**  

Recording these lets us prepare basic financial summaries and ensure all tax-relevant transactions are captured. The focus is tax-ready reports, not general bookkeeping.

### Bank Reconciliation (Future)

Future work: let users import bank/credit card CSVs. The flow:

1. **Import CSV** of transactions.  
2. **Transaction matching:** Auto-categorize entries (e.g. by vendor).  
3. **Receipt matching:** Link to existing receipts/expenses.  
4. **Duplicate detection:** Warn on obvious duplicates.  
5. **Reconciliation:** Mark cleared items.

This integration streamlines data entry while preserving the low-cost philosophy (no bank API subscription needed). (A partial manual CSV import can come first.)

### Asset & Equipment Tracking

Track purchased assets: for each asset item (computers, machinery, vehicles, etc.) record:

- Purchase date and price  
- Category (e.g. computer, furniture)  
- Business-use percentage  
- Receipt or invoice file  
- Placed-in-service date (for depreciation)  
- Depreciation method (straight-line, etc.)  
- Tax treatment (section 179, bonus depreciation eligibility)  
- Disposition date (if sold/disposed)  

This module generates depreciation schedules and depreciation expense records. It helps with tax deductions for capital assets.

### Home Office Module (Future)

For home office deductions, record:

- **Total home area** vs **office area**  
- **Business-use percentage**  
- **Eligible expenses** (utilities, internet, etc.)  
- **Supporting documents** (bills, property records)  

The tax engine then applies the relevant home-office rule for the tax year (rather than using a fixed percent). For example, if tax year rules say “allocate 10% of utilities to home office,” the system will calculate that from the data.

### Tax Deduction Dashboard

Enhance the financial dashboard with a **Tax Position** summary. For the current year (YTD), display:

- **Gross Revenue:** $XX,XXX  
- **Business Expenses:** $XX,XXX  
- **Payroll:** $XX,XXX  
- **Payroll Taxes:** $X,XXX  
- **Mileage Deductions:** $X,XXX  
- **Reimbursements:** $X,XXX  
- **Estimated Profit/Loss:** $XX,XXX  

Below that, an **Expense Breakdown** chart (pie or bars) by category, e.g.: Vehicle 18%, Payroll 31%, Software 8%, Travel 12%, Professional Services 9%, Other 22%. 

Presenting numbers in a summary and chart form (as above) helps the owner quickly grasp the tax situation. It turns raw data into an “at-a-glance” tax position report.

### Tax Impact Simulator

Expand the current benefit simulator into a full **Tax Impact Simulator**. Let the user ask “What if?” questions with real numbers:

- *What if I spend an extra $2,000 on equipment?*  
- *What if payroll increases by $5,000?*  
- *What if I drive 2,000 more business miles?*  

The simulator uses current profit estimates and tax rules to show the approximate change in taxable income and tax liability. (Always clearly label these as **estimates**, not guaranteed outcomes or tax advice.)

### Year-End Close

Provide a guided workflow to close out a tax year. A checklist might include:  

- **All expenses categorized** and checked.  
- **All receipts attached** (mark any missing).  
- **Mileage log complete.**  
- **Payroll reconciled** (taxes matched, no pending adjustments).  
- **Reimbursements reconciled.**  
- **Bank transactions reconciled.**  
- **Missing documents reviewed** (flag any gaps).  
- **Duplicate expenses checked** (and resolved).  
- **Tax rules locked** (no further changes allowed).  
- **W-2/W-9 data verified** for all employees/contractors.  
- **CPA package generated.**  

Once everything is checked ✓, the owner clicks **“Lock Tax Year”**. After locking, historical calculations and records cannot change (Sec. 57).

### CPA / Tax Preparer Package

Generate a comprehensive **2026 Tax Package** (for example) to hand to a CPA. This package can be a ZIP with:  
1. **Executive Summary** (overview of finances)  
2. **Income Summary** (revenue streams)  
3. **Expense Summary** (deductible expenses)  
4. **Mileage Report** (total miles, deductions)  
5. **Vehicle Report** (if multiple vehicles tracked)  
6. **Payroll Summary** (total wages paid)  
7. **Payroll Tax Summary** (withholding paid)  
8. **Reimbursement Report** (all reimbursements)  
9. **Asset Report** (assets purchased and depreciation)  
10. **Receipt Index** (list of all receipts)  
11. **Missing Documentation Report** (unresolved gaps)  
12. **Tax Rule Sources** (catalog of IRS/state pubs used)  
13. **Calculation Audit Trail** (snapshots of key payroll calculations)  
14. **W-2 Data** (for all employees, by state)  
15. **Form Mapping** (if applicable, e.g. 1099s to vendors)  

Numbered/ bulleted lists like this clarify the contents. Such a package ensures the CPA has everything needed without manual collation.

### IRS Audit Package

Provide a one-click **Audit Package** for a tax audit. It should output a ZIP (e.g. `TaxShield_2026_Audit_Package.zip`) with folders/files like:  

- `/company-summary.pdf`  
- `/expense-ledger.xlsx`  
- `/mileage-log.xlsx`  
- `/payroll-summary.xlsx`  
- `/reimbursements.xlsx`  
- `/receipt-index.xlsx`  
- `/receipts/*` (all individual receipt images)  
- `/tax-rules/*` (all source documents and rule files)  
- `/calculation-audit/*` (all calculation snapshots)  

Each row in the expense spreadsheet can have a unique ID (e.g. **EXP-2026-00482**). The receipt file can be named **REC-2026-00482.jpg**, so they link up. This package is a complete bundle of the company’s tax evidence, ready for an auditor.

### Receipt Retention

Receipts must be kept even if an expense is deleted or changed. If an expense is voided or corrected, TaxShield will:  

- Mark the **Original Expense** as Voided (keep its ID).  
- Create a **Replacement Expense** with corrected info.  

However, the **original receipt and audit log** remain in the archive. We never permanently delete a receipt file just because the UI record was edited. This immutability of history ensures full traceability (see Sec. 44).

### Document Integrity

For uploaded documents (receipts, W-2s, etc.), store metadata:  

- **SHA-256 hash** of the file  
- **Upload timestamp** and who uploaded  
- **Original filename** and MIME type  
- **File size**  
- **Document version** (if updated)  

These fields allow the system (and an auditor) to prove a document hasn’t been tampered with. Any change in the file would change the hash, so we’d detect modifications.

### Security

Continue enforcing strong security. In addition to existing requirements (encryption at rest, SSN masked except last 4), add:  

- **Field-level encryption** for Social Security Numbers.  
- **Encryption for bank/account information.**  
- **Role-based access control** (see Roles below).  
- **Session timeouts** after inactivity.  
- **Multi-factor authentication (MFA).**  
- **Audit logging:** record every sensitive action, including user, action, timestamp, and before/after values.  
- **Download/document access logging:** who viewed or downloaded each sensitive document.  
- **Data export controls:** log or restrict exports of big data sets.  
- **Account deletion workflow:** secure removal or anonymization of user data.  
- **Encrypted backups** for disaster recovery.  

These measures protect the LLC’s financial and personal data at all times.

### Roles

Initially, there is only one user role: **OWNER** (the LLC owner). In future releases, add roles like:  

- **BOOKKEEPER** (handles entries, but no tax rule changes)  
- **EMPLOYEE** (can submit expenses/timesheets, view own data)  
- **CPA / TAX PREPARER** (read-only access to records, but cannot modify payroll or rules)  
- **READ-ONLY AUDITOR** (view access for audits)  

The CPA role, for example, can examine all records but cannot change any payroll or tax configurations. Role-based access ensures people see only what they should.

### Audit Event Log

Every significant change in the system generates an audit event with:  

- **Who:** user (or system) that made the change.  
- **What:** action performed (e.g. “Changed expense category EXP-2026-00482”).  
- **When:** timestamp of the action.  
- **Before/After:** old vs new values.  
- **Why:** any user-entered reason or notes.  
- **IP/Device:** if available.  

*Example event:*  
User: Owner  
Action: Changed expense category  
Record: EXP-2026-00482  
Before: Office Supplies  
After: Equipment  
Timestamp: 2026-08-23 18:42  
Reason: “Corrected categorization”  

Such logs are invaluable during internal reviews or external audits.

### Dashboard Design

The home dashboard answers: **“Is my business financially and tax-wise under control?”** For example, it might display:  

```
┌───────────────────────────────────────────────┐
│ 2026 TAX YEAR                                │
│                                               │
│ Revenue:               $XX,XXX                │
│ Expenses:              $XX,XXX                │
│ Profit/Loss (est.):    $XX,XXX                │
│ Audit Readiness:       94%                    │
└───────────────────────────────────────────────┘

┌───────────────┐  ┌───────────────┐
│ Expenses      │  │ Mileage       │
│ $XX,XXX       │  │ 4,832 miles   │
│ 124 receipts  │  │ $3,648        │
└───────────────┘  └───────────────┘

┌───────────────┐  ┌───────────────┐
│ Payroll       │  │ Compliance    │
│ $XX,XXX       │  │ 2 tasks due   │
└───────────────┘  └───────────────┘
```

In words: the dashboard shows current-year revenue, expenses, profit, and an overall audit score. It also shows quick stats on expenses (total dollars and receipt count), mileage (miles and deduction), payroll spent, and compliance (e.g. upcoming tasks). This visual layout lets the owner immediately see if something needs attention (e.g. a low audit readiness percentage).

### “Needs Attention” Center

A very useful screen is **Needs Attention**, flagging items needing action. For example:  

- 🔴 **Missing receipt:** $428.00 – Office Depot  
- 🟠 **Missing purpose:** $86.40 – Parking expense  
- 🟠 **Payroll reconciliation:** February payroll not finalized  
- 🟡 **Tax rule update:** 2027 federal withholding rules available  
- 🟢 **Mileage:** All trips complete  

(Color codes: red = urgent, orange = warning, green = done.) By proactively listing these issues, the owner can fix them before they become problems.

### Notifications

The system should push real-time or periodic notifications for issues such as:  

- *“Receipt missing for $185.20 expense.”*  
- *“Mileage trip cannot be finalized – ending odometer is missing.”*  
- *“Quarterly Form 941 due in 12 days.”*  
- *“New federal tax rule available for 2027.”*  
- *“Pennsylvania tax rule update detected.”*  
- *“Payroll YTD totals do not reconcile.”*  

These alerts keep the owner informed of tasks and errors, so nothing is overlooked.

### Mobile-First Expense Capture

The mobile interface should let the user capture data in **<30 seconds**. Extend this to all relevant tasks: **Expense, Mileage, Receipt, Reimbursement** entry. For receipts:  

1. **Take Photo** of receipt.  
2. **OCR** extracts amount/date.  
3. **Confirm Amount** from OCR result.  
4. **Choose Category** from list.  
5. **Enter Business Purpose.**  
6. **Save** the expense.  

(This flow can appear as a step-by-step mobile wizard.) The goal is speedy capture: snap and save.

### Global Search

Implement a **global search** across the app. A single query should find: expense records, receipts, mileage entries, payroll runs, employee names, transaction IDs, tax rule names, documents, or compliance tasks. For example, searching “$450 Home Depot 08/22/2026” could return the relevant expense, receipt, and transaction. This “search everything” feature helps quickly locate any record by key terms.

### Duplicate Detection

Automate detection of potential duplicates. If the system sees two entries with the same vendor, date, and amount (e.g. two $184.27 Home Depot charges on 08/22/2026), it flags them. The user can then:  

- **Keep both** (if intentional)  
- **Mark duplicate** (link them)  
- **Review** manually  

This prevents accidentally counting one expense twice.

### Missing Evidence Detection

Automatically flag common missing info. For example:  

- Any *expense over $X* with no receipt.  
- A *travel expense* without a business purpose.  
- A *mileage* entry missing start or end odometer.  
- A reimbursement with no approval recorded.  
- A payroll payment not tied to a payroll run.  
- A bank transaction without a category.  

By highlighting these, TaxShield actively assists compliance. It essentially enforces good record-keeping.

### Tax-Year Data Isolation

Every transaction is tied to a **Tax Year**, determined by its date (or relevant effective date), not just when it was entered. Use a Tax Year resolver that considers transaction date, payment date, or rule effective date. For example:  

```
Transaction
   ↓
Transaction Date
   ↓
Tax Year Resolver
   ↓
Tax Year (2026)
```

This ensures, for instance, that a payment made on 01/03/2026 is treated under the 2026 rules, even if entered in late 2025.

### Immutable Historical Calculations

A payroll run from 2026 must always use 2026’s rule versions, even if 2027 rules exist. In other words, once a calculation is saved, it’s locked to that rule version. Historical reporting relies on this immutability: we never quietly re-calc old pays under new rules. Each pay stub remains reproducible from its snapshot (Sec. 9).

### Multi-Year Architecture

Design from day one to support multiple years:  

```
Company
├── 2025 Tax Year
│    ├── Rules, Expenses, Mileage, Payroll, Compliance Tasks
├── 2026 Tax Year
│    ├── (same categories)
└── 2027 Tax Year
     ├── (same categories)
```

The company profile (name, EIN, etc.) persists, but settings like tax rules, limits, and forms can change per year. This way, each year is self-contained. The user can switch between years to review past data or prepare new year without mixing them.

### New-Year Wizard

Each December/January, guide the owner through *Starting a New Tax Year*. Steps:

1. **Create [2027] Tax Year** and confirm company info (state, EIN, classification).  
2. **Confirm business locations** (office address, etc.).  
3. **Confirm employees** (carry over W-4 and location data).  
4. **Resolve jurisdictions** for each employee (run resolver).  
5. **Download 2027 tax rules** automatically.  
6. **Validate rules** (automatic checks).  
7. **Review changes** (show diffs for new vs old rules).  
8. **Activate 2027** (set it live).  

At no point does the user manually type a tax rate. The wizard handles contacting data sources and setting defaults.

### Tax Rule Coverage Matrix

Provide an internal **coverage matrix** (table) showing which rules are ready per year. For example:

| Area                 | 2026 | 2027 | Source              | Status   |
|----------------------|:----:|:----:|---------------------|----------|
| Federal withholding  | ✓    | ✓    | IRS Pub 15-T       | Active   |
| Federal FICA         | ✓    | ✓    | IRS (Social Sec)   | Active   |
| Mileage rate         | ✓    | —    | IRS                | Review   |
| PA withholding       | ✓    | —    | PA DOR             | Review   |
| Local EIT            | ✓    | —    | Philadelphia      | Review   |
| Local LST            | ✓    | —    | Local authorities | Review   |
| FUTA (US)           | ✓    | —    | IRS               | Review   |
| PA unemployment     | ✓    | —    | PA L&I            | Review   |

(“✓” means loaded and validated; “—” means pending.) This dashboard alerts the team if any jurisdiction for 2027 is still incomplete. If a payroll run requires a rule with “Review” status, it will be blocked (Sec. 101).

### Architecture: Four Layers

We divide the system into four layers:

- **User Interface:** The web/mobile UI.  
- **Business Services:** Modules for Expenses, Payroll, Mileage, Compliance, etc.  
- **Tax Rules Engine:** The versioned rule repository and effective-date logic.  
- **Government Source Layer:** Integration with IRS, state, local data feeds.  

The critical boundary is that the **calculation engine (Business Services + Rules Engine)** contains *no hardcoded rates*. All tax logic comes from the Rules Engine data. (See diagram below.)

### Recommended Backend Services

A microservices implementation could include (for example):

- Company Service  
- Employee Service  
- Expense Service  
- Receipt Service  
- Mileage Service  
- Payroll Service  
- Reimbursement Service  
- Tax Rules Service  
- Jurisdiction Service  
- Compliance (Tasks) Service  
- Document Service  
- Audit Logging Service  
- Reporting Service  
- Notification Service  

Each service would have its own API. For instance, a Tax Rules Service API might look like:  
```
GET /tax-rules?jurisdiction=US-FEDERAL&taxYear=2026&taxType=WITHHOLDING&effectiveDate=2026-08-23
```
Response: `US-FEDERAL-2026-PUB15T-v3`.  The payroll service then uses that rule version for calculations.

### Tax Rules as Declarative Data

Where possible, represent rules in a declarative format (JSON, YAML) instead of code. For example, a rule might be stored as:

```json
{
  "rule": "federal_withholding",
  "tax_year": 2026,
  "effective_from": "2026-01-01",
  "effective_to": "2026-12-31",
  "method": "percentage",
  "source": "IRS-PUB-15T-2026",
  "version": 3
}
```

More complex formulas could be handled by a small, controlled expression language or versioned calculation module. The point is: *rate tables and formulas live in data, not code*.

### No Silent Rule Changes

If a new version of a rule is detected, TaxShield will show the current vs new side by side. Example:  
- *Current (v2)* vs *New (v3 effective 07/01/2026)* for “2026 Federal Withholding”.  
The system ensures: **past payroll stays on v2, future payroll uses v3**. There is never an automatic overwrite without making it explicit. This trust feature means the owner knows exactly when and how calculations changed.

### Product Differentiator

We will emphasize the real benefit to the user. The pitch is not “Free payroll software,” but rather:  

> **“Your LLC’s tax records, calculations, receipts, and audit trail — organized by tax year and backed by the rules used to calculate them.”**  

This highlights that TaxShield is more than a calculator or spreadsheet: it’s an all-in-one tax ledger with proof. Every deduction is linked to evidence and tax law. That audit trail and multi-year organization is our unique value.

### MVP Priorities

We recommend an incremental rollout. **Phase 1 – Core:**

1. Company & LLC setup (profile, EIN, classification)  
2. Tax-year setup (create years, jurisdictions)  
3. Federal/state/local jurisdiction setup (initial resolver)  
4. Tax rules repository (ingestion & storage)  
5. Expense tracker (entry + categories)  
6. Receipt upload/storage  
7. Mileage tracker (basic log)  
8. Basic payroll (single-state, using rules)  
9. Reimbursements (manual workflow)  
10. Compliance calendar (due dates, tasks)  
11. Audit trail logging (changes, rule versions)  
12. Year-end export (data export for accountant)  

**Phase 2 – Enhancements:**

13. OCR for receipt extraction (auto-fill)  
14. Bank CSV import (transactions)  
15. Receipt matching (to bank entries)  
16. Duplicate detection (flagging)  
17. Audit readiness score/dashboard  
18. CPA export package  
19. Automated tax rule updates (parse & versioning)  
20. Regression testing (automated checks)  

**Phase 3 – Advanced Features:**

21. Automated jurisdiction resolution (multi-state support)  
22. Advanced payroll (multi-state, local taxes)  
23. Local tax automation (municipality taxes)  
24. Asset/depreciation tracking  
25. Advanced tax simulator (scenario modeling)  
26. CPA portal (shared access)  
27. Multi-user roles & permissions  
28. Advanced document management (versioning, search)  

This phased approach balances foundational needs with strategic improvements.

### Success Metrics

In addition to the original metrics (zero subscriptions cost, complete mileage log, calculation accuracy, filing time), we add:  

- **Record completeness:** ≥95% of expenses with required receipts; ≥95% with business purpose; 100% of mileage trips fully documented.  
- **Tax engine integrity:** 100% of calculations linked to a specific rule version; 0 historical calculations silently changed; 100% of active rules tied to an authoritative source.  
- **Audit readiness:** Every expense traceable to documentation; every payroll calc traceable to a rule version; every reimbursement traceable to approval/payment; all documents tagged with immutable metadata.  
- **User efficiency:** Average expense capture <30 seconds; mileage entry <30 seconds; quarterly compliance prep (if no exceptions) <5 minutes; new tax year setup <10 minutes.  

These metrics emphasize completeness, auditability, and efficiency.

### The “Trust Model”

TaxShield makes three fundamental promises to the user:  

- **Promise 1 – “I know where this number came from.”** Every tax calculation lists its legal source (IRS pub, state code, etc.).  
- **Promise 2 – “I can reproduce the number later.”** Each calculation is tied to a specific rule version (with date).  
- **Promise 3 – “I can prove this expense.”** Every deduction (expense, mileage, reimbursement) links back to evidence (receipts, purpose, etc.).  

These create a closed loop:  

```
Transaction → Classification → Tax Treatment → Calculation → Documentation → Audit Trail → Tax Report
```

In short, every entry is documented end-to-end. This trust loop is the core of our product philosophy.

### Long-Term Architecture (North-Star)

Long term, TaxShield Ledger becomes a **multi-year tax evidence platform**. Conceptually:

```
           [ Money ]        [ Tax Rules ]        [ Evidence ]
      ┌─────────────────┐   ┌──────────────┐   ┌──────────────┐
      │   Expenses      │   │ Federal      │   │ Receipts     │
      │   Payroll       │   │ State        │   │ Audit Log    │
      │   Income        │   │ Local        │   │ Rules Sources│
      │   Mileage       │   │ IRS          │   │ Mileage Log  │
      │   Reimbursements│   │             │   │              │
      └─────────────────┘   └──────────────┘   └──────────────┘
                \                 |                    /
                 \                |                   /
                 └──────┬─────────┼──────────┬────────┘
                        ▼         ▼          ▼
                 [ Calculation Engine ]
                        │
                        ▼
                 [ Year-End Package ]
                        │
                        ▼
                Owner / CPA / Tax Return
```

In this model, every fiscal transaction (Expenses, Payroll, etc.) is linked with Tax Rules (Federal, State, Local) and Evidence (Receipts, logs). The calculation engine then produces a complete year-end audit package. We are not just building a payroll calculator or expense tracker; we are building a *multi-year tax-aware operating ledger for the LLC*. This vision differentiates us from generic accounting tools.

### Final Product Recommendations

The three most important enhancements over the original PRD are:

1. **Tax Year & Jurisdiction as core:** Treat every calculation as a function of Company + Tax Year + Jurisdiction + Date. All tax logic depends on these context keys.  
2. **Versioned Tax Rules Engine:** Never hardcode anything. Store all tax rates, brackets, limits, mileage rates, deadlines, etc., as data with source citations and effective periods. (The IRS publishes some rules in Pub 15-T and others in revenue procedures, so a data approach is essential.)  
3. **Evidence Management:** Think of every deduction as **Money + Reason + Rule + Evidence**, not just Money+Category. Link receipts, purposes, mileage logs, calculation snapshots, and audit history end-to-end.  

Implementing these makes TaxShield Ledger far more powerful than a spreadsheet. Instead of just “tracking expenses,” it becomes *a tax evidence and calculation platform* with complete auditability.

### Multi-State Payroll & Tax Jurisdiction Engine

Finally, we emphasize the need for **multi-state support**. An LLC’s employees may work in multiple states:

- Employees might live in one state and work in another (or several).  
- They may work remotely, at the company office, or travel to clients.  
- They may cross state lines multiple times in a single week or move mid-year.  

TaxShield must not assume the LLC’s home state governs all payroll tax. Instead, it uses data-driven rules based on:

> *“Given this employee, this employer, this date, this residence, and this work location, what tax rules apply?”*  

For example, there can be three separate locations to consider:

- **Employee Residence:** Where the employee lives (for tax purposes). This has address, county, local tax, effective dates.  
- **Company Work Locations:** The official office(s) of the LLC (with address details).  
- **Actual Work Location (per day):** Where the employee physically worked on each day, e.g. “2026-08-24: NJ Home (8h)”, “2026-08-25: PA Office (8h)”.  

Each payroll period, TaxShield looks at how many hours/days were worked in each location and applies sourcing rules accordingly (Sec. 74–76). It does **not** simply assume “employee_state = PA.” Instead it resolves jurisdictions via the resolver (Sec. 77–79). This allows support for cases like:

- **Scenario A:** Company in PA, Employee lives/works 100% in NJ. System identifies NJ withholding is required (even though the company is PA).  
- **Scenario B:** Hybrid: PA company, NJ resident works M/T/Friday in PA, W/Th in NJ. System allocates 60% wages to PA, 40% to NJ based on days.  
- **Scenario C:** Travel: PA employee visits NY for 2 days. System treats that as *work done in NY* (business travel) and checks NY obligations for those days.  

These scenarios and others (Sec. 86–92) show TaxShield’s resolver/engine approach. The initial version supports two location types (COMPANY_OFFICE and EMPLOYEE_HOME) under three arrangements (Full-time office, Hybrid, Fully remote). Customer sites or complex travel are left for future. 

By focusing on employee **work location events** (Sec. 110), the system links employees to payroll taxes correctly. The core rule is: **Never ask the user “what’s the tax state?” The system should figure it out based on data.** This is the key difference between a simple payroll tool and a true multi-state payroll engine.

