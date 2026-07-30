---
id: "028"
collection: "hany-100"
title: "GitHub Actions and GitLab CI YAML Linter and Optimizer"
brand: "CIInspect"
category: "devops-learning-and-production"
type: "web"
platform: "web-responsive"
difficulty: "builder"
capabilities: "file-upload, ai, charts, import-export"
regulated_domain: "none"
---

# Build `CIInspect` — GitHub Actions and GitLab CI YAML Linter and Optimizer

You are the product manager, UX designer, software architect, full-stack
engineer, database engineer, QA engineer, security reviewer, accessibility
reviewer, and technical writer for this project.

Build the product end to end. Produce a real, locally runnable implementation
— not a visual mockup, a planning document, or a collection of disconnected
snippets. Read the complete specification, choose sensible reversible defaults
for every unspecified detail, and ask at most one question only when a missing
decision genuinely blocks the core build.

---

## 1. Product overview

**Product name:** `CIInspect`
**Product type:** Responsive web application (desktop-first, fully usable on mobile)
**Difficulty:** builder
**Category:** devops-learning-and-production

**Concept:**
Paste a CI workflow YAML and CIInspect validates syntax, flags deprecated actions, spots duplicate steps, and measures estimated pipeline time. An AI pass suggests parallelisation opportunities, caching improvements, and best-practice rewrites with explanations.

**Primary users:** Front-end and full-stack software engineers who build
professional web and mobile products daily. They are comfortable reading code,
appreciate clean UX, and will judge this tool by how much friction it removes
from their real workflow.

**Primary success outcome:** A developer opens `CIInspect` during their normal
work session and completes the core task in under two minutes without consulting
documentation.

**Comparable products or references:** actionlint, GitLab CI linter

### Product principles
- Make the first useful action obvious and reachable in one step.
- Prefer a focused, complete product over a broad but shallow demo.
- Use realistic developer-oriented content and seed data; never use lorem ipsum.
- Implement real persistence and real state transitions — no fake success.
- Never present a dead button, mocked integration, or simulated result as
  complete functionality.
- Keep the product centered on its stated user problem; do not add unrequested
  features.

---

## 2. Clarification protocol

Before writing a single line of code:

1. Output a **"Before I build"** block containing:
   - Product summary in 2–3 sentences.
   - Target user and their context.
   - Primary workflow from first click to success state.
   - Selected stack with version numbers.
   - All reversible defaults you are choosing.
   - A numbered list of assumptions.

2. Ask a question **only** when the answer changes an irreversible architecture
   decision, requires credentials the builder does not have, or changes a
   regulated-domain safety boundary.

3. Ask **no more than one** blocking question per turn with 2–4 options.
   Recommend one with a reason.

4. When no genuine blocker exists, say "No blockers — starting implementation"
   and begin Phase 1 immediately.

---

## 3. Scope and product-specific contract

CIInspect is a multi-screen application with real persistence. Optional authentication. One or two roles where relevant. Full CRUD, search, and empty/error states. Standard test coverage. Local PostgreSQL via Docker or SQLite as the persistence layer.

### Functional contract
User pastes a GitHub Actions or GitLab CI YAML. App validates syntax, flags deprecated actions, spots duplicate steps, estimates pipeline time per job, and suggests parallelisation and caching improvements. LLM rewrites the YAML with the improvements annotated.

### Required capabilities
1. **GitHub Actions / GitLab CI YAML syntax validator** — Implemented end to end with success, empty, loading, and error states.
2. **Deprecated action detector** — Implemented end to end with success, empty, loading, and error states.
3. **Duplicate step finder** — Implemented end to end with success, empty, loading, and error states.
4. **Pipeline time estimator** — Implemented end to end with success, empty, loading, and error states.
5. **LLM parallelisation and caching suggester with rewrite** — Implemented end to end with success, empty, loading, and error states.

