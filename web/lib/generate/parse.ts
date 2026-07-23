import { load } from "js-yaml";
import type {
  ActionRef,
  Job,
  Step,
  Trigger,
  TriggerEvent,
  Workflow,
} from "@/lib/model/types";

// Inverse of generateYaml (ADR-002): parse GitHub Actions YAML → canonical model.
// Tolerant: missing fields get sane defaults; unknown trigger events pass through.

function normalizeList(v: unknown): string[] {
  if (!v) return [];
  if (typeof v === "string") return [v];
  return Array.isArray(v) ? v.map(String) : [];
}

function parseTriggers(on: unknown): Trigger[] {
  const out: Trigger[] = [];
  const push = (event: string, cfg: unknown) => {
    const t: Trigger = { event: event as TriggerEvent };
    if (cfg && typeof cfg === "object") {
      const c = cfg as Record<string, unknown>;
      out_branches: {
        const b = c.branches;
        if (typeof b === "string") t.branches = [b];
        else if (Array.isArray(b)) t.branches = b.map(String);
        break out_branches;
      }
      const p = c.paths;
      if (typeof p === "string") t.paths = [p];
      else if (Array.isArray(p)) t.paths = p.map(String);
    }
    out.push(t);
  };
  if (typeof on === "string") push(on, null);
  else if (Array.isArray(on))
    for (const item of on) {
      if (typeof item === "string") push(item, null);
      else if (item && typeof item === "object")
        for (const [k, v] of Object.entries(item)) push(k, v);
    }
  else if (on && typeof on === "object")
    for (const [k, v] of Object.entries(on)) push(k, v);
  return out;
}

function parseActionRef(uses: string): ActionRef {
  const idx = uses.lastIndexOf("@");
  if (idx === -1) return { repo: uses, ref: "", isSha: false };
  const repo = uses.slice(0, idx);
  const ref = uses.slice(idx + 1);
  const isSha = /^[0-9a-f]{40}$/i.test(ref);
  return { repo, ref, isSha };
}

function parseSteps(steps: unknown, jobId: string): Step[] {
  if (!Array.isArray(steps)) return [];
  return steps.map((s: Record<string, unknown>, i: number): Step => {
    const id = typeof s.id === "string" ? s.id : `${jobId}-s${i + 1}`;
    if (typeof s.uses === "string") {
      return {
        id,
        name: typeof s.name === "string" ? s.name : (s.uses as string).split("/")[1] ?? id,
        kind: "action",
        action: parseActionRef(s.uses as string),
        with: s.with && typeof s.with === "object" ? (s.with as Record<string, string>) : undefined,
      };
    }
    return {
      id,
      name: typeof s.name === "string" ? s.name : "Run script",
      kind: "run",
      run: typeof s.run === "string" ? s.run : "",
      env: s.env && typeof s.env === "object" ? (s.env as Record<string, string>) : undefined,
    };
  });
}

function parseJobs(jobs: unknown): Job[] {
  if (!jobs || typeof jobs !== "object") return [];
  const out: Job[] = [];
  for (const [id, raw] of Object.entries(jobs as Record<string, unknown>)) {
    const j = (raw ?? {}) as Record<string, unknown>;
    out.push({
      id,
      name: id,
      runsOn: typeof j["runs-on"] === "string" ? j["runs-on"] : "ubuntu-latest",
      needs: normalizeList(j.needs),
      steps: parseSteps(j.steps, id),
      strategy: j.strategy as Job["strategy"],
      permissions:
        j.permissions && typeof j.permissions === "object"
          ? (j.permissions as Record<string, string>)
          : undefined,
    });
  }
  return out;
}

export function parseYaml(input: string): Workflow {
  const doc = load(input);
  if (!doc || typeof doc !== "object" || Array.isArray(doc)) {
    throw new Error("YAML is not a workflow mapping (expected an object at the top level).");
  }
  const d = doc as Record<string, unknown>;
  const workflow: Workflow = {
    name: typeof d.name === "string" ? d.name : "imported",
    on: parseTriggers(d.on),
    permissions:
      d.permissions && typeof d.permissions === "object"
        ? (d.permissions as Record<string, string>)
        : undefined,
    jobs: parseJobs(d.jobs),
  };
  return workflow;
}
