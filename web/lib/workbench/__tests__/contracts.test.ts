import { describe, expect, it } from "vitest";
import { stableDigest } from "../digest";
import { checkArtifactLimits, checkArtifactSafety, DEFAULT_ARTIFACT_LIMITS } from "../limits";
import { createFinding, sortFindings } from "../findings";

describe("workbench contracts", () => {
  it("creates deterministic digests", () => {
    expect(stableDigest("same source")).toBe(stableDigest("same source"));
    expect(stableDigest("same source")).not.toBe(stableDigest("different source"));
  });

  it("rejects binary and hostile YAML structures before parsing", () => {
    expect(checkArtifactSafety("services:\0{}", "compose").ok).toBe(false);
    expect(checkArtifactSafety(Array.from({ length: 102 }, (_, index) => `---\ndoc: ${index}`).join("\n"), "kubernetes").ok).toBe(false); // TOKEN_POLICY_BATCHED_EXECUTION
  });

  it("fails closed when an artifact exceeds its byte limit", () => {
    const result = checkArtifactLimits("12345", { ...DEFAULT_ARTIFACT_LIMITS, maxBytes: 4 });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("ARTIFACT_TOO_LARGE");
  });

  it("orders findings by severity and stable rule identity", () => {
    const findings = sortFindings([
      createFinding({ ruleId: "B", severity: "warning", title: "B", message: "b" }),
      createFinding({ ruleId: "A", severity: "critical", title: "A", message: "a" }),
      createFinding({ ruleId: "C", severity: "info", title: "C", message: "c" }),
    ]);
    expect(findings.map((finding) => finding.ruleId)).toEqual(["A", "B", "C"]);
    expect(findings[0]?.fingerprint).toMatch(/^A:/);
  });

  it("adds deterministic analysis metadata while accepting the legacy input shape", () => {
    const finding = createFinding({ ruleId: "LEGACY", severity: "info", title: "Legacy", message: "Still supported." });
    expect(finding.id).toBe(finding.fingerprint);
    expect(finding.confidence).toBe("high");
    expect(finding.assumptions).toEqual([]);
    expect(finding.limitations).toEqual([]);
    expect(finding.remediation.safeToApply).toBe(false);
    expect(finding.analyzerVersion).toBe("masarci-analyzer/v1");
    expect(finding.policyVersion).toBe("masarci-policy/v1");
  });
});
