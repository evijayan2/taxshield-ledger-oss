# TaxShield Ledger — Engineering Development Plan (v3)

**Status:** Ready for development
**Derived from:** Revised TaxShield Ledger PRD (deep-research-report-v2)
**Purpose:** Turn the product vision into a build-ready roadmap with explicit dependencies, sequencing logic, and risk mitigations.

---

## Instructions for the Coding Agent

If you're an AI agent (e.g., Antigravity, Claude Code) working from this document, follow these rules before writing any code:

1. **Work one phase at a time, in order (0 → 1 → 2 → 3 → 4).** Do not start implementing a later phase's items until the current phase's exit criteria (stated at the end of each phase section) are met. If asked to "build the app," ask which phase to start with rather than attempting all of §4 at once.
2. **Treat §3's hard rule as non-negotiable:** the Business Services and Tax Rules Engine layers must contain zero hardcoded tax rates, brackets, or thresholds — not even as placeholder/seed values in application code. Every rate is a `TaxRule` row, entered via the Phase 0 admin UI. If a task seems to require a hardcoded rate to move faster, stop and flag it instead of proceeding.
3. **Respect the dependency graph in §5** before proposing an implementation order — in particular, Phase 3 depends on both Phase 1 (payroll engine) and Phase 2 (automated rule engine), not just whichever is more convenient to extend.
4. **Pause for explicit review before implementing anything in Phase 0.** The core data model (`Company`, `TaxYear`, `TaxJurisdiction`, `TaxRule`/`TaxRuleVersion`, `CalculationSnapshot`, `AuditLogEntry`) is load-bearing for every later phase — a wrong schema decision here is expensive to unwind once Phase 1–2 are built on top of it. Present the proposed schema as a plan artifact and wait for approval before generating migration/model code.
5. **Every write path that touches money, payroll, or tax calculations must log to the audit trail (Phase 0/1) in the same change, not as a follow-up task.** Don't treat audit logging as separable from the feature it's logging.
6. **When a phase's risk table (in §4) names a specific failure mode, treat its mitigation as a requirement, not a suggestion** — e.g., OCR output must be shown as "detected, unconfirmed" rather than auto-saved; new rule versions must never silently overwrite active ones.
7. **If you find yourself deviating from this document's sequencing or scope** (adding a feature not listed, reordering phases, hardcoding something "temporarily"), stop and surface that decision explicitly rather than proceeding silently — this project is intended to be open-sourced, and undocumented deviations from the spec make it harder for contributors to trust the codebase later.

---



The source document is a strong *product* spec but a weak *build* plan: its "Phase 1/2/3" list groups 28 features by ideal user value, not by what actually has to exist first. Three structural problems, and how this plan fixes them:

| Problem in original phasing | Fix in this plan |
|---|---|
| Regression testing (item 20) is listed in Phase 2, but Phase 1 payroll/mileage already depend on trusting rule calculations from day one. | A minimal regression-test harness moves into **Phase 0/1**, before any tax math ships. |
| No explicit "Phase 0" — the data model (TaxRule, TaxYear, Jurisdiction, audit snapshot) is described in depth but never scoped as its own build step, even though *every other feature reads or writes it*. | Added **Phase 0: Foundations**, which is pure schema + skeleton, no user-facing features. Nothing in Phase 1 can start without it. |
| The "core rule" of the product — never hardcode tax rates — is a philosophy, not a task. As written, a developer could build Phase 1 payroll with hardcoded 2026 rates and still tick every box. | Phase 0 explicitly includes a **manual Tax Rule admin UI** as a hard gate: Phase 1 payroll/mileage are technically *blocked* on it, not just encouraged to use it. |
| Multi-state payroll (Phase 3) and the automated rule-update engine (Phase 2) are treated as independent tracks, but multi-state payroll is meaningless without an engine that can ingest many jurisdictions' rules at once. | Explicit dependency: **Phase 3 cannot start until Phase 2's automated ingestion pipeline is live**, not just "recommended after." |
| Permissions/multi-user (originally item 27, deep in Phase 3 of the source PRD) was bundled with unrelated advanced features. | Initially pulled into a separate Phase 4 — since dropped entirely (see §2): this build is single-owner-only, and the CPA gets file exports, not portal access. Phase 4 is now "Reporting & Polish," not "Collaboration." |

