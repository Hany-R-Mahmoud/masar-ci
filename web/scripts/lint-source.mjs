import { readdir, readFile } from "node:fs/promises";
import { extname, join } from "node:path";

const roots = ["app", "components", "lib"];
const violations = [];
const rules = [
  [/@ts-(?:ignore|nocheck)/, "TypeScript suppression"],
  [/eslint-disable/, "lint suppression"],
  [/(?:\bas\s+any\b|:\s*any\b|<any>)/, "explicit any escape"],
  [/ignoreBuildErrors\s*:\s*true/, "build type-check bypass"],
];

async function visit(path) {
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const target = join(path, entry.name);
    if (entry.isDirectory()) await visit(target);
    else if ([".ts", ".tsx", ".js", ".mjs"].includes(extname(entry.name))) {
      const lines = (await readFile(target, "utf8")).split("\n");
      for (const [index, line] of lines.entries()) for (const [pattern, label] of rules) {
        if (pattern.test(line)) violations.push(`${target}:${index + 1} ${label}`);
      }
    }
  }
}

for (const root of roots) await visit(root);
if (violations.length > 0) {
  console.error(violations.join("\n"));
  process.exitCode = 1;
} else console.log("Source policy lint passed.");
