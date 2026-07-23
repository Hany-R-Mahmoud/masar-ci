import type { Rule } from "../types";
import { scriptInjection } from "./script-injection";
import { unpinnedAction } from "./unpinned-action";
import { excessivePermissions } from "./excessive-permissions";
import { pullRequestTarget } from "./pull-request-target";

// Rule registry — add a file + register here; canvas/generator are untouched.
export const RULES: Rule[] = [
  scriptInjection,
  unpinnedAction,
  excessivePermissions,
  pullRequestTarget,
];
