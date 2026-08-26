export type WorkbenchDomain = "actions" | "compose" | "dockerfile" | "kubernetes" | "terraform";
export type ArtifactMode = "source" | "review";
export type FindingSeverity = "critical" | "high" | "warning" | "medium" | "low" | "info";
export type FindingCategory = "validity" | "security" | "optimization" | "reliability" | "explanation" | "cross-document";
export type FindingConfidence = "exact" | "high" | "medium" | "low";

export interface SourceRange {
  readonly startLine: number;
  readonly startColumn?: number;
  readonly endLine?: number;
  readonly endColumn?: number;
}

export interface GraphNode {
  readonly id: string;
  readonly label: string;
  readonly kind: string;
  readonly detail?: string;
}

export interface GraphEdge {
  readonly from: string;
  readonly to: string;
  readonly label: string;
}

export interface ArtifactGraph {
  readonly nodes: readonly GraphNode[];
  readonly edges: readonly GraphEdge[];
}

export interface Evidence {
  readonly artifact?: string;
  readonly line?: number;
  readonly path?: string;
  readonly excerpt?: string;
  readonly range?: SourceRange;
  readonly sourceRange?: SourceRange;
}

export interface SourceLocation extends Evidence {}

export interface Remediation {
  readonly kind: "manual" | "automated" | "review";
  readonly summary: string;
  readonly steps: readonly string[];
  readonly safeToApply: boolean;
  readonly nextVerification?: string;
}

export interface FixPreview {
  readonly status?: "available" | "unavailable" | "requires-review";
  readonly summary?: string;
  readonly before?: string;
  readonly after?: string;
  readonly digest?: string;
  readonly decisionKey?: string;
}

export type FixProposal = FixPreview;

export interface DecisionMetadata {
  readonly status: "undecided" | "approved" | "rejected" | "dismissed";
  readonly artifactDigest: string;
  readonly decisionKey: string;
  readonly reason?: string;
  readonly stale?: boolean;
}

export interface Finding {
  readonly id: string;
  readonly ruleId: string;
  readonly category: FindingCategory;
  readonly severity: FindingSeverity;
  readonly title: string;
  readonly message: string;
  readonly evidence?: Evidence;
  readonly sourceLocations: readonly SourceLocation[];
  readonly confidence: FindingConfidence;
  readonly assumptions: readonly string[];
  readonly limitations: readonly string[];
  readonly remediation: Remediation;
  readonly fixProposal?: FixProposal;
  readonly decision?: DecisionMetadata;
  readonly analyzerVersion: string;
  readonly policyVersion: string;
  readonly fingerprint: string;
}

export interface AnalysisMetadata {
  readonly artifactDigest: string;
  readonly analyzerVersion: string;
  readonly policyVersion: string;
  readonly assumptions: readonly string[];
  readonly limitations: readonly string[];
}

export interface AnalysisReport extends AnalysisMetadata {
  readonly findings: readonly Finding[];
  readonly decisions: readonly DecisionMetadata[];
}

// TOKEN_POLICY_BATCHED_EXECUTION: expose the immutable snapshot/report contract.
export interface AnalysisSnapshot extends AnalysisReport {
  readonly id: string;
  readonly createdAt: string;
  readonly staleReason?: string;
}

export interface ReviewRecord extends DecisionMetadata {
  readonly findingId?: string;
}

export interface SourceArtifact {
  readonly id: string;
  readonly domain: WorkbenchDomain;
  readonly mode: "source";
  readonly name: string;
  readonly source: string;
  readonly digest: string;
  readonly updatedAt: string;
}

export interface ReviewArtifact {
  readonly id: string;
  readonly domain: "terraform";
  readonly mode: "review";
  readonly name: string;
  readonly digest: string;
  readonly summary: string;
  readonly updatedAt: string;
}

export type WorkbenchArtifact = SourceArtifact | ReviewArtifact;

export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export interface ParseError {
  readonly code: "INVALID_SYNTAX" | "INVALID_SHAPE" | "UNSUPPORTED_VERSION" | "ARTIFACT_TOO_LARGE" | "UNSAFE_INPUT";
  readonly message: string;
}
