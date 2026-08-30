// TOKEN_POLICY_BATCHED_EXECUTION: domain catalog and scaffold updates are intentionally batched.
import type { Result, WorkbenchDomain } from "@/lib/workbench/contracts";

export type ReviewLens = "all" | "risk" | "replace" | "dependencies" | "create" | "update" | "delete" | "isolated";

export interface AuthoringTool {
  readonly mode: "author";
  readonly id: string;
  readonly group: string;
  readonly label: string;
  readonly detail: string;
}

export interface ReviewTool {
  readonly mode: "review";
  readonly id: string;
  readonly group: string;
  readonly label: string;
  readonly detail: string;
  readonly lens: ReviewLens;
}

export type DomainTool = AuthoringTool | ReviewTool;

export interface DomainToolError {
  readonly code: "UNKNOWN_TOOL" | "REVIEW_ONLY";
  readonly message: string;
}

const tools: Readonly<Record<WorkbenchDomain, readonly DomainTool[]>> = {
  actions: [],
  compose: [
    { mode: "author", id: "compose-service", group: "Services", label: "Service", detail: "Add container service" },
    { mode: "author", id: "compose-build", group: "Services", label: "Build service", detail: "Build from local context" },
    { mode: "author", id: "compose-database", group: "Services", label: "PostgreSQL", detail: "Add local database" },
    { mode: "author", id: "compose-redis", group: "Services", label: "Redis", detail: "Add cache service" },
    { mode: "author", id: "compose-port", group: "Connectivity", label: "Published port", detail: "Expose container port" },
    { mode: "author", id: "compose-dependency", group: "Connectivity", label: "Service dependency", detail: "Add linked worker and API" },
    { mode: "author", id: "compose-healthcheck", group: "Reliability", label: "Healthcheck", detail: "Add monitored service" },
    { mode: "author", id: "compose-profile", group: "Reliability", label: "Profile", detail: "Add opt-in service" },
    { mode: "author", id: "compose-network", group: "Resources", label: "Network", detail: "Add isolated network" },
    { mode: "author", id: "compose-volume", group: "Resources", label: "Volume", detail: "Add named volume" },
    { mode: "author", id: "compose-config", group: "Resources", label: "Config", detail: "Add external configuration" },
    { mode: "author", id: "compose-secret", group: "Resources", label: "Secret", detail: "Add secret-file reference" },
    { mode: "author", id: "compose-command", group: "Runtime", label: "Command", detail: "Set a service command" },
    { mode: "author", id: "compose-readonly", group: "Security", label: "Read-only root", detail: "Harden the service filesystem" },
    { mode: "author", id: "compose-restart", group: "Reliability", label: "Restart policy", detail: "Declare service restart behavior" },
    { mode: "author", id: "compose-logging", group: "Reliability", label: "Logging", detail: "Bound service log retention" },
  ],
  dockerfile: [
    { mode: "author", id: "dockerfile-stage", group: "Stages", label: "Build stage", detail: "Add multi-stage boundary" },
    { mode: "author", id: "dockerfile-copy", group: "Instructions", label: "COPY", detail: "Copy application files" },
    { mode: "author", id: "dockerfile-run", group: "Instructions", label: "RUN", detail: "Add deterministic build command" },
    { mode: "author", id: "dockerfile-arg", group: "Configuration", label: "ARG", detail: "Declare build argument" },
    { mode: "author", id: "dockerfile-env", group: "Configuration", label: "ENV", detail: "Set runtime environment" },
    { mode: "author", id: "dockerfile-workdir", group: "Configuration", label: "WORKDIR", detail: "Set working directory" },
    { mode: "author", id: "dockerfile-label", group: "Configuration", label: "LABEL", detail: "Add OCI metadata" },
    { mode: "author", id: "dockerfile-expose", group: "Runtime", label: "EXPOSE", detail: "Document runtime port" },
    { mode: "author", id: "dockerfile-cmd", group: "Runtime", label: "CMD", detail: "Set default command" },
    { mode: "author", id: "dockerfile-entrypoint", group: "Runtime", label: "ENTRYPOINT", detail: "Set executable entrypoint" },
    { mode: "author", id: "dockerfile-healthcheck", group: "Security", label: "HEALTHCHECK", detail: "Add runtime health probe" },
    { mode: "author", id: "dockerfile-user", group: "Security", label: "Non-root user", detail: "Set runtime identity" },
    { mode: "author", id: "dockerfile-shell", group: "Configuration", label: "SHELL", detail: "Declare shell execution form" },
    { mode: "author", id: "dockerfile-stop-signal", group: "Runtime", label: "STOPSIGNAL", detail: "Set graceful stop signal" },
    { mode: "author", id: "dockerfile-volume", group: "Runtime", label: "VOLUME", detail: "Declare persistent mount point" },
    { mode: "author", id: "dockerfile-add", group: "Instructions", label: "ADD", detail: "Add a local or remote source" },
  ],
  kubernetes: [
    { mode: "author", id: "kubernetes-deployment", group: "Workloads", label: "Deployment", detail: "Add scalable workload" },
    { mode: "author", id: "kubernetes-statefulset", group: "Workloads", label: "StatefulSet", detail: "Add stateful workload" },
    { mode: "author", id: "kubernetes-daemonset", group: "Workloads", label: "DaemonSet", detail: "Add per-node workload" },
    { mode: "author", id: "kubernetes-job", group: "Workloads", label: "Job", detail: "Add one-time workload" },
    { mode: "author", id: "kubernetes-cronjob", group: "Workloads", label: "CronJob", detail: "Add scheduled workload" },
    { mode: "author", id: "kubernetes-service", group: "Networking", label: "Service", detail: "Expose workload internally" },
    { mode: "author", id: "kubernetes-ingress", group: "Networking", label: "Ingress", detail: "Add HTTP routing" },
    { mode: "author", id: "kubernetes-networkpolicy", group: "Networking", label: "NetworkPolicy", detail: "Restrict pod traffic" },
    { mode: "author", id: "kubernetes-configmap", group: "Configuration", label: "ConfigMap", detail: "Add non-secret configuration" },
    { mode: "author", id: "kubernetes-secret", group: "Configuration", label: "Secret", detail: "Add environment-backed secret" },
    { mode: "author", id: "kubernetes-pvc", group: "Storage", label: "PersistentVolumeClaim", detail: "Request persistent storage" },
    { mode: "author", id: "kubernetes-namespace", group: "Platform", label: "Namespace", detail: "Add isolation boundary" },
    { mode: "author", id: "kubernetes-serviceaccount", group: "Platform", label: "ServiceAccount", detail: "Add workload identity" },
    { mode: "author", id: "kubernetes-hpa", group: "Platform", label: "HorizontalPodAutoscaler", detail: "Scale a deployment" },
    { mode: "author", id: "kubernetes-pod", group: "Workloads", label: "Pod", detail: "Add a minimal workload" },
    { mode: "author", id: "kubernetes-pdb", group: "Workloads", label: "PodDisruptionBudget", detail: "Protect workload availability" },
    { mode: "author", id: "kubernetes-role", group: "Platform", label: "Role", detail: "Grant namespace permissions" },
    { mode: "author", id: "kubernetes-rolebinding", group: "Platform", label: "RoleBinding", detail: "Bind workload permissions" },
  ],
  terraform: [
    { mode: "review", id: "terraform-all", group: "Review lenses", label: "All changes", detail: "Show complete plan graph", lens: "all" },
    { mode: "review", id: "terraform-risk", group: "Review lenses", label: "Risk findings", detail: "Focus flagged resources", lens: "risk" },
    { mode: "review", id: "terraform-replace", group: "Review lenses", label: "Replacements", detail: "Focus delete/create changes", lens: "replace" },
    { mode: "review", id: "terraform-dependencies", group: "Review lenses", label: "Dependencies", detail: "Focus connected resources", lens: "dependencies" },
    { mode: "review", id: "terraform-create", group: "Change types", label: "Creates", detail: "Focus new resources", lens: "create" },
    { mode: "review", id: "terraform-update", group: "Change types", label: "Updates", detail: "Focus in-place changes", lens: "update" },
    { mode: "review", id: "terraform-delete", group: "Change types", label: "Deletions", detail: "Focus removed resources", lens: "delete" },
    { mode: "review", id: "terraform-isolated", group: "Topology", label: "Unconnected changes", detail: "Focus resources without plan links", lens: "isolated" },
  ],
};

