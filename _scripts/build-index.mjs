#!/usr/bin/env node
// Renders templates/portfolio-index/PortfolioIndex.dc.html to a static index.html at
// the repository root.
//
// THE TEMPLATE IS THE PAGE. It runs in Claude Design on support.js + ds-base.js; this
// script removes that runtime and keeps everything else, so a change made in the
// template is on the page after the next run and nowhere else has to be touched.
//
//   <x-dc> … </x-dc>          -> <body>, verbatim except for the rewrites below
//   <helmet>                  -> ds-base.js becomes ONE <link> to styles.css, which
//                                @imports the same token and component files; the
//                                helmet's inline <style> moves to <head>
//   {{ name }}                -> an empty element marked data-dc-bind="name"
//   ../../path                -> path (template two levels down, index.html at root)
//   data-comment-anchor="…"   -> dropped, it is editor bookkeeping
//   <script data-dc-script>   -> kept verbatim, driven by a DCLogic shim below
//
// EVERY REWRITE FAILS LOUDLY. The previous generator dropped content silently, twice.
// So an unknown helmet child, a placeholder that is not the whole content of its
// element, a leftover ../ or a path that does not exist on disk stops the build
// instead of producing a page that is quietly missing something.
//
// Usage:  node _scripts/build-index.mjs

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { esc, faviconDataUri } from "../lib/render.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TEMPLATE = "templates/portfolio-index/PortfolioIndex.dc.html";
const TARGET = "index.html";

const src = readFileSync(join(ROOT, TEMPLATE), "utf8");
const read = (p) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));
const fail = (msg) => {
  console.error(`build-index: ${msg}\n  in ${TEMPLATE}`);
  process.exit(1);
};

const profile = read("content/profile.json");
const motivation = read("content/motivation.json");

// ------------------------------------------------------------------ The body

const open = /<x-dc(?:\s[^>]*)?>/.exec(src);
const close = src.lastIndexOf("</x-dc>");
if (!open || close < open.index) fail("no <x-dc> … </x-dc> block");
let body = src.slice(open.index + open[0].length, close);

// ---------------------------------------------------------------- The helmet

const helmet = /<helmet>([\s\S]*?)<\/helmet>/.exec(body);
if (!helmet) fail("no <helmet> block");
body = body.replace(helmet[0], "");

const styles = [...helmet[1].matchAll(/<style[^>]*>[\s\S]*?<\/style>/g)].map((m) => m[0].trim());
const loaders = [...helmet[1].matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g)];
for (const [, s] of loaders) {
  if (s !== "./ds-base.js") fail(`helmet loads ${s}; only ./ds-base.js has a static equivalent`);
}
const leftover = loaders.reduce((h, m) => h.replace(m[0], ""), helmet[1])
  .replace(/<style[^>]*>[\s\S]*?<\/style>/g, "")
  .trim();
if (leftover) fail(`helmet carries something with no static equivalent:\n  ${leftover.slice(0, 160)}`);

// ------------------------------------------------------------------ Rewrites

body = body
  .replace(/<!--\s*@template[\s\S]*?-->\s*/, "")
  .replace(/\s+data-comment-anchor="[^"]*"/g, "")
  .replaceAll("../../", "");

const bound = new Set();
body = body.replace(
  /<(\w+)([^>]*)>\s*\{\{\s*(\w+)\s*\}\}\s*<\/\1>/g,
  (_, tag, attrs, name) => {
    bound.add(name);
    return `<${tag}${attrs} data-dc-bind="${name}"></${tag}>`;
  }
);
const stray = /.{0,40}\{\{.{0,40}/.exec(body);
if (stray) fail(`a {{ }} placeholder is not the whole content of its element: …${stray[0]}…`);

const upward = /.{0,40}\.\.\/.{0,40}/.exec(body);
if (upward) fail(`a path still climbs out of the root after rewriting: …${upward[0]}…`);

const missing = new Set();
for (const m of body.matchAll(/\b(?:src|href)="([^"]*)"|url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) {
  const p = m[1] ?? m[2];
  if (!p || /^(?:[a-z]+:|#|\/\/)/i.test(p)) continue;
  if (!existsSync(join(ROOT, p.split(/[?#]/)[0]))) missing.add(p);
}
if (missing.size) fail(`paths that do not exist:\n  ${[...missing].join("\n  ")}`);

// --------------------------------------------------------------- The logic

const logic = /<script type="text\/x-dc" data-dc-script[^>]*>([\s\S]*?)<\/script>/.exec(src);
if (!logic) fail("no <script data-dc-script>");
if (!/class Component extends DCLogic\b/.test(logic[1])) {
  fail("data-dc-script defines no `class Component extends DCLogic`");
}
for (const name of bound) {
  if (!logic[1].includes(name)) fail(`{{ ${name} }} is bound in the markup but never set by the logic`);
}

// The subset of DCLogic the template uses: state, setState, renderVals and the
// mount hook. Values land in the elements marked data-dc-bind; nothing else is
// re-rendered, because nothing else in the template is dynamic.
const shim = `class DCLogic {
  state = {};
  setState(patch) { this.state = { ...this.state, ...patch }; this.paint(); }
  paint() {
    const vals = this.renderVals ? this.renderVals() : this.state;
    for (const el of document.querySelectorAll("[data-dc-bind]")) {
      const v = vals[el.dataset.dcBind];
      el.textContent = v == null ? "" : String(v);
    }
  }
}`;

// ------------------------------------------------------------------ Writing

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(profile.name)}</title>
<meta name="description" content="${esc(motivation.lead)}">
<link rel="icon" href="${faviconDataUri()}">
<link rel="preload" href="assets/fonts/inter-latin-var.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="styles.css">
${styles.join("\n")}
</head>
<body>
<!-- GENERATED by _scripts/build-index.mjs from ${TEMPLATE}. Edit the template, not this file. -->
${body.trim()}
<script>
(() => {
${shim}
${logic[1].trim()}
const component = new Component();
component.paint();
component.componentDidMount?.();
})();
</script>
</body>
</html>
`;

writeFileSync(join(ROOT, TARGET), html);

const sections = (body.match(/<section\b/g) || []).length;
console.log(
  `${TARGET} written from ${TEMPLATE} — ${sections} sections, ` +
    `bound: ${[...bound].join(", ") || "none"}, ${(html.length / 1024).toFixed(0)} kB`
);
