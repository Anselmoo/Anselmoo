#!/usr/bin/env node
// Generates the imagery layer: the series palette and the seed motifs.
//
// Call:  node _scripts/build-imagery.mjs   (after npm run tokens)
//
// MONOCHROME, 2026-09-13. Black, grey and white only. The hue-bearing solve (hues 70,
// 107.5 and 145 at chroma 0.079) is retired, not kept "for plots": a palette nothing may
// use is the dead value this system polices. Lightness is the first channel and a
// pattern per series is the second (_scripts/series-patterns.mjs), so the encoding is
// redundant rather than resting on one weak channel.
//
// SOLVED: series 1 is the band's ink; every further series is one STEP of OKLCH
// lightness toward the ground, at chroma 0. STEP 0.155 is the one step imagery/
// series-mono.json measured for both bands — with hue gone there is nothing left to
// trade lightness against, so one step serves light and dark alike.
//
// CHECKED, and a failure writes nothing:
//   - every series clears 3:1 (WCAG 1.4.11, non-text) against the band's --paper-dim;
//   - neighbours sit at least GAP 0.10 apart in lightness, the desaturation floor;
//   - every emitted value carries OKLCH chroma <= 0.004.
//
// WHY THREE SERIES. The cap was never about hue: the figures this layer serves have
// three layers, and there are three geometries (solid, hatch, cross-hatch). A fourth
// would need a fourth geometry, not a fourth angle — 45° and 135° hatches read as one
// texture at nine pixels.

import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { formatHex, parse, converter } from "culori";
import { PATTERNS, CHROMA_MAX, patternDefs, fillFor, assertMonochrome } from "./series-patterns.mjs";

