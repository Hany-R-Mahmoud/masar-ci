# MasarCI Design System

## 1. Atmosphere & Identity

MasarCI is a dark, dense CI/CD command surface: quiet, technical, and readable under pressure. Its signature is a warm amber path through cool graphite surfaces, with mono labels making workflow state legible.

## 2. Color

| Role | Token | Value | Usage |
|---|---|---|---|
| Background | `--color-bg` | `oklch(0.18 0.012 250)` | App shell |
| Surface | `--color-surface` | `oklch(0.22 0.014 250)` | Header, panels |
| Surface raised | `--color-surface-2` | `oklch(0.255 0.014 250)` | Cards, active tabs |
| Border | `--color-border` | `oklch(0.32 0.016 250)` | Dividers |
| Strong border | `--color-border-strong` | `oklch(0.40 0.018 250)` | Focused controls |
| Ink | `--color-ink` | `oklch(0.96 0.004 250)` | Primary text |
| Muted ink | `--color-ink-muted` | `oklch(0.66 0.016 250)` | Metadata |
| Faint ink | `--color-ink-faint` | `oklch(0.48 0.014 250)` | Hints |
| Accent | `--color-accent` | `oklch(0.70 0.15 52)` | Active path, focus |
| Actions accent | `--color-domain-actions` | `oklch(0.70 0.15 52)` | Workflow authoring and analysis |
| Containers accent | `--color-domain-containers` | `oklch(0.73 0.12 195)` | Compose and Dockerfile surfaces |
| Kubernetes accent | `--color-domain-kubernetes` | `oklch(0.68 0.15 255)` | Manifest topology and policy |
| Terraform accent | `--color-domain-terraform` | `oklch(0.70 0.14 305)` | Immutable plan review |
| Critical | `--color-critical` | `oklch(0.62 0.22 25)` | Security errors |
| Warning | `--color-warning` | `oklch(0.78 0.15 75)` | Security warnings |
| Secure | `--color-secure` | `oklch(0.72 0.15 150)` | Passing state |

## 3. Typography

- Sans: IBM Plex Sans via `next/font/google`.
- Mono: IBM Plex Mono via `next/font/google`.
- Existing UI scale: 10–13px metadata, 16px shell identity; preserve density.

## 4. Spacing & Layout

- Base rhythm: 4px; existing utility spacing remains source of truth.
- Shell: fixed product/workspace header + bounded three-pane body.
- Navigation measures: tabs are `150–240px`; the desktop tray is `176–232px` and the inspector is `280–430px`.
- Header: MasarCI identity, four-workspace switcher, artifact identity, persistence state, and global import/export actions.
- Left sidebar: builder resources; lower section owns recent workflows.
- Center: interactive graph canvas; right: always-visible source/review plus findings/evidence.
- Body and each long panel own scroll; grid/flex children use `min-h-0`.
- At ≤1100px the inspector yields to the canvas; at ≤760px the resource tray and inspector yield to the canvas, leaving the workflow canvas usable without shell clipping. Mobile workspace buttons reopen each panel as a full-width drawer over the canvas.
- The shell owns `100dvh`; its body is the only page-level scroll boundary. Every nested grid/flex child that owns scrolling uses `min-height: 0`, and no workspace introduces a second full-page scrollbar.

## 5. Components

### Workflow tabs

- Structure: semantic `nav` + tablist + tab buttons.
- States: active, inactive, hover, focus, unsaved, close affordance.
- Accessibility: `aria-selected`, visible focus, keyboard switching.
- Layout: horizontal reel; overflow scrolls horizontally, never the app shell.

### Recent workflows

- Structure: sidebar section with compact buttons.
- States: empty, active, hover, focus, remove.
- Accessibility: labelled buttons; no color-only active state.
- Layout: sidebar stack; sidebar scroll owner.

### Landing hero media

- Structure: full-bleed video inside the stage, with the existing status and workflow labels layered above it.
- States: playing, reduced-motion/static fallback, remote-media failure fallback.
- Accessibility: decorative media is `aria-hidden`; the surrounding hero copy carries the product meaning.
- Treatment: screen-blended graphite/amber motion with edge fades; no standalone media border.

### Workspace switcher

- Structure: semantic `nav` with text-labelled links for Actions, Docker, Kubernetes, and Terraform Review.
- States: current workspace, hover, focus, compact overflow.
- Domain color is supplemental; current state always has text and shape treatment.
- At narrow widths it becomes a horizontally scrollable reel with 44px minimum targets.

### Artifact navigator

- Lists local artifacts and snapshots with explicit type, modified state, digest state, and delete/export actions.
- Source artifacts and immutable review snapshots use distinct labels and controls.
- Keyboard users can create, select, rename, export, and delete without drag interaction.

### Workbench surface

- Authoring domains expose draggable tools, synchronized source, and graph/table equivalents in one three-pane workspace. Terraform keeps the same shell but exposes immutable imported-plan review lenses instead of source editing or execution controls.
- Graphs always have a chronological or relational table equivalent with the same selectable entities and evidence.
- Unsupported syntax stays visible in retained source/raw mode; the UI never implies a lossless structural edit when preservation is unsafe.

### Canvas grammar

- The production Actions canvas is canonical across Actions, Docker, Kubernetes, and Terraform: 24px graphite grid, graphite canvas background, raised job-style node cards, amber handles/active paths, and the same React Flow controls.
- Domain colors identify the selected workspace, tool tray, and review context. They do not recolor the canvas substrate or every topology edge.
- Artifact nodes reuse the Actions job anatomy: strong outer border, raised surface, compact mono header, inset detail row, visible top/bottom connection handles, and an amber selected state.
- States: default, hover, selected, focus, empty, and reduced motion. Selection must use border and shape treatment, not color alone.

### Findings and evidence

- Every finding exposes severity text, rule identifier, bounded evidence location, explanation, and reversible command or preview when available.
- Critical, warning, and secure colors are paired with icons and text.
- Dismissals bind to a finding fingerprint and artifact digest; stale dismissals never silently carry forward.

### Import, export, and recovery

- Imports show limits and domain boundaries before parsing. Failure preserves the prior artifact.
- Exports state exactly what is included, scan for secrets, and fail closed when blocked.
- Persistence status is text-visible (`Saved locally`, `Unsaved`, `Recovery needed`) and never relies only on a transient toast.

## 6. Motion & Interaction

- Preserve existing reduced-motion handling.
- Tab/recent state changes use immediate tonal and accent changes; no decorative motion.
- Focus uses the existing 2px accent outline.

## 7. Depth & Surface

Mixed: borders for structure, tonal shift for active/raised state. No new shadow system.

## 8. Accessibility Constraints & Accepted Debt

- WCAG 2.2 AA intent.
- Full keyboard access for workspace switching, tabs, close controls, artifact navigation, graph/table selection, findings, import/export, and recovery actions.
- Preserve visible `:focus-visible` outline.
- Keyboard-only: no required drag gestures; all reordering/linking commands have buttons or forms.
- Screen reader: landmarks, labelled controls, live parse status, and graph table equivalents expose the same meaning.
- Low vision: text and controls reflow at 200% zoom without hiding primary actions; status never depends on color.
- Situational touch/mobility: primary controls use at least 44px targets and tolerate coarse pointers.
- Reduced motion: all workspace transitions are immediate or removed under `prefers-reduced-motion`.
- Accepted debt: React Grab/Scan/Doctor were not added because they are new dependency/tooling scope; real-browser verification remains a required QA gate after implementation.
