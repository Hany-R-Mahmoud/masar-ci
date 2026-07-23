"use client";

import { useMemo, useState } from "react";
import type { Workflow } from "@/lib/model/types";
import { generateYaml } from "@/lib/generate/yaml";
import type { LintFinding } from "@/lib/lint/lint";
import { cn } from "@/lib/cn";

const CRIT_SOFT = "bg-[oklch(0.62_0.22_25/0.14)]";
const CRIT_BORDER = "border-[oklch(0.62_0.22_25/0.45)]";
const WARN_BORDER = "border-[oklch(0.78_0.15_75/0.4)]";

export function YamlLintPanel({
  yaml,
  findings,
  workflow,
  onFix,
  onCopy,
}: {
  yaml: string;
  findings: LintFinding[];
  workflow: Workflow;
  onFix: (f: LintFinding) => void;
  onCopy: () => void;
}) {
  const [filter, setFilter] = useState<"all" | "critical" | "warning" | "info">("all");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const lines = yaml.split("\n");
  const visibleFindings = useMemo(
    () => (filter === "all" ? findings : findings.filter((f) => f.severity === filter)),
    [filter, findings],
  );
  const lineSeverity = useMemo(() => {
    const out = new Map<number, LintFinding["severity"]>();
    for (const finding of findings) {
      if (!finding.location) continue;
      for (let line = finding.location.startLine; line <= finding.location.endLine; line++) {
        const current = out.get(line);
        if (!current || finding.severity === "critical" || (finding.severity === "warning" && current === "info")) {
          out.set(line, finding.severity);
        }
      }
    }
    return out;
  }, [findings]);
  return (
    <div className="grid grid-rows-[1fr_248px] border-l border-border bg-surface min-w-0">
      <div className="flex flex-col bg-code-bg border-b border-border min-h-0">
        <div className="flex items-center gap-2 px-3.5 py-2 border-b border-border bg-surface">
          <span className="font-mono text-[11px] font-semibold tracking-wide">deploy.yml</span>
          <button
            onClick={onCopy}
            className="ml-auto font-mono text-[10.5px] text-ink-muted hover:text-accent cursor-pointer"
          >
            copy
          </button>
        </div>
        <div className="flex-1 overflow-auto py-3 font-mono text-xs leading-relaxed">
          {lines.map((ln, i) => (
            <YamlLine key={i} n={i + 1} text={ln} severity={lineSeverity.get(i + 1)} />
          ))}
        </div>
      </div>

      <div className="flex flex-col min-h-0">
        <div className="flex items-center gap-2 px-3.5 py-2 border-b border-border bg-surface">
          <span className="font-mono text-[11px] font-semibold tracking-wide">Security</span>
          <span className="ml-auto font-mono text-[10.5px] text-ink-muted">{findings.length} findings</span>
        </div>
        {findings.length > 0 && (
          <div className="flex gap-1 px-2 pt-2">
            {(["all", "critical", "warning", "info"] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
                className={cn(
                  "font-mono text-[9.5px] uppercase tracking-wide px-1.5 py-1 rounded border",
                  filter === value ? "border-accent text-accent bg-accent/10" : "border-border text-ink-faint",
                )}
              >
                {value} {value === "all" ? findings.length : findings.filter((f) => f.severity === value).length}
              </button>
            ))}
          </div>
        )}
        <div className="flex-1 overflow-auto p-2">
          {findings.length === 0 ? (
            <div className="rounded-lg border border-[oklch(0.72_0.15_150/0.4)] bg-[oklch(0.72_0.15_150/0.14)] px-3 py-2.5">
              <div className="font-mono text-[10px] uppercase tracking-wide text-secure">Secure and Ready</div>
              <div className="text-[11.5px] text-ink-muted mt-0.5">No security findings. The YAML is ready to commit.</div>
            </div>
          ) : (
            visibleFindings.map((f) => (
              <Finding
                key={f.id ?? f.ruleId + (f.targetStepId ?? "")}
                f={f}
                workflow={workflow}
                previewId={previewId}
                onPreview={() => {
                  const key = f.id ?? f.ruleId;
                  setPreviewId(previewId === key ? null : key);
                }}
                onFix={onFix}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function YamlLine({ n, text, severity }: { n: number; text: string; severity?: LintFinding["severity"] }) {
  const critical = severity === "critical";
  const warning = severity === "warning";
  const rowCls = cn("flex pr-3.5", critical ? CRIT_SOFT : warning && "bg-warning/10");
  const numCls = cn("w-[34px] shrink-0 text-right pr-3 select-none", critical ? "text-critical" : warning ? "text-warning" : "text-ink-faint");
  const txtCls = cn("whitespace-pre", critical ? "text-critical" : warning ? "text-warning" : "text-ink");
  return (
    <div className={rowCls}>
      <span className={numCls}>{n}</span>
      <span className={txtCls}>{text}</span>
    </div>
  );
}

function Finding({
  f,
  workflow,
  previewId,
  onPreview,
  onFix,
}: {
  f: LintFinding;
  workflow: Workflow;
  previewId: string | null;
  onPreview: () => void;
  onFix: (f: LintFinding) => void;
}) {
  const crit = f.severity === "critical";
  const cardCls = cn(
    "rounded-lg border bg-surface-2 px-2.5 py-2.5 mb-2",
    crit ? CRIT_BORDER + " " + CRIT_SOFT : WARN_BORDER,
  );
  const sevCls = cn(
    "font-mono text-[9.5px] font-bold uppercase tracking-[0.06em] px-1.5 py-0.5 rounded",
    crit ? "bg-critical text-white" : "bg-warning text-black",
  );
  return (
    <div className={cardCls}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className={sevCls}>{f.severity}</span>
        <span className="font-mono text-[10.5px] text-ink-faint">{f.ruleId}</span>
        {f.location && <span className="font-mono text-[10px] text-ink-muted">L{f.location.startLine}{f.location.endLine !== f.location.startLine ? `–${f.location.endLine}` : ""}</span>}
        {f.targetJobId ? (
          <span className="ml-auto font-mono text-[10px] text-ink-muted">
            {f.targetJobId}
            {f.targetStepId ? " > " + f.targetStepId : ""}
          </span>
        ) : null}
      </div>
      <div className="text-[12.5px] font-semibold mb-1">{f.title}</div>
      <div className="text-[11.5px] text-ink-muted leading-relaxed">{f.message}</div>
      {f.autoFix ? (
        <div className="mt-2.5">
          <button
            type="button"
            onClick={onPreview}
            className="font-sans text-[11px] font-semibold px-2.5 py-1 rounded border border-border text-ink-muted hover:text-ink cursor-pointer mr-2"
          >
            {previewId === (f.id ?? f.ruleId) ? "Hide diff" : "Preview diff"}
          </button>
          <button
            type="button"
            onClick={() => onFix(f)}
            className="font-sans text-[11px] font-semibold px-2.5 py-1 rounded border border-accent bg-accent/15 text-accent hover:bg-accent hover:text-[oklch(0.16_0.02_52)] cursor-pointer"
          >
            Auto-Fix
          </button>
          {previewId === (f.id ?? f.ruleId) && <FixPreview finding={f} workflow={workflow} />}
        </div>
      ) : null}
    </div>
  );
}

function FixPreview({ finding, workflow }: { finding: LintFinding; workflow: Workflow }) {
  const next = finding.autoFix?.(workflow);
  if (!next) return null;
  const before = generateYaml(workflow).split("\n");
  const after = generateYaml(next).split("\n");
  const changed: string[] = [];
  for (let i = 0; i < Math.max(before.length, after.length); i++) {
    if (before[i] === after[i]) continue;
    if (before[i] !== undefined) changed.push(`- ${before[i]}`);
    if (after[i] !== undefined) changed.push(`+ ${after[i]}`);
  }
  return (
    <div className="mt-2 rounded border border-border bg-code-bg p-2 font-mono text-[10px] max-h-28 overflow-auto" aria-label="Auto-fix diff">
      {changed.length ? changed.map((line, i) => <div key={`${line}-${i}`} className="text-secure">+ {line}</div>) : <div className="text-ink-faint">No YAML change.</div>}
    </div>
  );
}
