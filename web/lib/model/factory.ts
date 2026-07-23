import type { Job, Step, Workflow } from "./types";

export function createWorkflow(opts: {
  name: string;
  on?: Workflow["on"];
  permissions?: Record<string, string>;
}): Workflow {
  return {
    name: opts.name,
    on: opts.on ?? [{ event: "push", branches: ["main"] }],
    permissions: opts.permissions,
    jobs: [],
  };
}

export function addJob(
  w: Workflow,
  opts: {
    id: string;
    runsOn: string;
    needs?: string[];
    strategy?: Job["strategy"];
    permissions?: Record<string, string>;
  },
): Workflow {
  w.jobs.push({
    id: opts.id,
    name: opts.id,
    runsOn: opts.runsOn,
    needs: opts.needs ?? [],
    steps: [],
    strategy: opts.strategy,
    permissions: opts.permissions,
  });
  return w;
}

export function addStep(w: Workflow, jobId: string, step: Step): Workflow {
  const job = w.jobs.find((j) => j.id === jobId);
  if (!job) throw new Error(`job "${jobId}" not found`);
  job.steps.push(step);
  return w;
}

/** Auto-inject `needs:` when a job declares a dependency on another job. */
export function dependOn(w: Workflow, jobId: string, ...needs: string[]): Workflow {
  const job = w.jobs.find((j) => j.id === jobId);
  if (!job) throw new Error(`job "${jobId}" not found`);
  for (const n of needs) if (!job.needs.includes(n)) job.needs.push(n);
  return w;
}
