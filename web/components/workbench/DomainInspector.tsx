"use client";

import type { DecisionMetadata, WorkbenchDomain } from "@/lib/workbench/contracts"; // TOKEN_POLICY_BATCHED_EXECUTION
import type { WorkspaceAnalysis } from "@/lib/domains/workspace-adapters";
import CrossDomainContracts from "./CrossDomainContracts";

interface DomainInspectorProps {
  readonly domain: WorkbenchDomain;
  readonly domainLabel: string;
  readonly source: string;
  readonly analysis?: WorkspaceAnalysis;
  readonly locked: boolean;
  readonly refreshKey: string;
  readonly idSuffix?: string;
  readonly onSourceChange: (source: string) => void;
  readonly onDecisionChange?: (status: DecisionMetadata["status"]) => void;
}

interface TerraformReportChange { readonly address: string; readonly name: string; readonly actions: readonly string[]; readonly sensitive: boolean; }
interface TerraformReport { readonly changes: readonly TerraformReportChange[]; readonly summary: Readonly<Record<string, number>>; readonly assumptions: readonly string[]; readonly limitations: readonly string[]; readonly sourceDigest?: string; readonly decisionKey?: string; }

function readTerraformReport(analysis?: WorkspaceAnalysis): TerraformReport | undefined { // TOKEN_POLICY_BATCHED_EXECUTION
  if (!analysis || analysis.domain !== "terraform") return undefined;
  try {
    const record = JSON.parse(analysis.exportValue) as Record<string, unknown>;
    const metadata = record.summaryMetadata as Record<string, unknown> | undefined;
    const changes = Array.isArray(record.changes) ? record.changes.flatMap((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return [];
      const change = item as Record<string, unknown>;
      if (typeof change.address !== "string" || typeof change.name !== "string" || !Array.isArray(change.actions)) return [];
      return [{ address: change.address, name: change.name, actions: change.actions.filter((action): action is string => typeof action === "string"), sensitive: change.sensitive === true }];
    }) : [];
    const summary = record.summary && typeof record.summary === "object" && !Array.isArray(record.summary)
      ? Object.fromEntries(Object.entries(record.summary).filter(([, value]) => typeof value === "number")) as Readonly<Record<string, number>>
      : {};
    const readList = (value: unknown): readonly string[] => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
    return { changes, summary, assumptions: readList(metadata?.assumptions), limitations: readList(metadata?.limitations), sourceDigest: typeof record.sourceDigest === "string" ? record.sourceDigest : undefined, decisionKey: typeof metadata?.decisionKey === "string" ? metadata.decisionKey : undefined };
  } catch { return undefined; }
}

function actionTransition(actions: readonly string[]): string { return actions.includes("replace") ? "destroy → create" : actions.join(", ") || "no-op"; } // TOKEN_POLICY_BATCHED_EXECUTION

function decisionLabel(status: DecisionMetadata["status"] | undefined, stale: boolean): string {
  if (!status || status === "undecided") return "Undecided";
  return stale ? `${status} · stale` : status;
}

export function DomainInspector({ domain, domainLabel, source, analysis, locked, refreshKey, idSuffix = "", onSourceChange, onDecisionChange }: DomainInspectorProps) {
  const sourceId = `${domain}-source${idSuffix}`;
  const displayedSource = domain === "terraform" && locked && analysis ? analysis.exportValue : source;
  const critical = analysis?.findings.filter((finding) => finding.severity === "critical" || finding.severity === "high").length ?? 0;
  const warnings = analysis?.findings.filter((finding) => ["warning", "medium", "low"].includes(finding.severity)).length ?? 0;
  const terraformReport = readTerraformReport(analysis);
  const decision = analysis?.decisions?.[0];
  const staleDecision = Boolean(decision && (decision.stale || decision.artifactDigest !== terraformReport?.sourceDigest || decision.decisionKey !== terraformReport?.decisionKey));
  const summaryEntries = terraformReport ? Object.entries(terraformReport.summary) : [];

  return (
    <div className="domain-inspector">
      <section className="domain-source-panel" aria-labelledby={`${sourceId}-label`}>
        <label className="panel-label" id={`${sourceId}-label`} htmlFor={sourceId}>{domainLabel} source</label>
        <textarea id={sourceId} value={displayedSource} readOnly={locked} onChange={(event) => onSourceChange(event.target.value)} spellCheck={false} />
        <p>{locked ? "Immutable redacted review. Import another plan to replace it." : "Source and canvas stay synchronized when syntax is valid."}</p>
      </section>
      <section className="domain-findings" aria-label="Findings and evidence">
        <div className="findings-summary"><div><strong>{critical}</strong><span>Critical</span></div><div><strong>{warnings}</strong><span>Warning</span></div></div>
        {terraformReport ? <section className="terraform-review-card" aria-label="Terraform review summary">
          <div className="terraform-review-card__header"><div><div className="panel-label">Plan summary</div><small>{terraformReport.changes.length} resource change{terraformReport.changes.length === 1 ? "" : "s"}</small></div><span className={staleDecision ? "decision-status decision-status--stale" : "decision-status"}>{decisionLabel(decision?.status, staleDecision)}</span></div>
          <div className="terraform-metrics">{summaryEntries.map(([key, value]) => <div key={key}><strong>{value}</strong><span>{key.replaceAll("_", " ")}</span></div>)}</div>
          {onDecisionChange ? <div className="terraform-decision" role="group" aria-label="Terraform review decision">
            <span className="panel-label">Decision</span>
            <div className="terraform-decision__actions">
              {(["approved", "rejected", "dismissed", "undecided"] as const).map((status) => <button key={status} type="button" aria-pressed={status === "undecided" ? !decision : decision?.status === status} onClick={() => onDecisionChange(status)}>{status === "undecided" ? "Clear" : status}</button>)}
            </div>
          </div> : null}
          {decision && staleDecision ? <p className="terraform-review-card__notice">Decision no longer matches current artifact. Review again before relying on it.</p> : null}
          {terraformReport.changes.length ? <ol className="terraform-change-list">{terraformReport.changes.map((change) => <li key={change.address}><div><code>{change.name}</code>{change.sensitive ? <span className="sensitive-badge">Sensitive</span> : null}</div><small>{change.address} · {actionTransition(change.actions)}</small></li>)}</ol> : null}
          {terraformReport.assumptions.length || terraformReport.limitations.length ? <details className="terraform-notes"><summary>Assumptions & limitations</summary>{terraformReport.assumptions.length ? <p><strong>Assumptions:</strong> {terraformReport.assumptions.join(" ")}</p> : null}{terraformReport.limitations.length ? <p><strong>Limitations:</strong> {terraformReport.limitations.join(" ")}</p> : null}</details> : null}
        </section> : null}
        <div className="panel-label">Findings & evidence</div>
        {!analysis ? <p className="empty-state">Correct or import source to begin review.</p> : analysis.findings.length === 0 ? <p className="empty-state">No findings in locked rule set.</p> : (
          <ol className="finding-list">{analysis.findings.map((finding) => (
            <li key={finding.fingerprint} data-severity={finding.severity}>
              <div><span>{finding.severity}</span><code>{finding.ruleId}</code></div>
              <strong>{finding.title}</strong><p>{finding.message}</p>
              <small>{finding.category} · {finding.confidence} confidence</small>
              <p>{finding.remediation.summary}</p>
            </li>
          ))}</ol>
        )}
        <CrossDomainContracts refreshKey={refreshKey} idSuffix={idSuffix} />
      </section>
    </div>
  );
}