Everything else — field lists, entity names, UI copy, the audit-trail philosophy — is carried over unchanged from the source PRD; this document only adds sequencing, dependency, and risk structure on top of it.

---

## 2. Assumptions

**Team size: 1 person.** Everything below is sequenced strictly linearly — no parallel tracks, no "split across workstreams." §6 is rewritten accordingly (solo pacing and cut-scope guidance instead of parallel-track advice), and every phase below now carries a rough solo-effort size so you can see where the time actually goes.

**Personal use case: single jurisdiction (PA) — you and your employees all live and work in Pennsylvania — but the product itself needs multi-state support**, since other open-source users won't all be PA-only. Phase 3 (multi-state) is therefore **in scope as a real feature to build**, not an optional cut — see the revised §6.

**Access model: single user (owner) only, indefinitely.** No multi-user roles, no shared CPA login. The CPA gets PDF and Excel exports, not portal access. This removes multi-user roles and the CPA portal from the plan entirely — see the revised Phase 4 below.

No hard external deadline is assumed. If you're working toward a real one (e.g., "usable before next tax season"), read §6's sequencing guidance first — for a solo build, the honest lever isn't working faster, it's building states progressively rather than trying to cover all 50 before shipping.

---

## 3. Architecture Recap (unchanged from PRD, restated for reference)

Four layers, with one hard rule:

```
User Interface
      ↓
Business Services  (Expense, Payroll, Mileage, Reimbursement, Compliance...)
      ↓
Tax Rules Engine    (versioned rule repository, effective-date resolution)
      ↓
Government Source Layer  (IRS/state/local ingestion — Phase 2+)
```

**Hard rule:** the Business Services + Rules Engine layers contain zero hardcoded tax rates, ever — not even in Phase 1. Every rate, bracket, or threshold is a `TaxRule` row, populated manually at first and automatically from Phase 2 onward.

Core entities that everything else depends on: `Company`, `TaxYear`, `TaxJurisdiction`, `TaxRule` / `TaxRuleVersion`, `Employee`, `Expense`, `CalculationSnapshot`, `AuditLogEntry`.

**Stack mapping:** implemented as a single Next.js (React) application — not the "microservices" implementation the source PRD sketched as an example — with an ORM-managed Postgres database, deployed to Vercel. The four layers above map to Next.js's own structure rather than separate services: UI is the App Router's pages/components, Business Services and the Tax Rules Engine live in server actions / route handlers plus a `lib/` domain layer, and the Government Source Layer (Phase 2+) runs as scheduled/background jobs rather than a standalone service. See `AGENTS.md` in the repo root for the concrete directory layout and commands.

---

## 4. Phases

### Phase 0 — Foundations
*No user-facing features. This is the load-bearing wall everything else stands on.*

**Solo effort estimate:** ~2–3 weeks. Feels slow because there's nothing to click at the end of it — resist the urge to skip straight to Phase 1's UI.

**Why this matters more for you than most solo builds:** because you're going open source, Phase 0's data model is the *entire* mechanism by which strangers will later add states you've never lived in. Build the schema to the PRD's full jurisdiction-agnostic shape now (`TaxJurisdiction` as a real table, not a hardcoded PA-shaped assumption) even though you'll only ever populate PA + federal rules yourself. That's a schema decision, not extra feature work — it costs you nothing to load fewer rows, but it's expensive to retrofit a jurisdiction-agnostic model onto code that assumed PA everywhere.

