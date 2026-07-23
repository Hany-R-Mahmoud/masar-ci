import type { LintFinding, Rule } from "../types";
import type { Workflow } from "@/lib/model/types";

// github.event.* are attacker-controlled (issue/PR titles, branch names, ...).
const EXPR = /\$\{\{\s*([^}]+?)\s*\}\}/g;

/** Hoist untrusted github.event.* references in a run block into env vars. */
export function hoistUntrusted(run: string): {
  env: Record<string, string>;
  run: string;
} | null {
  const env: Record<string, string> = {};
  const used = new Set<string>();
  let found = false;
  const next = run.replace(EXPR, (full, expr: string) => {
    if (!expr.includes("github.event.")) return full; // leave trusted refs alone
    found = true;
    const seg = expr.trim().split(".").pop() || "VAR";
    let name = seg.toUpperCase().replace(/[^A-Z0-9_]/g, "_");
    while (used.has(name)) name += "_";
    used.add(name);
    env[name] = `\${{ ${expr.trim()} }}`;
    return `\${${name}}`;
  });
  return found ? { env, run: next } : null;
}

export const scriptInjection: Rule = {
  id: "INJECT-001",
  run: (w: Workflow): LintFinding[] => {
    const findings: LintFinding[] = [];
    for (const job of w.jobs) {
      for (const step of job.steps) {
        if (step.kind !== "run" || !step.run) continue;
        const matches = [...step.run.matchAll(EXPR)]
          .map((m) => m[1].trim())
          .filter((e) => e.includes("github.event."));
        if (matches.length === 0) continue;
        const example = matches[0];
        findings.push({
          ruleId: "INJECT-001",
          severity: "critical",
          title: "Script injection via untrusted input",
          message: `A \`run:\` block interpolates \`${example}\` directly. These values are attacker-controlled — a crafted string executes arbitrary shell with the runner token. Hoist into a step-level \`env:\` variable and reference the shell variable.`,
          targetJobId: job.id,
          targetStepId: step.id,
          autoFix: (workflow: Workflow): Workflow => {
            const clone: Workflow = JSON.parse(JSON.stringify(workflow));
            const j = clone.jobs.find((x) => x.id === job.id)!;
            const s = j.steps.find((x) => x.id === step.id)!;
            const hoisted = hoistUntrusted(s.run ?? "");
            if (hoisted) {
              s.env = { ...(s.env ?? {}), ...hoisted.env };
              s.run = hoisted.run;
            }
            return clone;
          },
        });
      }
    }
    return findings;
  },
};
