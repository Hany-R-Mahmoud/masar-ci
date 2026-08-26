"use client";

import type { WorkbenchDomain } from "@/lib/workbench/contracts";
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
}

export function DomainInspector({ domain, domainLabel, source, analysis, locked, refreshKey, idSuffix = "", onSourceChange }: DomainInspectorProps) {
  const sourceId = `${domain}-source${idSuffix}`;
  const displayedSource = domain === "terraform" && locked && analysis ? analysis.exportValue : source;
  const critical = analysis?.findings.filter((finding) => finding.severity === "critical" || finding.severity === "high").length ?? 0;
  const warnings = analysis?.findings.filter((finding) => ["warning", "medium", "low"].includes(finding.severity)).length ?? 0;

  return (
    <div className="domain-inspector">
      <section className="domain-source-panel" aria-labelledby={`${sourceId}-label`}>
        <label className="panel-label" id={`${sourceId}-label`} htmlFor={sourceId}>{domainLabel} source</label>
        <textarea id={sourceId} value={displayedSource} readOnly={locked} onChange={(event) => onSourceChange(event.target.value)} spellCheck={false} />
        <p>{locked ? "Immutable redacted review. Import another plan to replace it." : "Source and canvas stay synchronized when syntax is valid."}</p>
      </section>
      <section className="domain-findings" aria-label="Findings and evidence">
        <div className="findings-summary"><div><strong>{critical}</strong><span>Critical</span></div><div><strong>{warnings}</strong><span>Warning</span></div></div>
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
