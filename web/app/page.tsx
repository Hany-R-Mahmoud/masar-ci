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
import { CanvasErrorBoundary } from "@/components/CanvasErrorBoundary";
import { StepEditor, type Selection } from "@/components/StepEditor";
import { ImportModal } from "@/components/ImportModal";
import { cn } from "@/lib/cn";
import { createWorkspace, isWorkspaceState, makeWorkflowId, touchRecent, type WorkspaceState } from "@/lib/workspace";
import { WorkflowTabs, type WorkflowTabView } from "@/components/WorkflowTabs";

const STORAGE_KEY = "masarci:workflow:v1";
const WORKSPACE_STORAGE_KEY = "masarci:workspace:v1";
type NodePositions = Record<string, { x: number; y: number }>;

function uniqueJobId(w: Workflow, base: string): string {
  const ids = new Set(w.jobs.map((j) => j.id));
  if (!ids.has(base)) return base;
  let n = 2;
  while (ids.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

export default function Page() {
  const [workspace, setWorkspace] = useState<WorkspaceState>(() => createWorkspace(createSampleWorkflow(), "node-test-and-docker"));
  const [hydrated, setHydrated] = useState(false);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [importing, setImporting] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const lastValidWorkflow = useRef<Workflow>(createSampleWorkflow());
  const layoutUndo = useRef<Record<string, NodePositions | undefined>>({});

  const activeTab = workspace.workflows[workspace.activeId] ?? Object.values(workspace.workflows)[0];
  const workflow = activeTab?.workflow ?? emptyWorkflow();
  const positions = activeTab?.positions ?? {};

  const setWorkflow = useCallback((next: Workflow | ((prev: Workflow) => Workflow)) => {
    setWorkspace((previous) => {
      const current = previous.workflows[previous.activeId];
      if (!current) return previous;
      const nextWorkflow = typeof next === "function" ? next(current.workflow) : next;
      return {
        ...previous,
        workflows: {
          ...previous.workflows,
          [previous.activeId]: { ...current, workflow: nextWorkflow },
        },
      };
    });
  }, []);

  const setPositions = useCallback((next: Record<string, { x: number; y: number }> | ((prev: Record<string, { x: number; y: number }>) => Record<string, { x: number; y: number }>)) => {
    setWorkspace((previous) => {
      const current = previous.workflows[previous.activeId];
      if (!current) return previous;
      const nextPositions = typeof next === "function" ? next(current.positions) : next;
      return {
        ...previous,
        workflows: {
          ...previous.workflows,
          [previous.activeId]: { ...current, positions: nextPositions },
        },
      };
    });
  }, []);

  const moveNode = useCallback((id: string, x: number, y: number) => {
    setWorkspace((previous) => {
      const current = previous.workflows[previous.activeId];
      if (!current) return previous;
      const nextPositions = { ...current.positions, [id]: { x, y } };
      if (current.positions[id]?.x === x && current.positions[id]?.y === y) return previous;
      layoutUndo.current[previous.activeId] = { ...current.positions };
      return {
        ...previous,
        workflows: {
          ...previous.workflows,
          [previous.activeId]: { ...current, positions: nextPositions },
        },
      };
    });
  }, []);

  const undoMove = useCallback(() => {
    const id = workspace.activeId;
    const previousPositions = layoutUndo.current[id];
    if (!previousPositions) return;
    setWorkspace((previous) => {
      const current = previous.workflows[id];
      if (!current) return previous;
      return {
        ...previous,
        workflows: {
          ...previous.workflows,
          [id]: { ...current, positions: previousPositions },
        },
      };
    });
    delete layoutUndo.current[id];
  }, [workspace.activeId]);

  const canUndoMove = layoutUndo.current[workspace.activeId] !== undefined;

  const yaml = useMemo(() => generateYaml(workflow), [workflow]);
  const findings = useMemo(() => lint(workflow), [workflow]);

  useEffect(() => {
    const rawWorkspace = window.localStorage.getItem(WORKSPACE_STORAGE_KEY);
    const rawLegacy = window.localStorage.getItem(STORAGE_KEY);
    try {
      if (rawWorkspace) {
        const parsed = JSON.parse(rawWorkspace) as WorkspaceState;
        if (isWorkspaceState(parsed) && parsed.workflows[parsed.activeId]) setWorkspace(parsed);
      } else if (rawLegacy) {
        const legacy = JSON.parse(rawLegacy) as Workflow;
        if (legacy && Array.isArray(legacy.jobs) && Array.isArray(legacy.on)) setWorkspace(createWorkspace(legacy, makeWorkflowId(legacy.name)));
      }
    } catch {
      /* ignore bad storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(workspace));
  }, [hydrated, workspace]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return;
      if (event.key === "Tab") {
        event.preventDefault();
        const index = workspace.openIds.indexOf(workspace.activeId);
        const nextIndex = event.shiftKey
          ? (index - 1 + workspace.openIds.length) % workspace.openIds.length
          : (index + 1) % workspace.openIds.length;
        const nextId = workspace.openIds[nextIndex];
        if (nextId) setWorkspace((previous) => ({ ...previous, activeId: nextId, recentIds: touchRecent(previous.recentIds, nextId) }));
      }
      if (event.key.toLowerCase() === "n") {
        event.preventDefault();
        newWorkflow();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

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
      lastValidWorkflow.current = workflow;
      openWorkflow(w);
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
  const openWorkflow = useCallback((nextWorkflow: Workflow) => {
    const id = makeWorkflowId(nextWorkflow.name);
    setWorkspace((previous) => ({
      ...previous,
      activeId: id,
      openIds: [...previous.openIds, id],
      workflows: {
        ...previous.workflows,
        [id]: { id, workflow: nextWorkflow, positions: {}, savedYaml: generateYaml(nextWorkflow) },
      },
      recentIds: touchRecent(previous.recentIds, id),
    }));
    setSelection(null);
  }, []);

  const newWorkflow = useCallback(() => openWorkflow(emptyWorkflow()), [openWorkflow]);

  const activateWorkflow = useCallback((id: string) => {
    setWorkspace((previous) => {
      if (!previous.workflows[id]) return previous;
      return {
        ...previous,
        activeId: id,
        openIds: previous.openIds.includes(id) ? previous.openIds : [...previous.openIds, id],
        recentIds: touchRecent(previous.recentIds, id),
      };
    });
    setSelection(null);
  }, []);

  const closeWorkflow = useCallback((id: string) => {
    const tab = workspace.workflows[id];
    if (!tab) return;
    const dirty = generateYaml(tab.workflow) !== tab.savedYaml;
    if (dirty && !window.confirm(`Close ${tab.workflow.name || "untitled"} with unsaved changes?`)) return;
    setWorkspace((previous) => {
      if (previous.openIds.length <= 1) return previous;
      const index = previous.openIds.indexOf(id);
      const openIds = previous.openIds.filter((item) => item !== id);
      const activeId = previous.activeId === id ? openIds[Math.max(0, index - 1)] : previous.activeId;
      return { ...previous, activeId, openIds };
    });
    delete layoutUndo.current[id];
    if (workspace.activeId === id) setSelection(null);
  }, [workspace]);
  const loadTemplate = (id: string) => {
    const t = TEMPLATES.find((x) => x.id === id);
    if (t) {
      openWorkflow(t.build());
    }
  };

  const handlers: CanvasHandlers = {
    onNodeDragStop: (id, x, y) => moveNode(id, x, y),
    onConnectNeeds: (source, target) =>
      setWorkflow((prev) => {
        if (source.startsWith("trigger-") || source === target) return prev;
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
      if (type === "trigger") setSelection({ type: "trigger", jobId: id, triggerIndex: Number(id.replace("trigger-", "")) });
    },
    onStepClick: (jobId, stepId) => setSelection({ type: "step", jobId, stepId }),
    onDeleteStep: (jobId, stepId) => setWorkflow((prev) => removeStepClone(prev, jobId, stepId)),
    onDropAction: (jobId, repo, ref) =>
      setWorkflow((prev) => addStepActionClone(prev, jobId, { repo, ref, isSha: false })),
    onImportYaml: (yamlText) => doImportYaml(yamlText),
  };
  const addItem = (payload: Record<string, unknown>) =>
    handlers.onDropItem(payload, 360, 90);
  const openTabs: WorkflowTabView[] = workspace.openIds
    .map((id) => workspace.workflows[id])
    .filter((tab): tab is NonNullable<typeof tab> => !!tab)
    .map((tab) => ({ id: tab.id, name: tab.workflow.name, dirty: generateYaml(tab.workflow) !== tab.savedYaml }));
  const recentTabs: WorkflowTabView[] = workspace.recentIds
    .map((id) => workspace.workflows[id])
    .filter((tab): tab is NonNullable<typeof tab> => !!tab)
    .map((tab) => ({ id: tab.id, name: tab.workflow.name, dirty: generateYaml(tab.workflow) !== tab.savedYaml }));
  return (
    <div className="flex h-[100dvh] min-h-0 flex-col">
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

      <WorkflowTabs tabs={openTabs} activeId={workspace.activeId} onSelect={activateWorkflow} onClose={closeWorkflow} onNew={newWorkflow} />

      <div
        id="workflow-workspace-panel"
        role="tabpanel"
        aria-labelledby={`workflow-tab-${workspace.activeId}`}
        className="workspace-grid flex-1 min-h-0 relative"
      >
        <div className="workspace-grid__tray min-w-0 min-h-0">
          <Tray onTemplate={loadTemplate} onAddItem={addItem} recent={recentTabs} onRecent={activateWorkflow} activeId={workspace.activeId} />
        </div>
        <div className="workspace-grid__canvas min-w-0 min-h-0">
          <CanvasErrorBoundary key={workspace.activeId} onRestore={() => setWorkflow(lastValidWorkflow.current)}>
            <Canvas model={workflow} positions={positions} findings={findings} handlers={handlers} canUndoMove={canUndoMove} onUndoMove={undoMove} />
          </CanvasErrorBoundary>
        </div>
        <div className="workspace-grid__inspector min-w-0 min-h-0">
          <YamlLintPanel yaml={yaml} findings={findings} workflow={workflow} onFix={onFix} onCopy={copyYaml} />
        </div>
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
