# Unified Safe Fixing Across MasarCI Workspaces

Status: approved implementation specification

## Problem Statement

MasarCI analyzes four local-first workspaces: GitHub Actions, Docker Compose and Dockerfile, Kubernetes manifests, and Terraform plan review. Findings currently have inconsistent remediation behavior. Actions exposes a legacy Auto-Fix path; Compose, Dockerfile, and Kubernetes have deterministic preview helpers that are not consistently reachable from the shared inspector; Terraform correctly remains review-only. Source preservation, stale-preview handling, re-analysis, undo, and verification are not governed by one lifecycle.

Users need a safe, evidence-based way to understand, preview, apply, reject, verify, and undo findings without losing authorable source or implying runtime proof that MasarCI does not have.

## Solution

Provide one shared finding lifecycle:

`Analyze -> Explain -> Preview -> Confirm or Dismiss -> Apply -> Re-analyze -> Export`

The lifecycle uses the existing workspace analysis, finding, source-change, undo, persistence, and inspector seams. Domain analyzers remain responsible for domain rules; the shared workbench owns fix eligibility, preview freshness, confirmation, application, inverse commands, and post-apply analysis.

Fixes are deterministic where possible, source-preserving, previewed before application, validated after application, tied to a source or plan digest, and blocked when parser coverage or safety is insufficient.

Terraform remains review-only. It must not rewrite plan JSON, mutate state, execute providers, or apply infrastructure.

## User Stories

1. As a MasarCI user, I want every finding to show severity, rule ID, source location, evidence, explanation, limitation, and next action, so that I can make an informed decision.
2. As a user, I want to preview the exact source diff before changing an artifact, so that I can verify the proposed result.
3. As a user, I want unsafe or uncertain findings clearly marked as manual review, so that Auto-Fix never suggests unsupported confidence.
4. As a user, I want deterministic fixes applied only after confirmation, so that source changes remain intentional.
5. As a user, I want every applied fix to be undoable, so that I can recover the previous source.
6. As a user, I want the analyzer to run again after a fix, so that the UI reflects the actual post-fix state.
7. As a user, I want stale previews rejected when source changes before application, so that an old diff cannot overwrite newer work.
8. As a user, I want comments, unknown fields, extensions, and unsupported syntax preserved, so that importing and fixing a file does not destroy authoring context.
9. As a user, I want malformed or partially supported source left unchanged, so that an invalid parse cannot produce a destructive rewrite.
10. As an Actions user, I want direct untrusted GitHub context interpolation in `run` blocks detected, so that script injection risks are visible.
11. As an Actions user, I want injection findings to propose safe environment-variable handling, so that untrusted values do not become shell source.
12. As an Actions user, I want injection fixes limited to patterns whose shell behavior can be proven safe, so that a security change does not silently change workflow behavior.
13. As an Actions user, I want action versions checked against a reviewed catalog, so that immutable references are based on verified evidence.
14. As an Actions user, I want mutable tags distinguished from immutable commit references, so that version stability is explicit.
15. As an Actions user, I want permission and `pull_request_target` findings presented for explicit review when semantics or secrets access may change.
16. As a Docker user, I want privileged mode, host mounts, Docker socket access, host networking, writable roots, excessive capabilities, secrets, and mutable tags detected.
17. As a Dockerfile user, I want root users, unpinned bases, broad `COPY`, remote `ADD`, download-and-execute patterns, cache problems, and missing health guidance detected.
18. As a Docker user, I want safe Compose and Dockerfile changes previewed without executing Docker commands or mutating the host.
19. As a Kubernetes user, I want schema, selector, reference, image, probe, resource, privilege, capability, host-exposure, and secret findings separated by concern.
20. As a Kubernetes user, I want selector, probe, resource, and security-field changes previewed with relationship-impact information.
21. As a Kubernetes user, I do not want the system inventing operational values such as ports, resource limits, probes, or credentials.
22. As a Terraform user, I want destructive changes, replacements, dependency fan-out, unknown values, sensitive values, and broad change sets explained.
23. As a Terraform user, I want review decisions tied to the exact immutable plan digest, so that decisions cannot silently transfer to another plan.
24. As a Terraform user, I want changed plan input to invalidate previous decisions, so that review is repeated when evidence changes.
25. As a user, I want suspected secrets detected across supported source types with redaction and safe-export blocking.
26. As a user, I want environment-variable relationships shown across Actions, containers, Kubernetes, and Terraform.
27. As a user, I want repair attempts and verification results recorded in an audit history.
28. As a user, I want long source, diff, and finding panels to remain scrollable.
29. As a user, I want the canvas/source separator resizable, so that I can inspect long source and topology content.
30. As a user, I want status text to distinguish critical findings, warnings, informational findings, and total findings accurately.

