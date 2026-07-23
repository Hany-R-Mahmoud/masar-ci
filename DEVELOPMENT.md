# MasarCI · Development

> Setup, build, sync, run, deploy, and verification commands for every supported platform.
> Update this file whenever commands, package managers, native targets, env setup, or verification steps change.

## Prerequisites

| Tool | Min version | Verified on this machine |
|---|---|---|
| Node.js | 20+ (Next 16 requires ≥20) | v24.13.1 |
| pnpm | 9+ | 10.32.1 |
| Git | any | ✓ |

> Stack actually scaffolded: **Next.js 16.2.11** + React 19.2.4 + Tailwind 4.3.3 (16 is the current latest stable — newer than ADR-001's "15.x" note, which is the natural drift of "latest stable"). ADR-001's principle (prefer latest stable) still holds; the doc just predates Next 16's release.

> npm is a drop-in alternative to pnpm: replace `pnpm` with `npm` and `pnpm dlx` with `npx`.

## Install

The app lives in `web/`. All commands run from there.

```bash
cd web && pnpm install
```

## Dev server (local development)

```bash
cd web && pnpm dev
# → http://localhost:3000
```

Hot reload. The canvas, step editor, and YAML/lint panels render in the browser — no backend.

## Build (static export)

```bash
cd web && pnpm build
# emits a fully static site to web/out/
```

`next.config.ts` sets `output: 'export'` + `images.unoptimized`. No API routes, no server runtime.

## Preview the static export

```bash
cd web && pnpm dlx serve out
# → http://3000 (serves web/out/)
```

## Lint & type-check

```bash
cd web && pnpm lint          # tsc --noEmit
cd web && pnpm exec tsc --noEmit
```

## Test

```bash
cd web && pnpm test            # watch mode
cd web && pnpm test:run         # single run (CI)
cd web && pnpm test:coverage    # with coverage report
```

Acceptance tests (spec §16) — **all green**:

| Test | Location | Trigger |
|---|---|---|
| Linter flags `run: echo ${{ github.event.issue.title }}` (Critical) + `env:` auto-fix | `web/lib/lint/rules/__tests__/script-injection.test.ts` | `pnpm test:run` |
| YAML generator structures `strategy.matrix` | `web/lib/generate/__tests__/matrix.test.ts` | `pnpm test:run` |
| `deploy` job depending on `build` auto-injects `needs: [build]` | `web/lib/generate/__tests__/needs.test.ts` | `pnpm test:run` |

## Visual verification (huashu-design)

```bash
cd web && pnpm exec playwright screenshot http://localhost:3000 .verify/canvas.png --viewport-size=1440,900 --full-page
```

Mockup + states: `_temp/design-demos/masar-ci-mockup.html` (approved Theme A).

## Visual verification (huashu-design)

```bash
pnpm exec playwright screenshot http://localhost:3000 .verify/canvas-empty.png --viewport-size=1440,900
```

Capture key states: `canvas-empty`, `building`, `warnings-found`, `secure-ready`. Verify zero console errors before handoff.

## Emulator / simulator / device

Not applicable — MasarCI is a **web app** (no native targets). Desktop-first; no mobile build.

## Deploy (DEFERRED — prototype-only for now)

The app builds to a static `out/` folder. When deploy is un-deferred, options require **no code changes**:

- **GitHub Pages:** commit the contents of `out/` to the repo's `gh-pages` branch (or use the `actions/deploy-pages` action).
- **Vercel:** `vercel` (auto-detects Next.js; respects `output: 'export'`).
- **Any static host** (Netlify, Cloudflare Pages, S3 + CloudFront): upload `out/`.

## Sync (git)

```bash
git add -A
git commit -m "<message>"
git pull --rebase
git push
```

This workspace tracks `origin` → `https://github.com/Hany-R-Mahmoud/apexyard-portfolio.git` on branch `main`.

## Verification checklist (run before declaring "done")

- [ ] `pnpm lint` clean
- [ ] `pnpm exec tsc --noEmit` clean
- [ ] `pnpm test:run` green — all three §16 acceptance tests pass
- [ ] `pnpm build` succeeds; `out/` exists
- [ ] `out/index.html` opens; canvas renders; generated YAML is valid GitHub Actions (paste into a `.github/workflows/*.yml` and run `actionlint`)
- [ ] Linter catches top-3 vulns: script injection, unpinned action, excessive permissions
- [ ] Playwright screenshots of all 4 states captured; zero console errors
