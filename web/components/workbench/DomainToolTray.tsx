"use client";

import type { DragEvent } from "react";
import type { WorkbenchDomain } from "@/lib/workbench/contracts";
import { domainTools, type ReviewLens } from "@/lib/domains/domain-tools";

export const DOMAIN_TOOL_MIME = "application/x-masarci-domain-tool";

interface DomainToolTrayProps {
  readonly domain: WorkbenchDomain;
  readonly activeLens: ReviewLens;
  readonly onAddTool: (toolId: string) => void;
  readonly onSelectLens: (lens: ReviewLens) => void;
}

export function DomainToolTray({ domain, activeLens, onAddTool, onSelectLens }: DomainToolTrayProps) {
  const availableTools = domainTools(domain);
  const groups = [...new Set(availableTools.map((tool) => tool.group))];
  const authoring = availableTools.some((tool) => tool.mode === "author");

  function startDrag(event: DragEvent<HTMLButtonElement>, toolId: string) {
    event.dataTransfer.setData(DOMAIN_TOOL_MIME, toolId);
    event.dataTransfer.effectAllowed = "copy";
  }

  return (
    <div className="domain-tool-tray">
      <div className="panel-label">{authoring ? "Tools · drag or select" : "Review tools"}</div>
      {authoring ? <p className="domain-tool-tray__hint">Drag onto canvas or select any tool.</p> : null}
      {groups.map((group) => (
        <section key={group} className="domain-tool-group" aria-labelledby={`${domain}-${group.replaceAll(" ", "-")}`}>
          <h2 id={`${domain}-${group.replaceAll(" ", "-")}`}>{group}</h2>
          {availableTools.filter((tool) => tool.group === group).map((tool) => {
            if (tool.mode === "review") {
              return (
                <button
                  key={tool.id}
                  type="button"
                  aria-label={`Focus ${tool.label}`}
                  aria-pressed={activeLens === tool.lens}
                  onClick={() => onSelectLens(tool.lens)}
                >
                  <span>{tool.label}</span><small>{tool.detail}</small>
                </button>
              );
            }
            return (
              <button
                key={tool.id}
                type="button"
                draggable
                aria-label={`Add ${tool.label} to canvas`}
                onDragStart={(event) => startDrag(event, tool.id)}
                onClick={() => onAddTool(tool.id)}
              >
                <span>{tool.label}</span><small>{tool.detail}</small>
              </button>
            );
          })}
        </section>
      ))}
    </div>
  );
}
