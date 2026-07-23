# Clone / Design-System Fidelity Review — tabs-fidelity-review

## Recommendation

**REQUEST_CHANGES**

The implementation is a real, live React component system rather than a screenshot or raster substitute, but three HIGH fidelity/system failures remain: the recent-workflow active state is absent, the new measurements are un-tokenized, and the fixed pane layout defeats the documented responsive overflow behavior.

## Scope and evidence inspected

- Target contract: `DESIGN.md`, especially §§2–6 (workflow-tabs and recent-workflow states, overflow, keyboard access, and lower sidebar placement).
- Changed source: `web/components/WorkflowTabs.tsx`, `web/components/Tray.tsx`, `web/app/page.tsx`, and supporting workspace state in `web/lib/workspace.ts`.
- Token definitions: `web/app/globals.css`.
- Static checks: `npm run typecheck` and `npm run test:run` in `web` both passed (8 files / 15 tests).
- The workspace contains no supplied target screenshot or visual-reference artifact. No browser session or screenshot capture was available in this review, so rendered pixel fidelity, hover/focus rendering, and viewport behavior remain unverified.

## Integrity observations

- **Live component tree: PASS.** `WorkflowTabs` renders semantic `nav`, `tablist`, buttons, and live workflow data; `Tray` renders live recent-workflow buttons. Neither uses an image, canvas snapshot, `background-image`, or rasterized substitute for these UI surfaces.
- **Reusable structure: PASS, with gaps.** `WorkflowTabs` is an isolated reusable primitive and the existing `Section` primitive is reused for Recent workflows. Their sizing and state rules are not yet represented as reusable design tokens.
- **Token color usage: PASS.** The affected components use the declared semantic color utilities (`surface`, `surface-2`, `ink`, `accent`, `critical`, and borders). The active top-tab tonal treatment is directionally consistent with the stated `surface`/`surface-2` depth contract.

## Findings

### CRITICAL

None found. The reviewed interfaces are not image/screenshot stand-ins.

### HIGH

1. **Recent workflows lacks the required active state.** `Tray` is not given `activeId` ([Tray.tsx:19](/Users/hanyramadan/new%20era/ops/apexyard-portfolio/workspace/masar-ci/web/components/Tray.tsx:19)) and every recent button uses the identical base class ([Tray.tsx:86](/Users/hanyramadan/new%20era/ops/apexyard-portfolio/workspace/masar-ci/web/components/Tray.tsx:90)). The always-visible amber dot is rendered for every workflow ([Tray.tsx:92](/Users/hanyramadan/new%20era/ops/apexyard-portfolio/workspace/masar-ci/web/components/Tray.tsx:92)), not as a selected-state treatment. This conflicts with `DESIGN.md` §5’s explicit `active` recent-workflow state and its requirement not to encode active state by color alone. Users cannot visually identify the currently open workflow in the lower-left list.

2. **New visual measurements are hardcoded rather than tokenized.** `WorkflowTabs` introduces arbitrary tab widths and type sizes (`min-w-[150px]`, `max-w-[240px]`, `text-[11px]`, `text-[15px]`) ([WorkflowTabs.tsx:35](/Users/hanyramadan/new%20era/ops/apexyard-portfolio/workspace/masar-ci/web/components/WorkflowTabs.tsx:35), [WorkflowTabs.tsx:59](/Users/hanyramadan/new%20era/ops/apexyard-portfolio/workspace/masar-ci/web/components/WorkflowTabs.tsx:59)); the recent row adds more arbitrary text sizes ([Tray.tsx:84](/Users/hanyramadan/new%20era/ops/apexyard-portfolio/workspace/masar-ci/web/components/Tray.tsx:84), [Tray.tsx:93](/Users/hanyramadan/new%20era/ops/apexyard-portfolio/workspace/masar-ci/web/components/Tray.tsx:93)). `DESIGN.md` does not define these tab measures or a named type scale, and `globals.css` exposes only colors/fonts—no named dimensions or text-size tokens ([globals.css:4](/Users/hanyramadan/new%20era/ops/apexyard-portfolio/workspace/masar-ci/web/app/globals.css:4)). This is a one-off layout, not a rigorous token-driven primitive.