## Implementation Decisions

### Shared integration seam

Use the existing shared workspace lifecycle as the highest seam:

- workspace source analysis
- shared finding, remediation, and fix-preview contracts
- workspace source-change and undo flow
- shared domain inspector
- existing per-domain analyzers and preview helpers

Do not create separate route-specific fix engines.

### Fix proposal contract

Each proposal includes:

- domain
- finding ID and rule ID
- source digest at preview time
- source location
- safety classification
- before and after representation
- human-readable diff
- evidence and limitations
- validation result
- reversibility information
- apply availability
- required post-apply analysis

Support states are explicit:

- `complete`: full supported coverage proven by fixtures
- `partial`: unsupported paths remain visible
- `lossless`: source structure and meaningful formatting preserved
- `normalized-safe`: normalized output allowed only with diff and confirmation
- `raw-only`: structural editing disabled
- `blocked`: source preserved; save/export of mutated content disabled

### Apply, undo, and freshness

Every apply operation must:

1. Verify the current source digest.
2. Verify the finding still exists.
3. Verify the preview is current.
4. Show the final diff.
5. Require confirmation when semantics or security posture may change.
6. Apply one typed source command.
7. Store the inverse command in the existing undo history.
8. Reparse and re-analyze.
9. Replace stale findings and stale previews.
10. Persist only validated source.

Source edits must not be applied through a lossy serializer. Unsupported constructs remain in source and switch the proposal to partial, raw-only, or blocked behavior as appropriate.

### GitHub Actions behavior

Support script-injection detection for untrusted context expressions, safe environment-variable remediation for supported patterns, shell-safe variable use, immutable action-reference recommendations, reviewed catalog metadata, permission review, and `pull_request_target` review.

An injection fix is eligible for automatic application only when the expression can be moved to a step environment without overwriting existing keys, the shell variable use is safe, the surrounding command shape is understood, and post-fix linting can prove the original finding is resolved. Otherwise show a manual remediation with evidence.

Never invent action SHAs. A catalog recommendation must expose its source, review date, trust status, deprecation status, and limitations. Permission or trigger changes remain review-only when they can affect secrets or event semantics.

### Docker and Compose behavior

Analyze privileged containers, host networking, socket and host-path mounts, literal secrets, mutable image tags, writable roots, capabilities, missing health checks or resources, undefined references, cycles, ports, mounts, root users, mutable base images, unsafe `ADD`, download-and-execute patterns, cache/layer issues, sensitive build context, multi-stage relationships, and shell-form guidance.

Only deterministic source-local changes may be applied. Do not execute Docker, access a daemon, mutate the host, delete secret references, or silently remove comments, profiles, extensions, or unsupported fields.

### Kubernetes behavior

Keep parsing, schema validation, relationship analysis, policy analysis, and explanation separate. Allow deterministic previews for selectors, labels, probes, resources, and security fields only when values are inferable from source context and relationship impact is shown.

Never invent credentials, resource values, ports, availability settings, cluster state, or live observations. Unresolved references remain visible after fixes.

### Terraform behavior

Terraform plan artifacts remain immutable and redacted. Supported actions are acknowledge, reject, needs verification, and blocked. Each decision stores the plan digest, change or finding reference, rationale, and timestamp when available.

Do not generate HCL, rewrite plan JSON, modify state, execute providers, apply infrastructure, or claim authoritative cost estimates.

### Cross-flow security

Use shared secret scanning and environment-contract analysis. Secret results include source locations, redacted display, remediation guidance, safe-export blocking, and fail-closed behavior on scanner errors. Environment relationships include evidence and confidence; inferred relationships must not be presented as runtime proof.

### Inspector and layout behavior

The shared inspector exposes finding filters, severity counts, source navigation, evidence, remediation, Preview Diff, Apply Fix when safe, Dismiss, Needs Review, Undo, stale-preview warnings, and validation results.

Long source, findings, and diff regions own their scroll containers. The canvas/source separator remains keyboard-usable and resizable. Status labels use text and icons in addition to color and distinguish critical findings from warnings.

All new controls follow the existing MasarCI `DESIGN.md` tokens, visible focus treatment, keyboard access, 44px touch targets, reduced-motion behavior, and graph/table equivalence rules.

## Execution Steps and Checklists

### Phase 1: Shared contract

