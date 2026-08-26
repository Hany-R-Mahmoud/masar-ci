"use client";

import { useMemo } from "react";
import { MarkerType, ReactFlow, type Edge, type Node, type NodeTypes } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { WorkspaceAnalysis } from "@/lib/domains/workspace-adapters";
import type { ReviewLens } from "@/lib/domains/domain-tools";
import { visibleNodeIdsForLens } from "@/lib/domains/review-lenses";
import { ArtifactNode, type ArtifactNodeData } from "./ArtifactNode";
import { CanvasChrome } from "./CanvasChrome";
import { DOMAIN_TOOL_MIME } from "./DomainToolTray";

export type DomainNodePositions = Readonly<Record<string, { readonly x: number; readonly y: number }>>;

const nodeTypes: NodeTypes = {
  artifact: ArtifactNode as unknown as NodeTypes[string],
};

interface DomainCanvasProps {
  readonly analysis?: WorkspaceAnalysis;
  readonly lens: ReviewLens;
  readonly positions: DomainNodePositions;
  readonly onAddTool: (toolId: string) => void;
  readonly onMoveNode: (nodeId: string, x: number, y: number) => void;
}

export function DomainCanvas({ analysis, lens, positions, onAddTool, onMoveNode }: DomainCanvasProps) {
  const visibleIds = useMemo(() => {
    return visibleNodeIdsForLens(analysis, lens);
  }, [analysis, lens]);

  const nodes: Node[] = useMemo(() => analysis?.graph.nodes
    .filter((node) => visibleIds.has(node.id))
    .map((node, index) => ({
      id: node.id,
      type: "artifact",
      position: positions[node.id] ?? { x: 80 + (index % 2) * 380, y: 70 + Math.floor(index / 2) * 170 },
      data: { kind: node.kind, label: node.label, detail: node.detail ?? "No additional detail" } satisfies ArtifactNodeData,
    })) ?? [], [analysis, positions, visibleIds]);

  const edges: Edge[] = useMemo(() => analysis?.graph.edges
    .filter((edge) => visibleIds.has(edge.from) && visibleIds.has(edge.to))
    .map((edge, index) => ({
      id: `${edge.from}-${edge.to}-${index}`,
      source: edge.from,
      target: edge.to,
      label: edge.label,
      type: "smoothstep",
      markerEnd: { type: MarkerType.ArrowClosed, color: "var(--color-accent)" },
      style: { stroke: "var(--color-accent)", strokeWidth: 2 },
      labelStyle: { fill: "var(--color-ink-muted)", fontSize: 9 },
      labelBgStyle: { fill: "var(--color-surface)" },
      labelBgPadding: [5, 3] as [number, number],
      labelBgBorderRadius: 2,
    })) ?? [], [analysis, visibleIds]);

  return (
    <div
      className="domain-flow-canvas canvas-grid"
      onDragOver={(event) => {
        if (!event.dataTransfer.types.includes(DOMAIN_TOOL_MIME)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
      }}
      onDrop={(event) => {
        const toolId = event.dataTransfer.getData(DOMAIN_TOOL_MIME);
        if (!toolId) return;
        event.preventDefault();
        onAddTool(toolId);
      }}
    >
      {nodes.length === 0 ? <div className="empty-surface"><strong>No nodes in this view</strong><p>Add a tool, import source, or choose another review lens.</p></div> : null}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeDragStop={(_, node) => onMoveNode(node.id, node.position.x, node.position.y)}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
        proOptions={{ hideAttribution: false }}
        aria-label="Artifact topology canvas"
      >
        <CanvasChrome />
      </ReactFlow>
      <table className="sr-only">
        <caption>Topology nodes</caption>
        <thead><tr><th>Artifact</th><th>Type</th><th>Detail</th></tr></thead>
        <tbody>{analysis?.graph.nodes.filter((node) => visibleIds.has(node.id)).map((node) => <tr key={node.id}><th>{node.label}</th><td>{node.kind}</td><td>{node.detail ?? "None"}</td></tr>)}</tbody>
      </table>
      <table className="sr-only">
        <caption>Topology connections</caption>
        <thead><tr><th>From</th><th>To</th><th>Relationship</th></tr></thead>
        <tbody>{analysis?.graph.edges
          .filter((edge) => visibleIds.has(edge.from) && visibleIds.has(edge.to))
          .map((edge, index) => <tr key={`${edge.from}:${edge.to}:${edge.label}:${index}`}><td>{edge.from}</td><td>{edge.to}</td><td>{edge.label}</td></tr>)}</tbody>
      </table>
    </div>
  );
}
