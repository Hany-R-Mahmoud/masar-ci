import type { SourceArtifact, WorkbenchArtifact, WorkbenchDomain } from "@/lib/workbench/contracts"; // TOKEN_POLICY_BATCHED_EXECUTION

export type EnvironmentUseKind = "origin" | "consumer";
export type EnvironmentEvidenceState = "exact" | "inferred" | "ambiguous" | "unresolved" | "user-confirmed";
export type EnvironmentDefaultPresence = "present" | "absent" | "unknown";

export interface EnvironmentEvidence {
  readonly artifactId: string;
  readonly domain?: WorkbenchDomain;
  readonly digest?: string;
  readonly kind: EnvironmentUseKind;
  readonly line?: number;
  readonly path?: string;
  readonly defaultPresence: EnvironmentDefaultPresence;
  readonly evidenceState: EnvironmentEvidenceState;
  readonly limitations: readonly string[];
}

export interface EnvironmentUse {
  readonly artifactId: string;
  readonly kind: EnvironmentUseKind;
  readonly name: string;
  readonly domain?: WorkbenchDomain;
  readonly digest?: string;
  readonly line?: number;
  readonly path?: string;
  readonly defaultPresence?: EnvironmentDefaultPresence;
  readonly evidenceState?: EnvironmentEvidenceState;
  readonly limitations?: readonly string[];
}

export interface EnvironmentContract {
  readonly name: string;
  readonly origins: readonly string[];
  readonly consumers: readonly string[];
  readonly status: "matched" | "unmatched";
  readonly defaultPresence: EnvironmentDefaultPresence;
  readonly evidenceState: EnvironmentEvidenceState;
  readonly evidence: readonly EnvironmentEvidence[];
  readonly limitations: readonly string[];
}

const KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
const VARIABLE_PATTERN = /\$\{\{?\s*(?:env|vars|secrets|inputs)\.([A-Za-z_][A-Za-z0-9_]*)\s*\}?\}/g;
const SHELL_VARIABLE_PATTERN = /\$(?:\{([A-Za-z_][A-Za-z0-9_]*)\}|([A-Za-z_][A-Za-z0-9_]*))/g;
const LIMITATION = "Static name-only evidence; values, interpolation, and external files are not evaluated.";
const compareStrings = (left: string, right: string): number => left < right ? -1 : left > right ? 1 : 0; // TOKEN_POLICY_BATCHED_EXECUTION

function indentation(line: string): number { return line.match(/^\s*/)?.[0].length ?? 0; }

