import type { ArtifactGraph, Finding, FixPreview, ParseError, Result } from "@/lib/workbench/contracts";
import { createFinding, sortFindings } from "@/lib/workbench/findings";
import { checkArtifactSafety } from "@/lib/workbench/limits";

export interface DockerInstruction {
  readonly line: number;
  readonly command: string;
  readonly value: string;
  readonly raw?: string;
}

export interface DockerStage {
  readonly id: string;
  readonly base: string;
  readonly instructions: readonly DockerInstruction[];
}

export interface DockerfileDocument {
  readonly source: string;
  readonly stages: readonly DockerStage[];
  readonly graph: ArtifactGraph;
  readonly directives: Readonly<Record<string, string>>;
  readonly unsupportedInstructions: readonly string[];
}

const knownInstructions = new Set([
  "ADD", "ARG", "CMD", "COPY", "ENTRYPOINT", "ENV", "EXPOSE", "FROM", "HEALTHCHECK", "LABEL",
  "MAINTAINER", "ONBUILD", "RUN", "SHELL", "STOPSIGNAL", "USER", "VOLUME", "WORKDIR",
]);

export function parseDockerfile(source: string): Result<DockerfileDocument, ParseError> {
  const limit = checkArtifactSafety(source, "dockerfile");
  if (!limit.ok) return { ok: false, error: { code: limit.error.code === "ARTIFACT_TOO_LARGE" ? "ARTIFACT_TOO_LARGE" : "UNSAFE_INPUT", message: limit.error.message } };
  const directives: Record<string, string> = {};
  const logicalLines: { line: number; text: string }[] = [];
  const physicalLines = source.split(/\r?\n/);
  for (let index = 0; index < physicalLines.length; index += 1) {
    const rawLine = physicalLines[index];
    const trimmed = rawLine.trim();
    if (/^#\s*[^=]+=/i.test(trimmed)) {
      const match = trimmed.match(/^#\s*([^=]+)=\s*(.*)$/);
      if (match?.[1]) directives[match[1].trim().toLowerCase()] = match[2] ?? "";
      continue;
    }
    if (trimmed === "" || trimmed.startsWith("#")) continue;
    let text = rawLine;
    const line = index + 1;
    while (/\\\s*$/.test(text) && index + 1 < physicalLines.length) {
      text = `${text.replace(/\\\s*$/, "")} ${physicalLines[index + 1].trimStart()}`;
      index += 1;
    }
    logicalLines.push({ line, text });
  }
  const stages: { id: string; base: string; instructions: DockerInstruction[] }[] = [];
  const unsupportedInstructions = new Set<string>();
  for (const logical of logicalLines) {
    const index = logical.line - 1;
    const rawLine = logical.text;
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#")) continue;
    const split = line.indexOf(" ");
    const command = (split === -1 ? line : line.slice(0, split)).toUpperCase();
    const value = split === -1 ? "" : line.slice(split + 1).trim();
    if (command === "FROM") {
      const match = value.match(/^(?:(--platform=\S+)\s+)?(\S+)(?:\s+AS\s+(\S+))?$/i);
      if (!match?.[2]) return { ok: false, error: { code: "INVALID_SYNTAX", message: `Invalid FROM instruction on line ${index + 1}.` } };
      const base = match[2];
      const alias = match[3];
      if (!base) return { ok: false, error: { code: "INVALID_SYNTAX", message: `Invalid FROM instruction on line ${index + 1}.` } };
      stages.push({ id: alias ?? `stage-${stages.length + 1}`, base, instructions: [] });
      continue;
    }
    const stage = stages.at(-1);
    if (!stage) return { ok: false, error: { code: "INVALID_SHAPE", message: "Dockerfile instructions must follow a FROM instruction." } };
    if (!knownInstructions.has(command)) unsupportedInstructions.add(command);
    stage.instructions.push({ line: index + 1, command, value, raw: rawLine });
  }
  if (stages.length === 0) return { ok: false, error: { code: "INVALID_SHAPE", message: "Dockerfile must contain at least one FROM instruction." } };
  const edges = stages.flatMap((stage) => stage.instructions.flatMap((instruction) => {
    if (instruction.command !== "COPY") return [];
    const match = instruction.value.match(/--from=(\S+)/);
    return match?.[1] ? [{ from: match[1], to: stage.id, label: "copies into" }] : [];
  }));
  return { ok: true, value: {
    source,
    stages,
    directives,
    unsupportedInstructions: [...unsupportedInstructions].sort(),
    graph: { nodes: stages.map((stage) => ({ id: stage.id, label: stage.id, kind: "stage", detail: stage.base })), edges },
  } };
}

/** Preserve exact imported Dockerfile text unless a caller explicitly requests a canonical form. */
export function serializeDockerfile(document: DockerfileDocument, options: { canonical?: boolean } = {}): string {
  if (!options.canonical) return document.source;
  const directives = Object.entries(document.directives).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `# ${key}=${value}`);
  const stages = document.stages.flatMap((stage) => [
    `FROM ${stage.base}${/^stage-\d+$/.test(stage.id) ? "" : ` AS ${stage.id}`}`,
    ...stage.instructions.map((instruction) => `${instruction.command}${instruction.value ? ` ${instruction.value}` : ""}`),
  ]);
  return [...directives, ...stages, ""].join("\n");
}

