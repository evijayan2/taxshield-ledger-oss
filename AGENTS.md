# AGENTS.md — TaxShield Ledger

This file tells any coding agent (Antigravity, Claude Code, Cursor, etc.) how to work in this repository. It applies to the whole repo unless a subdirectory has its own `AGENTS.md`, which takes precedence for that subtree.

**Read `docs/taxshield-ledger-development-plan.md` and check `docs/phase-status.md` before starting any task.** `taxshield-ledger-development-plan.md` is the source of truth for phases, dependencies, architecture, and risks. `docs/phase-status.md` is the live tracking document for completed deliverables, test metrics, and pending tasks — **you MUST update `docs/phase-status.md` whenever any feature work or phase deliverable is completed.** This file (`AGENTS.md`) is the short, operational version of the rules that document already spells out in full — if the two ever conflict, the development plan wins and this file should be updated to match it.

---

## What this project is

TaxShield Ledger is a tax-year-aware financial ledger for a micro-LLC: expenses, mileage, payroll, reimbursements, and a full audit trail — designed so every tax calculation can be traced back to the exact rule and source document that produced it. It's being built solo, PA-first, with multi-state support as a required (not optional) feature since the project will be open-sourced for users in other states. Single-owner access only — no multi-user roles, no shared logins; CPA handoff is via PDF/Excel export, not portal access.

---

## The one rule that overrides everything else

**Never hardcode a tax rate, bracket, threshold, or formula in application code — not even as a seed value, a default, or a "temporary" placeholder.** Every rate lives in the `TaxRule` / `TaxRuleVersion` tables, entered through the admin UI (manual in Phase 0/1, automated from Phase 2 on) with a required source citation.

If a task seems to need a hardcoded number to move faster, stop and say so instead of adding it. This is the single most important architectural constraint in the project — a violation here undermines the entire audit-trail/trust model the product is built on.

---

## Working phase by phase

The project is sequenced into 5 phases (0 through 4), each with explicit dependencies, exit criteria, and a risk table in the development plan. Rules for agents:

- **Build one phase at a time, in order.** Don't start Phase 2 work while Phase 1's exit criteria are unmet, and don't reach ahead into Phase 3 "while you're in there." If given a vague instruction like "build the app," ask which phase to work on rather than attempting everything.
- **Keep phase status documentation updated.** Whenever any feature work, phase deliverable, or major bug fix is completed, update `docs/phase-status.md` with the new module status, file references, test metrics, and remaining pending backlog items.
- **Respect the dependency graph**, not just the phase numbers — e.g., Phase 3 depends on *both* Phase 1 (payroll engine to extend) and Phase 2 (automated rule engine to keep multi-jurisdiction rules current). Don't treat either dependency as optional because the other is closer to done.
- **Pause for explicit review before implementing or modifying the Phase 0 core schema** (`Company`, `TaxYear`, `TaxJurisdiction`, `TaxRule`, `TaxRuleVersion`, `EffectivePeriod`, `CalculationSnapshot`, `AuditLogEntry`). This is load-bearing for every later phase. Present the proposed schema/migration as a plan and wait for approval before generating code.
- **Every schema change must create a Prisma migration file.** Whenever modifying `prisma/schema.prisma`, always run `pnpm prisma:migrate` (or `pnpm exec prisma migrate dev --name <migration_name>`) to generate and apply a corresponding migration file in `prisma/migrations/`. Never update database models without generating a matching migration file.
- **Every write path touching money, payroll, or tax calculations must write to the audit trail in the same change**, not as a follow-up task. A feature that can modify a financial record without an audit log entry is incomplete, not "done, logging comes later."

---

## Non-negotiable behaviors by feature area

These come from the risk tables in the development plan — treat them as requirements, not suggestions:

