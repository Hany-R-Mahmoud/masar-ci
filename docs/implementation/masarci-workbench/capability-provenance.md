# Capability Provenance

All source bodies were available locally and their observed SHA-256 values matched the expected lock on 2026-08-25. Current evidence is split between automated tests, source inspection, and browser smoke; partial rows do not imply full product-slice completion.

| ID | Canonical path | Expected/observed SHA-256 | Adopted MasarCI capability | Refined/excluded assumptions | Verification/evidence |
|---|---|---|---|---|---|
| S01 | `qwen-100/web/092-github-action-builder-web.md` | `2aa07782…ccd9` / match | Existing Actions creator/import/canvas/inspector/export | Keep one MasarCI shell | `ACT-001`; route smoke, broader acceptance partial |
| S02 | `hany-100/devops-learning-and-production/028-ciinspect.md` | `8f18fa69…037` / match | Workflow validity, duplicate/deprecated/cache analysis | Deterministic local analysis only | `ACT-001`; existing linter tests |
| S03 | `chatgpt-2/.../092-pipelinetutor.md` | `5aec1ae7…3d0b` / match | Critical path, failure/condition/evidence explanations | No invented durations or runtime observation | `ACT-001`; adapter/analyzer source |
| S04 | `qwen-100/web/089-docker-compose-gen-web.md` | `4f44fefc…151` / match | Compose catalog/templates/port-volume-network authoring | Initial slice supports service source/import and security analysis; broader catalog pending | `CNT-001`; `compose.ts`; partial |
| S05 | `qwen-2/.../094-compose-viz.md` | `64b6edaa…f90` / match | Compose topology and accessible export | Integrated into Docker workspace with table equivalent | `CNT-001`; `web/components/workbench/DomainWorkspace.tsx` |
| S06 | `hany-100/.../027-dockerviz.md` | `bf3b3243…b18` / match | Compose import/graph/validation/local privacy | No separate product/CLI | `CNT-001`; source/topology smoke |
| S07 | `chatgpt-2/.../091-layertutor.md` | `8de16af0…180` / match | Dockerfile stage/layer/cache explanation | Static/probable effects only | `CNT-002`; `web/lib/domains/containers/dockerfile.ts` |
| S08 | `chatgpt-2/.../097-permissiontrail.md` | `8dcb4e5f…488a` / match | Static identity/ownership/mode trail | No host mutation/probes | `CNT-002`; parser source, broader acceptance partial |
| S09 | `hany-100/.../033-secretsaudit.md` | `5ea55364…ab1` / match | Bounded contextual secret detection/redaction | No whole-repo crawler or raw-secret evidence | `XFL-001`; `secret-analysis.ts`; tests |
| S10 | `qwen-100/web/090-kubernetes-yaml-gen-web.md` | `863fb171…05f3` / match | Supported Kubernetes resource creation and multi-doc export | Version limits explicit | `K8S-001`; adapter source, route smoke |
| S11 | `hany-100/.../030-k8slite.md` | `ac89fd4e…ff92` / match | Deterministic K8s validity/reliability/security rules | No auth/database/jobs/mandatory AI | `K8S-002`; policy source, broader acceptance partial |
| S12 | `chatgpt-2/.../093-manifeststory.md` | `0ba72875…f7b` / match | Resource/request-path graphs and unresolved references | Initial Service→Deployment selector links; declared state only | `K8S-001`; `web/lib/domains/kubernetes/kubernetes.ts` |
| S13 | `hany-100/cli-devops-and-infrastructure/089-k8sdash.md` | `4695faa3…fa4e4` / match | Declared-versus-observed conceptual boundary | Live Observe adapter deferred | `K8S-002`; limitation recorded |
| S14 | `qwen-100/web/091-terraform-visualizer-web.md` | `3acee0c5…74d5` / match | Plan changes/diffs/dependencies/blast radius | Initial resource changes/replacements; no plan execution/editing | `TFR-001`, `TFR-002`; `terraform.ts`; partial |
| S15 | `hany-100/.../031-terravis.md` | `87fe46c7…54bb` / match | Destructive change and before/after review | Authoritative cost estimates excluded; comparison/blast UI pending | `TFR-002`; analyzer source only |
| S16 | `chatgpt-2/.../095-infraenvmap.md` | `e5d0d9b1…15f4` / match | Secret-safe environment origin/consumer map | No CLI server/database/history app | `XFL-002`; `environment-contracts.ts` |
