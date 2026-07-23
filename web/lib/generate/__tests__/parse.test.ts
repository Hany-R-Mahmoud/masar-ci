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

  it("round-trips schedule and workflow_dispatch inputs", () => {
    const yaml = [
      "name: scheduled",
      "on:",
      "  schedule:",
      "    - cron: 0 5 * * *",
      "  workflow_dispatch:",
      "    inputs:",
      "      environment:",
      "        description: Deploy target",
      "        required: true",
      "        default: staging",
      "        type: choice",
      "        options: [staging, production]",
      "jobs:",
      "  build:",
      "    runs-on: ubuntu-latest",
      "    steps: []",
    ].join("\n");
    const parsed = parseYaml(yaml);
    const schedule = parsed.on.find((trigger) => trigger.event === "schedule");
    const dispatch = parsed.on.find((trigger) => trigger.event === "workflow_dispatch");
    expect(schedule?.schedules).toEqual([{ cron: "0 5 * * *" }]);
    expect(dispatch?.inputs?.environment).toMatchObject({ required: true, default: "staging", type: "choice" });
    expect(generateYaml(parsed)).toContain("cron: 0 5 * * *");
    expect(generateYaml(parsed)).toContain("description: Deploy target");
  });

  it("round-trips matrix and permissions without schema drift", () => {
    const yaml = [
      "name: matrix",
      "on: push",
      "permissions:",
      "  contents: read",
      "jobs:",
      "  build:",
      "    runs-on: ${{ matrix.os }}",
      "    permissions:",
      "      checks: none",
      "    strategy:",
      "      matrix:",
      "        os: [ubuntu-latest, windows-latest]",
      "    steps: []",
    ].join("\n");
    const parsed = parseYaml(yaml);
    expect(parsed.permissions).toEqual({ contents: "read" });
    expect(parsed.jobs[0].permissions).toEqual({ checks: "none" });
    expect(parsed.jobs[0].strategy?.matrix.os).toEqual(["ubuntu-latest", "windows-latest"]);
    const regenerated = parseYaml(generateYaml(parsed));
    expect(regenerated.jobs[0].strategy?.matrix.os).toEqual(["ubuntu-latest", "windows-latest"]);
    expect(regenerated.jobs[0].permissions).toEqual({ checks: "none" });
  });
});
