import type { ActionRef, Job, Step, Trigger, Workflow } from "./types";

/** Replace the workflow's trigger set (single trigger supported in the builder). */
export function setTrigger(w: Workflow, trigger: Trigger): Workflow {
  const existing = w.on.findIndex((item) => item.event === trigger.event);
  if (existing < 0) return { ...w, on: [...w.on, trigger] };
  const on = [...w.on];
  on[existing] = trigger;
  return { ...w, on };
}

/** Append a job and return a clone (non-mutating ops for the UI). */
export function cloneWorkflow(w: Workflow): Workflow {
  return JSON.parse(JSON.stringify(w)) as Workflow;
}

export function addJobClone(
  w: Workflow,
  opts: { id: string; runsOn: string; needs?: string[] },
  position?: { x: number; y: number },
): Workflow {
  const c = cloneWorkflow(w);
  c.jobs.push({
    id: opts.id,
    name: opts.id,
    runsOn: opts.runsOn,
    needs: opts.needs ?? [],
    steps: [],
  });
  return c;
}

export function addStepClone(
  w: Workflow,
  jobId: string,
  step: Step,
): Workflow {
  const c = cloneWorkflow(w);
  const j = c.jobs.find((x) => x.id === jobId);
  if (j) j.steps.push(step);
  return c;
}

export function addStepActionClone(
  w: Workflow,
  jobId: string,
  action: ActionRef,
): Workflow {
  return addStepClone(w, jobId, {
    id: `${jobId}-s${Date.now().toString(36)}`,
    name: action.repo.split("/")[1] ?? action.repo,
    kind: "action",
    action,
  });
}

export function addStepRunClone(w: Workflow, jobId: string, run = "echo hello"): Workflow {
  return addStepClone(w, jobId, {
    id: `${jobId}-s${Date.now().toString(36)}`,
    name: "Run script",
    kind: "run",
    run,
  });
}

export function updateStepClone(
  w: Workflow,
  jobId: string,
  stepId: string,
  patch: Partial<Step>,
): Workflow {
  const c = cloneWorkflow(w);
  const j = c.jobs.find((x) => x.id === jobId);
  const s = j?.steps.find((x) => x.id === stepId);
  if (s) Object.assign(s, patch);
  return c;
}

export function removeStepClone(w: Workflow, jobId: string, stepId: string): Workflow {
  const c = cloneWorkflow(w);
  const j = c.jobs.find((x) => x.id === jobId);
  if (j) j.steps = j.steps.filter((s) => s.id !== stepId);
  return c;
}

export function removeJobClone(w: Workflow, jobId: string): Workflow {
  const c = cloneWorkflow(w);
  c.jobs = c.jobs.filter((j) => j.id !== jobId);
  // also drop dangling needs refs
  for (const j of c.jobs) j.needs = j.needs.filter((n) => n !== jobId);
  return c;
}

export function setJobNeedsClone(w: Workflow, jobId: string, needs: string[]): Workflow {
  const c = cloneWorkflow(w);
  const j = c.jobs.find((x) => x.id === jobId);
  if (j) j.needs = needs;
  return c;
}

export function updateJobClone(
  w: Workflow,
  jobId: string,
  patch: Partial<Pick<Job, "name" | "runsOn" | "strategy" | "permissions">>,
): Workflow {
  const c = cloneWorkflow(w);
  const j = c.jobs.find((x) => x.id === jobId);
  if (j) {
    if (patch.name) j.name = patch.name;
    if (patch.runsOn) j.runsOn = patch.runsOn;
    if (patch.strategy !== undefined) j.strategy = patch.strategy;
    if (patch.permissions !== undefined) j.permissions = patch.permissions;
  }
  return c;
}

export function emptyWorkflow(): Workflow {
  return { name: "untitled", on: [], jobs: [] };
}
