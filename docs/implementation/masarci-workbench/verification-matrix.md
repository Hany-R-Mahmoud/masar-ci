# Verification Matrix

This matrix is living evidence. `IN_PROGRESS` and `BLOCKED` are not release passes.

| Requirement group | Task IDs | Automated evidence | Real-surface/manual evidence | Status |
|---|---|---|---|---|
| Repository safety/current product | PRE-001–PRE-004 | Preflight and baseline manifest | Branch/base/status and legacy route inventory | PREFLIGHT_PASS |
| Shared contracts and UX | ARC-001, ARC-002 | Contract, migration, limits, persistence, shared-shell, and domain-tool tests | Four domain routes share tools/canvas/source structure | PASS_WITH_LIMITATIONS |
| Actions | ACT-001 | Existing parser/linter plus adapter tests | Catalog/source smoke; Auto-Fix cleared the critical interpolation finding to `Secure & Ready` / zero findings; full editor/export incomplete | IN_PROGRESS |
| Compose | CNT-001 | Compose parser/analyzer tests | Source→canvas dependency graph, PostgreSQL tool insertion, save/reload smoke; `.env.example`/override/export incomplete | IN_PROGRESS |
| Dockerfile | CNT-002 | Dockerfile parser/analyzer tests | Dockerfile catalog plus Command add/Undo smoke; complete editor/export incomplete | IN_PROGRESS |
| Kubernetes | K8S-001, K8S-002 | Multi-doc/reference/policy/redaction tests | Service source→canvas and Ingress add/Undo smoke; full edit/fix/export incomplete | IN_PROGRESS |
| Terraform Review | TFR-001, TFR-002 | Format/redaction/limits/analyzer tests | Redacted immutable source, rejected decision reload, and disabled re-analysis guard | PASS_WITH_LIMITATIONS |
| Secrets/environment/relationships | XFL-001–XFL-003 | Secret, grammar, contract tests | Critical-save blocking and cross-domain evidence smoke | PASS_WITH_LIMITATIONS |
| Optional GitHub adapter | INT-001 | Prerequisite evaluation | Honest unavailable state | READY_WITH_LIMITATIONS |
| Release quality/docs | QA-001, QA-002, DOC-001, REL-001 | Install/lint/typecheck/test/build/diff checks | Four-route Chromium matrix clean; fresh 12-image responsive set; independent a11y/security/privacy/PWA review unavailable | BLOCKED |

## Current evidence

- `pnpm install --frozen-lockfile`: PASS.
- `pnpm lint`: PASS.
- `pnpm typecheck`: PASS.
- `pnpm test:run`: PASS, 25 files / 76 tests on `codex/masarci-gap-closure`.
- `pnpm lint`: PASS on current branch.
- `pnpm typecheck`: PASS after moving stale generated `.next/dev` output aside; clean source typecheck succeeds.
- `pnpm build`: BLOCKED in this restricted environment because `next/font` cannot fetch IBM Plex from `fonts.googleapis.com`; no runtime network dependency is introduced.
- `pnpm build`: PASS, 13 static routes; clean build required temporary access for Google-hosted font retrieval.
- Browser functional smoke: New/template/Undo, Source, Docker switch after hydration, Actions Auto-Fix, Compose tool insertion, Dockerfile Command add/Undo, Kubernetes Service source→canvas and Ingress add/Undo, save→reload restoration, Terraform rejected decision reload, and worker rejection/cancel path exercised.
- Final browser matrix: all four routes loaded with zero console/page errors or warnings; document width matched viewport at the checked viewport; Source/Tools drawers opened.
- Fresh visual evidence: `/private/tmp/masarci-{actions,docker,kubernetes,terraform}-{desktop,tablet,mobile}.png` (12 direct captures at 375/768/1280 widths), all rendered and were visually inspected directly. Independent review remains unavailable.

## Release blockers

Complete domain structural editors/fix workflows and serializers, `.env.example`/override coverage, exact cross-domain relationship acceptance, and independent keyboard/screen-reader/security/privacy/PWA sign-off remain unproven. Terraform decision/report UI and the immutable-review regression are now directly evidenced.

## Criterion-level traceability

The gap-closure branch starts every criterion explicitly as `IN_PROGRESS` until current-HEAD evidence is attached. `PASS` requires the binary evidence required by the handover specification.

