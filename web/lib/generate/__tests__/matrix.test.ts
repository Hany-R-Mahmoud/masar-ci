import { describe, it, expect } from "vitest";
import { load } from "js-yaml";
import { createWorkflow, addJob } from "@/lib/model/factory";
import { generateYaml } from "@/lib/generate/yaml";

describe("YAML generator · spec §16 unit test", () => {
  it("correctly structures the strategy.matrix block for multi-OS testing", () => {
    const w = createWorkflow({ name: "matrix-test" });
    addJob(w, {
      id: "build",
      runsOn: "${{ matrix.os }}",
      strategy: {
        matrix: { os: ["ubuntu-latest", "windows-latest"], node: ["18", "20"] },
      },
    });

    const out = generateYaml(w);
    const doc = load(out) as Record<string, any>;

    expect(doc.jobs.build.strategy.matrix.os).toEqual([
      "ubuntu-latest",
      "windows-latest",
    ]);
    expect(doc.jobs.build.strategy.matrix.node).toEqual(["18", "20"]);
    expect(doc.jobs.build["runs-on"]).toBe("${{ matrix.os }}");
  });
});