- **No dummy data in application code or app state.** Develop the application strictly for production. All application data comes from user input, verified database state, or official tax rule seed scripts (`prisma/seed.ts`). Never add dummy records, fake sample data, or mock fallback arrays to application state or production code paths.
- **OCR-extracted receipt fields** are shown as "detected, unconfirmed" and require explicit user confirmation before being saved as real expense data. Never auto-save OCR output.
- **New tax rule versions never silently overwrite active ones.** Historical calculations stay locked to the rule version active at the time; only new transactions use a newly activated version. Every activation goes through validation → regression tests → diff view → manual approval, in that order.
- **Only Tier 1 (authoritative government) sources can auto-activate a rule.** Tier 3 (third-party) sources never activate a rule without explicit human confirmation, regardless of how "obviously correct" the data looks.
- **Multi-state payroll runs are blocked, not degraded, when a required jurisdiction's rule isn't `Active`.** Never fall back to a best-guess or default rate for a missing jurisdiction rule.
- **Duplicate/transaction matching defaults to "needs review," not auto-confirmed**, until false-positive rates are actually measured and known to be low.
- **Row-level ownership fields** (`company_id`, `created_by`, etc.) are included on every table from Phase 0 onward, even though only one user exists — this is a schema decision made once, not deferred.

---

## UI Component Creation & Theme Rules

Every developer and coding agent creating or modifying UI components in this repository MUST strictly follow these rules:

1. **Mandatory Dual-Theme Compatibility**:
   - Every single component, view, modal, input, table, badge, and card MUST render correctly and legibly in BOTH Light Mode (`theme = 'light'`) and Dark Mode (`theme = 'dark'`).
   - Testing a UI change only in Dark Mode or assuming Light Mode is unused is an explicit rule violation.

2. **Standardized Glass & Surface Utilities**:
   - Primary surface panels MUST use the global `.glass-panel` class (or `.glass-card` for cards, `.glass-input` for inputs/selects). These utility classes in `src/index.css` automatically handle light and dark mode backgrounds, borders, shadows, text colors, and backdrop blurs.
   - If explicit custom color control is needed, ALWAYS use standard Tailwind light/dark class pairs (e.g. `bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white`).

3. **No Hardcoded Single-Theme Utility Classes**:
   - Never hardcode static dark colors (`text-white`, `bg-slate-900`, `bg-slate-950`, `border-slate-700`, `text-slate-400`) on top-level elements without corresponding light mode variants (`text-slate-900 dark:text-white`, `bg-white dark:bg-slate-900`, `text-slate-600 dark:text-slate-400`, etc.).
   - Text inside containers must dynamically maintain high contrast (WCAG AA compliant) in both light and dark themes.

4. **Central Theme Context & Switcher**:
   - Consume theme state exclusively via `useTheme()` from `src/context/ThemeContext.tsx`.
   - The theme switcher component `ThemeSwitcher` in `src/components/ThemeSwitcher.tsx` must be used for any theme toggling UI.

5. **Modern Slide-Over Drawers (Sliders) Over Centered Modals**:
   - Do NOT use standard centered popup modal windows for dialogs, forms, onboarding, setup wizards, or settings views.
   - ALWAYS use modern **Slide-Over Drawers (Sliders)** that smoothly slide in from the right edge of the screen (`fixed inset-y-0 right-0 max-w-2xl w-full ... slide-in-from-right duration-300`) with a subtle dark backdrop overlay (`bg-slate-900/60 backdrop-blur-sm`).
   - Slide-over drawers keep the application UI sleek, responsive, and state-of-the-art while preserving user context.

---

## Testing expectations

- A rule version cannot move to `ACTIVE` without passing the regression-test harness (fixed set of "inputs → expected output" cases). This exists from Phase 0 onward, not just once automation arrives in Phase 2.
- Any change to calculation logic (payroll, mileage, withholding) needs a regression test added or updated in the same change, not a separate follow-up.
- Multi-state features (Phase 3) should be validated against real, worked examples for each jurisdiction before being considered done — not just unit tests against mocked rule data.

---

## Open source conventions

This repo is intended to be public with outside contributors, most of whom will be adding tax rule data for states other than PA/NJ. Keep this in mind even before the repo is actually public:

- Every `TaxRule` contribution requires a source citation (statute, IRS/state publication, URL) as a hard requirement, not an optional field.
- Treat the manual Tax Rule admin UI (Phase 0) as a primary, permanent interface — it's how contributors will add jurisdictions, not a throwaway tool superseded by automation.
- If you (the agent) deviate from the development plan's scope or sequencing for any reason — adding an unlisted feature, reordering phases, taking a shortcut — surface that decision explicitly in the plan/PR description rather than proceeding silently. Undocumented deviation from the spec is exactly what makes a codebase hard for outside contributors to trust.

---

## Tech stack

