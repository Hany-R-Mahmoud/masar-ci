import { describe, it, expect } from "vitest";
import { createWorkflow, addJob, addStep } from "@/lib/model/factory";
import { lint } from "@/lib/lint/lint";

describe("Linter · pull_request_target auto-fix", () => {
  it("flags the dangerous trigger and downgrades it to pull_request", () => {
    const w = createWorkflow({
      name: "prt-test",
      on: [{ event: "pull_request_target", branches: ["main"] }],
    });
    addJob(w, { id: "check", runsOn: "ubuntu-latest" });
    addStep(w, "check", {
      id: "s1",
      name: "Checkout PR",
      kind: "action",
      action: { repo: "actions/checkout", ref: "v7", isSha: false },
    });

    const findings = lint(w);
    const f = findings.find((x) => x.ruleId === "PRT-004");
    expect(f, "PRT-004 finding should exist").toBeDefined();
    expect(f!.severity).toBe("critical");

    const fixed = f!.autoFix!(w);
    expect(fixed.on[0].event).toBe("pull_request");
    expect(fixed.on[0].branches).toEqual(["main"]);
  });
});
