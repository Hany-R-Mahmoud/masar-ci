# ADR-001 · Stack versions — modernize spec's older pins to latest stable

- **Status:** Accepted
- **Date:** 2026-07-22
- **Decision owner:** foundation-builder + user (planning session)

## Context

The source prompt (`092-github-action-builder-web.md`, id `092` from the 100-ai-prompts set) recommends:

> Next.js 14 (App Router, Static Export), TypeScript 5, Tailwind CSS 3, shadcn/ui, `reactflow`, `js-yaml`, `@monaco-editor/react`.

foundation-builder mandates: *"Prefer latest stable framework and library dependencies for new scaffolds unless a proven compatibility blocker exists; document any older major/version pin with the reason."*

As of the execution date (2026-07-22), the spec pins are all superseded by current stable releases:

- **Next.js 14 → Next.js 15.x** — Next 15 is current stable (React 19). Static export fully supported.
- **Tailwind CSS 3 → Tailwind CSS 4** — Tailwind 4 is current stable; shadcn/ui supports it.
- **`reactflow` (v11) → `@xyflow/react` v12** — `reactflow` v11 is **unmaintained**; the project was renamed/moved to the `@xyflow/react` package at v12. Shipping v11 on day one would start the project on a dead library.

No proven compatibility blocker exists for this static-export, client-only, no-backend app.

## Decision

Modernize to latest stable:

| Layer | Locked |
|---|---|
| Framework | Next.js 15.x (App Router, `output: 'export'`) |
| Language | TypeScript 5.x (strict) |
| Styling | Tailwind CSS 4 |
| UI primitives | shadcn/ui |
| Pipeline graph | `@xyflow/react` v12 |
| YAML | `js-yaml` |
| Code editor | `@monaco-editor/react` |
| Tests | Vitest + @testing-library/react |

The spec's original pins are documented here as **superseded**, not silently ignored.

## Alternatives considered

- **Strict spec adherence (Next 14 / Tailwind 3 / reactflow v11):** rejected — ships an unmaintained graph library and older majors for no benefit; fidelity to a prompt sheet does not outweigh shipping on a supported foundation.
- **Hybrid (keep Next 14 + Tailwind 3, only swap reactflow → @xyflow/react v12):** rejected — keeping Next 14 gains nothing; Next 15 has no blocker for static export and brings React 19. Not worth a half-measure.

## Consequences

- Slightly newer APIs than the prompt's mental model (e.g. Next 15 conventions, Tailwind 4 config style) — absorbed during scaffold.
- `@xyflow/react` v12 has a different import path than `reactflow` v11; scaffold uses v12 APIs.
- All other spec guidance (architecture, UX, linter rules) is version-agnostic and unaffected.