3. **The shell’s fixed three-pane grid makes the tab-overflow promise ineffective at compact widths.** The page always reserves `232px + 430px` around the canvas without a responsive alternative ([page.tsx:310](/Users/hanyramadan/new%20era/ops/apexyard-portfolio/workspace/masar-ci/web/app/page.tsx:310)). While the tab reel itself correctly uses local `overflow-x-auto` ([WorkflowTabs.tsx:26](/Users/hanyramadan/new%20era/ops/apexyard-portfolio/workspace/masar-ci/web/components/WorkflowTabs.tsx:26)), the app below cannot fit a 375px/390px viewport before the middle canvas is considered. That contradicts the `DESIGN.md` requirement that horizontal overflow belongs to the tab reel, never the app shell. A real viewport capture is required after a responsive pane strategy is added.

### MEDIUM

1. **The ARIA tab pattern is incomplete and the documented keyboard model is not delivered through the tablist.** Tabs declare `role="tab"` and `aria-selected` ([WorkflowTabs.tsx:29](/Users/hanyramadan/new%20era/ops/apexyard-portfolio/workspace/masar-ci/web/components/WorkflowTabs.tsx:29)), but there is no roving `tabIndex`, Arrow/Home/End navigation, `aria-controls`, or associated `tabpanel`. The only switch shortcut is a page-global Cmd/Ctrl+Tab listener ([page.tsx:106](/Users/hanyramadan/new%20era/ops/apexyard-portfolio/workspace/masar-ci/web/app/page.tsx:106)); it neither moves focus nor supplies the expected keyboard behavior inside the tablist. This falls short of `DESIGN.md` §5’s keyboard-switching requirement.

2. **“Lower-left” is incidental rather than structural.** Recent workflows is appended directly after the template section ([Tray.tsx:70](/Users/hanyramadan/new%20era/ops/apexyard-portfolio/workspace/masar-ci/web/components/Tray.tsx:70), [Tray.tsx:82](/Users/hanyramadan/new%20era/ops/apexyard-portfolio/workspace/masar-ci/web/components/Tray.tsx:82)); the sidebar is a single flow-scrolling aside ([Tray.tsx:31](/Users/hanyramadan/new%20era/ops/apexyard-portfolio/workspace/masar-ci/web/components/Tray.tsx:31)). It therefore moves with preceding content and is not a dedicated lower sidebar region as `DESIGN.md` describes. This may be acceptable only if the target’s intended section was simply “after templates,” not structurally lower-left; no visual reference exists to resolve that ambiguity.

### LOW

1. **The top tab state changes are animated despite the contract calling for immediate state changes.** The tabs add `transition-colors` ([WorkflowTabs.tsx:35](/Users/hanyramadan/new%20era/ops/apexyard-portfolio/workspace/masar-ci/web/components/WorkflowTabs.tsx:35)), whereas `DESIGN.md` §6 specifies immediate tonal/accent changes. Verify the intended interaction timing in browser QA or remove the transition if immediacy is literal.

## Required blockers before approval

1. Give Recent workflows an explicit active input and a non-color-only selected treatment, then verify default, hover, focus, dirty, empty, and active states.
2. Define and document the tab/recent sizing and typography tokens; replace the new arbitrary values with those tokens.
3. Add a responsive pane behavior so the app shell does not horizontally overflow at 375px/768px; confirm the tab reel alone owns horizontal scrolling.
4. Complete the keyboard/ARIA tab interaction and validate it in a real browser.
5. Capture fresh browser evidence at 375px, 768px, and 1280px after revisions. Pixel-level reference comparison remains blocked until a target screenshot/reference is supplied.
