import { describe, expect, it } from "vitest";
import { analyzeDockerfile, parseDockerfile } from "../dockerfile";

describe("Dockerfile review", () => {
  it("builds a chronological stage model", () => {
    const result = parseDockerfile("FROM node:22 AS build\nRUN npm ci\nFROM nginx:latest\nCOPY --from=build /app /usr/share/nginx/html\n");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.stages).toHaveLength(2);
    expect(result.value.graph.edges).toContainEqual({ from: "build", to: "stage-2", label: "copies into" });
  });

  it("finds mutable bases, root identity, and cache-hostile copy order", () => {
    const result = parseDockerfile("FROM node:latest\nCOPY . .\nRUN npm ci\n");
    if (!result.ok) return;
    const ids = analyzeDockerfile(result.value).map((finding) => finding.ruleId);
    expect(ids).toEqual(expect.arrayContaining(["DOCKER_MUTABLE_BASE", "DOCKER_ROOT_USER", "DOCKER_CACHE_COPY"]));
  });
});
