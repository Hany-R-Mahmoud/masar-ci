"use client";

import type { Workflow } from "@/lib/model/types";
import {
  updateStepClone,
  removeStepClone,
  updateJobClone,
  removeJobClone,
  setJobNeedsClone,
} from "@/lib/model/ops";
import Editor from "@monaco-editor/react";

export interface Selection {
  type: "step" | "job";
  jobId: string;
  stepId?: string;
}

export function StepEditor({
  selection,
  model,
  onChange,
  onClose,
}: {
  selection: Selection;
  model: Workflow;
  onChange: (w: Workflow) => void;
  onClose: () => void;
}) {
  const job = model.jobs.find((j) => j.id === selection.jobId);
  if (!job) return null;
  const step = selection.type === "step" ? job.steps.find((s) => s.id === selection.stepId) : undefined;

  return (
    <aside className="absolute right-0 top-0 bottom-0 w-[340px] bg-surface border-l border-border-strong z-20 flex flex-col shadow-2xl">
      <div className="flex items-center justify-between px-4 h-12 border-b border-border bg-surface-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-faint">
          {selection.type === "step" ? "Step editor" : "Job editor"}
        </span>
        <button onClick={onClose} className="text-ink-faint hover:text-ink text-sm px-2 cursor-pointer" aria-label="close">
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 flex flex-col gap-3.5">
        {selection.type === "step" && step ? (
          <StepFields step={step} onChange={(patch) => onChange(updateStepClone(model, job.id, step.id, patch))} />
        ) : (
          <JobFields job={job} model={model} onChange={onChange} />
        )}
      </div>

      <div className="border-t border-border p-3">
        {selection.type === "step" && step ? (
          <button
            onClick={() => { onChange(removeStepClone(model, job.id, step.id)); onClose(); }}
            className="w-full text-[12px] font-medium px-3 py-2 rounded-md border border-critical/50 bg-critical/10 text-critical hover:bg-critical hover:text-white cursor-pointer"
          >
            Delete step
          </button>
        ) : (
          <button
            onClick={() => { onChange(removeJobClone(model, job.id)); onClose(); }}
            className="w-full text-[12px] font-medium px-3 py-2 rounded-md border border-critical/50 bg-critical/10 text-critical hover:bg-critical hover:text-white cursor-pointer"
          >
            Delete job
          </button>
        )}
      </div>
    </aside>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint mb-1.5">{children}</label>;
}

const inputCls = "w-full bg-bg border border-border rounded-md px-2.5 py-1.5 text-ink text-[12.5px] focus:outline-1 focus:outline-accent";
function StepFields({
  step,
  onChange,
}: {
  step: Workflow["jobs"][number]["steps"][number];
  onChange: (patch: Partial<Workflow["jobs"][number]["steps"][number]>) => void;
}) {
  return (
    <>
      <div>
        <Label>Name</Label>
        <input className={inputCls} value={step.name} onChange={(e) => onChange({ name: e.target.value })} />
      </div>
      {step.kind === "action" && step.action ? (
        <>
          <div>
            <Label>Action repo</Label>
            <input className={inputCls} value={step.action.repo} onChange={(e) => onChange({ action: { ...step.action!, repo: e.target.value } })} />
          </div>
          <div>
            <Label>Ref (pin to tag @vN or commit SHA)</Label>
            <input className={inputCls} value={step.action.ref} onChange={(e) => onChange({ action: { ...step.action!, ref: e.target.value } })} />
          </div>
        </>
      ) : (
        <div>
          <Label>Run script</Label>
          <Editor
            height="170px"
            defaultLanguage="shell"
            theme="vs-dark"
            value={step.run ?? ""}
            onChange={(v) => onChange({ run: v ?? "" })}
            options={{
              minimap: { enabled: false },
              fontSize: 12,
              lineNumbers: "off",
              scrollBeyondLastLine: false,
              wordWrap: "on",
              padding: { top: 8 },
              renderLineHighlight: "none",
            }}
            loading={<div className={`${inputCls} font-mono text-[11.5px] min-h-[170px]`}>Loading editor…</div>}
          />
          <p className="mt-1.5 text-[10.5px] text-ink-faint">
            Tip: never interpolate <code className="text-accent">{"${{ github.event.* }}"}</code> directly — the linter
            will flag it and auto-fix to an <code className="text-accent">env:</code> variable.
          </p>
        </div>
      )}
    </>
  );
}

function JobFields({
  job,
  model,
  onChange,
}: {
  job: Workflow["jobs"][number];
  model: Workflow;
  onChange: (w: Workflow) => void;
}) {
  return (
    <>
      <div>
        <Label>Job name</Label>
        <input className={inputCls} value={job.name} onChange={(e) => onChange(updateJobClone(model, job.id, { name: e.target.value }))} />
      </div>
      <div>
        <Label>Runs on</Label>
        <input className={inputCls} value={job.runsOn} onChange={(e) => onChange(updateJobClone(model, job.id, { runsOn: e.target.value }))} />
      </div>
      <div>
        <Label>Needs (depends on)</Label>
        <div className="flex flex-col gap-1.5">
          {model.jobs
            .filter((j) => j.id !== job.id)
            .map((j) => {
              const checked = job.needs.includes(j.id);
              return (
                <label key={j.id} className="flex items-center gap-2 text-[12.5px] text-ink cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const next = e.target.checked ? [...job.needs, j.id] : job.needs.filter((n) => n !== j.id);
                      onChange(setJobNeedsClone(model, job.id, next));
                    }}
                  />
                  <span className="font-mono">{j.id}</span>
                </label>
              );
            })}
          {model.jobs.filter((j) => j.id !== job.id).length === 0 && (
            <span className="text-[11px] text-ink-faint">No other jobs to depend on.</span>
          )}
        </div>
      </div>
    </>
  );
}
