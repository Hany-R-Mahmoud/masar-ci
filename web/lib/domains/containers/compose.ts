// TOKEN_POLICY_BATCHED_EXECUTION: Compose env and override support is a bounded follow-up.
import { dump, load } from "js-yaml";
import type { ArtifactGraph, Finding, FixPreview, ParseError, Result } from "@/lib/workbench/contracts";
import { createFinding, sortFindings } from "@/lib/workbench/findings";
import { checkArtifactSafety } from "@/lib/workbench/limits";
import { isRecord, stringList, stringMap, stringValue } from "@/lib/workbench/records";

// TOKEN_POLICY_BATCHED_EXECUTION: env examples and file overlays are bounded helpers.

export interface ComposeService {
  readonly name: string;
  readonly image?: string;
  readonly build?: string;
  readonly dependsOn: readonly string[];
  readonly ports: readonly string[];
  readonly privileged: boolean;
  readonly environment: Readonly<Record<string, string>>;
  readonly volumes: readonly string[];
  readonly networks: readonly string[];
  readonly profiles: readonly string[];
  readonly configs: readonly string[];
  readonly secrets: readonly string[];
  readonly expose: readonly string[];
  readonly restart?: string;
  readonly command?: string | readonly string[];
  readonly healthcheck?: ComposeHealthcheck;
  /** Fields outside the bounded model are reported, while `source` remains lossless. */
  readonly unsupportedFields: readonly string[];
  readonly extends?: ComposeExtends;
}

export interface ComposeExtends {
  readonly service: string;
  readonly file?: string;
}

export interface ComposeHealthcheck {
  readonly test?: readonly string[];
  readonly interval?: string;
  readonly timeout?: string;
  readonly retries?: number;
  readonly startPeriod?: string;
  readonly disable?: boolean;
}

export interface ComposeDocument {
  readonly source: string;
  readonly services: readonly ComposeService[];
  readonly graph: ArtifactGraph;
  readonly version?: string;
  readonly topLevelNetworks: readonly string[];
  readonly topLevelVolumes: readonly string[];
  readonly topLevelConfigs: readonly string[];
  readonly topLevelSecrets: readonly string[];
  readonly unsupportedFields: readonly string[];
}

function parseService(name: string, value: unknown): ComposeService {
  const service = isRecord(value) ? value : {};
  const rawBuild = service.build;
  const build = typeof rawBuild === "string"
    ? rawBuild
    : isRecord(rawBuild) ? stringValue(rawBuild, "context") : undefined;
  const rawDepends = service.depends_on;
  const dependsOn = isRecord(rawDepends) ? Object.keys(rawDepends) : stringList(rawDepends);
  const rawCommand = service.command;
  const command = typeof rawCommand === "string"
    ? rawCommand
    : Array.isArray(rawCommand) && rawCommand.every((item) => typeof item === "string")
      ? rawCommand
      : undefined;
  const rawHealthcheck = service.healthcheck;
  const healthcheck = isRecord(rawHealthcheck)
    ? {
      test: stringList(rawHealthcheck.test),
      interval: stringValue(rawHealthcheck, "interval"),
      timeout: stringValue(rawHealthcheck, "timeout"),
      retries: typeof rawHealthcheck.retries === "number" ? rawHealthcheck.retries : undefined,
      startPeriod: stringValue(rawHealthcheck, "start_period"),
      disable: rawHealthcheck.disable === true,
    }
    : undefined;
  const rawExtends = service.extends;
  const extendsValue = typeof rawExtends === "string"
    ? { service: rawExtends }
    : isRecord(rawExtends) && stringValue(rawExtends, "service")
      ? { service: stringValue(rawExtends, "service")!, file: stringValue(rawExtends, "file") }
      : undefined;
  const modeled = new Set(["image", "build", "depends_on", "ports", "privileged", "environment", "volumes", "networks", "profiles", "configs", "secrets", "expose", "restart", "command", "healthcheck", "extends"]);
  return {
    name,
    image: stringValue(service, "image"),
    build,
    dependsOn: [...dependsOn].sort(),
    ports: stringList(service.ports),
    privileged: service.privileged === true,
    environment: stringMap(service.environment),
    volumes: stringList(service.volumes),
    networks: isRecord(service.networks) ? Object.keys(service.networks).sort() : stringList(service.networks),
    profiles: stringList(service.profiles),
    configs: isRecord(service.configs) ? Object.keys(service.configs).sort() : stringList(service.configs),
    secrets: isRecord(service.secrets) ? Object.keys(service.secrets).sort() : stringList(service.secrets),
    expose: stringList(service.expose),
    restart: stringValue(service, "restart"),
    command,
    healthcheck,
    unsupportedFields: Object.keys(service).filter((key) => !modeled.has(key)).sort(),
    extends: extendsValue,
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
    const topLevel = (key: string): readonly string[] => {
      const value = parsed[key];
      return isRecord(value) ? Object.keys(value).sort() : [];
    };
    const modeledTopLevel = new Set(["version", "services", "networks", "volumes", "configs", "secrets", "name"]);
    const graph: ArtifactGraph = {
      nodes: services.map((service) => ({ id: service.name, label: service.name, kind: "service", detail: service.image ?? service.build ?? "unconfigured" })),
      edges: services.flatMap((service) => [
        ...service.dependsOn.map((dependency) => ({ from: service.name, to: dependency, label: "depends_on" })),
        ...(service.extends ? [{ from: service.name, to: service.extends.service, label: "extends" }] : []),
      ]),
    };
    return { ok: true, value: {
      source,
      services,
      graph,
      version: stringValue(parsed, "version"),
      topLevelNetworks: topLevel("networks"),
      topLevelVolumes: topLevel("volumes"),
      topLevelConfigs: topLevel("configs"),
      topLevelSecrets: topLevel("secrets"),
      unsupportedFields: Object.keys(parsed).filter((key) => !modeledTopLevel.has(key)).sort(),
    } };
  } catch (error: unknown) {
    return { ok: false, error: { code: "INVALID_SYNTAX", message: error instanceof Error ? error.message : "Invalid Compose YAML." } };
  }
}

