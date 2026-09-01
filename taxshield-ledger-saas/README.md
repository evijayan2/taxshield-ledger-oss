# TaxShield Ledger SaaS

This directory represents the private SaaS runtime profile for TaxShield Ledger.

It is intended to add only the wrapper concerns that are not part of the shared core, including:

- multi-user session and role management
- workspace and company membership access
- billing and subscriptions
- SaaS admin and tenant controls

The business logic and tax engine remain shared with the OSS build through the shared-core package.
