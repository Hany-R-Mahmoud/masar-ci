# MasarCI · Foundation Contract

> Agreed hard decisions and deferred risks. Gate status is the source of truth for whether the project may proceed to scaffold/implementation.

## Contract Gate status: `PASS`

All hard decisions resolved. Two items are `DEFERRED` with documented, low-risk rationale — both are safe to defer per the foundation-builder stop-points rule.

## Agreed decisions

| Gate field | Decision | Source |
|---|---|---|
| Project name | **MasarCI** | spec §1 |
| Target platform | **Web** — desktop-first, client-only static SPA (Next.js static export) | spec §4 |
| Project type | **Dev tool / visual builder** | spec §1, §3 |
| Primary users | Backend engineers, DevOps engineers, open-source maintainers (MENA focus) | spec §1 |
| Main workflow | Canvas (triggers→jobs→steps) → YAML generator → security linter → auto-fix → copy/download | spec §1, §7 |
| Core entities | `Workflow`, `Trigger`, `Job`, `Step` (Action \| Run), `ActionPreset`, `LintFinding`, `Template` | spec §3 |
| Auth decision | **None** — no auth, no GitHub API | spec §3 non-goals |
| Data/persistence decision | **Client-only** — localStorage drafts + YAML/JSON export; no backend | agreed |
| Stack direction | Next.js 15.x · TypeScript 5.x · Tailwind 4 · shadcn/ui · `@xyflow/react` v12 · `js-yaml` · `@monaco-editor/react` · Vitest | ADR-001 |
| Deploy target | **DEFERRED** — prototype-only (`next build` → `out/`); GitHub Pages / Vercel config later | deferred |
| Stop point | **Full builder slice** — all 5 required capabilities runnable locally + DoD | spec §19 |
| Verification expectation | Spec §16 tests + valid GitHub Actions YAML + linter catches top-3 vulns | spec §16, §19 |

## Deferred decisions (safe)

| Item | Rationale | Risk |
|---|---|---|
| Deploy target | Spec mandates "locally runnable implementation". Static export keeps Pages/Vercel open with zero extra work. | None — static SPA, no server runtime. |
| YAML import (paste existing workflow → canvas) | Not in spec; additive post-MVP. | None — does not touch core generation/lint path. |
| Multi-workflow management (save/load multiple drafts) | MVP uses single in-progress workflow + export. localStorage already covers it. | None — additive UX, no data model change. |

## Business-rule invariants (must hold at DoD)

1. Linter flags any `run:` block directly interpolating `github.event.*` → **Critical Script Injection**, suggests `env:` intermediary.
2. Generator defaults to pinned action versions (commit SHA preferred, `@v4` minimum), warns on `@master`/`@main`.
3. Workflows define top-level `permissions:` (least privilege).
4. Tool never executes generated shell scripts locally.

## Hard-to-reverse architecture decisions (ADRs)

- **ADR-001** — Stack versions: modernize spec's older pins to latest stable; spec pins documented as superseded.
- **ADR-002** — Canonical workflow model (TypeScript types) is the single source of truth; YAML generated from it via `js-yaml`, never via string templating.
- **ADR-003** — Linter is a rule engine over the canonical model (not regex over YAML text), so canvas, generator, and linter never drift.

## Out-of-scope (explicit)

- GitHub API read/write of repository workflows.
- GitLab CI / Bitbucket Pipelines.
- Execution of generated shell scripts locally.
