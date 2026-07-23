import { dump } from "js-yaml";
import type { Job, Step, Trigger, Workflow } from "@/lib/model/types";

// Serialize the canonical model → GitHub Actions YAML (ADR-002).
// js-yaml is YAML 1.2 (GitHub's parser); `on:` etc. are safe.

function triggersToObj(triggers: Trigger[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const t of triggers) {
    const cfg: Record<string, unknown> = {};
    if (t.branches?.length) cfg.branches = t.branches;
    if (t.paths?.length) cfg.paths = t.paths;
    out[t.event] = Object.keys(cfg).length ? cfg : null;
  }
  return out;
}

function stepToObj(step: Step): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  if (step.name) obj.name = step.name;
  if (step.kind === "action" && step.action) {
    obj.uses = `${step.action.repo}@${step.action.ref}`;
    if (step.with && Object.keys(step.with).length) obj.with = step.with;
  } else if (step.kind === "run") {
    obj.run = step.run ?? "";
  }
  if (step.env && Object.keys(step.env).length) obj.env = step.env;
  return obj;
}

function jobToObj(job: Job): Record<string, unknown> {
  const obj: Record<string, unknown> = {
    "runs-on": job.runsOn,
  };
  if (job.needs.length) obj.needs = job.needs;
  if (job.strategy) obj.strategy = job.strategy;
  if (job.permissions) obj.permissions = job.permissions;
  obj.steps = job.steps.map(stepToObj);
  return obj;
}

export function toWorkflowObject(w: Workflow): Record<string, unknown> {
  const doc: Record<string, unknown> = {
    name: w.name,
    on: triggersToObj(w.on),
  };
  if (w.permissions) doc.permissions = w.permissions;
  const jobs: Record<string, unknown> = {};
  for (const job of w.jobs) jobs[job.id] = jobToObj(job);
  doc.jobs = jobs;
  return doc;
}

export function generateYaml(w: Workflow): string {
  const doc = toWorkflowObject(w);
  return dump(doc, { lineWidth: 100, noRefs: true });
}
