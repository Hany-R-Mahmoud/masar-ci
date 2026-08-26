# Verification Matrix

This matrix is living evidence. `IN_PROGRESS` and `BLOCKED` are not release passes.

| Requirement group | Task IDs | Automated evidence | Real-surface/manual evidence | Status |
|---|---|---|---|---|
| Repository safety/current product | PRE-001–PRE-004 | Preflight and baseline manifest | Branch/base/status and legacy route inventory | PREFLIGHT_PASS |
| Shared contracts and UX | ARC-001, ARC-002 | Contract, migration, limits, persistence, shared-shell, and domain-tool tests | Four domain routes share tools/canvas/source structure | PASS_WITH_LIMITATIONS |
| Actions | ACT-001 | Existing parser/linter plus adapter tests | Actions route/source smoke; full editor/fix/export incomplete | IN_PROGRESS |
| Compose | CNT-001 | Compose parser/analyzer tests | Docker Compose source/topology smoke | IN_PROGRESS |
| Dockerfile | CNT-002 | Dockerfile parser/analyzer tests | Switch after hydration and save/reload smoke | IN_PROGRESS |
| Kubernetes | K8S-001, K8S-002 | Multi-doc/reference/policy/redaction tests | Kubernetes route smoke; full edit/fix/export incomplete | IN_PROGRESS |
| Terraform Review | TFR-001, TFR-002 | Format/redaction/limits/analyzer tests | Redacted immutable source and rejection/cancel smoke | IN_PROGRESS |
| Secrets/environment/relationships | XFL-001–XFL-003 | Secret, grammar, contract tests | Critical-save blocking and cross-domain evidence smoke | PASS_WITH_LIMITATIONS |
| Optional GitHub adapter | INT-001 | Prerequisite evaluation | Honest unavailable state | READY_WITH_LIMITATIONS |
| Release quality/docs | QA-001, QA-002, DOC-001, REL-001 | Install/lint/typecheck/test/build/diff checks | One fresh desktop PNG; mobile/full viewport/a11y set incomplete | BLOCKED |

## Current evidence

- `pnpm install --frozen-lockfile`: PASS.
- `pnpm lint`: PASS.
- `pnpm typecheck`: PASS.
- `pnpm test:run`: PASS, 22 files / 56 tests.
- `pnpm build`: PASS, 13 static routes; clean build required temporary access for Google-hosted font retrieval.
- Browser functional smoke: New/template/Undo, Source, Docker switch after hydration, save→reload restoration, Terraform redacted immutable summary, and worker rejection/cancel path exercised.
- Fresh visual evidence: `/private/tmp/masarci-visual-qa-fresh/actions-desktop.png` exists as a real PNG (1280×577), but independent review found it blank and therefore non-evidentiary. The fresh mobile capture timed out. The earlier 10-image set predates the latest `DomainWorkspace` change and is reference-only.

## Release blockers

Complete domain catalogs/structural editors/fix workflows and serializers, Terraform decision/blast-radius/comparison/report UI, exact cross-domain relationship acceptance, and the fresh responsive/keyboard/screen-reader/security review set remain unproven.
