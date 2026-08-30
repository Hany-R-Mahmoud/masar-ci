import { parseYaml } from "@/lib/generate/parse";
import { generateYaml } from "@/lib/generate/yaml";
import { lint } from "@/lib/lint/lint";
import type { Finding, FixPreview, WorkbenchDomain } from "@/lib/workbench/contracts";
import { previewComposeFix } from "@/lib/domains/containers/compose";
import { previewDockerfileFix } from "@/lib/domains/containers/dockerfile";
import { previewKubernetesFix } from "@/lib/domains/kubernetes/kubernetes";
import { parseCompose } from "@/lib/domains/containers/compose";
import { parseDockerfile } from "@/lib/domains/containers/dockerfile";
import { parseKubernetes } from "@/lib/domains/kubernetes/kubernetes";
import { stableDigest } from "@/lib/workbench/digest";
import { canSafelyHoistUntrusted, hoistUntrusted } from "./rules/script-injection";

function indentOf(line: string): string {
  return line.match(/^\s*/)?.[0] ?? "";
}

function insertEnvironment(lines: string[], runIndex: number, runIndent: string, values: Readonly<Record<string, string>>): boolean {
  let stepStart = runIndex;
  while (stepStart > 0 && indentOf(lines[stepStart - 1]).length >= runIndent.length) stepStart -= 1;
  let envIndex = -1;
  for (let index = stepStart; index < lines.length; index += 1) {
    const lineIndent = indentOf(lines[index]);
    if (index > stepStart && lines[index].trim() && lineIndent.length < runIndent.length) break;
    if (lineIndent === runIndent && lines[index].trimStart().startsWith("env:") && lines[index].trim() !== "env:") return false;
    if (lineIndent === runIndent && lines[index].trim() === "env:") {
      envIndex = index;
      break;
    }
  }
  const entries = Object.entries(values).map(([name, value]) => `${runIndent}  ${name}: ${value}`);
  if (envIndex === -1) {
    lines.splice(runIndex + 1, 0, `${runIndent}env:`, ...entries);
    return true;
  }
  let insertAt = envIndex + 1;
  while (insertAt < lines.length && (lines[insertAt].trim() === "" || indentOf(lines[insertAt]).length > runIndent.length)) insertAt += 1;
  lines.splice(insertAt, 0, ...entries);
  return true;
}

function patchInlineActionsSource(source: string, run: string, hoisted: ReturnType<typeof hoistUntrusted>): string | undefined {
  if (!hoisted || run.includes("\n")) return undefined;
  const lines = source.split("\n");
  const matches = lines.flatMap((line, index) => line.trimStart().startsWith("run:") && line.includes(run) ? [index] : []);
  if (matches.length !== 1) return undefined;
  const runIndex = matches[0];
  const runIndent = indentOf(lines[runIndex]);
  lines[runIndex] = lines[runIndex].replace(run, hoisted.run);
  if (!insertEnvironment(lines, runIndex, runIndent, hoisted.env)) return undefined;
  return lines.join("\n");
}

function previewActionsFix(source: string, finding: Finding): FixPreview {
  const workflow = parseYaml(source);
  const targetJobId = finding.evidence?.artifact;
  const targetStepId = finding.evidence?.path;
  const lintFinding = lint(workflow).find((candidate) =>
    candidate.ruleId === finding.ruleId
      && (targetJobId === undefined || candidate.targetJobId === targetJobId)
      && (targetStepId === undefined || candidate.targetStepId === targetStepId));
  if (!lintFinding?.autoFix) return { status: "unavailable", summary: `No preview is available for ${finding.ruleId}.` };
  const exactSource = generateYaml(workflow) === source;
  const targetJob = workflow.jobs.find((job) => job.id === targetJobId);
  const targetStep = targetJob?.steps.find((step) => step.id === targetStepId);
  if (finding.ruleId === "INJECT-001" && (!targetStep?.run || !canSafelyHoistUntrusted(targetStep.run))) return {
    status: "requires-review",
    risk: "review",
    summary: "Review the shell context manually; automatic hoisting is blocked for unsafe or ambiguous commands.",
    before: source,
    digest: stableDigest(source),
    reversible: true,
    validation: "No automatic fix is offered until the command is proven shell-safe.",
  };
  if (finding.ruleId === "INJECT-001" && targetStep?.run && !exactSource) {
    const rawAfter = patchInlineActionsSource(source, targetStep.run, hoistUntrusted(targetStep.run, targetStep.env));
    if (rawAfter) {
      const validated = parseYaml(rawAfter);
      if (lint(validated).some((candidate) => candidate.ruleId === finding.ruleId && candidate.targetJobId === targetJobId && candidate.targetStepId === targetStepId)) return {
        status: "unavailable",
        summary: "The source-preserving proposal did not clear the finding after re-analysis.",
      };
      return { status: "available", risk: "safe", summary: "Preview a source-preserving environment-variable remediation for the workflow.", before: source, after: rawAfter, digest: stableDigest(source), reversible: true, validation: "Re-analyze the workflow and confirm INJECT-001 is absent." };
    }
  }
  if (!exactSource) return {
    status: "requires-review",
    risk: "review",
    summary: "Review the original workflow source manually; this YAML contains fields outside the safe preview model.",
    before: source,
    digest: stableDigest(source),
    reversible: true,
    validation: "No source-preserving automatic preview is available for this workflow.",
  };
  const after = generateYaml(lintFinding.autoFix(workflow));
  const validated = parseYaml(after);
  if (lint(validated).some((candidate) => candidate.ruleId === finding.ruleId && candidate.targetJobId === targetJobId)) {
    return { status: "unavailable", summary: `The proposed ${finding.ruleId} change did not clear the finding after re-analysis.` };
  }
  const status = finding.ruleId === "INJECT-001" && exactSource ? "available" : "requires-review";
  const summary = exactSource
    ? `Preview ${finding.ruleId} remediation for the workflow.`
    : `Preview ${finding.ruleId} remediation; review the normalized YAML before applying.`;
  return { status, risk: status === "available" ? "safe" : "review", summary, before: source, after, digest: stableDigest(source), reversible: true, validation: "Re-analyze the workflow and confirm INJECT-001 is absent." };
}

