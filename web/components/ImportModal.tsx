"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/cn";

export function ImportModal({
  open,
  text,
  error,
  onTextChange,
  onImport,
  onClose,
}: {
  open: boolean;
  text: string;
  error: string | null;
  onTextChange: (t: string) => void;
  onImport: (yaml: string) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"paste" | "file">("paste");
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const onFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result ?? "");
      onTextChange(content);
      onImport(content);
    };
    reader.readAsText(file);
  };

  const close = () => {
    setTab("paste");
    setFileName(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label="Import GitHub Actions YAML"
    >
      <div
        className="w-full max-w-2xl rounded-xl border border-border-strong bg-surface shadow-2xl flex flex-col"
        style={{ maxHeight: "80vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 h-12 border-b border-border bg-surface-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-faint">
            Import existing workflow
          </span>
          <button onClick={close} className="text-ink-faint hover:text-ink text-sm px-2 cursor-pointer" aria-label="close">
            ✕
          </button>
        </div>

        <div className="flex gap-1 px-3 pt-3">
          {(["paste", "file"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-3 py-1.5 text-[12px] font-medium rounded-md border cursor-pointer",
                tab === t
                  ? "border-accent bg-accent/15 text-accent"
                  : "border-border bg-surface-2 text-ink-muted hover:text-ink",
              )}
            >
              {t === "paste" ? "Paste YAML" : "Upload .yml"}
            </button>
          ))}
        </div>

        <div className="p-3 flex-1 overflow-auto">
          {tab === "paste" ? (
            <textarea
              value={text}
              onChange={(e) => onTextChange(e.target.value)}
              placeholder={"name: ci\non:\n  push:\n    branches: [main]\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v7\n      - run: npm ci && npm test"}
              spellCheck={false}
              className="w-full min-h-[260px] bg-code-bg border border-border rounded-md p-3 font-mono text-[12px] text-ink leading-relaxed focus:outline-1 focus:outline-accent resize-y"
            />
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "copy";
              }}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) onFile(f);
              }}
              onClick={() => fileRef.current?.click()}
              className="w-full min-h-[200px] flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border-strong bg-code-bg/40 cursor-pointer hover:border-accent hover:bg-accent/5"
            >
              <span className="font-mono text-[12px] text-ink-muted">
                {fileName ?? "Drop a .yml / .yaml file, or click to browse"}
              </span>
              <span className="font-mono text-[10px] text-ink-faint">reads locally — nothing is uploaded</span>
              <input
                ref={fileRef}
                type="file"
                accept=".yml,.yaml,text/yaml,application/yaml"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onFile(f);
                }}
              />
            </div>
          )}

          {error && (
            <p className="mt-2 text-[11.5px] text-critical font-mono bg-critical/10 border border-critical/40 rounded px-2 py-1.5">
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 px-3 pb-3">
          <button onClick={close} className="text-[12px] font-medium px-3 py-1.5 rounded-md border border-border-strong bg-surface-2 text-ink cursor-pointer">
            Cancel
          </button>
          {tab === "paste" && (
            <button
              onClick={() => onImport(text)}
              disabled={!text.trim()}
              className="text-[12px] font-medium px-3 py-1.5 rounded-md bg-accent text-[oklch(0.16_0.02_52)] border border-transparent cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Import &amp; lint
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
