import { describe, it, expect } from "vitest";
import { createWorkflow, addJob, addStep } from "@/lib/model/factory";
import { lint } from "@/lib/lint/lint";
import { generateYaml } from "@/lib/generate/yaml";
import type { Workflow } from "@/lib/model/types";

describe("Security linter · spec §16 security test", () => {
  it("flags github.event.issue.title in run: as Critical and auto-fixes to env:", () => {
    const w: Workflow = createWorkflow({ name: "injection-test" });
    addJob(w, { id: "deploy", runsOn: "ubuntu-latest" });
    addStep(w, "deploy", {
      id: "s1",
      name: "echo title",
      kind: "run",
      run: 'echo "${{ github.event.issue.title }}"',
    });

    const findings = lint(w);
    const crit = findings.find((f) => f.ruleId === "INJECT-001");

    expect(crit, "INJECT-001 finding should exist").toBeDefined();
    expect(crit!.severity).toBe("critical");
    expect(crit!.id).toContain("INJECT-001");
    expect(crit!.location?.startLine).toBeGreaterThan(0);
    expect(crit!.location?.endLine).toBeGreaterThanOrEqual(crit!.location!.startLine);
    expect(generateYaml(w).split("\n")[crit!.location!.startLine - 1]).toContain("- name: echo title");

    // auto-fix must hoist the untrusted ref into an env: intermediary and
    // reference the shell variable (either $TITLE or ${TITLE}).
    const fixed = crit!.autoFix!(w);
    const step = fixed.jobs[0].steps[0];
    expect(step.env?.TITLE).toContain("github.event.issue.title");
    expect(step.run).toMatch(/\$\{?TITLE\}?/);
    expect(step.run).not.toContain("${{ github.event.issue.title }}");
    expect(generateYaml(crit!.autoFix!(w))).toBe(generateYaml(fixed));
  });
});
