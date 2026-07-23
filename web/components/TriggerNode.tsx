"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { Trigger } from "@/lib/model/types";

export type TriggerNodeData = { trigger: Trigger };
export type TriggerNodeType = NodeProps & { data: TriggerNodeData };

function TriggerNodeBase({ data }: { data: TriggerNodeData }) {
  const t = data.trigger;
  return (
    <div
      className="hexagon border-2 border-accent bg-surface-2 flex flex-col items-center justify-center gap-0.5 relative"
      style={{ width: 188, height: 74 }}
      role="group"
      aria-label={`Trigger: on ${t.event}${t.branches?.length ? `, branches ${t.branches.join(", ")}` : ""}`}
    >
      <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-bg px-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-faint">
        Trigger
      </span>
      <span className="font-mono text-xs font-semibold text-ink">on: {t.event}</span>
      <span className="font-mono text-[10.5px] text-accent">
        {t.branches?.length ? `branches: [${t.branches.join(", ")}]` : ""}
      </span>
      {/* source handle → jobs */}
      <Handle type="source" position={Position.Right} className="!bg-accent !border-bg !w-2 !h-2" />
    </div>
  );
}

export const TriggerNode = memo(TriggerNodeBase);
