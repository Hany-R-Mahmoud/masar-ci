"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ActionRef, Workflow } from "@/lib/model/types";
import { createSampleWorkflow } from "@/lib/sample";
import { TEMPLATES } from "@/lib/templates";
import { generateYaml } from "@/lib/generate/yaml";
import { parseYaml } from "@/lib/generate/parse";
import { lint, type LintFinding } from "@/lib/lint/lint";
import { setTrigger, addJobClone, addStepActionClone, removeStepClone, setJobNeedsClone, emptyWorkflow } from "@/lib/model/ops";
import { analyzeWorkspaceSource } from "@/lib/domains/workspace-adapters";
import type { FixPreview } from "@/lib/workbench/contracts";
import { stableDigest } from "@/lib/workbench/digest";
import { Tray } from "@/components/Tray";
import { Canvas, type CanvasHandlers } from "@/components/Canvas";
import { YamlLintPanel, findingKey } from "@/components/YamlLintPanel";
import { CanvasErrorBoundary } from "@/components/CanvasErrorBoundary";
import { StepEditor, type Selection } from "@/components/StepEditor";
import { ImportModal } from "@/components/ImportModal";
import { createWorkspace, isWorkspaceState, makeWorkflowId, touchRecent, type WorkspaceState } from "@/lib/workspace";
import { WorkflowTabs, type WorkflowTabView } from "@/components/WorkflowTabs";
import { PwaInstallAction } from "@/components/pwa/PwaInstallAction";
import { WorkbenchShell } from "@/components/workbench/WorkbenchShell";
import { WorkspaceHeader, WorkspaceHeaderButton, type WorkspaceHeaderStatusTone } from "@/components/workbench/WorkspaceHeader";

const STORAGE_KEY = "masarci:workflow:v1";
const WORKSPACE_STORAGE_KEY = "masarci:workspace:v1";
type NodePositions = Record<string, { x: number; y: number }>;

