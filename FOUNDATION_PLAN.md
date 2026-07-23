# MasarCI · Foundation Plan

> Phases, stop point, expected artifacts. Follows foundation-builder + huashu-design routing.

## Routing

- **Platform route:** web app → foundation workflow + platform-specific pack (Next.js static export).
- **Project-type route:** Dev Tool / visual builder → high-density information type (per huashu-design taste anchors): the canvas + lint panel are the product; density is earned, not decorative.
- **Design skill:** huashu-design — spec provides real design context (shapes, states, CI/CD aesthetic), so we run the *lightweight* direction variant (2–3 theme variations on one direction), not the full fallback consultant.

## Stop point

**Full builder slice.** All 5 required capabilities runnable locally + spec §16 acceptance tests green + valid GitHub Actions YAML + linter catches top-3 vulns. Not foundation-only; not a throwaway prototype.

## Phases

### Phase 1 — Foundation docs (this phase)
**Artifacts:** `PROJECT_BRIEF.md`, `FOUNDATION_CONTRACT.md`, `STACK_NOTES.md`, `GLOSSARY.md`, `FOUNDATION_PLAN.md`, `DEVELOPMENT.md`, `docs/adr/ADR-001..003`. Quality-gate validation.
**Gate:** Contract Gate PASS (already).

### Phase 2 — Design (huashu-design)
**Artifacts:**
- `product-facts.md` — web-verified current GitHub Action SHAs (for preset pinning) + GitHub Security Lab rule accuracy. Never hallucinated.
- `brand-spec.md` — MasarCI identity (new brand, so we create it): wordmark SVG, oklch token palette (dark-first), typography (**IBM Plex Sans + IBM Plex Mono** — Plex has Arabic cuts, an honest MENA signal), shape/badge system per spec, anti-slop checklist.
- **Hi-fi 3-pane mockup (🛑 checkpoint):** static HTML of Canvas / Step Editor / YAML+Lint split in states `Empty`, `Building`, `Warnings Found`, `Secure & Ready`. 2–3 theme variations. **Approval required before app code.**

### Phase 3 — Scaffold + canonical model
**Artifacts:** Next.js 15 app (static export), Tailwind 4, shadcn/ui, `@xyflow/react` v12, `js-yaml`, `@monaco-editor/react`. Module map: `lib/model` → `lib/generate` → `lib/lint/rules` → `lib/presets` + `lib/templates` → UI (`canvas/`, `editor/`, `panels/`). ADR-002/003 realized in code.

### Phase 4 — Vertical slices (each independently verifiable)
1. **Model + YAML generator** (headless) → §16 matrix unit test.
2. **Linter + auto-fix** → §16 injection security test.
3. **Canvas** — drag-drop triggers/jobs/steps, spec shapes, red badges wired to linter → §16 `needs: [build]` logic test.
4. **Step editor + action presets** — Monaco for `run:`, pinned versions.
5. **Regional templates** — AWS Bahrain, Oracle Jeddah, Salla starters.
6. **States, a11y, polish** — full state machine, keyboard nav, contrast, empty-state copy.

### Phase 5 — Verification & handoff
**Artifacts:** DoD checklist (spec §19), foundation-builder quality-gate validator output, Playwright screenshots (huashu-design verification) + zero console errors, `HANDOFF.md`, self-improvement check (`scripts/record_foundation_learning.py` if a lesson exists).

## Dependencies

```
Phase 1 (docs) ──► Phase 2 (design) ──🛑 approval──► Phase 3 (scaffold)
                                                          │
                                                          ▼
                                              Phase 4 slices 1→6 (linear; each tests green before next)
                                                          │
                                                          ▼
                                                    Phase 5 (verify/handoff)
```

Slices 1–2 (model/generator/linter) are headless and provable before any UI — they carry the §16 acceptance tests, so we de-risk the hard logic first.

## Verification expectation (spec §16 — acceptance tests)

| # | Test | Slice |
|---|---|---|
| 1 | Linter flags `run: echo ${{ github.event.issue.title }}` as **Critical Script Injection** + provides `env: TITLE:` auto-fix | 2 |
| 2 | YAML generator structures `strategy.matrix` for multi-OS | 1 |
| 3 | `deploy` job depending on `build` auto-injects `needs: [build]` | 1 |
| + | Generated YAML is valid GitHub Actions | 1 |
| + | Linter catches top-3 vulns (injection, unpinned actions, excessive permissions) | 2 |
