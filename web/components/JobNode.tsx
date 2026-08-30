"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import type { Job } from "@/lib/model/types";
import type { LintFinding } from "@/lib/lint/lint";
import { cn } from "@/lib/cn";

export interface JobNodeData {
  job: Job;
  findings: Map<string, LintFinding>;
  onStepClick: (jobId: string, stepId: string) => void;
  onDeleteStep: (jobId: string, stepId: string) => void;
  onDropAction: (jobId: string, repo: string, ref: string) => void;
}

function JobNodeBase({ data }: { data: JobNodeData }) {
  const { job, findings, onStepClick, onDeleteStep, onDropAction } = data;
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const raw = e.dataTransfer.getData("application/reactflow");
        try {
          const parsed = JSON.parse(raw);
          if (parsed?.type === "action" && parsed.repo && parsed.ref) {
            onDropAction(job.id, parsed.repo, parsed.ref);
          }
        } catch {
          /* ignore */
        }
      }}
      className="rounded-lg border border-border-strong bg-surface-2 p-3"
      style={{ width: 320 }}
      role="group"
      aria-label={`Job ${job.name} on ${job.runsOn}${job.needs.length ? `, needs ${job.needs.join(", ")}` : ""}, ${job.steps.length} steps`}
    >
      <Handle type="target" position={Position.Top} className="!bg-accent !border-bg !w-2 !h-2 !!opacity-100" />
      <div className="flex items-center gap-2 mb-2.5">
        <span className="bg-accent/15 border border-accent rounded-[2px]" style={{ width: 14, height: 10 }} />
        <span className="font-mono text-[12.5px] font-semibold">{job.name}</span>
        {job.needs.length > 0 && (
          <span className="font-mono text-[10px] text-accent border border-accent bg-accent/15 rounded px-1.5 py-px">
            needs: [{job.needs.join(", ")}]
          </span>
        )}
        <span className="ml-auto font-mono text-[10px] text-ink-faint">{job.runsOn}</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {job.steps.map((s) => {
          const f = findings.get(s.id);
          return (
            <div
              key={s.id}
              className={cn(
                "relative flex items-center rounded-md border bg-surface hover:border-border-strong focus-within:border-border-strong",
                f ? "border-critical shadow-[0_0_0_2px_oklch(0.62_0.22_25/0.14)]" : "border-border",
              )}
            >
              {f && (
                <span
                  className={cn(
                    "absolute -right-1.5 -top-1.5 grid h-[18px] w-[18px] place-items-center rounded-full border-2 border-bg font-mono text-[10px] font-bold",
                    f.severity === "critical" ? "bg-critical text-white" : f.severity === "warning" ? "bg-warning text-black" : "bg-surface text-ink",
                  )}
                  aria-label={`${f.severity} finding: ${f.title}`}
                  title={`${f.severity}: ${f.title}`}
                >
                  {f.severity === "critical" ? "!" : f.severity === "warning" ? "~" : "i"}
                </span>
              )}
              <button
                type="button"
                onClick={() => onStepClick(job.id, s.id)}
                aria-label={`Edit step ${s.name}`}
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 border-0 bg-transparent px-3 py-2 text-left"
              >
                <span className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded border border-border bg-code-bg font-mono text-[9.5px] text-ink-muted">
                  {s.kind === "action" ? "✓" : "$_"}
                </span>
                <span className="min-w-0 flex-1 truncate font-mono text-[11.5px] text-ink">
                  {s.kind === "action" ? (
                    <>
                      <b className="text-[oklch(0.74_0.10_250)]">uses:</b> {s.action!.repo}
                      <span className="text-accent">@{s.action!.ref}</span>
                    </>
                  ) : (
                    <>
                      <b className="text-[oklch(0.74_0.10_250)]">run:</b> {s.run}
                    </>
                  )}
                </span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteStep(job.id, s.id);
                }}
                className="mr-2 shrink-0 px-1 text-xs text-ink-faint hover:text-critical"
                aria-label="delete step"
              >
                ✕
              </button>
            </div>
          );
        })}
        {job.steps.length === 0 && (
          <div className="rounded-md border border-dashed border-border px-3 py-2 text-center font-mono text-[10.5px] text-ink-faint">
            drop an action here
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-accent !border-bg !w-2 !h-2 !!opacity-100" />
    </div>
  );
}

export const JobNode = memo(JobNodeBase);
