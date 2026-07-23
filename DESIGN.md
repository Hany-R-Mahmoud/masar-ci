# MasarCI Design System

## 1. Atmosphere & Identity

MasarCI is a dark, dense CI/CD command surface: quiet, technical, and readable under pressure. Its signature is a warm amber path through cool graphite surfaces, with mono labels making workflow state legible.

## 2. Color

| Role | Token | Value | Usage |
|---|---|---|---|
| Background | `--color-bg` | `oklch(0.18 0.012 250)` | App shell |
| Surface | `--color-surface` | `oklch(0.22 0.014 250)` | Header, panels |
| Surface raised | `--color-surface-2` | `oklch(0.255 0.014 250)` | Cards, active tabs |
| Border | `--color-border` | `oklch(0.32 0.016 250)` | Dividers |
| Strong border | `--color-border-strong` | `oklch(0.40 0.018 250)` | Focused controls |
| Ink | `--color-ink` | `oklch(0.96 0.004 250)` | Primary text |
| Muted ink | `--color-ink-muted` | `oklch(0.66 0.016 250)` | Metadata |
| Faint ink | `--color-ink-faint` | `oklch(0.48 0.014 250)` | Hints |
| Accent | `--color-accent` | `oklch(0.70 0.15 52)` | Active path, focus |
| Critical | `--color-critical` | `oklch(0.62 0.22 25)` | Security errors |
| Warning | `--color-warning` | `oklch(0.78 0.15 75)` | Security warnings |
| Secure | `--color-secure` | `oklch(0.72 0.15 150)` | Passing state |

## 3. Typography

- Sans: IBM Plex Sans via `next/font/google`.
- Mono: IBM Plex Mono via `next/font/google`.
- Existing UI scale: 10–13px metadata, 16px shell identity; preserve density.

## 4. Spacing & Layout

- Base rhythm: 4px; existing utility spacing remains source of truth.
- Shell: fixed header + bounded three-pane body.
- Navigation measures: tabs are `150–240px`; the desktop tray is `176–232px` and the inspector is `280–430px`.
- Header: workflow identity and global actions.
- Left sidebar: builder resources; lower section owns recent workflows.
- Center: canvas; right: YAML/security.
- Body and each long panel own scroll; grid/flex children use `min-h-0`.
- At ≤1100px the inspector yields to the canvas; at ≤760px the resource tray and inspector yield to the canvas, leaving the workflow canvas usable without shell clipping. Mobile workspace buttons reopen each panel as a full-width drawer over the canvas.

## 5. Components

### Workflow tabs

- Structure: semantic `nav` + tablist + tab buttons.
- States: active, inactive, hover, focus, unsaved, close affordance.
- Accessibility: `aria-selected`, visible focus, keyboard switching.
- Layout: horizontal reel; overflow scrolls horizontally, never the app shell.

### Recent workflows

- Structure: sidebar section with compact buttons.
- States: empty, active, hover, focus, remove.
- Accessibility: labelled buttons; no color-only active state.
- Layout: sidebar stack; sidebar scroll owner.

### Landing hero media

- Structure: full-bleed video inside the stage, with the existing status and workflow labels layered above it.
- States: playing, reduced-motion/static fallback, remote-media failure fallback.
- Accessibility: decorative media is `aria-hidden`; the surrounding hero copy carries the product meaning.
- Treatment: screen-blended graphite/amber motion with edge fades; no standalone media border.

## 6. Motion & Interaction

- Preserve existing reduced-motion handling.
- Tab/recent state changes use immediate tonal and accent changes; no decorative motion.
- Focus uses the existing 2px accent outline.

## 7. Depth & Surface

Mixed: borders for structure, tonal shift for active/raised state. No new shadow system.

## 8. Accessibility Constraints & Accepted Debt

- WCAG 2.2 AA intent.
- Full keyboard access for tabs, close controls, recent items, and new-workflow action.
- Preserve visible `:focus-visible` outline.
- Accepted debt: interactive browser QA requires a local Chromium executable; static build smoke remains available.
