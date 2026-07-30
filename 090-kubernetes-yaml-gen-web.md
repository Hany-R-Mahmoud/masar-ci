id: "090"
source_collection: "100-ai-prompts"
source_id: "none"
title: "Kubernetes YAML Gen"
brand: "KubeCraft"
category: "Dev Tool"
platform: "web"
difficulty: "professional"
capabilities: "ui, yaml, validation, export, clipboard"
regulated_domain: "none"

Build `KubeCraft` — Visual Kubernetes Manifest Builder & Validator

You are the product manager, UX designer, software architect, full-stack or native engineer, database engineer, QA engineer, security reviewer, accessibility reviewer, and technical writer for this project.
Build the product end to end. Produce a real, locally runnable implementation. Read the complete specification, choose sensible reversible defaults, and ask at most one question only when a missing decision genuinely blocks the core build.

### 1. Product overview
Product name: `KubeCraft`
Product type: Web app
Difficulty: professional
Category: Dev Tool
Concept: As fintechs and enterprise platforms in the GCC rapidly adopt managed Kubernetes (like AWS EKS, Oracle OKE, and Alibaba ACK), local DevOps teams spend hours writing and debugging notoriously verbose and indentation-sensitive Kubernetes YAML manifests. A single misplaced space or missing `selector` match-label causes silent deployment failures. `KubeCraft` is a visual web builder that allows engineers to configure Deployments, Services, Ingresses, and ConfigMaps via structured forms, generating syntactically perfect, validated K8s YAML with best-practice defaults (like resource limits and liveness probes) pre-configured.
Problem being solved: Writing Kubernetes YAML from scratch is error-prone, tedious, and often results in manifests that lack basic production readiness (missing resource limits, health checks, or pod disruption budgets).
Proposed solution: A web dashboard where users visually construct K8s resources. They define container images, ports, environment variables, and scaling rules via UI inputs. The app generates the YAML in real-time, validates it against the official K8s OpenAPI schema, and provides a side-by-side code editor for advanced manual tweaks.
Primary users: DevOps engineers, SREs, and backend developers deploying to Kubernetes.
Primary success outcome: A developer visually configures a Next.js Deployment with an Ingress and a Service, and exports a multi-document YAML file that passes `kubectl apply --dry-run=client` without a single warning.

### 3. Scope and product-specific contract
Professional tier. Complex state management, OpenAPI schema validation, multi-document YAML generation.

**Functional contract**
The user opens the "Workbench". They can add multiple resources (Deployment, Service, Ingress, ConfigMap, Secret). For a Deployment, they configure metadata (name, namespace, labels), pod templates (containers, images, ports, env vars, resource requests/limits), and scaling (replicas). The right pane displays the generated YAML. A "Validate" button checks the YAML against a bundled K8s JSON schema. The user can export all resources as a single `manifest.yaml` file separated by `---`.

**Required capabilities**
- Resource Builder Forms — Structured UI for Deployments, Services, Ingresses, ConfigMaps, and Secrets.
- Real-Time YAML Generation — Translates form state into strictly formatted, 2-space indented YAML.
- OpenAPI Schema Validation — Validates the generated YAML against K8s v1.28+ schemas to catch missing required fields or invalid types.
- Best-Practice Injection — One-click toggles to inject standard production necessities: Liveness/Readiness probes, Resource Requests/Limits, and Pod Anti-Affinity rules.
- Multi-Document Export — Bundles multiple resources into a single YAML stream separated by `---`.

**Business rules and invariants**
- YAML generation must strictly adhere to 2-space indentation.
- If a user adds an Ingress, the app must automatically suggest creating a corresponding Service of type `ClusterIP` to route traffic to.
- Secrets defined in the UI must be flagged with a warning: "Base64 encoded in YAML, but not encrypted at rest. Consider ExternalSecrets or SealedSecrets for production."
- Label selectors in Deployments must exactly match the pod template labels; the app must enforce this link automatically.

**Explicit non-goals**
- Connecting to a live Kubernetes cluster (strictly offline generation).
- Generating Helm charts or Kustomize overlays (strictly raw YAML manifests).

### 4. Recommended technology and portability
Next.js 14 (App Router, Static Export), TypeScript 5, Tailwind CSS 3, shadcn/ui, `js-yaml`, `ajv` (for JSON schema validation), `@monaco-editor/react`.

### 7. Interfaces, navigation, commands, and states
- Workbench: Left sidebar listing added resources. Center: Configuration forms for the selected resource. Right: Live YAML preview.
- Validation Panel: Bottom drawer showing schema validation errors and warnings.
- States: Empty Workbench, Configuring Resource, Validation Error, Valid & Ready.

### 8. UX and visual or terminal design
Enterprise DevOps aesthetic. Dark mode default. Use clear visual grouping for nested K8s concepts (e.g., grouping `containers` inside `podSpec`). Use color-coded badges for resource types (Blue for Deployments, Green for Services, Yellow for ConfigMaps).

### 13. Security and privacy
Strictly client-side processing. No cluster credentials or cloud provider tokens are ever requested or stored.

### 16. Testing and verification
- Unit test: The YAML serializer correctly handles complex nested arrays (like `env` variables and `volumeMounts`) without breaking indentation.
- Logic test: Changing the `matchLabels` on a Deployment automatically updates the `labels` on the underlying Pod template to prevent orphaned pods.
- Validation test: The schema validator correctly flags a Deployment that is missing the required `spec.selector` field.

### 19. Definition of done
All standard professional checkboxes apply. The generated YAML must be 100% compliant with standard Kubernetes API specifications and pass a dry-run validation check.

Start now.