### Business rules and invariants
- All user data persists across page reloads and browser restarts.
- Invalid input is rejected at the earliest possible point with a field-specific message.
- Destructive actions (delete, overwrite) require an explicit confirmation step.
- Export files must be valid and complete before the download is triggered.
- Concurrent saves must not silently overwrite each other.

### Feature completion rule

A feature is **not complete** when only its interface exists.

For every required capability, implement:
- a clear, reachable entry point;
- validated inputs with field-level and form-level errors;
- persisted data that survives a page reload;
- all applicable states: loading, success, empty, no-results, error, and retry;
- duplicate-submission protection;
- tests for the main success path and at least two meaningful failure paths.

### Explicit non-goals
- Mobile-only native app (responsive web is sufficient)
- Paid APIs or mandatory paid accounts unless explicitly approved
- Fake backend responses presented as complete
- Any feature not listed in the required capabilities above
- Native mobile app (responsive web is sufficient)
- Real-time collaboration features unless specified in capabilities

---

## 4. Recommended technology and portability

**Stack:** Next.js 14 (App Router), TypeScript 5, Tailwind CSS 3, shadcn/ui, Prisma 5, SQLite (local dev) or PostgreSQL 16 via Docker, Zod 3, Vitest, Playwright, pnpm

Equivalent alternatives are allowed only when they are stable, free, portable,
and clearly justified in the README.

### Portability requirements
- Store all configuration in environment variables; provide `.env.example`.
- For database-backed features, generate portable SQL migrations with a
  reversible seed script.
- Provide exact local commands for: install, run, reset, migrate, seed, test,
  and build.
- Do not require the builder's publishing platform to run the application.

---

## 5. Users and roles

**Single user (optional auth):** Manages all CIInspect data. Can create, edit, delete, and export all records. No multi-user sharing required for the initial build.

---

## 6. Main user journeys

1. **First-use journey** — Developer lands on CIInspect, sees an empty state with a clear call-to-action, completes the primary input, and sees a result within one interaction. No sign-up wall for the first meaningful action.

2. **Primary workflow** — User performs the core CIInspect task from input to result to export. Every step has a visible progress indicator. The result is actionable — not just informational.

3. **Review and update journey** — User edits a previously created record, sees the updated result immediately, and confirms the change persisted after a page reload.

4. **Failure-recovery journey** — User submits a form with invalid data, sees specific field-level errors, corrects them, and resubmits successfully. No data entered before the error is lost.

5. **Data-ownership journey** — User can export all their data as JSON or CSV
   and delete their account with all associated records.

---

## 7. Interfaces and navigation

- **Dashboard/Home** — Overview of recent activity and quick actions.
- **Primary Workflow** — Main data entry and processing interface.
- **Browse/Search** — List view with search, filter, and sort.
- **Detail View** — Full record display with edit/delete actions.
- **Settings/Profile** — Preferences, account, and data export.

All screens: empty, loading, error, no-results, and permission-denied states.

---

## 8. UX and visual design

**Design direction:**
Operational and alert-aware — grey-900 (dark mode preferred), text slate-100, accent amber-500. Chart-heavy with clear green/yellow/red status system.

### Shared design rules
- Use plain language and actionable error messages — never "Something went wrong."
- Preserve user-entered data through navigation and validation errors.
- Do not rely on colour alone to communicate status.
- Respect reduced-motion preferences (`prefers-reduced-motion`).
- Error messages name the field and explain how to fix it.
- Empty states are invitations to act, not blank screens.

**Responsive requirements:** Fully responsive at 375px, 768px, and 1280px.
Desktop-first layout that gracefully adapts to mobile browsers. Touch targets
minimum 44×44px.

---

## 9. Data model

**User** (id UUID, email, name, role, createdAt, updatedAt)
**CIInspectRecord** (id UUID, userId FK, status enum, data JSONB, createdAt, updatedAt)
**AuditLog** (id UUID, userId FK, action, entityId, changes JSONB, createdAt)

Standard timestamps on all entities. Indexes on foreign keys and commonly queried fields. Soft deletion where history matters.

