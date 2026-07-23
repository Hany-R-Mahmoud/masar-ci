import type { LintFinding, Rule } from "../types";
import type { Workflow } from "@/lib/model/types";

// Verified majors (product-facts.md, 2026-07-22). Used to auto-fix mutable refs
// for actions we ship — for unknown actions we only flag (no guess).
const KNOWN_MAJOR: Record<string, string> = {
  "actions/checkout": "v7",
  "actions/setup-node": "v7",
  "actions/setup-python": "v7",
  "actions/cache": "v6",
  "actions/upload-artifact": "v7",
  "actions/download-artifact": "v8",
  "docker/login-action": "v4",
  "docker/build-push-action": "v7",
  "aws-actions/amazon-ecr-login": "v2",
  "aws-actions/configure-aws-credentials": "v4",
  "actions/deploy-pages": "v5",
};

// A ref is pinnable if it's a major tag (v4) or a 40-char commit SHA.
function isPinnable(ref: string): boolean {
  return /^v\d+\b/.test(ref) || /^[0-9a-f]{40}$/i.test(ref);
}

export const unpinnedAction: Rule = {
  id: "UNPIN-002",
  run: (w: Workflow): LintFinding[] => {
    const findings: LintFinding[] = [];
    for (const job of w.jobs) {
      for (const step of job.steps) {
        if (step.kind !== "action" || !step.action) continue;
        if (!isPinnable(step.action.ref)) {
          const major = KNOWN_MAJOR[step.action.repo];
          findings.push({
            ruleId: "UNPIN-002",
            severity: "warning",
            title: "Unpinned action reference",
            message: `\`${step.action.repo}@${step.action.ref}\` is not pinned to a major tag or commit SHA. Avoid \`@master\`/\`@main\`${
              major ? ` — pin to \`${major}\` (verified current major) or a commit SHA.` : "."
            }`,
            targetJobId: job.id,
            targetStepId: step.id,
            autoFix: major
              ? (workflow: Workflow): Workflow => {
                  const c: Workflow = JSON.parse(JSON.stringify(workflow));
                  const j = c.jobs.find((x) => x.id === job.id)!;
                  const s = j.steps.find((x) => x.id === step.id)!;
                  if (s.action) {
                    s.action.ref = major;
                    s.action.isSha = false;
                  }
                  return c;
                }
              : undefined,
          });
        }
      }
    }
    return findings;
  },
};

