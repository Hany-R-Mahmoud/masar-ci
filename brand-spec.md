# MasarCI · Brand Spec

> MasarCI is a **new brand** — we create the identity (the core-asset-protocol for *existing* brands does not apply; there is no external logo/product-art to fetch). This spec is the single source of truth: all HTML/CSS references these tokens, never invents colors.

## 🎯 Core assets (created)

### Logo / wordmark

`MasarCI` set in **IBM Plex Mono**, medium weight, lowercase `masar` + a rust-accent dot on the terminal `i` of `CI` (the "path/pipeline" motif: the dot is a pipeline node). Rendered as styled text (no raster logo needed for a dev tool).

```
masar·ci      (the "·" = rust accent, the pipeline-node glyph)
```

Usage: top-left of the app chrome, footer, empty-state. Never stretch or recolor the accent dot except on pure-black (use the lighter accent variant).

## 🎨 Palette (oklch, dark-first)

Dev tool = high-density information type. **One brand accent (rust/terracotta)** carried throughout — honest, warm, deliberately *not* the generic blue/purple dev-tool slop. Semantic trio (red/amber/green) is justified by the linter status system (≥3 functional categories), not decoration.

```css
:root {
  /* surfaces — near-black ink with a faint cool tint */
  --bg:          oklch(0.18 0.012 250);
  --surface:     oklch(0.22 0.014 250);
  --surface-2:   oklch(0.255 0.014 250);
  --border:      oklch(0.32 0.016 250);
  --border-strong: oklch(0.40 0.018 250);

  /* text */
  --ink:         oklch(0.96 0.004 250);
  --ink-muted:   oklch(0.66 0.016 250);
  --ink-faint:   oklch(0.48 0.014 250);

  /* brand accent — rust / terracotta (MENA-earth, not purple) */
  --accent:      oklch(0.70 0.15 52);   /* the pipeline-node dot, active/selected */
  --accent-soft: oklch(0.70 0.15 52 / 0.16);

  /* semantic — linter status (functional, earns their place) */
  --critical:    oklch(0.62 0.22 25);   /* red — offending node badge */
  --critical-soft: oklch(0.62 0.22 25 / 0.14);
  --warning:     oklch(0.78 0.15 75);   /* amber */
  --secure:      oklch(0.72 0.15 150);  /* green — Secure & Ready only */
  --secure-soft: oklch(0.72 0.15 150 / 0.14);

  /* code/YAML surface */
  --code-bg:     oklch(0.15 0.010 250);
  --code-ink:    oklch(0.90 0.004 250);
  --code-key:    oklch(0.74 0.10 250);  /* YAML keys */
  --code-str:    oklch(0.80 0.12 145);  /* strings */
  --code-comment:oklch(0.50 0.014 250);
}
```

### Light variant (Theme B — paper + ink)

```css
:root.light {
  --bg:          oklch(0.985 0.004 90);   /* warm paper */
  --surface:     oklch(0.99 0.003 90);
  --surface-2:   oklch(0.96 0.006 90);
  --border:      oklch(0.88 0.008 90);
  --ink:         oklch(0.22 0.012 250);
  --ink-muted:   oklch(0.48 0.014 250);
  --accent:      oklch(0.55 0.17 45);     /* deeper rust on paper */
  /* semantic stay same hue, adjusted lightness for contrast */
}
```

### Forbidden colors

- **Purple/violet gradients** (AI-slop dev-tool trope) — never.
- Generic `#0D1117` GitHub-dark clone as the *only* move — our ink has a faint warm/cool tint, not neutral slate.
- More than one brand accent — rust is the only accent.

## 🖋 Typography

| Role | Family | Why |
|---|---|---|
| Display / UI | **IBM Plex Sans** | Distinct neo-grotesk, not Inter/Roboto slop; has **Arabic** cuts (IBM Plex Sans Arabic) → honest MENA signal without pastiche |
| Mono / code / YAML / badges | **IBM Plex Mono** | Pairs with Plex Sans; reads as a real tool's editor, not a demo |

Load via self-host (Next.js) or Google Fonts. Never use Inter/Roboto/Arial/system as display.

## ◇ Shape system (spec §8)

Per spec: distinct shapes encode node type. **Shape carries meaning; color does not** (so the single-accent rule holds).

| Node | Shape | Stroke | Fill |
|---|---|---|---|
| **Trigger** (`on: push`, `pull_request`) | **Hexagon** | 1.5px `--ink` / `--accent` when active | transparent |
| **Job** (`build`, `test`, `deploy`) | **Rectangle** (rounded 6px) | 1px `--border-strong` | `--surface-2` |
| **Step** (action / run) | **Nested rectangle** inside job | 1px `--border` | `--surface` |
| **Dependency edge** (`needs:`) | arrow `→` | 1.5px `--accent` | — |

### Warning badges

Placed **directly on the offending step node** (spec §8), top-right corner:

- **Critical:** solid `--critical` disc, 18px, white glyph `!` — plus a 2px `--critical` ring around the offending step.
- **Warning:** solid `--warning` disc, 16px, dark glyph `!`.
- **Info:** 1px `--ink-faint` outlined disc.

## 🧭 Position-four-questions (per pane, answered)

| Pane | Narrative role | Viewer distance | Visual temp | Density |
|---|---|---|---|---|
| **Canvas** | Hero | 1m laptop | cool / authoritative | high (graph + 2 jobs + 4-6 steps visible) |
| **Step Editor** (slide-out) | focused input | 50cm | calm | medium (one step's fields) |
| **YAML + Linter panel** | proof / verdict | 1m | cool→tense (red) → calm (green) | high (code + findings list) |

## 🚫 Anti-slop checklist (enforced)

- [ ] No purple/violet gradients anywhere
- [ ] No emoji icons (use Plex Mono glyphs / shape language instead)
- [ ] No "rounded card + left colored border accent" filler pattern
- [ ] No decorative stats / data-slop numbers in empty states
- [ ] No SVG-drawn product imagery (n/a — it's a tool UI)
- [ ] One accent (rust) only; semantic colors only on linter status
- [ ] Real content in the mockup: actual verified action majors (`@v7`), real injection example, real `env:` fix
- [ ] `text-wrap: pretty` on prose; CSS Grid for the 3-pane layout
- [ ] Typography is Plex Sans + Plex Mono — not Inter

## ✍️ Signature detail (the "120%")

The `needs:` dependency edge is rendered as an **animated dashed rust line** (subtle, 0.4s) drawing from `build` → `deploy` — the one place we spend motion budget. Everything else is static and earned.
