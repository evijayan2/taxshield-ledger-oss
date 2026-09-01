# Repository Structure for GitHub OSS + GitLab SaaS

## Goal

Keep the product architecture clean by splitting the project into:
- a versioned shared core package
- a public GitHub OSS repo for local self-hosted usage
- a private GitLab SaaS repo for multi-user, multi-company growth

This keeps the tax ledger, payroll rules, compliance engine, and employee workflows identical in both products, while allowing only the wrapper layer to differ.

---

## 1. Recommended repo model

### GitHub repo: public OSS
Purpose:
- open-source product
- one default company
- single owner / admin user
- multi-year support
- easy local install
- public contribution-friendly

### GitLab repo: private SaaS
Purpose:
- multi-user workspace product
- multi-company support
- roles and permissions
- billing and subscriptions
- company membership and tenant access
- employee cross-company support

### Shared package: versioned core
Purpose:
- payroll engine
- tax rules
- ledger operations
- employee/payroll workflows
- audit log
- core domain models
- calculation logic
- compliance logic

This package is consumed by both GitHub and GitLab repos.

---

## 2. Shared core package structure

This is the package both repos depend on.

```text
shared-core/
  package.json
  tsconfig.json
  README.md
  src/
    domain/
      company/
        Company.ts
        CompanyService.ts
      tax-year/
        TaxYear.ts
        TaxYearService.ts
      jurisdiction/
        TaxJurisdiction.ts
        JurisdictionResolver.ts
      tax-rule/
        TaxRule.ts
        TaxRuleVersion.ts
        RuleActivationService.ts
      ledger/
        Expense.ts
        MileageLog.ts
        Reimbursement.ts
      payroll/
        PayrollRun.ts
        PayStub.ts
        PayrollService.ts
      employee/
        Person.ts
        Employment.ts
        Timesheet.ts
        LeaveRequest.ts
        LeaveBalance.ts
        W9Document.ts
        W2Record.ts
      audit/
        AuditLogEntry.ts
        AuditService.ts
      compliance/
        ComplianceTask.ts
        ComplianceCalendar.ts
    services/
      companyService.ts
      payrollService.ts
      taxRuleService.ts
      auditService.ts
      leaveService.ts
      exportService.ts
    rules-engine/
      ruleResolver.ts
      effectiveDateLogic.ts
      regressionHarness.ts
    adapters/
      runtime/
        RuntimeContext.ts
        RuntimeProfile.ts
    lib/
      prisma.ts
      validation.ts
      errors.ts
  prisma/
    schema.prisma
    seed.ts
    migrations/
  tests/
    unit/
    regression/
    integration/
```

This package is intentionally decoupled from SaaS features like billing, auth, or workspace membership.

---

## 3. GitHub OSS repo structure

```text
taxshield-ledger-oss/
  README.md
  package.json
  pnpm-lock.yaml
  tsconfig.json
  next.config.js
  app/
    layout.tsx
    page.tsx
    dashboard/
    settings/
    company/
    tax-year/
    payroll/
    expenses/
    mileage/
    employees/
    compliance/
  src/
    components/
    context/
    lib/
    styles/
    hooks/
  prisma/
    schema.prisma
    seed.ts
    migrations/
  packages/
    config/
  tests/
    unit/
    regression/
  docs/
    architecture.md
    contributing.md
  .github/
    workflows/
```

### OSS runtime profile
- one default user
- one default company
- many tax years allowed
- no multi-user login
- no billing
- no workspaces
- no company-invite flows
- employee records exist but are company-scoped

---

## 4. GitLab SaaS repo structure

```text
taxshield-ledger-saas/
  README.md
  package.json
  pnpm-lock.yaml
  tsconfig.json
  app/
    layout.tsx
    login/
    onboarding/
    workspaces/
    companies/
    employees/
    payroll/
    billing/
    admin/
  src/
    components/
    context/
    hooks/
    lib/
    api/
  packages/
    auth/
    billing/
    roles/
    tenancy/
    company-access/
    onboarding/
  prisma/
    schema.prisma
    migrations/
  infra/
    docker/
    k8s/
    terraform/
  tests/
    unit/
    integration/
  docs/
    architecture.md
    billing.md
    security.md
```

### SaaS runtime profile
- multi-user auth
- workspace / account model
- multiple companies per user
- roles and permissions
- employee cross-company support
- billing and subscriptions
- admin controls
- SaaS-only UI layers

---

## 5. Dependency flow

```text
GitHub OSS repo
   depends on
shared-core

GitLab SaaS repo
   depends on
shared-core
   plus
private SaaS wrapper packages
```

This is the clean separation:
- the core is shared
- the SaaS wrapper adds tenant access and product expansion
- the OSS build simplifies the wrapper path

---

## 6. How the core is versioned

### Recommended package model
Use a semver versioned package such as:
- @taxshield/core

Versioning pattern:
- major: breaking DB or domain logic changes
- minor: additive features without breaking compatibility
- patch: bug fixes and internal correctness fixes

### Recommended release flow
- shared-core is released on its own schedule
- OSS and SaaS repos pin specific compatible versions
- each repo can update to a new core version after testing

Example:
- shared-core v1.4.2
- GitHub OSS uses v1.4.x
- GitLab SaaS uses v1.4.x or v1.5.x depending on its rollout plan

---

## 7. Shared core compatibility rules

The core must never depend on:
- GitHub vs GitLab repo identity
- private SaaS auth packages
- billing packages
- tenant/workspace routing

The core must instead expose generic interfaces such as:
- RuntimeContext
- RuntimeProfile
- CurrentCompanyScope
- CompanyAccessPolicy

This lets each product wrapper provide runtime-specific behavior without rewriting the business logic.

---

## 8. Repo-level governance

### GitHub public repo
Should contain:
- product docs
- public architecture
- open-source contribution policy
- public roadmap
- public tax rule seed scripts
- public tests

### GitLab private repo
Should contain:
- billing logic
- customer support flows
- admin console
- user administration
- SaaS-specific compliance and monitoring
- private tenant settings

---

## 9. Suggested migration plan

### Step 1
Create shared-core package and move the ledger, tax, payroll, and employee logic into it.

### Step 2
Convert the current repo into the OSS app by using the core package and simplifying access to the single-owner mode.

### Step 3
Create the private GitLab repo and add the SaaS wrapper packages on top of the same core.

### Step 4
Keep only shared domain logic in the core and prohibit SaaS-only logic from entering it.

---

## 10. Final recommendation

This is the clean architecture:

- one versioned shared core package
- one GitHub public OSS repo
- one private GitLab SaaS repo
- no duplication of payroll, tax, or ledger logic
- strict runtime adapter boundary between common core and product wrappers

This keeps the codebase maintainable and lets you launch a public open-source product without leaking SaaS private logic.