**Build:**
- Core data model: `Company`, `TaxYear`, `TaxJurisdiction`, `TaxRule`, `TaxRuleVersion`, `EffectivePeriod`
- Tax Rule lifecycle states (`DISCOVERED → ... → ACTIVE → SUPERSEDED`) as a state machine, even though only `APPROVED`/`ACTIVE` are reachable manually in this phase
- **Manual Tax Rule admin UI** — the only way rates enter the system until Phase 2. Every rate needed for Phase 1 (federal/PA withholding, FICA, Medicare, mileage) is entered here, with source citation fields required (not optional) from day one
- Calculation Snapshot mechanism (any calculation records which `TaxRuleVersion` it used)
- Minimal regression-test harness: a small fixed set of "gross wages in → expected withholding out" cases that must pass before any rule is marked `ACTIVE`
- Auth/user model (single-owner only — this is the permanent access model, not a placeholder for multi-user work later)

**Depends on:** nothing (root of the graph)

**Blocks:** every subsequent phase

**Exit criteria:** an admin can manually enter a 2026 federal withholding rule with a source citation, the regression harness validates it, and it becomes queryable by jurisdiction + date.

**Risks:**
| Risk | Mitigation |
|---|---|
| Over-engineering the data model before any real usage validates it (e.g., designing for 50-state multi-local support that Phase 1 never touches) | Build the schema to the PRD's conceptual model, but only implement UI/queries for the fields Phase 1 actually needs. Unused fields stay nullable, not unbuilt-around. |
| Manual rule entry UI feels like throwaway work engineers will want to skip | Frame it explicitly as permanent infrastructure — Phase 2's automated ingestion *writes to the same tables*, it doesn't replace this UI, it feeds it. |

---

### Phase 1 — Core Ledger (MVP)
*The first version a real owner could use to run their business.*

**Solo effort estimate:** ~7–10 weeks. This is the biggest single phase — it's the whole product's spine (expenses, mileage, payroll, reimbursements, audit trail) in one pass. Payroll (item 6) and audit trail logging (item 9) are the two items most likely to run long; everything else is fairly standard CRUD.

