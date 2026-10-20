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
  title: "TaxShield Ledger: Micro-LLC Bookkeeping, Mileage, Multi-State Payroll & Tax Engine",
  subtitle: "Product Requirements Document (PRD) — Production Architecture & Roadmap",
  meta: {
    version: "3.0.0 (Production Specification & Phase 3 Roadmap)",
    target: "Micro-Business LLCs (1-10 Employees / Contractors), Owner-Operators, Multi-State Workforces",
    author: "Vijay Pillai (Managing Member / Architecture)",
    jurisdictionFocus: "IRS Federal (Schedule C / 1065 / 941), Multi-State (PA, DE, NJ, NY, OH, FL, TX) & Municipalities",
    businessModel: "$0 Operating Software Budget / Maximum Pass-Through Tax Offset for Owner"
  },
  sections: [
    {
      id: "exec_summary",
      title: "1. Executive Summary & Business Scenario",
      summary: "Strategic tax planning, pass-through loss maximization, and compliance for lean micro-entities.",
      paragraphs: [
        "A micro-business LLC operating with 1 to 10 employees routinely incurs legitimate ordinary and necessary business expenses (mileage, equipment depreciation, home office, travel, and wages) that flow directly through Schedule C (Single-Member) or Form 1065 K-1 (Multi-Member) onto the owner's personal Form 1040, offsetting active income.",
        "Commercial payroll (Gusto, ADP at $50-$150/mo) and mileage subscriptions ($10-$20/mo) create recurring financial drag while obscuring tax auditability. TaxShield Ledger eliminates subscription overhead with an immutable, versioned calculation and task engine.",
        "The architecture is anchored on the non-negotiable rule that zero statutory tax rates, brackets, or thresholds may be hardcoded. Calculations fail closed if an active, effective-dated rule version is missing, ensuring 100% audit-proof compliance."
      ]
    },
    {
      id: "pain_points",
      title: "2. The Critical Problems Solved",
      summary: "Four fundamental risks facing micro-LLC owners managing expenses and payroll manually.",
      bulletGroups: [
        {
          heading: "A. IRS 5-Point Mileage & Travel Audit Vulnerability",
          items: [
            "The IRS disallows vehicle deductions lacking any of the 5 mandatory contemporaneous elements: (1) Date, (2) Origin/Destination, (3) Specific Business Purpose, (4) Starting Odometer, (5) Ending Odometer / Total Miles.",
            "Missing digital receipt linkages for bridge tolls, highway tolls (PA Turnpike / E-ZPass), and parking meters results in lost legitimate deductions."
          ]
        },
        {
          heading: "B. Multi-State Withholding & Agency Portal Pitfalls",
          items: [
            "Manual calculation errors when applying state and local statutory withholding rules (EIT, LST, SUTA) for remote or moving employees.",
            "Missed filing deadlines or incorrect box values when manually filing quarterly IRS Form 941, state withholding (such as PA myPATH REV-1667), and annual W-2/W-3 returns."
          ]
        },
        {
          heading: "C. Pass-Through Tax Value Visibility",
          items: [
            "Lack of real-time visibility into how wages, FICA employer match, 5-point mileage, MACRS depreciation, and home office expenses translate into personal Form 1040 tax savings."
          ]
        },
        {
          heading: "D. Financial Disconnect & Manual Reconciliation Toil",
          items: [
            "Hours spent cross-referencing bank CSV statement debits with manual paper receipts, resulting in unverified expenses and missed deductible charges."
          ]
        }
      ]
    },
    {
      id: "functional_scope",
      title: "3. Core Functional Modules (Phases 0, 1 & 2 Completed)",
      summary: "Production modules active and verified in the current codebase.",
      modules: [
        {
          name: "Module 1: Cryptographic Tax Rule Packaging & Ingestion Engine",
          features: [
            "Zero Hardcoding Standard: Every tax rate, bracket, and threshold lives in effective-dated TaxRule / TaxRuleVersion records backed by required source citations.",
            "Automated Ingestion Adapters: Ingestion jobs for IRS and State DORs with canonical JSON normalization and SHA-256 cryptographic package sealing.",
            "Coverage Matrix & Package Distribution: Multi-jurisdiction matrix blocking payroll runs when rules are pending review; local HTTP server serving sealed packages with 24h background sync."
          ]
        },
        {
          name: "Module 2: Bookkeeping, 5-Point Mileage & Tax Deductions",
          features: [
            "Contemporaneous Mileage Log: 5-point IRS log with automated date-based rate resolution from active TaxRuleVersion records.",
            "Schedule C Expense Tracker: Categorized business expense ledger with digital receipt photo attachment.",
            "Asset & MACRS Depreciation: Recovery period and convention calculations for Form 4562 deductions.",
            "Home Office Deduction: Simplified ($5/sqft) and actual-expense Form 8829 workspace allocation."
          ]
        },
        {
          name: "Module 3: Multi-State Assisted Payroll & Timesheet Engine",
          features: [
            "Multi-State Jurisdiction Resolver: Resolves resident vs. work location withholding and mid-period address moves.",
            "Fiscal Calendar & Timesheet Lock: Deterministic period calendar generator with strict submission cutoff locking.",
            "Disbursement & Remittance: Mercury ACH payment matrix generation and NACHA CCD+ TXP electronic state tax remittance strings.",
            "High-Fidelity PDF Generation: In-browser generation of itemized employee pay stubs and IRS W-2 / W-3 forms."
          ]
        },
        {
          name: "Module 4: Pass-Through Simulator & Compliance Hub",
          features: [
            "Quarterly Filing Assistant: Form 941, Form 940, PA REV-1667, and 1099-NEC side-by-side agency portal guides.",
            "Pass-Through Impact Simulator: Real-time modeling of business operating deductions against owner Form 1040 personal tax brackets.",
            "Annual Rollover Wizard: Guided annual tax year setup and rule activation workflow."
          ]
        }
      ]
    },
    {
      id: "phase_3_roadmap",
      title: "4. Upcoming Phase 3: Automation & Financial Reconciliation",
      summary: "Active roadmap to eliminate manual data entry and ensure airtight audit reconciliation.",
      modules: [
        {
          name: "Feature 3.1: Receipt OCR Extraction Engine",
          features: [
            "Automated Extraction: Scans uploaded receipt images/PDFs for vendor, transaction date, subtotal, sales tax, total, and suggested Schedule C line.",
            "Confirmation Guardrail: Extracted fields default to 'detected, unconfirmed' status and require explicit user review before persisting to the ledger."
          ]
        },
        {
          name: "Feature 3.2: Bank Statement CSV / OFX Import & 4-Way Reconciliation",
          features: [
            "Bank Statement Import: Configurable CSV and OFX/QFX statement importer with duplicate line detection.",
            "4-Way Transaction Reconciliation: Classifies charges into MATCHED, UNMATCHED, DUPLICATE, and NEEDS REVIEW.",
            "One-Click Conversion: Instant creation of ledger expense records directly from unmatched bank debits."
          ]
        },
        {
          name: "Feature 3.3: Automated Duplicate Detection & Audit Readiness Score",
          features: [
            "Continuous Duplicate Scanning: Flags potential duplicate charges across bank statements and cash receipts.",
            "Audit Readiness Health Score (0-100%): Measures receipt coverage, mileage completeness, and bank reconciliation to guarantee IRS audit readiness."
          ]
        }
      ]
    },
    {
      id: "architecture_schema",
      title: "5. Relational Architecture & Security Standards",
      summary: "High-integrity architecture designed for financial determinism and strict data isolation.",
      techPoints: [
        "Financial Precision: Storing all monetary balances in integer cents (BIGINT) to eliminate floating-point rounding errors.",
        "Calculation Snapshots: Pinned TaxRuleVersion snapshot IDs recorded with every calculation for bit-identical historical audit recreation.",
        "Immutable Audit Trail: AuditLogEntry generated on every financial or payroll modification (actor, timestamp, before/after diff, business justification).",
        "Tenant & Employment Scoping: Strict server-enforced scoping ensuring employee records and payroll data cannot cross company boundaries."
      ]
    },
    {
      id: "roadmap_metrics",
      title: "6. Milestones & Success Verification Metrics",
      summary: "Measurable benchmarks across all phases.",
      metrics: [
        "100% Elimination of recurring payroll SaaS subscription fees ($0 operational overhead).",
        "Zero Missing Fields on all logged business mileage entries (IRS Audit-Proof contemporaneous logs).",
        "Zero Hardcoded Tax Rates: 100% of calculations resolved through versioned, effective-dated tax rules.",
        "Under 5 Minutes average time to complete quarterly agency portal filings using the side-by-side compliance drawer.",
        "Bank Reconciliation Completeness: 100% of bank debit lines reconciled against ledger expenses prior to year-end CPA export."
      ]
    }
  ]
};
