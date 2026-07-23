import type { LintFinding, Rule } from "../types";
import type { Workflow } from "@/lib/model/types";

// Least-privilege: workflows must declare top-level `permissions:`.
// Missing → GitHub grants the broad default token (excessive).
const WRITE_SCOPES = new Set([
  "actions",
  "checks",
  "deployments",
  "id-token",
  "packages",
  "pull-requests",
  "statuses",
  "contents",
]);

export const excessivePermissions: Rule = {
  id: "PERMS-003",
  run: (w: Workflow): LintFinding[] => {
    const findings: LintFinding[] = [];
    if (!w.permissions) {
      findings.push({
        ruleId: "PERMS-003",
        severity: "warning",
        title: "No top-level permissions defined",
        message:
          "The workflow has no explicit `permissions:` block, so it gets the broad default token. Define `permissions:` at the top level to enforce least privilege.",
      });
      return findings;
    }
    for (const [scope, level] of Object.entries(w.permissions)) {
      if (level === "write" && WRITE_SCOPES.has(scope)) {
        findings.push({
          ruleId: "PERMS-003",
          severity: "warning",
          title: "Permissions scope broader than needed",
          message: `\`${scope}: write\` may be broader than required. Narrow to the minimal scopes for the steps in this workflow.`,
        });
      }
    }
    return findings;
  },
};
