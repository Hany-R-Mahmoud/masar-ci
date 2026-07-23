import type { LintFinding, Rule } from "../types";
import type { Workflow } from "@/lib/model/types";

// pull_request_target runs with the base branch's token + secrets.
// Checking out / executing the PR head there = privilege escalation.
export const pullRequestTarget: Rule = {
  id: "PRT-004",
  run: (w: Workflow): LintFinding[] => {
    const findings: LintFinding[] = [];
    const hasPRT = w.on.some((t) => t.event === "pull_request_target");
    if (!hasPRT) return findings;
    for (const job of w.jobs) {
      const risky = job.steps.some(
        (s) =>
          (s.kind === "action" && s.action?.repo === "actions/checkout") ||
          s.kind === "run",
      );
      if (risky) {
        findings.push({
          ruleId: "PRT-004",
          severity: "critical",
          title: "pull_request_target with untrusted checkout/run",
          message:
            "`pull_request_target` runs with the base repo's token and secrets. Checking out or executing the PR head here is a privilege-escalation pattern. Use `pull_request` instead (token is fork-scoped, no base secrets), or explicitly checkout `github.event.pull_request.base.sha`.",
          targetJobId: job.id,
          // Mitigation: downgrade pull_request_target → pull_request (keeps branches).
          autoFix: (workflow: Workflow): Workflow => {
            const c: Workflow = JSON.parse(JSON.stringify(workflow));
            c.on = c.on.map((t) =>
              t.event === "pull_request_target"
                ? { event: "pull_request" as const, branches: t.branches, paths: t.paths }
                : t,
            );
            return c;
          },
        });
      }
    }
    return findings;
  },
};
