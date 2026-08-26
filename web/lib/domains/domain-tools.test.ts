import { describe, expect, it } from "vitest";
import { analyzeWorkspaceSource } from "@/lib/domains/workspace-adapters";
import { applyDomainTool, domainTools } from "@/lib/domains/domain-tools";
import { workspaceBlank } from "@/lib/domains/workspace-presets";

describe("domainTools", () => {
  it("adds a Compose service as valid source", () => {
    // Given
    const source = "services: {}\n";

    // When
    const result = applyDomainTool("compose", source, "compose-service");

    // Then
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(analyzeWorkspaceSource("compose", result.value).ok).toBe(true);
  });

  it("adds a Kubernetes resource as valid source", () => {
    // Given
    const source = "apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: base\ndata: {}\n";

    // When
    const result = applyDomainTool("kubernetes", source, "kubernetes-service");

    // Then
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(analyzeWorkspaceSource("kubernetes", result.value).ok).toBe(true);
  });

  it("keeps generated Ingress and HPA references resolvable", () => {
    const ingress = applyDomainTool("kubernetes", workspaceBlank("kubernetes"), "kubernetes-ingress");
    expect(ingress.ok).toBe(true);
    if (!ingress.ok) return;
    expect(ingress.value).toContain("kind: Service");
    expect(ingress.value).toContain("name: service");
    expect(analyzeWorkspaceSource("kubernetes", ingress.value).ok).toBe(true);

    const hpa = applyDomainTool("kubernetes", workspaceBlank("kubernetes"), "kubernetes-hpa");
    expect(hpa.ok).toBe(true);
    if (!hpa.ok) return;
    expect(hpa.value).toContain("kind: Deployment");
    expect(hpa.value).toContain("name: workload");
    expect(analyzeWorkspaceSource("kubernetes", hpa.value).ok).toBe(true);
  });

  it("keeps Terraform tools review-only", () => {
    // Given
    const tools = domainTools("terraform");

    // When
    const authoringTools = tools.filter((tool) => tool.mode === "author");

    // Then
    expect(authoringTools).toHaveLength(0);
  });

  it.each([
    ["compose", 12],
    ["dockerfile", 12],
    ["kubernetes", 14],
  ] as const)("provides a useful %s authoring catalog", (domain, minimumTools) => {
    // Given
    const authoringTools = domainTools(domain).filter((tool) => tool.mode === "author");
    let source = workspaceBlank(domain);

    // When
    for (const tool of authoringTools) {
      const result = applyDomainTool(domain, source, tool.id);
      expect(result.ok).toBe(true);
      if (result.ok) source = result.value;
    }

    // Then
    expect(authoringTools.length).toBeGreaterThanOrEqual(minimumTools);
    expect(analyzeWorkspaceSource(domain, source).ok).toBe(true);
  });

  it("provides expanded Terraform review lenses without authoring controls", () => {
    // Given
    const tools = domainTools("terraform");

    // When
    const lenses = tools.flatMap((tool) => tool.mode === "review" ? [tool.lens] : []);

    // Then
    expect(lenses).toEqual(expect.arrayContaining(["all", "risk", "replace", "dependencies", "create", "update", "delete", "isolated"]));
    expect(tools).toHaveLength(8);
  });
});
