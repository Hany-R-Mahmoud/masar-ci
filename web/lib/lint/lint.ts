import type { LintFinding, Rule } from "./types";
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
  return rules
    .flatMap((rule) => rule.run(workflow))
    .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
}