- **Framework:** Next.js (App Router) + React
- **Test tooling:** Vite/Vitest for unit and regression tests. (Assumption: "Next.js/Vite/React" is read as *Next.js as the app framework, Vite-powered Vitest as the test runner* — Next.js doesn't use Vite for its own build. Flag this if the intent was actually a separate Vite-built app alongside Next.js.)
- **Database:** Postgres
- **ORM:** Prisma. (Assumption, stated for one reason: Prisma's declarative schema + migration history is a strong fit for the versioned, effective-dated `TaxRule`/`TaxRuleVersion` model this project is built around, and it has first-class Next.js/Vercel support. Drizzle is a reasonable alternative if you'd rather have a lighter, more SQL-like layer — swap this line and the commands below if so.)
- **Local dev environment:** Docker Compose (Postgres, and anything else local dev needs — no cloud dependency required to run the app locally)
- **Hosting:** Vercel
- **CI/CD:** GitHub Actions — lint/test on every PR; a separate deploy workflow pushes to Vercel via the Vercel CLI rather than relying on Vercel's default GitHub auto-deploy, so deploys are explicit and gated by the same CI checks as everything else.
- **Package manager: pnpm, always.** Never use `npm` or `yarn` in commands, scripts, CI, or Docker files — including examples, docs snippets, and one-off suggestions.

---

## Commands

Always use `pnpm`. Never substitute `npm` or `yarn`, even in one-off suggestions.

```bash
# Install dependencies
pnpm install

# Start local Postgres (and any other local services) via Docker Compose
docker compose up -d

# Apply/generate database migrations (Prisma)
pnpm prisma:migrate

# Reset database schema & re-run seed script
pnpm prisma:reset --force

# Seed the database (Phase 0/1: seeds federal + PA tax rules manually, per the no-hardcode rule —
# seed data lives in seed scripts/fixtures, not in application code)
pnpm prisma:seed

# Run the app locally
pnpm dev

# Run the full test suite
pnpm test

# Run the regression-test harness specifically
# (must pass before any TaxRuleVersion can move to ACTIVE — see development plan §Phase 0/2)
pnpm test:regression

# Lint / format
pnpm lint
pnpm format

# Build for production (mirrors what Vercel runs)
pnpm build

# Stop local services
docker compose down
```

---

## Directory structure

Mapped from the four-layer architecture onto Next.js's App Router conventions. Adjust as Phase 0 scaffolding is actually built, but keep the layer boundaries intact — the point of the four layers is that Business Services and the Rules Engine never import a hardcoded rate, and that's easier to enforce (and to review in a PR) if they live in predictable places.

```
/docs                    → development plan, PRD, architecture notes
/prisma
  schema.prisma          → core data model (Company, TaxYear, TaxJurisdiction, TaxRule, TaxRuleVersion...)
  /migrations
  seed.ts                → seeds federal/PA rule data via TaxRule records — never inline rates
/src
  /app                    → Next.js App Router — pages, layouts, route handlers (User Interface layer)
  /server
    /services             → Business Services (expense, payroll, mileage, reimbursement, compliance...)
    /rules-engine         → Tax Rules Engine (rule resolution, effective-date logic, regression harness)
    /ingestion            → Government Source Layer (Phase 2+: per-source ingestion jobs)
    /jurisdiction         → Jurisdiction Resolver (Phase 3)
  /lib                    → shared utilities, Prisma client, auth
/tests
  /regression             → Rule regression-test cases (inputs → expected outputs)
  /unit
/docker-compose.yml       → local Postgres (+ any other local services)
/.github/workflows
  ci.yml                  → lint + test on every PR
  deploy.yml              → deploy to Vercel via CLI on merge to main, gated on ci.yml passing
```

---

## CI/CD expectations

- `ci.yml` runs `pnpm lint`, `pnpm test`, and `pnpm test:regression` on every PR. A PR that touches the Rules Engine or any `TaxRule` seed/fixture data should not be mergeable if the regression suite fails.
- `deploy.yml` deploys to Vercel via the Vercel CLI (not Vercel's default GitHub auto-deploy integration) and only runs after `ci.yml` succeeds on `main` — deploys should never bypass the same checks a PR goes through.
- If you (the agent) are asked to set up deployment and reach for Vercel's built-in Git integration instead, stop and flag that — the explicit GitHub Actions deploy step is a deliberate choice here, not an oversight to "simplify."