function reviewOnly(preview: FixPreview): FixPreview {
  return preview.status === "available"
    ? { ...preview, status: "requires-review", risk: "review", summary: `${preview.summary ?? "Review this change."} Manual review is required for this semantic change.`, reversible: true, validation: "Re-analyze the source after the reviewed change." }
    : preview;
}

function bindToSource(source: string, preview: FixPreview): FixPreview {
  return preview.before ? { ...preview, digest: stableDigest(source) } : preview;
}

function escaped(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function occurrenceCount(source: string, value: string): number {
  if (!value) return 0;
  return source.split(value).length - 1;
}

function composeTargetIsUnique(source: string, finding: Finding): boolean {
  const parsed = parseCompose(source);
  const service = parsed.ok ? parsed.value.services.find((item) => item.name === finding.evidence?.artifact) : undefined;
  if (!service) return false;
  if (finding.ruleId === "COMPOSE_MUTABLE_TAG") return occurrenceCount(source, service.image ?? "") === 1;
  if (finding.ruleId === "COMPOSE_PRIVILEGED") return new RegExp(`^\\s{2}${escaped(service.name)}:\\s*$`, "gm").test(source);
  const secret = Object.keys(service.environment).find((name) => /(password|token|secret|key)/i.test(name));
  return Boolean(secret && new RegExp(`^\\s+${escaped(secret)}:\\s*`, "gm").test(source));
}

function dockerTargetIsUnique(source: string, finding: Finding): boolean {
  const parsed = parseDockerfile(source);
  if (!parsed.ok) return false;
  const stageIndex = parsed.value.stages.findIndex((stage) => stage.id === finding.evidence?.artifact);
  const stage = parsed.value.stages[stageIndex];
  if (!stage) return false;
  if (finding.ruleId === "DOCKER_ROOT_USER") return stageIndex === parsed.value.stages.length - 1;
  return parsed.value.stages.filter((candidate) => candidate.base === stage.base).length === 1;
}

function kubernetesTargetIsUnique(source: string, finding: Finding): boolean {
  const parsed = parseKubernetes(source);
  const resource = parsed.ok ? parsed.value.resources.find((item) => item.id === finding.evidence?.artifact) : undefined;
  if (!resource) return false;
  if (finding.ruleId === "K8S_ROOT_DEFAULT") return parsed.ok && parsed.value.resources.length === 1;
  const containerName = finding.evidence?.path?.match(/^containers\.([^\.]+)\./)?.[1];
  const container = resource.containers.find((item) => item.name === containerName);
  return Boolean(container?.image && occurrenceCount(source, container.image) === 1);
}

function targetIsUnambiguous(domain: WorkbenchDomain, source: string, finding: Finding): boolean {
  if (domain === "compose") return composeTargetIsUnique(source, finding);
  if (domain === "dockerfile") return dockerTargetIsUnique(source, finding);
  if (domain === "kubernetes") return kubernetesTargetIsUnique(source, finding);
  return true;
}

export function previewFindingFix(domain: WorkbenchDomain, source: string, finding: Finding): FixPreview | undefined {
  try {
    // TOKEN_POLICY_BATCHED_EXECUTION: bind every preview to the analyzed source, with optional evidence.
    const evidence = finding.evidence;
    if (domain === "actions") return previewActionsFix(source, finding);
    if (domain === "compose" && evidence?.path?.startsWith("services.")) {
      if (!targetIsUnambiguous(domain, source, finding)) return { status: "unavailable", summary: "The target occurs more than once; apply this change manually to the identified resource." };
      return reviewOnly(bindToSource(source, previewComposeFix(source, finding.ruleId, evidence?.artifact)));
    }
    if (domain === "dockerfile" && ["FROM", "USER"].includes(evidence?.path ?? "")) {
      if (!targetIsUnambiguous(domain, source, finding)) return { status: "unavailable", summary: "The target stage is ambiguous; apply this change manually to the identified stage." };
      return reviewOnly(bindToSource(source, previewDockerfileFix(source, finding.ruleId, evidence?.artifact)));
    }
    if (domain === "kubernetes") {
      if (finding.ruleId === "K8S_MISSING_RESOURCES") return { status: "unavailable", summary: "Resource values require an explicit operator decision." };
      const resourceId = evidence?.artifact;
      const containerName = evidence?.path?.match(/^containers\.([^\.]+)\./)?.[1];
      if (containerName || evidence?.path === "securityContext") {
        if (!targetIsUnambiguous(domain, source, finding)) return { status: "unavailable", summary: "The target workload is ambiguous; apply this change manually to the identified resource." };
        return reviewOnly(bindToSource(source, previewKubernetesFix(source, finding.ruleId, resourceId, containerName)));
      }
    }
    return undefined;
  } catch (error: unknown) {
    return { status: "unavailable", summary: error instanceof Error ? error.message : "The fix preview could not be generated." };
  }
}
