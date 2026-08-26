"use client";

import { useState } from "react";
import DomainWorkspace from "./DomainWorkspace";

export default function DockerWorkspace() {
  const [kind, setKind] = useState<"compose" | "dockerfile">("compose");
  return <div className="docker-workspace"><nav className="artifact-kind-switcher" aria-label="Docker artifact type"><button aria-pressed={kind === "compose"} onClick={() => setKind("compose")}>Compose</button><button aria-pressed={kind === "dockerfile"} onClick={() => setKind("dockerfile")}>Dockerfile</button></nav><DomainWorkspace key={kind} domain={kind} title="Docker workbench" description={kind === "compose" ? "Author and inspect Compose services, ports, dependencies, and security posture." : "Trace stages, cache boundaries, copy provenance, and runtime identity without running Docker."} artifactName={kind === "compose" ? "compose.yaml" : "Dockerfile"} /></div>;
}
