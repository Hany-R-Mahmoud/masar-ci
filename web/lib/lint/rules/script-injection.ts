import type { LintFinding, Rule } from "../types";
import type { Workflow } from "@/lib/model/types";

// github.event.* are attacker-controlled (issue/PR titles, branch names, ...).
const EXPR = /\$\{\{\s*([^}]+?)\s*\}\}/g;
const UNSAFE_SHELL = /\$\(|`|<<-?|\beval\b|\bsource\b|\b(?:bash|sh|zsh|dash|ksh|fish|python3?|node|perl|ruby)\s+-c\b/i;

function isInsideDoubleQuotes(input: string, index: number): boolean {
  let quoted = false;
  let escaped = false;
  for (let offset = 0; offset < index; offset += 1) {
    const character = input[offset];
    if (character === "\\" && !escaped) {
      escaped = true;
      continue;
    }
    if (character === '"' && !escaped) quoted = !quoted;
    escaped = false;
  }
  return quoted;
}

export function canSafelyHoistUntrusted(run: string): boolean {
  if (UNSAFE_SHELL.test(run)) return false;
  const matches = [...run.matchAll(new RegExp(EXPR.source, "g"))];
  const untrusted = matches.filter((match) => match[1]?.includes("github.event."));
  return untrusted.length > 0 && untrusted.every((match) => (
    typeof match.index === "number" && isInsideDoubleQuotes(run, match.index)
  ));
}

/** Hoist untrusted github.event.* references in a run block into env vars. */
export function hoistUntrusted(run: string, existingEnv: Record<string, string> = {}): {
  env: Record<string, string>;
  run: string;
} | null {
  if (!canSafelyHoistUntrusted(run)) return null;
  const env: Record<string, string> = {};
  const used = new Set(Object.keys(existingEnv));
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
            const hoisted = hoistUntrusted(s.run ?? "", s.env);
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