/**
 * Compose source is intentionally lossless. Returning the imported source by default
 * means unknown extension fields and comments survive a parse/serialize round trip.
 * The canonical option is useful for generated documents and remains deterministic.
 */
export function serializeCompose(document: ComposeDocument, options: { canonical?: boolean } = {}): string {
  if (!options.canonical) return document.source;
  const value: Record<string, unknown> = {
    ...(document.version ? { version: document.version } : {}),
    services: Object.fromEntries(document.services.map((service) => [service.name, {
      ...(service.image ? { image: service.image } : {}),
      ...(service.build ? { build: service.build } : {}),
      ...(service.ports.length ? { ports: [...service.ports] } : {}),
      ...(service.expose.length ? { expose: [...service.expose] } : {}),
      ...(service.dependsOn.length ? { depends_on: [...service.dependsOn] } : {}),
      ...(Object.keys(service.environment).length ? { environment: service.environment } : {}),
      ...(service.volumes.length ? { volumes: [...service.volumes] } : {}),
      ...(service.networks.length ? { networks: [...service.networks] } : {}),
      ...(service.profiles.length ? { profiles: [...service.profiles] } : {}),
      ...(service.configs.length ? { configs: [...service.configs] } : {}),
      ...(service.secrets.length ? { secrets: [...service.secrets] } : {}),
      ...(service.restart ? { restart: service.restart } : {}),
      ...(service.command !== undefined ? { command: service.command } : {}),
      ...(service.privileged ? { privileged: true } : {}),
      ...(service.healthcheck ? { healthcheck: {
        ...(service.healthcheck.test?.length ? { test: [...service.healthcheck.test] } : {}),
        ...(service.healthcheck.interval ? { interval: service.healthcheck.interval } : {}),
        ...(service.healthcheck.timeout ? { timeout: service.healthcheck.timeout } : {}),
        ...(service.healthcheck.retries !== undefined ? { retries: service.healthcheck.retries } : {}),
        ...(service.healthcheck.startPeriod ? { start_period: service.healthcheck.startPeriod } : {}),
        ...(service.healthcheck.disable ? { disable: true } : {}),
      } } : {}),
    }])),
    ...(document.topLevelNetworks.length ? { networks: Object.fromEntries(document.topLevelNetworks.map((name) => [name, {}])) } : {}),
    ...(document.topLevelVolumes.length ? { volumes: Object.fromEntries(document.topLevelVolumes.map((name) => [name, {}])) } : {}),
    ...(document.topLevelConfigs.length ? { configs: Object.fromEntries(document.topLevelConfigs.map((name) => [name, {}])) } : {}),
    ...(document.topLevelSecrets.length ? { secrets: Object.fromEntries(document.topLevelSecrets.map((name) => [name, {}])) } : {}),
  };
  return dump(value, { noRefs: true, lineWidth: -1, sortKeys: false });
}

