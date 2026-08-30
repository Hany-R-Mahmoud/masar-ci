# MasarCI Visual DevOps Workbench — Execution Charter

<!-- TOKEN_POLICY_BATCHED_EXECUTION -->

Status: `IMPLEMENTATION_VERIFIED_WITH_LIMITATIONS`. `PRE-001` through `PRE-004` are complete; product work is partial and the release gate remains blocked.

## Repository and isolation

- Repository root: `/Users/hanyramadan/new era/ops/apexyard-portfolio/workspace/masar-ci`
- Product identity: MasarCI, confirmed by `README.md`, `docs/portfolio.json`, `web/package.json`, routes, and product copy.
- Base branch: `main`
- Base SHA: `679a86f9d31525e5e0b5e917439dcb4542814d62`
- Feature branch: `codex/masarci-gap-closure`
- Worktree: feature branch created directly from current `main`; implementation in progress.
- Remote: `origin` → `https://github.com/Hany-R-Mahmoud/masar-ci.git`
- Rollback: switch back to `main`; no merge, deploy, push, PR, or external write is authorized.
- Unrelated user changes: none at branch creation.

## Detected stack and current product

- Next.js 16.2.11 App Router, React 19.2.4, strict TypeScript 5.9.3, Tailwind 4.
- Static export/PWA; no API routes, backend, database, or required external service.
- Current routes: `/`, `/landing`, `/workstation`, `/workstation/actions`, `/workstation/docker`, `/workstation/kubernetes`, `/workstation/terraform`, metadata/PWA routes (13 static routes in the production build).
- Current domains: GitHub Actions plus bounded Actions/Compose/Dockerfile/Kubernetes/Terraform static review workspaces. The legacy `/workstation` remains supported.
- Persistence: `masarci:workflow:v1` and `masarci:workspace:v1`; PWA and visitor fallback keys are separate.
- PWA: web manifest, service worker, install provider/action, offline shell for `/` and `/workstation`.
- Parsers: `js-yaml` plus repository canonical Actions model. Current import is normalized and does not preserve every unknown/comment/anchor.
- Tests: Vitest/jsdom; historical counts in prior records are stale. Fresh current-HEAD counts are required before release.
- Design system: graphite dark surfaces, amber primary accent, IBM Plex Sans/Mono, semantic critical/warning/secure colors, desktop three-pane shell, mobile drawers/bottom navigation.

## Design-system decisions

| Area | Evidence | Decision |
|---|---|---|
| Color/type/spacing tokens | `web/app/globals.css`, `DESIGN.md` | Keep; extend with four derived domain accents and shared finding semantics. |
| Three-pane workbench | `web/app/workstation/page.tsx`, `web/app/globals.css` | Refine into a reusable shell with graph/source view and accessible table equivalents. |
| Existing Actions canvas/editors | `web/components/*` | Preserve behind the Actions route; characterize before boundary moves. |
| Mobile bottom navigation/drawers | `web/app/workstation/page.tsx` | Keep interaction model; generalize labels and 44px targets. |
| Landing visual identity | `web/app/landing/page.tsx` | Keep typography and tone; update copy and destinations for four workspaces. |

## Scope resolution

MUST_SHIP: shared contracts/shell/persistence migration; preserved and hardened Actions; complete Compose and Dockerfile vertical slices; Kubernetes authoring/review; immutable Terraform plan review; shared findings/evidence, secret scanning, environment contracts, exact cross-flow links; fixtures/tests/security/accessibility/docs/provenance/receipt.

SHOULD_SHIP: secure GitHub repository adapter only when credential/callback prerequisites exist; richer user-confirmed Terraform/Kubernetes links; extra provider/regional catalogs. Missing prerequisites must be recorded as limitations.

DEFERRED: live Kubernetes/cluster access, kubeconfig/logs, Helm, Kustomize, raw Terraform state, HCL authoring or execution, authoritative cost estimation, GitLab/Bitbucket, cloud deployment, accounts/billing/collaboration, mandatory AI.

## Architecture path

Use a modular monolith under `web/lib/workbench` for shared contracts and `web/lib/domains` for Actions, Compose, Dockerfile, Kubernetes, Terraform, and cross-flow logic. Source documents and immutable review artifacts have separate adapter contracts. Routes share one shell but retain domain models and analysis rule packs.

## Ownership and milestones

- Lead: branch safety, ledger, integration truth, phase gates, receipt.
- Architecture: shared contracts, migrations, adapter boundaries, ADRs.
- Implementer: production changes in the active task's declared scope.
- Security: hostile input, redaction, non-execution, egress, exports, persistence.
- Reviewer: independent full-diff correctness/spec review.
- Tester: baseline, unit/integration/browser/accessibility/migration/build evidence.

Milestones follow the stable task IDs in `task-ledger.md`. One owner writes a module at a time. The first eligible production task is `ARC-001`.

## Baseline gate result

- `pnpm install --frozen-lockfile`: PASS after restoring the missing workspace package declaration.
- `pnpm lint`: PASS.
- `pnpm typecheck`: PASS.
- `pnpm test:run`: historical PASS record (22 files / 56 tests) is stale; fresh current-branch verification pending.
- `pnpm build`: PASS, 13 static routes generated.
- The production build currently fetches IBM Plex through `next/font/google`; a clean restricted-network build therefore needs the font asset available or temporary network access. This is an environment limitation, not an accepted offline-runtime dependency.
- `next.config.ts` still skips Next's internal type validation; removing that escape hatch remains an implementation requirement even though the separate strict typecheck is green.

## Primary risks

- High coupling in `web/app/workstation/page.tsx`.
- Lossless YAML claims exceed current canonical-model behavior.
- LocalStorage quota/recovery and secret persistence.
- Large Terraform artifacts, cancellation, redaction, and zero-network proof.
- PWA cache drift across new static routes.
- Scope size: vertical slices must be coherent, tested product paths rather than disconnected dashboards.

## Blocking questions

None requiring user input. The confirmed pnpm manifest defect was repaired with a reversible repository-local change. External documentation retrieval is not approved; support claims remain conservative and locked to repository-observed packages plus the verified embedded source corpus. Completion remains blocked by the gaps in `completion-receipt.md`.