export function domainTools(domain: WorkbenchDomain): readonly DomainTool[] {
  return tools[domain];
}

function uniqueName(source: string, base: string): string {
  let name = base;
  let suffix = 2;
  while (new RegExp(`(^|\\s)${name.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}(?=[:\\s])`, "m").test(source)) {
    name = `${base}-${suffix}`;
    suffix += 1;
  }
  return name;
}

function kubernetesResourceName(source: string, kind: string): string | undefined {
  return source.split(/\n---\s*\n?/).reduce<string | undefined>((found, document) => {
    if (found || !new RegExp(`^kind:\\s*${kind}\\s*$`, "m").test(document)) return found;
    return document.match(/^\s+name:\s*([A-Za-z0-9.-]+)\s*$/m)?.[1];
  }, undefined);
}

function appendDocument(source: string, document: string): string {
  return `${source.trimEnd()}\n---\n${document.trim()}\n`;
}

function insertYamlEntry(source: string, section: string, entry: string): string {
  const lines = source.trimEnd().split("\n");
  const sectionIndex = lines.findIndex((line) => line === `${section}:` || line === `${section}: {}`);
  if (sectionIndex < 0) return `${source.trimEnd()}\n${section}:\n${entry}\n`;
  if (lines[sectionIndex] === `${section}: {}`) {
    lines[sectionIndex] = `${section}:`;
    lines.splice(sectionIndex + 1, 0, ...entry.split("\n"));
    return `${lines.join("\n")}\n`;
  }
  const nextSection = lines.findIndex((line, index) => index > sectionIndex && /^\S/.test(line));
  const insertionIndex = nextSection < 0 ? lines.length : nextSection;
  lines.splice(insertionIndex, 0, ...entry.split("\n"));
  return `${lines.join("\n")}\n`;
}

