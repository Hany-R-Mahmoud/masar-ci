import { describe, it, expect } from "vitest";
import { createSampleWorkflow } from "@/lib/sample";
import { generateYaml } from "@/lib/generate/yaml";
import { parseYaml } from "@/lib/generate/parse";
import { lint } from "@/lib/lint/lint";

describe("YAML import (parseYaml)", () => {
  it("round-trips: generate → parse → generate is stable", () => {
    const sample = createSampleWorkflow();
    const yaml = generateYaml(sample);
    const parsed = parseYaml(yaml);
    const yaml2 = generateYaml(parsed);
    expect(yaml2).toBe(yaml);
  });

  it("parses a hand-written vulnerable workflow and the linter flags injection", () => {
    const yaml = [
      "name: test",
      "on: push",
      "jobs:",
      "  deploy:",
      "    runs-on: ubuntu-latest",
      "    steps:",
      '      - run: echo "${{ github.event.issue.title }}"',
    ].join("\n");
    const w = parseYaml(yaml);
    expect(w.jobs[0].id).toBe("deploy");
    expect(w.jobs[0].steps[0].kind).toBe("run");
    const f = lint(w).find((x) => x.ruleId === "INJECT-001");
    expect(f, "INJECT-001 should be flagged on import").toBeDefined();
    expect(f!.severity).toBe("critical");
  });

  it("parses actions/checkout@v7 into repo + ref (and detects a SHA)", () => {
    const yaml = [
      "name: t",
      "on: push",
      "jobs:",
      "  b:",
      "    runs-on: ubuntu-latest",
      "    steps:",
      "      - uses: actions/checkout@v7",
      "      - uses: actions/checkout@d77eff2d4ffd3e3be1b0b1df8a2300a1d8f411c4",
    ].join("\n");
    const w = parseYaml(yaml);
    const steps = w.jobs[0].steps;
    expect(steps[0].action!.repo).toBe("actions/checkout");
    expect(steps[0].action!.ref).toBe("v7");
    expect(steps[0].action!.isSha).toBe(false);
    expect(steps[1].action!.isSha).toBe(true);
  });
});