/** Build deterministic, source-preserving previews for safe Dockerfile remediations. */
export function previewDockerfileFix(source: string, ruleId: string, stageId?: string): FixPreview {
  const parsed = parseDockerfile(source);
  if (!parsed.ok) return { status: "unavailable", summary: "Dockerfile must parse before a fix can be previewed." };
  const stage = parsed.value.stages.find((candidate) => candidate.id === stageId) ?? parsed.value.stages[0];
  if (!stage) return { status: "unavailable", summary: "No Dockerfile stage is available for this fix." };
  let after = source;
  if (ruleId === "DOCKER_ROOT_USER") {
    after = `${source.trimEnd()}\nUSER nobody\n`;
  } else if (ruleId === "DOCKER_MUTABLE_BASE") {
    const stableBase = stage.base.replace(/:latest$/, ":stable").replace(/^(.*?)(?::[^:@/]+)?$/, "$1:stable");
    after = source.replace(stage.base, stableBase);
  } else {
    return { status: "unavailable", summary: `No automated Dockerfile preview is available for ${ruleId}.` };
  }
  return { status: after === source ? "unavailable" : "available", summary: `Preview ${ruleId} remediation for ${stage.id}.`, before: source, after };
}

export function analyzeDockerfile(document: DockerfileDocument): Finding[] {
  const findings: Finding[] = [];
  for (const stage of document.stages) {
    if (stage.base.endsWith(":latest") || (!stage.base.includes(":") && !stage.base.includes("@sha256:"))) findings.push(createFinding({
      ruleId: "DOCKER_MUTABLE_BASE", severity: "warning", title: "Mutable base image",
      message: `${stage.base} is not pinned to a stable tag or digest.`, evidence: { artifact: stage.id, path: "FROM" },
    }));
    const user = stage.instructions.filter((instruction) => instruction.command === "USER").at(-1);
    if (!user || user.value === "root" || user.value === "0") findings.push(createFinding({
      ruleId: "DOCKER_ROOT_USER", severity: "warning", title: "Root runtime identity",
      message: `${stage.id} does not establish a non-root USER.`, evidence: { artifact: stage.id, path: "USER" },
    }));
    const copyAll = stage.instructions.findIndex((instruction) => instruction.command === "COPY" && /^\.\s+\.?\/?\.?$/.test(instruction.value));
    const install = stage.instructions.findIndex((instruction) => instruction.command === "RUN" && /(?:npm|pnpm|yarn)\s+(?:ci|install)/.test(instruction.value));
    if (copyAll !== -1 && install > copyAll) findings.push(createFinding({
      ruleId: "DOCKER_CACHE_COPY", severity: "info", title: "Cache-hostile copy order",
      message: "Copy dependency manifests and install dependencies before copying the full context.", evidence: { artifact: stage.id, path: "COPY" },
    }));
  }
  return sortFindings(findings);
}
