import type { ArtifactGraph, Finding, ParseError, Result } from "@/lib/workbench/contracts";
import { createFinding, sortFindings } from "@/lib/workbench/findings";
import { checkArtifactSafety } from "@/lib/workbench/limits";

export interface DockerInstruction {
  readonly line: number;
  readonly command: string;
  readonly value: string;
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
}

export function parseDockerfile(source: string): Result<DockerfileDocument, ParseError> {
  const limit = checkArtifactSafety(source, "dockerfile");
  if (!limit.ok) return { ok: false, error: { code: limit.error.code === "ARTIFACT_TOO_LARGE" ? "ARTIFACT_TOO_LARGE" : "UNSAFE_INPUT", message: limit.error.message } };
  const stages: { id: string; base: string; instructions: DockerInstruction[] }[] = [];
  for (const [index, rawLine] of source.split(/\r?\n/).entries()) {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#")) continue;
    const split = line.indexOf(" ");
    const command = (split === -1 ? line : line.slice(0, split)).toUpperCase();
    const value = split === -1 ? "" : line.slice(split + 1).trim();
    if (command === "FROM") {
      const match = value.match(/^(\S+)(?:\s+AS\s+(\S+))?$/i);
      if (!match?.[1]) return { ok: false, error: { code: "INVALID_SYNTAX", message: `Invalid FROM instruction on line ${index + 1}.` } };
      stages.push({ id: match[2] ?? `stage-${stages.length + 1}`, base: match[1], instructions: [] });
      continue;
    }
    const stage = stages.at(-1);
    if (!stage) return { ok: false, error: { code: "INVALID_SHAPE", message: "Dockerfile instructions must follow a FROM instruction." } };
    stage.instructions.push({ line: index + 1, command, value });
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
    graph: { nodes: stages.map((stage) => ({ id: stage.id, label: stage.id, kind: "stage", detail: stage.base })), edges },
  } };
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
