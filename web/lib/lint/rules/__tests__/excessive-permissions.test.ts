import { describe, expect, it } from "vitest";
import { createWorkflow, addJob } from "@/lib/model/factory";
import { lint } from "@/lib/lint/lint";

describe("Linter · permissions fixtures", () => {
  it("flags missing top-level permissions and links the workflow location", () => {
    const workflow = createWorkflow({ name: "permissions-missing" });
    addJob(workflow, { id: "build", runsOn: "ubuntu-latest" });
    const finding = lint(workflow).find((item) => item.ruleId === "PERMS-003");
    expect(finding?.severity).toBe("warning");
    expect(finding?.location?.startLine).toBeGreaterThan(0);
  });

  it("accepts an explicit read-only permission", () => {
    const workflow = createWorkflow({ name: "permissions-safe", permissions: { contents: "read" } });
    addJob(workflow, { id: "build", runsOn: "ubuntu-latest" });
    expect(lint(workflow).some((item) => item.ruleId === "PERMS-003")).toBe(false);
  });
});
