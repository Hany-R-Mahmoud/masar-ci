import { describe, expect, it } from "vitest";
import { createSourceCommand } from "../commands";

describe("typed source commands", () => {
  it("applies, validates, and inverts an authorable source change", () => {
    const command = createSourceCommand({ domain: "compose", reason: "template", before: "services: {}", after: "services:\n  web:\n    image: nginx", createdAt: "2026-08-25T00:00:00.000Z" });
    expect(command.apply()).toEqual({ ok: true, value: "services:\n  web:\n    image: nginx" });
    expect(command.invert().apply()).toEqual({ ok: true, value: "services: {}" });
    expect(command.id).toContain("compose:template");
  });

  it("fails closed on unsafe command content", () => {
    const command = createSourceCommand({ domain: "kubernetes", reason: "edit", before: "", after: "kind:\0Deployment" });
    expect(command.apply().ok).toBe(false); // TOKEN_POLICY_BATCHED_EXECUTION
  });
});
