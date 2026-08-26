import { describe, expect, it } from "vitest";
import { analyzeKubernetes, parseKubernetes } from "../kubernetes";

const source = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  selector:
    matchLabels: { app: api }
  template:
    metadata:
      labels: { app: api }
    spec:
      containers:
        - name: api
          image: example/api:latest
---
apiVersion: v1
kind: Service
metadata:
  name: api
spec:
  selector: { app: api }
  ports: [{ port: 80, targetPort: 8080 }]
`;

describe("Kubernetes static review", () => {
  it("parses multi-document resources and resolves selector links", () => {
    const result = parseKubernetes(source);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.resources).toHaveLength(2);
    expect(result.value.graph.edges).toContainEqual({ from: "Service/api", to: "Deployment/api", label: "selects" });
  });

  it("runs deterministic static policy without cluster access", () => {
    const result = parseKubernetes(source);
    if (!result.ok) return;
    const ids = analyzeKubernetes(result.value).map((finding) => finding.ruleId);
    expect(ids).toEqual(expect.arrayContaining(["K8S_IMAGE_MUTABLE", "K8S_MISSING_RESOURCES", "K8S_ROOT_DEFAULT"]));
  });

  it("retains unsupported documents in source and reports them", () => {
    const result = parseKubernetes(`${source}\n---\nmetadata:\n  note: retained`);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.source).toContain("note: retained");
    expect(result.value.unmodeledDocuments).toBe(1);
    expect(analyzeKubernetes(result.value).map((finding) => finding.ruleId)).toContain("K8S_RAW_DOCUMENT_RETAINED"); // TOKEN_POLICY_BATCHED_EXECUTION
  });
});
