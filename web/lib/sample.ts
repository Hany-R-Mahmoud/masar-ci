import type { Workflow } from "@/lib/model/types";
import { createWorkflow, addJob, addStep } from "@/lib/model/factory";

// The demo workflow from the approved mockup: a Node test + Docker push
// pipeline with one Critical script-injection finding, auto-fixable to env:.
export function createSampleWorkflow(): Workflow {
  const w = createWorkflow({
    name: "node-test-and-docker",
    permissions: { contents: "read" },
  });
  addJob(w, { id: "build", runsOn: "ubuntu-latest" });
  addStep(w, "build", {
    id: "b1",
    name: "Checkout",
    kind: "action",
    action: { repo: "actions/checkout", ref: "v7", isSha: false },
  });
  addStep(w, "build", {
    id: "b2",
    name: "Setup Node",
    kind: "action",
    action: { repo: "actions/setup-node", ref: "v7", isSha: false },
    with: { "node-version": "20" },
  });
  addStep(w, "build", {
    id: "b3",
    name: "Install & test",
    kind: "run",
    run: "npm ci && npm test",
  });

  addJob(w, { id: "deploy", runsOn: "ubuntu-latest", needs: ["build"] });
  addStep(w, "deploy", {
    id: "d1",
    name: "Docker login",
    kind: "action",
    action: { repo: "docker/login-action", ref: "v4", isSha: false },
  });
  addStep(w, "deploy", {
    id: "d2",
    name: "Echo issue title (vulnerable)",
    kind: "run",
    run: 'echo "${{ github.event.issue.title }}"',
  });
  addStep(w, "deploy", {
    id: "d3",
    name: "Build & push image",
    kind: "action",
    action: { repo: "docker/build-push-action", ref: "v7", isSha: false },
  });
  return w;
}

export interface PresetAction {
  repo: string;
  ref: string;
  label: string;
}

export const ACTION_PRESETS: PresetAction[] = [
  { repo: "actions/checkout", ref: "v7", label: "actions/checkout" },
  { repo: "actions/setup-node", ref: "v7", label: "actions/setup-node" },
  { repo: "actions/setup-python", ref: "v7", label: "actions/setup-python" },
  { repo: "actions/cache", ref: "v6", label: "actions/cache" },
  { repo: "actions/upload-artifact", ref: "v7", label: "actions/upload-artifact" },
  { repo: "docker/build-push-action", ref: "v7", label: "docker/build-push-action" },
];

export const REGIONAL_TEMPLATES = [
  "AWS ECR · Bahrain",
  "Oracle Cloud · Jeddah",
  "Salla deploy",
];
