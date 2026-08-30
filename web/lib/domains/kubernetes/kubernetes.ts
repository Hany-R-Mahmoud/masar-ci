// TOKEN_POLICY_BATCHED_EXECUTION: include direct Pod specs in the bounded parser.
import { dump, loadAll } from "js-yaml";
import type { ArtifactGraph, Finding, FixPreview, ParseError, Result } from "@/lib/workbench/contracts";
import { createFinding, sortFindings } from "@/lib/workbench/findings";
import { checkArtifactSafety } from "@/lib/workbench/limits";
import { isRecord, recordValue, stringMap, stringValue } from "@/lib/workbench/records";

export interface KubernetesContainer {
  readonly name: string;
  readonly image?: string;
  readonly hasResources: boolean;
  readonly runsAsNonRoot: boolean;
}

export interface KubernetesResource {
  readonly id: string;
  readonly apiVersion: string;
  readonly kind: string;
  readonly name: string;
  readonly namespace: string;
  readonly labels: Readonly<Record<string, string>>;
  readonly selector: Readonly<Record<string, string>>;
  readonly containers: readonly KubernetesContainer[];
  readonly unsupportedFields: readonly string[];
}

export interface KubernetesRawDocument {
  readonly index: number;
  readonly source: string;
  readonly reason: string;
}

export interface KubernetesDocument {
  readonly source: string;
  readonly resources: readonly KubernetesResource[];
  readonly unmodeledDocuments: number;
  readonly rawDocuments: readonly KubernetesRawDocument[];
  readonly graph: ArtifactGraph;
}

function parseContainers(spec: Record<string, unknown>): KubernetesContainer[] {
  const template = recordValue(spec, "template")
    ?? (recordValue(spec, "jobTemplate") ? recordValue(recordValue(spec, "jobTemplate")!, "spec") : undefined);
  const podTemplate = template && recordValue(template, "template");
  const podSpec = podTemplate ? recordValue(podTemplate, "spec") : template ? recordValue(template, "spec") : undefined;
  const containers = podSpec?.containers ?? spec.containers;
  if (!Array.isArray(containers)) return [];
  const podSecurity = podSpec ? recordValue(podSpec, "securityContext") : undefined;
  return containers.filter(isRecord).map((container, index) => {
    const security = recordValue(container, "securityContext");
    return {
      name: stringValue(container, "name") ?? `container-${index + 1}`,
      image: stringValue(container, "image"),
      hasResources: isRecord(container.resources) && Object.keys(container.resources).length > 0,
      runsAsNonRoot: security?.runAsNonRoot === true || podSecurity?.runAsNonRoot === true,
    };
  });
}

function parseResource(value: unknown, index: number): KubernetesResource | undefined {
  if (!isRecord(value)) return undefined;
  const kind = stringValue(value, "kind");
  const metadata = recordValue(value, "metadata");
  const name = metadata ? stringValue(metadata, "name") : undefined;
  if (!kind || !name) return undefined;
  const spec = recordValue(value, "spec") ?? {};
  const matchLabels = recordValue(recordValue(spec, "selector") ?? {}, "matchLabels");
  const selector = kind === "Service" ? stringMap(spec.selector) : stringMap(matchLabels);
  const template = recordValue(spec, "template");
  const templateMetadata = template ? recordValue(template, "metadata") : undefined;
  const workloadLabels = templateMetadata ? stringMap(templateMetadata.labels) : {};
  return {
    id: `${kind}/${name}`,
    apiVersion: stringValue(value, "apiVersion") ?? "unknown",
    kind,
    name,
    namespace: metadata ? stringValue(metadata, "namespace") ?? "default" : "default",
    labels: Object.keys(workloadLabels).length > 0 ? workloadLabels : metadata ? stringMap(metadata.labels) : {},
    selector,
    containers: parseContainers(spec),
    unsupportedFields: Object.keys(value).filter((key) => !["apiVersion", "kind", "metadata", "spec", "stringData", "data", "type"].includes(key)).sort(),
  };
}

function selectorMatches(selector: Readonly<Record<string, string>>, labels: Readonly<Record<string, string>>): boolean {
  const entries = Object.entries(selector);
  return entries.length > 0 && entries.every(([key, value]) => labels[key] === value);
}

export function parseKubernetes(source: string): Result<KubernetesDocument, ParseError> {
  const limit = checkArtifactSafety(source, "kubernetes");
  if (!limit.ok) return { ok: false, error: { code: limit.error.code === "ARTIFACT_TOO_LARGE" ? "ARTIFACT_TOO_LARGE" : "UNSAFE_INPUT", message: limit.error.message } };
  try {
    const documents = loadAll(source);
    const parsedDocuments = documents.map(parseResource);
    const rawSources = source.split(/^---\s*$/m).map((document) => document.trim()).filter(Boolean);
    const rawDocuments = parsedDocuments.flatMap((resource, index) => resource ? [] : [{
      index,
      source: rawSources[index] ?? "",
      reason: "Document does not contain a supported kind and metadata.name pair.",
    }]);
    const resources = parsedDocuments.filter((resource): resource is KubernetesResource => resource !== undefined);
    const unmodeledDocuments = parsedDocuments.filter((resource) => resource === undefined).length;
    if (resources.length === 0) return { ok: false, error: { code: "INVALID_SHAPE", message: "No Kubernetes resources with kind and metadata.name were found." } };
    const edges = resources.flatMap((resource) => {
      if (resource.kind !== "Service") return [];
      return resources.filter((candidate) => candidate.kind === "Deployment" && candidate.namespace === resource.namespace && selectorMatches(resource.selector, candidate.labels))
        .map((candidate) => ({ from: resource.id, to: candidate.id, label: "selects" }));
    });
    return { ok: true, value: {
      source,
      resources,
      unmodeledDocuments,
      rawDocuments,
      graph: { nodes: resources.map((resource) => ({ id: resource.id, label: resource.name, kind: resource.kind, detail: resource.namespace })), edges },
    } };
  } catch (error: unknown) {
    return { ok: false, error: { code: "INVALID_SYNTAX", message: error instanceof Error ? error.message : "Invalid Kubernetes YAML." } };
  }
}

