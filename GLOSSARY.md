# MasarCI · Glossary

> Terms only — no implementation details. Domain vocabulary for GitHub Actions + this app's concepts.

## GitHub Actions terms

- **Workflow** — the top-level YAML file in `.github/workflows/`; one per pipeline. Contains `name`, `on`, `permissions`, `jobs`.
- **Trigger (`on:`)** — the event that starts the workflow: `push`, `pull_request`, `workflow_dispatch`, `schedule`, etc. Can include branch/path filters.
- **Job** — a named unit (`build`, `test`, `deploy`) that runs on a `runner`. Jobs run in parallel by default; `needs:` creates dependencies (sequential).
- **Step** — a single command inside a job. Either an Action reference (`uses:`) or a shell command (`run:`).
- **Action** — a reusable unit referenced by `uses: org/repo@ref`. Lives in a marketplace or a custom repo.
- **`run:` block** — inline shell (bash) within a step. Highest script-injection risk surface.
- **`uses:` block** — references an action, e.g. `uses: actions/checkout@v4`.
- **Matrix (`strategy.matrix`)** — runs a job across a fan-out of variable combinations (e.g. multiple OS/node versions).
- **`needs:`** — declares job dependencies; a downstream job waits for upstream to pass.
- **`permissions:`** — scopes the workflow's GitHub token (least privilege). Top-level or per-job.
- **`env:`** — workflow/job/step environment variables. Used as the secure intermediary for untrusted event data.
- **Runner** — the VM/container that executes a job (`ubuntu-latest`, `windows-latest`, `macos-latest`, or self-hosted).
- **`${{ }}` expression** — GitHub Actions expression syntax for interpolating context values.

## Security terms

- **Script injection** — when untrusted `github.event.*` data is interpolated directly into a `run:` block, an attacker can execute arbitrary shell via a crafted PR title/issue body/branch name. **Critical**.
- **`pull_request_target`** — a trigger that runs with the *base* repo's secrets and token. Dangerous when combined with `checkout` of the PR head — a classic privilege-escalation pattern.
- **Unpinned action** — referencing `@master`/`@main`/floating tags; the action's behavior can change under you (supply-chain risk).
- **SHA pinning** — pinning `uses:` to a 40-char commit SHA (optionally with a comment tag for readability). Most reproducible/supply-chain-safe.
- **Least privilege** — granting the workflow token only the scopes it needs via `permissions:`.

## MasarCI app concepts

- **Canvas** — the visual drag-drop surface where triggers/jobs/steps are arranged. Distinct shapes: triggers=hexagons, jobs=rectangles, steps=nested rectangles.
- **Step Editor** — slide-out panel to configure an action's inputs or write a `run:` script.
- **Action Marketplace / Presets** — library of pre-filled, version-pinned actions.
- **Lint Finding** — a linter result: rule id, severity (Critical/Warning/Info), message, target node, suggested auto-fix.
- **Auto-Fix** — a one-click transformation that rewrites the canonical model to resolve a finding (e.g. hoist `github.event.*` into `env:`).
- **Regional Template** — a pre-built workflow targeting a MENA hosting provider (Oracle Cloud Jeddah, AWS Bahrain, Salla).
- **States** — `Empty Workflow` → `Building` → `Linting` → `Warnings Found` → `Secure & Ready`.

## Status badge vocabulary

- **Critical** — exploitable vulnerability (e.g. script injection, `pull_request_target` + `checkout` with secrets).
- **Warning** — bad practice (e.g. unpinned action `@main`, over-broad `permissions`).
- **Info** — minor/style (e.g. missing cache, deprecated action).
