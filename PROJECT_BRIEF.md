# MasarCI · Project Brief

> Source prompt: `092-github-action-builder-web.md` (id `092`, brand `MasarCI`)
> Difficulty: builder · Category: Dev Tool · Platform: web

## Goal

Build **MasarCI** — a visual, drag-and-drop GitHub Actions workflow builder with a built-in security linter. Developers construct pipelines visually (Triggers → Jobs → Steps), the app generates clean GitHub Actions YAML, and a static-analysis linter flags dangerous patterns (script injection, unpinned actions, excessive permissions) with safe auto-fixes.

`Masar` (مسار) means "Path" or "Pipeline" in Arabic.

## Problem being solved

Startups and dev agencies in the MENA region rely heavily on GitHub Actions for CI/CD, but writing the YAML from scratch often leads to:

- **Security vulnerabilities** — e.g. script injection via `${{ github.event.issue.title }}` interpolated directly into `run:` blocks.
- **Poor caching strategies** — copy-pasted, outdated recipes from StackOverflow.
- **Messy, unmaintainable pipelines** — missing `permissions:`, mutable `@master` action refs, no least-privilege boundary.

Developers copy-paste from outdated answers, missing critical security context boundaries and modern caching mechanisms.

## Proposed solution

A web-based visual pipeline builder. Users drag "Jobs" onto a canvas, add "Steps" (Actions or Shell scripts), and configure triggers (`on: push`, `pull_request`). The app generates the YAML and runs a built-in security linter that flags dangerous `run:` script injections and suggests safe alternatives.

**Scope boundary:** strictly local generation and copy-paste — no GitHub API connection, no writing workflows directly to repositories.

## Primary users

- Backend engineers
- DevOps engineers
- Open-source maintainers

Regional focus: MENA (deployment presets target regional hosting providers).

## Main workflow

1. Open the Canvas.
2. Define `on:` triggers (e.g. push to `main`, PR to `main`).
3. Add Jobs (e.g. `build`, `test`, `deploy`).
4. Inside Jobs, add Steps — select from the Action Marketplace (`actions/checkout@v4`, `actions/setup-node@v4`) or write custom `run:` shell scripts.
5. The right pane generates the YAML.
6. The "Security & Best Practices" panel scans the workflow and flags issues (e.g. `pull_request_target` with `checkout`, untrusted input in `run:`).
7. Apply auto-fixes → copy/download the secure YAML.

## Scope (builder tier)

Multi-screen app with drag-and-drop canvas, YAML generation, and static analysis. **No auth.** Standard test coverage.

### Required capabilities

- **Visual Pipeline Canvas** — drag-and-drop interface for Triggers, Jobs, and Steps.
- **Action Presets** — library of standard GitHub Actions with pre-filled inputs and version pinning (encouraging SHA pinning over tags).
- **YAML Generator** — outputs clean, properly indented GitHub Actions YAML.
- **Security Linter** — static analysis rules that detect common GitHub Actions vulnerabilities (Script Injection, Unpinned Actions, Excessive Permissions).
- **Regional Deployment Templates** — pre-built workflow templates for popular MENA hosting targets (Oracle Cloud Jeddah, AWS Bahrain, regional PaaS platforms).

### Explicit non-goals

- Connecting to the GitHub API to read/write workflows to repositories (strictly local generation and copy-paste).
- Supporting GitLab CI or Bitbucket Pipelines.

## Business rules and invariants

- The linter **MUST** flag any `run:` block that directly interpolates `github.event.*` properties (e.g. `run: echo "${{ github.event.pull_request.title }}"`) and suggest using an intermediate `env:` variable to prevent script injection.
- The generator defaults to suggesting pinned Action versions (commit SHA, or at least major version tags `@v4`), warning against `@master` or `@main`.
- Workflows **must** explicitly define `permissions:` at the top level to enforce least privilege.

## UX / visual design direction

CI/CD pipeline aesthetic. Distinct shapes per node type:

- **Triggers** — hexagons
- **Jobs** — rectangles
- **Steps** — smaller nested rectangles

Red warning badges placed directly on the offending step node.

### States

`Empty Workflow` → `Building` → `Linting` → `Warnings Found` → `Secure & Ready`.

## Security & privacy

The tool itself is a security aid. It must accurately implement the rules from GitHub Security Lab regarding Actions injection. It must **not** execute any of the generated shell scripts locally.

## Success criteria (definition of done)

All standard builder checkboxes apply. The generated YAML must be valid for GitHub Actions, and the security linter must successfully catch the top-3 most common Actions vulnerabilities.

### Acceptance tests (spec §16)

- **Security test** — the linter correctly flags `run: echo ${{ github.event.issue.title }}` as a **Critical Script Injection** risk and provides the secure `env: TITLE: ${{ ... }}` alternative.
- **Unit test** — the YAML generator correctly structures the `strategy.matrix` block for multi-OS testing matrices.
- **Logic test** — adding a `deploy` job that depends on a `build` job automatically injects `needs: [build]` into the YAML.
