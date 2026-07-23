import { describe, it, expect } from "vitest";
import { load } from "js-yaml";
import { createWorkflow, addJob, dependOn } from "@/lib/model/factory";
import { generateYaml } from "@/lib/generate/yaml";

describe("YAML generator · spec §16 logic test", () => {
  it("a deploy job depending on build auto-injects needs: [build]", () => {
    const w = createWorkflow({ name: "needs-test" });
    addJob(w, { id: "build", runsOn: "ubuntu-latest" });
    addJob(w, { id: "deploy", runsOn: "ubuntu-latest" });
    dependOn(w, "deploy", "build");

    const out = generateYaml(w);
    const doc = load(out) as Record<string, any>;

    expect(doc.jobs.deploy.needs).toEqual(["build"]);
    // build has no needs
    expect(doc.jobs.build.needs).toBeUndefined();
  });
});
