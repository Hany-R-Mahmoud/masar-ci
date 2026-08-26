"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { analyzeWorkspaceSource, restoreTerraformReview, type WorkspaceAnalysis } from "@/lib/domains/workspace-adapters";
import { workspaceBlank, workspacePreset } from "@/lib/domains/workspace-presets";
import { applyDomainTool, type ReviewLens } from "@/lib/domains/domain-tools";
import type { WorkbenchDomain } from "@/lib/workbench/contracts";
import { createSourceCommand, type SourceCommand, type SourceCommandReason } from "@/lib/workbench/commands";
import { stableDigest } from "@/lib/workbench/digest";
import { DOMAIN_ARTIFACT_LIMITS } from "@/lib/workbench/limits";
import { latestArtifactForDomain, loadWorkbenchState, migrateLegacyActionsStorage, saveWorkbenchState } from "@/lib/workbench/persistence";
import type { AnalyzeWorkerResponse } from "@/lib/workbench/worker-contracts";
import { DomainCanvas, type DomainNodePositions } from "./DomainCanvas";
import { DomainInspector } from "./DomainInspector";
import { DomainToolTray } from "./DomainToolTray";
import { WorkbenchShell } from "./WorkbenchShell";
import { WorkspaceHeader, WorkspaceHeaderButton, type WorkspaceHeaderStatusTone } from "./WorkspaceHeader";

interface DomainWorkspaceProps {
  readonly domain: WorkbenchDomain;
  readonly title: string;
  readonly description: string;
  readonly artifactName: string;
}

function initialAnalysis(domain: WorkbenchDomain): WorkspaceAnalysis | undefined {
  const result = analyzeWorkspaceSource(domain, workspacePreset(domain));
  return result.ok ? result.value : undefined;
}

