# MasarCI

MasarCI is a local-first visual DevOps workbench. It keeps authorable source and immutable review artifacts distinct while turning delivery configuration into inspectable topology, findings, and evidence.

## Workspaces

- `/workstation/actions` — canonical GitHub Actions visual builder. `/workstation` is a compatibility alias backed by the same implementation and saved-data contract.
- `/workstation/docker` — visual Compose/Dockerfile authoring with grouped service, resource, instruction, runtime, and security tools.
- `/workstation/kubernetes` — visual manifest authoring across workloads, networking, configuration, storage, and platform resources.
- `/workstation/terraform` — immutable, redacted Terraform plan review with topology, risk, dependency, change-type, and isolation lenses. No apply, state editing, HCL authoring, provider execution, or cost claims.

Every workspace keeps domain tools on the left, interactive canvas in the center, and source plus findings on the right. Authoring changes synchronize between source and canvas when syntax is valid.

All workbench parsing runs in the browser. Workstation routes suppress analytics and visitor telemetry. Imported Terraform bytes are reduced to a digest-bound summary before persistence or export.

## Development

```bash
cd web
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test:run
pnpm build
```

See [DEVELOPMENT.md](DEVELOPMENT.md) for local development, static preview, privacy boundaries, and verification guidance. Implementation evidence lives in [docs/implementation/masarci-workbench](docs/implementation/masarci-workbench).

## Apex Yard portfolio snapshot

- Status: showcase
- Category: Tools
- Source of truth: [docs/portfolio.json](docs/portfolio.json)

This section is maintained from repository evidence and should be updated with docs/portfolio.json when the project changes.
