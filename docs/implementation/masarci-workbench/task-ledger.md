# Task Ledger

<!-- TOKEN_POLICY_BATCHED_EXECUTION -->

Allowed statuses: `NOT_STARTED`, `IN_PROGRESS`, `PASS`, `BLOCKED`, `DEFERRED`.

This ledger reflects the bounded implementation and observed evidence on 2026-08-27. `PASS` means the scoped contract is implemented and evidenced; it does not imply the full product acceptance brief is complete.

| ID | Scope | Status | Evidence | Residual risk |
|---|---|---|---|---|
| PRE-001 | Repository identity, rules, stack, routes, persistence, PWA, architecture | PASS | `execution-charter.md`, `baseline-manifest.json` | Runtime characterization remains manual. |
| PRE-002 | Isolated feature branch | PASS | `codex/masarci-gap-closure` created from `main` at `679a86f` | No merge/push/PR/deploy authorized. |
| PRE-003 | Install/typecheck/lint/test/build baseline | PASS | Current branch: lint PASS; typecheck PASS; test PASS 25 files / 76 tests; production build PASS after removing remote font-fetch dependency <!-- TOKEN_POLICY_BATCHED_EXECUTION --> | Runtime smoke evidence recorded in verification matrix. |
| PRE-004 | Scope, support, provenance, limits, owners, DAG | PASS | `support-lock.md`, `capability-provenance.md` | Upstream URLs were not separately retrieved. |
| ARC-001 | Shared typed contracts, adapters, findings, commands, persistence, limits | PASS | `web/lib/workbench/**`; full suite 25 files / 74 tests | Full domain acceptance still depends on later slices. |
| ARC-002 | Shared shell, four domain routes, legacy compatibility, persistence/recovery, tools/canvas/source/review UI | PASS | `WorkbenchShell`, domain tool/canvas/inspector components, 25-file suite | `/workstation` remains a compatibility alias to the canonical Actions implementation; browser evidence pending. |
| ACT-001 | Actions authoring, analysis, catalog, permissions, raw coverage, snapshots, exports | IN_PROGRESS | Existing Actions parser/linter plus live catalog/source smoke; Auto-Fix moved the critical interpolation finding to `Secure & Ready` / zero findings | Complete catalog/structural editor/fix/export acceptance is not proven. |
| CNT-001 | Compose create/import/catalog/graph/inspect/lint/fix/persist/export | IN_PROGRESS | `compose.ts`; expanded field model, serializer, fix previews, live source→canvas dependency graph, PostgreSQL tool insertion, save/reload, 25-file suite | Structural editor, `.env.example`, override fixtures, and export download evidence remain. |
| CNT-002 | Dockerfile stages/cache/permissions/lint/fix/persist/export | IN_PROGRESS | `dockerfile.ts`; directives, continuation, unsupported preservation, serializer, fix previews; live Dockerfile catalog and Command add/Undo | `.dockerignore`, complete editor, and export evidence remain. |
| K8S-001 | Kubernetes multi-document parse/preserve/graph/table/source/export | IN_PROGRESS | `kubernetes.ts`; raw-document retention, serializer, nested workload model, live Service source→canvas and Ingress add/Undo, 25-file suite | Complete structural editing/fix/export and browser evidence incomplete. |
| K8S-002 | Kubernetes policy profiles, evidence, fixes, static boundary | IN_PROGRESS | Kubernetes analyzer/policy source and route smoke | Full profile/fix acceptance incomplete. |
| TFR-001 | Immutable Terraform import, format gate, worker/cancel, digest, redaction, limits | PASS | `terraform.ts`, `limits.ts`, worker; Terraform tests and full suite 25 files / 74 tests | Full timeout/cancellation and viewport evidence incomplete. |
| TFR-002 | Terraform graph/diff/blast-radius/findings/decisions/staleness/report | PASS | Terraform review card renders summary, resource actions, assumptions/limitations, stale-decision state, persisted approve/reject/dismiss/clear controls; live rejected decision survived reload; restored Review plan is disabled by the immutable-review guard | No apply, state editing, HCL authoring, provider execution, or cost claims. |
| XFL-001 | Secret scan, redaction, dismissal/rescan, export/save gates | PASS | `secret-analysis.ts`; tests; critical-save blocking | Full outbound-surface audit remains in final review. |
| XFL-002 | Environment origin/consumer/default/missing/shadowed grammar | PASS | `environment-contracts.ts`, `CrossDomainContracts.tsx` | Evidence is static/name-only and bounded. |
| XFL-003 | Exact Actions→image→container→Kubernetes and Terraform links | IN_PROGRESS | `relationships.ts`; cross-domain UI smoke | Exact relationship acceptance and ambiguity coverage incomplete. |
| INT-001 | Optional secure GitHub adapter | DEFERRED | No credential/callback prerequisite; limitation recorded | Local workflow remains the supported path. |
| QA-001 | Automated traceability and regression fixtures | IN_PROGRESS | 25 test files / 76 tests pass; P0 reload/storage and Compose regressions covered; four-route Chromium matrix has zero error/warning logs and no document overflow | Suite does not cover every catalog/editor/fix/report journey. |
| QA-002 | Independent visual, browser, keyboard, a11y, security, privacy, PWA review | BLOCKED | Fresh 12-image responsive capture set (375/768/1280 widths), direct browser smoke, and zero runtime warnings/errors | Independent visual/a11y/security/privacy/PWA review lane remains unavailable; screenshots are direct evidence, not independent sign-off. |
| DOC-001 | README/development/portfolio/provenance/verification/support/receipt reconciliation | PASS | Updated docs and JSON validation | Final receipt remains blocked by product/QA gaps. |
| REL-001 | Final clean verification and merge-readiness handoff | IN_PROGRESS | Lint/typecheck/tests/build pass; all four workstation routes load in Chromium with no console/page errors or document overflow; Actions Auto-Fix, Dockerfile add/Undo, Kubernetes source/add/Undo, and Terraform decision/reload journeys exercised | Independent visual reviewer lane unavailable under focused-tier policy; no merge/push/PR/deploy authorized. |

## Manual evidence recorded

- New → Use template → Undo, Source tab, Docker Compose → Dockerfile after hydration, Analyze & save, reload restoration, Terraform redacted immutable summary, and worker rejection/cancel path were exercised in the production browser.
- Fresh responsive captures exist outside the repository at `/private/tmp/masarci-{actions,docker,kubernetes,terraform}-{desktop,tablet,mobile}.png`; all 12 rendered non-blank surfaces were visually inspected directly. No PNG is tracked or staged.
- Final live matrix: all four routes loaded; zero console/page warnings or errors; document width matched viewport; Terraform rejected state survived reload; Dockerfile Command add/Undo and Kubernetes Service source→canvas/Ingress add/Undo passed.