const ok = converter("oklch");
const toRgb = converter("rgb");
const lin = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const relLum = (hex) => { const c = toRgb(parse(hex)); return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b); };
const contrast = (a, b) => { const [x, y] = [relLum(a), relLum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const grey = (l) => formatHex({ mode: "oklch", l, c: 0, h: 0 });

const STEP = 0.155;
const FLOOR = 3.0;
const GAP = 0.10;

const tokens = JSON.parse(readFileSync("tokens/tokens.json", "utf8"));
const GROUNDS = { light: tokens.bands.light.grounds, dark: tokens.bands.dark.grounds };
const INK = { light: tokens.bands.light.roles.ink, dark: tokens.bands.dark.roles.ink };

const failures = [];
const bands = {};
for (const band of ["light", "dark"]) {
  const dir = band === "light" ? +1 : -1;   // toward the ground
  const inkL = ok(parse(INK[band])).l;
  const series = [0, 1, 2].map((i) => {
    const l = inkL + dir * i * STEP, hx = i === 0 ? INK[band] : grey(l);
    return {
      series: i + 1, hex: hx, l: +ok(parse(hx)).l.toFixed(4), pattern: PATTERNS[i],
      vsPaper: +contrast(hx, GROUNDS[band].paper).toFixed(2),
      vsDim: +contrast(hx, GROUNDS[band].dim).toFixed(2),
    };
  });
  for (const s of series) if (s.vsDim < FLOOR) failures.push(`${band}/series ${s.series}: ${s.vsDim} < ${FLOOR} against --paper-dim`);
  for (let i = 0; i < series.length - 1; i++) {
    const d = Math.abs(series[i + 1].l - series[i].l);
    if (d < GAP) failures.push(`${band}: series ${i + 1}/${i + 2} only ${d.toFixed(3)} apart in L (< ${GAP})`);
  }
  const lum = series.map((s) => relLum(s.hex));
  bands[band] = {
    series,
    deltaL: series.slice(1).map((s, i) => +Math.abs(s.l - series[i].l).toFixed(3)),
    greyscaleSpread: +(Math.max(...lum) - Math.min(...lum)).toFixed(3),
    worstVsDim: +Math.min(...series.map((s) => s.vsDim)).toFixed(2),
  };
}
if (failures.length) { console.error("FAILED:\n  " + failures.join("\n  ")); console.error("Nothing written."); process.exit(1); }

// ------------------------------------------------------------------ Motifs
//
// Both are 640x400 and both carry their own ground: a motif is delivered per band as
// its own file (…-dark), never recoloured by a CSS filter, and an <img> reaches no
// custom property.
const W = 640, H = 400, M = 48;   // margin 48 = --space-7, the sheet's own step

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const open = (label) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(label)}">`;

/** Level 4 — a project reading: publications per year, stacked by kind, one pattern per kind.
 *  No axis, no tick marks, no labels: a level-4 motif carries none (handbook). */
function publicationsMotif(band, works) {
  const g = GROUNDS[band], s = bands[band].series;
  const dated = works.filter((w) => w.year);
  const years = [...new Set(dated.map((w) => w.year))].sort();
  const span = [];
  for (let y = years[0]; y <= years[years.length - 1]; y++) span.push(y);
  const kind = (t) => (t === "journal-article" ? 0 : t === "book-chapter" ? 1 : 2);
  const counts = span.map((y) => [0, 0, 0].map((_, k) => dated.filter((w) => w.year === y && kind(w.type) === k).length));
  const max = Math.max(...counts.map((c) => c[0] + c[1] + c[2]));
  const bw = (W - 2 * M) / span.length, gap = bw * 0.28, unit = (H - 2 * M) / max;
  const bars = counts.map((c, i) => {
    let y = H - M;
    return c.map((n, k) => {
      if (!n) return "";
      const h = n * unit; y -= h;
      return `<rect x="${(M + i * bw + gap / 2).toFixed(1)}" y="${y.toFixed(1)}" width="${(bw - gap).toFixed(1)}" height="${h.toFixed(1)}" fill="${fillFor(s, k)}"/>`;
    }).join("");
  }).join("");
  const label = `Publications per year, ${span[0]} to ${span[span.length - 1]}, stacked by kind: `
    + `${dated.length} dated works in three series — solid, hatched, cross-hatched.`;
  return `${open(label)}<defs>${patternDefs(s)}</defs><rect width="${W}" height="${H}" fill="${g.paper}"/>${bars}</svg>\n`;
}

/** Level 3 — not project data: the bisection that produced --ink-secondary.
 *  A shape derived from a reading, and the reading is the system's own. */
function bisectionMotif(band) {
  const g = GROUNDS[band], s = bands[band].series;
  let lo = 0.02, hi = 0.98;
  const steps = [];
  for (let i = 0; i < 14; i++) {
    const m = (lo + hi) / 2;
    const good = contrast(grey(m), GROUNDS.light.dim) >= 7.0;
    steps.push({ lo, hi, m, good });
    good ? (lo = m) : (hi = m);
  }
  const x = (l) => M + ((l - 0.02) / 0.96) * (W - 2 * M);
  const rowH = (H - 2 * M) / steps.length;
  const rows = steps.map((st, i) => {
    const y = M + i * rowH + rowH / 2, h = Math.max(2, rowH * 0.42);
    const keptLo = st.good ? st.m : st.lo, keptHi = st.good ? st.hi : st.m;
    return `<rect x="${x(st.lo).toFixed(1)}" y="${(y - h / 2).toFixed(1)}" width="${(x(st.hi) - x(st.lo)).toFixed(1)}" height="${h.toFixed(1)}" fill="${fillFor(s, 2)}"/>`
         + `<rect x="${x(keptLo).toFixed(1)}" y="${(y - h / 2).toFixed(1)}" width="${(x(keptHi) - x(keptLo)).toFixed(1)}" height="${h.toFixed(1)}" fill="${fillFor(s, 0)}"/>`;
  }).join("");
  const label = "Fourteen steps of the bisection that solved --ink-secondary: "
    + "each row is the interval, the solid part is the half that survived the step.";
  return `${open(label)}<defs>${patternDefs(s)}</defs><rect width="${W}" height="${H}" fill="${g.paper}"/>${rows}</svg>\n`;
}

// Read, not fetch: Node's fetch does not accept file: URLs.
const works = JSON.parse(readFileSync(new URL("../content/publications.json", import.meta.url), "utf8")).works;

const out = {
  "imagery/series.json": JSON.stringify({
    $comment: "GENERATED by _scripts/build-imagery.mjs — do not edit by hand.",
    method: {
      solved: "series 1 is the band's ink; each further series one STEP of OKLCH lightness toward the ground, at chroma 0",
      step: STEP, floor: FLOOR, ladderGap: GAP, chromaMax: CHROMA_MAX, patterns: PATTERNS,
      why: "no colour at all: black, grey and white, with a pattern per series so the encoding survives desaturation, photocopies and a 9px bar",
      seriesLimit: "three: the figures have three layers and there are three geometries — a fourth needs a fourth geometry, not a fourth angle",
    },
    bands,
  }, null, 2) + "\n",
  "imagery/publications-by-year.svg": publicationsMotif("light", works),
  "imagery/publications-by-year-dark.svg": publicationsMotif("dark", works),
  "imagery/bisection.svg": bisectionMotif("light"),
  "imagery/bisection-dark.svg": bisectionMotif("dark"),
};
for (const [f, text] of Object.entries(out)) assertMonochrome(f, text);
mkdirSync("imagery", { recursive: true });
for (const [f, text] of Object.entries(out)) writeFileSync(f, text);

console.log(`imagery/ written — 3 grey series per band (step ${STEP}), worst ${bands.light.worstVsDim} light / ${bands.dark.worstVsDim} dark against --paper-dim,`);
console.log(`  greyscale spread ${bands.light.greyscaleSpread} / ${bands.dark.greyscaleSpread}, patterns: ${PATTERNS.join(" · ")}.`);
