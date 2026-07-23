"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Workflow, ActionRef } from "@/lib/model/types";
import { createSampleWorkflow } from "@/lib/sample";
import { TEMPLATES } from "@/lib/templates";
import { generateYaml } from "@/lib/generate/yaml";
import { parseYaml } from "@/lib/generate/parse";
import { lint, type LintFinding } from "@/lib/lint/lint";
import {
  setTrigger,
  addJobClone,
  addStepActionClone,
  removeStepClone,
  setJobNeedsClone,
  emptyWorkflow,
} from "@/lib/model/ops";
import { Tray } from "@/components/Tray";
import { Canvas, type CanvasHandlers } from "@/components/Canvas";
import { YamlLintPanel } from "@/components/YamlLintPanel";
import { StepEditor, type Selection } from "@/components/StepEditor";
import { ImportModal } from "@/components/ImportModal";
import { cn } from "@/lib/cn";

const STORAGE_KEY = "masarci:workflow:v1";

function uniqueJobId(w: Workflow, base: string): string {
  const ids = new Set(w.jobs.map((j) => j.id));
  if (!ids.has(base)) return base;
  let n = 2;
  while (ids.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

export default function Page() {
  const [workflow, setWorkflow] = useState<Workflow>(createSampleWorkflow);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [selection, setSelection] = useState<Selection | null>(null);
  const [importing, setImporting] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const skipSave = useRef(true);

  const yaml = useMemo(() => generateYaml(workflow), [workflow]);
  const findings = useMemo(() => lint(workflow), [workflow]);

  // Hydrate from localStorage AFTER mount so SSR + first client render match
  // (avoids the hydration mismatch from reading window during render).
  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setWorkflow(JSON.parse(raw) as Workflow);
      } catch {
        /* ignore bad storage */
      }
    }
  }, []);

  useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workflow));
  }, [workflow]);

  const state =
    !workflow.jobs.length && !workflow.on.length
      ? { label: "Empty Workflow", cls: "bg-surface-2 text-ink-muted border-border" }
      : findings.length > 0
        ? { label: `Warnings Found · ${findings.length}`, cls: "bg-[oklch(0.62_0.22_25/0.14)] text-critical border-[oklch(0.62_0.22_25/0.35)]" }
        : { label: "Secure & Ready", cls: "bg-[oklch(0.72_0.15_150/0.14)] text-secure border-[oklch(0.72_0.15_150/0.35)]" };

  const onFix = useCallback((f: LintFinding) => {
    if (f.autoFix) setWorkflow((prev) => f.autoFix!(prev));
  }, []);

  const openImport = () => {
    setImportText("");
    setImportError(null);
    setImporting(true);
  };

  const doImportYaml = (yamlText: string) => {
    try {
      const w = parseYaml(yamlText);
      if (!w.jobs.length && !w.on.length) {
        setImportText(yamlText);
        setImportError("No jobs or triggers found in this YAML.");
        setImporting(true);
        return;
      }
      setWorkflow(w);
      setPositions({});
      setSelection(null);
      setImporting(false);
      setImportText("");
      setImportError(null);
    } catch (e) {
      setImportText(yamlText);
      setImportError(e instanceof Error ? e.message : "Failed to parse YAML.");
      setImporting(true);
    }
  };

  const copyYaml = () => navigator.clipboard?.writeText(yaml);
  const downloadYaml = () => {
    const blob = new Blob([yaml], { type: "text/yaml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${workflow.name || "workflow"}.yml`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const newWorkflow = () => {
    setWorkflow(emptyWorkflow());
    setPositions({});
    setSelection(null);
  };
  const loadTemplate = (id: string) => {
    const t = TEMPLATES.find((x) => x.id === id);
    if (t) {
      setWorkflow(t.build());
      setPositions({});
      setSelection(null);
    }
  };

  const handlers: CanvasHandlers = {
    onNodeDragStop: (id, x, y) => setPositions((p) => ({ ...p, [id]: { x, y } })),
    onConnectNeeds: (source, target) =>
      setWorkflow((prev) => {
        if (source === "trigger-0" || source === target) return prev;
        const tj = prev.jobs.find((j) => j.id === target);
        if (!tj || tj.needs.includes(source)) return prev;
        return setJobNeedsClone(prev, target, [...tj.needs, source]);
      }),
    onDropItem: (payload, x, y) =>
      setWorkflow((prev) => {
        const t = payload.type as string;
        if (t === "trigger") {
          const event = (payload.event as string) || "push";
          return setTrigger(prev, { event: event as never, branches: ["main"] });
        }
        if (t === "job") {
          const id = uniqueJobId(prev, (payload.id as string) || "job");
          setPositions((p) => ({ ...p, [id]: { x, y } }));
          return addJobClone(prev, { id, runsOn: "ubuntu-latest" });
        }
        if (t === "action") {
          const id = `job-${Date.now().toString(36)}`;
          const action: ActionRef = { repo: payload.repo as string, ref: payload.ref as string, isSha: false };
          setPositions((p) => ({ ...p, [id]: { x, y } }));
          const w = addJobClone(prev, { id, runsOn: "ubuntu-latest" });
          return addStepActionClone(w, id, action);
        }
        return prev;
      }),
    onNodeClick: (id, type) => {
      if (type === "job") setSelection({ type: "job", jobId: id });
    },
    onStepClick: (jobId, stepId) => setSelection({ type: "step", jobId, stepId }),
    onDeleteStep: (jobId, stepId) => setWorkflow((prev) => removeStepClone(prev, jobId, stepId)),
    onDropAction: (jobId, repo, ref) =>
      setWorkflow((prev) => addStepActionClone(prev, jobId, { repo, ref, isSha: false })),
    onImportYaml: (yamlText) => doImportYaml(yamlText),
  };
  const addItem = (payload: Record<string, unknown>) =>
    handlers.onDropItem(payload, 360, 90);
  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center gap-3.5 px-4 h-12 bg-surface border-b border-border">
        <span className="font-mono text-base font-medium tracking-tight">
          masar<span className="text-accent">·</span>ci
        </span>
        <input
          value={workflow.name}
          onChange={(e) => setWorkflow((p) => ({ ...p, name: e.target.value }))}
          aria-label="workflow file name"
          className="bg-transparent border border-border text-ink font-mono text-[12.5px] px-2.5 py-1.5 rounded-md w-[248px] focus:outline-1 focus:outline-accent"
        />
        <span className="flex-1" />
        <span className={cn("inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold tracking-[0.04em] px-2.5 py-1 rounded-full border", state.cls)}>
          <span className="w-[7px] h-[7px] rounded-full bg-current" />
          {state.label}
        </span>
        <button onClick={copyYaml} className="text-[12.5px] font-medium px-3 py-1.5 rounded-md border border-border-strong bg-surface-2 text-ink cursor-pointer">
          Copy
        </button>
        <button onClick={openImport} className="text-[12.5px] font-medium px-3 py-1.5 rounded-md border border-border-strong bg-surface-2 text-ink cursor-pointer">
          Import
        </button>
        <button onClick={downloadYaml} className="text-[12.5px] font-medium px-3 py-1.5 rounded-md bg-accent text-[oklch(0.16_0.02_52)] border border-transparent cursor-pointer">
          Download .yml
        </button>
        <button onClick={newWorkflow} className="text-[12.5px] font-medium px-3 py-1.5 rounded-md border border-border-strong bg-surface-2 text-ink cursor-pointer">
          New
        </button>
      </header>

      <div className="grid grid-cols-[232px_1fr_430px] flex-1 min-h-0 relative">
        <Tray onTemplate={loadTemplate} onAddItem={addItem} />
        <Canvas model={workflow} positions={positions} findings={findings} handlers={handlers} />
        <YamlLintPanel yaml={yaml} findings={findings} onFix={onFix} onCopy={copyYaml} />
        {selection && (
          <StepEditor
            selection={selection}
            model={workflow}
            onChange={setWorkflow}
            onClose={() => setSelection(null)}
          />
        )}
      </div>
      <ImportModal
        open={importing}
        text={importText}
        error={importError}
        onTextChange={(t) => {
          setImportText(t);
          setImportError(null);
        }}
        onImport={doImportYaml}
        onClose={() => setImporting(false)}
      />
    </div>
  );
}
