# TaxShield Ledger – In-Depth Architecture and Requirements

TaxShield Ledger aims to be the **audit-ready financial and tax system of record** for micro-LLCs (1–5 people). It should let an owner answer at any time: *What did we spend? Why was each expense legitimate? How was each tax computed? Can I show evidence on audit?*  To meet these goals, every financial transaction – expenses, mileage, payroll, reimbursements, etc. – must be tied to **versioned tax rules, documentation, and user actions**.  Transactions are never “magic numbers”; they record which rules and sources were used. This ensures transparency and reproducibility. Modern tax engines achieve this with **data-driven rules** (not hardcoded constants) and full audit logs.

## Core Principles: Rules as Data, No Hardcoding  
TaxShield’s backend must **never embed fixed tax rates or formulas in code**. Instead, all tax rates, brackets, thresholds and formulas (federal, state, and local) are stored as *versioned data* with validity dates and sources. For example, IRS Publication 15-T (Federal withholding) and PA DOR guidance would be parsed into records like:  
```  
TaxRule { jurisdiction: US-FEDERAL, type: FED_WITHHOLDING, year:2026, effective:2026-01-01 to 2026-12-31, formula: [wage-bracket table], source: "IRS Pub 15-T (2026)" }  
```  
This approach – a **centralized, version-controlled tax rule repository** – is a best practice in tax engines. It avoids endless code updates and ensures that updates (new laws, rates, thresholds) are managed as *data changes*, not code changes. For example, PA’s flat 3.07% income tax is published by PA DOR, and local PA EIT/LST rates are published via Act 32 sources; our system ingests and versions those, rather than hardcoding `0.0307`. 

**Best practices** (as seen in enterprise tax engines) include: 
- **Dynamic Rule Repository**: Maintain a centralized, updatable store of all tax rules, with metadata (jurisdiction, effective dates, version, and source).  
- **Automated Updates**: Regularly ingest new/updated rules from authoritative sources (IRS, PA DOR, SSA, local tax boards). IRS and state tax agencies publish official tables and XML files (e.g. IRS Pub 15-T), which we monitor for changes. When a new rule version is detected, we parse it, create a new versioned `TaxRule`, and validate it before activation.  
- **Controlled Rule Lifecycle**: Each new rule goes through stages (Discovered → Parsed → Validated → Regression-Tested → Approved → Active → Superseded) to ensure legal accuracy before affecting payroll. This prevents silent errors.  

By treating tax logic as data, TaxShield can support multi-jurisdiction complexity (different states, localities, years) without branching code. As one expert notes, building a payroll engine in-house means maintaining tax logic for over 7,400 jurisdictions. Instead, our rule engine pulls from standardized data and calculation modules, while the rest of the system focuses on workflow and user interface.

## Tax Year and Jurisdiction Management  
TaxShield introduces **Tax Year** as a first-class entity. Each *Company* has multiple *Tax Years* (2025, 2026, etc.), each bundling its set of federal, state, and local rules and forms. When a new year is created, the system must:

- Identify the company’s **jurisdictions**: company location, employee residences, work locations, and any state nexus (see below).  
- Download and validate all applicable tax rules (federal/state withholding, FICA, FUTA, PA SIT, local EIT/LST, etc.) for that year. For example, for a PA-based LLC in 2026 we load IRS federal rules and Pennsylvania DOR rules. 
- Prepare a **Tax Configuration dashboard** showing which rules are loaded and active (federal, state, local, mileage, etc.) and flag any missing or pending updates.  

This ensures that each payroll or expense is computed using the correct rules for *that tax year*, *that date*, *that jurisdiction*. The system never uses a 2027 rule to recompute a 2026 payroll. Each Tax Year has its own set of effective rules. 

## Automatic Tax Rule Update Engine  
TaxShield includes a **Tax Rules Update Service** that continuously monitors authoritative sources. Tier-1 sources include IRS releases (e.g. new Publication 15-T each fall), federal and state labor agencies, and PA DOR announcements. Tier-2 might be government APIs or XML feeds. Third-party data (Tier-3) is used only for reference, never overruling official data. When a rule changes (e.g. IRS updates withholding tables), the service automatically ingests the new data, creates a new versioned `TaxRule`, and runs automated regression tests against historical cases. Only after tests pass and (if needed) human review is the new rule activated. 

