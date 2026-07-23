# ADR-003 · Linter is a rule engine over the canonical model (not regex over YAML text)

- **Status:** Accepted
- **Date:** 2026-07-22

## Context

The spec mandates a security linter that catches the top-3 Actions vulnerabilities (script injection, unpinned actions, excessive permissions) plus the `pull_request_target` + `checkout` combo, and provides one-click auto-fixes.

Two implementation styles:

1. **Regex over YAML text** — pattern-match `${{ github.event.* }}` inside `run:` blocks by scanning the generated string.
2. **Rule engine over the canonical model** — each rule is a typed function `(workflow: Workflow) => LintFinding[]` operating on the structured model.

## Decision

The linter is a **rule engine over the canonical model** (ADR-002). Each rule:

- Has a stable `id`, `severity` (Critical/Warning/Info), `message`, and target node reference (so the canvas can badge the right step).
- Optionally carries an `autoFix(workflow) => Workflow` that rewrites the model (e.g. hoist `github.event.*` into an `env:` variable, update the `run:` to use `$VAR`).

```
lib/lint/
  rules/
    script-injection.ts      // github.event.* in run: → Critical + env: auto-fix
    unpinned-action.ts       // @master/@main/floating tag → Warning + SHA pin suggestion
    excessive-permissions.ts // missing/over-broad permissions: → Warning
    pull-request-target.ts   // pull_request_target + checkout of PR head → Critical
    index.ts                 // rule registry
  lint.ts                    // runs all rules over the model, returns LintFinding[]
```

## Alternatives considered

- **Regex over YAML text:** rejected —
  - Can't distinguish a `${{ }}` inside a `run:` from one inside a non-`run:` field reliably without a full parse anyway.
  - Auto-fix by string rewriting is error-prone (indentation, escaping).
  - The linter, generator, and canvas could drift (text ≠ model).

## Consequences

- Linter findings reference model node IDs → the canvas places the red badge on the exact offending step (spec §8).
- Auto-fix operates on the model → the generator re-dumps clean YAML → the lint panel's "Auto-Fix" button is a single re-render.
- Rules are independently unit-testable — the §16 injection test is just `lint(modelWithInjection)[0].severity === 'Critical'` and `autoFix(model)` yields the `env:` intermediary.
- Adding a rule = adding a file + registering it; no change to canvas or generator.
- Rules must be checked against current **GitHub Security Lab** guidance at implementation time (recorded in `product-facts.md`).
