import type {
  AnalysisMetadata,
  DecisionMetadata,
  Evidence,
  Finding,
  FindingCategory,
  FindingConfidence,
  FindingSeverity,
  FixProposal,
  Remediation,
  SourceLocation,
} from "./contracts";
import { stableDigest } from "./digest";

export interface FindingInput {
  readonly ruleId: string;
  readonly severity: FindingSeverity;
  readonly title: string;
  readonly message: string;
  readonly evidence?: Evidence;
  readonly category?: FindingCategory;
  readonly sourceLocations?: readonly SourceLocation[];
  readonly confidence?: FindingConfidence;
  readonly assumptions?: readonly string[];
  readonly limitations?: readonly string[];
  readonly remediation?: Remediation;
  readonly fixProposal?: FixProposal;
  readonly decision?: DecisionMetadata;
  readonly analyzerVersion?: string;
  readonly policyVersion?: string;
}

const severityRank: Readonly<Record<FindingSeverity, number>> = {
  critical: 0,
  high: 1,
  warning: 1,
  medium: 2,
  low: 3,
  info: 4,
};
export const DEFAULT_ANALYZER_VERSION = "masarci-analyzer/v1";
export const DEFAULT_POLICY_VERSION = "masarci-policy/v1";

const defaultRemediation: Remediation = {
  kind: "manual",
  summary: "Review the evidence and choose the smallest safe remediation.",
  steps: [],
  safeToApply: false,
};

function hasPreciseEvidence(evidence: Evidence | undefined, sourceLocations: readonly SourceLocation[]): boolean {
  return Boolean(evidence?.line || evidence?.range || evidence?.sourceRange || sourceLocations.some((location) => location.line || location.range || location.sourceRange));
}

function inferCategory(ruleId: string): FindingCategory {
  if (/SECRET|PERMISSION|PRIVILEGED|ROOT/i.test(ruleId)) return "security";
  if (/MUTABLE|CACHE|OPTIM/i.test(ruleId)) return "optimization";
  if (/DELETE|REPLACE|MISSING|INVALID|UNSUPPORTED/i.test(ruleId)) return "reliability";
  return "explanation";
}

export function createFinding(input: FindingInput): Finding {
  const evidenceKey = input.evidence
    ? `${input.evidence.artifact ?? ""}:${input.evidence.line ?? ""}:${input.evidence.path ?? ""}`
    : "global";
  const fingerprint = `${input.ruleId}:${stableDigest(evidenceKey)}`;
  const sourceLocations = input.sourceLocations ?? (input.evidence ? [input.evidence] : []);
  return {
    ...input,
    id: fingerprint,
    category: input.category ?? inferCategory(input.ruleId),
    sourceLocations,
    confidence: input.confidence ?? (hasPreciseEvidence(input.evidence, sourceLocations) ? "exact" : "high"),
    assumptions: input.assumptions ?? [],
    limitations: input.limitations ?? [],
    remediation: input.remediation ?? defaultRemediation,
    analyzerVersion: input.analyzerVersion ?? DEFAULT_ANALYZER_VERSION,
    policyVersion: input.policyVersion ?? DEFAULT_POLICY_VERSION,
    fingerprint,
  };
}

export function createAnalysisMetadata(
  artifactDigest: string,
  options: Partial<Omit<AnalysisMetadata, "artifactDigest">> = {},
): AnalysisMetadata {
  return {
    artifactDigest,
    analyzerVersion: options.analyzerVersion ?? DEFAULT_ANALYZER_VERSION,
    policyVersion: options.policyVersion ?? DEFAULT_POLICY_VERSION,
    assumptions: options.assumptions ?? [],
    limitations: options.limitations ?? [],
  };
}

export function sortFindings(findings: readonly Finding[]): Finding[] {
  return [...findings].sort((left, right) =>
    severityRank[left.severity] - severityRank[right.severity]
      || left.ruleId.localeCompare(right.ruleId)
      || left.fingerprint.localeCompare(right.fingerprint));
}
