"use client";

import { useMemo, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  type Connection,
  type ReactFlowInstance,
  type NodeTypes,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { Workflow } from "@/lib/model/types";
import type { LintFinding } from "@/lib/lint/lint";
import { TriggerNode } from "./TriggerNode";
import { JobNode, type JobNodeData } from "./JobNode";

const nodeTypes: NodeTypes = {
  trigger: TriggerNode as unknown as NodeTypes[string],
  job: JobNode as unknown as NodeTypes[string],
};

export interface CanvasHandlers {
  onNodeDragStop: (id: string, x: number, y: number) => void;
  onConnectNeeds: (source: string, target: string) => void;
  onDropItem: (payload: Record<string, unknown>, x: number, y: number) => void;
  onImportYaml: (yaml: string) => void;
  onNodeClick: (id: string, type: string) => void;
  onStepClick: (jobId: string, stepId: string) => void;
  onDeleteStep: (jobId: string, stepId: string) => void;
  onDropAction: (jobId: string, repo: string, ref: string) => void;
}

export function Canvas({
  model,
  positions,
  findings,
  handlers,
  canUndoMove,
  onUndoMove,
}: {
  model: Workflow;
  positions: Record<string, { x: number; y: number }>;
  findings: LintFinding[];
  handlers: CanvasHandlers;
  canUndoMove: boolean;
  onUndoMove: () => void;
}) {
  const instanceRef = useRef<ReactFlowInstance | null>(null);

  const stepFindings = useMemo(() => {
    const m = new Map<string, LintFinding>();
    const rank = { critical: 0, warning: 1, info: 2 };
    for (const f of findings) {
      if (!f.targetStepId) continue;
      const current = m.get(f.targetStepId);
      if (!current || rank[f.severity] < rank[current.severity]) m.set(f.targetStepId, f);
    }
    return m;
  }, [findings]);

  const nodes: Node[] = useMemo(() => {
    const list: Node[] = [];
    model.on.forEach((trigger, triggerIndex) => {
      const id = `trigger-${triggerIndex}`;
      list.push({
        id,
        type: "trigger",
        position: positions[id] ?? { x: 24, y: 90 + triggerIndex * 110 },
        data: { trigger },
      });
    });
    model.jobs.forEach((job, i) => {
      const data: JobNodeData = {
        job,
        findings: stepFindings,
        onStepClick: handlers.onStepClick,
        onDeleteStep: handlers.onDeleteStep,
        onDropAction: handlers.onDropAction,
      };
      list.push({
        id: job.id,
        type: "job",
        position: positions[job.id] ?? { x: 360, y: 70 + i * 320 },
        data: data as unknown as Record<string, unknown>,
      });
    });
    return list;
  }, [model, positions, stepFindings, handlers]);

  const edges: Edge[] = useMemo(() => {
    const list: Edge[] = [];
    if (model.on.length && model.jobs.length) {
      model.on.forEach((_, triggerIndex) => {
        list.push({
          id: `e-trigger-${triggerIndex}`,
          source: `trigger-${triggerIndex}`,
          target: model.jobs[0].id,
          type: "smoothstep",
          style: { stroke: "var(--color-border-strong)", strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: "var(--color-border-strong)" },
        });
      });
    }
    for (const job of model.jobs) {
      for (const need of job.needs) {
        list.push({
          id: `e-${need}-${job.id}`,
          source: need,
          target: job.id,
          type: "smoothstep",
          animated: true,
          style: { stroke: "var(--color-accent)", strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: "var(--color-accent)" },
        });
      }
    }
    return list;
  }, [model]);

  return (
    <div
      className="relative canvas-grid h-full"
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDrop={(e) => {
        e.preventDefault();
        // Direct .yml / .yaml file drop onto the canvas → import.
        const file = e.dataTransfer.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => handlers.onImportYaml(String(reader.result ?? ""));
          reader.onerror = () => handlers.onImportYaml("");
          reader.readAsText(file);
          return;
        }
        const raw = e.dataTransfer.getData("application/reactflow");
        try {
          const parsed = JSON.parse(raw);
          if (instanceRef.current && parsed?.type) {
            const p = instanceRef.current.screenToFlowPosition({ x: e.clientX, y: e.clientY });
            handlers.onDropItem(parsed, p.x, p.y);
          }
        } catch {
          /* ignore */
        }
      }}
    >
      <button
        type="button"
        onClick={onUndoMove}
        disabled={!canUndoMove}
        aria-label="Undo move"
        title="Restore node positions before the last move"
        className="absolute left-3 top-3 z-10 rounded-md border border-border-strong bg-surface/95 px-2.5 py-1.5 font-mono text-[10.5px] text-ink-muted shadow-sm hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
      >
        Undo move
      </button>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onInit={(inst) => (instanceRef.current = inst)}
        onNodeDragStop={(_, node) => handlers.onNodeDragStop(node.id, node.position.x, node.position.y)}
        onNodeClick={(_, node) => handlers.onNodeClick(node.id, node.type ?? "")}
        onConnect={(c: Connection) => {
          if (c.source && c.target) handlers.onConnectNeeds(c.source, c.target);
        }}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: false }}
        nodesDraggable
        nodesConnectable
      >
        <Background gap={24} size={1} color="var(--color-border)" />
        <Controls className="!bg-surface !border-border" />
      </ReactFlow>
    </div>
  );
}
