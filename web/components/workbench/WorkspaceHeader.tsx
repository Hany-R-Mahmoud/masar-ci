"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type WorkspaceHeaderDomain = "actions" | "containers" | "kubernetes" | "terraform";
export type WorkspaceHeaderStatusTone = "neutral" | "progress" | "success" | "warning";

interface WorkspaceHeaderProps {
  readonly domain: WorkspaceHeaderDomain;
  readonly artifactName: string;
  readonly onArtifactNameChange?: (value: string) => void;
  readonly status: ReactNode;
  readonly statusTone?: WorkspaceHeaderStatusTone;
  readonly statusTitle?: string;
  readonly actions: ReactNode;
  readonly title?: string;
  readonly titleId?: string;
  readonly description?: string;
}

export function WorkspaceHeader({
  domain,
  artifactName,
  onArtifactNameChange,
  status,
  statusTone = "neutral",
  statusTitle,
  actions,
  title,
  titleId,
  description,
}: WorkspaceHeaderProps) {
  return (
    <header className="workspace-header flex h-12 items-center gap-3.5 border-b border-border bg-surface px-4" data-domain={domain}>
      {title ? <div className="sr-only"><h1 id={titleId}>{title}</h1>{description ? <p>{description}</p> : null}</div> : null}
      <span className="workspace-header__brand font-mono text-base font-medium tracking-tight">
        masar<span className="workspace-header__brand-mark">·</span>ci
      </span>
      <input
        value={artifactName}
        onChange={onArtifactNameChange ? (event) => onArtifactNameChange(event.target.value) : undefined}
        readOnly={!onArtifactNameChange}
        aria-label="Artifact name"
        className="workspace-header__name w-[248px] rounded-md border border-border bg-transparent px-2.5 py-1.5 font-mono text-[12.5px] text-ink focus:outline-1 focus:outline-accent"
      />
      <span className="workspace-header__spacer flex-1" />
      <span
        className="workspace-header__status inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] font-semibold tracking-[0.04em]"
        data-tone={statusTone}
        role="status"
        title={statusTitle}
      >
        <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-current" />
        <span className="workspace-header__status-label">{status}</span>
      </span>
      <div className="workspace-header__actions flex items-center gap-2">{actions}</div>
    </header>
  );
}

export function WorkspaceHeaderButton({
  className,
  variant = "secondary",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { readonly variant?: "secondary" | "primary" }) {
  return (
    <button
      {...props}
      type={type}
      data-variant={variant}
      className={cn("workspace-header__action cursor-pointer rounded-md border px-3 py-1.5 text-[12.5px] font-medium", className)}
    />
  );
}