> **Source Provenance:** Every tax rule stores a link to its source (e.g. “IRS Pub 15-T 2026, published 12/11/2025”) with a checksum. For example, IRS Pub 15-T provides federal withholding tables for 2026, and the system would archive the exact PDF/XML so calculations can be audited. This “source registry” ensures we know exactly where each rule came from and when.

## Payroll Calculation Engine  
TaxShield’s payroll module is an assisted gross-to-net engine driven entirely by the rule repository.  It takes **employee pay data**, their tax profiles, and *jurisdiction context* as input, and computes withholdings and employer taxes for each relevant jurisdiction. 

- **Employee Profile:** Each employee has a profile (including W-4, personal exemptions, state withholding information, etc.) and effective-dated **Residence History** (where they live for tax purposes).  PA law, for instance, requires withholding on any PA resident’s wages regardless of work location, and on any nonresident working in PA.  These are rules in our repository.  
- **Company Profile:** The company has one or more **Work Locations** (for MVP, we support a single company office, not multiple branches). Each location has an address, state, local jurisdiction, etc. This is where on-site employees work.  
- **Work Location Events:** Critically, each payroll period we consider the *actual* work done. We record an employee’s **Work Location Calendar/History** (e.g. “John Smith – 8/25/2026: PA office; 8/26/2026: NJ home”). For simplicity, the initial release only supports two location types: COMPANY_OFFICE or EMPLOYEE_HOME.  This aligns with a hybrid/remote work model (one home, one office). (Customer sites, travel, or 3rd-party work sites are explicitly out of scope initially.)  
- **Jurisdiction Resolution:** A **Jurisdiction Resolver** service takes the combination of (employee residence, work location, employer nexus) and the date to determine all applicable taxing jurisdictions and rules. For example, a NJ resident working 3 days at the PA office and 2 days from NJ home in a week would trigger NJ withholding on the home days and PA withholding on office days.  Reciprocity is considered: PA/NJ have a reciprocal agreement, so NJ residents working in PA normally pay NJ tax only (unless Philadelphia wage tax applies, which is a local nuance to handle separately). 

Once jurisdictions are determined, the engine fetches the correct rule versions for *each jurisdiction and date* (federal, state, local, FICA, etc.) and computes taxes.  For example:
```
Gross wages: $2,400
Federal w/h (IRS Pub15-T 2026, married, biweekly, rate tables): $182.44
PA PIT (flat 3.07%): $73.68
Social Security (6.2%): $148.80
Medicare (1.45%): $34.80
Net pay: $1,960.28
```
Each calculation logs *which* rule version was used (e.g. “US-FED-2026-PUB15T-v3”, “PA-2026-SIT-v2”, “FED-FICA-2026-v1”).  That way **changing rules in 2027 never retroactively alters 2026 payroll**: the snapshot of “numbers + rule IDs” is preserved.

**Regression Testing:** Every new tax rule version is automatically tested against historical payroll cases. If a 2026 rule suddenly produces different results for a known scenario, it fails until reviewed.  This guards against unintentional differences.

## Jurisdiction and Nexus  
TaxShield must handle employees and the company across multiple states/jurisdictions:

