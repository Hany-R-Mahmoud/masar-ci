import type { Workflow } from "@/lib/model/types";
import { generateYaml } from "@/lib/generate/yaml";

export interface WorkspaceWorkflow {
  id: string;
  workflow: Workflow;
  positions: Record<string, { x: number; y: number }>;
  savedYaml: string;
}

export interface WorkspaceState {
  activeId: string;
  openIds: string[];
  workflows: Record<string, WorkspaceWorkflow>;
  recentIds: string[];
}

export function makeWorkflowId(name: string): string {
  const safe = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "workflow";
  return `${safe}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function createWorkspace(workflow: Workflow, id = makeWorkflowId(workflow.name)): WorkspaceState {
  const tab: WorkspaceWorkflow = {
    id,
    workflow,
    positions: {},
    savedYaml: generateYaml(workflow),
  };
  return { activeId: id, openIds: [id], workflows: { [id]: tab }, recentIds: [id] };
}

export function touchRecent(ids: string[], id: string, limit = 8): string[] {
  return [id, ...ids.filter((item) => item !== id)].slice(0, limit);
}

export function isWorkspaceState(value: unknown): value is WorkspaceState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<WorkspaceState>;
  if (typeof candidate.activeId !== "string" || !Array.isArray(candidate.openIds) || !Array.isArray(candidate.recentIds)) return false;
  if (!candidate.workflows || typeof candidate.workflows !== "object" || Array.isArray(candidate.workflows)) return false;

  const workflows = candidate.workflows as Record<string, unknown>;
  const hasWorkflow = (id: string) => Object.prototype.hasOwnProperty.call(workflows, id);
  const isIdList = (ids: unknown[]): ids is string[] =>
    ids.length > 0 &&
    new Set(ids).size === ids.length &&
    ids.every((id) => typeof id === "string" && id.length > 0);
  if (!isIdList(candidate.openIds) || !candidate.openIds.every(hasWorkflow)) return false;
  if (!candidate.recentIds.every((id) => typeof id === "string" && hasWorkflow(id))) return false;
  if (!candidate.openIds.includes(candidate.activeId) || !hasWorkflow(candidate.activeId)) return false;

  return Object.entries(workflows).every(([id, value]) => {
    if (!value || typeof value !== "object") return false;
    const tab = value as Partial<WorkspaceWorkflow>;
    return tab.id === id &&
      !!tab.workflow && typeof tab.workflow === "object" &&
      typeof tab.workflow.name === "string" &&
      Array.isArray(tab.workflow.jobs) && Array.isArray(tab.workflow.on) &&
      !!tab.positions && typeof tab.positions === "object" &&
      Object.values(tab.positions).every((position) =>
        !!position && typeof position === "object" &&
        Number.isFinite((position as { x?: unknown }).x) &&
        Number.isFinite((position as { y?: unknown }).y),
      ) &&
      typeof tab.savedYaml === "string";
  });
}
