import { load } from "js-yaml";
import type { ArtifactGraph, Finding, ParseError, Result } from "@/lib/workbench/contracts";
import { createFinding, sortFindings } from "@/lib/workbench/findings";
import { checkArtifactSafety } from "@/lib/workbench/limits";
import { isRecord, stringList, stringMap, stringValue } from "@/lib/workbench/records";

export interface ComposeService {
  readonly name: string;
  readonly image?: string;
  readonly build?: string;
  readonly dependsOn: readonly string[];
  readonly ports: readonly string[];
  readonly privileged: boolean;
  readonly environment: Readonly<Record<string, string>>;
}

export interface ComposeDocument {
  readonly source: string;
  readonly services: readonly ComposeService[];
  readonly graph: ArtifactGraph;
}

function parseService(name: string, value: unknown): ComposeService {
  const service = isRecord(value) ? value : {};
  const rawBuild = service.build;
  const build = typeof rawBuild === "string"
    ? rawBuild
    : isRecord(rawBuild) ? stringValue(rawBuild, "context") : undefined;
  const rawDepends = service.depends_on;
  const dependsOn = isRecord(rawDepends) ? Object.keys(rawDepends) : stringList(rawDepends);
  return {
    name,
    image: stringValue(service, "image"),
    build,
    dependsOn: [...dependsOn].sort(),
    ports: stringList(service.ports),
    privileged: service.privileged === true,
    environment: stringMap(service.environment),
  };
}

export function parseCompose(source: string): Result<ComposeDocument, ParseError> {
  const limit = checkArtifactSafety(source, "compose");
  if (!limit.ok) return { ok: false, error: { code: limit.error.code === "ARTIFACT_TOO_LARGE" ? "ARTIFACT_TOO_LARGE" : "UNSAFE_INPUT", message: limit.error.message } };
  try {
    const parsed: unknown = load(source);
    if (!isRecord(parsed) || !isRecord(parsed.services)) {
      return { ok: false, error: { code: "INVALID_SHAPE", message: "Compose source must contain a services mapping." } };
    }
    const services = Object.entries(parsed.services).map(([name, value]) => parseService(name, value)).sort((a, b) => a.name.localeCompare(b.name));
    const graph: ArtifactGraph = {
      nodes: services.map((service) => ({ id: service.name, label: service.name, kind: "service", detail: service.image ?? service.build ?? "unconfigured" })),
      edges: services.flatMap((service) => service.dependsOn.map((dependency) => ({ from: service.name, to: dependency, label: "depends_on" }))),
    };
    return { ok: true, value: { source, services, graph } };
  } catch (error: unknown) {
    return { ok: false, error: { code: "INVALID_SYNTAX", message: error instanceof Error ? error.message : "Invalid Compose YAML." } };
  }
}

export function analyzeCompose(document: ComposeDocument): Finding[] {
  const findings: Finding[] = [];
  for (const service of document.services) {
    if (service.privileged) findings.push(createFinding({
      ruleId: "COMPOSE_PRIVILEGED", severity: "critical", title: "Privileged container",
      message: `${service.name} runs privileged. Remove privileged mode or document the narrow capability requirement.`,
      evidence: { artifact: service.name, path: `services.${service.name}.privileged` },
    }));
    if (service.image?.endsWith(":latest") || (service.image && !service.image.includes(":"))) findings.push(createFinding({
      ruleId: "COMPOSE_MUTABLE_TAG", severity: "warning", title: "Mutable image reference",
      message: `${service.name} should use a pinned image tag or digest.`, evidence: { artifact: service.name, path: `services.${service.name}.image` },
    }));
    for (const [name, value] of Object.entries(service.environment)) {
      if (/(password|token|secret|key)/i.test(name) && !/^\$\{[^}]+\}$/.test(value)) findings.push(createFinding({
        ruleId: "SECRET_LITERAL", severity: "critical", title: "Literal environment secret",
        message: `${name} contains a literal value. Use an environment or secret-file reference.`,
        evidence: { artifact: service.name, path: `services.${service.name}.environment.${name}`, excerpt: "[redacted]" },
      }));
    }
  }
  return sortFindings(findings);
}
