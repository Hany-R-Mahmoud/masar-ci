import { parseYaml } from "@/lib/generate/parse";
import { lint } from "@/lib/lint/lint";
import type { ArtifactGraph, DecisionMetadata, Finding, FixPreview, ParseError, Remediation, Result, WorkbenchDomain } from "@/lib/workbench/contracts";
import { createFinding, sortFindings } from "@/lib/workbench/findings";
import { checkArtifactSafety } from "@/lib/workbench/limits";
import { isRecord } from "@/lib/workbench/records"; // TOKEN_POLICY_BATCHED_EXECUTION
import { scanSecrets } from "./crossflow/secret-analysis";
import { analyzeCompose, parseCompose } from "./containers/compose";
import { analyzeDockerfile, parseDockerfile } from "./containers/dockerfile";
import { analyzeKubernetes, parseKubernetes } from "./kubernetes/kubernetes";
import {
  analyzeTerraformPlan,
  buildTerraformGraph,
  parseTerraformPlan,
  TERRAFORM_ANALYZER_VERSION,
  TERRAFORM_POLICY_VERSION,
  summarizeTerraformChanges,
  type TerraformAction,
  type TerraformPlanReview,
  type TerraformSummaryMetadata,
} from "./terraform/terraform";
import { stableDigest } from "@/lib/workbench/digest";
import { previewFindingFix } from "@/lib/lint/preview";

export interface WorkspaceAnalysis {
  readonly domain: WorkbenchDomain;
  readonly mode: "source" | "review";
  readonly graph: ArtifactGraph;
  readonly findings: readonly Finding[];
  readonly decisions?: readonly DecisionMetadata[];
  readonly summary: readonly { readonly label: string; readonly value: string }[];
  readonly exportValue: string;
}

function remediationForPreview(finding: Finding, preview: FixPreview): Remediation {
  if (preview.status === "available" && finding.ruleId === "INJECT-001") {
    return {
      kind: "automated",
      summary: "Move attacker-controlled event data into a step-level environment variable.",
      steps: ["Review the exact diff.", "Apply the change.", "Re-analyze the workflow."],
      safeToApply: true,
      nextVerification: "INJECT-001 is absent after re-analysis.",
    };
  }
  if (preview.status !== "requires-review") return finding.remediation;
  return {
    kind: "review",
    summary: "Review the exact diff and its runtime implications before applying it.",
    steps: ["Inspect the before/after preview.", "Confirm the proposed value or reference.", "Apply the smallest manual change and re-analyze."],
    safeToApply: false,
    nextVerification: "Re-analyze the source and confirm the finding changed as expected.",
  };
}

function addFindingProposal(domain: WorkbenchDomain, source: string, finding: Finding): Finding {
  const fixProposal = previewFindingFix(domain, source, finding);
  if (!fixProposal || fixProposal.status === "unavailable") return finding;
  return { ...finding, fixProposal, remediation: remediationForPreview(finding, fixProposal) };
}

function addFixProposals(domain: WorkbenchDomain, source: string, findings: readonly Finding[]): Finding[] {
  return findings.map((finding) => addFindingProposal(domain, source, finding));
}

function parseActions(source: string): Result<WorkspaceAnalysis, ParseError> {
  try {
    const workflow = parseYaml(source);
    const graph: ArtifactGraph = {
      nodes: workflow.jobs.map((job) => ({ id: job.id, label: job.name, kind: "job", detail: job.runsOn })),
      edges: workflow.jobs.flatMap((job) => job.needs.map((dependency) => ({ from: dependency, to: job.id, label: "needs" }))),
    };
    const findings = lint(workflow).map((finding) => createFinding({
      ruleId: finding.ruleId,
      severity: finding.severity,
      title: finding.title,
      message: finding.message,
      evidence: { artifact: finding.targetJobId, line: finding.location?.startLine, path: finding.targetStepId },
    }));
    const allFindings = addFixProposals("actions", source, [...findings, ...scanSecrets(source, "workflow")]);
    return { ok: true, value: {
      domain: "actions", mode: "source", graph, findings: sortFindings(allFindings),
      decisions: [], summary: [{ label: "Jobs", value: String(workflow.jobs.length) }, { label: "Triggers", value: String(workflow.on.length) }], exportValue: source,
    } };
  } catch (error: unknown) {
    return { ok: false, error: { code: "INVALID_SYNTAX", message: error instanceof Error ? error.message : "Invalid workflow YAML." } };
  }
}

