import type { Result, WorkbenchDomain } from "./contracts";

export interface ArtifactLimits {
  readonly maxBytes: number;
  readonly maxNodes: number;
}

export interface LimitError {
  readonly code: "ARTIFACT_TOO_LARGE" | "TOO_MANY_NODES" | "UNSAFE_INPUT";
  readonly message: string;
}

export const DEFAULT_ARTIFACT_LIMITS: ArtifactLimits = {
  maxBytes: 50 * 1024 * 1024,
  maxNodes: 10_000,
};

export const DOMAIN_ARTIFACT_LIMITS: Readonly<Record<WorkbenchDomain, ArtifactLimits>> = {
  actions: { maxBytes: 5 * 1024 * 1024, maxNodes: 10_000 },
  compose: { maxBytes: 5 * 1024 * 1024, maxNodes: 10_000 },
  dockerfile: { maxBytes: 5 * 1024 * 1024, maxNodes: 10_000 },
  kubernetes: { maxBytes: 5 * 1024 * 1024, maxNodes: 10_000 },
  terraform: DEFAULT_ARTIFACT_LIMITS,
};

export function checkArtifactSafety(source: string, domain: WorkbenchDomain): Result<true, LimitError> {
  const limits = DOMAIN_ARTIFACT_LIMITS[domain];
  const bounded = checkArtifactLimits(source, limits);
  if (!bounded.ok) return bounded;
  if (source.includes("\0")) {
    return { ok: false, error: { code: "UNSAFE_INPUT", message: "Binary or NUL-containing artifacts are not supported." } };
  }
  if (domain === "dockerfile" || domain === "terraform") return { ok: true, value: true };

  const lines = source.split(/\r?\n/);
  const documents = 1 + lines.filter((line) => /^---\s*(?:#.*)?$/.test(line)).length;
  const aliases = lines.reduce((count, line) => count + (line.match(/(?:^|\s)[&*][A-Za-z0-9_-]+/g)?.length ?? 0), 0);
  const structuralNodes = lines.filter((line) => /^\s*(?:-\s+|[^#\s][^:]*:\s*)/.test(line)).length;
  const indentationDepth = lines.reduce((maximum, line) => Math.max(maximum, Math.floor((line.match(/^\s*/)?.[0].length ?? 0) / 2)), 0);
  if (documents > 100 || aliases > 100 || structuralNodes > limits.maxNodes || indentationDepth > 64) {
    return { ok: false, error: { code: "UNSAFE_INPUT", message: "YAML safety limits exceeded (100 documents/aliases, 10,000 nodes, or depth 64)." } };
  }
  return { ok: true, value: true };
}

export function checkArtifactLimits(
  source: string,
  limits: ArtifactLimits = DEFAULT_ARTIFACT_LIMITS,
  nodes = 0,
): Result<true, LimitError> {
  const bytes = new TextEncoder().encode(source).byteLength;
  if (bytes > limits.maxBytes) {
    return { ok: false, error: { code: "ARTIFACT_TOO_LARGE", message: `Artifact is ${bytes} bytes; limit is ${limits.maxBytes}.` } };
  }
  if (nodes > limits.maxNodes) {
    return { ok: false, error: { code: "TOO_MANY_NODES", message: `Artifact has ${nodes} nodes; limit is ${limits.maxNodes}.` } };
  }
  return { ok: true, value: true };
}
