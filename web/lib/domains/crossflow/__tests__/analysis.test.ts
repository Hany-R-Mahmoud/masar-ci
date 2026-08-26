import { describe, expect, it } from "vitest";
import { scanSecrets } from "../secret-analysis";
import { buildEnvironmentContracts, buildEnvironmentContractsFromArtifacts } from "../environment-contracts"; // TOKEN_POLICY_BATCHED_EXECUTION

describe("cross-workspace analysis", () => {
  it("reports secret evidence without returning the secret", () => {
    const secret = "ghp_123456789012345678901234567890123456";
    const findings = scanSecrets(`TOKEN=${secret}`);
    expect(findings).toHaveLength(1);
    expect(JSON.stringify(findings)).not.toContain(secret);
  });

  it("keeps environment names case-sensitive", () => {
    const contracts = buildEnvironmentContracts([
      { artifactId: "compose", kind: "origin", name: "API_URL" },
      { artifactId: "actions", kind: "consumer", name: "api_url" },
    ]);
    expect(contracts.map((contract) => contract.name)).toEqual(["API_URL", "api_url"]);
    expect(contracts.every((contract) => contract.status === "unmatched")).toBe(true);
  });

  it("aggregates exact source evidence deterministically without reading values", () => {
    const artifacts = [
      {
        id: "kubernetes-primary",
        domain: "kubernetes" as const,
        mode: "source" as const,
        name: "manifests.yaml",
        source: [
          "apiVersion: v1",
          "kind: ConfigMap",
          "metadata:",
          "  name: runtime",
          "data:",
          "  API_URL: https://example.invalid",
          "---",
          "apiVersion: apps/v1",
          "kind: Deployment",
          "metadata:",
          "  name: api",
          "spec:",
          "  template:",
          "    spec:",
          "      containers:",
          "        - name: api",
          "          env:",
          "            - name: API_URL",
          "              valueFrom:",
          "                configMapKeyRef:",
          "                  name: runtime",
          "                  key: API_URL",
          "            - name: api_url",
          "              value: https://example.invalid",
        ].join("\n"),
        digest: "digest-kubernetes",
        updatedAt: "2026-08-25T00:00:02.000Z",
      },
      {
        id: "compose-primary",
        domain: "compose" as const,
        mode: "source" as const,
        name: "compose.yaml",
        source: [
          "services:",
          "  api:",
          "    environment:",
          "      API_URL: ${API_URL:-https://example.invalid}",
          "      WORKER_TOKEN:",
        ].join("\n"),
        digest: "digest-compose",
        updatedAt: "2026-08-25T00:00:01.000Z",
      },
      {
        id: "terraform-primary",
        domain: "terraform" as const,
        mode: "review" as const,
        name: "terraform-plan.review",
        digest: "digest-terraform",
        summary: '{"changes":[{"address":"module.secret","sensitiveValue":"do-not-index"}]}',
        updatedAt: "2026-08-25T00:00:03.000Z",
      },
    ] as const;

    const contracts = buildEnvironmentContractsFromArtifacts(artifacts);
    expect(contracts.map((contract) => contract.name)).toEqual(["API_URL", "WORKER_TOKEN", "api_url"]);

    const apiUrl = contracts.find((contract) => contract.name === "API_URL");
    expect(apiUrl?.status).toBe("matched");
    expect(apiUrl?.origins).toContain("compose-primary");
    expect(apiUrl?.consumers).toContain("kubernetes-primary");
    expect(apiUrl?.evidence.some((evidence) => evidence.artifactId === "kubernetes-primary" && evidence.line === 18)).toBe(true); // TOKEN_POLICY_BATCHED_EXECUTION
    expect(JSON.stringify(contracts)).not.toContain("https://example.invalid");
    expect(JSON.stringify(contracts)).not.toContain("do-not-index");

    const reversed = buildEnvironmentContractsFromArtifacts([...artifacts].reverse());
    expect(reversed).toEqual(contracts);
  });

  it("extracts Actions and Dockerfile names without retaining assignment values", () => { // TOKEN_POLICY_BATCHED_EXECUTION
    const contracts = buildEnvironmentContractsFromArtifacts([
      {
        id: "actions-primary",
        domain: "actions",
        mode: "source",
        name: "workflow.yml",
        source: "env:\n  RELEASE_CHANNEL: ${{ vars.RELEASE_CHANNEL }}\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo ${{ env.RELEASE_CHANNEL }}",
        digest: "digest-actions",
        updatedAt: "2026-08-25T00:00:01.000Z",
      },
      {
        id: "dockerfile-primary",
        domain: "dockerfile",
        mode: "source",
        name: "Dockerfile",
        source: "ARG BUILD_ID=private-build-value\nENV RELEASE_CHANNEL=$BUILD_ID",
        digest: "digest-dockerfile",
        updatedAt: "2026-08-25T00:00:02.000Z",
      },
    ]);
    expect(contracts.map((contract) => contract.name)).toEqual(["BUILD_ID", "RELEASE_CHANNEL"]);
    expect(contracts.find((contract) => contract.name === "RELEASE_CHANNEL")?.status).toBe("matched");
    expect(JSON.stringify(contracts)).not.toContain("private-build-value");
  });
});
