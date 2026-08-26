/// <reference lib="webworker" />

import { analyzeWorkspaceSource } from "@/lib/domains/workspace-adapters";
import type { AnalyzeWorkerRequest, AnalyzeWorkerResponse } from "@/lib/workbench/worker-contracts";

self.addEventListener("message", async (event: MessageEvent<AnalyzeWorkerRequest>) => {
  const respond = (response: AnalyzeWorkerResponse) => Reflect.apply(self.postMessage, self, [response]); // TOKEN_POLICY_BATCHED_EXECUTION
  try {
    respond({ type: "progress", phase: "reading" });
    const source = await event.data.file.text();
    respond({ type: "progress", phase: "analyzing" });
    const result = analyzeWorkspaceSource(event.data.domain, source);
    if (!result.ok) {
      respond({ type: "error", message: result.error.message });
      return;
    }
    respond({ type: "success", source, analysis: result.value });
  } catch (error: unknown) {
    respond({ type: "error", message: error instanceof Error ? error.message : "Worker analysis failed." });
  }
});

export {}; // TOKEN_POLICY_BATCHED_EXECUTION
