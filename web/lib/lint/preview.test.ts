import { describe, expect, it } from "vitest";
import { generateYaml } from "@/lib/generate/yaml";
import type { Workflow } from "@/lib/model/types";
import { analyzeWorkspaceSource } from "@/lib/domains/workspace-adapters";

function findingFor(domain: "actions" | "compose" | "dockerfile" | "kubernetes", source: string, ruleId: string) {
  const result = analyzeWorkspaceSource(domain, source);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  const finding = result.value.findings.find((candidate) => candidate.ruleId === ruleId);
  expect(finding, `${ruleId} finding should exist`).toBeDefined();
  return finding!;
}

describe("shared fix previews", () => {
  it("offers a validated, source-bound Actions injection fix", () => {
    const workflow: Workflow = {
      name: "unsafe",
      on: [{ event: "pull_request" }],
      jobs: [{
        id: "test",
        name: "test",
        runsOn: "ubuntu-latest",
        needs: [],
        steps: [{ id: "test-s1", name: "Print title", kind: "run", run: 'echo "${{ github.event.pull_request.title }}"' }],
      }],
    };
    const source = generateYaml(workflow);
    const finding = findingFor("actions", source, "INJECT-001");

    expect(finding.fixProposal?.status).toBe("available");
    expect(finding.fixProposal?.before).toBe(source);
    expect(finding.fixProposal?.after).not.toBe(source);
    expect(finding.remediation.safeToApply).toBe(true);
  });

  it("keeps Compose, Dockerfile, and Kubernetes changes review-gated", () => {
    const composeFinding = findingFor("compose", "services:\n  app:\n    image: nginx:latest\n", "COMPOSE_MUTABLE_TAG");
    const dockerFinding = findingFor("dockerfile", "FROM node:latest\nRUN npm ci\n", "DOCKER_MUTABLE_BASE");
    const kubernetesFinding = findingFor("kubernetes", `apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
spec:
  selector:
    matchLabels:
      app: app
  template:
    metadata:
      labels:
        app: app
    spec:
      containers:
        - name: app
          image: nginx:latest
`, "K8S_IMAGE_MUTABLE");

    for (const finding of [composeFinding, dockerFinding, kubernetesFinding]) {
      expect(finding.fixProposal?.status).toBe("requires-review");
      expect(finding.remediation.safeToApply).toBe(false);
      expect(finding.fixProposal?.before).toBeDefined();
      expect(finding.fixProposal?.after).not.toBe(finding.fixProposal?.before);
    }
  });

  it("blocks injection fixes in unsafe shell contexts", () => {
    const workflow: Workflow = {
      name: "unsafe-shell",
      on: [{ event: "pull_request" }],
      jobs: [{
        id: "test",
        name: "test",
        runsOn: "ubuntu-latest",
        needs: [],
        steps: [{ id: "test-s1", name: "Evaluate title", kind: "run", run: 'eval "${{ github.event.pull_request.title }}"' }],
      }],
    };
    const finding = findingFor("actions", generateYaml(workflow), "INJECT-001");

    expect(finding.fixProposal?.status).toBe("requires-review");
    expect(finding.fixProposal?.after).toBeUndefined();
    expect(finding.remediation.safeToApply).toBe(false);
  });

  it("preserves non-canonical Actions YAML while fixing a supported inline run", () => {
    const workflow: Workflow = {
      name: "preserve-source",
      on: [{ event: "pull_request" }],
      jobs: [{
        id: "test",
        name: "test",
        runsOn: "ubuntu-latest",
        needs: [],
        steps: [{ id: "test-s1", name: "Print title", kind: "run", run: 'echo "${{ github.event.pull_request.title }}"' }],
      }],
    };
    const source = `# Keep this operator-authored comment\nconcurrency:\n  group: ci\n${generateYaml(workflow)}`;
    const finding = findingFor("actions", source, "INJECT-001");

    expect(finding.fixProposal?.status).toBe("available");
    expect(finding.fixProposal?.before).toBe(source);
    expect(finding.fixProposal?.after).toContain("# Keep this operator-authored comment");
    expect(finding.fixProposal?.after).toContain("concurrency:");
    expect(finding.fixProposal?.after).not.toBe(source);
    expect(finding.remediation.safeToApply).toBe(true);
  });

  it("does not preview a duplicated target as if the first match were exact", () => {
    const source = "services:\n  api:\n    image: nginx:latest\n  worker:\n    image: nginx:latest\n";
    const finding = findingFor("compose", source, "COMPOSE_MUTABLE_TAG");

    expect(finding.fixProposal).toBeUndefined();
  });
});
