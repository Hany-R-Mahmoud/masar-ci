# ADR-002 · Canonical workflow model as single source of truth (YAML via js-yaml)

- **Status:** Accepted
- **Date:** 2026-07-22

## Context

MasarCI has three views over the same data: the **canvas** (graph nodes/edges), the **generated YAML** (text), and the **linter** (analysis). If each view owns its own representation, they drift — e.g. the YAML gets a field the canvas doesn't show, or the linter re-parses YAML text differently from the generator.

The naive alternative is string-templating YAML (e.g. `` `on: ${...}\njobs:\n  ${...}` ``). This is fragile: indentation bugs, escaping holes, and the linter can't trust the structure.

## Decision

A **canonical TypeScript workflow model** (`lib/model`) is the single source of truth.

- The canvas reads/writes the model (via `@xyflow/react` node data bound to model nodes).
- The **YAML generator** (`lib/generate`) serializes the model using `js-yaml` (`dump`), producing clean, properly-indented GitHub Actions YAML. No string templates.
- The **linter** (`lib/lint`) runs over the model, not over YAML text.

```
            ┌──────────────┐
 canvas ──► │   canonical  │ ◄── step editor
            │     model    │
            └──────┬───────┘
           ┌───────┴───────┐
           ▼               ▼
     js-yaml dump     linter (rules)
           │               │
           ▼               ▼
        YAML text     LintFindings
```

## Alternatives considered

- **String-templated YAML:** rejected — indentation/escaping fragility; linter must re-parse.
- **YAML text as the source (parse → mutate → dump):** rejected — round-trip lossy for comments/formatting, and the canvas would have to parse text on every edit. Model-first is canonical for a visual builder.

## Consequences

- One model, one schema to version and test. Schema migrations are localized.
- YAML output format is controlled via `js-yaml` options (indent, line width, quoting) in one place.
- Importing existing YAML (deferred feature) becomes "parse with js-yaml → map to model" — a single adapter, not a re-architecture.
- The §16 acceptance tests target the generator (`matrix`, `needs:`) directly against the model → clean unit tests.
