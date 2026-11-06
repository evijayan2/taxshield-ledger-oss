# TaxShield Ledger (OSS) — Small Business Payroll & Compliance Ledger

**TaxShield Ledger OSS** is the open-source, single-company runtime profile of TaxShield Ledger — a tax-year-aware payroll, expense, mileage, and tax compliance platform designed for micro-LLCs and S-Corp owner-operators. Built with **React 19, Vite, Tailwind CSS v4, Express, and PostgreSQL with Prisma ORM**.

---

## Key Capabilities

- **Zero Hardcoded Rates**: All tax rates, brackets, and statutory formulas are resolved dynamically from versioned `TaxRule` records. Calculations fail closed if an active rule for a required jurisdiction is missing.
- **Staff & Owner Timesheets**: Daily time logging with automated shift calculation (regular vs. overtime hours), unpaid meal break deductions, manager approval workflows, and one-click auto-filling into Assisted Payroll runs to maintain audit-ready IRS "Reasonable Compensation" records.
- **Payroll & Multi-Jurisdiction Withholding**: Dynamic federal, state (PA), and local (EIT/PSD/LST) tax withholding, pay stub generation, and reimbursement handling.
- **Contractor 1099 Hub**: W-9 invitation workflows, sensitive TIN encryption at rest using AES-256-GCM, official Form 1099-NEC PDF generation, and IRS IRIS CSV reporting exports.
- **Bank Reconciliation Engine**: Statement imports for Mercury, Chase, Wells Fargo, and Bank of America with SHA-256 transaction fingerprinting to prevent duplicates across four match states (`MATCHED`, `UNMATCHED`, `DUPLICATE`, `NEEDS_REVIEW`).
- **Receipt OCR Pipeline**: Integrated Tesseract.js optical character recognition. Extracted fields default to unconfirmed status until explicitly verified by the user.
- **6-Pillar Audit Readiness**: Continuous evaluation of receipt coverage, business purpose quality, bank clearance, mileage records, contractor TIN compliance, and duplicate health.
- **Vector-Rendered W-2 & W-3 PDFs**: Transmittal PDF generator compatible with CPA suites, TurboTax, H&R Block, and IRS OCR parsers.
- **Modern Slide-Over UX**: Responsive UI with right-side slide-over drawers, full light and dark mode support, and glassmorphic surface styling.

---

## Monorepo Architecture

`taxshield-ledger-oss` is part of the TaxShield Ledger workspace:

- **`shared-core`**: Core ledger logic, payroll calculation engine, date resolver, OCR abstraction, and audit logging shared across runtime profiles.
- **`tax-rule-packaging-engine`**: Standalone service (`taxpack`) running on `http://localhost:3333` that validates, diffs, regression-tests, and cryptographically seals tax rule packages (`US-FED`, `PA-STATE`, `PA-LOCAL`, `NJ`, `NY`, `OH`, `DE`, `TX`, `FL`).
- **`taxshield-ledger-oss`** *(this package)*: The single-company open-source edition.
- **`taxshield-ledger-saas`**: The multi-company, multi-tenant commercial edition.

---

## Prerequisites

- **Node.js**: v18+ (Node 20+ recommended)
- **pnpm**: v9+ (`npm install -g pnpm`)
- **PostgreSQL**: Local PostgreSQL server listening on `localhost:5432` or remote cloud database (Vercel Postgres / Neon).

---

## Quick Start

### 1. Install Dependencies

From the workspace root or this directory:

```bash
pnpm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and configure your database connection:

```bash
cp .env.example .env
```

Set the database connection string:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/taxledger?schema=public"
```

### 3. Initialize Database & Run Migrations

The database schema contains 37 relational models managed via Prisma:

```bash
# Apply migrations to initialize the database schema
pnpm prisma:migrate

# Seed baseline jurisdictions and system records
pnpm prisma:seed
```

### 4. Start the TaxPack Distribution Server

In a separate terminal, start the TaxPack rule distribution server (from workspace root):

```powershell
# PowerShell:
.\run-local.ps1 taxpack

# or pnpm script:
pnpm taxpack
```
*(The TaxPack server runs at `http://localhost:3333`)*

Sync statutory tax packages into your local database:
```bash
pnpm taxpack:sync
```

### 5. Start the Application

```bash
pnpm dev
```

The application will start on `http://localhost:3000` (or the next available port).

---

## Testing & Quality Gates

```bash
# Run the complete unit test suite
pnpm test

# Run the statutory tax rule regression test harness
pnpm test:regression

# Typecheck and lint
pnpm lint

# Build production bundle (Vite SPA + bundled Express backend)
pnpm build
```

---

## Database Management Scripts

- `pnpm prisma:migrate` — Apply pending migrations in development.
- `pnpm prisma:reset` — Reset the database and re-run seeds.
- `pnpm taxpack:sync` — Sync sealed tax packages from the local TaxPack server.
- `pnpm db:reset` / `pnpm db:reset:ps1` — Automated clean reset script for local PostgreSQL instances.