- **Residence vs. Work Location:** We explicitly model three things: Employee *Residence*, Company *Work Location* (usually the one office), and *Actual Work Location* for each day/pay period.  Each is effective-dated. PA, for example, taxes all wages of PA residents even if they work from home outside PA. The resolver uses this data to decide which state/local laws apply.  
- **Nexus Engine:** We also track the company’s *nexus* in each state (does business activity or employee presence create an obligation?). If an employee works in NJ, the PA LLC may need an NJ withholding and unemployment account. The system won’t assume payroll handling covers all obligations – rather it flags “review required” if, say, an NJ work location suggests new registrations.  
- **Reciprocity:** Reciprocal tax agreements are codified in rules. For example, **PA/NJ reciprocity** means NJ residents working in PA pay NJ tax only. The resolver recognizes such rules and applies them automatically (e.g. requiring an NJ nonresidency certificate to avoid PA withholding).  Notably, reciprocity typically *excludes* certain local taxes (e.g. Philadelphia wage tax), which are treated separately.  
- **Local Taxes:** Some municipalities levy their own income taxes (e.g. PA county/city EIT or New York City tax). TaxShield’s rules include local jurisdictions. For PA, Act 32 requires withholding local EIT and LST for any work performed in PA. The resolver uses the address or geo-code of the work location to fetch local rules (via PSD codes for PA).

   Symmetry’s payroll API guide emphasizes this: an engine must cover not just states but *thousands of local jurisdictions* and use precise geocoding (not just zip codes). TaxShield will either use a geocoding service or local boundary data to assign the correct local code for each work location. 

## Expense & Receipt Management  
Beyond payroll, TaxShield includes a **comprehensive expense ledger** with receipts and audit trails:

- **Expense Entry:** Each expense record captures date, vendor, amount, tax, payment method, category, subcategory, business purpose, project/client (optional), employee, location, reimbursement status, tax treatment, and an attached receipt. This is in line with IRS substantiation rules: a valid business receipt should show merchant, date, itemized description, total (with tax separated), and payment method. For example, IRS Publication 463 requires tracking date, amount, merchant, and business purpose for every deduction.

- **Receipt Storage:** Receipts (JPG, PNG, PDF, etc.) are stored with metadata (uploader, timestamp, SHA-256 hash) to ensure integrity.  Users can “snap a photo → upload → categorize”. Like modern T&E systems, TaxShield will support OCR extraction: the system attempts to read vendor name, date, total, and tax from a receipt image, then suggests filling those fields for the user. The UI highlights which fields were auto-extracted vs. manually entered. 

- **Duplicate Detection:** When a receipt is uploaded or an expense is entered, TaxShield checks for potential duplicates. It compares vendor, date, amount, and even receipt images across existing records. If an identical or near-identical expense already exists (e.g. same Home Depot purchase on same day), it flags it as a potential duplicate for review.  This prevents paying the same bill twice.

- **Receipt-to-Transaction Matching:** Over time, TaxShield can match each expense to actual bank or card transactions (imported via CSV or bank feed). For example, a $184.27 Home Depot expense can be linked to a $184.27 debit on the company card on 08/22/2026. The system records match status (Matched, Unmatched, Duplicate, Needs Review). This bridges the gap between receipts and the accounting ledger.

- **Audit Evidence Package:** Every expense ties together all evidence: the receipt image, business purpose note, payment record (bank transaction), employee who incurred it, related mileage or trip (if any), and how it’s treated tax-wise. For each significant expense, TaxShield keeps an immutable “evidence chain” so that in an audit you can produce a complete package (digital receipts, purpose, classification) for every deduction.  

- **Expense Categories & Policies:** The app comes with default categories (Vehicle, Travel, Meals, Supplies, Software, etc.), configurable by tax year. Certain categories (Meals, Travel, Entertainment) may require extra substantiation (attendees, purpose). The system should **enforce policy**: e.g. if you enter a $500 travel expense, “Business purpose” and attendees might be required by IRS rules. Flag vague descriptions (“Business”) and encourage concrete ones (“Site visit with vendor to inspect equipment”).

- **Audit-Readiness Score:** Inspired by best practices, TaxShield tracks how many required fields and documents are complete. Each expense could get an “audit completeness” percentage: receipt attached, date/vendor present, purpose written, etc. On a company-level dashboard, we can show e.g. “2026 Audit Readiness: 94%” and breakouts by category (receipts 98%, expenses 95%, mileage 100%). This highlights where data is incomplete. 

## Mileage Module  
Mileage tracking is critical for deductions. Each **trip entry** includes date, origin, destination, business purpose, and starting/ending odometer. We add a **Vehicle** record (VIN, make/model, ownership, business-use %) to reuse data across trips.  