function keyName(value: string): string | undefined {
  const key = value.trim().replace(/^['"]|['"]$/g, "");
  return KEY_PATTERN.test(key) ? key : undefined;
}

function lineValue(line: string): { readonly key: string; readonly value: string; readonly indent: number } | undefined {
  const match = line.match(/^(\s*)(?:-\s+)?([^:#\s][^:]*?)\s*:\s*(.*)$/);
  if (!match) return undefined;
  const key = keyName(match[2]);
  return key ? { key, value: match[3].replace(/\s+#.*$/, "").trim(), indent: match[1].length } : undefined;
}

function addUse(uses: EnvironmentUse[], artifact: SourceArtifact, name: string | undefined, kind: EnvironmentUseKind, line: number, path: string, defaultPresence: EnvironmentDefaultPresence = "unknown", evidenceState: EnvironmentEvidenceState = "exact"): void {
  if (!name || !KEY_PATTERN.test(name)) return;
  uses.push({ artifactId: artifact.id, domain: artifact.domain, digest: artifact.digest, kind, name, line, path, defaultPresence, evidenceState, limitations: [LIMITATION] });
}

function addVariableReferences(uses: EnvironmentUse[], artifact: SourceArtifact, value: string, line: number, path: string): void {
  for (const match of value.matchAll(VARIABLE_PATTERN)) addUse(uses, artifact, match[1], "consumer", line, path, value.includes(":-") ? "present" : "unknown");
  for (const match of value.matchAll(SHELL_VARIABLE_PATTERN)) addUse(uses, artifact, match[1] ?? match[2], "consumer", line, path);
}

function collectActionsUses(artifact: SourceArtifact, uses: EnvironmentUse[]): void {
  const lines = artifact.source.split(/\r?\n/);
  let envIndent: number | undefined;
  lines.forEach((line, index) => {
    const number = index + 1;
    const trimmed = line.trim();
    const indent = indentation(line);
    if (/^env:\s*(?:#.*)?$/.test(trimmed)) { envIndent = indent; return; }
    if (envIndent !== undefined && trimmed && indent <= envIndent) envIndent = undefined;
    if (envIndent !== undefined && indent > envIndent) {
      const entry = lineValue(line);
      if (entry && entry.indent > envIndent) addUse(uses, artifact, entry.key, "origin", number, `env.${entry.key}`, entry.value ? "present" : "absent");
    }
    addVariableReferences(uses, artifact, line, number, "expression");
  });
}

function collectComposeUses(artifact: SourceArtifact, uses: EnvironmentUse[]): void {
  const lines = artifact.source.split(/\r?\n/);
  let environmentIndent: number | undefined;
  lines.forEach((line, index) => {
    const number = index + 1;
    const trimmed = line.trim();
    const indent = indentation(line);
    if (/^environment:\s*(?:#.*)?$/.test(trimmed)) { environmentIndent = indent; return; }
    if (environmentIndent !== undefined && trimmed && indent <= environmentIndent) environmentIndent = undefined;
    if (environmentIndent !== undefined && indent > environmentIndent) {
      const listMatch = trimmed.match(/^-\s*([A-Za-z_][A-Za-z0-9_]*)(?:=(.*))?$/);
      const entry = lineValue(line);
      if (listMatch) {
        addUse(uses, artifact, listMatch[1], listMatch[2] ? "origin" : "consumer", number, `environment.${listMatch[1]}`, listMatch[2] ? "present" : "unknown");
        if (listMatch[2]) addVariableReferences(uses, artifact, listMatch[2], number, `environment.${listMatch[1]}`);
      } else if (entry && entry.indent > environmentIndent) {
        addUse(uses, artifact, entry.key, "origin", number, `environment.${entry.key}`, entry.value ? "present" : "absent");
        addVariableReferences(uses, artifact, entry.value, number, `environment.${entry.key}`);
      }
    }
    for (const match of line.matchAll(/\$\{([A-Za-z_][A-Za-z0-9_]*)(?::[-?][^}]*)?\}/g)) addUse(uses, artifact, match[1], "consumer", number, "interpolation", match[0].includes(":-") ? "present" : "unknown");
  });
}

function collectDockerfileUses(artifact: SourceArtifact, uses: EnvironmentUse[]): void {
  artifact.source.split(/\r?\n/).forEach((line, index) => {
    const number = index + 1;
    const match = line.trim().match(/^(ARG|ENV)\s+([A-Za-z_][A-Za-z0-9_]*)(?:=(.*)|\s+.*)?$/i);
    if (match) addUse(uses, artifact, match[2], "origin", number, match[1].toUpperCase(), match[3] ? "present" : "absent");
    addVariableReferences(uses, artifact, line, number, "expansion");
  });
}

function collectKubernetesUses(artifact: SourceArtifact, uses: EnvironmentUse[]): void {
  const lines = artifact.source.split(/\r?\n/);
  let dataIndent: number | undefined;
  let envIndent: number | undefined;
  let currentKind = "";
  lines.forEach((line, index) => {
    const number = index + 1;
    const trimmed = line.trim();
    const indent = indentation(line);
    if (trimmed === "---") { dataIndent = undefined; envIndent = undefined; currentKind = ""; return; }
    const kind = line.match(/^\s*kind:\s*([A-Za-z]+)/)?.[1];
    if (kind) currentKind = kind;
    if (/^(?:data|stringData):\s*(?:#.*)?$/.test(trimmed) && (currentKind === "ConfigMap" || currentKind === "Secret")) { dataIndent = indent; return; }
    if (/^env:\s*(?:#.*)?$/.test(trimmed)) { envIndent = indent; return; }
    if (dataIndent !== undefined && trimmed && indent <= dataIndent) dataIndent = undefined;
    if (envIndent !== undefined && trimmed && indent <= envIndent) envIndent = undefined;
    if (dataIndent !== undefined && indent > dataIndent) {
      const entry = lineValue(line);
      if (entry && entry.indent > dataIndent) addUse(uses, artifact, entry.key, "origin", number, `${currentKind}.data.${entry.key}`, entry.value ? "present" : "absent");
    }
    if (envIndent !== undefined && indent > envIndent) {
      const name = line.match(/^\s*-\s*name:\s*([A-Za-z_][A-Za-z0-9_]*)\s*$/)?.[1];
      if (name) addUse(uses, artifact, name, "consumer", number, "env.name");
      const key = line.match(/^\s*key:\s*([A-Za-z_][A-Za-z0-9_]*)\s*$/)?.[1];
      if (key) addUse(uses, artifact, key, "consumer", number, "env.valueFrom.key");
    }
  });
}

function extractUses(artifact: SourceArtifact): EnvironmentUse[] {
  const uses: EnvironmentUse[] = [];
  if (artifact.domain === "actions") collectActionsUses(artifact, uses);
  if (artifact.domain === "compose") collectComposeUses(artifact, uses);
  if (artifact.domain === "dockerfile") collectDockerfileUses(artifact, uses);
  if (artifact.domain === "kubernetes") collectKubernetesUses(artifact, uses);
  return uses;
}

function evidenceFor(use: EnvironmentUse): EnvironmentEvidence {
  return { artifactId: use.artifactId, domain: use.domain, digest: use.digest, kind: use.kind, line: use.line, path: use.path, defaultPresence: use.defaultPresence ?? "unknown", evidenceState: use.evidenceState ?? "exact", limitations: [...(use.limitations ?? [LIMITATION])].sort() };
}

function mergeDefaultPresence(values: readonly EnvironmentDefaultPresence[]): EnvironmentDefaultPresence {
  const present = values.includes("present"); // TOKEN_POLICY_BATCHED_EXECUTION
  const absent = values.includes("absent");
  if (present && !absent) return "present";
  if (absent && !present) return "absent";
  return "unknown";
}

function mergeEvidenceState(values: readonly EnvironmentEvidenceState[]): EnvironmentEvidenceState {
  if (values.length === 0 || values.every((value) => value === "exact")) return "exact";
  if (values.includes("ambiguous")) return "ambiguous";
  if (values.includes("unresolved")) return "unresolved";
  if (values.includes("user-confirmed")) return "user-confirmed";
  return "inferred";
}

export function buildEnvironmentContracts(uses: readonly EnvironmentUse[]): EnvironmentContract[] {
  const grouped = new Map<string, EnvironmentUse[]>();
  for (const use of [...uses].sort((left, right) => compareStrings(left.name, right.name) || compareStrings(left.artifactId, right.artifactId) || compareStrings(left.kind, right.kind) || (left.line ?? 0) - (right.line ?? 0))) {
    const existing = grouped.get(use.name) ?? [];
    existing.push(use);
    grouped.set(use.name, existing);
  }
  return [...grouped.entries()].sort(([left], [right]) => compareStrings(left, right)).map(([name, matching]) => {
    const evidence = matching.map(evidenceFor).sort((left, right) => compareStrings(left.artifactId, right.artifactId) || (left.line ?? 0) - (right.line ?? 0) || compareStrings(left.kind, right.kind) || compareStrings(left.path ?? "", right.path ?? ""));
    const origins = [...new Set(matching.filter((use) => use.kind === "origin").map((use) => use.artifactId))].sort(compareStrings);
    const consumers = [...new Set(matching.filter((use) => use.kind === "consumer").map((use) => use.artifactId))].sort(compareStrings);
    return { name, origins, consumers, status: origins.length > 0 && consumers.length > 0 ? "matched" : "unmatched", defaultPresence: mergeDefaultPresence(matching.map((use) => use.defaultPresence ?? "unknown")), evidenceState: mergeEvidenceState(matching.map((use) => use.evidenceState ?? "exact")), evidence, limitations: [...new Set(matching.flatMap((use) => use.limitations ?? [LIMITATION]))].sort(compareStrings) };
  });
}

export function buildEnvironmentContractsFromArtifacts(artifacts: readonly WorkbenchArtifact[]): EnvironmentContract[] {
  const sourceArtifacts = artifacts.filter((artifact): artifact is SourceArtifact => artifact.mode === "source").sort((left, right) => compareStrings(left.id, right.id));
  return buildEnvironmentContracts(sourceArtifacts.flatMap(extractUses));
}
