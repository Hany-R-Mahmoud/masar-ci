"use client";

import { Background, Controls } from "@xyflow/react";

export function CanvasChrome() {
  return (
    <>
      <Background gap={24} size={1} color="var(--color-border)" />
      <Controls className="!bg-surface !border-border" />
    </>
  );
}
