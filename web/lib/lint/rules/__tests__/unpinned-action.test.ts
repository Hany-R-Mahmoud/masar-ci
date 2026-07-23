import { describe, it, expect } from "vitest";
import { createWorkflow, addJob, addStep } from "@/lib/model/factory";
import { lint } from "@/lib/lint/lint";

describe("Linter · unpinned action auto-fix", () => {
  it("flags @master and auto-fixes a known action to its verified major", () => {
    const w = createWorkflow({ name: "unpin-test" });
    addJob(w, { id: "build", runsOn: "ubuntu-latest" });
    addStep(w, "build", {
      id: "s1",
      name: "Checkout",
      kind: "action",
      action: { repo: "actions/checkout", ref: "master", isSha: false },
    });

    const findings = lint(w);
    const f = findings.find((x) => x.ruleId === "UNPIN-002");
    expect(f, "UNPIN-002 finding should exist").toBeDefined();
    expect(f!.severity).toBe("warning");

    const fixed = f!.autoFix!(w);
    expect(fixed.jobs[0].steps[0].action!.ref).toBe("v7");
  });

  it("does not provide an auto-fix for an unknown action (no guess)", () => {
    const w = createWorkflow({ name: "unpin-unknown" });
    addJob(w, { id: "build", runsOn: "ubuntu-latest" });
    addStep(w, "build", {
      id: "s1",
      name: "Custom",
      kind: "action",
      action: { repo: "acme/secret-action", ref: "main", isSha: false },
    });
    const f = lint(w).find((x) => x.ruleId === "UNPIN-002");
    expect(f).toBeDefined();
    expect(f!.autoFix).toBeUndefined();
  });
});
