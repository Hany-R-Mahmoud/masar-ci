// TOKEN_POLICY_BATCHED_EXECUTION: terraform contract batch.
import type { AnalysisMetadata, ArtifactGraph, Finding, ParseError, Result } from "@/lib/workbench/contracts";
import { stableDigest } from "@/lib/workbench/digest";
import { createFinding, sortFindings } from "@/lib/workbench/findings";
import { checkArtifactLimits, checkArtifactSafety, DEFAULT_ARTIFACT_LIMITS } from "@/lib/workbench/limits";
import { isRecord, recordValue, stringList, stringValue } from "@/lib/workbench/records";

export type TerraformAction = "create" | "update" | "delete" | "no-op" | "read" | "replace";
export const TERRAFORM_ANALYZER_VERSION = "terraform-plan-analyzer/v1";
export const TERRAFORM_POLICY_VERSION = "terraform-static-policy/v1";

export interface TerraformChange {
  readonly address: string;
  readonly type: string;
  readonly name: string;
  readonly actions: readonly TerraformAction[];
  readonly sensitive: boolean;
  readonly references: readonly string[];
}

export type TerraformSummary = Readonly<Record<"create" | "update" | "delete" | "replace", number>>;

export interface TerraformSummaryMetadata extends AnalysisMetadata {
  /** Stable binding used to reject decisions copied to another review snapshot. */
  readonly decisionKey: string;
}

export interface TerraformPlanReview {
  readonly mode: "review";
  readonly sourceDigest: string;
  readonly formatVersion: string;
  readonly terraformVersion?: string;
  readonly changes: readonly TerraformChange[];
  readonly graph: ArtifactGraph;
  readonly summary: TerraformSummary;
  readonly summaryMetadata: TerraformSummaryMetadata;
}

function hasSensitive(value: unknown): boolean {
  if (value === true) return true;
  if (Array.isArray(value)) return value.some(hasSensitive);
  return isRecord(value) && Object.values(value).some(hasSensitive);
}

function normalizeActions(value: unknown): TerraformAction[] {
  const actions = stringList(value);
  if (actions.includes("delete") && actions.includes("create")) return ["replace"];
  return actions.filter((action): action is TerraformAction => ["create", "update", "delete", "no-op", "read"].includes(action));
}

function collectReferences(value: unknown): string[] {
  const references: string[] = [];
  const visit = (candidate: unknown): void => {
    if (Array.isArray(candidate)) {
      candidate.forEach(visit);
      return;
    }
    if (!isRecord(candidate)) return;
    for (const [key, child] of Object.entries(candidate)) {
      if (key === "references" && Array.isArray(child)) {
        child.forEach((reference) => {
          if (typeof reference === "string" && reference.length > 0) references.push(reference);
        });
      } else {
        visit(child);
      }
    }
  };
  visit(value);
  return [...new Set(references)].sort();
}

function collectConfigurationReferences(value: unknown, output = new Map<string, readonly string[]>()): Map<string, readonly string[]> {
  if (!isRecord(value)) return output;
  const resources = value.resources;
  if (Array.isArray(resources)) {
    for (const resource of resources) {
      if (!isRecord(resource)) continue;
      const address = stringValue(resource, "address");
      if (address) output.set(address, collectReferences(resource));
    }
  }
  const childModules = value.child_modules;
  if (Array.isArray(childModules)) childModules.forEach((module) => collectConfigurationReferences(module, output));
  return output;
}

function parseChange(value: unknown, configuredReferences: readonly string[] = []): TerraformChange | undefined {
  if (!isRecord(value)) return undefined;
  const address = stringValue(value, "address");
  const type = stringValue(value, "type");
  const name = stringValue(value, "name");
  const change = recordValue(value, "change");
  if (!address || !type || !name || !change) return undefined;
  const directReferences = collectReferences(recordValue(value, "configuration"));
  return {
    address,
    type,
    name,
    actions: normalizeActions(change.actions),
    sensitive: hasSensitive(change.before_sensitive) || hasSensitive(change.after_sensitive),
    references: [...new Set([...configuredReferences, ...directReferences])].sort(),
  };
}

function resolveAddress(reference: string, addresses: ReadonlySet<string>): string | undefined {
  let candidate = reference;
  while (candidate.length > 0) {
    if (addresses.has(candidate)) return candidate;
    const separator = candidate.lastIndexOf(".");
    if (separator < 0) return undefined;
    candidate = candidate.slice(0, separator);
  }
  return undefined;
}

export function summarizeTerraformChanges(changes: readonly TerraformChange[]): TerraformSummary {
  return {
    create: changes.filter((change) => change.actions.includes("create")).length,
    update: changes.filter((change) => change.actions.includes("update")).length,
    delete: changes.filter((change) => change.actions.includes("delete")).length,
    replace: changes.filter((change) => change.actions.includes("replace")).length,
  };
}

export function buildTerraformDependencyEdges(changes: readonly TerraformChange[]): ArtifactGraph["edges"] {
  const addresses = new Set(changes.map((change) => change.address));
  const edges = changes.flatMap((change) => change.references.flatMap((reference) => {
    const dependency = resolveAddress(reference, addresses);
    return dependency && dependency !== change.address
      ? [{ from: change.address, to: dependency, label: "references" }]
      : [];
  }));
  return [...new Map(edges.map((edge) => [`${edge.from}:${edge.to}:${edge.label}`, edge])).values()]
    .sort((left, right) => left.from.localeCompare(right.from) || left.to.localeCompare(right.to) || left.label.localeCompare(right.label));
}

