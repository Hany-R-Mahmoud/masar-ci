import { beforeEach, describe, expect, it } from "vitest";
import { createSampleWorkflow } from "@/lib/sample";
import { createWorkspace } from "@/lib/workspace";
import { LEGACY_ACTIONS_STORAGE_KEY, LEGACY_MIGRATION_MARKER, latestArtifactForDomain, loadWorkbenchState, migrateLegacyActionsStorage, saveWorkbenchState, WORKBENCH_RECOVERY_KEY, WORKBENCH_STORAGE_KEY } from "../persistence";

describe("versioned workbench persistence", () => {
  beforeEach(() => localStorage.clear());

  it("round-trips validated source and review artifacts", () => {
    const state = {
      schemaVersion: 1 as const,
      artifacts: [
        {
          id: "compose-1",
          domain: "compose" as const,
          mode: "source" as const,
          name: "compose.yaml",
          source: "services: {}",
          digest: "digest-1",
          updatedAt: "2026-08-25T00:00:00.000Z",
        },
      ],
    };
    expect(saveWorkbenchState(state).ok).toBe(true);
    expect(loadWorkbenchState()).toEqual({ ok: true, value: state, recovered: false });
  });

  it("recovers safely from malformed storage", () => {
    localStorage.setItem(WORKBENCH_STORAGE_KEY, "{not json");
    const result = loadWorkbenchState();
    expect(result.ok).toBe(false);
    expect(result.recovered).toBe(true);
    expect(localStorage.getItem(WORKBENCH_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(WORKBENCH_RECOVERY_KEY)).toBe("{not json");
  });

  it("selects the latest persisted artifact for reload hydration", () => {
    const base = { domain: "compose" as const, mode: "source" as const, name: "compose.yaml", source: "services: {}", digest: "digest" };
    const state = { schemaVersion: 1 as const, artifacts: [
      { ...base, id: "old", updatedAt: "2026-08-24T00:00:00.000Z" },
      { ...base, id: "new", updatedAt: "2026-08-25T00:00:00.000Z" },
    ] };
    expect(latestArtifactForDomain(state, "compose")?.id).toBe("new");
  });

  it("migrates legacy Actions data once and keeps rollback source", () => {
    const legacy = createWorkspace(createSampleWorkflow(), "legacy-1");
    localStorage.setItem(LEGACY_ACTIONS_STORAGE_KEY, JSON.stringify(legacy));
    const result = migrateLegacyActionsStorage();
    expect(result.status).toBe("migrated");
    expect(result.migratedArtifacts).toBe(1);
    expect(loadWorkbenchState()).toMatchObject({ ok: true, value: { artifacts: [{ domain: "actions", mode: "source" }] } });
    expect(localStorage.getItem(LEGACY_ACTIONS_STORAGE_KEY)).not.toBeNull();
    expect(localStorage.getItem(LEGACY_MIGRATION_MARKER)).toBe("complete");
    expect(migrateLegacyActionsStorage().status).toBe("already-complete");
  });

  it("reports storage failures without treating them as an empty workspace", () => {
    const blockedStorage = {
      getItem: () => { throw new Error("SecurityError"); },
      setItem: () => { throw new Error("SecurityError"); },
      removeItem: () => { throw new Error("SecurityError"); },
    } as unknown as Storage;

    expect(loadWorkbenchState(blockedStorage)).toMatchObject({ ok: false, recovered: false });
    expect(migrateLegacyActionsStorage(blockedStorage)).toMatchObject({ status: "blocked" });
    expect(saveWorkbenchState({ schemaVersion: 1, artifacts: [] }, blockedStorage)).toMatchObject({ ok: false });
  });
});
