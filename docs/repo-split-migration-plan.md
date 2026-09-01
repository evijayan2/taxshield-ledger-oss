# TaxShield Ledger GitHub OSS + GitLab SaaS Split Plan

## Goal

Split the current monorepo into a safe, low-risk architecture with:

- GitHub: public OSS edition
- GitLab: private SaaS edition
- shared core package: the common tax ledger, payroll, rules engine, and audit logic

The key principle is simple: keep the product logic identical across both products, and isolate only the wrapper concerns (auth, workspaces, roles, billing, tenancy) into the SaaS repo.

---

## 1. Target architecture

### Public GitHub repo

Purpose:

- open-source deployment
- single-owner local usage
- one default company
- multi-year support
- no SaaS-only concerns

### Private GitLab repo

Purpose:

- multi-user SaaS product
- workspace/company tenancy
- roles and permissions
- billing and subscriptions
- company membership and delegation workflows

### Shared core package

The shared package contains everything that must stay identical between both distributions:

- tax rules and jurisdiction logic
- payroll calculations
- expense and mileage ledger
- employee and company domain model
- compliance tasks and audit trail
- export and statement generation
- rule regression harness

This package should be versioned and pulled in by both repos as a dependency rather than duplicated.

---

## 2. Safety rules for the split

1. Do not move production code into a private repo until the OSS repo is fully green and tagged.
2. Treat the current repo as the source of truth until both repos are validated.
3. Keep the business logic layer unchanged; only wrap it with different runtime profiles.
4. Keep billing, multi-user RBAC, and tenancy out of the shared core.
5. Preserve the authoritative rule engine and audit trail behavior exactly.
6. Validate branch workflows before deleting or rewriting the current repository history.

---

## 3. Migration phases

### Phase A — Prepare the repo

1. Create a freeze branch for the current stable state.
2. Tag the current release as a baseline, for example:
   - v0.1.0-baseline
3. Confirm the repo is green:
   - pnpm install
   - pnpm prisma generate
   - pnpm test
   - pnpm test:regression
   - pnpm lint
4. Save the baseline branch in both cloud providers before any split work begins.

Recommended commands:

```bash
git checkout main
git pull --ff-only
git tag v0.1.0-baseline
git push origin v0.1.0-baseline
```

---

### Phase B — Extract the shared core

Create a new package or submodule structure that isolates common logic from SaaS-only frontend wrappers.

Recommended directory split:

```text
shared-core/
  package.json
  tsconfig.json
  src/
  prisma/
  tests/
```

Move or copy the following into the shared core:

- payroll engine
- tax rule resolution
- audit trail service
- ledger domain and calculations
- compliance logic
- shared schema models
- regression harness

What stays in the product-facing app repos:

- UI/UX components
- auth flow
- workspace/company membership management
- billing/purchase flows
- admin panels for SaaS-specific concerns
- wrapper runtime profile logic

---

### Phase C — Create the GitHub OSS repo

Create the public repo from the existing repository or from a clean branch that contains only the OSS runtime profile.

Recommended GitHub repo name:

- taxshield-ledger-oss

Command sequence:

```bash
# Authenticate first
gh auth login

# Create the repo
gh repo create evijayan2/taxshield-ledger-oss --public --source=. --remote=github-oss --push --default-branch main
```

This repo should:

- keep the open-source database schema
- allow a single default company
- use a simplified owner-only auth flow
- omit SaaS billing roles and multi-workspace features

---

### Phase D — Create the GitLab SaaS repo

Create the private repo for the SaaS wrapper and its customer-facing multi-user features.

Recommended GitLab repo name:

- taxshield-ledger-saas

Command sequence:

```bash
# Authenticate first
glab auth login

# Create the private repo
glab repo create your-group/taxshield-ledger-saas --private --clone=false
```

This repo should:

- include the SaaS-only auth/session stack
- add workspaces and multi-company tenant logic
- add roles and permissions
- add subscription and billing modules
- keep the same core domain behavior as the OSS product

---

### Phase E — Configure repo-level protections

For both repos, set these protections before public use:

- require pull requests
- require status checks
- protect main branch
- require code review for production changes
- require CI to pass before merge

For GitHub:

```bash
gh api repos/OWNER/REPO/branches/main/protection --method PUT --input - <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["pnpm lint", "pnpm test", "pnpm test:regression"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1
  },
  "restrictions": null
}
EOF
```

For GitLab, use repository settings to require merge requests and pipeline success.

---

### Phase F — Validate the split

Run a clean validation after both repos are created:

1. Check that both repos contain the same shared-core logic version.
2. Ensure the OSS repo cannot access SaaS-only APIs.
3. Ensure the SaaS repo cannot accidentally embed business logic outside the shared core.
4. Verify the tax rule engine is identical in both codepaths.
5. Confirm regression tests still pass in both projects.

Recommended validation checklist:

```bash
pnpm install
pnpm prisma generate
pnpm test
pnpm test:regression
pnpm lint
```

---

## 4. Recommended repo naming

Use consistent names to avoid confusion:

- GitHub: taxshield-ledger-oss
- GitLab: taxshield-ledger-saas
- shared package: taxshield-ledger-core

This makes the split obvious to contributors and avoids mixing private and public runtime concerns.

---

## 5. Migration sequence with the least risk

1. Freeze the current repo state.
2. Tag baseline and capture a green build.
3. Extract shared-core package.
4. Keep the current repo functional while the extraction is tested.
5. Create the public GitHub repo and push the OSS runtime profile.
6. Create the private GitLab repo and push the SaaS wrapper.
7. Validate both repos against the same core package version.
8. Add CI and branch protections.
9. Update internal docs to state the ownership boundary.
10. Only then retire the old combined repo or keep it as a migration archive.

---

## 6. Important split boundary

Do not put these in the shared core:

- billing
- multi-tenant workspace membership
- permissions and RBAC
- feature flags tied to enterprise plans
- SaaS onboarding flows
- invoice or subscription management

Do not put these in the OSS public repo:

- private auth providers
- SaaS-only admin management
- enterprise billing and entitlement logic

This keeps the public repo trustworthy and keeps the private SaaS repo aligned with real business operations.

---

## 7. Practical recommendation for this repo today

Given the current state of the project, the safest approach is:

- keep the existing GitHub origin as the landing place for the OSS repo
- generate a clean GitLab private SaaS repo from the same fixed baseline
- move the shared logic into a versioned package before pushing the SaaS wrapper
- avoid trying to create a perfect monorepo split in one step

This reduces the risk of accidentally shipping SaaS-only code into the public repo.

---

## 8. Repo bootstrap script

A bootstrap script was created at:

- scripts/create-split-repos.sh

It performs the remote creation flow when GitHub and GitLab auth are already valid. It is intentionally conservative and requires explicit CLI login before creating repositories.

---

## 9. Current environment status

This environment currently has:

- GitHub CLI installed
- GitHub auth not active
- GitLab CLI not installed
- the current repo already pointing to GitHub via origin

That means the actual remote repo creation must be completed by the operator after authenticating locally.
