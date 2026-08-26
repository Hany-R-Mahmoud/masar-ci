import { describe, expect, it } from "vitest";
import { analyzeTerraformPlan, parseTerraformPlan } from "../terraform";
import { analyzeWorkspaceSource, restoreTerraformReview } from "../../workspace-adapters";
import { stableDigest } from "@/lib/workbench/digest";

const plan = JSON.stringify({
  format_version: "1.2",
  terraform_version: "1.9.0",
  resource_changes: [
    { address: "aws_db_instance.main", type: "aws_db_instance", name: "main", change: { actions: ["delete", "create"], before_sensitive: { password: true }, after_sensitive: { password: true } } },
    { address: "aws_security_group.open", type: "aws_security_group", name: "open", change: { actions: ["create"], before_sensitive: false, after_sensitive: false } },
  ],
});

describe("Terraform immutable plan review", () => {
  it("imports a digest-bound immutable summary", () => {
    const result = parseTerraformPlan(plan);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.mode).toBe("review");
    expect(result.value.changes).toHaveLength(2);
    expect(result.value.sourceDigest).toMatch(/^fnv1a64:/);
    expect(JSON.stringify(result.value)).not.toContain("password");
  });

  it("flags replacements and destructive changes", () => {
    const result = parseTerraformPlan(plan);
    if (!result.ok) return;
    expect(analyzeTerraformPlan(result.value).map((finding) => finding.ruleId)).toContain("TF_REPLACE_RESOURCE");
  });

  it("rejects unsupported plan formats", () => {
    const result = parseTerraformPlan('{"format_version":"9.0","resource_changes":[]}');
    expect(result.ok).toBe(false);
  });

  it("builds deterministic dependency edges from declared configuration references", () => {
    const source = JSON.stringify({
      format_version: "1.2",
      configuration: {
        root_module: {
          resources: [
            { address: "aws_vpc.main", expressions: {} },
            { address: "aws_instance.web", expressions: { vpc_id: { references: ["aws_vpc.main.id"] } } },
          ],
        },
      },
      resource_changes: [
        { address: "aws_vpc.main", type: "aws_vpc", name: "main", change: { actions: ["create"] } },
        { address: "aws_instance.web", type: "aws_instance", name: "web", change: { actions: ["create"] } },
      ],
    });
    const result = parseTerraformPlan(source);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // TOKEN_POLICY_BATCHED_EXECUTION: assert by stable resource address, not sort position.
    expect(result.value.changes.find((change) => change.address === "aws_instance.web")?.references).toEqual(["aws_vpc.main.id"]);
    expect(result.value.graph.edges).toEqual([{ from: "aws_instance.web", to: "aws_vpc.main", label: "references" }]);
    expect(result.value.summaryMetadata.artifactDigest).toBe(result.value.sourceDigest);
    expect(result.value.summaryMetadata.decisionKey).toMatch(/^fnv1a64:/);
  });

  it("binds destructive findings to deterministic review metadata", () => {
    const result = parseTerraformPlan(plan);
    if (!result.ok) return;
    const finding = analyzeTerraformPlan(result.value)[0];
    expect(finding?.confidence).toBe("exact");
    expect(finding?.assumptions).toEqual(result.value.summaryMetadata.assumptions);
    expect(finding?.limitations).toEqual(result.value.summaryMetadata.limitations);
    expect(finding?.analyzerVersion).toBe(result.value.summaryMetadata.analyzerVersion);
    expect(finding?.policyVersion).toBe(result.value.summaryMetadata.policyVersion);
    expect(finding?.remediation.safeToApply).toBe(false);
  });

  it("restores graph edges and findings from a persisted review", () => {
    const source = JSON.stringify({
      format_version: "1.2",
      resource_changes: [
        { address: "aws_vpc.main", type: "aws_vpc", name: "main", change: { actions: ["create"] } },
        { address: "aws_db_instance.main", type: "aws_db_instance", name: "main", change: { actions: ["delete", "create"] } },
      ],
      configuration: {
        root_module: {
          resources: [
            { address: "aws_vpc.main", expressions: {} },
            { address: "aws_db_instance.main", expressions: { vpc_id: { references: ["aws_vpc.main.id"] } } },
          ],
        },
      },
    });
    const reviewed = analyzeWorkspaceSource("terraform", source);
    expect(reviewed.ok).toBe(true);
    if (!reviewed.ok) return;

    const restored = restoreTerraformReview(reviewed.value.exportValue, stableDigest(reviewed.value.exportValue));
    expect(restored.ok).toBe(true);
    if (!restored.ok) return;
    expect(restored.value.graph.edges).toEqual([{ from: "aws_db_instance.main", to: "aws_vpc.main", label: "references" }]);
    expect(restored.value.findings.map((finding) => finding.ruleId)).toContain("TF_REPLACE_RESOURCE");

    expect(restoreTerraformReview(reviewed.value.exportValue, stableDigest(source)).ok).toBe(true);

    const tampered = JSON.parse(reviewed.value.exportValue) as { summaryMetadata: { decisionKey: string } };
    tampered.summaryMetadata.decisionKey = "fnv1a64:tampered";
    expect(restoreTerraformReview(JSON.stringify(tampered)).ok).toBe(false);
  });
});
