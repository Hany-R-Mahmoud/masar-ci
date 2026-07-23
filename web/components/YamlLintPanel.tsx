import type { LintFinding } from "@/lib/lint/lint";
import { cn } from "@/lib/cn";

const CRIT_SOFT = "bg-[oklch(0.62_0.22_25/0.14)]";
const CRIT_BORDER = "border-[oklch(0.62_0.22_25/0.45)]";
const WARN_BORDER = "border-[oklch(0.78_0.15_75/0.4)]";

export function YamlLintPanel({
  yaml,
  findings,
  onFix,
  onCopy,
}: {
  yaml: string;
  findings: LintFinding[];
  onFix: (f: LintFinding) => void;
  onCopy: () => void;
}) {
  const lines = yaml.split("\n");
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
            <YamlLine key={i} n={i + 1} text={ln} vuln={ln.includes("github.event.")} />
          ))}
        </div>
      </div>

      <div className="flex flex-col min-h-0">
        <div className="flex items-center gap-2 px-3.5 py-2 border-b border-border bg-surface">
          <span className="font-mono text-[11px] font-semibold tracking-wide">Security</span>
          <span className="ml-auto font-mono text-[10.5px] text-ink-muted">{findings.length} findings</span>
        </div>
        <div className="flex-1 overflow-auto p-2">
          {findings.length === 0 ? (
            <div className="rounded-lg border border-[oklch(0.72_0.15_150/0.4)] bg-[oklch(0.72_0.15_150/0.14)] px-3 py-2.5">
              <div className="font-mono text-[10px] uppercase tracking-wide text-secure">Secure and Ready</div>
              <div className="text-[11.5px] text-ink-muted mt-0.5">No security findings. The YAML is ready to commit.</div>
            </div>
          ) : (
            findings.map((f) => (
              <Finding key={f.ruleId + (f.targetStepId ?? "")} f={f} onFix={onFix} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function YamlLine({ n, text, vuln }: { n: number; text: string; vuln: boolean }) {
  const rowCls = cn("flex pr-3.5", vuln && CRIT_SOFT);
  const numCls = cn("w-[34px] shrink-0 text-right pr-3 select-none", vuln ? "text-critical" : "text-ink-faint");
  const txtCls = vuln ? "text-critical" : "text-ink whitespace-pre";
  return (
    <div className={rowCls}>
      <span className={numCls}>{n}</span>
      <span className={txtCls}>{text}</span>
    </div>
  );
}

function Finding({ f, onFix }: { f: LintFinding; onFix: (f: LintFinding) => void }) {
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
            onClick={() => onFix(f)}
            className="font-sans text-[11px] font-semibold px-2.5 py-1 rounded border border-accent bg-accent/15 text-accent hover:bg-accent hover:text-[oklch(0.16_0.02_52)] cursor-pointer"
          >
            Auto-Fix
          </button>
        </div>
      ) : null}
    </div>
  );
}
