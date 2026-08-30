"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";

const DEFAULT_INSPECTOR_WIDTH = 430;
const NARROW_INSPECTOR_WIDTH = 320;
const MIN_INSPECTOR_WIDTH = 260;
const MAX_INSPECTOR_WIDTH = 560;
const MIN_CANVAS_WIDTH = 240;
const RESIZE_STEP = 16;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

interface WorkbenchShellProps {
  readonly tools: ReactNode;
  readonly canvas: ReactNode;
  readonly inspector: ReactNode;
  readonly children?: ReactNode;
  readonly id?: string;
  readonly labelledBy?: string;
}

export function WorkbenchShell({ tools, canvas, inspector, children, id, labelledBy }: WorkbenchShellProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const [inspectorWidth, setInspectorWidth] = useState<number | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const inspectorId = id ? `${id}-inspector` : "workspace-grid-inspector";
  const visibleWidth = inspectorWidth ?? (typeof window !== "undefined" && window.innerWidth <= 1100 ? NARROW_INSPECTOR_WIDTH : DEFAULT_INSPECTOR_WIDTH);

  const getBounds = useCallback(() => {
    const shell = shellRef.current;
    if (!shell) return { min: MIN_INSPECTOR_WIDTH, max: MAX_INSPECTOR_WIDTH };
    const shellWidth = shell.getBoundingClientRect().width;
    const trayWidth = shell.querySelector<HTMLElement>(".workspace-grid__tray")?.getBoundingClientRect().width ?? 0;
    const max = shellWidth > 0 ? Math.min(MAX_INSPECTOR_WIDTH, shellWidth - trayWidth - MIN_CANVAS_WIDTH) : MAX_INSPECTOR_WIDTH;
    return { min: MIN_INSPECTOR_WIDTH, max: Math.max(MIN_INSPECTOR_WIDTH, max) };
  }, []);

  const setWidthWithinBounds = useCallback((nextWidth: number) => {
    const { min, max } = getBounds();
    setInspectorWidth(clamp(nextWidth, min, max));
  }, [getBounds]);

  const resizeToClientX = useCallback((clientX: number) => {
    const shell = shellRef.current;
    if (!shell) return;
    setWidthWithinBounds(shell.getBoundingClientRect().right - clientX);
  }, [setWidthWithinBounds]);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;
    const configuredWidth = Number.parseFloat(getComputedStyle(shell).getPropertyValue("--workspace-inspector-size"));
    const fallbackWidth = window.innerWidth <= 1100 ? NARROW_INSPECTOR_WIDTH : DEFAULT_INSPECTOR_WIDTH;
    setWidthWithinBounds(Number.isFinite(configuredWidth) ? configuredWidth : fallbackWidth);
  }, [setWidthWithinBounds]);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setIsResizing(true);
    resizeToClientX(event.clientX);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (isResizing) resizeToClientX(event.clientX);
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!isResizing) return;
    setIsResizing(false);
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const currentWidth = inspectorWidth ?? visibleWidth;
    const key = event.key.toLowerCase(); // TOKEN_POLICY_BATCHED_EXECUTION
    if (key === "arrowleft" || key === "left" || key === "arrowright" || key === "right") {
      event.preventDefault();
      setWidthWithinBounds(currentWidth + (key === "arrowleft" || key === "left" ? RESIZE_STEP : -RESIZE_STEP));
    } else if (key === "home") {
      event.preventDefault();
      setWidthWithinBounds(MIN_INSPECTOR_WIDTH);
    } else if (key === "end") {
      event.preventDefault();
      setWidthWithinBounds(getBounds().max);
    }
  };

  const resetWidth = () => setWidthWithinBounds(typeof window !== "undefined" && window.innerWidth <= 1100 ? NARROW_INSPECTOR_WIDTH : DEFAULT_INSPECTOR_WIDTH);
  const shellStyle = inspectorWidth === null ? undefined : ({ "--workspace-inspector-size": `${inspectorWidth}px` } as CSSProperties);

  return (
    <div ref={shellRef} id={id} role={labelledBy ? "tabpanel" : undefined} aria-labelledby={labelledBy} className={`workspace-grid flex-1 min-h-0 relative${isResizing ? " is-resizing" : ""}`} style={shellStyle}>
      <aside className="workspace-grid__tray min-w-0 min-h-0 h-full overflow-hidden" aria-label="Workspace tools">{tools}</aside>
      <main className="workspace-grid__canvas min-w-0 min-h-0 h-full overflow-hidden" aria-label="Visual canvas">{canvas}</main>
      <aside id={inspectorId} className="workspace-grid__inspector min-w-0 min-h-0 h-full overflow-hidden" aria-label="Source and findings">{inspector}</aside>
      <div
        className="workspace-grid__resizer"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize source and findings panel"
        aria-controls={inspectorId}
        aria-valuemin={MIN_INSPECTOR_WIDTH}
        aria-valuemax={getBounds().max}
        aria-valuenow={Math.round(visibleWidth)}
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        onDoubleClick={resetWidth}
        title="Drag to resize. Use arrow keys for precise sizing."
      />
      {children}
    </div>
  );
}
