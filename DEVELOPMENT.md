# MasarCI · Development

> Setup, build, sync, run, deploy, and verification commands for every supported platform.
> Update this file whenever commands, package managers, native targets, env setup, or verification steps change.

## Prerequisites

| Tool | Min version | Verified on this machine |
|---|---|---|
| Node.js | 20+ | v22.22.3 |
| pnpm | 9+ | 9.15.9 |
| Git | any | ✓ |

> Stack actually scaffolded: **Next.js 16.2.11** + React 19.2.4 + Tailwind 4.3.3 (16 is the current latest stable — newer than ADR-001's "15.x" note, which is the natural drift of "latest stable"). ADR-001's principle (prefer latest stable) still holds; the doc just predates Next 16's release.

The pnpm lockfile is authoritative. Use pnpm for reproducible verification.

## Install

The app lives in `web/`. All commands run from there.

```bash
cd web && pnpm install --frozen-lockfile
```

## Dev server (local development)

```bash
cd web && pnpm dev
# → http://localhost:3000
```

Hot reload. Actions, Docker, Kubernetes, and Terraform Review render in the browser; there is no backend.

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
cd web && pnpm lint          # repository source-policy lint
cd web && pnpm typecheck     # strict TypeScript
```

## Test

```bash
cd web && pnpm test            # watch mode
cd web && pnpm test:run         # single run (CI)
cd web && pnpm test:coverage    # with coverage report
```

The suite covers legacy Actions behavior, shared contracts, versioned persistence/migration, Compose, Dockerfile, Kubernetes, Terraform review, secret scanning, and environment-name matching.

## Runtime boundaries

- Workstation routes do not render analytics or visitor telemetry.
- Docker and Kubernetes analysis is static; MasarCI never contacts a daemon, registry, kubeconfig, or cluster.
- Terraform accepts plan JSON only, discards raw imported values from persistence/export, and never runs Terraform.
- Exports are local Blob downloads and fail closed when critical literal-secret findings exist.
- Legacy Actions storage is migrated by validated write/reread/marker flow while the original key remains available for rollback.

## Emulator / simulator / device

Not applicable — MasarCI is a **web app** (no native targets). Desktop-first; no mobile build.

## Deploy (not part of feature verification)

The app builds to a static `out/` folder. When deploy is un-deferred, options require **no code changes**:

- **GitHub Pages:** commit the contents of `out/` to the repo's `gh-pages` branch (or use the `actions/deploy-pages` action).
- **Vercel:** `vercel` (auto-detects Next.js; respects `output: 'export'`).
- **Any static host** (Netlify, Cloudflare Pages, S3 + CloudFront): upload `out/`.

### SEO deployment variable

Set `NEXT_PUBLIC_SITE_URL` in the production environment to the canonical origin (for example, `https://masarci.example.com`, without a trailing slash). This enables absolute canonical/social URLs, the sitemap link in `robots.txt`, and `/sitemap.xml` generation.

## Sync (git)

```bash
git add -A
git commit -m "<message>"
git pull --rebase
git push
```

This workspace tracks `origin` → `https://github.com/Hany-R-Mahmoud/masar-ci.git`. Feature verification does not authorize push, PR creation, merge, or deployment.

## Verification checklist (run before declaring "done")

- [ ] `pnpm lint` clean
- [ ] `pnpm typecheck` clean
- [ ] `pnpm test:run` green
- [ ] `pnpm build` succeeds; `out/` exists
- [ ] `/workstation`, `/workstation/actions`, `/workstation/docker`, `/workstation/kubernetes`, and `/workstation/terraform` render with zero console errors
- [ ] Keyboard traversal, 200% zoom, 320–1440px reflow, and graph/table equivalence verified
- [ ] Service worker caches the four workspaces and imported content never appears in cache keys, URLs, logs, or telemetry