**Build:**
1. Company & LLC setup (profile, EIN, classification)
2. Tax-year setup (create year, attach jurisdiction)
3. Expense tracker (entry + configurable categories)
4. Receipt upload/storage (manual: photo → upload → categorize)
5. Mileage tracker (manual log; rate looked up from Phase 0's rule tables by trip date — never entered by the user)
6. Basic single-state payroll (rule-driven, reads federal/state/FICA/Medicare rules entered in Phase 0)
7. Reimbursement workflow (manual: submitted → reviewed → approved → paid → reconciled)
8. Compliance calendar (static due dates, no automation)
9. Audit trail logging (every edit logged with who/when/old value/reason)
10. Year-end export (CSV/PDF for accountant)

**Depends on:** Phase 0 complete (rule tables populated and queryable; snapshot mechanism working)

**Blocks:** Phase 2 (automation has nothing to automate without a working manual baseline) and Phase 3 (multi-state payroll extends this single-state engine, doesn't replace it)

**Exit criteria:** an owner can run a full payroll cycle, log expenses and mileage, get a mileage deduction computed from Phase-0-seeded IRS rates (never hardcoded), and export a year-end package — end to end, no gov integration required.

**Risks:**
| Risk | Mitigation |
|---|---|
| Manual tax rule entry (Phase 0 UI) becomes a maintenance burden the moment mid-year rate changes hit (e.g., the 2026 mileage rate change on 07/01) | This is expected and intentional at this stage — the effective-dated rule model (built in Phase 0) already handles it correctly; it just requires a human to type the new rate in. Automating that typing is explicitly Phase 2's job, not Phase 1's. |
| Single-state payroll assumption breaks for early users who already have a remote employee in a different state | Document this limitation clearly in-product ("multi-state support coming") rather than quietly producing wrong withholding. Do not silently apply single-state logic to a multi-state situation. |
| Audit trail logging is treated as a "nice to have" and deprioritized under time pressure | Treat it as part of the Definition of Done for every write path in this phase, not a separate ticket — it's structurally required for every later audit-readiness feature. |

---

### Phase 2 — Automation & Reconciliation
*Removes manual toil without weakening the trust model.*

**Solo effort estimate:** ~6–9 weeks, and the widest range in this plan — the rule-automation work (items 17–18) can balloon if a government source's format is unusually messy to parse. Consider timeboxing OCR/bank-import (11–14) first since they're self-contained and give you a visible win before tackling the harder ingestion pipeline.

**Build:**
11. OCR for receipt extraction (auto-fill vendor/date/total, user confirms)
12. Bank CSV import (transactions)
13. Receipt-to-transaction matching (MATCHED / UNMATCHED / DUPLICATE / NEEDS REVIEW)
14. Duplicate detection
15. Audit readiness score/dashboard (per-expense and company-wide)
16. CPA export package
17. **Automated Tax Rule Update Engine** — Tier 1/2/3 source classification, ingestion pipeline, full lifecycle automation (`DISCOVERED → ... → APPROVED`), diff view, rule-change alerts, "no silent overwrite" workflow
18. Full regression-testing framework (formalizes and expands the Phase 0 harness — now runs automatically on every proposed rule version, not just manually)

**Depends on:** Phase 1's manual rule entry and calculation-snapshot mechanism proven correct in production — the automated engine writes into the *same* tables Phase 0/1 built, it doesn't introduce a parallel path

**Blocks:** Phase 3 (multi-state payroll needs the automated engine to keep dozens of jurisdictions' rules current — doing that by hand doesn't scale)

**Sequencing note:** OCR, bank import, and duplicate detection (11–14) are independent of the rule-automation work (17–18) — build them first. Same total effort either order, but this order gives you a working, demoable improvement well before the harder ingestion-pipeline work is done.

**Exit criteria:** a new IRS rate change is detected, validated against regression tests, diffed for the owner, and activated — with zero hand-typed rates and zero silent changes to historical calculations.

**Risks:**
| Risk | Mitigation |
|---|---|
| Government source formats (IRS PDF/HTML layout) change or break scrapers | Treat every source integration as expect-to-break; keep the Phase 0 manual entry UI alive permanently as a fallback, not a Phase-1-only crutch. |
| OCR misreads amounts/vendors on messy receipts, silently corrupting expense data | Always show OCR output as "detected, unconfirmed" and require explicit user confirmation before it's treated as a real expense field — never auto-save OCR output. |
| Automated matching/duplicate detection produces false positives, eroding user trust in the audit-readiness score | Default new matches to "needs review" rather than auto-confirmed; only auto-confirm after the false-positive rate is measured and low. |
| Rule ingestion pipeline becomes the single most complex and highest-liability piece of the whole system | Treat Tier 1 (authoritative gov sources) as the only auto-activatable tier; Tier 3 (third-party data) never activates a rule without explicit human confirmation, exactly as the PRD specifies — don't relax this under schedule pressure. |

---

### Phase 3 — Multi-State & Advanced Compliance
*The highest-value, highest-liability phase — get here only once the rule engine is trustworthy. This is now a required phase, not optional, since the product needs to support states beyond PA for other users.*

**Solo effort estimate:** ~9–13 weeks. The Jurisdiction Resolver (items 19–20) is genuinely hard — it's the one piece of this whole plan that's closer to a small tax-law engine than a CRUD feature. Because you personally only need PA, you can build and validate this against your own PA data first, then treat additional states as an incremental, ongoing effort rather than a single monolithic milestone — see §6.

**Build:**
19. Employee Location / Jurisdiction data model (residence, work location, effective dates)
20. Jurisdiction Resolver service (residence + work-location + date → applicable jurisdictions)
21. Multi-state, multi-local payroll (extends Phase 1's single-state engine)
22. Local tax automation (EIT/LST/municipality-level rules, via Phase 2's ingestion engine)
23. New-Year Wizard (guided annual rollover: create year → confirm locations/employees → resolve jurisdictions → download rules → validate → diff → activate)
24. Tax Rule Coverage Matrix (per-jurisdiction readiness dashboard; blocks payroll runs that need a rule still in "Review" status)
25. Asset/depreciation tracking
26. Home office module
27. Advanced Tax Impact Simulator

**Depends on:** Phase 2's automated rule engine (can't keep 20+ state/local jurisdictions current by hand) and Phase 1's payroll engine as the base being extended, not replaced

**Blocks:** nothing downstream

**Exit criteria:** an employee who splits work days between two states gets wages correctly allocated and withheld per-jurisdiction, with the Coverage Matrix showing all relevant rules as `Active` before the payroll run is permitted.

**Risks:**
| Risk | Mitigation |
|---|---|
| This is the module with real legal/financial consequences if wrong — incorrect multi-state withholding is a compliance failure for the user, not just a bug | Ship it behind an explicit "multi-state (beta)" flag; require the Coverage Matrix to block any payroll run touching an unvalidated jurisdiction rather than degrade gracefully. |
| Scope explosion — 50 states × unlimited localities is effectively unbounded | Explicitly limit initial scope to the two location types and three arrangements the PRD specifies (full-time office / hybrid / fully remote); customer-site and complex travel scenarios stay out of scope and are named as such, not silently unsupported. |
| The New-Year Wizard becomes a yearly crunch point (must be ready before January) | Build and test it against a full year-end cycle at least one full quarter before the actual year-end it needs to support. |

---

### Phase 4 — Reporting & Polish
*Rounds out the single-owner experience — no longer a "collaboration" phase, since there's no multi-user access to build.*

**Solo effort estimate:** ~2–4 weeks, notably smaller than earlier drafts of this plan — multi-user roles and a CPA portal (previously items 28–29) are dropped entirely per your access model: the CPA gets files, not a login.

**Build:**
28. Advanced document management (versioning, search)
29. Global search
30. Notification/alert system
31. Mobile-first capture flows (expense/mileage/receipt entry in <30s)

One addition worth calling out explicitly even though it's not a new module: confirm the **CPA export package** (Phase 2, item 16) and **year-end export** (Phase 1, item 10) both produce clean **Excel** output alongside PDF — the PRD's language leans PDF-first, but a CPA workflow usually wants the underlying numbers in a spreadsheet, not just a formatted document. Worth treating as an explicit acceptance criterion on those two items rather than assuming PDF covers it.

**Depends on:** a stable data model across Phases 0–3 — search cuts across every table already built

**Blocks:** nothing; this is the terminal phase in the dependency graph

**Exit criteria:** the owner can find any record via global search within a couple of clicks, and both PDF and Excel exports are usable as-is by an outside accountant with no app access.

**Risks:**
| Risk | Mitigation |
|---|---|
| Mobile UX is treated as a skin on the desktop flows rather than its own design effort | Scope it as a genuine parallel design track, not a responsive-CSS afterthought — the PRD's <30-second capture goal requires a purpose-built flow. |
| PDF/Excel exports drift out of sync with the data model as new fields get added in Phases 1–3, quietly becoming incomplete for the CPA | Treat export-package completeness as part of each earlier phase's Definition of Done (e.g., "Phase 3 payroll data appears in the export"), not a one-time Phase 4 task. |

---

## 5. Dependency Graph

```
Phase 0 (Foundations)
   │
   ▼
Phase 1 (Core Ledger / MVP)
   │
   ├──────────────┐
   ▼              ▼
Phase 2        (Phase 1 also directly
(Automation)    feeds Phase 3's payroll
   │             extension)
   ▼              │
Phase 3 ◄─────────┘
(Multi-State)
   │
   ▼
Phase 4
(Reporting & Polish)
```

Key rule encoded in this graph: **Phase 3 has two incoming dependencies, not one** — it needs Phase 1's payroll engine to extend *and* Phase 2's automated rule engine to keep it current. Starting Phase 3 work before Phase 2 ships means either hardcoding multi-state rates (violating the core architectural principle) or building a second, throwaway manual-entry path.

---

## 6. Solo Sequencing & Scope Notes

**Total, straight through all 5 phases: roughly 26–38 weeks (~6–9 months)** of solo effort, sequential, no shortcuts on the dependency graph. Phase 4 shrank a fair amount from earlier drafts of this plan (no multi-user roles, no CPA portal), which is the main thing pulling the total down; Phase 3 stays large because multi-state is now confirmed as real scope, not a nice-to-have.

**Sequencing:** strictly Phase 0 → 1 → 2 → 3 → 4, in that order, per the dependency graph in §5 — nothing here is safe to parallelize solo, since each phase's exit criteria are the next phase's starting assumptions. Within a phase, do the items marked as independent (e.g., Phase 2's OCR/bank-import before its rule-automation work) so you get visible progress before the harder pieces.

**Your personal need vs. the open-source codebase's need, now that multi-state is confirmed as real scope:**

- **What you need to run your own business:** PA + federal rules are enough to fully validate Phases 0–2 end to end — you can build and test the whole core ledger, payroll, and automation stack against real data (your own) before Phase 3's added complexity enters the picture at all.
- **What Phase 3 needs to be genuinely useful to other states' users, not just architecturally ready for them:** unlike the earlier draft of this plan, you don't get to defer this — build the Jurisdiction Resolver and multi-state payroll for real. The practical mitigation is *progressive state coverage*, not skipping the phase: ship Phase 3's engine validated against PA + 1–2 neighboring states (NJ is already the PRD's running example) rather than trying to pre-load and test all 50 states before anything ships. Each additional state after that is closer to a data-entry task (new `TaxRule` rows) than new engineering, once the resolver itself works.

**Because multi-state is required, the Phase 2 automated rule-ingestion pipeline (items 17–18) is worth keeping in scope rather than skipping** — the earlier draft of this plan suggested you could get by on manual rule entry alone as a PA-only user, but once Phase 3 exists, you (or contributors) will be maintaining rules for several jurisdictions at once, and that's exactly the maintenance burden the automated engine exists to remove. OCR and bank reconciliation (11–14) are still worth building first inside Phase 2 for the quick, visible win, but don't plan to drop 17–18 the way the earlier version of this plan suggested.

**A realistic incremental target:** Phase 0 → Phase 1 → Phase 2 gets you a fully usable, audit-ready **PA-only** ledger in roughly 15–22 weeks — a genuine, shippable milestone worth treating as v1.0, even with Phase 3 still ahead of it. Multi-state (Phase 3) and reporting polish (Phase 4) follow after that, either by you or picked up by early contributors once the project is public.

---

## 7. Consolidated Risk Register

Ranked by a rough sense of (likelihood × impact), not phase order:

| # | Risk | Category | Phase | Mitigation summary |
|---|---|---|---|---|
| 1 | Incorrect multi-state withholding causes real compliance exposure for users — now a core-scope risk, not an optional-feature risk | Legal/Compliance | 3 | Beta flag + hard block on unvalidated jurisdictions; ship PA+1–2 states validated before broadening (§4/§6, Phase 3) |
| 2 | Rule ingestion pipeline auto-activates a bad rule, silently corrupting future calculations | Legal/Compliance, Technical | 2 | Tier-based auto-activation limits, regression gate, human approval for Tier 3 |
| 3 | Government source formats break scrapers without warning | Technical | 2 | Keep manual entry UI alive permanently as fallback |
| 4 | Audit trail / snapshot logging skipped under schedule pressure, undermining the whole "trust model" | Product/Scope | 1 | Bake into Definition of Done, not a separate backlog item |
| 5 | OCR/matching false positives erode user trust in automation | Product/Scope | 2 | Default to "needs review," not auto-confirmed |
| 6 | Data-model over-engineering delays Phase 0 for features not needed until Phase 3+ | Product/Scope | 0 | Schema matches PRD's full conceptual model; UI/queries built only as needed |
| 7 | Manual tax-rule entry (Phase 0/1) is error-prone before automation exists | Data/Security | 0–1 | Required source-citation fields + regression harness from day one |
| 8 | New-Year Wizard becomes a yearly crunch point | Product/Scope | 3 | Test a full cycle at least one quarter ahead of the real deadline |
| 9 | Mobile UX treated as an afterthought vs. its own design effort | Product/Scope | 4 | Scoped as a parallel track, not responsive CSS |
| 10 | A community-contributed tax rule for a state you don't personally use is wrong or unreviewable by you, and produces bad withholding for that user | Legal/Compliance | 3 / OSS | Mandatory source citations + regression tests as merge requirements (§9); consider separate merge rights for rule data vs. code |
| 11 | Exports (PDF/Excel) drift out of sync with new data added in later phases, quietly shortchanging the CPA workflow that's your only accountant-facing surface | Product/Scope | 4 | Treat export completeness as part of each phase's Definition of Done, not a Phase 4 afterthought |

---

## 8. Success Metrics (carried over from PRD, mapped to phases)

- **Phase 1:** expense capture <30s; mileage entry <30s; every calculation traceable to a rule version (100%)
- **Phase 2:** ≥95% of expenses with required receipts/business purpose; 0 historical calculations silently changed
- **Phase 3:** every payroll run blocked, not degraded, when a required jurisdiction rule isn't `Active`
- **Phase 4:** quarterly compliance prep <5 minutes (no exceptions); new tax year setup <10 minutes

---

## 9. Open Source Considerations

Publishing this as open source changes a few things beyond code visibility — worth deciding early since some of it (schema, disclaimers) is much cheaper to bake in from Phase 0 than to retrofit.

**Tax rules as community contributions, not just your own data entry.** The Phase 0 manual Tax Rule admin UI you're building for yourself is also, functionally, the contribution mechanism for every other state — someone in Ohio adds their state's withholding rule the same way you add PA's. This is a strong argument for keeping that UI (and its required source-citation fields) solid and well-documented even though you personally only ever touch PA + federal — other contributors will be using it as their primary interface into the project.

**Rule contributions carry real financial consequences for strangers, more so than typical open-source PRs.** A bad line of application code might crash; a wrong tax rate silently produces incorrect withholding for someone else's payroll. Worth deciding your review bar before it's needed:
- Require a source citation (statute, IRS/state publication, URL) on every contributed `TaxRule`, not just as a nice-to-have field but as a merge requirement — this is already the PRD's design, just worth treating as non-negotiable for community submissions specifically.
- Consider requiring the regression-test harness (Phase 0/2) to pass on any new rule before it's mergeable, not just before it's activated in a running instance.
- Decide who has merge rights on rule data early — this is a different trust question than who has merge rights on application code, and conflating them is a common open-source tax/finance-tool failure mode.

**Disclaimers, independent of license.** You mentioned license isn't a concern right now, and that's fine to defer — but the disclaimer point is worth separating out because it's about user expectations, not legal structure: most open-source finance/tax tools carry an explicit "not tax advice, no warranty, verify with a professional" statement prominently in the README and often in the app UI itself, precisely because the audience is trusting it with real filings. Cheap to add whenever you get to it, no license decision required first.

**Practical effect on the plan above:** none of this changes the phase sequencing or effort estimates — it just means Phase 0's schema work and the disclaimer/README work are worth treating as "ship before going public," even though they're not user-facing features on the roadmap itself.

## 10. Open Questions for You

- Which state(s) beyond PA to validate Phase 3 against first, since "PA + 1–2 neighbors" is the realistic starting scope rather than all 50 at once — NJ is the PRD's own running example and a natural first pick if you don't have a stronger reason to choose otherwise.
- Whether you want to actively recruit/support other-state contributors early, or keep the project PA/NJ-tested for a while and let further states be a "PRs welcome, use at your own risk" area until proven out.
