"use client";

import { useMemo, useState } from "react";
import type { LintFinding } from "@/lib/lint/lint";
import type { FixPreview } from "@/lib/workbench/contracts";
import { cn } from "@/lib/cn";

const CRIT_SOFT = "bg-[oklch(0.62_0.22_25/0.14)]";
const CRIT_BORDER = "border-[oklch(0.62_0.22_25/0.45)]";
const WARN_BORDER = "border-[oklch(0.78_0.15_75/0.4)]";

export function findingKey(finding: LintFinding): string {
  return `${finding.ruleId}:${finding.targetJobId ?? ""}:${finding.targetStepId ?? ""}`;
}

interface YamlLintPanelProps {
  yaml: string;
  findings: LintFinding[];
  fixProposals?: Readonly<Record<string, FixPreview>>;
  onApplyFix?: (finding: LintFinding) => void;
  onCopy: () => void;
}

export function YamlLintPanel({ yaml, findings, fixProposals = {}, onApplyFix, onCopy }: YamlLintPanelProps) {
  const [filter, setFilter] = useState<"all" | "critical" | "warning" | "info">("all");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [confirmationId, setConfirmationId] = useState<string | null>(null);
  const lines = yaml.split("\n");
  const visibleFindings = useMemo(
    () => (filter === "all" ? findings : findings.filter((finding) => finding.severity === filter)),
    [filter, findings],
  );
  const lineSeverity = useMemo(() => {
    const output = new Map<number, LintFinding["severity"]>();
    for (const finding of findings) {
      if (!finding.location) continue;
      for (let line = finding.location.startLine; line <= finding.location.endLine; line += 1) {
        const current = output.get(line);
        if (!current || finding.severity === "critical" || (finding.severity === "warning" && current === "info")) {
          output.set(line, finding.severity);
        }
      }
    }
    return output;
  }, [findings]);

  return (
    <div className="grid h-full min-h-0 min-w-0 grid-rows-[minmax(0,1fr)_248px] overflow-hidden border-l border-border bg-surface">
      <div className="flex min-h-0 flex-col border-b border-border bg-code-bg">
        <div className="flex items-center gap-2 border-b border-border bg-surface px-3.5 py-2">
          <span className="font-mono text-[11px] font-semibold tracking-wide">deploy.yml</span>
          <button type="button" onClick={onCopy} className="ml-auto cursor-pointer font-mono text-[10.5px] text-ink-muted hover:text-accent">copy</button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto py-3 font-mono text-xs leading-relaxed">
          {lines.map((line, index) => <YamlLine key={index} n={index + 1} text={line} severity={lineSeverity.get(index + 1)} />)}
        </div>
      </div>

      <div className="flex min-h-0 flex-col">
        <div className="flex items-center gap-2 border-b border-border bg-surface px-3.5 py-2">
          <span className="font-mono text-[11px] font-semibold tracking-wide">Security</span>
          <span className="ml-auto font-mono text-[10.5px] text-ink-muted">{findings.length} findings</span>
        </div>
        {findings.length > 0 ? <div className="flex gap-1 px-2 pt-2">
          {(["all", "critical", "warning", "info"] as const).map((value) => (
            <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className={cn("rounded border px-1.5 py-1 font-mono text-[9.5px] uppercase tracking-wide", filter === value ? "border-accent bg-accent/10 text-accent" : "border-border text-ink-faint")}>
              {value} {value === "all" ? findings.length : findings.filter((finding) => finding.severity === value).length}
            </button>
          ))}
        </div> : null}
        <div className="min-h-0 flex-1 overflow-auto p-2">
          {findings.length === 0 ? <div className="rounded-lg border border-[oklch(0.72_0.15_150/0.4)] bg-[oklch(0.72_0.15_150/0.14)] px-3 py-2.5"><div className="font-mono text-[10px] uppercase tracking-wide text-secure">Secure and Ready</div><div className="mt-0.5 text-[11.5px] text-ink-muted">No security findings. The YAML is ready to commit.</div></div> : visibleFindings.map((finding) => {
            const key = findingKey(finding);
            return <Finding key={key} finding={finding} proposal={fixProposals[key]} previewId={previewId} confirmationId={confirmationId} onPreview={() => setPreviewId(previewId === key ? null : key)} onRequestApply={() => { setPreviewId(key); setConfirmationId(key); }} onConfirmApply={() => { setConfirmationId(null); onApplyFix?.(finding); }} onCancelApply={() => setConfirmationId(null)} />;
          })}
        </div>
      </div>
    </div>
  );
}