function applyComposeTool(source: string, toolId: string): string | undefined {
  if (toolId === "compose-service") {
    const name = uniqueName(source, "service");
    return insertYamlEntry(source, "services", `  ${name}:\n    image: nginx:1.27-alpine`);
  }
  if (toolId === "compose-database") {
    const name = uniqueName(source, "database");
    return insertYamlEntry(source, "services", `  ${name}:\n    image: postgres:17-alpine\n    environment:\n      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}`);
  }
  if (toolId === "compose-build") {
    const name = uniqueName(source, "build-service");
    return insertYamlEntry(source, "services", `  ${name}:\n    build: .\n    image: local/${name}:dev`);
  }
  if (toolId === "compose-redis") {
    const name = uniqueName(source, "redis");
    return insertYamlEntry(source, "services", `  ${name}:\n    image: redis:7-alpine`);
  }
  if (toolId === "compose-port") {
    const name = uniqueName(source, "published-service");
    return insertYamlEntry(source, "services", `  ${name}:\n    image: nginx:1.27-alpine\n    ports: ["8080:80"]`);
  }
  if (toolId === "compose-dependency") {
    const api = uniqueName(source, "api");
    const worker = uniqueName(source, "worker");
    return insertYamlEntry(source, "services", `  ${api}:\n    image: nginx:1.27-alpine\n  ${worker}:\n    image: alpine:3.21\n    depends_on: [${api}]`);
  }
  if (toolId === "compose-healthcheck") {
    const name = uniqueName(source, "monitored-service");
    return insertYamlEntry(source, "services", `  ${name}:\n    image: nginx:1.27-alpine\n    healthcheck:\n      test: ["CMD", "wget", "-qO-", "http://localhost"]\n      interval: 30s\n      timeout: 5s\n      retries: 3`);
  }
  if (toolId === "compose-profile") {
    const name = uniqueName(source, "debug-service");
    return insertYamlEntry(source, "services", `  ${name}:\n    image: alpine:3.21\n    profiles: [debug]`);
  }
  if (toolId === "compose-network") {
    const name = uniqueName(source, "app-network");
    return insertYamlEntry(source, "networks", `  ${name}: {}`);
  }
  if (toolId === "compose-volume") {
    const name = uniqueName(source, "app-data");
    return insertYamlEntry(source, "volumes", `  ${name}: {}`);
  }
  if (toolId === "compose-config") {
    const name = uniqueName(source, "app-config");
    return insertYamlEntry(source, "configs", `  ${name}:\n    file: ./config/app.conf`);
  }
  if (toolId === "compose-secret") {
    const name = uniqueName(source, "app-secret");
    return insertYamlEntry(source, "secrets", `  ${name}:\n    file: ./secrets/${name}.txt`);
  }
  if (toolId === "compose-command") {
    const name = uniqueName(source, "command-service");
    return insertYamlEntry(source, "services", `  ${name}:\n    image: alpine:3.21\n    command: ["sh", "-c", "echo ready"]`);
  }
  if (toolId === "compose-readonly") {
    const name = uniqueName(source, "hardened-service");
    return insertYamlEntry(source, "services", `  ${name}:\n    image: nginx:1.27-alpine\n    read_only: true\n    tmpfs: ["/tmp"]`);
  }
  if (toolId === "compose-restart") {
    const name = uniqueName(source, "resilient-service");
    return insertYamlEntry(source, "services", `  ${name}:\n    image: nginx:1.27-alpine\n    restart: unless-stopped`);
  }
  if (toolId === "compose-logging") {
    const name = uniqueName(source, "logged-service");
    return insertYamlEntry(source, "services", `  ${name}:\n    image: nginx:1.27-alpine\n    logging:\n      driver: json-file\n      options:\n        max-size: 10m\n        max-file: "3"`);
  }
  return undefined;
}

