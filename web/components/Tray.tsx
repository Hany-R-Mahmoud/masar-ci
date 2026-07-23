"use client";

import { ACTION_PRESETS } from "@/lib/sample";
import { TEMPLATES } from "@/lib/templates";

const TRIGGERS = ["push", "pull_request", "workflow_dispatch", "schedule"];
const JOBS = ["build", "test", "deploy", "lint"];

function dnd(payload: object) {
  return {
    onDragStart: (e: React.DragEvent) => {
      e.dataTransfer.setData("application/reactflow", JSON.stringify(payload));
      e.dataTransfer.effectAllowed = "move";
    },
  };
}

export function Tray({
  onTemplate,
  onAddItem,
}: {
  onTemplate: (id: string) => void;
  onAddItem: (payload: Record<string, unknown>) => void;
}) {
  return (
    <aside className="bg-surface border-r border-border overflow-auto p-3 text-[12.5px]">
      <Section title="Triggers">
        {TRIGGERS.map((t) => (
          <Item
            key={t}
            glyph="hex"
            label={t}
            tag="on:"
            draggable
            onAdd={() => onAddItem({ type: "trigger", event: t })}
            {...dnd({ type: "trigger", event: t })}
          />
        ))}
      </Section>
      <Section title="Jobs">
        {JOBS.map((j) => (
          <Item
            key={j}
            glyph="rect"
            label={j}
            draggable
            onAdd={() => onAddItem({ type: "job", id: j, runsOn: "ubuntu-latest" })}
            {...dnd({ type: "job", id: j, runsOn: "ubuntu-latest" })}
          />
        ))}
      </Section>
      <Section title="Action Marketplace">
        {ACTION_PRESETS.map((a) => (
          <Item
            key={a.repo}
            glyph="step"
            label={a.label}
            tag={`@${a.ref}`}
            draggable
            onAdd={() => onAddItem({ type: "action", repo: a.repo, ref: a.ref })}
            {...dnd({ type: "action", repo: a.repo, ref: a.ref })}
          />
        ))}
      </Section>
      <Section title="Regional Templates">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => onTemplate(t.id)}
            className="flex items-center gap-2 w-full rounded-md border border-transparent px-2 py-1.5 text-left hover:bg-surface-2 hover:border-border cursor-pointer focus:outline-1 focus:outline-accent"
          >
            <Glyph kind="tpl" />
            <span className="text-ink">{t.label}</span>
          </button>
        ))}
      </Section>
    </aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h4 className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint mb-2">{title}</h4>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

function Item({
  glyph,
  label,
  tag,
  draggable,
  onDragStart,
  onAdd,
}: {
  glyph: "hex" | "rect" | "step" | "tpl";
  label: string;
  tag?: string;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onAdd?: () => void;
}) {
  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      tabIndex={0}
      role="button"
      aria-label={`Add ${label} to canvas`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onAdd?.();
        }
      }}
      onClick={onAdd}
      className="flex items-center gap-2 rounded-md border border-transparent px-2 py-1.5 cursor-grab hover:bg-surface-2 hover:border-border focus:outline-1 focus:outline-accent active:opacity-60"
    >
      <Glyph kind={glyph} />
      <span className="text-ink">{label}</span>
      {tag && <span className="ml-auto font-mono text-[10.5px] text-ink-faint">{tag}</span>}
    </div>
  );
}

function Glyph({ kind }: { kind: "hex" | "rect" | "step" | "tpl" }) {
  const base = "shrink-0 opacity-90";
  if (kind === "hex")
    return <span className={`${base} hexagon bg-ink`} style={{ width: 14, height: 14 }} />;
  if (kind === "rect")
    return <span className={`${base} bg-surface-2 border border-border-strong rounded-[2px]`} style={{ width: 13, height: 9 }} />;
  if (kind === "tpl")
    return <span className={`${base} bg-accent/15 border border-accent rounded-[2px]`} style={{ width: 13, height: 9 }} />;
  return <span className={`${base} bg-surface border border-border rounded-[2px]`} style={{ width: 13, height: 7 }} />;
}
