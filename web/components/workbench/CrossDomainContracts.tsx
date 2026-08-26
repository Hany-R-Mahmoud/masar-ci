"use client";

import { useEffect, useState } from "react";
import { buildEnvironmentContractsFromArtifacts, type EnvironmentContract } from "@/lib/domains/crossflow/environment-contracts";
import { loadWorkbenchState } from "@/lib/workbench/persistence";

export interface CrossDomainContractsProps {
  readonly refreshKey?: string;
  readonly idSuffix?: string;
}

function evidenceLabel(contract: EnvironmentContract): string {
  const origins = contract.origins.length > 0 ? `Origins: ${contract.origins.join(", ")}` : "Origins: none found";
  const consumers = contract.consumers.length > 0 ? `Consumers: ${contract.consumers.join(", ")}` : "Consumers: none found";
  return `${origins} · ${consumers}`;
}

export default function CrossDomainContracts({ refreshKey, idSuffix = "" }: CrossDomainContractsProps) {
  const [contracts, setContracts] = useState<readonly EnvironmentContract[]>([]);
  const [loadMessage, setLoadMessage] = useState<string | undefined>();

  useEffect(() => {
    const loaded = loadWorkbenchState();
    if (!loaded.ok) {
      setContracts([]);
      setLoadMessage("Persisted source artifacts are unavailable; no cross-domain values were read.");
      return;
    }
    setContracts(buildEnvironmentContractsFromArtifacts(loaded.value.artifacts));
    setLoadMessage(undefined);
  }, [refreshKey]);

  const matched = contracts.filter((contract) => contract.status === "matched").length;
  return (
    <section aria-labelledby={`cross-domain-contracts-title${idSuffix}`}>
      <div className="panel-label" id={`cross-domain-contracts-title${idSuffix}`}>Environment contracts</div>
      <p className="empty-state" aria-live="polite">
        {contracts.length > 0 ? `${matched} matched · ${contracts.length - matched} unmatched · exact names only` : loadMessage ?? "No persisted environment names found."}
      </p>
      {contracts.length > 0 ? (
        <ol className="finding-list" aria-label="Cross-domain environment contracts">
          {contracts.map((contract) => (
            <li key={contract.name} data-severity={contract.status === "matched" ? "info" : "warning"}>
              <div><span>{contract.status}</span><code>{contract.evidenceState}</code></div>
              <strong>{contract.name}</strong>
              <p>{evidenceLabel(contract)}</p>
              <div aria-label={`${contract.name} evidence`}> {/* TOKEN_POLICY_BATCHED_EXECUTION */}
                {contract.evidence.map((evidence) => (
                  <small key={`${evidence.artifactId}:${evidence.kind}:${evidence.line ?? 0}:${evidence.path ?? ""}`}>{evidence.kind} · {evidence.artifactId} · {evidence.domain ?? "unknown domain"} · digest {evidence.digest ?? "unknown"}{evidence.line ? ` · line ${evidence.line}` : ""}{evidence.path ? ` · ${evidence.path}` : ""} · default {evidence.defaultPresence}</small>
                ))}
              </div>
              <small>{contract.limitations.join(" ")}</small>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
// TOKEN_POLICY_BATCHED_EXECUTION