function YamlLine({ n, text, severity }: { n: number; text: string; severity?: LintFinding["severity"] }) {
  const critical = severity === "critical";
  const warning = severity === "warning";
  return <div className={cn("flex pr-3.5", critical ? CRIT_SOFT : warning && "bg-warning/10")}><span className={cn("w-[34px] shrink-0 select-none pr-3 text-right", critical ? "text-critical" : warning ? "text-warning" : "text-ink-faint")}>{n}</span><span className={cn("whitespace-pre", critical ? "text-critical" : warning ? "text-warning" : "text-ink")}>{text}</span></div>;
}

interface FindingProps {
  finding: LintFinding;
  proposal?: FixPreview;
  previewId: string | null;
  confirmationId: string | null;
  onPreview: () => void;
  onRequestApply: () => void;
  onConfirmApply: () => void;
  onCancelApply: () => void;
}

function Finding({ finding, proposal, previewId, confirmationId, onPreview, onRequestApply, onConfirmApply, onCancelApply }: FindingProps) {
  const key = findingKey(finding);
  const critical = finding.severity === "critical";
  const hasDiff = Boolean(proposal?.before && proposal.after);
  return <div className={cn("mb-2 rounded-lg border bg-surface-2 px-2.5 py-2.5", critical ? `${CRIT_BORDER} ${CRIT_SOFT}` : WARN_BORDER)}>
    <div className="mb-1.5 flex items-center gap-2"><span className={cn("rounded px-1.5 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-[0.06em]", critical ? "bg-critical text-white" : "bg-warning text-black")}>{finding.severity}</span><span className="font-mono text-[10.5px] text-ink-faint">{finding.ruleId}</span>{finding.location ? <span className="font-mono text-[10px] text-ink-muted">L{finding.location.startLine}{finding.location.endLine !== finding.location.startLine ? `–${finding.location.endLine}` : ""}</span> : null}{finding.targetJobId ? <span className="ml-auto font-mono text-[10px] text-ink-muted">{finding.targetJobId}{finding.targetStepId ? ` &gt; ${finding.targetStepId}` : ""}</span> : null}</div>
    <div className="mb-1 text-[12.5px] font-semibold">{finding.title}</div><div className="text-[11.5px] leading-relaxed text-ink-muted">{finding.message}</div>
    {proposal ? <div className="mt-2.5"><button type="button" onClick={onPreview} disabled={!hasDiff} className="mr-2 cursor-pointer rounded border border-border px-2.5 py-1 font-sans text-[11px] font-semibold text-ink-muted hover:text-ink">{previewId === key ? "Hide diff" : "Preview diff"}</button>{proposal.status === "available" && hasDiff ? confirmationId === key ? <><button type="button" onClick={onConfirmApply} className="mr-2 cursor-pointer rounded border border-accent bg-accent/15 px-2.5 py-1 font-sans text-[11px] font-semibold text-accent">Confirm apply</button><button type="button" onClick={onCancelApply} className="cursor-pointer rounded border border-border px-2.5 py-1 font-sans text-[11px] font-semibold text-ink-muted">Cancel</button></> : <button type="button" onClick={onRequestApply} className="cursor-pointer rounded border border-accent bg-accent/15 px-2.5 py-1 font-sans text-[11px] font-semibold text-accent">Apply fix</button> : null}<small className="ml-2">{proposal.status === "requires-review" ? "Review required" : proposal.status}</small>{proposal.validation ? <small className="mt-1 block text-ink-faint">{proposal.validation}</small> : null}{previewId === key && hasDiff ? <FixPreviewView preview={proposal} /> : null}</div> : null}
  </div>;
}

function FixPreviewView({ preview }: { preview: FixPreview }) {
  return <div className="mt-2 grid gap-2 rounded border border-border bg-code-bg p-2 font-mono text-[10px] md:grid-cols-2" aria-label="Fix diff"><div className="min-w-0"><span className="text-critical">Before</span><pre className="mt-1 max-h-28 overflow-auto whitespace-pre-wrap text-ink-muted">{preview.before}</pre></div><div className="min-w-0"><span className="text-secure">After</span><pre className="mt-1 max-h-28 overflow-auto whitespace-pre-wrap text-ink-muted">{preview.after}</pre></div></div>;
}