/** Preserve imported manifests (including CRDs and extension fields) by default. */
export function serializeKubernetes(document: KubernetesDocument, options: { canonical?: boolean } = {}): string {
  if (!options.canonical) return document.source;
  const parsed = loadAll(document.source);
  return parsed.map((value) => dump(value, { noRefs: true, lineWidth: -1, sortKeys: false }).trimEnd()).join("\n---\n") + "\n";
}

/** Deterministic previews for the safe, local Kubernetes policy remediations. */
export function previewKubernetesFix(source: string, ruleId: string, resourceId?: string, containerName?: string): FixPreview {
  const parsed = parseKubernetes(source);
  if (!parsed.ok) return { status: "unavailable", summary: "Kubernetes source must parse before a fix can be previewed." };
  const resource = parsed.value.resources.find((candidate) => candidate.id === resourceId) ?? parsed.value.resources.find((candidate) => candidate.containers.length > 0);
  const container = resource?.containers.find((candidate) => candidate.name === containerName) ?? resource?.containers[0];
  if (!resource || !container) return { status: "unavailable", summary: "No modeled workload container is available for this fix." };
  const escapedResource = resource.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedContainer = container.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  let after = source;
  if (ruleId === "K8S_IMAGE_MUTABLE" && container.image) {
    const stableImage = container.image.replace(/:latest$/, ":stable").replace(/^(.*?)(?::[^:@/]+)?$/, "$1:stable");
    after = source.replace(container.image, stableImage);
  } else if (ruleId === "K8S_ROOT_DEFAULT") {
    const resourcePattern = new RegExp(`(kind:\\s*${escapedResource.includes("/") ? escapedResource.split("/")[0] : "(?:Deployment|StatefulSet|DaemonSet|Job|CronJob)"}[\\s\\S]*?spec:\\s*)`);
    after = resourcePattern.test(source) ? source.replace(resourcePattern, "$1\n  securityContext:\n    runAsNonRoot: true\n") : `${source.trimEnd()}\n`;
  } else if (ruleId === "K8S_MISSING_RESOURCES") {
    const containerPattern = new RegExp(`(name:\\s*${escapedContainer}[\\s\\S]*?image:\\s*[^\\n]+)`);
    after = source.replace(containerPattern, "$1\n          resources:\n            requests:\n              cpu: 100m\n              memory: 128Mi\n            limits:\n              cpu: 500m\n              memory: 512Mi");
  } else {
    return { status: "unavailable", summary: `No automated Kubernetes preview is available for ${ruleId}.` };
  }
  return { status: after === source ? "unavailable" : "available", summary: `Preview ${ruleId} remediation for ${resource.id}.`, before: source, after };
}

export function analyzeKubernetes(document: KubernetesDocument): Finding[] {
  const findings: Finding[] = [];
  if (document.unmodeledDocuments > 0) findings.push(createFinding({
    ruleId: "K8S_RAW_DOCUMENT_RETAINED", severity: "info", title: "Raw document retained",
    message: `${document.unmodeledDocuments} YAML document(s) could not be structurally modeled and remain unchanged in source mode.`, evidence: { path: "multi-document source" },
  }));
  for (const resource of document.resources) {
    for (const container of resource.containers) {
      if (container.image?.endsWith(":latest") || (container.image && !container.image.includes(":"))) findings.push(createFinding({
        ruleId: "K8S_IMAGE_MUTABLE", severity: "warning", title: "Mutable workload image",
        message: `${container.name} should use a pinned tag or digest.`, evidence: { artifact: resource.id, path: `containers.${container.name}.image` },
      }));
      if (!container.hasResources) findings.push(createFinding({
        ruleId: "K8S_MISSING_RESOURCES", severity: "warning", title: "Missing resource policy",
        message: `${container.name} has no CPU or memory requests/limits.`, evidence: { artifact: resource.id, path: `containers.${container.name}.resources` },
      }));
      if (!container.runsAsNonRoot) findings.push(createFinding({
        ruleId: "K8S_ROOT_DEFAULT", severity: "warning", title: "Root identity is not prohibited",
        message: `${container.name} does not declare runAsNonRoot.`, evidence: { artifact: resource.id, path: `containers.${container.name}.securityContext` },
      }));
    }
  }
  return sortFindings(findings);
}
