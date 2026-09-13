#!/usr/bin/env node
// Every class used in a page must have a rule in THAT PAGE's cascade.
//
// WHY THIS EXISTS. A vocabulary rename moved components.css and left eleven
// class names behind in the generator, still in their pre-rename spelling. The
// page emitted them, no rule
// matched them, and the "only real page in the repository" was substantially
// unstyled for as long as nobody compared the two files by hand.
//
// Nothing detected it because nothing could: the HTML side lived in a template
// literal and the CSS side in a stylesheet, and no tool read both. This reads
// both, and turns that whole category of silent drift into a failed build.
//
// PER PAGE, NOT GLOBALLY. An earlier version pooled every stylesheet and every
// page together. That pool would pass a page using .specimen just because some
// OTHER page defined it — false silence, which is the one failure mode this
// check must not have. So each page's cascade is resolved from its own <link>
// elements (followed through @import) plus its own inline <style>.
//
// It is deliberately DUMB: no real CSS or HTML parser, because a parser is a
// dependency and this has to run in CI with none. The consequence is that it
// can produce false ALARMS but not false silence, and that is the right
// asymmetry — the cost of a false alarm is adding a rule, the cost of false
// silence is shipping an unstyled page.
//
// Usage:  node _scripts/check-classes.mjs

import { readFileSync, existsSync } from "node:fs";
import { join, dirname, resolve as resolvePath, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PAGES = ["index.html"];

/** Follow @import so the whole graph is checked, not just the entry file. */
function graph(absCss, seen = new Set()) {
  if (seen.has(absCss) || !existsSync(absCss)) return seen;
  seen.add(absCss);
  for (const m of readFileSync(absCss, "utf8").matchAll(/@import\s+url\(["']?([^"')]+)["']?\)/g)) {
    graph(resolvePath(dirname(absCss), m[1]), seen);
  }
  return seen;
}

// Selectors only: strip comments and every declaration block first, or a
// property value like var(--x) or a font stack gets mined for ".foo".
const selectorsOf = (css) => {
  const out = new Set();
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\{[^{}]*\}/g, "{}");
  for (const m of stripped.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) out.add(m[1]);
  return out;
};

// VERIFIED, not assumed: `gh api repos/Anselmoo/Anselmoo` reports has_pages:false,
// and Anselmoo/Anselmoo.github.io does not exist. So if this site is ever served
// from GitHub Pages it is a PROJECT site at anselmoo.github.io/Anselmoo/ — under a
// subpath, with no user-site escape hatch available.
//
// That makes a root-relative path a silent 404 rather than a style question:
// href="/styles.css" resolves to anselmoo.github.io/styles.css, which is not this
// site. It works perfectly on localhost, which is exactly why it needs a check —
// the failure only appears after deployment, on somebody else's screen.
const ABSOLUTE = /(?:href|src)="(\/[^/][^"]*)"|url\(\s*["']?(\/[^/][^"')]*)/g;

let failed = 0;
const report = [];

for (const page of PAGES) {
  const abs = join(ROOT, page);
  if (!existsSync(abs)) { report.push(`${page}: not built, skipped`); continue; }
  const html = readFileSync(abs, "utf8");
  const pageDir = dirname(abs);

  const defined = new Set();
  let files = 0;
  for (const m of html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/g)) {
    for (const f of graph(resolvePath(pageDir, m[1]))) { defined.add(f); files++; }
  }
  const declared = new Set();
  for (const f of defined) for (const c of selectorsOf(readFileSync(f, "utf8"))) declared.add(c);
  // The page's own <style> is part of its cascade too.
  for (const m of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
    for (const c of selectorsOf(m[1])) declared.add(c);
  }

  const used = new Map();
  for (const m of html.matchAll(/\sclass=["']([^"']+)["']/g)) {
    for (const c of m[1].trim().split(/\s+/)) {
      if (!c) continue;
      if (!used.has(c)) used.set(c, 0);
      used.set(c, used.get(c) + 1);
    }
  }

  const absolute = [...html.matchAll(ABSOLUTE)].map((m) => m[1] || m[2]);
  if (absolute.length) {
    failed += absolute.length;
    console.error(`\n${page}: ${absolute.length} root-relative path(s) \u2014 these 404 under a project-site subpath`);
    for (const a of [...new Set(absolute)]) console.error(`  ${a}`);
  }

  const missing = [...used.keys()].filter((c) => !declared.has(c));
  if (missing.length) {
    failed += missing.length;
    console.error(`\n${page}: ${missing.length} class(es) with no rule in this page's cascade`);
    for (const c of missing) console.error(`  .${c}`.padEnd(30) + `used ${used.get(c)}×`);
  } else {
    report.push(`${page}: OK — ${used.size} classes, ${declared.size} declared across ${files} stylesheet(s), all paths relative`);
  }
}

if (failed) {
  console.error(`\nThe stylesheet is the contract. Either add the rule, or fix the emitter.`);
  process.exit(1);
}
console.log("check-classes: " + report.join("; "));