- **Rates & Calculations:** The IRS mileage rate can change mid-year (e.g. 72.5¢ up to 6/30, 76¢ after). TaxShield’s rules store mileage rates with effective periods. When a trip is logged, the engine looks up “IRS 2026 mileage rate for date X” and multiplies by miles. Employees never enter the rate manually. Historical trips continue to use the original rate (no recalculation) by virtue of time-bounded rules.  

- **Expense Linking:** Mileage trips can have related expenses (tolls, parking, lodging). For example, a business trip from Philly to Harrisburg might show: 210 miles @ $0.725 = $152.25, plus tolls $28.40 and parking $12.00, for a total travel deduction $192.65. The system should warn if, say, a toll is being double-counted (linked both to trip and separately). All components of a trip form one “travel expense”.

- **Audit Trail:** The mileage log itself is audited. Each trip has creation and modification timestamps, who entered it, and what changed (start/end odometer edits, purpose updates). We never overwrite the original; edits create a history. This aligns with best practice: preserve originals in case of IRS audit (as for payroll).

## Payroll and Reimbursements  
TaxShield keeps payroll and reimbursements strictly tied to tax rules:

- **Reimbursement Center:** Employees submit reimbursements (mileage, supplies, travel, etc.) through a workflow: *Submitted → Reviewed/Approved → Reimbursed → Reconciled*. Each reimbursement record ties to an expense or mileage entry, has its own business purpose, approver, etc.  

- **Accountable Plans:** By default, mileage, tolls, parking reimbursements are non-taxable (accountable plan) per IRS rules. TaxShield tracks whether a reimbursement is taxable compensation or non-taxable reimbursement. The system flags any reimbursements that don’t meet accountable plan criteria (e.g. lacking receipts or purpose) and treats them as wages if needed.  

- **Payroll Module:** Payroll is “assisted”: the owner reviews and runs payroll with TaxShield’s help. The system calculates all withholding (federal, state PIT, local, FICA, FUTA, etc.) using the rule engine. It also handles employer-side taxes (SUTA/UC, disability, paid leave contributions) as defined by jurisdiction rules. For example, the PA unemployment rate or NJ disability rate would be in the database, not hardcoded.

## Calculation Transparency & Audit Trail  
For trust and audit, every calculation is fully explainable:

- **Calculation Snapshots:** Each payroll run saves a *snapshot* showing gross pay, taxable wages, withholding by type, net pay, **and the exact rule versions used** for each tax component. E.g.: “Federal w/h: $182.44 (based on IRS Pub15-T 2026, married, biweekly)”. This way, even if the IRS changes tables later, the snapshot remains unchanged.

- **“Why This Tax?” UI:** In the paycheck detail, a user can click “View Calculation” to see step-by-step derivation. This will list each withholding with its base wage and rule source, similar to modern payroll statements. It might look like:

  > Gross wages: $2,400.00  
  > Federal taxable wages: $2,400.00  
  > Federal withholding: $182.44  
  > &nbsp;&nbsp;&nbsp;└─ Source: IRS Pub 15-T (2026, married, biweekly)  
  > Social Security: $148.80 (6.2% rate)  
  > Medicare: $34.80 (1.45% rate)  
  > PA withholding: $73.68 (3.07% flat PA PIT)  
  > Net pay: $1,960.28  

  This level of detail is more valuable than just showing totals. It builds confidence that *each number came from a known source*.

- **Event Logs:** Every sensitive change (who changed an expense category, who approved a reimbursement, payroll run creation, rule activation, etc.) is logged with user, timestamp, before/after values, and IP if relevant. QuickBooks’ Audit Log is a model: it tracks all edits and deletions. TaxShield’s audit log similarly records that the owner changed expense EXP-2026-00482 category from “Supplies” to “Equipment” on 2026-08-23 at 18:42, with an optional “why” note. These logs help in internal audits and are retained for years (at least the IRS’s 3–7 year window).

## Dashboards and Alerts  
TaxShield presents a dashboard answering “Is my company **financially and tax-wise under control**?” It might show: total 2026 revenue, expenses, estimated profit/loss, and an overall *Audit Readiness* percentage. Drill-down panels could show expense stats (total and count), mileage (miles, deduction), payroll ($ paid, taxes), and pending compliance tasks. 

