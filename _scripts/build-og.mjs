#!/usr/bin/env node
// Generates the Open Graph images — identity inside someone else's feed.
//
// Call:  node _scripts/build-og.mjs
//
// WHY THIS CLASS EXISTS HERE AT ALL. An OG image is the one asset a reader sees
// before they see anything else, on a surface this system does not own and cannot
// style. It is also `derivable`: everything on it comes from the content model and
// the tokens, so the system can deliver the asset itself and not merely a rule.
//
// THE CANVAS IS THE SHEET AT 2x. 1200 divided by the page's own measure — 34em at
// 18px, so 612px — is 1.96. The scale is not chosen: the OG image is the portfolio
// page's sheet, twice. Display 62 becomes 124, body 18 becomes 36, and the margin
// is the page's own 7 %, which at 1200 is 84.
//
// LEGIBILITY AT FEED SIZE is the whole difficulty of the class, and it is arithmetic
// rather than taste. A card renders about 504px wide on X, 552 on LinkedIn and 360
// in Slack — the narrowest is 0.30 of the canvas. At that scale the name lands at
// 37px and the role line at 11px. The name is the part that must survive; the role
// line is for the reader who stopped.
//
// ONE FILE, NOT TWO. The image carries its own paper, so the feed's own band never
// touches it, and there is no ~dark variant. This is the same question the icon set
// answered with a midtone and the opposite answer, for a good reason: an icon is
// transparent and inherits its ground, an OG image brings one.
//
// THE MOTIF DOES NOT VARY. It is the measured ink ladder — the four roles at lengths
// proportional to their contrast against paper. It is a reading of the system, which
// is the thing every variant has in common. A per-project reading would need a
// per-project measurement, and the only one available (monthly downloads) is not
// comparable across npm, PyPI and a marketplace. An OG image carries identity, not
// data; the data has its own layer.
//
// NOT DELIVERED: the PNG. Feeds accept png and jpg, not svg. Rasterising needs
// either a headless browser or a library, and this repository installs neither —
// assets/og/og-lab.html renders these files at full size so the export is one
// browser away. Whatever rasterises them must have Inter available; the repo
// self-hosts it in assets/fonts.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const read = (p) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));
const profile = read("content/profile.json");
const projects = read("content/projects.json");
const tokens = read("tokens/tokens.json");

const W = 1200, H = 630;
const M = Math.round(W * 0.07);            // the page's own --page-inset, 7 %
const SCALE = 2;                            // 1200 / 612, the measure at 18px, rounded
const NAME_PX = 62 * SCALE;
const ROLE_PX = 18 * SCALE;
const ROLE_LEAD = Math.round(ROLE_PX * 1.65);
const COL = W - 2 * M;

// Inter's measured advance: 245.43 for the 27-character probe at 18px (FONT_CHAIN in
// _scripts/derive-tokens.mjs) — 0.505em per character. Used to wrap, because SVG has
// no line box and a generator must not guess at a width.
const ADVANCE_EM = 245.43 / 27 / 18;
const fits = (px) => Math.floor(COL / (px * ADVANCE_EM));

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Greedy wrap at a measured character count. Fails loudly rather than truncating. */
function wrap(text, px, maxLines) {
  const max = fits(px), out = [];
  let line = "";
  for (const word of String(text).split(/\s+/)) {
    const next = line ? line + " " + word : word;
    if (next.length > max && line) { out.push(line); line = word; } else line = next;
  }
  if (line) out.push(line);
  if (out.length > maxLines) {
    throw new Error(`role line needs ${out.length} lines at ${px}px, ${maxLines} allowed: "${text}"`);
  }
  return out;
}

/** The ink ladder, measured. Four rules, length proportional to contrast on paper. */
function ladder(band) {
  const c = tokens.contrast[band];
  const rows = [["ink", c.ink], ["secondary", c.secondary], ["tertiary", c.tertiary], ["decor", c.decor]];
  const top = c.ink.vsPaper;
  const bar = 10, gap = 16;
  const blockTop = H - M - (rows.length * bar + (rows.length - 1) * gap);
  return rows.map(([, v], i) =>
    `<rect x="${M}" y="${blockTop + i * (bar + gap)}" width="${Math.round((v.vsPaper / top) * COL)}" height="${bar}" fill="${v.hex}"/>`
  ).join("");
}

function og({ name, role }) {
  const lines = wrap(role, ROLE_PX, 2);
  const ink = tokens.contrast.light.ink.hex;
  const secondary = tokens.contrast.light.secondary.hex;
  const paper = tokens.bands.light.grounds.paper;
  const nameY = M + Math.round(NAME_PX * 0.95);
  const roleY = nameY + Math.round(NAME_PX * 0.55);
  const roleLines = lines.map((l, i) =>
    `<tspan x="${M}" y="${roleY + i * ROLE_LEAD}">${esc(l)}</tspan>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(name)} — ${esc(role)}">`
    + `<rect width="${W}" height="${H}" fill="${paper}"/>`
    + `<text x="${M}" y="${nameY}" font-family="Inter, 'Helvetica Neue', Arial, sans-serif" font-size="${NAME_PX}" font-weight="700" letter-spacing="${(-0.022 * NAME_PX).toFixed(2)}" fill="${ink}">${esc(name)}</text>`
    + `<text font-family="Inter, 'Helvetica Neue', Arial, sans-serif" font-size="${ROLE_PX}" font-weight="400" fill="${secondary}">${roleLines}</text>`
    + ladder("light")
    + `</svg>\n`;
}

// The portfolio's own line. Composed here for the same reason build-readme.mjs
// composes it: profile.json carries no one-line introduction for a person, and
// inventing a second one would give the two surfaces two different sentences.
const PORTFOLIO_ROLE = "Scientific software and its provenance.";

mkdirSync("assets/og", { recursive: true });
const written = [];
written.push(["assets/og/portfolio.svg", og({ name: profile.name, role: PORTFOLIO_ROLE })]);

// One per project. Committed here: the portfolio plus the first-named project of
// each category, which is the one the ordering rule already argues for.
for (const k of projects.categories) {
  const p = (k.projects || [])[0];
  if (!p) continue;
  written.push([`assets/og/${p.id}.svg`, og({ name: p.name, role: p.summary })]);
}
for (const [path, svg] of written) writeFileSync(join(ROOT, path), svg);

console.log(`assets/og/ written — ${written.length} images at ${W}x${H}, name ${NAME_PX}px, role ${ROLE_PX}px,`);
console.log(`  ${fits(ROLE_PX)} characters per role line at the measured advance. Rasterise via assets/og/og-lab.html.`);
