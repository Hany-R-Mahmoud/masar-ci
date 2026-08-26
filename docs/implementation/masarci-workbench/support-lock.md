# Support Lock

Locked on 2026-08-25. Runtime analysis is local and offline. No imported content is sent to documentation sites, schemas, registries, analytics, AI, or provider APIs.

External documentation retrieval was not separately approved for this run. URLs below identify the authoritative specifications, but the initial implementation target is limited to behavior proven by repository packages and fixtures. Any claim requiring a newly retrieved upstream detail remains `UNVERIFIED_OFFLINE` rather than being guessed.

| Surface | Runtime/library lock | Authoritative source | Supported initial subset | Explicit limits |
|---|---|---|---|---|
| GitHub Actions | `js-yaml` 5.2.1; repository model/analyzers v1 | https://docs.github.com/actions/reference/workflows-and-actions/workflow-syntax | Existing triggers/jobs/steps/matrix/permissions plus retained raw source and deterministic analysis | No execution; no claim of complete syntax coverage |
| Compose | `js-yaml` 5.2.1; MasarCI Compose adapter v1 | https://compose-spec.io/ | services, image/build, ports, environment, volumes, networks, depends_on, healthcheck, profiles, configs, secrets | Unsupported fields remain visible/raw; no daemon/registry access |
| Dockerfile | MasarCI static parser v1 | https://docs.docker.com/reference/dockerfile/ | comments/directives, stages, common instructions, line continuations, exact retained source | Static explanation only; no build/history/runtime proof |
| Kubernetes | `js-yaml` 5.2.1; MasarCI manifest adapter/policies v1 | https://kubernetes.io/docs/reference/generated/kubernetes-api/ | multi-document YAML; Deployment, Service, Ingress, ConfigMap, Secret skeletons; static reference/policy checks | No API server, kubeconfig, cluster admission, CRD schema, Helm, or Kustomize |
| Terraform plan JSON | native JSON; MasarCI plan adapter v1 | https://developer.hashicorp.com/terraform/internals/json-format | `terraform show -json`-shaped plan resources/actions/changes/dependencies exposed by artifact | No state/HCL/provider execution; no cost estimate |

## Import limits v1

- 5 MiB per imported source artifact; 50 MiB per Terraform plan.
- 10,000 structural/graph nodes per artifact.
- YAML guards reject more than 100 documents, 100 aliases, 10,000 structural nodes, or indentation depth 64; NUL-containing input is rejected.
- File analysis runs in an isolated worker with progress messages, a Cancel control, and a 10-second timeout. A cancelled or failed import leaves the previous artifact visible.
- Binary/NUL input is rejected before parser dispatch; archives are outside the supported file surface.

The current implementation is a bounded static review slice, not a complete visual editor suite. Full domain catalogs, structural editors, fix workflows, Terraform decision/blast-radius/comparison/report views, and exact multi-domain relationship coverage remain `IN_PROGRESS` in the task ledger.

Any stricter measured limit is recorded in this file and `verification-matrix.md` before release.