export default function DomainWorkspace({ domain, title, description, artifactName }: DomainWorkspaceProps) {
  const [source, setSource] = useState(() => workspacePreset(domain));
  const [analysis, setAnalysis] = useState<WorkspaceAnalysis | undefined>(() => initialAnalysis(domain));
  const [message, setMessage] = useState("Example loaded · not yet saved");
  const [locked, setLocked] = useState(domain === "terraform");
  const [importPhase, setImportPhase] = useState<"reading" | "analyzing">();
  const [undoStack, setUndoStack] = useState<readonly SourceCommand[]>([]);
  const [persistenceRevision, setPersistenceRevision] = useState(0);
  const [lens, setLens] = useState<ReviewLens>("all");
  const [positions, setPositions] = useState<DomainNodePositions>({});
  const [mobilePanel, setMobilePanel] = useState<"tools" | "source">();
  const fileRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const criticalSecrets = analysis?.findings.some((finding) => finding.ruleId === "SECRET_LITERAL" && finding.severity === "critical") ?? false;
  const domainLabel = domain === "dockerfile" ? "Dockerfile" : domain === "compose" ? "Compose" : title;
  const headerDomain = domain === "compose" || domain === "dockerfile" ? "containers" : domain;
  const statusTone: WorkspaceHeaderStatusTone = importPhase
    ? "progress"
    : criticalSecrets || /blocked|cancelled|could not|exceed|failed|invalid|retained/i.test(message)
      ? "warning"
      : analysis
        ? "success"
        : "neutral";

  useEffect(() => {
    migrateLegacyActionsStorage();
    const loaded = loadWorkbenchState();
    if (!loaded.ok) {
      setMessage(loaded.error);
      return;
    }
    const stored = latestArtifactForDomain(loaded.value, domain);
    if (!stored) return;
    if (stored.mode === "source") {
      const restored = analyzeWorkspaceSource(domain, stored.source);
      if (!restored.ok) {
        setMessage(`Stored artifact retained but could not be restored: ${restored.error.message}`);
        return;
      }
      setSource(stored.source);
      setAnalysis(restored.value);
      setLocked(false);
      setMessage(`Restored ${stored.name} · saved ${new Date(stored.updatedAt).toLocaleString()}`);
      return;
    }
    const restored = restoreTerraformReview(stored.summary, stored.digest);
    if (!restored.ok) {
      setMessage(`Stored review retained but could not be restored: ${restored.error.message}`);
      return;
    }
    setSource(stored.summary);
    setAnalysis(restored.value);
    setLocked(true);
    setMessage(`Restored immutable review · saved ${new Date(stored.updatedAt).toLocaleString()}`);
  }, [domain]);

  useEffect(() => () => {
    workerRef.current?.terminate();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  function commitAnalysis(nextSource: string, nextAnalysis: WorkspaceAnalysis) {
    setSource(nextSource);
    setAnalysis(nextAnalysis);
    setLocked(domain === "terraform");
    if (nextAnalysis.findings.some((finding) => finding.ruleId === "SECRET_LITERAL" && finding.severity === "critical")) {
      setMessage("Analyzed · local save blocked until literal secrets are removed");
      return;
    }
    const loaded = loadWorkbenchState();
    if (!loaded.ok) {
      setMessage(`Analyzed · local save unavailable: ${loaded.error}`);
      return;
    }
    const artifacts = loaded.value.artifacts.filter((artifact) => artifact.id !== `${domain}-primary`);
    const updatedAt = new Date().toISOString();
    const artifactDigest = domain === "terraform" ? stableDigest(nextAnalysis.exportValue) : stableDigest(nextSource);
    const artifact = domain === "terraform"
      ? { id: `${domain}-primary`, domain, mode: "review" as const, name: artifactName, digest: artifactDigest, summary: nextAnalysis.exportValue, updatedAt }
      : { id: `${domain}-primary`, domain, mode: "source" as const, name: artifactName, source: nextSource, digest: artifactDigest, updatedAt };
    const saved = saveWorkbenchState({ schemaVersion: 1, artifacts: [...artifacts, artifact] });
    if (saved.ok) setPersistenceRevision((revision) => revision + 1);
    setMessage(saved.ok ? "Saved locally" : saved.error);
  }

  function syncDraft(nextSource: string) {
    setSource(nextSource);
    const result = analyzeWorkspaceSource(domain, nextSource);
    if (!result.ok) {
      setAnalysis(undefined);
      setPositions({});
      setLocked(domain === "terraform");
      setMessage(`Source invalid · ${result.error.message}`);
      return;
    }
    setAnalysis(result.value);
    setMessage("Canvas synchronized · unsaved changes");
  }

  function analyze() {
    const result = analyzeWorkspaceSource(domain, source);
    if (!result.ok) {
      setAnalysis(undefined);
      setPositions({});
      setLocked(domain === "terraform");
      setMessage(`Source invalid · ${result.error.message}`);
      return;
    }
    commitAnalysis(source, result.value);
  }

  function stopImport(messageText?: string) {
    workerRef.current?.terminate();
    workerRef.current = null;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    setImportPhase(undefined);
    if (messageText) setMessage(messageText);
  }

  function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > DOMAIN_ARTIFACT_LIMITS[domain].maxBytes) {
      setMessage(`Import blocked: ${file.size} bytes exceeds ${DOMAIN_ARTIFACT_LIMITS[domain].maxBytes}-byte limit.`);
      event.target.value = "";
      return;
    }
    stopImport();
    const worker = new Worker(new URL("../../workers/analyze-workspace.worker.ts", import.meta.url), { type: "module" });
    workerRef.current = worker;
    setImportPhase("reading");
    setMessage(`Reading ${file.name} in isolated worker…`);
    worker.onmessage = (workerEvent: MessageEvent<AnalyzeWorkerResponse>) => {
      const response = workerEvent.data;
      if (response.type === "progress") {
        setImportPhase(response.phase);
        setMessage(response.phase === "reading" ? `Reading ${file.name}…` : `Analyzing ${file.name}…`);
        return;
      }
      if (response.type === "error") {
        stopImport(response.message);
        return;
      }
      commitAnalysis(response.source, response.analysis);
      setPositions({});
      stopImport();
    };
    worker.onerror = () => stopImport("Worker analysis failed; previous workspace remains open.");
    timeoutRef.current = setTimeout(() => stopImport("Analysis exceeded 10-second budget and was cancelled."), 10_000);
    worker.postMessage({ domain, file });
    event.target.value = "";
  }

  function applySourceChange(nextSource: string, reason: SourceCommandReason) {
    if (domain === "terraform") return;
    const command = createSourceCommand({ domain, reason, before: source, after: nextSource });
    const result = command.apply();
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setUndoStack((current) => [...current.slice(-49), command]);
    syncDraft(result.value);
  }

  function addTool(toolId: string) {
    const result = applyDomainTool(domain, source, toolId);
    if (!result.ok) {
      setMessage(result.error.message);
      return;
    }
    applySourceChange(result.value, "edit");
  }

  function undoLastChange() {
    const command = undoStack.at(-1);
    if (!command) return;
    const result = command.invert().apply();
    if (!result.ok) return;
    setUndoStack((current) => current.slice(0, -1));
    syncDraft(result.value);
  }

  function downloadReview() {
    if (!analysis || criticalSecrets) {
      setMessage("Export blocked: resolve critical secret findings first.");
      return;
    }
    const blob = new Blob([analysis.exportValue], { type: domain === "terraform" ? "application/json" : "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = domain === "terraform" ? "masarci-terraform-review.json" : artifactName;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("Exported locally · no network request");
  }

  const tools = <DomainToolTray domain={domain} activeLens={lens} onAddTool={addTool} onSelectLens={setLens} />;
  const inspector = <DomainInspector domain={domain} domainLabel={domainLabel} source={source} analysis={analysis} locked={locked} refreshKey={`${domain}:${analysis ? stableDigest(source) : "empty"}:${persistenceRevision}`} onSourceChange={(nextSource) => applySourceChange(nextSource, "edit")} />;

  return (
    <section className="domain-workspace" data-domain={domain} aria-labelledby="workspace-title">
      <WorkspaceHeader
        domain={headerDomain}
        artifactName={artifactName}
        status={message}
        statusTone={statusTone}
        statusTitle={analysis ? stableDigest(source) : "No valid artifact"}
        title={title}
        titleId="workspace-title"
        description={description}
        actions={<>
          <input ref={fileRef} className="sr-only" type="file" accept={domain === "terraform" ? ".json,application/json" : ".yaml,.yml,.txt"} onChange={importFile} />
          {domain !== "terraform" ? <><WorkspaceHeaderButton onClick={() => applySourceChange(workspaceBlank(domain), "blank")}>New</WorkspaceHeaderButton><WorkspaceHeaderButton onClick={() => applySourceChange(workspacePreset(domain), "template")}>Template</WorkspaceHeaderButton><WorkspaceHeaderButton onClick={undoLastChange} disabled={undoStack.length === 0}>Undo</WorkspaceHeaderButton></> : null}
          <WorkspaceHeaderButton onClick={() => fileRef.current?.click()} disabled={importPhase !== undefined}>Import</WorkspaceHeaderButton>
          {importPhase ? <WorkspaceHeaderButton onClick={() => stopImport("Import cancelled; previous workspace remains open.")}>Cancel</WorkspaceHeaderButton> : null}
          <WorkspaceHeaderButton onClick={downloadReview} disabled={!analysis || criticalSecrets}>Export</WorkspaceHeaderButton>
          <WorkspaceHeaderButton variant="primary" onClick={analyze} disabled={importPhase !== undefined}>{domain === "terraform" ? "Review plan" : "Analyze & save"}</WorkspaceHeaderButton>
        </>}
      />
      <nav className="mobile-workspace-tools" aria-label="Mobile workspace navigation">
        <button type="button" aria-pressed={mobilePanel === undefined} onClick={() => setMobilePanel(undefined)}>Canvas</button>
        <button type="button" aria-pressed={mobilePanel === "source"} onClick={() => setMobilePanel("source")}>Source</button>
        <button type="button" aria-pressed={mobilePanel === "tools"} onClick={() => setMobilePanel("tools")}>Tools</button>
      </nav>
      <WorkbenchShell
        tools={tools}
        canvas={<DomainCanvas analysis={analysis} lens={lens} positions={positions} onAddTool={addTool} onMoveNode={(nodeId, x, y) => setPositions((current) => ({ ...current, [nodeId]: { x, y } }))} />}
        inspector={inspector}
      >
        {mobilePanel ? <aside className="mobile-workspace-drawer" aria-label={mobilePanel === "tools" ? "Workspace tools" : "Source and findings"}>
          <div className="mobile-workspace-drawer__header"><span>{mobilePanel === "tools" ? "Tools" : "Source & findings"}</span><button type="button" onClick={() => setMobilePanel(undefined)}>Close</button></div>
          <div className="mobile-workspace-drawer__content">{mobilePanel === "tools" ? tools : <DomainInspector domain={domain} domainLabel={domainLabel} source={source} analysis={analysis} locked={locked} idSuffix="-mobile" refreshKey={`${domain}:mobile:${persistenceRevision}`} onSourceChange={(nextSource) => applySourceChange(nextSource, "edit")} />}</div>
        </aside> : null}
      </WorkbenchShell>
    </section>
  );
}