export function analyzeWorkspaceSource(domain: WorkbenchDomain, source: string): Result<WorkspaceAnalysis, ParseError> {
  const safety = checkArtifactSafety(source, domain);
  if (!safety.ok) return { ok: false, error: { code: safety.error.code === "ARTIFACT_TOO_LARGE" ? "ARTIFACT_TOO_LARGE" : "UNSAFE_INPUT", message: safety.error.message } };
  if (domain === "actions") return parseActions(source);
  if (domain === "compose") {
    const parsed = parseCompose(source);
    if (!parsed.ok) return parsed;
    return { ok: true, value: { domain, mode: "source", graph: parsed.value.graph,
      findings: sortFindings(addFixProposals(domain, source, [...analyzeCompose(parsed.value), ...scanSecrets(source, "compose.yaml")])),
      decisions: [], summary: [{ label: "Services", value: String(parsed.value.services.length) }, { label: "Links", value: String(parsed.value.graph.edges.length) }], exportValue: source } };
  }
  if (domain === "dockerfile") {
    const parsed = parseDockerfile(source);
    if (!parsed.ok) return parsed;
    return { ok: true, value: { domain, mode: "source", graph: parsed.value.graph,
      findings: sortFindings(addFixProposals(domain, source, [...analyzeDockerfile(parsed.value), ...scanSecrets(source, "Dockerfile")])),
      decisions: [], summary: [{ label: "Stages", value: String(parsed.value.stages.length) }, { label: "Transfers", value: String(parsed.value.graph.edges.length) }], exportValue: source } };
  }
  if (domain === "kubernetes") {
    const parsed = parseKubernetes(source);
    if (!parsed.ok) return parsed;
    return { ok: true, value: { domain, mode: "source", graph: parsed.value.graph,
      findings: sortFindings(addFixProposals(domain, source, [...analyzeKubernetes(parsed.value), ...scanSecrets(source, "manifests.yaml")])),
      decisions: [], summary: [{ label: "Resources", value: String(parsed.value.resources.length) }, { label: "Links", value: String(parsed.value.graph.edges.length) }, { label: "Raw retained", value: String(parsed.value.unmodeledDocuments) }], exportValue: source } }; // TOKEN_POLICY_BATCHED_EXECUTION
  }
  const parsed = parseTerraformPlan(source);
  if (!parsed.ok) return parsed;
  const exportValue = JSON.stringify({
    sourceDigest: parsed.value.sourceDigest,
    formatVersion: parsed.value.formatVersion,
    terraformVersion: parsed.value.terraformVersion,
    summary: parsed.value.summary,
    changes: parsed.value.changes,
    graph: parsed.value.graph,
    summaryMetadata: parsed.value.summaryMetadata,
    decisions: [],
  }, null, 2);
  return { ok: true, value: { domain, mode: "review", graph: parsed.value.graph, findings: analyzeTerraformPlan(parsed.value), decisions: [],
    summary: Object.entries(parsed.value.summary).map(([label, value]) => ({ label, value: String(value) })), exportValue } };
}

function readPersistedGraph(value: unknown): ArtifactGraph | undefined {
  if (value === undefined) return undefined;
  if (!isRecord(value) || !Array.isArray(value.nodes) || !Array.isArray(value.edges)) throw new Error("Review graph is invalid.");
  const nodes = value.nodes.map((node, index) => {
    if (!isRecord(node) || typeof node.id !== "string" || typeof node.label !== "string" || typeof node.kind !== "string") throw new Error(`Review graph node ${index + 1} is invalid.`);
    if (node.detail !== undefined && typeof node.detail !== "string") throw new Error(`Review graph node ${index + 1} has invalid detail.`);
    return { id: node.id, label: node.label, kind: node.kind, ...(node.detail === undefined ? {} : { detail: node.detail }) };
  });
  const edges = value.edges.map((edge, index) => {
    if (!isRecord(edge) || typeof edge.from !== "string" || typeof edge.to !== "string" || typeof edge.label !== "string") throw new Error(`Review graph edge ${index + 1} is invalid.`);
    return { from: edge.from, to: edge.to, label: edge.label };
  });
  return { nodes, edges };
}

function readPersistedDecisions(value: unknown, sourceDigest: string, decisionKey: string): readonly DecisionMetadata[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new Error("Review decisions are invalid.");
  return value.map((item, index) => {
    if (!isRecord(item)
      || !["undecided", "approved", "rejected", "dismissed"].includes(String(item.status))
      || item.artifactDigest !== sourceDigest
      || item.decisionKey !== decisionKey
      || (item.reason !== undefined && typeof item.reason !== "string")
      || (item.stale !== undefined && typeof item.stale !== "boolean")) throw new Error(`Review decision ${index + 1} is invalid or bound to another artifact.`);
    return {
      status: item.status as DecisionMetadata["status"],
      artifactDigest: sourceDigest,
      decisionKey,
      ...(item.reason === undefined ? {} : { reason: item.reason }),
      ...(item.stale === undefined ? {} : { stale: item.stale }),
    };
  });
}

