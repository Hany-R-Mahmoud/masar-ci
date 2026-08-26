# MasarCI current-changes code review

Date: 2026-08-26
Scope: current workspace changes, reviewed with OCR delegate preview/rules
Review mode: report only; no source fixes applied

## Coverage

OCR identified 55 reviewable files out of 83 changed files. All 55 reviewable files were inspected; 0 were skipped. The other 28 files were excluded by the review tool because they were documentation, unsupported file types, generated index data, or default-path tests. Exclusion is not a claim that those files are defect-free.

Verification observed in the workspace: lint, typecheck, test, and production build completed successfully. These checks do not cover the persisted-review and responsive/accessibility failures below.

## Findings, sorted by severity

### Critical

#### C1 — Reloaded Terraform reviews become falsely clean

- File: `web/lib/domains/workspace-adapters.ts:72-98`
- Related: `web/components/workbench/DomainWorkspace.tsx:78-86`
- Category: data integrity / security
- Severity: critical
- Issue: The saved Terraform export contains changes and summary data, but `restoreTerraformReview()` reconstructs the graph with `edges: []` and always returns `findings: []`. A plan that initially shows critical delete/replace findings therefore reopens as a locked review with no findings. The destructive evidence is still present in the summary, but the UI presents the review as clean.
- Suggested fix: Persist the complete review metadata, or reconstruct a validated `TerraformPlanReview` and rerun `analyzeTerraformPlan()` plus dependency-edge construction during restore. Validate the source digest, analyzer version, and policy version before accepting the snapshot. Add a reload regression test covering delete and replace findings.

### High

#### H1 — Invalid edits leave stale findings and exportable stale results on screen

- File: `web/components/workbench/DomainWorkspace.tsx:113-130`
- Category: data integrity / UX safety
- Severity: high
- Issue: `syncDraft()` updates `source` before parsing, then returns on parse failure without clearing `analysis` or `positions`. `analyze()` has the same behavior. The inspector and Export action can therefore continue to display or export the previous valid analysis while the textarea contains a different invalid source.
- Suggested fix: Clear the analysis/graph and disable export when the current source is invalid, or explicitly mark the analysis as stale and require a successful re-analysis before showing findings or exporting.

#### H2 — A persistence load failure can overwrite the rest of the workbench

- File: `web/components/workbench/DomainWorkspace.tsx:94-108`
- Category: data integrity
- Severity: high
- Issue: When `loadWorkbenchState()` returns `{ ok: false }`, `commitAnalysis()` substitutes an empty artifact list and then saves the current artifact. This can replace the entire active workbench with one artifact after malformed or otherwise unrecoverable storage is detected, discarding other domains from the usable state.
- Suggested fix: Abort the save when loading fails, preserve the recovery record, and show a recovery/error action. Only construct the replacement state after a successful read.

#### H3 — Workbench hydration is not safe when local storage is unavailable

- File: `web/lib/workbench/persistence.ts:66-76,102-110`
- Related: `web/components/workbench/DomainWorkspace.tsx:57-63`
- Category: resilience / browser compatibility
- Severity: high
- Issue: `getItem()` calls in `loadWorkbenchState()` and the initial calls in `migrateLegacyActionsStorage()` occur outside a protective `try/catch`. In browsers with blocked or unavailable `localStorage`, the workstation effect can throw before it reaches the app’s recoverable error handling.
- Suggested fix: Route every workbench storage operation through a safe adapter, catch read/write failures, and fall back to in-memory operation with a non-blocking status message. Add a test for a storage object that throws on `getItem()` and `setItem()`.

### Medium

#### M1 — Kubernetes authoring tools emit broken cross-resource references

- File: `web/lib/domains/domain-tools.ts:198-200,242-244`
- Category: correctness
- Severity: medium
- Issue: The Ingress scaffold creates a generated resource name but hardcodes its backend service to `service`. The HPA scaffold similarly hardcodes its target Deployment to `workload`, even when the generated resource name is different or no such resource exists.
- Suggested fix: Resolve an existing compatible target, generate the target and dependent resource together, or require the target name as an explicit user choice. Add tests that validate generated references against generated resource names.

#### M2 — Desktop and mobile inspectors duplicate the same heading ID

- File: `web/components/workbench/CrossDomainContracts.tsx:34-35`
- Related: `web/components/workbench/DomainWorkspace.tsx:221-222,254-256`
- Category: accessibility
- Severity: medium
- Issue: `DomainWorkspace` renders `CrossDomainContracts` in both the desktop inspector and the mobile drawer, but both instances use `id="cross-domain-contracts-title"`. Duplicate IDs make `aria-labelledby` references ambiguous for assistive technology.
- Suggested fix: Pass an instance suffix into `CrossDomainContracts` and generate unique section/label IDs, or use a generated React ID per instance.

#### M3 — The accessible topology table does not expose topology connections

- File: `web/components/workbench/DomainCanvas.tsx:88-92`
- Category: accessibility
- Severity: medium
- Issue: The table is captioned “Topology connections” but contains only node rows and columns for Artifact, Type, and Detail. Screen-reader users receive no From, To, or Relationship information for the graph edges that sighted users see.
- Suggested fix: Render one accessible row per visible edge with source, target, and relationship, and keep a separate node summary if needed. Update the caption to match the table’s actual content.

#### M4 — The Actions workspace has no document heading

- File: `web/app/workstation/page.tsx:321-337`
- Category: accessibility / document structure
- Severity: medium
- Issue: Domain workspaces pass a title into `WorkspaceHeader`, which creates an `h1`, but the Actions workspace does not pass `title` or `titleId`. `WorkflowTabs` is a navigation/tablist, not a page heading, so the route lacks an `h1` landmark for screen readers and document structure.
- Suggested fix: Provide an Actions title/description to `WorkspaceHeader` or add a visually hidden `h1` adjacent to the workspace shell.