function applyDockerfileTool(source: string, toolId: string): string | undefined {
  if (toolId === "dockerfile-stage") return `${source.trimEnd()}\n\nFROM node:22-alpine AS ${uniqueName(source, "runtime")}\nWORKDIR /app\n`;
  if (toolId === "dockerfile-copy") return `${source.trimEnd()}\nCOPY . /app\n`;
  if (toolId === "dockerfile-run") return `${source.trimEnd()}\nRUN corepack enable && pnpm build\n`;
  if (toolId === "dockerfile-arg") return `${source.trimEnd()}\nARG NODE_VERSION=22\n`;
  if (toolId === "dockerfile-env") return `${source.trimEnd()}\nENV NODE_ENV=production\n`;
  if (toolId === "dockerfile-workdir") return `${source.trimEnd()}\nWORKDIR /app\n`;
  if (toolId === "dockerfile-label") return `${source.trimEnd()}\nLABEL org.opencontainers.image.source="local"\n`;
  if (toolId === "dockerfile-expose") return `${source.trimEnd()}\nEXPOSE 3000\n`;
  if (toolId === "dockerfile-cmd") return `${source.trimEnd()}\nCMD ["node", "server.js"]\n`;
  if (toolId === "dockerfile-entrypoint") return `${source.trimEnd()}\nENTRYPOINT ["node"]\n`;
  if (toolId === "dockerfile-healthcheck") return `${source.trimEnd()}\nHEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:3000/ || exit 1\n`;
  if (toolId === "dockerfile-user") return `${source.trimEnd()}\nUSER node\n`;
  if (toolId === "dockerfile-shell") return `${source.trimEnd()}\nSHELL ["/bin/sh", "-c"]\n`;
  if (toolId === "dockerfile-stop-signal") return `${source.trimEnd()}\nSTOPSIGNAL SIGTERM\n`;
  if (toolId === "dockerfile-volume") return `${source.trimEnd()}\nVOLUME ["/var/lib/app"]\n`;
  if (toolId === "dockerfile-add") return `${source.trimEnd()}\nADD package.json /app/package.json\n`;
  return undefined;
}

