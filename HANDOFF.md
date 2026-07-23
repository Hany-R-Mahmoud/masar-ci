# MasarCI · Handoff

> Phase 1 (foundation) + Phase 2 (design) + Phase 3 (scaffold + headless core + live shell) complete.
> Stop point reached: **first runnable slice**. The 3 spec §16 acceptance tests are green; the static build is clean; the approved design renders live.

## What was done

### Phase 1 — Foundation (agent-foundation-builder)
- Contract Gate: **PASS** (12/12 fields resolved; 2 safe DEFERRED).
- Docs: `PROJECT_BRIEF.md`, `FOUNDATION_CONTRACT.md`, `STACK_NOTES.md`, `GLOSSARY.md`, `FOUNDATION_PLAN.md`, `DEVELOPMENT.md`, `docs/adr/ADR-001..003`.

### Phase 2 — Design (huashu-design)
- `product-facts.md` — web-verified GitHub Action majors (the spec's `@v4` was outdated; checkout/setup-node/setup-python/upload-artifact/build-push-action are **@v7**, download-artifact **@v8**, deploy-pages **@v5**, cache **@v6**, docker/login **@v4**, ecr-login **@v2**) + authoritative injection-rule source (GitHub Docs security-hardening page).
- `brand-spec.md` — MasarCI identity, oklch dark-first tokens (Theme A approved), IBM Plex Sans/Mono, shape + badge system, anti-slop checklist.
- `_temp/design-demos/masar-ci-mockup.html` + `.png` — hi-fi 3-pane mockup, 4 states, 3 themes. **Approved (Theme A).**

### Phase 3 — Scaffold + headless core + live shell
- `web/` — Next.js 16 (App Router, `output: export`) + React 19 + Tailwind 4 + shadcn-style utils + `@xyflow/react` v12 + `js-yaml` + `@monaco-editor/react` + Vitest.
- Headless core (ADRs 002/003 realized):
  - `lib/model/` — canonical workflow model (single source of truth) + factory.
  - `lib/generate/yaml.ts` — model → GitHub Actions YAML via `js-yaml`.
  - `lib/lint/` — rule engine over the model: `INJECT-001` (script injection, Critical + `env:` auto-fix), `UNPIN-002` (unpinned actions), `PERMS-003` (excessive/missing permissions), `PRT-004` (`pull_request_target` + checkout/run).
- `app/page.tsx` + `components/{Tray,Canvas,YamlLintPanel}.tsx` — live 3-pane shell wired to the real model.

### Phase 4 — Interactive canvas (slices 3–6)
- **Interactive canvas (slice 3)** — `@xyflow/react` v12 with custom `TriggerNode` (hexagon) + `JobNode` (job card holding steps). Nodes derived from the model (single source of truth preserved); drag-to-reposition (positions persisted in state); drag triggers/jobs/actions from the tray onto the canvas; drop actions onto a job to add steps; draw `needs:` edges by connecting job handles → auto-updates `job.needs`; animated rust `needs:` edges + plain trigger→job edges.
- **Step editor (slice 4)** — `StepEditor.tsx` slide-out: edit step name / action repo+ref / `run:` script; edit job name, runner, and `needs` via checkboxes; delete step/job. The `run:` editor uses **`@monaco-editor/react`** (loads Monaco from CDN at runtime, so static export needs no worker bundling).
- **Regional templates (slice 5)** — `lib/templates.ts` with one-click AWS Bahrain (ECR me-south-1), Oracle Jeddah, Salla starters; loaded from the tray.
- **States & persistence (slice 6)** — full state machine (Empty / Building / Warnings / Secure & Ready) via the header pill; **localStorage autosave** of the workflow; **Download .yml** (Blob) + Copy + New (empty).

## Verification status

| Check | Result |
|---|---|
| `pnpm test:run` (spec §16 × 3) | ✅ 3/3 green |
| `tsc --noEmit` | ✅ clean |
| `pnpm build` (static export) | ✅ `web/out/` generated, all pages prerendered |
| Live screenshot | ✅ 1440×900 full-page render captured (`/tmp/masar-live.png`) |
| Fact verification (#0) | ✅ action SHAs/majors + Security Lab guidance web-verified; none hallucinated |
| Anti-slop self-check | ✅ no purple gradients / emoji / card-border-accent filler; one rust accent; semantic colors only on linter status |

## What remains

All four remaining items are now done. Only the contract-deferred additive features remain:

- ✅ **A11y** — tray items are keyboard-operable (Enter/Space to add; role=button; focus-visible ring), flow nodes carry `role=group` + descriptive `aria-label`, and `prefers-reduced-motion` freezes the animated `needs:` edges.
- ✅ **`pull_request_target` / `unpinned-action` auto-fixes** — `PRT-004` downgrades the trigger to `pull_request`; `UNPIN-002` pins known actions to their verified major (`@master`→`@v7`, etc.), and refuses to guess for unknown actions. Both covered by new tests (6/6 green).
- ✅ **Monaco** — `@monaco-editor/react` powers the `run:` editor (CDN-loaded, static-export-safe).
- ✅ **YAML import** — both a paste-box and a `.yml` file upload / drag-drop, via `ImportModal`. `parseYaml()` (the inverse of `generateYaml`, per ADR-002) maps the YAML → canonical model; the linter runs immediately on import and flags any issues. Covered by 3 new tests (round-trip stability, injection-detected-on-import, action-ref parsing incl. SHA detection). Total suite now **9/9 green**.

That was the last contract-deferred item — MasarCI now implements the full spec (definition of done met) plus every polish item from the handoff.

## Deferred (per FOUNDATION_CONTRACT.md)

- Deploy target (prototype-only; static export keeps Pages/Vercel open).
- YAML import (paste → canvas) — post-MVP.
- Multi-workflow management.

## Self-improvement check (foundation-builder step 11)

- **js-yaml import interop:** `import yaml from "js-yaml"` resolved to `undefined` under Next 16's bundler; fixed with named `import { dump, load }`. Worth recording if a learning backlog exists.
- **Next 16 > ADR-001's "15.x":** "latest stable" drifted to 16 mid-project; harmless, but ADR-001's version literal should be re-stamped "latest stable at scaffold time" rather than a hard major.
- **JSX parser quirk:** a multiline `<span>` with a `cn()` ternary followed by a sibling inline-ternary span triggered a cascade of phantom JSX errors; extracting the line into its own `YamlLine` component resolved it. Lesson: keep map-row JSX minimal and one-component-per-row.
