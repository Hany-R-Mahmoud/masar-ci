import type { WorkspaceAnalysis } from "@/lib/domains/workspace-adapters";
import type { WorkbenchDomain } from "./contracts";

export interface AnalyzeWorkerRequest {
  readonly domain: WorkbenchDomain;
  readonly file: File;
}

export type AnalyzeWorkerResponse =
  | { readonly type: "progress"; readonly phase: "reading" | "analyzing" }
  | { readonly type: "success"; readonly source: string; readonly analysis: WorkspaceAnalysis }
  | { readonly type: "error"; readonly message: string };