function applyKubernetesTool(source: string, toolId: string): string | undefined {
  if (toolId === "kubernetes-deployment") {
    const name = uniqueName(source, "workload");
    return appendDocument(source, `apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: ${name}\nspec:\n  replicas: 1\n  selector:\n    matchLabels: { app: ${name} }\n  template:\n    metadata:\n      labels: { app: ${name} }\n    spec:\n      containers:\n        - name: ${name}\n          image: nginx:1.27-alpine`);
  }
  if (toolId === "kubernetes-service") {
    const name = uniqueName(source, "service");
    return appendDocument(source, `apiVersion: v1\nkind: Service\nmetadata:\n  name: ${name}\nspec:\n  selector: { app: ${name} }\n  ports:\n    - port: 80\n      targetPort: 8080`);
  }
  if (toolId === "kubernetes-ingress") {
    const name = uniqueName(source, "ingress");
    const serviceName = kubernetesResourceName(source, "Service") ?? uniqueName(source, "service");
    const ingress = `apiVersion: networking.k8s.io/v1\nkind: Ingress\nmetadata:\n  name: ${name}\nspec:\n  rules:\n    - host: example.local\n      http:\n        paths:\n          - path: /\n            pathType: Prefix\n            backend:\n              service:\n                name: ${serviceName}\n                port: { number: 80 }`;
    if (kubernetesResourceName(source, "Service")) return appendDocument(source, ingress);
    const service = `apiVersion: v1\nkind: Service\nmetadata:\n  name: ${serviceName}\nspec:\n  selector: { app: ${serviceName} }\n  ports:\n    - port: 80\n      targetPort: 80`;
    return appendDocument(appendDocument(source, service), ingress);
  }
  if (toolId === "kubernetes-configmap") {
    const name = uniqueName(source, "app-config");
    return appendDocument(source, `apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: ${name}\ndata:\n  ENVIRONMENT: development`);
  }
  if (toolId === "kubernetes-secret") {
    const name = uniqueName(source, "app-secret");
    return appendDocument(source, `apiVersion: v1\nkind: Secret\nmetadata:\n  name: ${name}\ntype: Opaque\nstringData:\n  API_TOKEN: \${API_TOKEN}`);
  }
  if (toolId === "kubernetes-statefulset") {
    const name = uniqueName(source, "stateful-app");
    return appendDocument(source, `apiVersion: apps/v1\nkind: StatefulSet\nmetadata:\n  name: ${name}\nspec:\n  serviceName: ${name}\n  selector:\n    matchLabels: { app: ${name} }\n  template:\n    metadata:\n      labels: { app: ${name} }\n    spec:\n      securityContext: { runAsNonRoot: true }\n      containers:\n        - name: ${name}\n          image: nginx:1.27-alpine\n          resources:\n            requests: { cpu: 100m, memory: 128Mi }\n            limits: { cpu: 500m, memory: 512Mi }`);
  }
  if (toolId === "kubernetes-daemonset") {
    const name = uniqueName(source, "node-agent");
    return appendDocument(source, `apiVersion: apps/v1\nkind: DaemonSet\nmetadata:\n  name: ${name}\nspec:\n  selector:\n    matchLabels: { app: ${name} }\n  template:\n    metadata:\n      labels: { app: ${name} }\n    spec:\n      securityContext: { runAsNonRoot: true }\n      containers:\n        - name: ${name}\n          image: busybox:1.37\n          resources:\n            requests: { cpu: 50m, memory: 64Mi }\n            limits: { cpu: 100m, memory: 128Mi }`);
  }
  if (toolId === "kubernetes-job") {
    const name = uniqueName(source, "batch-job");
    return appendDocument(source, `apiVersion: batch/v1\nkind: Job\nmetadata:\n  name: ${name}\nspec:\n  template:\n    spec:\n      restartPolicy: Never\n      securityContext: { runAsNonRoot: true }\n      containers:\n        - name: ${name}\n          image: busybox:1.37\n          command: ["sh", "-c", "echo complete"]\n          resources:\n            requests: { cpu: 50m, memory: 64Mi }\n            limits: { cpu: 100m, memory: 128Mi }`);
  }
  if (toolId === "kubernetes-cronjob") {
    const name = uniqueName(source, "scheduled-job");
    return appendDocument(source, `apiVersion: batch/v1\nkind: CronJob\nmetadata:\n  name: ${name}\nspec:\n  schedule: "0 * * * *"\n  jobTemplate:\n    spec:\n      template:\n        spec:\n          restartPolicy: Never\n          containers:\n            - name: ${name}\n              image: busybox:1.37\n              command: ["sh", "-c", "echo scheduled"]`);
  }
  if (toolId === "kubernetes-pvc") {
    const name = uniqueName(source, "app-data");
    return appendDocument(source, `apiVersion: v1\nkind: PersistentVolumeClaim\nmetadata:\n  name: ${name}\nspec:\n  accessModes: [ReadWriteOnce]\n  resources:\n    requests:\n      storage: 1Gi`);
  }
  if (toolId === "kubernetes-namespace") {
    const name = uniqueName(source, "application");
    return appendDocument(source, `apiVersion: v1\nkind: Namespace\nmetadata:\n  name: ${name}`);
  }
  if (toolId === "kubernetes-serviceaccount") {
    const name = uniqueName(source, "workload");
    return appendDocument(source, `apiVersion: v1\nkind: ServiceAccount\nmetadata:\n  name: ${name}`);
  }
  if (toolId === "kubernetes-networkpolicy") {
    const name = uniqueName(source, "default-deny");
    return appendDocument(source, `apiVersion: networking.k8s.io/v1\nkind: NetworkPolicy\nmetadata:\n  name: ${name}\nspec:\n  podSelector: {}\n  policyTypes: [Ingress, Egress]`);
  }
  if (toolId === "kubernetes-hpa") {
    const name = uniqueName(source, "workload-scaler");
    const deploymentName = kubernetesResourceName(source, "Deployment") ?? uniqueName(source, "workload");
    const hpa = `apiVersion: autoscaling/v2\nkind: HorizontalPodAutoscaler\nmetadata:\n  name: ${name}\nspec:\n  scaleTargetRef:\n    apiVersion: apps/v1\n    kind: Deployment\n    name: ${deploymentName}\n  minReplicas: 1\n  maxReplicas: 5\n  metrics:\n    - type: Resource\n      resource:\n        name: cpu\n        target: { type: Utilization, averageUtilization: 70 }`;
    if (kubernetesResourceName(source, "Deployment")) return appendDocument(source, hpa);
    const deployment = `apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: ${deploymentName}\nspec:\n  replicas: 1\n  selector:\n    matchLabels: { app: ${deploymentName} }\n  template:\n    metadata:\n      labels: { app: ${deploymentName} }\n    spec:\n      containers:\n        - name: ${deploymentName}\n          image: nginx:1.27-alpine`;
    return appendDocument(appendDocument(source, deployment), hpa);
  }
  if (toolId === "kubernetes-pod") {
    const name = uniqueName(source, "app-pod");
    return appendDocument(source, `apiVersion: v1\nkind: Pod\nmetadata:\n  name: ${name}\n  labels:\n    app: ${name}\nspec:\n  restartPolicy: Never\n  securityContext: { runAsNonRoot: true }\n  containers:\n    - name: ${name}\n      image: busybox:1.37\n      command: ["sh", "-c", "echo ready"]\n      resources:\n        requests: { cpu: 50m, memory: 64Mi }\n        limits: { cpu: 100m, memory: 128Mi }`);
  }
  if (toolId === "kubernetes-pdb") {
    const name = uniqueName(source, "workload");
    const target = kubernetesResourceName(source, "Deployment") ?? name;
    return appendDocument(source, `apiVersion: policy/v1\nkind: PodDisruptionBudget\nmetadata:\n  name: ${name}-pdb\nspec:\n  maxUnavailable: 1\n  selector:\n    matchLabels: { app: ${target} }`);
  }
  if (toolId === "kubernetes-role") {
    const name = uniqueName(source, "workload");
    return appendDocument(source, `apiVersion: rbac.authorization.k8s.io/v1\nkind: Role\nmetadata:\n  name: ${name}\nrules:\n  - apiGroups: [""]\n    resources: ["configmaps"]\n    verbs: ["get", "list"]`);
  }
  if (toolId === "kubernetes-rolebinding") {
    const name = uniqueName(source, "workload");
    return appendDocument(source, `apiVersion: rbac.authorization.k8s.io/v1\nkind: RoleBinding\nmetadata:\n  name: ${name}-binding\nroleRef:\n  apiGroup: rbac.authorization.k8s.io\n  kind: Role\n  name: ${name}\nsubjects:\n  - kind: ServiceAccount\n    name: ${name}`);
  }
  return undefined;
}

export function applyDomainTool(domain: WorkbenchDomain, source: string, toolId: string): Result<string, DomainToolError> {
  const tool = tools[domain].find((candidate) => candidate.id === toolId);
  if (!tool) return { ok: false, error: { code: "UNKNOWN_TOOL", message: `Unknown ${domain} tool: ${toolId}` } };
  if (tool.mode === "review") return { ok: false, error: { code: "REVIEW_ONLY", message: `${tool.label} changes review focus only.` } };
  const nextSource = domain === "compose"
    ? applyComposeTool(source, tool.id)
    : domain === "dockerfile"
      ? applyDockerfileTool(source, tool.id)
      : domain === "kubernetes"
        ? applyKubernetesTool(source, tool.id)
        : undefined;
  return nextSource
    ? { ok: true, value: nextSource }
    : { ok: false, error: { code: "UNKNOWN_TOOL", message: `Tool ${toolId} cannot edit ${domain}.` } };
}
