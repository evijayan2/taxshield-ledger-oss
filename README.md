# TaxLedger — Small Business Payroll & Compliance Ledger

TaxLedger is a payroll, mileage, and tax compliance accounting platform built with React, Vite, Express, and PostgreSQL.

## Features

- **Staff & Owner Timesheet Management**: Daily time logging with automated shift calculation (regular vs. overtime hours), unpaid meal break deductions, manager approval workflow, and one-click auto-filling into Assisted Payroll runs. Helps S-Corp owner-operators maintain audit-ready IRS "Reasonable Compensation" records.
- **Relational PostgreSQL Persistence**: Automatic table creation for organizations, employees, mileage logs, travel expenses, payroll runs, pay stubs, compliance tasks, timesheets, and state snapshots.
- **Local PostgreSQL Support**: Connects out-of-the-box to local PostgreSQL during development, with automatic database initialization.
- **Vercel Postgres Cloud Ready**: Instant deployment and multi-device cloud synchronization with Vercel Postgres / Neon.
- **PA Tax & Compliance Tools**: Handles PA EIT, PSD codes, LST exemptions, and W-4 withholdings.
- **3rd Party Tax Systems Readable W-2 & W-3 PDF Generator**: Generates vector-rendered IRS Form W-2 (Copies B & C) and Form W-3 Transmittal PDF files compatible with TurboTax, H&R Block, CPA suites, and IRS OCR parsers.

## Prerequisites

- **Node.js**: v18+
- **pnpm**: `npm install -g pnpm`
- **PostgreSQL**: Local PostgreSQL server listening on `localhost:5432` (optional, persistent browser fallback is used if PostgreSQL is offline).

## Quick Start

1. **Install Dependencies**:
   ```bash
   pnpm install
   ```

2. **Configure Environment (Optional)**:
   Copy `.env.example` to `.env` or set environment variables:
   ```bash
   DATABASE_URL="postgres://postgres:postgres@localhost:5432/taxledger"
   ```
   If no environment variable is provided, `pnpm dev` defaults automatically to `postgres://postgres:postgres@localhost:5432/taxledger`.

3. **Start Development Server**:
   ```bash
   pnpm dev
   ```
   The app will run on `http://localhost:3000`.

4. **Run Unit Tests**:
   ```bash
   pnpm test
   ```

5. **Build for Production**:
   ```bash
   pnpm build
   ```

## Local PostgreSQL Setup

When running in development (`pnpm dev`):
- The app automatically connects to your local PostgreSQL instance.
- If the `taxledger` database does not exist yet on your server, the backend will auto-create the `taxledger` database and initialize all 9 relational schema tables.
- Connection status and table metrics can be monitored under **Settings > PostgreSQL Database** in the web interface.
