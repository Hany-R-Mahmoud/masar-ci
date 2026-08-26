# Task Ledger

Allowed statuses: `NOT_STARTED`, `IN_PROGRESS`, `PASS`, `BLOCKED`, `DEFERRED`.

This ledger reflects the bounded implementation and observed evidence on 2026-08-25. `PASS` means the scoped contract is implemented and evidenced; it does not imply the full product acceptance brief is complete.

| ID | Scope | Status | Evidence | Residual risk |
|---|---|---|---|---|
| PRE-001 | Repository identity, rules, stack, routes, persistence, PWA, architecture | PASS | `execution-charter.md`, `baseline-manifest.json` | Runtime characterization remains manual. |
| PRE-002 | Isolated feature branch | PASS | Branch/base SHA recorded in receipt | No merge/push/PR/deploy authorized. |
| PRE-003 | Install/typecheck/lint/test/build baseline | PASS | 22 test files / 56 tests; 13-route build | Google font retrieval needs temporary build-time network access. |
| PRE-004 | Scope, support, provenance, limits, owners, DAG | PASS | `support-lock.md`, `capability-provenance.md` | Upstream URLs were not separately retrieved. |
| ARC-001 | Shared typed contracts, adapters, findings, commands, persistence, limits | PASS | `web/lib/workbench/**`; contract/persistence/limits tests | Full domain acceptance still depends on later slices. |
| ARC-002 | Shared shell, four domain routes, legacy compatibility, persistence/recovery, tools/canvas/source/review UI | PASS | `WorkbenchShell`, domain tool/canvas/inspector components, 22-file suite, 13-route build | `/workstation` remains a compatibility alias to the canonical Actions implementation. |
| ACT-001 | Actions authoring, analysis, catalog, permissions, raw coverage, snapshots, exports | IN_PROGRESS | Existing Actions parser/linter plus `/workstation/actions` smoke | Complete catalog/structural editor/fix/export acceptance is not proven. |
| CNT-001 | Compose create/import/catalog/graph/inspect/lint/fix/persist/export | IN_PROGRESS | `compose.ts`; Docker Compose source/topology smoke | Catalog, structural editor, fix workflow, YAML/SVG serializer acceptance incomplete. |
| CNT-002 | Dockerfile stages/cache/permissions/lint/fix/persist/export | IN_PROGRESS | `dockerfile.ts`; Dockerfile switch/save/reload smoke | Complete editor, fix workflow, and serializer acceptance incomplete. |
| K8S-001 | Kubernetes multi-document parse/preserve/graph/table/source/export | IN_PROGRESS | `kubernetes.ts`; Kubernetes route smoke | Complete structural editing/fix/export and unknown-resource coverage incomplete. |
| K8S-002 | Kubernetes policy profiles, evidence, fixes, static boundary | IN_PROGRESS | Kubernetes analyzer/policy source and route smoke | Full profile/fix acceptance incomplete. |
| TFR-001 | Immutable Terraform import, format gate, worker/cancel, digest, redaction, limits | PASS | `terraform.ts`, `limits.ts`, worker; redacted-summary and rejection/cancel smoke | Full timeout/cancellation and viewport evidence incomplete. |
| TFR-002 | Terraform graph/diff/blast-radius/findings/decisions/staleness/report | IN_PROGRESS | Terraform analyzer and Review route smoke | Decision, blast-radius, comparison/diff, staleness, report UI incomplete. |
| XFL-001 | Secret scan, redaction, dismissal/rescan, export/save gates | PASS | `secret-analysis.ts`; tests; critical-save blocking | Full outbound-surface audit remains in final review. |
| XFL-002 | Environment origin/consumer/default/missing/shadowed grammar | PASS | `environment-contracts.ts`, `CrossDomainContracts.tsx` | Evidence is static/name-only and bounded. |
| XFL-003 | Exact Actions→image→container→Kubernetes and Terraform links | IN_PROGRESS | `relationships.ts`; cross-domain UI smoke | Exact relationship acceptance and ambiguity coverage incomplete. |
| INT-001 | Optional secure GitHub adapter | DEFERRED | No credential/callback prerequisite; limitation recorded | Local workflow remains the supported path. |
| QA-001 | Automated traceability and regression fixtures | IN_PROGRESS | 18 test files / 49 tests pass | Suite does not cover every catalog/editor/fix/report journey. |
| QA-002 | Independent visual, browser, keyboard, a11y, security, privacy, PWA review | BLOCKED | Functional smoke; one fresh desktop PNG path | Fresh mobile/full viewport/a11y set was not obtained; screenshot RPC timed out. |
| DOC-001 | README/development/portfolio/provenance/verification/support/receipt reconciliation | PASS | Updated docs and JSON validation | Final receipt remains blocked by product/QA gaps. |
| REL-001 | Final clean verification and merge-readiness handoff | BLOCKED | `completion-receipt.md` | MUST_SHIP gaps and incomplete manual evidence; no READY claim. |

## Manual evidence recorded

- New → Use template → Undo, Source tab, Docker Compose → Dockerfile after hydration, Analyze & save, reload restoration, Terraform redacted immutable summary, and worker rejection/cancel path were exercised in the production browser.
- A screenshot file exists at `/private/tmp/masarci-visual-qa-fresh/actions-desktop.png`, but independent review found it blank and therefore non-evidentiary. The prior 10-image set predates the latest `DomainWorkspace` change and is reference-only.
