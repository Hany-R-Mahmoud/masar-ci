import type { LintFinding, Rule } from "./types";
import { getYamlLocations } from "@/lib/generate/yaml";
import type { Workflow } from "@/lib/model/types";
import { SEVERITY_RANK } from "./types";
import { RULES } from "./rules";

export { RULES } from "./rules";
export { hoistUntrusted } from "./rules/script-injection";
export type { LintFinding, Rule, Severity } from "./types";

// Run every rule over the canonical model (ADR-003). Findings reference model
// node ids so the canvas can badge the exact offending step.
export function lint(
  workflow: Workflow,
  rules: Rule[] = RULES,
): LintFinding[] {
  const locations = getYamlLocations(workflow);
  return rules
    .flatMap((rule) => rule.run(workflow))
    .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity])
    .map((finding, index) => {
      const location = finding.targetStepId && finding.targetJobId
        ? locations.steps[`${finding.targetJobId}:${finding.targetStepId}`]
        : finding.targetJobId
          ? locations.jobs[finding.targetJobId]
          : locations.workflow;
      return {
        ...finding,
        id: finding.id ?? `${finding.ruleId}:${finding.targetJobId ?? "workflow"}:${finding.targetStepId ?? ""}:${index}`,
        location,
      };
    });
}
