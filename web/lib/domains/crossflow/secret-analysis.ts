import type { Finding } from "@/lib/workbench/contracts";
import { createFinding, sortFindings } from "@/lib/workbench/findings";

const patterns: readonly { readonly id: string; readonly pattern: RegExp }[] = [
  { id: "github-token", pattern: /\bgh[pousr]_[A-Za-z0-9]{30,255}\b/g },
  { id: "private-key", pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
  { id: "literal-secret", pattern: /\b(?:password|token|secret|api[_-]?key)\s*[:=]\s*(?!\$\{|\$\(|<|changeme\b)["']?[^\s"']{8,}/gi },
];

export function scanSecrets(source: string, artifact = "source"): Finding[] {
  const findings: Finding[] = [];
  const matchedLines = new Set<number>();
  for (const definition of patterns) {
    for (const match of source.matchAll(definition.pattern)) {
      const index = match.index ?? 0;
      const line = source.slice(0, index).split("\n").length;
      if (matchedLines.has(line)) continue;
      matchedLines.add(line);
      findings.push(createFinding({
        ruleId: "SECRET_LITERAL",
        severity: "critical",
        title: "Possible literal secret",
        message: `A ${definition.id} pattern appears in source. Replace it with a secret reference before export.`,
        evidence: { artifact, line, excerpt: "[redacted]" },
      }));
    }
  }
  return sortFindings(findings);
}
