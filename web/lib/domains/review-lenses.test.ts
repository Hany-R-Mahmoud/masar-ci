import { describe, expect, it } from "vitest";
import { visibleNodeIdsForLens } from "@/lib/domains/review-lenses";
import type { WorkspaceAnalysis } from "@/lib/domains/workspace-adapters";

const analysis: WorkspaceAnalysis = {
  domain: "terraform",
  mode: "review",
  graph: {
    nodes: [
      { id: "created", label: "created", kind: "resource", detail: "create" },
      { id: "updated", label: "updated", kind: "resource", detail: "update" },
      { id: "deleted", label: "deleted", kind: "resource", detail: "delete" },
      { id: "replaced", label: "replaced", kind: "resource", detail: "replace" },
      { id: "legacy-replaced", label: "legacy-replaced", kind: "resource", detail: "delete + create" },
      { id: "isolated", label: "isolated", kind: "resource", detail: "no-op" },
    ],
    edges: [{ from: "created", to: "updated", label: "references" }],
  },
  findings: [],
  summary: [],
  exportValue: "{}",
};

describe("Terraform review lenses", () => {
  it.each([
    ["create", ["created"]],
    ["update", ["updated"]],
    ["delete", ["deleted"]],
    ["replace", ["legacy-replaced", "replaced"]],
    ["dependencies", ["created", "updated"]],
    ["isolated", ["deleted", "isolated", "legacy-replaced", "replaced"]],
  ] as const)("filters the %s lens", (lens, expected) => {
    // When
    const visible = visibleNodeIdsForLens(analysis, lens);

    // Then
    expect([...visible].sort()).toEqual([...expected].sort());
  });
});
