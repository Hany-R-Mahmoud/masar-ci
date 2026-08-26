import type { WorkspaceAnalysis } from "@/lib/domains/workspace-adapters";
import type { ReviewLens } from "@/lib/domains/domain-tools";

function actionNodeIds(analysis: WorkspaceAnalysis, action: "create" | "update" | "delete" | "replace"): Set<string> {
  return new Set(analysis.graph.nodes
    .filter((node) => {
      const actions = node.detail?.split(/\s+\+\s+/) ?? [];
      const legacyReplacement = actions.includes("delete") && actions.includes("create");
      return action === "replace" ? actions.includes("replace") || legacyReplacement : actions.includes(action) && !legacyReplacement;
    })
    .map((node) => node.id));
}

export function visibleNodeIdsForLens(analysis: WorkspaceAnalysis | undefined, lens: ReviewLens): ReadonlySet<string> {
  if (!analysis) return new Set();
  switch (lens) {
    case "all":
      return new Set(analysis.graph.nodes.map((node) => node.id));
    case "dependencies":
      return new Set(analysis.graph.edges.flatMap((edge) => [edge.from, edge.to]));
    case "create":
    case "update":
    case "delete":
    case "replace":
      return actionNodeIds(analysis, lens);
    case "isolated": {
      const connected = new Set(analysis.graph.edges.flatMap((edge) => [edge.from, edge.to]));
      return new Set(analysis.graph.nodes.filter((node) => !connected.has(node.id)).map((node) => node.id));
    }
    case "risk": {
      const evidence = analysis.findings.flatMap((finding) => [finding.evidence?.artifact, finding.evidence?.path]
        .filter((value): value is string => typeof value === "string"));
      return new Set(analysis.graph.nodes
        .filter((node) => evidence.some((value) => value.includes(node.id) || value.includes(node.label)))
        .map((node) => node.id));
    }
    default:
      throw new TypeError(`Unsupported review lens: ${String(lens)}`);
  }
}
