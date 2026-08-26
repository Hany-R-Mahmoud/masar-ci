import { describe, expect, it } from "vitest";
import { analyzeCompose, parseCompose } from "../compose";

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
});
