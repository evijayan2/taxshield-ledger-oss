# TaxShield Ledger OSS

This directory represents the public open-source runtime profile for TaxShield Ledger.

It is intentionally limited to:

- single-owner access
- one default company
- multi-year support
- no SaaS-only billing, roles, or workspace logic
- shared-core dependency for the tax engine and ledger behavior

The actual product logic stays in the shared core package so both the OSS and SaaS builds remain aligned.