export function buildTerraformGraph(changes: readonly TerraformChange[]): ArtifactGraph {
  return {
    nodes: changes.map((change) => ({ id: change.address, label: change.name, kind: change.type, detail: change.actions.join(" + ") })),
    edges: buildTerraformDependencyEdges(changes),
  };
}

export function parseTerraformPlan(source: string): Result<TerraformPlanReview, ParseError> {
  const limit = checkArtifactSafety(source, "terraform");
  if (!limit.ok) return { ok: false, error: { code: limit.error.code === "ARTIFACT_TOO_LARGE" ? "ARTIFACT_TOO_LARGE" : "UNSAFE_INPUT", message: limit.error.message } };
  try {
    const parsed: unknown = JSON.parse(source);
    if (!isRecord(parsed)) return { ok: false, error: { code: "INVALID_SHAPE", message: "Terraform plan JSON must be an object." } };
    const formatVersion = stringValue(parsed, "format_version");
    if (!formatVersion || !/^1(?:\.|$)/.test(formatVersion)) {
      return { ok: false, error: { code: "UNSUPPORTED_VERSION", message: `Unsupported Terraform plan format ${formatVersion ?? "unknown"}; expected 1.x.` } };
    }
    const rawChanges = parsed.resource_changes;
    if (!Array.isArray(rawChanges)) return { ok: false, error: { code: "INVALID_SHAPE", message: "Terraform plan has no resource_changes array." } };
    // TOKEN_POLICY_BATCHED_EXECUTION: normalize configuration references once.
    const configuration = recordValue(parsed, "configuration");
    const configuredReferences = collectConfigurationReferences(configuration ? recordValue(configuration, "root_module") : undefined);
    const changes = rawChanges.map((change) => {
      const address = isRecord(change) ? stringValue(change, "address") : undefined;
      return parseChange(change, address ? configuredReferences.get(address) : undefined);
    }).filter((change): change is TerraformChange => change !== undefined).sort((a, b) => a.address.localeCompare(b.address));
    const nodeLimit = checkArtifactLimits(source, DEFAULT_ARTIFACT_LIMITS, changes.length);
    if (!nodeLimit.ok) return { ok: false, error: { code: "ARTIFACT_TOO_LARGE", message: nodeLimit.error.message } };
    const summary = summarizeTerraformChanges(changes);
    const graph = buildTerraformGraph(changes);
    const limitations = ["Static plan review only; no execution, provider refresh, or authoritative cost estimate."];
    const assumptions = ["Dependency edges represent declared configuration references that resolve to resources in this plan."];
    const sourceDigest = stableDigest(source);
    const summaryMetadata: TerraformSummaryMetadata = {
      artifactDigest: sourceDigest,
      analyzerVersion: TERRAFORM_ANALYZER_VERSION,
      policyVersion: TERRAFORM_POLICY_VERSION,
      assumptions,
      limitations,
      decisionKey: stableDigest(`${sourceDigest}:${TERRAFORM_ANALYZER_VERSION}:${TERRAFORM_POLICY_VERSION}`),
    };
    return { ok: true, value: {
      mode: "review",
      sourceDigest,
      formatVersion,
      terraformVersion: stringValue(parsed, "terraform_version"),
      changes,
      summary,
      graph,
      summaryMetadata,
    } };
  } catch (error: unknown) {
    return { ok: false, error: { code: "INVALID_SYNTAX", message: error instanceof Error ? error.message : "Invalid Terraform plan JSON." } };
  }
}

export function analyzeTerraformPlan(plan: TerraformPlanReview): Finding[] {
  const limitations = plan.summaryMetadata.limitations;
  const assumptions = plan.summaryMetadata.assumptions;
  const findings = plan.changes.flatMap((change) => {
    if (change.actions.includes("replace")) return [createFinding({
      ruleId: "TF_REPLACE_RESOURCE", category: "reliability", confidence: "exact", severity: "critical", title: "Resource replacement",
      message: `${change.address} will be destroyed and recreated. Review dependency and availability impact.`, evidence: { artifact: change.address, path: "change.actions" },
      assumptions, limitations, analyzerVersion: TERRAFORM_ANALYZER_VERSION, policyVersion: TERRAFORM_POLICY_VERSION,
      remediation: { kind: "review", summary: "Review the replacement blast radius before approving this plan.", steps: ["Inspect dependants and before/after values", "Confirm an availability and rollback plan"], safeToApply: false },
    })];
    if (change.actions.includes("delete")) return [createFinding({
      ruleId: "TF_DELETE_RESOURCE", category: "reliability", confidence: "exact", severity: "critical", title: "Resource deletion",
      message: `${change.address} will be deleted.`, evidence: { artifact: change.address, path: "change.actions" },
      assumptions, limitations, analyzerVersion: TERRAFORM_ANALYZER_VERSION, policyVersion: TERRAFORM_POLICY_VERSION,
      remediation: { kind: "review", summary: "Confirm the deletion is intentional and recoverable.", steps: ["Inspect dependants and retained backups", "Record an explicit review decision"], safeToApply: false },
    })];
    return [];
  });
  return sortFindings(findings);
}
