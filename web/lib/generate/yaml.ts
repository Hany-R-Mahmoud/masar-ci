import { dump } from "js-yaml";
import type { Job, Step, Trigger, Workflow } from "@/lib/model/types";

export interface YamlLocation {
  startLine: number;
  endLine: number;
}

export interface YamlLocations {
  workflow: YamlLocation;
  jobs: Record<string, YamlLocation>;
  steps: Record<string, YamlLocation>;
}

// Serialize the canonical model → GitHub Actions YAML (ADR-002).
// js-yaml is YAML 1.2 (GitHub's parser); `on:` etc. are safe.

function triggersToObj(triggers: Trigger[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const t of triggers) {
    const cfg: Record<string, unknown> = {};
    if (t.branches?.length) cfg.branches = t.branches;
    if (t.paths?.length) cfg.paths = t.paths;
    if (t.event === "schedule" && t.schedules?.length) {
      const schedules = t.schedules.filter(({ cron }) => cron.trim()).map(({ cron }) => ({ cron: cron.trim() }));
      if (schedules.length) cfg.schedule = schedules;
    }
    if (t.event === "workflow_dispatch" && t.inputs && Object.keys(t.inputs).length) {
      cfg.inputs = t.inputs;
    }
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

function escapedKey(key: string): string {
  return key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getYamlLocations(w: Workflow): YamlLocations {
  const lines = generateYaml(w).split("\n");
  const jobs: Record<string, YamlLocation> = {};
  const steps: Record<string, YamlLocation> = {};
  const jobStarts = w.jobs.map((job) => {
    const index = lines.findIndex((line) => new RegExp(`^  ${escapedKey(job.id)}:`).test(line));
    return { job, index };
  });

  for (let i = 0; i < jobStarts.length; i++) {
    const current = jobStarts[i];
    if (current.index < 0) continue;
    const nextIndex = jobStarts[i + 1]?.index ?? lines.length - 1;
    jobs[current.job.id] = { startLine: current.index + 1, endLine: nextIndex };
    const stepsHeader = lines.findIndex(
      (line, lineIndex) => lineIndex > current.index && lineIndex < nextIndex && /^    steps:/.test(line),
    );
    if (stepsHeader < 0) continue;
    let cursor = stepsHeader;
    const actualStarts = current.job.steps.map((step) => {
      const index = lines.findIndex((line, lineIndex) => lineIndex > cursor && lineIndex < nextIndex && /^      - /.test(line));
      if (index >= 0) cursor = index;
      return { step, index };
    });
    for (let stepIndex = 0; stepIndex < actualStarts.length; stepIndex++) {
      const entry = actualStarts[stepIndex];
      if (entry.index < 0) continue;
      const end = actualStarts[stepIndex + 1]?.index ?? nextIndex;
      steps[`${current.job.id}:${entry.step.id}`] = { startLine: entry.index + 1, endLine: end };
    }
  }

  const permissionLine = lines.findIndex((line) => /^permissions:/.test(line));
  const workflowLine = permissionLine >= 0 ? permissionLine : Math.max(0, lines.findIndex((line) => /^name:/.test(line)));
  return {
    workflow: { startLine: workflowLine + 1, endLine: workflowLine + 1 },
    jobs,
    steps,
  };
}
