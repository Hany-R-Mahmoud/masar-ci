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
  type: "step" | "job" | "trigger";
  jobId: string;
  stepId?: string;
  triggerIndex?: number;
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
  if (selection.type === "trigger") {
    const trigger = model.on[selection.triggerIndex ?? 0];
    if (!trigger) return null;
    return (
      <aside className="step-editor-panel absolute right-0 top-0 bottom-0 w-[340px] bg-surface border-l border-border-strong z-20 flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 h-12 border-b border-border bg-surface-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-faint">Trigger editor</span>
          <button onClick={onClose} className="text-ink-faint hover:text-ink text-sm px-2 cursor-pointer" aria-label="close">✕</button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <TriggerFields
            trigger={trigger}
            onChange={(next) => onChange({ ...model, on: model.on.map((item, index) => index === (selection.triggerIndex ?? 0) ? next : item) })}
          />
        </div>
      </aside>
    );
  }
  const job = model.jobs.find((j) => j.id === selection.jobId);
  if (!job) return null;
  const step = selection.type === "step" ? job.steps.find((s) => s.id === selection.stepId) : undefined;

  return (
    <aside className="step-editor-panel absolute right-0 top-0 bottom-0 w-[340px] bg-surface border-l border-border-strong z-20 flex flex-col shadow-2xl">
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
          <>
            <PermissionsEditor
              label="Workflow permissions"
              permissions={model.permissions}
              onChange={(permissions) => onChange({ ...model, permissions })}
            />
            <JobFields job={job} model={model} onChange={onChange} />
          </>
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

function TriggerFields({ trigger, onChange }: { trigger: Workflow["on"][number]; onChange: (trigger: Workflow["on"][number]) => void }) {
  const update = (patch: Partial<Workflow["on"][number]>) => onChange({ ...trigger, ...patch });
  return (
    <div className="flex flex-col gap-3.5">
      <div>
        <Label>Event</Label>
        <select className={inputCls} value={trigger.event} onChange={(e) => update({ event: e.target.value as Workflow["on"][number]["event"] })}>
          <option value="push">push</option>
          <option value="pull_request">pull_request</option>
          <option value="pull_request_target">pull_request_target</option>
          <option value="workflow_dispatch">workflow_dispatch</option>
          <option value="schedule">schedule</option>
        </select>
      </div>
      {(trigger.event === "push" || trigger.event === "pull_request" || trigger.event === "pull_request_target") && (
        <>
          <div><Label>Branches</Label><input className={inputCls} value={trigger.branches?.join(", ") ?? ""} placeholder="main, release/*" onChange={(e) => update({ branches: e.target.value.split(",").map((v) => v.trim()).filter(Boolean) || undefined })} /></div>
          <div><Label>Paths</Label><input className={inputCls} value={trigger.paths?.join(", ") ?? ""} placeholder="src/**" onChange={(e) => update({ paths: e.target.value.split(",").map((v) => v.trim()).filter(Boolean) || undefined })} /></div>
        </>
      )}
      {trigger.event === "schedule" && (
        <div>
          <Label>Cron (UTC)</Label>
          <div className="flex flex-col gap-1.5">
            {(trigger.schedules ?? [{ cron: "" }]).map((schedule, index) => (
              <div key={index} className="flex gap-1.5">
                <input aria-invalid={schedule.cron.trim().length > 0 && schedule.cron.trim().split(/\s+/).length !== 5} className={inputCls} value={schedule.cron} placeholder="0 5 * * *" onChange={(e) => {
                  const schedules = [...(trigger.schedules ?? [{ cron: "" }])];
                  schedules[index] = { cron: e.target.value };
                  update({ schedules });
                }} />
                <button type="button" aria-label={`Remove schedule ${index + 1}`} className="text-critical px-1.5" onClick={() => {
                  const schedules = (trigger.schedules ?? []).filter((_, itemIndex) => itemIndex !== index);
                  update({ schedules: schedules.length ? schedules : undefined });
                }}>×</button>
              </div>
            ))}
            <button type="button" className="self-start text-[10px] text-accent hover:underline" onClick={() => update({ schedules: [...(trigger.schedules ?? []), { cron: "" }] })}>Add schedule</button>
          </div>
          {(trigger.schedules ?? []).some((schedule) => schedule.cron.trim().length > 0 && schedule.cron.trim().split(/\s+/).length !== 5) && <p className="mt-1 text-[10.5px] text-critical">Use five cron fields.</p>}
          <p className="mt-1.5 text-[10.5px] text-ink-faint">GitHub evaluates scheduled workflows in UTC.</p>
        </div>
      )}
      {trigger.event === "workflow_dispatch" && (
        <div>
          <Label>Dispatch inputs</Label>
          <div className="flex flex-col gap-2">
            {Object.entries(trigger.inputs ?? {}).map(([name, input]) => (
              <div key={name} className="rounded border border-border p-2">
                <div className="flex gap-1.5">
                  <input aria-label={`Input name ${name}`} className={inputCls} value={name} onChange={(e) => {
                    const next = { ...(trigger.inputs ?? {}) };
                    delete next[name];
                    if (e.target.value.trim()) next[e.target.value.trim()] = input;
                    update({ inputs: Object.keys(next).length ? next : undefined });
                  }} />
                  <button type="button" aria-label={`Remove input ${name}`} className="text-critical px-1.5" onClick={() => {
                    const next = { ...(trigger.inputs ?? {}) };
                    delete next[name];
                    update({ inputs: Object.keys(next).length ? next : undefined });
                  }}>×</button>
                </div>
                <input aria-label={`${name} description`} className={`${inputCls} mt-1.5`} placeholder="Description" value={input.description ?? ""} onChange={(e) => update({ inputs: { ...(trigger.inputs ?? {}), [name]: { ...input, description: e.target.value || undefined } } })} />
                <div className="flex gap-1.5 mt-1.5">
                  <select aria-label={`${name} type`} className={inputCls} value={input.type ?? "string"} onChange={(e) => update({ inputs: { ...(trigger.inputs ?? {}), [name]: { ...input, type: e.target.value as typeof input.type } } })}>
                    <option value="string">string</option><option value="boolean">boolean</option><option value="choice">choice</option><option value="environment">environment</option>
                  </select>
                  <input aria-label={`${name} default`} className={inputCls} placeholder="Default" value={input.default ?? ""} onChange={(e) => update({ inputs: { ...(trigger.inputs ?? {}), [name]: { ...input, default: e.target.value || undefined } } })} />
                </div>
                <label className="flex items-center gap-2 mt-1.5 text-[11px] text-ink-muted"><input type="checkbox" checked={input.required ?? false} onChange={(e) => update({ inputs: { ...(trigger.inputs ?? {}), [name]: { ...input, required: e.target.checked } } })} /> required</label>
              </div>
            ))}
            <button type="button" className="self-start text-[10px] text-accent hover:underline" onClick={() => update({ inputs: { ...(trigger.inputs ?? {}), input: { type: "string" } } })}>Add input</button>
          </div>
        </div>
      )}
    </div>
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
      <MatrixEditor
        matrix={job.strategy?.matrix}
        onChange={(matrix) =>
          onChange(updateJobClone(model, job.id, matrix ? { strategy: { matrix } } : { strategy: undefined }))
        }
      />
      <PermissionsEditor
        label="Job permissions"
        permissions={job.permissions}
        onChange={(permissions) => onChange(updateJobClone(model, job.id, { permissions }))}
      />
    </>
  );
}

function MatrixEditor({
  matrix,
  onChange,
}: {
  matrix?: Record<string, string[]>;
  onChange: (matrix: Record<string, string[]> | undefined) => void;
}) {
  const entries = Object.entries((matrix ?? {}) as Record<string, string[]>);
  return (
    <div className="border-t border-border pt-3">
      <div className="flex items-center justify-between mb-2">
        <Label>Matrix</Label>
        <button
          type="button"
          className="text-[10px] text-accent hover:underline"
          onClick={() => onChange({ ...((matrix ?? {}) as Record<string, string[]>), axis: ["value"] })}
        >
          Add dimension
        </button>
      </div>
      {entries.length === 0 ? (
        <p className="text-[11px] text-ink-faint">Optional. Values expand job combinations.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map(([name, values]) => (
            <div key={name} className="flex gap-1.5 items-start">
              <input
                aria-label={`Matrix dimension ${name}`}
                className={`${inputCls} w-[92px]`}
                value={name}
                onChange={(e) => {
                  const next = { ...((matrix ?? {}) as Record<string, string[]>) };
                  delete next[name];
                  next[e.target.value.trim() || name] = values;
                  onChange(next);
                }}
              />
              <input
                aria-label={`${name} values`}
                className={inputCls}
                value={values.join(", ")}
                onChange={(e) => {
                  const next = { ...((matrix ?? {}) as Record<string, string[]>) };
                  next[name] = e.target.value.split(",").map((v) => v.trim()).filter(Boolean);
                  onChange(next);
                }}
              />
              <button
                type="button"
                aria-label={`Remove matrix dimension ${name}`}
                className="text-critical px-1.5 py-1"
                onClick={() => {
                  const next = { ...((matrix ?? {}) as Record<string, string[]>) };
                  delete next[name];
                  onChange(Object.keys(next).length ? next : undefined);
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PermissionsEditor({
  label = "Permissions",
  permissions,
  onChange,
}: {
  label?: string;
  permissions?: Record<string, string>;
  onChange: (permissions: Record<string, string> | undefined) => void;
}) {
  const entries = Object.entries(permissions ?? {});
  return (
    <div className="border-t border-border pt-3">
      <div className="flex items-center justify-between mb-1">
        <Label>{label}</Label>
        <button
          type="button"
          className="text-[10px] text-accent hover:underline"
          onClick={() => onChange({ ...(permissions ?? {}), contents: "read" })}
        >
          Add scope
        </button>
      </div>
      <p className="text-[10.5px] text-ink-faint mb-2">Explicit least privilege. No automatic inference.</p>
      {entries.map(([scope, level]) => (
        <div key={scope} className="flex gap-1.5 items-center mb-1.5">
          <input
            aria-label={`Permission scope ${scope}`}
            className={`${inputCls} w-[110px]`}
            value={scope}
            onChange={(e) => {
              const next = { ...(permissions ?? {}) };
              delete next[scope];
              if (e.target.value.trim()) next[e.target.value.trim()] = level;
              onChange(Object.keys(next).length ? next : undefined);
            }}
          />
          <select
            aria-label={`${scope} permission level`}
            className={inputCls}
            value={level}
            onChange={(e) => onChange({ ...(permissions ?? {}), [scope]: e.target.value })}
          >
            <option value="none">none</option>
            <option value="read">read</option>
            <option value="write">write</option>
          </select>
          <button
            type="button"
            aria-label={`Remove permission ${scope}`}
            className="text-critical px-1.5 py-1"
            onClick={() => {
              const next = { ...(permissions ?? {}) };
              delete next[scope];
              onChange(Object.keys(next).length ? next : undefined);
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
