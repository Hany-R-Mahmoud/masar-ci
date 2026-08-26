import type { ReviewArtifact, SourceArtifact, WorkbenchArtifact } from "./contracts";
import { generateYaml } from "@/lib/generate/yaml";
import { stableDigest } from "./digest";
import { isWorkspaceState } from "@/lib/workspace";

export const WORKBENCH_STORAGE_KEY = "masarci:workbench:v1";
export const LEGACY_ACTIONS_STORAGE_KEY = "masarci:workspace:v1";
export const LEGACY_MIGRATION_MARKER = "masarci:migration:legacy-actions:v1";
export const WORKBENCH_RECOVERY_KEY = "masarci:workbench:recovery:v1";

export interface WorkbenchState {
  readonly schemaVersion: 1;
  readonly artifacts: readonly WorkbenchArtifact[];
}

export type LoadStateResult =
  | { readonly ok: true; readonly value: WorkbenchState; readonly recovered: false }
  | { readonly ok: false; readonly error: string; readonly recovered: boolean };

export type SaveStateResult = { readonly ok: true } | { readonly ok: false; readonly error: string };

function getDefaultStorage(): Storage | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function isSourceArtifact(value: unknown): value is SourceArtifact {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const record = Object.entries(value);
  const fields = Object.fromEntries(record);
  return fields.mode === "source"
    && typeof fields.id === "string"
    && ["actions", "compose", "dockerfile", "kubernetes"].includes(String(fields.domain))
    && typeof fields.name === "string"
    && typeof fields.source === "string"
    && typeof fields.digest === "string"
    && typeof fields.updatedAt === "string";
}

function isReviewArtifact(value: unknown): value is ReviewArtifact {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const fields = Object.fromEntries(Object.entries(value));
  return fields.mode === "review"
    && fields.domain === "terraform"
    && typeof fields.id === "string"
    && typeof fields.name === "string"
    && typeof fields.digest === "string"
    && typeof fields.summary === "string"
    && typeof fields.updatedAt === "string";
}

function isWorkbenchState(value: unknown): value is WorkbenchState {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const fields = Object.fromEntries(Object.entries(value));
  return fields.schemaVersion === 1
    && Array.isArray(fields.artifacts)
    && fields.artifacts.every((artifact) => isSourceArtifact(artifact) || isReviewArtifact(artifact));
}

function quarantineInvalidState(raw: string, storage: Storage): boolean {
  try {
    storage.setItem(WORKBENCH_RECOVERY_KEY, raw);
    if (storage.getItem(WORKBENCH_RECOVERY_KEY) !== raw) return false;
    storage.removeItem(WORKBENCH_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function loadWorkbenchState(storage: Storage | undefined = getDefaultStorage()): LoadStateResult {
  if (!storage) return { ok: false, error: "Local storage is unavailable; the workspace will remain in memory only.", recovered: false };
  let raw: string | null = null;
  try {
    raw = storage.getItem(WORKBENCH_STORAGE_KEY);
    if (raw === null) return { ok: true, value: { schemaVersion: 1, artifacts: [] }, recovered: false };
    const parsed: unknown = JSON.parse(raw);
    if (isWorkbenchState(parsed)) return { ok: true, value: parsed, recovered: false };
    return { ok: false, error: "Stored workbench data did not match schema v1 and was quarantined for recovery.", recovered: quarantineInvalidState(raw, storage) };
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : "Unknown JSON error";
    return raw === null
      ? { ok: false, error: `Unable to read local workbench data: ${detail}`, recovered: false }
      : { ok: false, error: `Stored workbench data was malformed and was quarantined: ${detail}`, recovered: quarantineInvalidState(raw, storage) };
  }
}

export function latestArtifactForDomain(state: WorkbenchState, domain: WorkbenchArtifact["domain"]): WorkbenchArtifact | undefined {
  return [...state.artifacts]
    .filter((artifact) => artifact.domain === domain)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0];
}

export function saveWorkbenchState(state: WorkbenchState, storage: Storage | undefined = getDefaultStorage()): SaveStateResult {
  if (!isWorkbenchState(state)) return { ok: false, error: "Refused to persist invalid workbench state." };
  if (!storage) return { ok: false, error: "Unable to save locally: local storage is unavailable." };
  try {
    storage.setItem(WORKBENCH_STORAGE_KEY, JSON.stringify(state));
    return { ok: true };
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : "Unknown storage error";
    return { ok: false, error: `Unable to save locally: ${detail}` };
  }
}

export interface MigrationResult {
  readonly status: "migrated" | "already-complete" | "nothing-to-migrate" | "blocked";
  readonly migratedArtifacts: number;
  readonly message: string;
}

export function migrateLegacyActionsStorage(storage: Storage | undefined = getDefaultStorage()): MigrationResult {
  if (!storage) return { status: "blocked", migratedArtifacts: 0, message: "Legacy Actions migration skipped because local storage is unavailable." };
  try {
    if (storage.getItem(LEGACY_MIGRATION_MARKER) === "complete") {
      return { status: "already-complete", migratedArtifacts: 0, message: "Legacy Actions migration already completed." };
    }
    const legacyRaw = storage.getItem(LEGACY_ACTIONS_STORAGE_KEY);
    if (legacyRaw === null) {
      storage.setItem(LEGACY_MIGRATION_MARKER, "complete");
      return { status: "nothing-to-migrate", migratedArtifacts: 0, message: "No legacy Actions workspace was present." };
    }
    const legacy: unknown = JSON.parse(legacyRaw);
    if (!isWorkspaceState(legacy)) return { status: "blocked", migratedArtifacts: 0, message: "Legacy Actions data was retained because it did not validate." };
    const current = loadWorkbenchState(storage);
    const retained = current.ok ? current.value.artifacts.filter((artifact) => artifact.domain !== "actions") : [];
    const updatedAt = new Date().toISOString();
    const migrated: SourceArtifact[] = Object.values(legacy.workflows).map((entry) => {
      const source = generateYaml(entry.workflow);
      return { id: `actions-${entry.id}`, domain: "actions", mode: "source", name: `${entry.workflow.name}.yml`, source, digest: stableDigest(source), updatedAt };
    });
    const saved = saveWorkbenchState({ schemaVersion: 1, artifacts: [...retained, ...migrated] }, storage);
    if (!saved.ok) return { status: "blocked", migratedArtifacts: 0, message: saved.error };
    const verified = loadWorkbenchState(storage);
    if (!verified.ok || verified.value.artifacts.filter((artifact) => artifact.domain === "actions").length !== migrated.length) {
      return { status: "blocked", migratedArtifacts: 0, message: "Migration reread verification failed; legacy data remains untouched." };
    }
    storage.setItem(LEGACY_MIGRATION_MARKER, "complete");
    return { status: "migrated", migratedArtifacts: migrated.length, message: `Migrated ${migrated.length} Actions artifact(s); legacy data retained for rollback.` };
  } catch (error: unknown) {
    return { status: "blocked", migratedArtifacts: 0, message: error instanceof Error ? error.message : "Legacy migration failed." };
  }
}
