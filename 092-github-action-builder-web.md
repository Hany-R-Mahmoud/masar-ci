id: "092"
source_collection: "100-ai-prompts"
source_id: "none"
title: "GitHub Action Builder"
brand: "MasarCI"
category: "Dev Tool"
platform: "web"
difficulty: "builder"
capabilities: "ui, yaml, security, drag-drop, presets"
regulated_domain: "none"

Build `MasarCI` — Visual GitHub Actions Workflow Builder & Security Linter

You are the product manager, UX designer, software architect, full-stack or native engineer, database engineer, QA engineer, security reviewer, accessibility reviewer, and technical writer for this project.
Build the product end to end. Produce a real, locally runnable implementation.

### 1. Product overview
Product name: `MasarCI` (Masar = "Path" or "Pipeline")
Product type: Web app
Difficulty: builder
Category: Dev Tool
Concept: Startups and dev agencies in the MENA region rely heavily on GitHub Actions for CI/CD, but writing the YAML workflows from scratch often leads to security vulnerabilities (like script injection via `github.event.issue.title`), poor caching strategies, and messy, unmaintainable pipelines. `MasarCI` is a visual drag-and-drop builder for GitHub Actions. It allows developers to construct jobs and steps visually, select from secure, pre-configured regional deployment presets (e.g., "Push to AWS ECR Bahrain", "Deploy to Salla"), and automatically lints the generated YAML for security anti-patterns.
Problem being solved: Developers write insecure and inefficient GitHub Actions workflows because they copy-paste from outdated StackOverflow answers, missing critical security context boundaries and modern caching mechanisms.
Proposed solution: A web-based visual pipeline builder. Users drag "Jobs" onto a canvas, add "Steps" (Actions or Shell scripts), and configure triggers (`on: push`, `pull_request`). The app generates the YAML and runs a built-in security linter that flags dangerous `run:` script injections and suggests safe alternatives.
Primary users: Backend engineers, DevOps engineers, and open-source maintainers.
Primary success outcome: A developer visually builds a Node.js test and Docker push pipeline, and the app automatically flags a script injection vulnerability in their shell step, providing the secure `env:` mapping fix before they commit the YAML.

### 3. Scope and product-specific contract
Builder tier. Multi-screen app with drag-and-drop canvas, YAML generation, and static analysis. No auth. Standard test coverage.

**Functional contract**
The user opens the Canvas. They define the `on:` triggers (e.g., push to `main`, PR to `main`). They add Jobs (e.g., `build`, `test`, `deploy`). Inside Jobs, they add Steps. They can select from an "Action Marketplace" (e.g., `actions/checkout@v4`, `actions/setup-node@v4`) or write custom `run:` shell scripts. The right pane generates the YAML. A "Security & Best Practices" panel automatically scans the workflow and flags issues (e.g., using `pull_request_target` with `checkout`, or untrusted input in `run:` blocks).

**Required capabilities**
- Visual Pipeline Canvas — Drag-and-drop interface for Triggers, Jobs, and Steps.
- Action Presets — A library of standard GitHub Actions with pre-filled inputs and version pinning (encouraging SHA pinning over tags).
- YAML Generator — Outputs clean, properly indented GitHub Actions YAML.
- Security Linter — Static analysis rules that detect common GitHub Actions vulnerabilities (Script Injection, Unpinned Actions, Excessive Permissions).
- Regional Deployment Templates — Pre-built workflow templates for popular MENA hosting targets (e.g., deploying to Oracle Cloud Jeddah, AWS Bahrain, or regional PaaS platforms).

**Business rules and invariants**
- The linter MUST flag any `run:` block that directly interpolates `github.event.*` properties (e.g., `run: echo "${{ github.event.pull_request.title }}"`) and suggest using an intermediate `env:` variable instead to prevent script injection.
- The generator should default to suggesting pinned Action versions (e.g., `actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11`) or at least major version tags (`@v4`), warning against `@master` or `@main`.
- Workflows must explicitly define `permissions:` at the top level to enforce the principle of least privilege.

**Explicit non-goals**
- Connecting to the GitHub API to read/write workflows directly to repositories (strictly local generation and copy-paste).
- Supporting GitLab CI or Bitbucket Pipelines.

### 4. Recommended technology and portability
Next.js 14 (App Router, Static Export), TypeScript 5, Tailwind CSS 3, shadcn/ui, `reactflow` (for the pipeline graph), `js-yaml`, `@monaco-editor/react`.

### 7. Interfaces, navigation, commands, and states
- Canvas: Visual flow of Triggers -> Jobs -> Steps.
- Step Editor: Slide-out panel to configure Action inputs or write shell scripts.
- YAML & Linter Panel: Split view showing the generated code and a list of security warnings with "Auto-Fix" buttons.
- States: Empty Workflow, Building, Linting, Warnings Found, Secure & Ready.

### 8. UX and visual or terminal design
CI/CD pipeline aesthetic. Use distinct shapes for Triggers (hexagons), Jobs (rectangles), and Steps (smaller nested rectangles). Use red warning badges for security linting errors directly on the offending step node.

### 13. Security and privacy
The tool itself is a security aid. It must accurately implement the rules from the GitHub Security Lab regarding Actions injection. It must not execute any of the generated shell scripts locally.

### 16. Testing and verification
- Security test: The linter correctly flags `run: echo ${{ github.event.issue.title }}` as a Critical Script Injection risk and provides the secure `env: TITLE: ${{ ... }}` alternative.
- Unit test: The YAML generator correctly structures the `strategy.matrix` block for multi-OS testing matrices.
- Logic test: Adding a `deploy` job that depends on a `build` job automatically injects `needs: [build]` into the YAML.

### 19. Definition of done
All standard builder checkboxes apply. The generated YAML must be valid for GitHub Actions, and the security linter must successfully catch the top 3 most common Actions vulnerabilities.

Start now.