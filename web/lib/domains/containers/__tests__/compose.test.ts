import { describe, expect, it } from "vitest";
// TOKEN_POLICY_BATCHED_EXECUTION: follow-up Compose env/override fixtures.
import { analyzeCompose, generateComposeEnvExample, mergeComposeSources, parseCompose } from "../compose";

const source = `services:
  web:
    image: example/web:latest
    ports: ["8080:80"]
    depends_on: [db]
    privileged: true
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: changeme
`;

describe("Compose review", () => {
  it("builds service topology and preserves source", () => {
    const result = parseCompose(source);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.source).toBe(source);
    expect(result.value.graph.nodes.map((node) => node.id)).toEqual(["db", "web"]);
    expect(result.value.graph.edges).toContainEqual({ from: "web", to: "db", label: "depends_on" });
  });

  it("reports privileged services, mutable tags, and literal secrets", () => {
    const result = parseCompose(source);
    if (!result.ok) return;
    const ids = analyzeCompose(result.value).map((finding) => finding.ruleId);
    expect(ids).toEqual(expect.arrayContaining(["COMPOSE_PRIVILEGED", "COMPOSE_MUTABLE_TAG", "SECRET_LITERAL"]));
  });

  it("generates a deterministic secret-free env example", () => {
    const result = generateComposeEnvExample(`services:\n  zed:\n    image: alpine\n    environment:\n      ZED_MODE: fast\n      API_TOKEN: literal-secret\n  api:\n    image: alpine\n    environment:\n      API_URL: \${API_URL}\n      API_TOKEN: \${API_TOKEN}\n`);
    expect(result).toEqual({ ok: true, value: "API_TOKEN=\nAPI_URL=\nZED_MODE=fast\n" });
  });

  it("merges base and override services deterministically and keeps extension fields", () => {
    const result = mergeComposeSources(
      `services:\n  api:\n    image: example/api:1\n    x-vendor-note: retained\n    environment:\n      MODE: base\n`,
      `services:\n  api:\n    environment:\n      MODE: override\n      DEBUG: "1"\n`,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toContain("x-vendor-note: retained");
    expect(result.value).toContain("MODE: override");
    expect(result.value).toContain("DEBUG: '1'");
    expect(parseCompose(result.value).ok).toBe(true);
  });
});