export function restoreTerraformReview(summary: string, expectedDigest?: string): Result<WorkspaceAnalysis, ParseError> {
  try {
    const value: unknown = JSON.parse(summary);
    if (!isRecord(value)) throw new Error("Review summary must be an object.");
    const record = value;
    if (typeof record.sourceDigest !== "string" || typeof record.formatVersion !== "string" || !Array.isArray(record.changes) || !isRecord(record.summary)) {
      throw new Error("Review summary is incomplete.");
    }
    if (expectedDigest !== undefined && expectedDigest !== stableDigest(summary) && expectedDigest !== record.sourceDigest) {
      throw new Error("Persisted Terraform review digest does not match its saved artifact.");
    }
    const validActions: readonly TerraformAction[] = ["create", "update", "delete", "no-op", "read", "replace"];
    const changes = record.changes.map((item, index) => {
      if (!isRecord(item) || typeof item.address !== "string" || typeof item.name !== "string" || typeof item.type !== "string" || !Array.isArray(item.actions)) {
        throw new Error(`Review change ${index + 1} is incomplete.`);
      }
      const actions = item.actions.map((action) => {
        if (typeof action !== "string" || !validActions.includes(action as TerraformAction)) throw new Error(`Review change ${index + 1} has an invalid action.`);
        return action as TerraformAction;
      });
      const references = item.references === undefined ? [] : item.references;
      if (!Array.isArray(references) || references.some((reference) => typeof reference !== "string")) {
        throw new Error(`Review change ${index + 1} has invalid references.`);
      }
      if (item.sensitive !== undefined && typeof item.sensitive !== "boolean") throw new Error(`Review change ${index + 1} has an invalid sensitivity flag.`);
      return {
        address: item.address,
        name: item.name,
        type: item.type,
        actions,
        sensitive: item.sensitive === true,
        references,
      };
    });
    const persistedGraph = readPersistedGraph(record.graph);
    const metadataRecord = record.summaryMetadata;
    const fallbackLimitations = [typeof record.limitation === "string" ? record.limitation : "Static plan review only; no execution, provider refresh, or authoritative cost estimate."];
    const readStringList = (key: "assumptions" | "limitations", fallback: readonly string[]): readonly string[] => {
      if (metadataRecord === undefined) return fallback;
      if (!isRecord(metadataRecord) || !Array.isArray(metadataRecord[key]) || metadataRecord[key].some((item) => typeof item !== "string")) {
        throw new Error(`Review summary metadata has invalid ${key}.`);
      }
      return metadataRecord[key] as readonly string[];
    };
    if (metadataRecord !== undefined && !isRecord(metadataRecord)) throw new Error("Review summary metadata is invalid.");
    const assumptions = readStringList("assumptions", ["Dependency edges represent declared configuration references that resolve to resources in this plan."]);
    const limitations = readStringList("limitations", fallbackLimitations);
    const analyzerVersion = metadataRecord && typeof metadataRecord.analyzerVersion === "string" ? metadataRecord.analyzerVersion : TERRAFORM_ANALYZER_VERSION;
    const policyVersion = metadataRecord && typeof metadataRecord.policyVersion === "string" ? metadataRecord.policyVersion : TERRAFORM_POLICY_VERSION;
    const expectedDecisionKey = stableDigest(`${record.sourceDigest}:${TERRAFORM_ANALYZER_VERSION}:${TERRAFORM_POLICY_VERSION}`);
    if (metadataRecord) {
      if (metadataRecord.artifactDigest !== record.sourceDigest) throw new Error("Review summary metadata is bound to a different artifact.");
      if (analyzerVersion !== TERRAFORM_ANALYZER_VERSION || policyVersion !== TERRAFORM_POLICY_VERSION) {
        throw new Error("Review summary was produced by an incompatible analyzer or policy version.");
      }
      if (metadataRecord.decisionKey !== expectedDecisionKey) throw new Error("Review summary decision binding is invalid.");
    }
    const summaryMetadata: TerraformSummaryMetadata = {
      artifactDigest: record.sourceDigest,
      analyzerVersion,
      policyVersion,
      assumptions,
      limitations,
      decisionKey: metadataRecord && typeof metadataRecord.decisionKey === "string"
        ? metadataRecord.decisionKey
        : expectedDecisionKey,
    };
    const decisionKey = summaryMetadata.decisionKey;
    const decisions = readPersistedDecisions(record.decisions, record.sourceDigest, decisionKey);
    const generatedGraph = buildTerraformGraph(changes);
    if (persistedGraph && JSON.stringify(persistedGraph) !== JSON.stringify(generatedGraph)) {
      throw new Error("Review graph does not match its persisted changes.");
    }
    const graph = persistedGraph ?? generatedGraph;
    const plan: TerraformPlanReview = {
      mode: "review",
      sourceDigest: record.sourceDigest,
      formatVersion: record.formatVersion,
      terraformVersion: typeof record.terraformVersion === "string" ? record.terraformVersion : undefined,
      changes,
      graph,
      summary: summarizeTerraformChanges(changes),
      summaryMetadata,
    };
    return { ok: true, value: {
      domain: "terraform",
      mode: "review",
      graph: plan.graph,
      findings: analyzeTerraformPlan(plan),
      decisions,
      summary: Object.entries(plan.summary).map(([label, value]) => ({ label, value: String(value) })),
      // TOKEN_POLICY_BATCHED_EXECUTION: preserve persisted decisions on re-export.
      exportValue: JSON.stringify({ ...plan, decisions }, null, 2),
    } };
  } catch (error: unknown) {
    return { ok: false, error: { code: "INVALID_SHAPE", message: error instanceof Error ? error.message : "Invalid persisted Terraform review." } };
  }
}