/** Build a safe, deterministic preview for the bounded Compose policy fixes. */
// TOKEN_POLICY_BATCHED_EXECUTION: env examples and file overlays are bounded helpers.
export function previewComposeFix(source: string, ruleId: string, serviceName?: string): FixPreview {
  const parsed = parseCompose(source);
  if (!parsed.ok) return { status: "unavailable", summary: "Compose source must parse before a fix can be previewed." };
  const service = parsed.value.services.find((candidate) => candidate.name === serviceName) ?? parsed.value.services[0];
  if (!service) return { status: "unavailable", summary: "No Compose service is available for this fix." };
  let after = source;
  if (ruleId === "COMPOSE_PRIVILEGED") {
    after = source.replace(new RegExp(`(\\n[ \\t]+${service.name.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}:\\n(?:[ \\t]+[^\\n]*\\n)*?)[ \\t]+privileged:\\s*true\\s*\\n?`), "$1");
  } else if (ruleId === "COMPOSE_MUTABLE_TAG" && service.image) {
    const stableImage = service.image.replace(/:latest$/, ":stable").replace(/^(.*?)(?::[^:@/]+)?$/, "$1:stable");
    after = source.replace(service.image, stableImage);
  } else if (ruleId === "SECRET_LITERAL") {
    const secret = Object.keys(service.environment).find((name) => /(password|token|secret|key)/i.test(name));
    if (!secret) return { status: "unavailable", summary: "No literal environment secret was found." };
    after = source.replace(new RegExp(`(\\b${secret.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}:\\s*)[^\\n]+`), "$1${" + secret + "}");
  } else {
    return { status: "unavailable", summary: `No automated Compose preview is available for ${ruleId}.` };
  }
  return { status: after === source ? "unavailable" : "available", summary: `Preview ${ruleId} remediation for ${service.name}.`, before: source, after };
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

type ComposeEnvValue = string | undefined;

function composeEnvironment(value: unknown): Map<string, ComposeEnvValue> {
  const entries = new Map<string, ComposeEnvValue>();
  if (isRecord(value)) {
    for (const [key, raw] of Object.entries(value)) entries.set(key, typeof raw === "string" || raw === undefined || raw === null ? raw ?? undefined : String(raw));
  } else if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item !== "string") continue;
      const separator = item.indexOf("=");
      const key = separator < 0 ? item : item.slice(0, separator);
      if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) entries.set(key, separator < 0 ? undefined : item.slice(separator + 1));
    }
  }
  return entries;
}

function isSecretEnvironmentKey(key: string): boolean {
  return /(password|token|secret|private[_-]?key|credential|api[_-]?key)/i.test(key);
}

function isInterpolation(value: ComposeEnvValue): boolean {
  return value !== undefined && /^\$\{[^}]+\}$/.test(value.trim());
}

/** Generate a deterministic, secret-free `.env.example` from service declarations. */
export function generateComposeEnvExample(source: string): Result<string, ParseError> {
  const parsed = parseCompose(source);
  if (!parsed.ok) return parsed;
  const raw = load(source);
  if (!isRecord(raw) || !isRecord(raw.services)) return { ok: false, error: { code: "INVALID_SHAPE", message: "Compose source must contain a services mapping." } };
  const variables = new Map<string, ComposeEnvValue>();
  for (const service of Object.values(raw.services)) {
    if (!isRecord(service)) continue;
    for (const [key, value] of composeEnvironment(service.environment)) {
      const safeValue = isSecretEnvironmentKey(key) || isInterpolation(value) ? undefined : value;
      if (!variables.has(key) || variables.get(key) === undefined) variables.set(key, safeValue);
    }
  }
  const lines = [...variables.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value ?? ""}`);
  return { ok: true, value: lines.length ? `${lines.join("\n")}\n` : "" };
}

function mergeComposeValue(base: unknown, override: unknown): unknown {
  if (isRecord(base) && isRecord(override)) {
    const merged: Record<string, unknown> = { ...base };
    for (const [key, value] of Object.entries(override)) merged[key] = key in merged ? mergeComposeValue(merged[key], value) : value;
    return merged;
  }
  // Override sequences are replaced to keep generated output deterministic.
  return override;
}

/** Merge a base Compose file and an override file without daemon or filesystem access. */
export function mergeComposeSources(baseSource: string, overrideSource: string): Result<string, ParseError> {
  const base = parseCompose(baseSource);
  if (!base.ok) return base;
  const override = parseCompose(overrideSource);
  if (!override.ok) return override;
  try {
    const merged = mergeComposeValue(load(baseSource), load(overrideSource));
    return { ok: true, value: dump(merged, { noRefs: true, lineWidth: -1, sortKeys: true }) };
  } catch (error: unknown) {
    return { ok: false, error: { code: "INVALID_SYNTAX", message: error instanceof Error ? error.message : "Invalid Compose override YAML." } };
  }
}

export const createComposeEnvExample = generateComposeEnvExample;
export const mergeCompose = mergeComposeSources;
