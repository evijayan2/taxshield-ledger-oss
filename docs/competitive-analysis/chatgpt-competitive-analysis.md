# ChatGPT Analysis — Architectural & Competitive Strategy Report

> **Source:** Multi-Agent Competitive Teardown Session (Step 34)
> **Date:** November 21, 2026

---

chatgpt analysis TaxShield Ledger: Architectural & Competitive Strategy Report
EXECUTIVE STRATEGY • US PAYROLL COMPLIANCE • FINTECH ARCHITECTURE • NOVEMBER 2026
1. Executive assessment
My recommendation: Position TaxShield Ledger as an audit-first financial operating system with assisted payroll—not as a cheaper Gusto clone.
The product has a potentially differentiated architecture: tax-year-aware accounting, immutable calculation evidence, cryptographically verifiable statutory rules, accountable-plan bookkeeping, bank reconciliation, contractor management, and payroll in one system.
However, there is an important strategic distinction:
Gusto, Rippling, and full-service Patriot sell an outcome: employees get paid, taxes get filed, and liabilities get remitted.
TaxShield currently sells control and evidence: employers know what they owe, why they owe it, and how to pay it.
Those are different products competing for different customer priorities.
The opportunity is to make TaxShield the system of record for small businesses that want to retain control of their money and financial records, while reducing the administrative burden of payroll and tax compliance.
Strategic recommendation
Audit-first, payment-partner-enabled
Build the statutory calculation and evidence platform yourself. Partner for regulated money movement and, initially, electronic tax filing. Do not become a bank, money transmitter, or full-service payroll tax custodian as an early-stage product strategy.
Three product promises
Every calculation is explainable and reproducible.
Every transaction has an auditable evidence trail.
The customer retains ownership of their funds, data, and deployment.
The most important architectural decision
Do not make the payment provider the source of truth for payroll calculations.
Instead:
TaxShield owns the payroll ledger, tax calculations, tax liabilities, and immutable calculation snapshots.
The payment partner executes authorized payment instructions.
Government agencies remain the authoritative destination for tax remittances and filings.
TaxShield reconciles payment and filing acknowledgments back into its ledger.
This separation protects the core open-source value proposition while allowing the commercial edition to approach full-service payroll.
2. Market positioning and competitive moat
2.1 Competitive positioning
TaxShield should not compete on the headline subscription price alone. A $17 payroll product and a $50 payroll product may have different levels of service, filing responsibility, integrations, and support.
The relevant comparison is total cost of ownership:
\[ TCO = Subscription + PerEmployeeFees + AddOns + Labor + ComplianceRisk \]
The final two terms are especially important for a small business. A low subscription price can still be expensive if the owner spends several hours every month reconciling payroll, preparing tax payments, and correcting filings.
2.2 Competitor comparison
Current advertised pricing is not always comparable because vendors change promotional offers, payroll tiers, and add-on charges. The following is a strategic comparison, not a claim that every vendor offers identical features at every price.
Competitor
Primary strength
Strategic weakness/opportunity
Gusto
Excellent small-business payroll UX, tax filing, benefits
Less attractive to owners prioritizing self-hosting and granular calculation evidence
QuickBooks Online Payroll
Integrated accounting and payroll ecosystem
Product value is tied to the broader QuickBooks ecosystem
Rippling
HR, IT, payroll automation
Broader platform can be excessive for 1–5 employees
Patriot Software
Cost-conscious payroll and accounting
Less differentiated around a cryptographically verifiable tax-rule architecture
Square Payroll
Convenient payments and POS integration
Less compelling for businesses seeking an independent, self-hosted financial ledger
ERPNext
Open-source ERP extensibility
US payroll and statutory compliance require substantial configuration and implementation
TaxShield Ledger
Tax evidence, ledger control, self-hosting, rule transparency
Employer payment execution and filing automation are currently weaker
Pricing reality: Gusto's current Simple plan advertises $49/month plus $6 per person; Plus is $80 plus $12 per person, and Premium is $180 plus $22 per person. This is different from older $40 + $6 pricing references.
How Much Does Gusto Cost?+1
For a three-person company, that means the advertised Simple base subscription plus employee charges is approximately $67/month before any applicable extras.
TaxShield should avoid competing by simply charging $15/month. Its value proposition should be that a business can retain its own financial records and calculation evidence without being locked into a vendor's proprietary payroll history.
2.3 Where the moat actually exists
I would rank the potential competitive advantages as follows:
Differentiator
Potential moat
Why
TaxPack versioning and reproducibility
Very high
Difficult to replicate if backed by comprehensive source citations, test vectors, and historical rules
Unified payroll and accountable-plan ledger
Very high
Connects compensation, deductions, receipts, mileage, payments, and tax consequences
Self-hosting and data sovereignty
High
Meaningful for technically capable owners and privacy-conscious firms
Immutable calculation snapshots
High
Strong evidence and dispute-resolution capabilities
Four-way bank reconciliation
High
Reduces the gap between accounting records and real cash movements
Audit readiness score
Medium-high
Useful if scores are explainable and not marketed as an IRS approval
TXP generation
Medium
Valuable workflow feature, but comparatively easy to reproduce
OCR and invoice generation
Low-medium
Useful features, but established competitors already offer similar capabilities
Important qualification: SHA-256 verification and immutable application records do not make a ledger legally invulnerable or tamper-proof by themselves.
A privileged database administrator could modify or delete records unless the architecture includes independent integrity controls.
I recommend:
Append-only financial events.
Hash-chained calculation snapshots.
Signed TaxPack manifests.
External timestamping or independently retained daily Merkle roots.
Object-lock/WORM archival for finalized evidence.
Separate signing keys from application database credentials.
Explicit correction and reversal events rather than editing historical records.
The strongest claim is not "impossible to tamper with." It is:
Every material change is detectable, attributable, and reproducible against the original statutory rule version.
2.4 Why customers would leave Gusto or QuickBooks
For a micro-LLC, price alone is rarely enough to justify migrating payroll. Payroll migration creates significant risk.
The likely switching triggers are:
Recurring subscription increases as employee count grows.
Paying for HR and workforce functionality that the business does not need.
Difficulty exporting detailed historical payroll calculations and evidence.
Wanting to host financial information on infrastructure the owner controls.
Needing one coherent record for owner distributions, accountable-plan reimbursements, contractor expenses, and employee wages.
Wanting a CPA to inspect the underlying calculations rather than trust a vendor-generated summary.
However, there is a critical barrier: owners do not want to become payroll administrators.
A self-service product will lose customers if they must repeatedly navigate EFTPS, state revenue portals, SUTA portals, and annual reporting websites without adequate guidance.
Switching strategy: Do not require customers to abandon Gusto immediately. Provide a migration importer for historical payroll, employee setup, opening tax liabilities, and bank records. Offer a parallel-run period where TaxShield calculates payroll without initiating payments. Demonstrate identical results before switching the production payroll workflow.
2.5 Recommended product positioning
Category: Open-core, audit-first small-business financial and payroll operating system.
Target segment:
Single-owner LLCs with accountable-plan expenses.
Owner-operated S-Corporations with 1–5 W-2 employees.
Small professional-services businesses.
Technical founders and privacy-conscious operators.
Businesses working with an external CPA or bookkeeper.
Avoid initially targeting:
Businesses with complex collective bargaining agreements.
Large multi-jurisdiction employers.
Highly complex benefits administration.
Employers requiring fully outsourced HR and payroll support.
One particularly important distinction: Schedule C bookkeeping and S-Corp payroll should not be treated as interchangeable tax workflows. An S-Corp shareholder-employee's reasonable compensation, payroll withholding, distributions, and accountable-plan reimbursements must be represented as distinct transaction classes.
3. Functional and statutory gap analysis
3.1 Gap priority matrix
Capability
Current position
Priority
Recommendation
Benefit deductions and wage treatment
Not specified
Critical
Build a rules-driven deduction engine
SUTA experience ratings
Not specified
Critical
Effective-dated employer rate histories
Federal/state unemployment wage bases
TaxPack architecture exists
Critical
Separate wage bases by jurisdiction and program
ACH direct deposit
Mercury integration
High
Build bank-agnostic ACH origination through partners
W-2/W-3 annual reporting
PDF generation
Critical
Add EFW2 and EFW2C
Form 941 reconciliation
Calculation capability implied
Critical
Add quarterly reconciliation workpapers and filing integration
Form 940 reconciliation
Not specified
High
Add FUTA annual workpapers and filing workflow
State unemployment returns
Not specified
High
State-specific return adapters
State new-hire reporting
Not specified
High
Reporting calendar and export/integration
Garnishments and levies
Not specified
High
Priority-ordered statutory deductions
Paid family/medical leave
State-specific coverage incomplete
High
Jurisdiction-specific contribution and wage rules
Workers' compensation
Not specified
Medium
Payroll-based premium reporting integration
Benefit eligibility and limits
Not specified
High
Effective-dated plan eligibility and statutory limits
PTO, sick leave and overtime
Not specified
High
State-specific accrual and overtime rules
A critical principle: payroll calculations require more than a tax rate table. They also require classification rules, wage bases, elections, employee-specific elections, employer-specific settings, caps, rounding conventions, and effective dates.
3.2 Flexible pre-tax and post-tax deduction engine
This is one of the most important additions.
A common mistake is to model a deduction as simply:
{ name: "Health Insurance", amount: 150, preTax: true }
That is inadequate because "pre-tax" is not one universal tax treatment.
A deduction can be exempt from federal income tax withholding but still subject to Social Security and Medicare taxes. Treatment may also differ between employer contributions and employee salary reductions.
For example, a properly structured Section 125 salary reduction arrangement can generally exclude qualifying health premiums from federal income tax withholding and FICA wages. An ordinary after-tax payroll deduction cannot.
The IRS's 2026 Publication 15 explicitly distinguishes HSA payroll deductions from HSA contributions made through a Section 125 salary reduction arrangement.
Internal Revenue Service+1
Recommended tax-treatment matrix
Deduction / benefit
FIT withholding wages
Social Security wages
Medicare wages
FUTA wages
Section 125 qualified health premiums
Generally excluded
Generally excluded
Generally excluded
Generally excluded
Traditional 401(k) salary deferral
Excluded
Included
Included
Included
Roth 401(k) deferral
Included
Included
Included
Included
Qualified Section 125 HSA salary reduction
Excluded
Excluded
Excluded
Generally excluded
Ordinary HSA payroll deduction outside Section 125
Included
Included
Included
Included
Qualified FSA salary reduction
Generally excluded
Generally excluded
Generally excluded
Generally excluded
After-tax insurance premium
Included
Included
Included
Included
Garnishment
No reduction in taxable wages
No reduction
No reduction
No reduction
State income-tax treatment must be independently configured. Do not assume federal treatment automatically applies to PA, NJ, NY, DE, or other jurisdictions.
The table is an implementation baseline, not a substitute for plan-specific qualification and statutory exceptions.
The right abstraction: tax treatment vectors
Every deduction should carry independent tax flags rather than a single Boolean.
type WageBase = | "FIT" | "SOCIAL_SECURITY" | "MEDICARE" | "ADDITIONAL_MEDICARE" | "FUTA" | "SUTA" | "STATE_PIT" | "LOCAL_EIT" | "PA_LST"; interface WageTreatment { reducesWithholdingWages: boolean; reducesReportedWages: boolean; } interface DeductionTaxTreatment { fit: WageTreatment; socialSecurity: WageTreatment; medicare: WageTreatment; additionalMedicare: WageTreatment; futa: WageTreatment; suta: WageTreatment; state: Record<string, WageTreatment>; local: Record<string, WageTreatment>; } interface EmployeeDeductionElection { employeeId: string; benefitPlanId: string; effectiveFrom: Date; effectiveTo?: Date; amountType: "FIXED" | "PERCENTAGE"; amount: string; frequency: "PER_PAY_PERIOD" | "MONTHLY" | "ANNUAL"; priority: number; taxTreatmentVersion: string; }
Do not allow a client-side checkbox to decide whether an employee deduction is tax-exempt.
The treatment must resolve through the TaxPack, applicable benefit-plan configuration, and employee election.
Important benefit-specific considerations
Section 125 plans
Support health, dental, vision, dependent-care, and qualifying HSA salary reductions.
Store plan documents and plan-year effective dates.
Validate employee eligibility and election windows.
Track employer contributions separately from employee salary reductions.
Enforce statutory exclusions and limits from effective-dated rules.
Traditional and Roth 401(k)
Traditional employee deferrals generally reduce federal income tax withholding wages but not Social Security or Medicare wages.
Roth employee deferrals generally do not reduce any of these wage bases.
Employer matching contributions must be separately represented.
Track annual employee deferral limits and catch-up eligibility using the applicable tax-year rules.
Support plan-level eligibility, contribution percentages, and annual maximums.
HSA and FSA
Distinguish Section 125 salary reductions from ordinary after-tax deductions.
Track employer contributions and employee contributions independently.
Support annual limits, eligibility, and mid-year coverage changes.
Handle dependent-care FSA and healthcare FSA as separate benefit types.
Architectural recommendation: Keep the calculation engine generic. Add benefit-specific validation modules, but never implement the tax treatment itself as scattered application conditionals.
3.3 State unemployment insurance: SUTA/SUI
SUTA needs to be treated as a company-specific tax configuration, not a generic state tax rate.
For example, two Pennsylvania employers may have different experience rates because of their unemployment insurance experience, industry classification, account history, and applicable state adjustments.
The same issue exists in other states, and rates can change annually or after an agency determination.
Recommended architecture
Separate three concepts:
Statutory state rules: taxable wage base, rate constraints, contribution rules, effective dates.
Employer-specific experience rating: assigned rate, notice reference, effective period.
Employee-level wage accumulation: taxable wages by employer, state, and calendar year.
interface ExperienceRate { companyId: string; jurisdictionCode: string; taxProgram: "SUTA"; rate: string; // Decimal, never floating point effectiveFrom: Date; effectiveTo?: Date; noticeReference?: string; sourceDocumentHash?: string; verifiedAt: Date; status: "PENDING" | "VERIFIED" | "SUPERSEDED"; } interface SutaTaxConfiguration { companyId: string; jurisdictionCode: string; stateEmployerAccountId: string; experienceRateId: string; taxYear: number; rulePackVersion: string; }
Calculation flow:
#chatgpt-mermaid-_r_q1_{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;fill:rgb(237, 237, 237);}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#chatgpt-mermaid-_r_q1_ .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-_r_q1_ .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-_r_q1_ .error-icon{fill:rgb(48, 48, 48);}#chatgpt-mermaid-_r_q1_ .error-text{fill:rgb(237, 237, 237);stroke:rgb(237, 237, 237);}#chatgpt-mermaid-_r_q1_ .edge-thickness-normal{stroke-width:1px;}#chatgpt-mermaid-_r_q1_ .edge-thickness-thick{stroke-width:3.5px;}#chatgpt-mermaid-_r_q1_ .edge-pattern-solid{stroke-dasharray:0;}#chatgpt-mermaid-_r_q1_ .edge-thickness-invisible{stroke-width:0;fill:none;}#chatgpt-mermaid-_r_q1_ .edge-pattern-dashed{stroke-dasharray:3;}#chatgpt-mermaid-_r_q1_ .edge-pattern-dotted{stroke-dasharray:2;}#chatgpt-mermaid-_r_q1_ .marker{fill:rgb(175, 175, 175);stroke:rgb(175, 175, 175);}#chatgpt-mermaid-_r_q1_ .marker.cross{stroke:rgb(175, 175, 175);}#chatgpt-mermaid-_r_q1_ svg{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;}#chatgpt-mermaid-_r_q1_ p{margin:0;}#chatgpt-mermaid-_r_q1_ .label{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";color:rgb(237, 237, 237);}#chatgpt-mermaid-_r_q1_ .cluster-label text{fill:rgb(237, 237, 237);}#chatgpt-mermaid-_r_q1_ .cluster-label span{color:rgb(237, 237, 237);}#chatgpt-mermaid-_r_q1_ .cluster-label span p{background-color:transparent;}#chatgpt-mermaid-_r_q1_ .label text,#chatgpt-mermaid-_r_q1_ span{fill:rgb(237, 237, 237);color:rgb(237, 237, 237);}#chatgpt-mermaid-_r_q1_ .node rect,#chatgpt-mermaid-_r_q1_ .node circle,#chatgpt-mermaid-_r_q1_ .node ellipse,#chatgpt-mermaid-_r_q1_ .node polygon,#chatgpt-mermaid-_r_q1_ .node path{fill:rgb(9, 23, 44);stroke:rgb(31, 78, 148);stroke-width:1px;}#chatgpt-mermaid-_r_q1_ .rough-node .label text,#chatgpt-mermaid-_r_q1_ .node .label text,#chatgpt-mermaid-_r_q1_ .image-shape .label,#chatgpt-mermaid-_r_q1_ .icon-shape .label{text-anchor:middle;}#chatgpt-mermaid-_r_q1_ .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#chatgpt-mermaid-_r_q1_ .rough-node .label,#chatgpt-mermaid-_r_q1_ .node .label,#chatgpt-mermaid-_r_q1_ .image-shape .label,#chatgpt-mermaid-_r_q1_ .icon-shape .label{text-align:center;}#chatgpt-mermaid-_r_q1_ .node.clickable{cursor:pointer;}#chatgpt-mermaid-_r_q1_ .root .anchor path{fill:rgb(175, 175, 175)!important;stroke-width:0;stroke:rgb(175, 175, 175);}#chatgpt-mermaid-_r_q1_ .arrowheadPath{fill:rgb(175, 175, 175);}#chatgpt-mermaid-_r_q1_ .edgePath .path{stroke:rgb(175, 175, 175);stroke-width:1px;}#chatgpt-mermaid-_r_q1_ .flowchart-link{stroke:rgb(175, 175, 175);fill:none;}#chatgpt-mermaid-_r_q1_ .edgeLabel{background-color:rgb(0, 0, 0);text-align:center;}#chatgpt-mermaid-_r_q1_ .edgeLabel p{background-color:rgb(0, 0, 0);}#chatgpt-mermaid-_r_q1_ .edgeLabel rect{opacity:0.5;background-color:rgb(0, 0, 0);fill:rgb(0, 0, 0);}#chatgpt-mermaid-_r_q1_ .labelBkg{background-color:rgba(0, 0, 0, 0.5);}#chatgpt-mermaid-_r_q1_ .cluster rect{fill:rgb(48, 48, 48);stroke:rgba(255, 255, 255, 0.15);stroke-width:1px;}#chatgpt-mermaid-_r_q1_ .cluster text{fill:rgb(237, 237, 237);}#chatgpt-mermaid-_r_q1_ .cluster span{color:rgb(237, 237, 237);}#chatgpt-mermaid-_r_q1_ div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:12px;background:rgb(48, 48, 48);border:1px solid rgba(255, 255, 255, 0.15);border-radius:2px;pointer-events:none;z-index:100;}#chatgpt-mermaid-_r_q1_ .flowchartTitleText{text-anchor:middle;font-size:18px;fill:rgb(237, 237, 237);}#chatgpt-mermaid-_r_q1_ rect.text{fill:none;stroke-width:0;}#chatgpt-mermaid-_r_q1_ .icon-shape,#chatgpt-mermaid-_r_q1_ .image-shape{background-color:rgb(0, 0, 0);text-align:center;}#chatgpt-mermaid-_r_q1_ .icon-shape p,#chatgpt-mermaid-_r_q1_ .image-shape p{background-color:rgb(0, 0, 0);padding:2px;}#chatgpt-mermaid-_r_q1_ .icon-shape .label rect,#chatgpt-mermaid-_r_q1_ .image-shape .label rect{opacity:0.5;background-color:rgb(0, 0, 0);fill:rgb(0, 0, 0);}#chatgpt-mermaid-_r_q1_ .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#chatgpt-mermaid-_r_q1_ .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#chatgpt-mermaid-_r_q1_ .node .neo-node{stroke:rgb(31, 78, 148);}#chatgpt-mermaid-_r_q1_ [data-look="neo"].node rect,#chatgpt-mermaid-_r_q1_ [data-look="neo"].cluster rect,#chatgpt-mermaid-_r_q1_ [data-look="neo"].node polygon{stroke:url(#chatgpt-mermaid-_r_q1_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_q1_ [data-look="neo"].swimlane.cluster rect{filter:none;}#chatgpt-mermaid-_r_q1_ [data-look="neo"].node path{stroke:url(#chatgpt-mermaid-_r_q1_-gradient);stroke-width:1px;}#chatgpt-mermaid-_r_q1_ [data-look="neo"].node .outer-path{filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_q1_ [data-look="neo"].node .neo-line path{stroke:rgb(31, 78, 148);filter:none;}#chatgpt-mermaid-_r_q1_ [data-look="neo"].node circle{stroke:url(#chatgpt-mermaid-_r_q1_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_q1_ [data-look="neo"].node circle .state-start{fill:#000000;}#chatgpt-mermaid-_r_q1_ [data-look="neo"].icon-shape .icon{fill:url(#chatgpt-mermaid-_r_q1_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_q1_ [data-look="neo"].icon-shape .icon-neo path{stroke:url(#chatgpt-mermaid-_r_q1_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_q1_ .node text{font-size:14px;font-weight:600;letter-spacing:normal;fill:rgb(153, 206, 255);}#chatgpt-mermaid-_r_q1_ .edgeLabels text{font-size:13px;font-weight:600;letter-spacing:-0.08px;fill:rgb(153, 206, 255);}#chatgpt-mermaid-_r_q1_ .node tspan[font-weight="normal"],#chatgpt-mermaid-_r_q1_ .edgeLabels tspan[font-weight="normal"]{font-weight:600;}#chatgpt-mermaid-_r_q1_ .edgeLabel .label rect{opacity:1;rx:13px;ry:13px;fill:rgb(0, 14, 26);stroke:rgb(26, 62, 95);stroke-width:1px;}#chatgpt-mermaid-_r_q1_ .node rect,#chatgpt-mermaid-_r_q1_ .node circle,#chatgpt-mermaid-_r_q1_ .node ellipse,#chatgpt-mermaid-_r_q1_ .node polygon,#chatgpt-mermaid-_r_q1_ .node path{fill:rgb(0, 40, 77);stroke:rgba(255, 255, 255, 0.1);stroke-width:1px;}#chatgpt-mermaid-_r_q1_ .node rect{rx:16px;ry:16px;}#chatgpt-mermaid-_r_q1_ .mermaid-decision .label-container{fill:rgb(0, 14, 26);stroke:rgb(26, 62, 95);stroke-dasharray:2,2;}#chatgpt-mermaid-_r_q1_ .edgePaths .flowchart-link{stroke:rgb(175, 175, 175);stroke-width:1px;stroke-linecap:round;stroke-linejoin:round;}#chatgpt-mermaid-_r_q1_ .marker{fill:rgb(175, 175, 175);stroke:rgb(175, 175, 175);}#chatgpt-mermaid-_r_q1_ :root{--mermaid-font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";}Payroll RunResolve Work and ResidenceJurisdictionsResolve State TaxPackResolve Company ExperienceRateLoad Employee SUTA WageAccumulatorApply Effective Wage Base andTaxable WagesCalculate Employer SUTALiabilityImmutable CalculationSnapshotQuarterly SUTA Reconciliation
Critical rule: Never infer an employer's experience rate from a state default after the employer has an assigned rate.
The new-employer rate is a statutory fallback, not a substitute for an assigned experience rate.
Also, do not assume that every state uses the same wage-base reset or rate-change behavior. Some states have additional surcharges, solvency assessments, or separate unemployment programs.
For Pennsylvania, for example, the architecture must account for the employer's UC account number and assigned contribution rate, rather than treating SUTA as an ordinary employee withholding item.
3.4 Direct deposit without requiring Mercury
This is an important commercial gap.
The right solution is not to integrate individually with Chase, Bank of America, Wells Fargo, and every regional bank.
Direct deposit is not a bank-account-to-bank-account API problem. It is an ACH origination problem.
An employer's bank, acting as the originating depository financial institution (ODFI), or an authorized payment partner with an ODFI relationship, can originate ACH credits to employees' receiving banks.
Recommended implementation
One payment abstraction, multiple execution adapters
TaxShield Payroll Ledger
Net pay • Deductions • Tax liabilities • Approval
Payment Orchestration Service
Idempotency • Authorization • Funding validation • Status tracking
ACH partner
Partner-sponsored ODFI
Employer bank
Approved NACHA file upload
ACH Network
Employee receiving financial institutions
I recommend three execution modes:
Mode
Execution
Target customer
Bank-export mode
Generate NACHA file for bank upload
OSS and technically capable owners
Partner ACH mode
API submission to sponsored ACH originator
Commercial SaaS
Mercury mode
Existing bank-specific integration
Existing Mercury users
A crucial distinction: generating a NACHA file does not grant the business permission to originate ACH entries. The bank must authorize the originator, establish the appropriate company identification, SEC code, limits, security controls, and file-delivery process.
Provider evaluation
Provider
Best architectural role
Recommendation
Check Technologies
Embedded payroll, tax calculations, filings and payments
Evaluate first for payroll infrastructure
Moov
ACH payment initiation and movement
Evaluate for commercial disbursements
Modern Treasury
Payment orchestration, reconciliation and bank integrations
Strong complement, not a complete payroll product
Zeal
Embedded payroll and payment workflows
Evaluate as an alternative to Check
These are different categories of providers. Do not treat them as interchangeable.
In particular, a payment orchestration provider is not necessarily responsible for payroll tax calculations, employment tax filing, state registration, or compliance guarantees.
Recommended approach: Use a provider adapter interface so the core payroll ledger is independent of any one partner. Require each provider to disclose its ODFI/sponsoring-bank arrangement, ACH return handling, funding model, transaction limits, settlement timing, and responsibility for errors.
3.5 EFW2: SSA annual W-2 electronic filing
This should be a Wave 2 deliverable.
The Social Security Administration publishes the annual EFW2 and EFW2C specifications. For Tax Year 2026, Publication 42-007 is the applicable EFW2 specification, with Publication 42-014 covering corrections.
Social Security+1
Key technical requirements:
Fixed-width records, not CSV.
Correct record types and sequence.
Employer-level, employee-level, and totals records.
Exact field positions, lengths, and numeric formatting.
Correct wage and withholding boxes.
Proper handling of state and local wage reporting.
Annual validation and correction support.
The implementation should include:
Component
Responsibility
W-2 domain model
Maintain source-of-truth wage and withholding amounts
EFW2 serializer
Generate fixed-width SSA records
EFW2 validator
Validate lengths, fields, totals, and relationships
AccuWage test workflow
Pre-submission validation
BSO submission workflow
Employer-authorized upload
Acknowledgment tracker
Store acceptance, rejection, and correction status
The SSA provides W-2 Online and formatted EFW2 upload through Business Services Online. The IRS's electronic filing threshold is generally 10 or more information returns, with applicable exceptions and waiver provisions.
SSA+1
Important design decision: Do not make PDF generation the foundation of annual payroll reporting. The W-2 PDF is an employee-facing rendering; EFW2 is a separate machine-readable submission format.
3.6 Forms 941 and 940: quarterly and annual reconciliation
Form 941 is not simply a report generated from the latest payroll run. It is a quarterly reconciliation of payroll liabilities, deposits, adjustments, and credits.
Form 940 is the annual federal unemployment tax reconciliation.
The IRS accepts electronic filing for both through the Modernized e-File (MeF) employment tax program.
Internal Revenue Service+1
Form 941 workpaper
The payroll engine should generate a quarter-specific reconciliation object containing:
Federal income tax withheld.
Social Security wages and tax.
Medicare wages and tax.
Additional Medicare withholding, where applicable.
Taxable wage adjustments.
Current-quarter liability by payroll date.
Deposits and payment credits.
Prior-quarter adjustments.
Overpayment or balance due.
Schedule B liability data, where applicable.
The most important design principle is to reconcile tax liability by the date wages were paid, not merely by the payroll period end date.
Form 940 workpaper
The annual reconciliation must track:
Total payments to employees.
Exempt payments.
FUTA taxable wages.
State unemployment contributions.
Credit eligibility and limitations.
Credit-reduction states and applicable Schedule A.
Quarterly FUTA liability and deposit requirements.
E-filing architecture
The IRS MeF employment-tax program uses XML schemas and business rules, not PDF uploads as the primary electronic return format. Software developers and transmitters must complete the applicable IRS authorization and assurance-testing process.
Internal Revenue Service+2
I recommend building the 941 and 940 workpapers first, then using an approved transmission partner rather than immediately implementing a complete IRS MeF transmission stack.
3.7 Full-service versus self-service: the regulatory strategy
There is one important correction to the premise in the project brief:
An open-source payroll application does not automatically need 50-state Money Transmitter Licenses merely because it calculates payroll or generates payment instructions.
Money transmission depends on what the business actually does with funds, not whether it is open-source or commercial.
FinCEN's regulations contain exclusions for certain payment-processing and software-related activities. The federal analysis and individual state money-transmission laws are separate questions. The result depends on the actual flow of funds, agency relationships, custody, and contractual arrangements.
Federal Reserve+2
There are also important distinctions between:
Initiating a payment instruction.
Originating an ACH entry.
Acting as an agent for a bank or payment provider.
Taking possession or control of customer funds.
Holding funds in an escrow or custodial account.
These are not legally equivalent activities.
You do not need to build an escrow business to provide an excellent payroll product.
3.7.1 OSS: deliver near-full-service without custody
I recommend an Employer-Controlled Payroll Execution model.
TaxShield performs all calculations, prepares all payment instructions, creates the compliance calendar, and reconciles payment confirmations.
The employer remains the account holder and authorizes payments directly through their bank or government payment portal.
The product should provide a guided workflow:
Step
TaxShield capability
Employer responsibility
1. Run payroll
Calculate gross pay, deductions, net pay and taxes
Review
2. Approve payroll
Lock calculation snapshot
Authorize
3. Pay employees
Generate NACHA file or payment instructions
Submit through bank
4. Pay federal liabilities
Generate EFTPS instructions and payment schedule
Authorize EFTPS payment
5. Pay state/local liabilities
Generate jurisdiction-specific payment instructions
Submit to DOR/collector
6. File returns
Generate completed workpapers and filing-ready exports
Sign and file, or authorize a CPA
7. Reconcile
Match bank transactions and payment confirmations
Resolve exceptions
For federal employment taxes, the IRS generally requires electronic deposits. Employers can use EFTPS, their business tax account, business Direct Pay where supported, or qualifying financial institution and third-party methods. The deposit schedule depends on the employer's applicable deposit rules.
Internal Revenue Service+2
The OSS experience should therefore include:
A payroll-to-tax-payment checklist.
Exact tax type and tax period.
Payment amount.
Payment deadline.
Agency destination.
Payment reference or confirmation number.
A downloadable evidence packet.
Reconciliation status.
A feature worth building: Payroll Payment Concierge
High strategic value
An owner completes payroll and sees three separate approved obligations:
Employee net-pay batch.
Federal employment-tax deposit.
State/local payroll-tax deposits.
Each has its own authorization, payment status, confirmation evidence, and reconciliation.
The application never takes possession of the money.
This delivers a near-full-service experience without claiming that TaxShield itself has remitted or filed something that the employer has not actually completed.
3.7.2 Commercial SaaS: build versus partner
There are three distinct business models.
Model
What TaxShield owns
Regulatory/operational burden
Software-only
Calculations, ledger, instructions
Relatively low, subject to normal tax/software obligations
Partner-enabled
Calculations, ledger, customer workflow; partner executes payments and/or filings
Moderate; partner oversight and contractual allocation
Full-service reporting agent
Filing authorization, tax reporting workflow, potentially payment administration
Substantially higher operational and compliance burden
A reporting agent is not necessarily a money transmitter. IRS reporting-agent status concerns federal tax authorization and filing, not a blanket authorization to custody or transmit funds.
The IRS requires reporting agents to follow Revenue Procedure 2012-32 and obtain Form 8655 authorization for each client whose returns they handle.
Internal Revenue Service+1
Build-versus-partner matrix
Dimension
Build full-service yourself
Partner with embedded infrastructure
Initial development
Very high
Moderate
Compliance operations
Very high
Shared, contract-dependent
Tax filing expertise
Must develop internally
Provider may supply
ACH infrastructure
Must establish banking relationships
Provider may supply
Customer control
Highest
Depends on provider
Gross margin potential
Higher at scale
Lower due to provider costs
Time to market
Long
Shorter
Multi-state expansion
Expensive
Potentially faster
Provider dependency
Low
Medium-high
Incident responsibility
Direct
Shared but not eliminated
My decision: partner first, selectively internalize later.
Do not make the mistake of building an entire regulated financial infrastructure before validating customer demand.
Provider-specific evaluation
[Payroll Infrastructure Startup Check Announces $75 Million Series C Led by Stripe](https://images.openai.com/static-rsc-4/L9fB23JORrZQzQKC5hvVen7ji8v0MKbXkN8J8UYoGucvRnr4xe5nbhZ-MymIbWkeaWyKhQ46OvsyEi1eqQLzKpzeXqdej-iMafLcux_t6i2iZDX44DQx5zg6p7OQhoyr1wG5KfDcIOyefHXGrqsOvz7LjTI9MUEz2eJYWRlGUDM?purpose=inline)
1. Check Technologies
First evaluation priority
Strong alignment with embedded payroll, tax filings, and payroll infrastructure. Its developer documentation exposes filing-status information and tax-document workflows.
The filings API supports visibility into upcoming and completed tax filings, including blocked filings and reasons.
Check API
Question to ask: Can TaxShield retain its own calculation engine and use Check only for payroll infrastructure, payments, and filings? What tax jurisdictions and employer configurations are supported?
[Moov Financial (@moov) on X](https://images.openai.com/static-rsc-4/SxCHGusbkvNr_RQce85GISn92Iba1lUxyZWPkAA6Huz9BMYK4P33l7Oow5lSdGfQXgwSqdrzNqlFx9EUFDMtJH_DU0spSWdMEDFamcPdCBEYeCPuX4YkesuXqe5E4LJ45mS4lew5P59aFKDaInajcx2t6dyrLO7t6yUYcuKooxs?purpose=inline)
2. Moov
Best evaluated as an ACH and payment infrastructure option.
Potentially useful for employee direct deposit and payment orchestration. It should not be assumed to provide all payroll tax filing and employer registration functions.
Question to ask: Who is the ODFI, who bears ACH return risk, and what originator underwriting and funding requirements apply?
[Modern Treasury lands $50m in Series C extension](https://images.openai.com/static-rsc-4/ccwy5ECBsPsv984ktEaDDHzSe19_XT70Sl2BUwuMHnkBWt4AfgGsFnR08SfPiryXOIoDSJ26BTYSS8YVmkQ7ihhRX8yx719hKzldmNVsSxK98m5QTR9YyFnVmb5HgbCqWCSqyVTZsoFKW99VdX2Iay_fSJgAqWg5N7usZ6JO06E?purpose=inline)
3. Modern Treasury
Best evaluated as a financial operations and payment orchestration layer.
Particularly attractive if TaxShield eventually needs multiple payment providers, bank integrations, reconciliation workflows, and a unified payment state machine.
It is not a substitute for a complete payroll tax filing provider.
[Zeal - Crunchbase Company Profile & Funding](https://images.openai.com/static-rsc-4/Zsj4W1AZ3SOWyWllF9RHzPPJlkoIc0dbhaACrjly5FDMKcM2jvXKbGQSj4ktHZPTHGl6ZJf0svM3PBuXhx_4mk6_6r_oiKi0fz_8F_G6rRcyYSrSJWNEtVVzbvfnITvphnmJY8u-E4IKBet5aIV50JEyCSo1CdgGyAPDg_HBIXs?purpose=inline)
4. Zeal
Evaluate as an embedded payroll alternative.
The critical question is whether its tax, payment, and reporting services allow TaxShield to retain the authoritative financial ledger and tax-rule calculation layer.
These are shortlist recommendations, not claims that every provider currently offers an interchangeable white-label product or identical state coverage. Obtain commercial proposals, service descriptions, API specifications, and a jurisdiction-by-jurisdiction coverage matrix before selecting one.
3.7.3 Commercial architecture I would choose
#chatgpt-mermaid-_r_sd_{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;fill:rgb(237, 237, 237);}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#chatgpt-mermaid-_r_sd_ .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-_r_sd_ .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-_r_sd_ .error-icon{fill:rgb(48, 48, 48);}#chatgpt-mermaid-_r_sd_ .error-text{fill:rgb(237, 237, 237);stroke:rgb(237, 237, 237);}#chatgpt-mermaid-_r_sd_ .edge-thickness-normal{stroke-width:1px;}#chatgpt-mermaid-_r_sd_ .edge-thickness-thick{stroke-width:3.5px;}#chatgpt-mermaid-_r_sd_ .edge-pattern-solid{stroke-dasharray:0;}#chatgpt-mermaid-_r_sd_ .edge-thickness-invisible{stroke-width:0;fill:none;}#chatgpt-mermaid-_r_sd_ .edge-pattern-dashed{stroke-dasharray:3;}#chatgpt-mermaid-_r_sd_ .edge-pattern-dotted{stroke-dasharray:2;}#chatgpt-mermaid-_r_sd_ .marker{fill:rgb(175, 175, 175);stroke:rgb(175, 175, 175);}#chatgpt-mermaid-_r_sd_ .marker.cross{stroke:rgb(175, 175, 175);}#chatgpt-mermaid-_r_sd_ svg{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;}#chatgpt-mermaid-_r_sd_ p{margin:0;}#chatgpt-mermaid-_r_sd_ .label{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";color:rgb(237, 237, 237);}#chatgpt-mermaid-_r_sd_ .cluster-label text{fill:rgb(237, 237, 237);}#chatgpt-mermaid-_r_sd_ .cluster-label span{color:rgb(237, 237, 237);}#chatgpt-mermaid-_r_sd_ .cluster-label span p{background-color:transparent;}#chatgpt-mermaid-_r_sd_ .label text,#chatgpt-mermaid-_r_sd_ span{fill:rgb(237, 237, 237);color:rgb(237, 237, 237);}#chatgpt-mermaid-_r_sd_ .node rect,#chatgpt-mermaid-_r_sd_ .node circle,#chatgpt-mermaid-_r_sd_ .node ellipse,#chatgpt-mermaid-_r_sd_ .node polygon,#chatgpt-mermaid-_r_sd_ .node path{fill:rgb(9, 23, 44);stroke:rgb(31, 78, 148);stroke-width:1px;}#chatgpt-mermaid-_r_sd_ .rough-node .label text,#chatgpt-mermaid-_r_sd_ .node .label text,#chatgpt-mermaid-_r_sd_ .image-shape .label,#chatgpt-mermaid-_r_sd_ .icon-shape .label{text-anchor:middle;}#chatgpt-mermaid-_r_sd_ .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#chatgpt-mermaid-_r_sd_ .rough-node .label,#chatgpt-mermaid-_r_sd_ .node .label,#chatgpt-mermaid-_r_sd_ .image-shape .label,#chatgpt-mermaid-_r_sd_ .icon-shape .label{text-align:center;}#chatgpt-mermaid-_r_sd_ .node.clickable{cursor:pointer;}#chatgpt-mermaid-_r_sd_ .root .anchor path{fill:rgb(175, 175, 175)!important;stroke-width:0;stroke:rgb(175, 175, 175);}#chatgpt-mermaid-_r_sd_ .arrowheadPath{fill:rgb(175, 175, 175);}#chatgpt-mermaid-_r_sd_ .edgePath .path{stroke:rgb(175, 175, 175);stroke-width:1px;}#chatgpt-mermaid-_r_sd_ .flowchart-link{stroke:rgb(175, 175, 175);fill:none;}#chatgpt-mermaid-_r_sd_ .edgeLabel{background-color:rgb(0, 0, 0);text-align:center;}#chatgpt-mermaid-_r_sd_ .edgeLabel p{background-color:rgb(0, 0, 0);}#chatgpt-mermaid-_r_sd_ .edgeLabel rect{opacity:0.5;background-color:rgb(0, 0, 0);fill:rgb(0, 0, 0);}#chatgpt-mermaid-_r_sd_ .labelBkg{background-color:rgba(0, 0, 0, 0.5);}#chatgpt-mermaid-_r_sd_ .cluster rect{fill:rgb(48, 48, 48);stroke:rgba(255, 255, 255, 0.15);stroke-width:1px;}#chatgpt-mermaid-_r_sd_ .cluster text{fill:rgb(237, 237, 237);}#chatgpt-mermaid-_r_sd_ .cluster span{color:rgb(237, 237, 237);}#chatgpt-mermaid-_r_sd_ div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:12px;background:rgb(48, 48, 48);border:1px solid rgba(255, 255, 255, 0.15);border-radius:2px;pointer-events:none;z-index:100;}#chatgpt-mermaid-_r_sd_ .flowchartTitleText{text-anchor:middle;font-size:18px;fill:rgb(237, 237, 237);}#chatgpt-mermaid-_r_sd_ rect.text{fill:none;stroke-width:0;}#chatgpt-mermaid-_r_sd_ .icon-shape,#chatgpt-mermaid-_r_sd_ .image-shape{background-color:rgb(0, 0, 0);text-align:center;}#chatgpt-mermaid-_r_sd_ .icon-shape p,#chatgpt-mermaid-_r_sd_ .image-shape p{background-color:rgb(0, 0, 0);padding:2px;}#chatgpt-mermaid-_r_sd_ .icon-shape .label rect,#chatgpt-mermaid-_r_sd_ .image-shape .label rect{opacity:0.5;background-color:rgb(0, 0, 0);fill:rgb(0, 0, 0);}#chatgpt-mermaid-_r_sd_ .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#chatgpt-mermaid-_r_sd_ .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#chatgpt-mermaid-_r_sd_ .node .neo-node{stroke:rgb(31, 78, 148);}#chatgpt-mermaid-_r_sd_ [data-look="neo"].node rect,#chatgpt-mermaid-_r_sd_ [data-look="neo"].cluster rect,#chatgpt-mermaid-_r_sd_ [data-look="neo"].node polygon{stroke:url(#chatgpt-mermaid-_r_sd_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_sd_ [data-look="neo"].swimlane.cluster rect{filter:none;}#chatgpt-mermaid-_r_sd_ [data-look="neo"].node path{stroke:url(#chatgpt-mermaid-_r_sd_-gradient);stroke-width:1px;}#chatgpt-mermaid-_r_sd_ [data-look="neo"].node .outer-path{filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_sd_ [data-look="neo"].node .neo-line path{stroke:rgb(31, 78, 148);filter:none;}#chatgpt-mermaid-_r_sd_ [data-look="neo"].node circle{stroke:url(#chatgpt-mermaid-_r_sd_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_sd_ [data-look="neo"].node circle .state-start{fill:#000000;}#chatgpt-mermaid-_r_sd_ [data-look="neo"].icon-shape .icon{fill:url(#chatgpt-mermaid-_r_sd_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_sd_ [data-look="neo"].icon-shape .icon-neo path{stroke:url(#chatgpt-mermaid-_r_sd_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_sd_ .node text{font-size:14px;font-weight:600;letter-spacing:normal;fill:rgb(153, 206, 255);}#chatgpt-mermaid-_r_sd_ .edgeLabels text{font-size:13px;font-weight:600;letter-spacing:-0.08px;fill:rgb(153, 206, 255);}#chatgpt-mermaid-_r_sd_ .node tspan[font-weight="normal"],#chatgpt-mermaid-_r_sd_ .edgeLabels tspan[font-weight="normal"]{font-weight:600;}#chatgpt-mermaid-_r_sd_ .edgeLabel .label rect{opacity:1;rx:13px;ry:13px;fill:rgb(0, 14, 26);stroke:rgb(26, 62, 95);stroke-width:1px;}#chatgpt-mermaid-_r_sd_ .node rect,#chatgpt-mermaid-_r_sd_ .node circle,#chatgpt-mermaid-_r_sd_ .node ellipse,#chatgpt-mermaid-_r_sd_ .node polygon,#chatgpt-mermaid-_r_sd_ .node path{fill:rgb(0, 40, 77);stroke:rgba(255, 255, 255, 0.1);stroke-width:1px;}#chatgpt-mermaid-_r_sd_ .node rect{rx:16px;ry:16px;}#chatgpt-mermaid-_r_sd_ .mermaid-decision .label-container{fill:rgb(0, 14, 26);stroke:rgb(26, 62, 95);stroke-dasharray:2,2;}#chatgpt-mermaid-_r_sd_ .edgePaths .flowchart-link{stroke:rgb(175, 175, 175);stroke-width:1px;stroke-linecap:round;stroke-linejoin:round;}#chatgpt-mermaid-_r_sd_ .marker{fill:rgb(175, 175, 175);stroke:rgb(175, 175, 175);}#chatgpt-mermaid-_r_sd_ :root{--mermaid-font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";}TaxShield SaaSPayroll Calculation EngineImmutable CalculationSnapshotTax Liability LedgerNet Pay LedgerTax Filing AdapterPayment OrchestrationAdapterEmbedded Payroll Tax PartnerACH Payment PartnerIRS and State AgenciesEmployee Bank AccountsTax Filing AcknowledgmentsACH Settlement and ReturnsTaxShield Reconciliation
The important architectural rule is that neither the partner's tax calculations nor its payment records should overwrite TaxShield's original calculation snapshot.
Instead, partner results become external evidence attached to an existing payroll transaction.
4. Technical architecture and schema recommendations
I would introduce a dedicated domain boundary between payroll calculation, benefit administration, tax obligations, and money movement.
The current stack—React, Express, Prisma, and PostgreSQL—is sufficient for this. You do not need microservices immediately.
Use modular services and explicit domain events inside the existing backend.
4.1 Recommended domain boundaries
#chatgpt-mermaid-_r_sk_{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;fill:rgb(237, 237, 237);}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#chatgpt-mermaid-_r_sk_ .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-_r_sk_ .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-_r_sk_ .error-icon{fill:rgb(48, 48, 48);}#chatgpt-mermaid-_r_sk_ .error-text{fill:rgb(237, 237, 237);stroke:rgb(237, 237, 237);}#chatgpt-mermaid-_r_sk_ .edge-thickness-normal{stroke-width:1px;}#chatgpt-mermaid-_r_sk_ .edge-thickness-thick{stroke-width:3.5px;}#chatgpt-mermaid-_r_sk_ .edge-pattern-solid{stroke-dasharray:0;}#chatgpt-mermaid-_r_sk_ .edge-thickness-invisible{stroke-width:0;fill:none;}#chatgpt-mermaid-_r_sk_ .edge-pattern-dashed{stroke-dasharray:3;}#chatgpt-mermaid-_r_sk_ .edge-pattern-dotted{stroke-dasharray:2;}#chatgpt-mermaid-_r_sk_ .marker{fill:rgb(175, 175, 175);stroke:rgb(175, 175, 175);}#chatgpt-mermaid-_r_sk_ .marker.cross{stroke:rgb(175, 175, 175);}#chatgpt-mermaid-_r_sk_ svg{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;}#chatgpt-mermaid-_r_sk_ p{margin:0;}#chatgpt-mermaid-_r_sk_ .label{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";color:rgb(237, 237, 237);}#chatgpt-mermaid-_r_sk_ .cluster-label text{fill:rgb(237, 237, 237);}#chatgpt-mermaid-_r_sk_ .cluster-label span{color:rgb(237, 237, 237);}#chatgpt-mermaid-_r_sk_ .cluster-label span p{background-color:transparent;}#chatgpt-mermaid-_r_sk_ .label text,#chatgpt-mermaid-_r_sk_ span{fill:rgb(237, 237, 237);color:rgb(237, 237, 237);}#chatgpt-mermaid-_r_sk_ .node rect,#chatgpt-mermaid-_r_sk_ .node circle,#chatgpt-mermaid-_r_sk_ .node ellipse,#chatgpt-mermaid-_r_sk_ .node polygon,#chatgpt-mermaid-_r_sk_ .node path{fill:rgb(9, 23, 44);stroke:rgb(31, 78, 148);stroke-width:1px;}#chatgpt-mermaid-_r_sk_ .rough-node .label text,#chatgpt-mermaid-_r_sk_ .node .label text,#chatgpt-mermaid-_r_sk_ .image-shape .label,#chatgpt-mermaid-_r_sk_ .icon-shape .label{text-anchor:middle;}#chatgpt-mermaid-_r_sk_ .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#chatgpt-mermaid-_r_sk_ .rough-node .label,#chatgpt-mermaid-_r_sk_ .node .label,#chatgpt-mermaid-_r_sk_ .image-shape .label,#chatgpt-mermaid-_r_sk_ .icon-shape .label{text-align:center;}#chatgpt-mermaid-_r_sk_ .node.clickable{cursor:pointer;}#chatgpt-mermaid-_r_sk_ .root .anchor path{fill:rgb(175, 175, 175)!important;stroke-width:0;stroke:rgb(175, 175, 175);}#chatgpt-mermaid-_r_sk_ .arrowheadPath{fill:rgb(175, 175, 175);}#chatgpt-mermaid-_r_sk_ .edgePath .path{stroke:rgb(175, 175, 175);stroke-width:1px;}#chatgpt-mermaid-_r_sk_ .flowchart-link{stroke:rgb(175, 175, 175);fill:none;}#chatgpt-mermaid-_r_sk_ .edgeLabel{background-color:rgb(0, 0, 0);text-align:center;}#chatgpt-mermaid-_r_sk_ .edgeLabel p{background-color:rgb(0, 0, 0);}#chatgpt-mermaid-_r_sk_ .edgeLabel rect{opacity:0.5;background-color:rgb(0, 0, 0);fill:rgb(0, 0, 0);}#chatgpt-mermaid-_r_sk_ .labelBkg{background-color:rgba(0, 0, 0, 0.5);}#chatgpt-mermaid-_r_sk_ .cluster rect{fill:rgb(48, 48, 48);stroke:rgba(255, 255, 255, 0.15);stroke-width:1px;}#chatgpt-mermaid-_r_sk_ .cluster text{fill:rgb(237, 237, 237);}#chatgpt-mermaid-_r_sk_ .cluster span{color:rgb(237, 237, 237);}#chatgpt-mermaid-_r_sk_ div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:12px;background:rgb(48, 48, 48);border:1px solid rgba(255, 255, 255, 0.15);border-radius:2px;pointer-events:none;z-index:100;}#chatgpt-mermaid-_r_sk_ .flowchartTitleText{text-anchor:middle;font-size:18px;fill:rgb(237, 237, 237);}#chatgpt-mermaid-_r_sk_ rect.text{fill:none;stroke-width:0;}#chatgpt-mermaid-_r_sk_ .icon-shape,#chatgpt-mermaid-_r_sk_ .image-shape{background-color:rgb(0, 0, 0);text-align:center;}#chatgpt-mermaid-_r_sk_ .icon-shape p,#chatgpt-mermaid-_r_sk_ .image-shape p{background-color:rgb(0, 0, 0);padding:2px;}#chatgpt-mermaid-_r_sk_ .icon-shape .label rect,#chatgpt-mermaid-_r_sk_ .image-shape .label rect{opacity:0.5;background-color:rgb(0, 0, 0);fill:rgb(0, 0, 0);}#chatgpt-mermaid-_r_sk_ .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#chatgpt-mermaid-_r_sk_ .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#chatgpt-mermaid-_r_sk_ .node .neo-node{stroke:rgb(31, 78, 148);}#chatgpt-mermaid-_r_sk_ [data-look="neo"].node rect,#chatgpt-mermaid-_r_sk_ [data-look="neo"].cluster rect,#chatgpt-mermaid-_r_sk_ [data-look="neo"].node polygon{stroke:url(#chatgpt-mermaid-_r_sk_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_sk_ [data-look="neo"].swimlane.cluster rect{filter:none;}#chatgpt-mermaid-_r_sk_ [data-look="neo"].node path{stroke:url(#chatgpt-mermaid-_r_sk_-gradient);stroke-width:1px;}#chatgpt-mermaid-_r_sk_ [data-look="neo"].node .outer-path{filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_sk_ [data-look="neo"].node .neo-line path{stroke:rgb(31, 78, 148);filter:none;}#chatgpt-mermaid-_r_sk_ [data-look="neo"].node circle{stroke:url(#chatgpt-mermaid-_r_sk_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_sk_ [data-look="neo"].node circle .state-start{fill:#000000;}#chatgpt-mermaid-_r_sk_ [data-look="neo"].icon-shape .icon{fill:url(#chatgpt-mermaid-_r_sk_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_sk_ [data-look="neo"].icon-shape .icon-neo path{stroke:url(#chatgpt-mermaid-_r_sk_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_sk_ .node text{font-size:14px;font-weight:600;letter-spacing:normal;fill:rgb(153, 206, 255);}#chatgpt-mermaid-_r_sk_ .edgeLabels text{font-size:13px;font-weight:600;letter-spacing:-0.08px;fill:rgb(153, 206, 255);}#chatgpt-mermaid-_r_sk_ .node tspan[font-weight="normal"],#chatgpt-mermaid-_r_sk_ .edgeLabels tspan[font-weight="normal"]{font-weight:600;}#chatgpt-mermaid-_r_sk_ .edgeLabel .label rect{opacity:1;rx:13px;ry:13px;fill:rgb(0, 14, 26);stroke:rgb(26, 62, 95);stroke-width:1px;}#chatgpt-mermaid-_r_sk_ .node rect,#chatgpt-mermaid-_r_sk_ .node circle,#chatgpt-mermaid-_r_sk_ .node ellipse,#chatgpt-mermaid-_r_sk_ .node polygon,#chatgpt-mermaid-_r_sk_ .node path{fill:rgb(0, 40, 77);stroke:rgba(255, 255, 255, 0.1);stroke-width:1px;}#chatgpt-mermaid-_r_sk_ .node rect{rx:16px;ry:16px;}#chatgpt-mermaid-_r_sk_ .mermaid-decision .label-container{fill:rgb(0, 14, 26);stroke:rgb(26, 62, 95);stroke-dasharray:2,2;}#chatgpt-mermaid-_r_sk_ .edgePaths .flowchart-link{stroke:rgb(175, 175, 175);stroke-width:1px;stroke-linecap:round;stroke-linejoin:round;}#chatgpt-mermaid-_r_sk_ .marker{fill:rgb(175, 175, 175);stroke:rgb(175, 175, 175);}#chatgpt-mermaid-_r_sk_ :root{--mermaid-font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";}CompliancePaymentsTaxPayroll941 and 940 WorkpapersEFW2 and State ExportsFiling AcknowledgmentsPayment OrchestratorACH File GeneratorPartner AdaptersPayment ReconciliationTaxPack ResolverWage AccumulatorsTax Liability LedgerCalculation SnapshotsEmployee and CompensationBenefit Plans and DeductionsPayroll Calculation
4.2 BenefitPlan and EmployeeDeduction
The benefit model should describe the plan, not the individual payroll transaction.
The employee deduction model should describe the election and the amount actually withheld.
Employer contributions must be separately recorded.
enum BenefitType { MEDICAL DENTAL VISION HSA HEALTH_FSA DEPENDENT_CARE_FSA TRADITIONAL_401K ROTH_401K LIFE_INSURANCE DISABILITY OTHER } enum ElectionAmountType { FIXED PERCENTAGE } enum DeductionFrequency { PER_PAY_PERIOD MONTHLY ANNUAL } enum ElectionStatus { PENDING ACTIVE SUSPENDED TERMINATED } model BenefitPlan { id String @id @default(cuid()) companyId String name String type BenefitType planYear Int effectiveFrom DateTime effectiveTo DateTime? taxPackId String? ruleCode String // Plan configuration, eligibility and limits. configuration Json employeeElections EmployeeDeduction[] createdAt DateTime @default(now()) updatedAt DateTime @updatedAt @@index([companyId, type, planYear]) } model EmployeeDeduction { id String @id @default(cuid()) employeeId String benefitPlanId String amountType ElectionAmountType amount Decimal @db.Decimal(18, 6) frequency DeductionFrequency effectiveFrom DateTime effectiveTo DateTime? priority Int @default(100) status ElectionStatus // Reference to the exact rule interpretation. taxTreatmentId String benefitPlan BenefitPlan @relation( fields: [benefitPlanId], references: [id] ) createdAt DateTime @default(now()) updatedAt DateTime @updatedAt @@index([employeeId, effectiveFrom, effectiveTo]) @@index([benefitPlanId, status]) }
I would also add these models:
BenefitContribution: employer-side contributions.
BenefitPlanDocument: plan documents and supporting evidence.
BenefitLimitAccumulator: year-to-date contribution totals.
DeductionApplication: immutable per-payroll deduction result.
DeductionTaxTreatment: effective-dated TaxPack treatment mapping.
Important: Do not store a mutable benefit-plan JSON document as the sole evidence of a past payroll calculation. Persist the exact benefit configuration and resolved tax treatment version in the calculation snapshot.
4.3 Company-specific SUTA settings
I recommend storing the statutory rule and employer-assigned experience rate independently.
model CompanyTaxSetting { id String @id @default(cuid()) companyId String jurisdictionCode String taxProgram String employerAccountId String? taxPackId String createdAt DateTime @default(now()) updatedAt DateTime @updatedAt experienceRates ExperienceRateHistory[] @@unique([companyId, jurisdictionCode, taxProgram]) } model ExperienceRateHistory { id String @id @default(cuid()) companyTaxSettingId String rate Decimal @db.Decimal(12, 8) effectiveFrom DateTime effectiveTo DateTime? noticeNumber String? noticeDocumentHash String? verifiedAt DateTime? verifiedBy String? status String companyTaxSetting CompanyTaxSetting @relation(fields: [companyTaxSettingId], references: [id]) createdAt DateTime @default(now()) @@index([companyTaxSettingId, effectiveFrom]) }
Additional requirements:
No overlapping verified effective periods for the same employer and tax program.
Require supporting documentation for manually entered assigned rates.
Preserve prior rates after an annual rate update.
Support corrected or superseded agency notices.
Snapshot the rate used in each payroll calculation.
Store the original rate notice or its immutable archival reference.
I would not use a single rate field directly on CompanyTaxSetting. That would destroy historical accuracy when the state changes an employer's rate.
4.4 ACH direct deposit: NACHA PPD generation
This feature deserves its own subsystem.
The ACH file format consists of 94-character fixed-width records. A standard file contains file headers, batch headers, transaction entries, batch controls, file controls, and blocking records.
ACH Guide for Developers+1
For employee direct deposit, the usual Standard Entry Class (SEC) code is PPD, subject to the applicable NACHA rules and the nature of the payment.
The ACH file is not a CSV file with routing and account numbers.
Core record structure
Record
Type code
Purpose
File Header
1
Origin and destination information
Batch Header
5
Company, SEC code, effective date
Entry Detail
6
Employee account and amount
Addenda
7
Optional payment-related information
Batch Control
8
Batch totals and hash
File Control
9
File totals and record counts
Padding
9
Blocking to a multiple of ten records
The most important entry-detail fields include:
Transaction code.
Receiving DFI routing information.
Check digit.
Receiving account number.
Amount in cents.
Individual identification number.
Individual name.
Discretionary data.
Addenda indicator.
Trace number.
The ACH guide specifies the 94-character record structure and exact field positions.
ACH Guide for Developers+1
Recommended ACH data models
enum PaymentBatchStatus { DRAFT VALIDATED APPROVED EXPORTED SUBMITTED SETTLED PARTIALLY_RETURNED FAILED CANCELLED } enum AchEntryStatus { PENDING EXPORTED SUBMITTED SETTLED RETURNED REVERSED FAILED } model EmployeeBankAccount { id String @id @default(cuid()) employeeId String routingNumberEnc Bytes accountNumberEnc Bytes accountType String accountHolderName String verificationState String verifiedAt DateTime? createdAt DateTime @default(now()) updatedAt DateTime @updatedAt } model AchPaymentBatch { id String @id @default(cuid()) companyId String effectiveDate DateTime companyIdNacha String originatingDfi String? status PaymentBatchStatus totalDebit Decimal @db.Decimal(18, 2) totalCredit Decimal @db.Decimal(18, 2) entryCount Int fileHash String? createdAt DateTime @default(now()) approvedAt DateTime? entries AchPaymentEntry[] @@index([companyId, effectiveDate]) } model AchPaymentEntry { id String @id @default(cuid()) batchId String employeeId String payrollRunId String amount Decimal @db.Decimal(18, 2) traceNumber String? transactionCode String status AchEntryStatus returnCode String? returnDescription String? batch AchPaymentBatch @relation( fields: [batchId], references: [id] ) createdAt DateTime @default(now()) @@index([batchId, status]) @@unique([batchId, employeeId]) }
For production, add:
AchOriginatorConfiguration
AchFileArtifact
AchApproval
AchReturn
AchPrenote
AchReversal
BankAccountVerification
PaymentProviderEvent
The unique constraint above is an initial simplified design. If one employee has multiple accounts or split direct deposits, use a unique key based on payroll run, employee, and payment allocation sequence.
ACH security requirements
Do not store routing or account numbers in plaintext.
Use envelope encryption:
Generate a data-encryption key.
Encrypt the account number and routing number using AES-256-GCM.
Wrap the data key using a KMS-managed key.
Store encrypted data and the key reference.
Store a keyed HMAC for duplicate detection, not a plain account-number hash.
Restrict decryption to the payment execution service.
Also:
Require MFA for payroll approval.
Use dual approval for high-risk batches.
Add idempotency keys.
Maintain immutable export artifacts.
Prevent duplicate submission.
Track ACH returns and reversals.
Enforce bank-specific cutoff times and funding limits.
Maintain an ACH audit trail.
NACHA operating rules are more extensive than the record format. The implementation must address originator authorization, account validation, return handling, security requirements, and applicable bank agreements. The format specification alone does not establish permission to originate ACH entries.
4.5 ACH generator interface
I recommend a pure serialization service separated from the payment approval and execution logic.
interface AchOriginator { immediateOrigin: string; immediateDestination: string; companyIdentification: string; companyName: string; discretionaryData?: string; fileIdModifier: string; } interface AchCreditEntry { routingNumber: string; accountNumber: string; accountType: "CHECKING" | "SAVINGS"; employeeName: string; employeeId: string; amountCents: bigint; traceNumber: string; } interface AchFileResult { fileContents: string; recordCount: number; entryHash: string; totalDebitCents: bigint; totalCreditCents: bigint; sha256: string; } interface AchFileGenerator { generatePpdCreditBatch( originator: AchOriginator, entries: AchCreditEntry[], effectiveDate: Date ): AchFileResult; validate(fileContents: string): { valid: boolean; errors: string[]; }; }
Essential validation tests
Every record is exactly 94 ASCII-compatible bytes.
Correct file and batch control totals.
Correct entry hash calculation.
Valid routing number and check digit.
Valid transaction codes for checking and savings accounts.
Correct debit/credit indicators.
Proper zero-padding and numeric formatting.
Correct record blocking.
Unique trace numbers.
Effective date and cutoff validation.
Duplicate batch detection.
Do not generate production ACH files using a generic string-concatenation utility without a bank-approved test suite.
The employer's bank must approve the file specifications and delivery method. Some banks accept NACHA files; others require proprietary formats or use a payment initiation API.
4.6 The most important missing schema: Payroll tax liability ledger
I would prioritize this even ahead of the ACH file generator.
TaxShield needs a first-class representation of liabilities independent of payroll runs.
A payroll calculation creates a liability. A payment settles some or all of that liability. A filing reports it. These are separate events.
model PayrollTaxLiability { id String @id @default(cuid()) companyId String payrollRunId String jurisdictionCode String taxType String taxPeriod String amount Decimal @db.Decimal(18, 2) dueDate DateTime rulePackId String calculationSnapshotId String createdAt DateTime @default(now()) @@index([companyId, jurisdictionCode, dueDate]) @@index([companyId, taxPeriod, taxType]) } model TaxPayment { id String @id @default(cuid()) companyId String liabilityId String? jurisdictionCode String taxType String amount Decimal @db.Decimal(18, 2) paymentDate DateTime confirmationNumber String? providerReference String? status String evidenceHash String? createdAt DateTime @default(now()) @@index([companyId, paymentDate]) }
I would add a many-to-many settlement allocation table between TaxPayment and PayrollTaxLiability, since one payment may settle several liabilities and one liability may be settled through multiple payments.
This becomes the foundation for:
Tax deposit reconciliation.
Form 941 workpapers.
Form 940 workpapers.
State SUTA returns.
Payment confirmation tracking.
Late-payment detection.
Tax liability aging reports.
4.7 Preserve the TaxPack invariant
The existing TaxPack architecture should remain the central authority for statutory rules.
I recommend extending it with these rule categories:
Rule category
Examples
Tax rate
FIT, Social Security, Medicare, SUTA
Wage base
Social Security, FUTA, SUTA
Wage classification
FIT wages, FICA wages, FUTA wages
Benefit treatment
Section 125, HSA, FSA, 401(k)
Employer-specific settings
Assigned SUTA rate, local tax account
Filing requirements
Form type, reporting period, filing deadline
Payment requirements
Deposit frequency, agency payment instructions
Reporting specifications
EFW2, state wage file versions
Rounding rules
Tax calculation precision and rounding
Validation rules
Cross-field statutory and reporting constraints
One important design refinement:
Do not put employer-specific facts inside a globally distributed TaxPack.
A TaxPack should contain the applicable law and published rules. Employer-specific facts, such as the assigned SUTA experience rate, should live in the employer's signed tax-configuration history and be resolved together with the TaxPack.
That preserves package portability without confusing statutory law with individual agency determinations.
5. Prioritized strategic roadmap
I recommend a 10-week initial delivery plan, followed by a commercial scale phase.
The order matters. Do not start with direct deposit APIs or state expansion. First make payroll calculations, liabilities, benefits, and evidence internally complete.
Wave 1 — Immediate wins (Weeks 1–4)
Highest priority
Low regulatory overhead • High product differentiation
Objective: Make TaxShield substantially more valuable than a basic payroll calculator.
Priority
Deliverable
Acceptance criteria
P0
Payroll tax liability ledger
Every payroll tax calculation creates an immutable liability
P0
Benefit deduction engine
Section 125, traditional/Roth 401(k), HSA/FSA treatments supported
P0
SUTA experience rate history
Effective-dated employer-specific rates
P0
Payroll payment concierge
Federal, state and local payment checklist
P0
Payroll approval and locking
Approved payroll cannot be silently modified
P1
NACHA PPD export MVP
Bank-tested 94-character file generation
P1
Employee bank account security
Encrypted account storage and verification
P1
Tax liability aging dashboard
Outstanding, due, overdue, and paid liabilities
P1
CPA export bundle
Payroll journal, tax liability, payment evidence and receipts
P2
Payroll migration importer
Historical wages, YTD tax accumulators and opening balances
Four-week execution plan
Week 1 — Financial foundation
Implement PayrollTaxLiability.
Introduce payment and liability allocation.
Add immutable payroll approval state.
Add company tax setting history.
Week 2 — Benefits and deductions
Add BenefitPlan.
Add EmployeeDeduction.
Implement independent wage-treatment vectors.
Add benefit contribution accumulators.
Week 3 — SUTA and payment concierge
Implement experience rate history.
Build tax-payment checklist.
Add payment confirmation and reconciliation.
Add tax liability aging dashboard.
Week 4 — ACH export and CPA bundle
Implement PPD file generator.
Complete ACH validation harness.
Add bank export workflow.
Generate downloadable CPA evidence bundle.
Wave 1 success metrics
100% of payroll runs produce immutable calculation snapshots.
100% of payroll tax liabilities are independently traceable.
Every benefit deduction has an explicit tax-treatment resolution.
No historical SUTA rate is overwritten.
Every approved payroll has an associated payment plan.
No duplicate ACH batch can be submitted accidentally.
Wave 2 — Compliance and accountant enablement (Weeks 5–10)
Compliance expansion
Higher statutory complexity • High retention value
Objective: Make TaxShield a credible alternative for businesses currently relying on accountants and external payroll services.
Priority
Deliverable
Acceptance criteria
P0
Form 941 workpapers
Quarterly liability and deposit reconciliation
P0
Form 940 workpapers
Annual FUTA reconciliation
P0
EFW2 serializer
Tax-year-specific SSA output
P0
EFW2 validation
Totals, field lengths, and record sequence validated
P1
EFW2C corrections
Corrected annual wage reporting
P1
State SUTA workpapers
Employer-specific wage and rate reconciliation
P1
Accountant review portal
Read-only access to evidence and calculations
P1
IRS filing partner adapter
Submission and acknowledgment tracking
P1
CPA year-end export
W-2, W-3, 941, 940, payroll journal and reconciliation
P2
State filing adapters
Prioritized state-by-state exports
Important filing distinction
For Wave 2, I would separate the development into three levels:
Filing preparation: Generate complete and validated returns.
Employer-authorized submission: Provide the employer with an approved filing pathway.
Provider-assisted submission: Integrate with an authorized IRS filing provider.
Do not advertise that TaxShield files Forms 941 or 940 merely because it can generate a completed worksheet.
The IRS MeF program requires approved software, authorization, and successful assurance testing. For direct participation, the company must select the appropriate provider role and satisfy the associated requirements.
Internal Revenue Service+1
For SSA wage reporting, start with employer-controlled BSO submission of validated EFW2 files. Add direct filing integration only after assessing the applicable SSA program and authorization requirements.
Accountant enablement: the opportunity
I would build a dedicated TaxShield CPA Review Pack.
Example: 2026 S-Corp year-end review
GENERATED REPORT PACKAGE
Payroll journal and general ledger reconciliation
W-2/W-3 and EFW2 reporting data
Form 941 quarterly workpapers
Form 940 and SUTA reconciliation
Accountable-plan reimbursement evidence
TaxPack versions and calculation verification report
This can be a strong acquisition channel: accountants can introduce TaxShield to multiple micro-business clients without having to adopt it as their own full accounting platform.
Wave 3 — Commercial and scale strategy
Objective: Convert the OSS financial engine into a commercially viable embedded payroll and compliance platform.
Initiative
Recommendation
Priority
Embedded payroll
Evaluate Check and Zeal
P0
ACH infrastructure
Evaluate Moov and sponsor-bank partners
P0
Payment orchestration
Evaluate Modern Treasury if multi-provider complexity warrants it
P1
Multi-tenant SaaS
Organization/company isolation and billing
P0
Partner filing infrastructure
IRS and state filing integrations
P0
Multi-state expansion
Prioritize actual customer demand
P1
Accountant channel
CPA multi-company dashboard
P1
Benefits integrations
Benefit provider and retirement plan integrations
P2
Open-core enterprise features
Signed TaxPack updates and deployment management
P2
Recommended commercial pricing hypothesis
I would not use Gusto's pricing as the sole anchor. TaxShield should monetize the audit and financial infrastructure, with payment and filing costs separately accounted for.
These are proposed prices to test with customers, not validated willingness-to-pay estimates.
Plan
Proposed price
Positioning
OSS Self-Hosted
$0
Full self-hosted core
Ledger Cloud
$19/month
Bookkeeping, reconciliation and audit evidence
Payroll Assist
$39/month + $4/worker
Assisted payroll and tax workflows
Payroll Plus
$69/month + $6/worker
Advanced payroll, benefits and reporting
CPA / Multi-Company
$99/month starting
Multiple company workspaces and accountant review
Third-party ACH, e-filing, identity verification, and other transaction costs should be disclosed separately or included in clearly defined usage allowances.
For context, current advertised examples include:
Competitor
Advertised entry pricing
Gusto Simple
$49 + $6/person
Patriot Basic
$17 + $4/worker paid
Patriot Full Service
$37 + $5/worker paid
Square Full Service
$35 + $6/person paid
QuickBooks Workforce Payroll
Pricing varies by plan and promotion; its current listed regular plan pricing differs materially from promotional prices
Sources:
How Much Does Gusto Cost?+4
The implication is important: TaxShield's assisted-payroll pricing cannot simply be compared with the subscription fee of a self-service competitor. The value must reflect the labor and compliance activities actually automated.
6. Architectural risks that deserve attention before scaling
There are five risks I would put on the principal architect's review agenda.
Risk 1: TaxPack completeness
A cryptographically sealed package is only as good as its statutory content.
A package can be perfectly signed and still contain an incorrect tax rule.
Required controls:
Official source URL and document hash.
Effective date and publication date.
Jurisdiction and tax program.
Source hierarchy.
Human reviewer approval.
Independent test vectors.
Regression tests against historical payrolls.
Emergency rule withdrawal and supersession process.
TaxPack releases should have explicit states:
DRAFT ↓ SOURCE_VERIFIED ↓ LEGAL_REVIEWED ↓ TEST_PASSED ↓ SIGNED ↓ PUBLISHED ↓ SUPERSEDED
Never silently replace a previously published package.
Risk 2: Payroll correction and amended-return workflows
Payroll corrections are not ordinary database updates.
You need explicit domain events for:
Voided checks.
Reissued checks.
Reversed ACH payments.
Off-cycle payroll.
Prior-period corrections.
Corrected W-2s.
Form 941-X.
Tax deposit adjustments.
State amended wage reports.
A correction must preserve the original calculation, payment, and filing history.
Risk 3: Multi-tenant SaaS security
The OSS single-company model and commercial multi-tenant model should share domain logic, not necessarily identical authorization boundaries.
I recommend:
Organization
Company
User
CompanyMembership
OrganizationMembership
Role
Permission
AuditEvent
Every financial query must enforce company ownership at the database or service boundary.
For commercial SaaS, PostgreSQL Row-Level Security can provide defense in depth. Do not rely exclusively on frontend role checks or application-level filtering.
Global sysadmin access should be tightly controlled, logged, and preferably require a just-in-time privileged access workflow.
Risk 4: Tax calculations versus accounting classification
The product needs separate concepts for:
Payroll expense.
Employer payroll tax expense.
Employee withholding liabilities.
Employer tax liabilities.
Employee benefit liabilities.
Employee net-pay payable.
Owner distributions.
Shareholder-employee compensation.
Accountable-plan reimbursements.
This is especially important for S-Corps.
An accountable-plan reimbursement is not a payroll wage simply because money is paid to an employee. Similarly, an S-Corp shareholder distribution is not interchangeable with payroll compensation.
Risk 5: The audit score must not become a false compliance guarantee
Your six-pillar score is useful, but avoid wording such as "IRS audit-proof" or "IRS-approved."
Instead:
Show each pillar independently.
Explain how each score was derived.
Show missing evidence.
Separate statutory compliance from documentation completeness.
Track unresolved exceptions.
Allow CPAs to override classifications with recorded explanations.
The score should be an evidence-quality indicator, not a probability of passing an audit.
7. Final strategic architecture
This is the target architecture I would approve for the next major product phase.
#chatgpt-mermaid-_r_uc_{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;fill:rgb(237, 237, 237);}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#chatgpt-mermaid-_r_uc_ .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-_r_uc_ .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-_r_uc_ .error-icon{fill:rgb(48, 48, 48);}#chatgpt-mermaid-_r_uc_ .error-text{fill:rgb(237, 237, 237);stroke:rgb(237, 237, 237);}#chatgpt-mermaid-_r_uc_ .edge-thickness-normal{stroke-width:1px;}#chatgpt-mermaid-_r_uc_ .edge-thickness-thick{stroke-width:3.5px;}#chatgpt-mermaid-_r_uc_ .edge-pattern-solid{stroke-dasharray:0;}#chatgpt-mermaid-_r_uc_ .edge-thickness-invisible{stroke-width:0;fill:none;}#chatgpt-mermaid-_r_uc_ .edge-pattern-dashed{stroke-dasharray:3;}#chatgpt-mermaid-_r_uc_ .edge-pattern-dotted{stroke-dasharray:2;}#chatgpt-mermaid-_r_uc_ .marker{fill:rgb(175, 175, 175);stroke:rgb(175, 175, 175);}#chatgpt-mermaid-_r_uc_ .marker.cross{stroke:rgb(175, 175, 175);}#chatgpt-mermaid-_r_uc_ svg{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;}#chatgpt-mermaid-_r_uc_ p{margin:0;}#chatgpt-mermaid-_r_uc_ .label{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";color:rgb(237, 237, 237);}#chatgpt-mermaid-_r_uc_ .cluster-label text{fill:rgb(237, 237, 237);}#chatgpt-mermaid-_r_uc_ .cluster-label span{color:rgb(237, 237, 237);}#chatgpt-mermaid-_r_uc_ .cluster-label span p{background-color:transparent;}#chatgpt-mermaid-_r_uc_ .label text,#chatgpt-mermaid-_r_uc_ span{fill:rgb(237, 237, 237);color:rgb(237, 237, 237);}#chatgpt-mermaid-_r_uc_ .node rect,#chatgpt-mermaid-_r_uc_ .node circle,#chatgpt-mermaid-_r_uc_ .node ellipse,#chatgpt-mermaid-_r_uc_ .node polygon,#chatgpt-mermaid-_r_uc_ .node path{fill:rgb(9, 23, 44);stroke:rgb(31, 78, 148);stroke-width:1px;}#chatgpt-mermaid-_r_uc_ .rough-node .label text,#chatgpt-mermaid-_r_uc_ .node .label text,#chatgpt-mermaid-_r_uc_ .image-shape .label,#chatgpt-mermaid-_r_uc_ .icon-shape .label{text-anchor:middle;}#chatgpt-mermaid-_r_uc_ .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#chatgpt-mermaid-_r_uc_ .rough-node .label,#chatgpt-mermaid-_r_uc_ .node .label,#chatgpt-mermaid-_r_uc_ .image-shape .label,#chatgpt-mermaid-_r_uc_ .icon-shape .label{text-align:center;}#chatgpt-mermaid-_r_uc_ .node.clickable{cursor:pointer;}#chatgpt-mermaid-_r_uc_ .root .anchor path{fill:rgb(175, 175, 175)!important;stroke-width:0;stroke:rgb(175, 175, 175);}#chatgpt-mermaid-_r_uc_ .arrowheadPath{fill:rgb(175, 175, 175);}#chatgpt-mermaid-_r_uc_ .edgePath .path{stroke:rgb(175, 175, 175);stroke-width:1px;}#chatgpt-mermaid-_r_uc_ .flowchart-link{stroke:rgb(175, 175, 175);fill:none;}#chatgpt-mermaid-_r_uc_ .edgeLabel{background-color:rgb(0, 0, 0);text-align:center;}#chatgpt-mermaid-_r_uc_ .edgeLabel p{background-color:rgb(0, 0, 0);}#chatgpt-mermaid-_r_uc_ .edgeLabel rect{opacity:0.5;background-color:rgb(0, 0, 0);fill:rgb(0, 0, 0);}#chatgpt-mermaid-_r_uc_ .labelBkg{background-color:rgba(0, 0, 0, 0.5);}#chatgpt-mermaid-_r_uc_ .cluster rect{fill:rgb(48, 48, 48);stroke:rgba(255, 255, 255, 0.15);stroke-width:1px;}#chatgpt-mermaid-_r_uc_ .cluster text{fill:rgb(237, 237, 237);}#chatgpt-mermaid-_r_uc_ .cluster span{color:rgb(237, 237, 237);}#chatgpt-mermaid-_r_uc_ div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:12px;background:rgb(48, 48, 48);border:1px solid rgba(255, 255, 255, 0.15);border-radius:2px;pointer-events:none;z-index:100;}#chatgpt-mermaid-_r_uc_ .flowchartTitleText{text-anchor:middle;font-size:18px;fill:rgb(237, 237, 237);}#chatgpt-mermaid-_r_uc_ rect.text{fill:none;stroke-width:0;}#chatgpt-mermaid-_r_uc_ .icon-shape,#chatgpt-mermaid-_r_uc_ .image-shape{background-color:rgb(0, 0, 0);text-align:center;}#chatgpt-mermaid-_r_uc_ .icon-shape p,#chatgpt-mermaid-_r_uc_ .image-shape p{background-color:rgb(0, 0, 0);padding:2px;}#chatgpt-mermaid-_r_uc_ .icon-shape .label rect,#chatgpt-mermaid-_r_uc_ .image-shape .label rect{opacity:0.5;background-color:rgb(0, 0, 0);fill:rgb(0, 0, 0);}#chatgpt-mermaid-_r_uc_ .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#chatgpt-mermaid-_r_uc_ .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#chatgpt-mermaid-_r_uc_ .node .neo-node{stroke:rgb(31, 78, 148);}#chatgpt-mermaid-_r_uc_ [data-look="neo"].node rect,#chatgpt-mermaid-_r_uc_ [data-look="neo"].cluster rect,#chatgpt-mermaid-_r_uc_ [data-look="neo"].node polygon{stroke:url(#chatgpt-mermaid-_r_uc_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_uc_ [data-look="neo"].swimlane.cluster rect{filter:none;}#chatgpt-mermaid-_r_uc_ [data-look="neo"].node path{stroke:url(#chatgpt-mermaid-_r_uc_-gradient);stroke-width:1px;}#chatgpt-mermaid-_r_uc_ [data-look="neo"].node .outer-path{filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_uc_ [data-look="neo"].node .neo-line path{stroke:rgb(31, 78, 148);filter:none;}#chatgpt-mermaid-_r_uc_ [data-look="neo"].node circle{stroke:url(#chatgpt-mermaid-_r_uc_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_uc_ [data-look="neo"].node circle .state-start{fill:#000000;}#chatgpt-mermaid-_r_uc_ [data-look="neo"].icon-shape .icon{fill:url(#chatgpt-mermaid-_r_uc_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_uc_ [data-look="neo"].icon-shape .icon-neo path{stroke:url(#chatgpt-mermaid-_r_uc_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_uc_ .node text{font-size:14px;font-weight:600;letter-spacing:normal;fill:rgb(153, 206, 255);}#chatgpt-mermaid-_r_uc_ .edgeLabels text{font-size:13px;font-weight:600;letter-spacing:-0.08px;fill:rgb(153, 206, 255);}#chatgpt-mermaid-_r_uc_ .node tspan[font-weight="normal"],#chatgpt-mermaid-_r_uc_ .edgeLabels tspan[font-weight="normal"]{font-weight:600;}#chatgpt-mermaid-_r_uc_ .edgeLabel .label rect{opacity:1;rx:13px;ry:13px;fill:rgb(0, 14, 26);stroke:rgb(26, 62, 95);stroke-width:1px;}#chatgpt-mermaid-_r_uc_ .node rect,#chatgpt-mermaid-_r_uc_ .node circle,#chatgpt-mermaid-_r_uc_ .node ellipse,#chatgpt-mermaid-_r_uc_ .node polygon,#chatgpt-mermaid-_r_uc_ .node path{fill:rgb(0, 40, 77);stroke:rgba(255, 255, 255, 0.1);stroke-width:1px;}#chatgpt-mermaid-_r_uc_ .node rect{rx:16px;ry:16px;}#chatgpt-mermaid-_r_uc_ .mermaid-decision .label-container{fill:rgb(0, 14, 26);stroke:rgb(26, 62, 95);stroke-dasharray:2,2;}#chatgpt-mermaid-_r_uc_ .edgePaths .flowchart-link{stroke:rgb(175, 175, 175);stroke-width:1px;stroke-linecap:round;stroke-linejoin:round;}#chatgpt-mermaid-_r_uc_ .marker{fill:rgb(175, 175, 175);stroke:rgb(175, 175, 175);}#chatgpt-mermaid-_r_uc_ :root{--mermaid-font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";}External InfrastructureExecution and ReportingStatutory Calculation and EvidenceTaxShield Core PlatformExperienceEmployer BankACH PartnerIRSState and Local AgenciesSSAACH GeneratorPayment OrchestrationTax Filing AdaptersEFW2 and State ExportCompliance CalendarTaxPack RegistryTax Rule ResolverPayroll Calculation EngineImmutable CalculationSnapshotsTax Liability LedgerPayroll DomainBookkeeping DomainBenefits DomainContractor and Invoice DomainBank ReconciliationReact 19 DashboardEmployee PortalCPA Review Portal
8. Final decision matrix
Strategic decision
Recommendation
Compete directly with Gusto on full-service payroll today?
No
Compete on auditability and data ownership?
Yes
Preserve the TaxPack calculation engine as proprietary product IP or open-core differentiation?
Yes; keep the statutory engine authoritative
Build benefit deduction engine internally?
Yes
Build company-specific SUTA history?
Yes
Build NACHA generator?
Yes
Become a bank or hold employee funds?
No
Pursue all 50 state money transmitter licenses?
No, not as an initial strategy
Build IRS MeF infrastructure immediately?
No
Integrate an approved tax filing partner?
Yes
Integrate ACH payment infrastructure?
Yes
Expand states before validating filing completeness?
No
Develop CPA distribution channel?
Yes
9. My top 10 engineering backlog items
In actual implementation order:
Implementation checklist
0/10 complete
1. PayrollTaxLiability and TaxPaymentAllocation
2. Effective-dated CompanyTaxSetting and ExperienceRateHistory
3. BenefitPlan and EmployeeDeduction
4. Independent tax-treatment vectors and wage accumulators
5. Immutable payroll approval and correction events
6. Payment Concierge and compliance evidence
7. NACHA PPD generator and bank validation harness
8. Form 941 / 940 reconciliation workpapers
9. SSA EFW2 / EFW2C serializers
10. Partner adapter for ACH and employment tax filing
10. Principal architect's conclusion
TaxShield's strongest opportunity is not to become another payroll processor.
It is to create a trustworthy financial and statutory evidence layer that happens to include payroll.
The market already has inexpensive payroll calculation software. Patriot's Basic Payroll, for example, calculates payroll taxes while leaving tax deposits and filings to the employer. Its Full Service product adds those activities.
Patriot Software Help Center+1
That is an especially relevant competitive comparison: TaxShield must differentiate beyond simply offering calculations without filing.
I would make three strategic bets:
Own the evidence: TaxPack, calculation snapshots, liability ledger, accountable-plan documentation, and reconciliation must remain the authoritative record.
Partner for execution: Use established banking and tax-filing infrastructure to provide a near-full-service commercial experience without taking custody of customer funds.
Own the accountant relationship: Turn CPA review, year-end reporting, and audit evidence into a distribution advantage.
The product I would build
TaxShield Ledger
Your books. Your payroll. Your tax evidence. Your control.
A self-hostable financial ledger with a deterministic statutory calculation engine, assisted payroll, transparent liabilities, and optional commercial payment and filing automation.
North-star metric: Percentage of payroll and tax obligations that are calculated, documented, paid, filed, and reconciled without manual spreadsheet intervention.
11. Primary regulatory and technical reference library
These should become permanent source references in the TaxShield architecture documentation and TaxPack ingestion catalog.
Subject
Authoritative reference
Federal payroll withholding and benefits
[IRS Publication 15 (2026)](https://www.irs.gov/publications/p15?utm_source=chatgpt.com)
401(k) wage treatment
[IRS Topic 424](https://www.irs.gov/taxtopics/tc424?utm_source=chatgpt.com)
SSA annual W-2 file specification
[SSA EFW2 specifications](https://www.ssa.gov/employer/EFW2%26EFW2C.htm?utm_source=chatgpt.com)
EFW2 Tax Year 2026
[SSA Publication 42-007](https://www.ssa.gov/employer/efw/26efw2.pdf?utm_source=chatgpt.com)
ACH file record format
[Nacha ACH Developer Guide](https://achdevguide.nacha.org/ach-file-overview?utm_source=chatgpt.com)
ACH field positions
[Nacha ACH File Details](https://achdevguide.nacha.org/index.php/ach-file-details?utm_source=chatgpt.com)
IRS employment tax e-filing
[IRS MeF employment taxes](https://www.irs.gov/e-file-providers/modernized-e-file-mef-for-employment-taxes?utm_source=chatgpt.com)
IRS reporting agent authorization
[IRS Reporting Agent technical fact sheet](https://www.irs.gov/e-file-providers/reporting-agent-technical-fact-sheet?utm_source=chatgpt.com)
Federal payroll tax deposits
[IRS depositing and reporting employment taxes](https://www.irs.gov/businesses/small-businesses-self-employed/depositing-and-reporting-employment-taxes?utm_source=chatgpt.com)
Money transmitter definition
[FinCEN money services business guidance](https://www.fincen.gov/resources/statutes-regulations/administrative-rulings/determination-money-services-business-status?utm_source=chatgpt.com)
Final caveat: Before enabling commercial payroll execution, obtain specialist US payments regulatory counsel and employment-tax counsel to review the actual fund flows, agency relationships, state coverage, ACH agreements, and filing responsibilities. The architecture above is a product and engineering strategy, not a legal determination that a particular payment arrangement is exempt from licensing.
Recommended next step: Convert this strategy into a production-ready TaxShield Ledger Architecture Specification, including a complete Prisma migration, tax calculation interfaces, event contracts, partner API abstractions, and a sprint-by-sprint implementation backlog.
</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-11-21T18:53:36-05:00.
</ADDITIONAL_METADATA>