| Criterion | Priority | Owner | Evidence anchor | Status |
|---:|:---:|---|---|:---:|
| 1 | P3 | Lead | `execution-charter.md`, branch provenance | PASS |
| 2 | P3 | Lead | `git status`, receipt | PASS |
| 3 | P1 | Implementer | Actions route smoke/tests | IN_PROGRESS |
| 4 | P0 | Implementer | `persistence.test.ts` migration fixtures | IN_PROGRESS |
| 5 | P1 | Implementer | Actions characterization/browser journey | IN_PROGRESS |
| 6 | P1 | Implementer | workspace routes/shared shell | IN_PROGRESS |
| 7 | P1 | Implementer | lifecycle journeys | IN_PROGRESS |
| 8 | P0 | Architecture | `contracts.ts`, adapters, persistence | IN_PROGRESS |
| 9 | P0 | Implementer | invalid-source regression | IN_PROGRESS |
| 10 | P2 | Accessibility | topology table/browser evidence | IN_PROGRESS |
| 11 | P2 | Accessibility | keyboard/mobile/screen-reader evidence | IN_PROGRESS |
| 12 | P1 | Actions | support matrix | IN_PROGRESS |
| 13 | P1 | Actions | parser/editor/fix/export journeys | IN_PROGRESS |
| 14 | P1 | Actions | analyzer tests | IN_PROGRESS |
| 15 | P1 | Actions | static-limit explanations | IN_PROGRESS |
| 16 | P1 | Actions | unsupported/comment preservation fixtures | IN_PROGRESS |
| 17 | P1 | Containers | Compose authoring fixtures | IN_PROGRESS |
| 18 | P1 | Containers | Compose field/support matrix | IN_PROGRESS |
| 19 | P1 | Containers | host-port conflict fixture | IN_PROGRESS |
| 20 | P0 | Containers | `.env.example` generation fixture | IN_PROGRESS |
| 21 | P1 | Containers | base/override fixtures | IN_PROGRESS |
| 22 | P1 | Containers | Dockerfile/.dockerignore journeys | IN_PROGRESS |
| 23 | P1 | Containers | Dockerfile static analysis tests | IN_PROGRESS |
| 24 | P1 | Containers | instruction/fix/unsupported fixtures | IN_PROGRESS |
| 25 | P0 | Security | non-execution tests | IN_PROGRESS |
| 26 | P1 | Kubernetes | multi-document authoring fixtures | IN_PROGRESS |
| 27 | P1 | Kubernetes | required skeleton/redaction fixture | IN_PROGRESS |
| 28 | P1 | Kubernetes | policy/reference tests | IN_PROGRESS |
| 29 | P1 | Kubernetes | unknown-resource preservation fixture | IN_PROGRESS |
| 30 | P1 | Kubernetes | deterministic reversible fix fixture | IN_PROGRESS |
| 31 | P0 | Security | no kubeconfig/cluster/probe checks | IN_PROGRESS |
| 32 | P0 | Terraform | JSON gate/worker/limits tests | IN_PROGRESS |
| 33 | P1 | Terraform | review UI/table/report journey | IN_PROGRESS |
| 34 | P0 | Terraform | deterministic digest fixture | IN_PROGRESS |
| 35 | P0 | Security | Terraform non-execution checks | IN_PROGRESS |
| 36 | P0 | Security | malformed/sensitive/cancelled fixtures | IN_PROGRESS |
| 37 | P0 | Security | outbound-surface audit | IN_PROGRESS |
| 38 | P0 | Security | redaction/save/export blocking tests | IN_PROGRESS |
| 39 | P0 | Security | dismissal/rescan fingerprint tests | IN_PROGRESS |
| 40 | P2 | Crossflow | environment evidence states | IN_PROGRESS |
| 41 | P2 | Crossflow | exact relationship fixtures | IN_PROGRESS |
| 42 | P2 | Crossflow | finding contract/rule metadata tests | IN_PROGRESS |
| 43 | P0 | Security | hostile-input parser suite | IN_PROGRESS |
| 44 | P3 | Tester | clean install/lint/typecheck/test/build | IN_PROGRESS |
| 45 | P3 | Tester | automated coverage report | IN_PROGRESS |
| 46 | P3 | Tester | four-workspace desktop/mobile journeys | IN_PROGRESS |
| 47 | P3 | Accessibility | accessibility review artifact | IN_PROGRESS |
| 48 | P3 | Security | privacy/egress review artifact | IN_PROGRESS |
| 49 | P3 | Docs | README/portfolio/support/provenance reconciliation | IN_PROGRESS |
| 50 | P3 | Lead | completion receipt gate | IN_PROGRESS |
| 51 | P0 | Implementer | Terraform reload regression test | IN_PROGRESS |
| 52 | P0 | Implementer | invalid-source regression test | IN_PROGRESS |
| 53 | P0 | Implementer | throwing-storage regression fixtures | IN_PROGRESS |
| 54 | P1 | Kubernetes | scaffold reference fixtures | IN_PROGRESS |
| 55 | P2 | Accessibility | unique inspector ID tests | IN_PROGRESS |
| 56 | P2 | Accessibility | accessible edge rows/evidence | IN_PROGRESS |
| 57 | P3 | Docs | this matrix plus capability provenance rows | IN_PROGRESS |
## 2026-08-27 validation addendum

<!-- TOKEN_POLICY_BATCHED_EXECUTION -->

- `pnpm lint`, `pnpm typecheck`, `pnpm test:run`, and `pnpm build`: PASS; 25 test files / 76 tests.
- Chromium smoke: Actions, Docker, Kubernetes, and Terraform routes loaded at 1440px and 390px with zero console/page errors; mobile Source/Tools drawers opened; document width matched viewport.
- Terraform decision: Rejected state persisted across reload through the visible Source drawer.
- Docker authoring: Command tool inserted a service; Undo removed it.
- Visual captures: `/private/tmp/masarci-{actions,docker,kubernetes,terraform}-{desktop,mobile}.png`.
- Independent visual reviewer lane unavailable under focused-tier policy; merge, push, PR, and deploy remain unauthorized.

## 2026-08-27 final browser addendum

<!-- TOKEN_POLICY_BATCHED_EXECUTION -->

- Actions: persisted secure state has `Secure & Ready`; the previous `INJECT-001` finding is absent after Auto-Fix.
- Dockerfile: Command tool insertion and Undo both completed with synchronized canvas state.
- Kubernetes: valid Service source parsed into a topology node; Ingress insertion and Undo completed.
- Terraform: restored review is valid; `Review plan` is disabled for immutable reports; visible `rejected` decision survived reload.
- Runtime: all four routes had zero error/warning logs and no document overflow at the checked viewport.