function uniqueJobId(workflow: Workflow, base: string): string {
  const ids = new Set(workflow.jobs.map((job) => job.id));
  if (!ids.has(base)) return base;
  let suffix = 2;
  while (ids.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

function formatLintStatus(findings: readonly LintFinding[]): string {
  const critical = findings.filter((finding) => finding.severity === "critical").length;
  const warning = findings.filter((finding) => finding.severity === "warning").length;
  const parts = [critical ? `${critical} critical` : "", warning ? `${warning} warning${warning === 1 ? "" : "s"}` : ""].filter(Boolean);
  return `${parts.join(" · ")} · ${findings.length} total`;
}

export default function Page() {
  const [workspace, setWorkspace] = useState<WorkspaceState>(() => createWorkspace(createSampleWorkflow(), "node-test-and-docker"));
  const [hydrated, setHydrated] = useState(false);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [mobilePanel, setMobilePanel] = useState<"resources" | "yaml" | null>(null);
  const [importing, setImporting] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [fixMessage, setFixMessage] = useState<string | null>(null);
  const lastValidWorkflow = useRef<Workflow>(createSampleWorkflow());
  const layoutUndo = useRef<Record<string, NodePositions | undefined>>({});

  const activeTab = workspace.workflows[workspace.activeId] ?? Object.values(workspace.workflows)[0];
  const workflow = activeTab?.workflow ?? emptyWorkflow();
  const positions = activeTab?.positions ?? {};
  const yaml = activeTab?.source ?? generateYaml(workflow);
  const findings = useMemo(() => lint(workflow), [workflow]);
  const sharedAnalysis = useMemo(() => analyzeWorkspaceSource("actions", yaml), [yaml]);
  const fixProposals = useMemo<Readonly<Record<string, FixPreview>>>(() => {
    if (!sharedAnalysis.ok) return {};
    return Object.fromEntries(sharedAnalysis.value.findings.flatMap((finding) => (
      finding.fixProposal ? [[`${finding.ruleId}:${finding.evidence?.artifact ?? ""}:${finding.evidence?.path ?? ""}`, finding.fixProposal] as const] : []
    )));
  }, [sharedAnalysis]);

  const setWorkflow = useCallback((next: Workflow | ((previous: Workflow) => Workflow)) => {
    setWorkspace((previous) => {
      const current = previous.workflows[previous.activeId];
      if (!current) return previous;
      const nextWorkflow = typeof next === "function" ? next(current.workflow) : next;
      return { ...previous, workflows: { ...previous.workflows, [previous.activeId]: { ...current, workflow: nextWorkflow, source: generateYaml(nextWorkflow) } } };
    });
  }, []);

  const setPositions = useCallback((next: Record<string, { x: number; y: number }> | ((previous: Record<string, { x: number; y: number }>) => Record<string, { x: number; y: number }>)) => {
    setWorkspace((previous) => {
      const current = previous.workflows[previous.activeId];
      if (!current) return previous;
      const nextPositions = typeof next === "function" ? next(current.positions) : next;
      return { ...previous, workflows: { ...previous.workflows, [previous.activeId]: { ...current, positions: nextPositions } } };
    });
  }, []);

  const moveNode = useCallback((id: string, x: number, y: number) => {
    setWorkspace((previous) => {
      const current = previous.workflows[previous.activeId];
      if (!current) return previous;
      if (current.positions[id]?.x === x && current.positions[id]?.y === y) return previous;
      layoutUndo.current[previous.activeId] = { ...current.positions };
      return { ...previous, workflows: { ...previous.workflows, [previous.activeId]: { ...current, positions: { ...current.positions, [id]: { x, y } } } } };
    });
  }, []);

  const undoMove = useCallback(() => {
    const id = workspace.activeId;
    const previousPositions = layoutUndo.current[id];
    if (!previousPositions) return;
    setWorkspace((previous) => {
      const current = previous.workflows[id];
      if (!current) return previous;
      return { ...previous, workflows: { ...previous.workflows, [id]: { ...current, positions: previousPositions } } };
    });
    delete layoutUndo.current[id];
  }, [workspace.activeId]);

  const canUndoMove = layoutUndo.current[workspace.activeId] !== undefined;

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
      /* Ignore invalid local storage and keep the sample workflow. */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(workspace));
  }, [hydrated, workspace]);

  const openWorkflow = useCallback((nextWorkflow: Workflow, source = generateYaml(nextWorkflow)) => {
    const id = makeWorkflowId(nextWorkflow.name);
    setWorkspace((previous) => ({
      ...previous,
      activeId: id,
      openIds: [...previous.openIds, id],
      workflows: { ...previous.workflows, [id]: { id, workflow: nextWorkflow, positions: {}, source, savedYaml: source } },
      recentIds: touchRecent(previous.recentIds, id),
    }));
    setSelection(null);
    setFixMessage(null);
  }, []);

  const newWorkflow = useCallback(() => openWorkflow(emptyWorkflow()), [openWorkflow]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return;
      if (event.key === "Tab") {
        event.preventDefault();
        const index = workspace.openIds.indexOf(workspace.activeId);
        const nextIndex = event.shiftKey ? (index - 1 + workspace.openIds.length) % workspace.openIds.length : (index + 1) % workspace.openIds.length;
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
  }, [newWorkflow, workspace.activeId, workspace.openIds]);

  const onFix = useCallback((finding: LintFinding) => {
    const proposal = fixProposals[findingKey(finding)];
    if (!proposal || proposal.status !== "available" || !proposal.before || !proposal.after || proposal.before !== yaml || proposal.digest !== stableDigest(yaml)) {
      setFixMessage("Fix unavailable: the source changed or requires manual review.");
      return;
    }
    try {
      const fixedWorkflow = parseYaml(proposal.after);
      lastValidWorkflow.current = workflow;
      setWorkspace((previous) => {
        const current = previous.workflows[previous.activeId];
        if (!current) return previous;
        return { ...previous, workflows: { ...previous.workflows, [previous.activeId]: { ...current, workflow: fixedWorkflow, source: proposal.after } } };
      });
      setSelection(null);
      setFixMessage("Fix applied · workflow re-analyzed");
    } catch {
      setFixMessage("Fix blocked: the proposed YAML did not parse.");
    }
  }, [fixProposals, workflow, yaml]);

  const openImport = () => {
    setImportText("");
    setImportError(null);
    setImporting(true);
  };

  const doImportYaml = (yamlText: string) => {
    try {
      const imported = parseYaml(yamlText);
      if (!imported.jobs.length && !imported.on.length) {
        setImportText(yamlText);
        setImportError("No jobs or triggers found in this YAML.");
        setImporting(true);
        return;
      }
      lastValidWorkflow.current = workflow;
      openWorkflow(imported, yamlText);
      setImporting(false);
      setImportText("");
      setImportError(null);
    } catch (error) {
      setImportText(yamlText);
      setImportError(error instanceof Error ? error.message : "Failed to parse YAML.");
      setImporting(true);
    }
  };

  const copyYaml = () => navigator.clipboard?.writeText(yaml);
  const downloadYaml = () => {
    const blob = new Blob([yaml], { type: "text/yaml" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${workflow.name || "workflow"}.yml`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const activateWorkflow = useCallback((id: string) => {
    setWorkspace((previous) => previous.workflows[id] ? { ...previous, activeId: id, openIds: previous.openIds.includes(id) ? previous.openIds : [...previous.openIds, id], recentIds: touchRecent(previous.recentIds, id) } : previous);
    setSelection(null);
  }, []);

  const closeWorkflow = useCallback((id: string) => {
    const tab = workspace.workflows[id];
    if (!tab) return;
    const dirty = (tab.source ?? generateYaml(tab.workflow)) !== tab.savedYaml;
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
    const template = TEMPLATES.find((item) => item.id === id);
    if (template) openWorkflow(template.build());
  };

  const handlers: CanvasHandlers = {
    onNodeDragStop: (id, x, y) => moveNode(id, x, y),
    onConnectNeeds: (source, target) => setWorkflow((previous) => {
      if (source.startsWith("trigger-") || source === target) return previous;
      const targetJob = previous.jobs.find((job) => job.id === target);
      if (!targetJob || targetJob.needs.includes(source)) return previous;
      return setJobNeedsClone(previous, target, [...targetJob.needs, source]);
    }),
    onDropItem: (payload, x, y) => setWorkflow((previous) => {
      const type = payload.type as string;
      if (type === "trigger") return setTrigger(previous, { event: (payload.event as string) || "push", branches: ["main"] } as never);
      if (type === "job") {
        const id = uniqueJobId(previous, (payload.id as string) || "job");
        setPositions((positionsValue) => ({ ...positionsValue, [id]: { x, y } }));
        return addJobClone(previous, { id, runsOn: "ubuntu-latest" });
      }
      if (type === "action") {
        const id = `job-${Date.now().toString(36)}`;
        const action: ActionRef = { repo: payload.repo as string, ref: payload.ref as string, isSha: false };
        setPositions((positionsValue) => ({ ...positionsValue, [id]: { x, y } }));
        return addStepActionClone(addJobClone(previous, { id, runsOn: "ubuntu-latest" }), id, action);
      }
      return previous;
    }),
    onNodeClick: (id, type) => {
      if (type === "job") setSelection({ type: "job", jobId: id });
      if (type === "trigger") setSelection({ type: "trigger", jobId: id, triggerIndex: Number(id.replace("trigger-", "")) });
    },
    onStepClick: (jobId, stepId) => setSelection({ type: "step", jobId, stepId }),
    onDeleteStep: (jobId, stepId) => setWorkflow((previous) => removeStepClone(previous, jobId, stepId)),
    onDropAction: (jobId, repo, ref) => setWorkflow((previous) => addStepActionClone(previous, jobId, { repo, ref, isSha: false })),
    onImportYaml: doImportYaml,
  };
  const addItem = (payload: Record<string, unknown>) => handlers.onDropItem(payload, 360, 90);
  const tabView = (tab: NonNullable<typeof activeTab>): WorkflowTabView => ({ id: tab.id, name: tab.workflow.name, dirty: (tab.source ?? generateYaml(tab.workflow)) !== tab.savedYaml });
  const openTabs = workspace.openIds.map((id) => workspace.workflows[id]).filter((tab): tab is NonNullable<typeof activeTab> => !!tab).map(tabView);
  const recentTabs = workspace.recentIds.map((id) => workspace.workflows[id]).filter((tab): tab is NonNullable<typeof activeTab> => !!tab).map(tabView);
  const state = !workflow.jobs.length && !workflow.on.length ? { label: "Empty Workflow", tone: "neutral" as WorkspaceHeaderStatusTone } : findings.length > 0 ? { label: formatLintStatus(findings), tone: "warning" as WorkspaceHeaderStatusTone } : { label: fixMessage ?? "Secure & Ready", tone: "success" as WorkspaceHeaderStatusTone };

  return <div className="flex h-full min-h-0 flex-col">
    <WorkspaceHeader domain="actions" artifactName={workflow.name} title="Actions workbench" titleId="actions-workspace-title" description="Author, inspect, and export GitHub Actions workflows." onArtifactNameChange={(name) => setWorkflow((previous) => ({ ...previous, name }))} status={state.label} statusTone={state.tone} actions={<><WorkspaceHeaderButton onClick={copyYaml}>Copy</WorkspaceHeaderButton><WorkspaceHeaderButton onClick={openImport}>Import</WorkspaceHeaderButton><WorkspaceHeaderButton variant="primary" onClick={downloadYaml}>Download .yml</WorkspaceHeaderButton><WorkspaceHeaderButton onClick={newWorkflow}>New</WorkspaceHeaderButton><PwaInstallAction compact /></>} />
    <WorkflowTabs tabs={openTabs} activeId={workspace.activeId} onSelect={activateWorkflow} onClose={closeWorkflow} onNew={newWorkflow} />
    <nav className="mobile-workspace-tools" aria-label="Mobile workspace navigation"><button type="button" aria-pressed={mobilePanel === null} onClick={() => setMobilePanel(null)}><span aria-hidden="true">⌂</span>Canvas</button><button type="button" aria-pressed={mobilePanel === "yaml"} onClick={() => setMobilePanel(mobilePanel === "yaml" ? null : "yaml")}><span aria-hidden="true">≡</span>YAML</button><button type="button" aria-pressed={mobilePanel === "resources"} onClick={() => setMobilePanel(mobilePanel === "resources" ? null : "resources")}><span aria-hidden="true">◇</span>Resources</button><PwaInstallAction compact /></nav>
    <WorkbenchShell id="workflow-workspace-panel" labelledBy={`workflow-tab-${workspace.activeId}`} tools={<Tray onTemplate={loadTemplate} onAddItem={addItem} recent={recentTabs} onRecent={activateWorkflow} activeId={workspace.activeId} />} canvas={<CanvasErrorBoundary key={workspace.activeId} onRestore={() => setWorkflow(lastValidWorkflow.current)}><Canvas model={workflow} positions={positions} findings={findings} handlers={handlers} canUndoMove={canUndoMove} onUndoMove={undoMove} /></CanvasErrorBoundary>} inspector={<YamlLintPanel yaml={yaml} findings={findings} fixProposals={fixProposals} onApplyFix={onFix} onCopy={copyYaml} />}>
      {selection ? <StepEditor selection={selection} model={workflow} onChange={setWorkflow} onClose={() => setSelection(null)} /> : null}
      {mobilePanel ? <aside className="mobile-workspace-drawer" aria-label={mobilePanel === "resources" ? "Workflow resources" : "YAML and security"}><div className="mobile-workspace-drawer__header"><span>{mobilePanel === "resources" ? "Resources" : "YAML & security"}</span><button type="button" onClick={() => setMobilePanel(null)} aria-label="Close mobile panel">×</button></div><div className="mobile-workspace-drawer__content">{mobilePanel === "resources" ? <Tray onTemplate={loadTemplate} onAddItem={addItem} recent={recentTabs} onRecent={activateWorkflow} activeId={workspace.activeId} /> : <YamlLintPanel yaml={yaml} findings={findings} fixProposals={fixProposals} onApplyFix={onFix} onCopy={copyYaml} />}</div></aside> : null}
    </WorkbenchShell>
    <ImportModal open={importing} text={importText} error={importError} onTextChange={(text) => { setImportText(text); setImportError(null); }} onImport={doImportYaml} onClose={() => setImporting(false)} />
  </div>;
}