- [ ] Add source digest and domain to fix previews.
- [ ] Add safety classification and explicit apply availability.
- [ ] Add typed apply and inverse commands.
- [ ] Add validation and re-analysis state.
- [ ] Reject stale previews.
- [ ] Preserve unsupported source content.
- [ ] Prevent export of blocked or invalid mutations.

### Phase 2: Shared UI lifecycle

- [ ] Connect the shared inspector to fix previews.
- [ ] Connect Apply to the workspace source-change path.
- [ ] Reuse the existing undo stack.
- [ ] Re-analyze after every successful apply.
- [ ] Invalidate previews after any source change.
- [ ] Add accessible diff presentation.
- [ ] Make source, findings, and canvas regions scrollable.
- [ ] Make the canvas/source separator resizable.
- [ ] Correct critical, warning, info, and total status wording.

### Phase 3: Actions

- [ ] Harden injection remediation.
- [ ] Add safe environment mapping for supported command shapes.
- [ ] Guard unsupported shell patterns.
- [ ] Preserve existing environment keys.
- [ ] Add verified immutable-reference recommendations.
- [ ] Keep permission and trigger changes review-only unless deterministic.
- [ ] Add critical injection fixtures.
- [ ] Verify the reported injection finding disappears only after evidence-backed remediation.

### Phase 4: Docker and Compose

- [ ] Connect Compose previews to the shared inspector.
- [ ] Connect Dockerfile previews to the shared inspector.
- [ ] Add permission and mount remediation evidence.
- [ ] Add secret detection and safe-export blocking.
- [ ] Add unsupported-syntax preservation tests.
- [ ] Add Compose and Dockerfile before/after fixtures.
- [ ] Verify no Docker daemon or host command executes.

### Phase 5: Kubernetes

- [ ] Connect Kubernetes previews to the shared inspector.
- [ ] Add schema and relationship-impact previews.
- [ ] Block invented operational values.
- [ ] Add selector, probe, resource, and security fixtures.
- [ ] Verify unresolved references remain visible after fixes.

### Phase 6: Terraform

- [ ] Keep plan artifacts immutable.
- [ ] Add digest-bound review decisions.
- [ ] Invalidate decisions after changed plan import.
- [ ] Add destructive-change and replacement fixtures.
- [ ] Verify no Auto-Fix control appears for Terraform findings.

### Phase 7: Cross-flow verification

- [ ] Add environment-contract fixtures.
- [ ] Add secret-redaction fixtures.
- [ ] Add audit-history and verification fixtures.
- [ ] Verify safe export behavior.
- [ ] Verify persistence and reload behavior.
- [ ] Verify undo after every applicable domain fix.

## Testing Decisions

Tests verify observable behavior, not implementation details.

Required coverage:

1. Contract tests for findings, remediation, previews, digests, commands, and inverse commands.
2. Domain analyzer tests for every supported rule.
3. Preview tests for deterministic, unavailable, blocked, and manual-review cases.
4. Round-trip tests for valid and partially supported source.
5. Security tests for injection, secrets, privileged containers, host exposure, and literal credentials.
6. Persistence tests for source, undo history, review decisions, and stale digests.
7. Workspace integration tests for Preview, Apply, Re-analyze, Undo, Dismiss, and export.
8. Browser verification for all four workspaces, long source files, resizable panes, scrollable inspectors, and keyboard operation.
9. Regression fixture for the reported Actions `INJECT-001` finding.

Verification commands:

```text
cd web
pnpm lint
pnpm typecheck
pnpm test:run
pnpm build
```

Acceptance requires deterministic fixes to produce the expected diff, unsafe fixes to remain review-only, digest changes to invalidate previews, applied fixes to be re-analyzed, undo to restore prior source, unsupported syntax to be preserved, Terraform artifacts to remain immutable, and no finding to disappear without evidence.

## Out of Scope

- Live GitHub API mutation.
- Live Docker daemon access.
- Live Kubernetes cluster access.
- `kubectl` execution.
- Terraform execution or apply.
- Terraform state mutation.
- Automatic secret rotation.
- Authoritative cost estimation.
- AI-generated unverified patches.
- Automatic permission, trigger, credential, or deployment-semantic changes without explicit review.

## Further Notes

Existing foundations include shared workbench contracts, domain analyzers, Compose/Dockerfile/Kubernetes preview helpers, Actions Auto-Fix UI, Terraform review decisions, persistence, and undo. The principal implementation gap is that these capabilities are not consistently connected through one preview/apply/re-analyze lifecycle.

The highest-value first acceptance case is the reported Actions `INJECT-001` finding: import source, show evidence, preview a safe environment-based remediation, apply it with confirmation, re-analyze, reach the correct secure status, export the validated source, and undo back to the original source.
