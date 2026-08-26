# TOKEN_POLICY_BATCHED_EXECUTION
# MasarCI route critique snapshot

Method: degraded single-context (subagent gate blocked by focused-tier limit; detector run separately).

## Scope

Reviewed `/`, `/landing`, `/workstation`, `/workstation/actions`, `/workstation/docker` in Compose and Dockerfile modes, `/workstation/kubernetes`, and `/workstation/terraform`.

## Design health

| Heuristic | Score | Key issue |
| --- | ---: | --- |
| Visibility of system status | 3/4 | Strong status pills and findings; long import progress is mostly text-only. |
| Match system / real world | 4/4 | Artifact, canvas, source, and evidence metaphors fit DevOps work. |
| User control and freedom | 3/4 | Undo exists; mobile drawers and import cancellation need stronger discoverability. |
| Consistency and standards | 3/4 | Shared domain shell is coherent; Actions tray used a non-semantic button-like div. |
| Error prevention | 3/4 | Local limits and blocked secret exports are clear; destructive/replacement consequences vary. |
| Recognition over recall | 3/4 | Grouped tools and lenses help; canvas-only meaning still depends on domain knowledge. |
| Flexibility and efficiency | 3/4 | Drag/drop, templates, undo, and keyboard tab cycling are useful; shortcuts are undiscoverable. |
| Aesthetic and minimalist design | 3/4 | Distinctive dark evidence-first language; some panels expose too many equal-weight controls. |
| Error recovery | 3/4 | Retained prior workspace and actionable findings help; some errors are dense technical strings. |
| Help and documentation | 2/4 | Boundary copy helps; no in-context first-use guidance for canvas operations or lenses. |
| **Total** | **31/40** | **Good foundation; shared interaction polish is the highest-leverage work.** |

## Per-screen findings

### Landing (`/`, `/landing`)

Strengths: authored visual language, clear product promise, high artifact-to-interface continuity, strong CTA. Priority issues: section kickers and numbered cards add hierarchy layers without adding decisions; the reference caption reveals an internal implementation label; mobile hero/video composition can dominate the actionable copy; install action and meta text are small at narrow widths. Persona red flags: first-timers may not know whether “Open workbench” starts with a safe example or an import; power users get no direct shortcut to a specific workspace.

### Actions (`/workstation`, `/workstation/actions`)

Strengths: mature canvas/source/findings split, direct manipulation, recent workflows, auto-fix flow. Priority issues: tool items visually read as controls but were implemented as `div[role=button]`; dense tray labels and canvas controls compete; mobile bottom navigation exposes only three conceptual areas without communicating current artifact state; copy/undo/import actions are visually similar. Persona red flags: keyboard users depend on custom key handling for tray items; first-timers may not discover that clicking a tray item adds to canvas.

### Docker (`/workstation/docker`, Compose and Dockerfile)

Strengths: shared shell keeps Compose and Dockerfile mental model stable; authoring/review boundary is visible. Priority issues: mode switching adds a second navigation layer above the workbench; source and findings density is high on small screens; “Analyze & save” is overloaded as both validation and persistence. Persona red flags: users can mistake a template switch for a destructive replacement; mobile users must move between tool, canvas, and source drawers to confirm synchronization.

### Kubernetes (`/workstation/kubernetes`)

Strengths: domain-specific tools, visible limits and analysis state, clear no-cluster boundary. Priority issues: resource topology terminology is expert-heavy without first-use explanation; finding counts are visually strong but no direct filter-to-canvas relationship is obvious; source textarea is a large monolithic surface. Persona red flags: first-timers see “selectors”, “security context”, and “blast radius” without a plain-language bridge.

### Terraform Review (`/workstation/terraform`)

Strengths: immutable/redacted posture is explicit, execution boundary is honest, risk/topology lenses fit the task. Priority issues: locked source looks similar to editable source except for helper text; “Review plan” is a less direct action label than “Import and review”; import replacement consequence should be nearer the import action; immutable state needs a stronger visual affordance than a readonly textarea. Persona red flags: reviewers may assume exported JSON is an apply-ready plan; users may not understand why editing is unavailable.

## Shared priority issues

1. **[P1] Semantic and touch interaction integrity.** Replace button-like `div` controls with real buttons; keep minimum action hit areas at 36–44px; make mobile drawer close and selected states obvious. Fixes Actions, Docker, Kubernetes, Terraform.
2. **[P1] Shared header pressure at tablet/mobile widths.** Prevent action overflow, preserve status visibility, and keep navigation usable when labels expand. Fixes all workbench routes.
3. **[P2] First-use discoverability.** Add concise contextual help for drag/select, canvas/source synchronization, lenses, and immutable review. Fixes all workbench routes.
4. **[P2] State language.** Separate validate/analyze/save/import/replace outcomes; expose recovery next to the message. Fixes Docker, Kubernetes, Terraform, Actions.
5. **[P2] Responsive evidence density.** Let findings and source keep priority over decorative chrome at narrow widths; ensure long names and localized copy wrap safely.

## Detector and browser evidence

The bundled detector returned `[]` for the landing, workstation routes, shared workbench components, Actions canvas/tray, and YAML lint panel. No deterministic findings. Browser tab was opened at `http://127.0.0.1:3000/landing`; automated Playwright import was unavailable in this runtime, so no reliable automated screenshot/console overlay is claimed. Live route availability was verified separately through the local Next server.

## Questions for follow-up

- Should immutable Terraform review feel more like a locked evidence record, or remain visually parallel to authoring workspaces?
- Should first-use guidance be inline in the canvas, or a dismissible help surface?
