export interface PRDSection {
  id: string;
  title: string;
  badge?: string;
  content: string;
  subsections?: {
    title: string;
    description: string;
    points?: string[];
  }[];
}

export interface GoogleDocsCreationState {
  status: 'idle' | 'authorizing' | 'creating' | 'formatting' | 'success' | 'error';
  docId?: string;
  docUrl?: string;
  error?: string;
  createdTime?: string;
}

export const PRD_DOCUMENT_DATA = {
  title: "TaxShield Ledger: Micro-LLC Expense, 5-Point Mileage & Assisted Payroll Tax Engine",
  subtitle: "Product Requirements Document (PRD) — Planning & Specification",
  meta: {
    version: "1.0.0 (Comprehensive Planning Phase)",
    target: "Micro-Business LLCs (1-5 Employees / Contractors), Owner-Operators, Holding Entities",
    author: "Vijay Pillai (Managing Member / Architecture)",
    jurisdictionFocus: "IRS Federal (Schedule C / 1065 / 941), PA State (myPATH / 3.07%), Local EIT & LST",
    businessModel: "$0 Operating Software Budget / Maximum Pass-Through Tax Offset for Owner"
  },
  sections: [
    {
      id: "exec_summary",
      title: "1. Executive Summary & Business Scenario",
      summary: "Strategic tax planning and operational compliance for pre-revenue and expense-heavy micro-entities.",
      paragraphs: [
        "A micro-business LLC operating with 1 to 5 employees (often the owner, spouse/family members, or key part-time personnel) routinely generates minimal or zero direct revenue in early, holding, or developmental phases while legitimately incurring ordinary and necessary business expenses.",
        "Under IRS pass-through taxation (Single-Member LLC via Schedule C / Form 1040, or Multi-Member LLC via Form 1065 K-1), all ordinary and necessary net business expenses and operating losses flow directly onto the owner's personal Form 1040, offsetting other active W-2 earnings or investment income.",
        "Commercial payroll (Gusto, ADP at $50-$150/mo) and mileage tracking subscriptions ($10-$20/mo) create wasteful drag on micro-entities. The solution is an immutable, assisted calculation and task engine that supports manual zero-cost payment rails (Zelle, ACH) and direct portal filings (myPATH, IRS EFTPS, SSA BSO) with 100% IRS audit compliance."
      ]
    },
    {
      id: "pain_points",
      title: "2. The Critical Problems Solved",
      summary: "Three fundamental risks facing micro-LLC owners managing expenses manually.",
      bulletGroups: [
        {
          heading: "A. IRS 5-Point Mileage & Travel Audit Vulnerability",
          items: [
            "The IRS routinely disallows vehicle expense deductions if logs lack any of the 5 mandatory contemporaneous elements: (1) Date, (2) Origin/Destination, (3) Specific Business Purpose, (4) Starting Odometer, (5) Ending Odometer / Total Miles.",
            "Missing digital receipt linkages for bridge tolls, highway tolls (PA Turnpike / E-ZPass), and parking meters results in lost legitimate deductions."
          ]
        },
        {
          heading: "B. Manual Payroll Calculation & Agency Portal Pitfalls",
          items: [
            "Manual calculation errors when applying PA statutory state withholding (3.07%), local Earned Income Tax (PSD code rules), and prorated Local Services Tax (LST).",
            "Fear of missed deadlines or incorrect box values when manually filing quarterly IRS Form 941, PA myPATH REV-1667, PA UC-2, and annual SSA W-2/W-3 forms."
          ]
        },
        {
          heading: "C. Pass-Through Tax Value Visibility",
          items: [
            "Lack of real-time visibility into how wages, FICA employer match, 5-point mileage, and travel incidentals translate into personal Form 1040 tax savings across federal and state brackets."
          ]
        }
      ]
    },
    {
      id: "functional_scope",
      title: "3. Core Functional Modules & User Stories",
      summary: "Detailed specifications for the three foundational modules.",
      modules: [
        {
          name: "Module 1: IRS 5-Point Mileage & Travel Expense Ledger",
          features: [
            "Contemporaneous 5-Point Enforcement: Date, precise origin/destination, business purpose validation, start/end odometer readings, and auto-calculated miles.",
            "Tolls & Parking Tracking: Itemized highway tolls, E-ZPass debits, parking meters, and garage fees with receipt capture.",
            "Accountable Plan Separation: Automatically distinguishes between non-taxable employee expense reimbursements and Schedule C/1065 owner deductions."
          ]
        },
        {
          name: "Module 2: Zero-Cost Assisted Payroll & Gross-to-Net Engine",
          features: [
            "Statutory Calculation Accuracy: IRS Pub 15-T (Federal FIT), FICA (6.2% SS + 1.45% Med), PA State SIT (3.07%), PA Local EIT (higher of home vs work PSD), and PA LST ($52/yr).",
            "Zelle & Bank Transfer Disbursement Matrix: Generates one-click payment sheets with exact net wages, recipient handles, and confirmation reference logging.",
            "Itemized Pay Stubs: Clear display of gross earnings, statutory tax withholdings, non-taxable accountable plan travel reimbursements, and YTD running totals."
          ]
        },
        {
          name: "Module 3: Tax Compliance & Pass-Through Maximizer",
          features: [
            "Side-by-Side Portal Filing Aid: Displays exact box-by-box copy-paste figures for PA myPATH (REV-1667 / UC-2) and IRS Form 941/940.",
            "Year-End W-2 / W-3 Portal Package: Pre-mapped box values (Boxes 1-6, 16-19) for direct entry into the SSA BSO and myPATH systems.",
            "Personal Tax Offset Simulator: Real-time calculation of pass-through loss tax deductions against owner's personal income brackets."
          ]
        }
      ]
    },
    {
      id: "architecture_schema",
      title: "4. PostgreSQL Schema & Technical Architecture",
      summary: "Robust relational data model designed for high integrity and zero floating-point errors.",
      techPoints: [
        "Financial Precision: Storing all monetary balances in BIGINT cents to eliminate floating-point discrepancies across tax agencies.",
        "Optimistic Concurrency & Immutability: Payroll runs lock snapshot records with versioning tokens and UUIDv7 idempotency keys for payment disbursements.",
        "Relational Entities: Organizations, Employees, Withholding Profiles (W-4 & PA PSD), Payroll Runs, Pay Stubs, Immutable Line Items, 5-Point Mileage Logs, Travel Expenses, and Compliance Tasks."
      ]
    },
    {
      id: "roadmap",
      title: "5. Milestones & Success Metrics",
      summary: "Measurable benchmarks for rollout and verification.",
      metrics: [
        "100% Elimination of recurring payroll SaaS software fees ($0 operational cost).",
        "Zero Missing Fields on all logged business mileage entries (IRS Audit-Proof).",
        "100% Precision Match with PA Department of Revenue (3.07%) and IRS Publication 15-T withholding tables.",
        "Under 5 Minutes average time to complete quarterly agency portal filings using the side-by-side Assistant View."
      ]
    }
  ]
};
