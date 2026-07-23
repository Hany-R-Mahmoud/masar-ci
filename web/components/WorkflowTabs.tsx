"use client";

import { cn } from "@/lib/cn";

export interface WorkflowTabView {
  id: string;
  name: string;
  dirty: boolean;
}

export function WorkflowTabs({
  tabs,
  activeId,
  onSelect,
  onClose,
  onNew,
}: {
  tabs: WorkflowTabView[];
  activeId: string;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onNew: () => void;
}) {
  const moveTab = (currentId: string, direction: "next" | "previous" | "first" | "last") => {
    if (!tabs.length) return;
    const index = tabs.findIndex((tab) => tab.id === currentId);
    if (index < 0) return;
    const nextIndex = direction === "first"
      ? 0
      : direction === "last"
        ? tabs.length - 1
        : (index + (direction === "next" ? 1 : -1) + tabs.length) % tabs.length;
    const nextId = tabs[nextIndex].id;
    onSelect(nextId);
    window.requestAnimationFrame(() => document.getElementById(`workflow-tab-${nextId}`)?.focus());
  };

  return (
    <nav aria-label="Open workflows" className="flex min-w-0 items-stretch border-b border-border bg-surface-2">
      <div role="tablist" aria-orientation="horizontal" className="flex min-w-0 flex-1 overflow-x-auto">
        {tabs.map((tab) => (
          <div key={tab.id} className="flex shrink-0 items-stretch border-r border-border">
            <button
              type="button"
              role="tab"
              id={`workflow-tab-${tab.id}`}
              aria-controls="workflow-workspace-panel"
              aria-selected={tab.id === activeId}
              tabIndex={tab.id === activeId ? 0 : -1}
              onClick={() => onSelect(tab.id)}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight") {
                  event.preventDefault();
                  moveTab(tab.id, "next");
                } else if (event.key === "ArrowLeft") {
                  event.preventDefault();
                  moveTab(tab.id, "previous");
                } else if (event.key === "Home") {
                  event.preventDefault();
                  moveTab(tab.id, "first");
                } else if (event.key === "End") {
                  event.preventDefault();
                  moveTab(tab.id, "last");
                }
              }}
              className={cn(
                "min-w-[var(--workflow-tab-min)] max-w-[var(--workflow-tab-max)] px-3 py-2 text-left font-mono text-[11px] transition-colors",
                tab.id === activeId ? "bg-surface text-ink" : "text-ink-muted hover:bg-surface hover:text-ink",
              )}
            >
              <span className="flex items-center gap-1.5 truncate">
                {tab.dirty && <span className="text-accent" aria-label="Unsaved changes">●</span>}
                <span className="truncate">{tab.name || "untitled"}</span>
              </span>
            </button>
            <button
              type="button"
              aria-label={`Close ${tab.name || "untitled"}`}
              onClick={() => onClose(tab.id)}
              className="px-2 text-ink-faint hover:bg-critical/15 hover:text-critical focus:outline-1 focus:outline-accent"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onNew}
        aria-label="New workflow tab"
        className="shrink-0 px-3 font-mono text-[15px] text-ink-muted hover:bg-surface hover:text-accent focus:outline-1 focus:outline-accent"
      >
        +
      </button>
    </nav>
  );
}
