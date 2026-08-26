"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { cn } from "@/lib/cn";

export interface ArtifactNodeData {
  readonly kind: string;
  readonly label: string;
  readonly detail: string;
}

function ArtifactNodeBase({ data, selected = false }: { readonly data: ArtifactNodeData; readonly selected?: boolean }) {
  return (
    <article
      className={cn(
        "w-80 rounded-lg border bg-surface-2 p-3 transition-colors",
        selected ? "border-accent" : "border-border-strong",
      )}
      role="group"
      aria-label={`${data.kind} ${data.label}: ${data.detail}`}
    >
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !border-bg !bg-accent !opacity-100" />
      <header className="mb-2.5 flex min-w-0 items-center gap-2">
        <span aria-hidden="true" className="h-2.5 w-3.5 shrink-0 rounded-[2px] border border-accent bg-accent/15" />
        <strong className="min-w-0 flex-1 truncate font-mono text-[12.5px] font-semibold text-ink">{data.label}</strong>
        <span className="max-w-28 truncate font-mono text-[10px] uppercase tracking-[0.08em] text-ink-faint">{data.kind}</span>
      </header>
      <div className="flex min-w-0 items-center gap-2 rounded-md border border-border bg-surface px-3 py-2">
        <span aria-hidden="true" className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded border border-border bg-code-bg font-mono text-[9.5px] text-ink-muted">::</span>
        <span className="min-w-0 flex-1 truncate font-mono text-[11.5px] text-ink-muted">{data.detail}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !border-bg !bg-accent !opacity-100" />
    </article>
  );
}

export const ArtifactNode = memo(ArtifactNodeBase);
