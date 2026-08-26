import type { ReactNode } from "react";

interface WorkbenchShellProps {
  readonly tools: ReactNode;
  readonly canvas: ReactNode;
  readonly inspector: ReactNode;
  readonly children?: ReactNode;
  readonly id?: string;
  readonly labelledBy?: string;
}

export function WorkbenchShell({ tools, canvas, inspector, children, id, labelledBy }: WorkbenchShellProps) {
  return (
    <div id={id} role={labelledBy ? "tabpanel" : undefined} aria-labelledby={labelledBy} className="workspace-grid flex-1 min-h-0 relative">
      <aside className="workspace-grid__tray min-w-0 min-h-0" aria-label="Workspace tools">{tools}</aside>
      <main className="workspace-grid__canvas min-w-0 min-h-0" aria-label="Visual canvas">{canvas}</main>
      <aside className="workspace-grid__inspector min-w-0 min-h-0" aria-label="Source and findings">{inspector}</aside>
      {children}
    </div>
  );
}
