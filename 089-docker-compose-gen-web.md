id: "089"
source_collection: "100-ai-prompts"
source_id: "none"
title: "Docker Compose Gen"
brand: "HawiConf"
category: "Dev Tool"
platform: "web"
difficulty: "builder"
capabilities: "ui, yaml, environment-vars, volumes, clipboard"
regulated_domain: "none"

Build `HawiConf` — Visual Docker Compose & Stack Template Builder

You are the product manager, UX designer, software architect, full-stack or native engineer, database engineer, QA engineer, security reviewer, accessibility reviewer, and technical writer for this project.
Build the product end to end. Produce a real, locally runnable implementation.

### 1. Product overview
Product name: `HawiConf` (Hawi = "Container/Receptacle")
Product type: Web app
Difficulty: builder
Category: Dev Tool
Concept: Bootstrapping a local development environment or a production VPS stack using Docker Compose requires memorizing YAML syntax, specific image tags, environment variable names, and volume mapping paths. `HawiConf` is a visual builder that allows developers to drag-and-drop services (PostgreSQL, Redis, Next.js, Nginx, MinIO), configure their ports, environment variables, and persistent volumes via a UI, and export a perfectly indented `docker-compose.yml` file. It includes MENA-startup-specific stack templates (e.g., "Salla-like E-commerce Stack", "Fintech Ledger Stack").
Problem being solved: Developers waste time hunting through Docker Hub documentation for the correct environment variables and volume paths when spinning up local databases, caches, and mock S3 buckets for regional startup projects.
Proposed solution: A web app with a "Service Catalog". Users add services to a canvas, configure them via forms, define local networks, and map persistent volumes. The app generates the YAML.
Primary users: Backend engineers, DevOps engineers, and full-stack developers.
Primary success outcome: A developer selects "Postgres 16", "Redis", and "MinIO", configures their local ports and persistent data folders, and downloads a ready-to-run `docker-compose.yml` in under 2 minutes.

### 3. Scope and product-specific contract
Builder tier. Multi-screen app with complex state (services, networks, volumes). No auth. Standard test coverage.

**Functional contract**
The user opens the "Catalog" and adds services to their "Stack". For each service, they configure: Image tag, Port mappings (Host:Container), Environment Variables (Key/Value pairs), and Volumes (Host path : Container path). They can define custom Docker networks and attach services to them. The right pane updates with the generated YAML. A "Stack Templates" dropdown allows loading pre-configured setups (e.g., "LAMP", "MERN", "Next.js + Postgres + MinIO").

**Required capabilities**
- Service Catalog — Pre-defined metadata for popular images (Postgres, MySQL, Redis, Mongo, MinIO, Nginx, Mailhog) including their default ports and required env vars.
- Visual Port & Volume Mapper — UI to map host ports to container ports and local directories to container paths.
- Environment Variable Manager — Key-value table for `.env` injection, with a "Generate .env file" export option.
- Network Configuration — Ability to create isolated bridge networks and assign services to them.
- YAML Export — Generates strictly valid, 2-space indented `docker-compose.yml` (v3.8+ syntax).

**Business rules and invariants**
- YAML indentation must be mathematically perfect. A single misplaced space breaks Docker Compose.
- Port mappings must validate that the host port is not duplicated across different services in the same stack.
- Environment variables marked as "secret" or "password" should be flagged to suggest using Docker Secrets or a `.env` file rather than hardcoding them in the YAML.

**Explicit non-goals**
- Generating `Dockerfile` configurations (strictly `docker-compose.yml` orchestration).
- Kubernetes Helm chart generation (keep it strictly to local/VPS Docker Compose).

### 4. Recommended technology and portability
Next.js 14 (App Router, Static Export), TypeScript 5, Tailwind CSS 3, shadcn/ui, `js-yaml` (for safe YAML serialization), `zustand`.

### 7. Interfaces, navigation, commands, and states
- Stack Canvas: List of added services with expandable configuration accordions.
- Service Detail Modal: Tabs for "Image & Ports", "Environment", "Volumes", "Networks".
- Templates Dropdown: Quick-load presets.
- Output Pane: YAML preview with syntax highlighting and "Download YAML" / "Download .env" buttons.
- States: Empty Stack, Configuring Service, Port Conflict Warning, Ready.

### 8. UX and visual or terminal design
Clean, modular, and "containerized". Use distinct icons for different service types (Database, Cache, App, Proxy). The environment variable table should feel like a spreadsheet.

### 11. Offline, synchronization, and resilience
Fully offline. Static export. State persisted to `localStorage`.

### 14. Accessibility and localization
Full RTL support for the UI wrapper.
*Note:* YAML keys, Docker image names, and file paths must remain strictly LTR. The UI must handle mixed directional text gracefully when users input Arabic descriptions or local host paths.

### 15. Seed data and fixtures
Include 3 Stack Templates:
1. "MENA E-commerce Local Dev" (Next.js, Postgres, Redis, MinIO for S3 mock).
2. "Legacy LAMP" (Apache/PHP, MySQL, phpMyAdmin).
3. "Monitoring Stack" (Prometheus, Grafana, NodeExporter).

### 16. Testing and verification
- Unit test: The YAML serializer correctly handles arrays (e.g., multiple port mappings or environment variables) without breaking the 2-space indentation rule.
- Logic test: Attempting to map host port `8080` to two different services triggers a "Port Conflict" validation error in the UI.

### 19. Definition of done
All standard builder checkboxes apply. The exported `docker-compose.yml` must pass a standard `docker-compose config` validation check without syntax errors.

Start now.