---

## 10. Backend, APIs, and authentication

**Authentication:** Optional. Can be toggled off for a single-user local deployment.

**API:** tRPC procedures (or REST endpoints) with typed Zod input/output schemas. Consistent error shapes with machine-readable codes. Pagination on list endpoints (cursor-based). Idempotency keys on mutations. Rate limiting per endpoint.

### AI capabilities
- **Model:** OpenAI gpt-4o-mini via REST API (with local Ollama llama3 as the free fallback).
- **Trigger:** User-initiated action (button click or form submission).
- **Output format:** Structured JSON with specific expected keys for programmatic rendering.
- **Fallback:** When the model is unavailable, show a clear message with retry and offer a manual alternative.
- **Cost guard:** Limit to 20 AI calls per user session. Show remaining count.
- **Privacy boundary:** Do not send credentials, secrets, or personal data to the AI model.

---

## 11. Security and privacy

- Never place real secrets in source code, client bundles, or seed data.
- Validate and sanitise all user-controlled text, filenames, and imported data.
- Protect against: SQL injection, XSS, CSRF, path traversal, and replay attacks.
- Redact sensitive fields from logs and exports.
- User-generated content is validated and sanitised before storage. API responses never include stack traces or internal paths.

---

## 12. Search, filters, and scale

Server-side search on indexed columns. Filter by status, date range, and primary attributes. Pagination at 20 items per page. Zero-result explanation. Reset filters button. Filter state preserved in URL.

---

## 13. Accessibility

Meet WCAG 2.2 AA for primary visual workflows:
- Semantic HTML and descriptive labels.
- Full keyboard navigation with visible, high-contrast focus indicator.
- Screen-reader announcements for all async state changes.
- Sufficient colour contrast (minimum 4.5:1 for body text).
- Responsive reflow to 320px without horizontal scroll.

---

## 14. Seed data and fixtures

Create 3 fictional developer users: **Ahmed** (experienced, rich history of records across multiple time periods), **Sara** (intermediate, some recent data but gaps), and **Nada** (brand-new, no data yet — exercises empty states). Include examples of every important status. Aim for 20–30 total seeded records. All data is fictional and developer-context realistic.

---

## 15. Testing and verification

- **Unit tests** — validations, calculations, state transitions.
- **Integration tests** — persistence, auth, API contracts.
- **End-to-end tests** — primary workflow, failure recovery, data export.
- **Accessibility tests** — primary interfaces with axe or pa11y.

### Product-critical tests
- The core workflow completes end to end with real persistence.
- All form validations block invalid input and show a specific, actionable error message.
- Empty states render correctly for new users with no data.
- Data survives page reload and browser restart.
- AI feature degrades gracefully when the model is unavailable — shows fallback message with retry.

---

## 16. Documentation and deliverables

1. `README.md` — product summary, architecture, prerequisites, all run commands.
2. `.env.example` — variable names and descriptions only. No real values.
3. Database migrations, seed scripts, and reset command.
4. API or service reference — input/output contracts and error codes.
5. Testing commands with actual results.
6. Known limitations and intentionally excluded features.

---

## 17. Implementation workflow

Work in this order. **Do not skip phases or merge them.**

1. **Requirement summary and kickoff** — "Before I build" block.
2. **Interface and journey map** — list every screen before touching code.
3. **Architecture and data model** — entities, relations, permission matrix.
4. **Project foundation** — scaffold, dependencies, tokens, env config.
5. **Persistence layer** — migrations, seed, reset.
6. **Central vertical workflow** — primary workflow end to end.
7. **Secondary workflows** — search, export, file handling, AI features.
8. **State, validation, and recovery** — all empty/error/loading states.
9. **Tests and accessibility** — automated tests and a11y audit.
10. **Documentation and verification** — README and clean local setup.

---

## Start now

Begin with the **"Before I build"** block. When there is no genuine blocker,
say "No blockers — starting implementation" and begin Phase 1 immediately.