A **“Needs Attention”** list highlights missing items: missing receipts, unclear purposes, payroll reconciliation gaps, upcoming tax filings (e.g. Form 941 due), or new rule updates to review. For example: 
- 🔴 Missing receipt: $428.00 at Office Depot.  
- 🟠 Missing business purpose: $86.40 Parking.  
- 🟡 Payroll reconciliation: Feb 2026 payroll needs review.  
- 🟢 Mileage: All trips complete.

Real-time **notifications** alert the user: “Receipt missing for $185.20 expense – upload now,” or “New 2027 federal withholding rules available – please review.”  This proactive approach (inspired by expense-management best practices) turns compliance from anxiety into a guided workflow.

## Data Model and Service Architecture  
TaxShield’s backend is best structured as microservices: separate services for **Company**, **Employee**, **Payroll**, **Expenses**, **Mileage**, **TaxRules**, **JurisdictionResolver**, **ComplianceTasks**, etc. Key data objects include:

- **TaxRule** (as described above) with version, effective date, source. Possibly broken into components like `TaxBracket`, `TaxThreshold`, `TaxFormula`.  
- **JurisdictionResolver** service: Input – address (with date) or employee info; Output – state, county, city, local tax district, reciprocity status, etc. This may use geocoding APIs and lookup tables (Symmetry suggests rooftop-level geocoding to avoid errors).  We’d cache results to avoid repeated calls.  
- **WorkLocationEvent**: (see draft #110). Represents an employee’s actual work shift or location: date, hours, type (HOME or OFFICE), address, business purpose. The payroll engine uses these events to allocate wages by state.  
- **TaxDecisionRecord**: for each payroll or tax calculation, we record the “why”: which jurisdictions applied and why (e.g. “PA withholding because employee performed services in PA on 08/25/2026, reciprocal certificate on file”).

## Multi-State Payroll Capability  
Although TaxShield may launch with PA-first, it is designed to scale to all 50 states. Best practices from multistate payroll guides apply: 

- **Location-Based Withholding:** “The correct state tax to withhold is generally where the work is done”.  E.g. a PA company with a NJ remote worker must withhold NJ tax on wages earned while working in NJ, even if the company is in PA.  (If the state has no income tax, it’s simpler.) The engine automatically splits each paycheck by state based on the WorkLocation calendar.  
- **Registration/Nexus Tracking:** As soon as an employee works in a new state, the company may need to register for withholding and unemployment there. TaxShield flags these obligations.  
- **Reciprocity and Credits:** Agreements like PA/NJ reciprocity are encoded. The system knows not to withhold NJ tax for a PA resident working in NJ (or vice versa) once a nonresident certificate is filed. It also handles special local taxes (e.g. Philadelphia’s earnings tax is *not* covered by PA/NJ reciprocity, so an NJ worker in Philly may pay Philly tax).  
- **Five Multi-State Methods:** Some states use “all wages”, “no credit”, “difference”, or “convenience-of-employer” rules to source income. TaxShield’s rules engine will include these as data (e.g. “NJ: all wages sourced to work-state”, “NY: convenience-of-employer test applicable”). We will not hardcode, but configure according to state law.  (Payroll tax vendors note that supporting all five multistate methods is critical.)  

## Expense Audit and Compliance Best Practices  
Our research and industry guides emphasize automation and continuous auditing. Key practices:

- **Capture Before the Fact:** Encourage uploading receipts and categorizing expenses in real time (via mobile) rather than saving all receipts for year-end. Modern platforms let employees snap receipts and have them auto-extracted and matched to card transactions. This shifts auditing from after-the-fact to real-time compliance.  
- **Policy Enforcement:** Implement spend policy rules (caps, allowed categories). The system can warn or block out-of-policy expenses. This reduces “hunting missing receipts” later.  
- **Regular Reviews:** Our UI should prompt periodic reconciliation (e.g. monthly/quarterly). The system can compute audit readiness dashboards showing what’s missing (see “Needs Attention” above).  

## Year-End and Reporting  
At year-end, TaxShield provides comprehensive reporting for CPAs and auditors:

- **CPA Package:** Generate a bundle (PDF/Excel) including income summary, detailed expense ledger, mileage log, payroll and tax summaries, asset depreciation, and receipt index. Everything links back to transactions.  
- **IRS Audit Package:** On request, output a zip with all raw data and docs: general ledger, expense sheet with receipt IDs, mileage sheet, payroll sheet, plus a directory of all receipt images and applicable tax rules/files used. Each item (e.g. EXP-2026-00482) has a unique ID linking it to Receipt REC-2026-00482. This ensures IRS or accountant can trace every deduction to its proof (very much the “TaxShield Trust Model”: money + reason + rule + evidence).  

## Data Security and Roles  
Given sensitive data (SSNs, bank info), TaxShield enforces strong security: encryption at rest (especially SSNs, banking details), field-level encryption for very sensitive fields, and strict role-based access. Out-of-scope but planned: 2FA/MFA, session timeouts, audit-logging on document access, and encrypted backups. Initial roles include **Owner**, and eventually **Bookkeeper**, **Employee**, **CPA**, **Auditor**, etc. CPAs get read-only access to records (no altering of payroll rules). 

## Architecture Layers  
The recommended architecture has clear separations:  

- **UI Layer:** Web/mobile interfaces for data entry, dashboards, document uploads.  
- **Business Services:** Microservices for company setup, employee management, expense processing, mileage logging, payroll runs, reimbursements, compliance tasks.  
- **Tax Rules Engine:** A specialized service that stores the versioned tax rules and applies them. All calculation requests go through this engine, which returns tax amounts and references. It never uses hardcoded rates.  
- **Government Source Ingestion:** A pipeline that downloads IRS publications, state bulletins, XML feeds, and parses them into tax rules.  

This layered approach ensures the **calculation engine never hardcodes a tax rate** and always uses the approved data.

## Implementation Phases (MVP)  
Given scope, TaxShield should be built iteratively. Phase 1 (core) might include:
1. Company and tax-year setup (address, classification)  
2. Federal and PA rule repository (with validation)  
3. Basic expense tracker (with receipts) and mileage log  
4. Simple payroll (federal & PA withholding, basic payroll run)  
5. Reimbursement workflow  
6. Compliance calendar (quarterly forms, deadlines)  
7. Audit log of all changes  
8. Year-end export package  

Subsequent phases add OCR, bank import and matching, duplicate detection, readiness score, CPA portal, automated rule updates/tests, multi-state flows, etc.

## Key Takeaways  
- **Data-Driven Rules:** As one source puts it, TaxShield’s core is a “dynamic tax rule repository” that is continuously updated and version-controlled. This makes calculations reliable and updatable.  
- **Jurisdiction Flexibility:** By modeling employee residence, work location, and nexus, the system automatically picks the right state/local rules – the owner never types in a “tax state” or rate. As Paycor advises, track each employee’s work location to apply correct taxes.  
- **Audit-Ready Evidence:** Every deduction combines **money + reason + rule + evidence**. Expenses have receipts and purposes, payroll has rule citations, and every change is logged. This transparency is what differentiates TaxShield from a basic ledger or payroll app.  
- **Proactive Compliance:** Instead of reacting to audits, the system alerts the user about missing receipts, unapproved expenses, upcoming filings, or new tax rules. Built-in duplicate detection and policy flags reduce risk.  

By embedding these features, TaxShield Ledger becomes **more than free payroll software**: it is a **multi-year tax-evidence platform** for the small LLC. All company finances – income, expenses, payroll, reimbursements – are recorded year-by-year, linked to authoritative rules and documents. The result is an always-audit-ready system that guides the owner through compliance without needing them to memorize tax codes.  

**Sources:**  Industry best practices and official guidance – e.g., IRS Publication 463 and 15-T, PA Dept. of Revenue, Symmetry and Paycor multistate guides, and expense compliance blogs – have informed these requirements. Each key claim above is backed by such references.