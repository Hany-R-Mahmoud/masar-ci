"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

export class CanvasErrorBoundary extends Component<
  { children: ReactNode; onRestore: () => void },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Canvas render failed", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="h-full flex items-center justify-center p-6 bg-surface-2" role="alert">
        <div className="max-w-sm rounded-lg border border-critical/50 bg-critical/10 p-4">
          <h2 className="font-semibold text-critical">Canvas could not render</h2>
          <p className="mt-1 text-[12px] text-ink-muted">Your YAML is preserved. Retry or restore the last valid workflow.</p>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => this.setState({ error: null })} className="rounded border border-border px-2.5 py-1.5 text-[12px]">Retry</button>
            <button type="button" onClick={() => { this.setState({ error: null }); this.props.onRestore(); }} className="rounded bg-accent px-2.5 py-1.5 text-[12px] text-black">Restore last valid</button>
          </div>
        </div>
      </div>
    );
  }
}
