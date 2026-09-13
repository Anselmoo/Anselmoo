#!/usr/bin/env node
// The motion anti-rules, as a build check.
//
// tokens/motion.css states its anti-rules in prose. The mechanically checkable
// ones are checked here rather than trusted: no bare curve, no keyframes, no
// duration literal outside the token file.
//
// There used to be a fourth, "at most one user of --motion-considered at a time",
// left as prose because counting occasions needs a human. A human counted: the
// occasion did not exist, and the token was retired on 2026-09-12. A rule that
// cannot be checked is worth writing down; a rule guarding a token nobody uses
// is not.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIRS = ["components", "page", "tokens"];
const TOKEN_FILE = "tokens/motion.css";

const failures = [];
for (const dir of DIRS) {
  for (const name of readdirSync(join(ROOT, dir))) {
    const rel = `${dir}/${name}`;
    if (extname(name) !== ".css" || !statSync(join(ROOT, rel)).isFile()) continue;
    const src = readFileSync(join(ROOT, rel), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

    if (/@keyframes/.test(src)) {
      failures.push(`${rel}: @keyframes. An animation with no user-initiated occasion is decoration that moves.`);
    }
    if (rel !== TOKEN_FILE) {
      for (const m of src.matchAll(/(cubic-bezier\([^)]*\)|\bease-in-out\b|\bease-in\b|\bease-out\b)/g)) {
        failures.push(`${rel}: bare curve "${m[1]}". Use var(--ease-standard) — a second curve means two things move differently for a reason no reader can name.`);
      }
      // A duration literal inside a transition, rather than the token.
      for (const m of src.matchAll(/transition[^;]*?(\d+(?:\.\d+)?m?s)/g)) {
        if (!m[0].includes("var(--motion-")) {
          failures.push(`${rel}: literal duration "${m[1]}" in a transition. Use var(--motion-quick).`);
        }
      }
    }
  }
}

const motion = readFileSync(join(ROOT, TOKEN_FILE), "utf8");
if (!/@media\s*\(prefers-reduced-motion:\s*reduce\)/.test(motion)) {
  failures.push(`${TOKEN_FILE}: no prefers-reduced-motion block.`);
}
for (const token of ["--motion-quick", "--ease-standard"]) {
  if (!motion.includes(token)) failures.push(`${TOKEN_FILE}: ${token} is missing.`);
}

if (failures.length) {
  console.error(`check-motion: ${failures.length} violation(s)\n`);
  failures.forEach((f) => console.error("  - " + f));
  process.exit(1);
}
console.log(`check-motion: OK — no keyframes, no bare curves, no literal durations outside ${TOKEN_FILE}; reduced-motion guarded.`);