#### M5 — Tablet-width headers have no intermediate responsive layout

- File: `web/app/globals.css:99-126,163-173`
- Category: responsive UI
- Severity: medium
- Issue: Header wrapping and the two-column action grid only activate at `max-width: 760px`. Between 761px and 1100px, the fixed artifact-name width, status badge, and several non-wrapping actions compete in one flex row while the workspace grid is already compressed.
- Suggested fix: Add a tablet breakpoint that allows the header to wrap or moves actions to a second row, and verify widths around 768px, 820px, and 1024px with long artifact names/status messages.

#### M6 — Production service-worker registration can miss the load event

- File: `web/components/pwa/PwaProvider.tsx:92-100`
- Category: PWA reliability
- Severity: medium
- Issue: Registration is attached only to a future `load` event. If hydration/effect execution occurs after `load` (or the page is restored in a state where the event has already fired), the listener never runs and the production service worker is not registered.
- Suggested fix: Check `document.readyState`; register immediately when it is already `complete`, otherwise attach the listener. Handle registration rejection with a controlled status/log path.

#### M7 — CI actions are mutable rather than pinned to immutable revisions

- File: `.github/workflows/quality.yml:18-22`
- Category: supply-chain security
- Severity: medium
- Issue: `actions/checkout@v4`, `pnpm/action-setup@v4`, and `actions/setup-node@v4` resolve mutable tags. A tag move can change the code executed by the repository’s verification workflow.
- Suggested fix: Pin each action to a full commit SHA and manage version updates explicitly (for example, with a dependency-update bot).

### Low

#### L1 — CI jobs have no timeout or concurrency policy

- File: `.github/workflows/quality.yml:11-31`
- Category: CI reliability / cost control
- Severity: low
- Issue: The workflow runs install, tests, and a production build without `timeout-minutes` or a `concurrency` group. A hung run can consume runner time, and multiple pushes/PR updates can execute redundant full builds.
- Suggested fix: Add a bounded job timeout and cancel superseded runs per branch/PR while preserving the required protected-branch run.

#### L2 — A generated pnpm-store symlink is included in the workspace changes

- File: `.pnpm-store/v11/projects/4014e401ce31c16652edec2a26635ce4`
- Category: repository hygiene / maintainability
- Severity: low
- Issue: This path is a generated symlink back to `web`, not application source. Committing the local pnpm store layout makes the change set environment-dependent and can create confusing repository state.
- Suggested fix: Remove the generated `.pnpm-store` tree from the change set and add the appropriate store path to ignore rules if it is not already ignored. Keep only the lockfile and workspace configuration required for reproducible installs.

## Coverage ledger

The following reviewable paths were accounted for. Findings above are cross-file where noted; paths without a dedicated finding had no additional actionable issue identified.

### Reviewed with findings or related evidence

`web/app/globals.css`, `web/app/workstation/page.tsx`, `web/components/pwa/PwaProvider.tsx`, `web/components/workbench/CrossDomainContracts.tsx`, `web/components/workbench/DomainCanvas.tsx`, `web/components/workbench/DomainWorkspace.tsx`, `web/lib/domains/domain-tools.ts`, `web/lib/domains/workspace-adapters.ts`, `web/lib/workbench/persistence.ts`, `.github/workflows/quality.yml`, `.pnpm-store/v11/projects/4014e401ce31c16652edec2a26635ce4`

### Reviewed with no additional standalone finding

`docs/portfolio.json`, `web/app/landing/page.tsx`, `web/app/layout.tsx`, `web/app/workstation/layout.tsx`, `web/components/Canvas.tsx`, `web/components/Tray.tsx`, `web/components/YamlLintPanel.tsx`, `web/lib/pwa.ts`, `web/next.config.ts`, `web/package.json`, `web/pnpm-workspace.yaml`, `web/public/sw.js`, `web/tsconfig.json`, `docs/implementation/masarci-workbench/baseline-manifest.json`, `web/app/workstation/actions/page.tsx`, `web/app/workstation/docker/page.tsx`, `web/app/workstation/kubernetes/page.tsx`, `web/app/workstation/terraform/page.tsx`, `web/components/PrivacyTelemetry.tsx`, `web/components/workbench/ArtifactNode.tsx`, `web/components/workbench/CanvasChrome.tsx`, `web/components/workbench/DockerWorkspace.tsx`, `web/components/workbench/DomainInspector.tsx`, `web/components/workbench/DomainToolTray.tsx`, `web/components/workbench/WorkbenchShell.tsx`, `web/components/workbench/WorkspaceHeader.tsx`, `web/components/workbench/WorkspaceSwitcher.tsx`, `web/lib/domains/containers/compose.ts`, `web/lib/domains/containers/dockerfile.ts`, `web/lib/domains/crossflow/environment-contracts.ts`, `web/lib/domains/crossflow/secret-analysis.ts`, `web/lib/domains/kubernetes/kubernetes.ts`, `web/lib/domains/review-lenses.ts`, `web/lib/domains/terraform/terraform.ts`, `web/lib/domains/workspace-presets.ts`, `web/lib/workbench/commands.ts`, `web/lib/workbench/contracts.ts`, `web/lib/workbench/digest.ts`, `web/lib/workbench/findings.ts`, `web/lib/workbench/limits.ts`, `web/lib/workbench/records.ts`, `web/lib/workbench/worker-contracts.ts`, `web/scripts/lint-source.mjs`, `web/workers/analyze-workspace.worker.ts`
