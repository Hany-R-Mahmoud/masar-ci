# MasarCI · Stack Notes

> Stack choices, platform compromises, env/deploy notes.

## Recommended stack (spec §4, modernized — see ADR-001)

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 15.x** (App Router, static export) | Spec pinned Next 14; superseded. Next 15 is current stable; React 19 ready. Static export via `output: 'export'`. |
| Language | **TypeScript 5.x** (strict) | As per spec. |
| Styling | **Tailwind CSS 4** | Spec pinned Tailwind 3; superseded. Tailwind 4 is current stable; works with shadcn/ui. |
| UI primitives | **shadcn/ui** | Per spec. Copy-in components (not a dependency), ownable. |
| Pipeline graph | **`@xyflow/react` v12** | Spec named `reactflow` (v11, unmaintained, renamed to `@xyflow/react`). v12 is the maintained successor. |
| YAML | **`js-yaml`** | Per spec. Used to serialize the canonical model → YAML. |
| Code editor | **`@monaco-editor/react`** | Per spec. For editing `run:` shell scripts and displaying generated YAML. |
| Test runner | **Vitest** + **@testing-library/react** | Spec §16 tests run on these. |
| Package manager | **pnpm** | Available locally (10.32.1); fast, disk-efficient. npm is a drop-in alternative. |

## Why the spec pins were superseded (ADR-001)

foundation-builder mandates "prefer latest stable unless a proven compatibility blocker exists; document any older pin with reason." The spec (id `092`, written for a 2024-era prompt set) pinned Next 14 / Tailwind 3 / `reactflow`. As of the execution date these are all superseded by current stable releases with no proven blocker for this static-export, client-only app. Keeping the older pins would ship an unmaintained graph library (`reactflow` v11) on day one. See `docs/adr/ADR-001-stack-versions.md`.

## Runtime environment

- **Node:** v24.13.1 (confirmed on the build machine). Next 15 + React 19 supported.
- **Package manager:** pnpm 10.32.1 (npm 10.9.8 as fallback).
- **OS:** macOS (darwin). Linux/Windows fine for a static-export app.

## Environment variables

The app is client-only and makes no API calls. The only env surface is build-time:

| Var | Used by | Required |
|---|---|---|
| `NEXT_PUBLIC_APP_VERSION` | optional footer/build stamp | no |
| `NODE_ENV` | Next.js build mode | auto |

No secrets, no backend keys. Static export → no runtime env.

## Deploy notes (DEFERRED — prototype-only for now)

- `next build` with `output: 'export'` emits a static site to `out/`.
- Preview locally: `pnpm serve out` (or any static file server).
- Future deploy targets (when un-deferred): GitHub Pages (repo `out` artifact) or Vercel (auto-detects Next.js). Neither requires code changes.

## Platform compromises

- **Static export trade-off:** no server-side rendering, no API routes. Acceptable — the app is a pure client-side generator/linter with no backend need.
- **Desktop-first:** the drag-and-drop canvas is a pointer + keyboard interaction; mobile/touch is not a target. Responsive collapse to a stacked "read-only YAML" view is a post-MVP nicety, not in scope.
- **No GitHub API:** workflows are copied/downloaded by the user. This keeps the app zero-config and secret-free, at the cost of no "push to repo" convenience (explicitly a non-goal).

## Dependency-direction guardrails

- Action presets must pin to **verified commit SHAs or major tags** looked up at implementation time from the actions' public registries — never hallucinated SHAs (see `product-facts.md` in the design phase).
- Linter rules must be checked against current **GitHub Security Lab** guidance at implementation time.
