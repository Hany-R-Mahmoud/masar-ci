import { createSampleWorkflow } from "@/lib/sample";
import { generateYaml } from "@/lib/generate/yaml";
import type { WorkbenchDomain } from "@/lib/workbench/contracts";

const presets: Readonly<Record<WorkbenchDomain, string>> = {
  actions: generateYaml(createSampleWorkflow()),
  compose: `services:\n  web:\n    image: nginx:1.27-alpine\n    ports: ["8080:80"]\n    depends_on: [api]\n  api:\n    build: ./api\n    environment:\n      DATABASE_URL: \${DATABASE_URL}\n`,
  dockerfile: `FROM node:22-alpine AS build\nWORKDIR /app\nCOPY package.json pnpm-lock.yaml ./\nRUN corepack enable && pnpm install --frozen-lockfile\nCOPY . .\nRUN pnpm build\n\nFROM node:22-alpine\nUSER node\nCOPY --from=build /app/out /app\nCMD ["node", "/app/server.js"]\n`,
  kubernetes: `apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: api\nspec:\n  selector:\n    matchLabels: { app: api }\n  template:\n    metadata:\n      labels: { app: api }\n    spec:\n      securityContext:\n        runAsNonRoot: true\n      containers:\n        - name: api\n          image: example/api:1.0.0\n          resources:\n            requests: { cpu: 100m, memory: 128Mi }\n            limits: { cpu: 500m, memory: 512Mi }\n---\napiVersion: v1\nkind: Service\nmetadata:\n  name: api\nspec:\n  selector: { app: api }\n  ports: [{ port: 80, targetPort: 3000 }]\n`,
  terraform: JSON.stringify({ format_version: "1.2", terraform_version: "1.9.0", resource_changes: [
    { address: "aws_s3_bucket.assets", type: "aws_s3_bucket", name: "assets", change: { actions: ["update"], before_sensitive: false, after_sensitive: false } },
    { address: "aws_security_group.web", type: "aws_security_group", name: "web", change: { actions: ["create"], before_sensitive: false, after_sensitive: false } },
  ] }, null, 2),
};

export function workspacePreset(domain: WorkbenchDomain): string {
  return presets[domain];
}

const blanks: Readonly<Record<Exclude<WorkbenchDomain, "terraform">, string>> = {
  actions: "name: New workflow\non: [workflow_dispatch]\npermissions: {}\njobs: {}\n",
  compose: "services: {}\n",
  dockerfile: "FROM scratch\n",
  kubernetes: "apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: new-config\ndata: {}\n",
};

export function workspaceBlank(domain: Exclude<WorkbenchDomain, "terraform">): string {
  return blanks[domain];
}
