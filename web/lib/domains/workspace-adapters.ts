import { parseYaml } from "@/lib/generate/parse";
import { lint } from "@/lib/lint/lint";
import type { ArtifactGraph, Finding, ParseError, Result, WorkbenchDomain } from "@/lib/workbench/contracts";
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

export interface WorkspaceAnalysis {
  readonly domain: WorkbenchDomain;
  readonly mode: "source" | "review";
  readonly graph: ArtifactGraph;
  readonly findings: readonly Finding[];
  readonly summary: readonly { readonly label: string; readonly value: string }[];
  readonly exportValue: string;
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
    return { ok: true, value: {
      domain: "actions", mode: "source", graph, findings: sortFindings([...findings, ...scanSecrets(source, "workflow")]),
      summary: [{ label: "Jobs", value: String(workflow.jobs.length) }, { label: "Triggers", value: String(workflow.on.length) }], exportValue: source,
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
      findings: sortFindings([...analyzeCompose(parsed.value), ...scanSecrets(source, "compose.yaml")]),
      summary: [{ label: "Services", value: String(parsed.value.services.length) }, { label: "Links", value: String(parsed.value.graph.edges.length) }], exportValue: source } };
  }
  if (domain === "dockerfile") {
    const parsed = parseDockerfile(source);
    if (!parsed.ok) return parsed;
    return { ok: true, value: { domain, mode: "source", graph: parsed.value.graph,
      findings: sortFindings([...analyzeDockerfile(parsed.value), ...scanSecrets(source, "Dockerfile")]),
      summary: [{ label: "Stages", value: String(parsed.value.stages.length) }, { label: "Transfers", value: String(parsed.value.graph.edges.length) }], exportValue: source } };
  }
  if (domain === "kubernetes") {
    const parsed = parseKubernetes(source);
    if (!parsed.ok) return parsed;
    return { ok: true, value: { domain, mode: "source", graph: parsed.value.graph,
      findings: sortFindings([...analyzeKubernetes(parsed.value), ...scanSecrets(source, "manifests.yaml")]),
      summary: [{ label: "Resources", value: String(parsed.value.resources.length) }, { label: "Links", value: String(parsed.value.graph.edges.length) }, { label: "Raw retained", value: String(parsed.value.unmodeledDocuments) }], exportValue: source } }; // TOKEN_POLICY_BATCHED_EXECUTION
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
  }, null, 2);
  return { ok: true, value: { domain, mode: "review", graph: parsed.value.graph, findings: analyzeTerraformPlan(parsed.value),
    summary: Object.entries(parsed.value.summary).map(([label, value]) => ({ label, value: String(value) })), exportValue } };
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
    const plan: TerraformPlanReview = {
      mode: "review",
      sourceDigest: record.sourceDigest,
      formatVersion: record.formatVersion,
      terraformVersion: typeof record.terraformVersion === "string" ? record.terraformVersion : undefined,
      changes,
      graph: buildTerraformGraph(changes),
      summary: summarizeTerraformChanges(changes),
      summaryMetadata,
    };
    return { ok: true, value: {
      domain: "terraform",
      mode: "review",
      graph: plan.graph,
      findings: analyzeTerraformPlan(plan),
      summary: Object.entries(plan.summary).map(([label, value]) => ({ label, value: String(value) })),
      exportValue: JSON.stringify(plan, null, 2),
    } };
  } catch (error: unknown) {
    return { ok: false, error: { code: "INVALID_SHAPE", message: error instanceof Error ? error.message : "Invalid persisted Terraform review." } };
  }
}
