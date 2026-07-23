import { describe, expect, it } from "vitest";
import { createSampleWorkflow } from "@/lib/sample";
import { createWorkspace, isWorkspaceState, touchRecent } from "@/lib/workspace";

describe("workspace tabs", () => {
  it("creates one active open workflow", () => {
    const workflow = createSampleWorkflow();
    const workspace = createWorkspace(workflow, "one");
    expect(workspace.activeId).toBe("one");
    expect(workspace.openIds).toEqual(["one"]);
    expect(workspace.workflows.one.workflow.name).toBe(workflow.name);
  });

  it("moves selected workflow to the recent front and caps history", () => {
    const ids = touchRecent(["a", "b", "c"], "c", 2);
    expect(ids).toEqual(["c", "a"]);
  });

  it("rejects stale tab references from persisted storage", () => {
    const workspace = createWorkspace(createSampleWorkflow(), "one");
    expect(isWorkspaceState({ ...workspace, openIds: ["missing"] })).toBe(false);
    expect(isWorkspaceState({ ...workspace, openIds: ["one", "one"] })).toBe(false);
    expect(isWorkspaceState({ ...workspace, recentIds: ["missing"] })).toBe(false);
  });
});
