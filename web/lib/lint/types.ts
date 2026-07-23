import type { Workflow } from "@/lib/model/types";

export type Severity = "critical" | "warning" | "info";

export interface LintFinding {
  ruleId: string;
  severity: Severity;
  title: string;
  message: string;
  targetJobId?: string;
  targetStepId?: string;
  autoFix?: (w: Workflow) => Workflow;
}

export interface Rule {
  id: string;
  run: (w: Workflow) => LintFinding[];
}

export const SEVERITY_RANK: Record<Severity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};
