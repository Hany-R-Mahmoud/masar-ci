// MasarCI canonical workflow model — the single source of truth (ADR-002).
// Canvas reads/writes this; the YAML generator serializes it; the linter runs
// rules over it. Never mutate YAML text directly.

export type TriggerEvent =
  | "push"
  | "pull_request"
  | "pull_request_target"
  | "workflow_dispatch"
  | "schedule";

export interface Trigger {
  event: TriggerEvent;
  branches?: string[];
  paths?: string[];
}

export type StepKind = "action" | "run";

export interface ActionRef {
  /** "actions/checkout" */
  repo: string;
  /** major tag "v7" or a 40-char commit SHA */
  ref: string;
  isSha: boolean;
}

export interface Step {
  id: string;
  name: string;
  kind: StepKind;
  // action step
  action?: ActionRef;
  with?: Record<string, string>;
  // run step
  run?: string;
  env?: Record<string, string>;
}

export interface Matrix {
  [dimension: string]: string[];
}

export interface Job {
  id: string;
  name: string;
  runsOn: string;
  needs: string[];
  steps: Step[];
  strategy?: { matrix: Matrix };
  permissions?: Record<string, string>;
}

export interface Workflow {
  name: string;
  on: Trigger[];
  permissions?: Record<string, string>;
  jobs: Job[];
}
