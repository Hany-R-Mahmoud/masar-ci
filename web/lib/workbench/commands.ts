import type { Result, WorkbenchDomain } from "./contracts";
import { checkArtifactSafety } from "./limits";

export type SourceCommandReason = "edit" | "blank" | "template" | "fix";

export interface SourceCommand {
  readonly id: string;
  readonly domain: Exclude<WorkbenchDomain, "terraform">;
  readonly reason: SourceCommandReason;
  readonly before: string;
  readonly after: string;
  readonly createdAt: string;
  apply(): Result<string, string>;
  invert(): SourceCommand;
}

export function createSourceCommand(input: Readonly<{
  domain: Exclude<WorkbenchDomain, "terraform">;
  reason: SourceCommandReason;
  before: string;
  after: string;
  createdAt?: string;
}>): SourceCommand {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const id = `${input.domain}:${input.reason}:${createdAt}`;
  return {
    ...input,
    id,
    createdAt,
    apply() {
      const safety = checkArtifactSafety(input.after, input.domain);
      return safety.ok ? { ok: true, value: input.after } : { ok: false, error: safety.error.message };
    },
    invert() {
      return createSourceCommand({ domain: input.domain, reason: input.reason, before: input.after, after: input.before, createdAt });
    },
  };
}
