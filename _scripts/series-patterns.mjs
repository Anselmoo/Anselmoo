// The monochrome imagery layer's shared vocabulary: patterns, the mark placed in
// canvas space, and the chroma gate every generator runs before it writes.
//
// A PATTERN IS THREE CHOICES, NOT ONE. Geometry (solid, 45° hatch at a 4px period and
// 1.2 stroke, cross-hatch on a 5px grid at 1 stroke — guidelines/imagery-series.html),
// the tone of its GROUND, and the tone of its LINES. Grey is not a colour here: grey on
// white, grey on black and ink on grey are all inside the rule, and each reads as a
// different fill. That multiplies what three geometries can tell apart without a fourth
// geometry, which would otherwise be the only way past three series.
//
// A TILE IS OPAQUE. It paints its own ground, so a papercut layer stays paper and
// never shows the layer beneath it through the gaps of its own hatch.
//
// CANVAS SPACE, NOT A SCALED GROUP. A userSpaceOnUse pattern inside `scale(8.3)` has an
// 8.3x period — a 4px hatch becomes 33px stripes. The mark is therefore transformed
// point by point and the pattern keeps its stated period at every size.

import { converter, parse } from "culori";

const ok = converter("oklch");

export const CHROMA_MAX = 0.004;
export const GEOMETRIES = {
  solid: "solid",
  hatch: "hatch 45°, 4px, stroke 1.2",
  cross: "cross-hatch 5px, stroke 1",
};
export const PATTERNS = [GEOMETRIES.solid, GEOMETRIES.hatch, GEOMETRIES.cross];

/** One opaque tile: a geometry, drawn in `line` on `ground`. */
export function tile(id, geometry, ground, line) {
  if (geometry === "hatch") {
    return `<pattern id="${id}" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">`
      + `<rect width="4" height="4" fill="${ground}"></rect><line x1="0" y1="0" x2="0" y2="4" stroke="${line}" stroke-width="1.2"></line></pattern>`;
  }
  if (geometry === "cross") {
    return `<pattern id="${id}" width="5" height="5" patternUnits="userSpaceOnUse">`
      + `<rect width="5" height="5" fill="${ground}"></rect><line x1="0" y1="0" x2="0" y2="5" stroke="${line}" stroke-width="1"></line>`
      + `<line x1="0" y1="0" x2="5" y2="0" stroke="${line}" stroke-width="1"></line></pattern>`;
  }
  throw new Error(`unknown geometry "${geometry}"`);
}

/** Chart series: ink on the series grey. Series 1 solid, 2 hatched, 3 cross-hatched. */
export function patternDefs(series, prefix = "s") {
  const line = series[0].hex;
  return tile(`${prefix}2`, "hatch", series[1].hex, line) + tile(`${prefix}3`, "cross", series[2].hex, line);
}

/** Series index 0..2 to an SVG fill: solid for series 1, a pattern reference otherwise. */
export const fillFor = (series, i, prefix = "s") => (i === 0 ? series[0].hex : `url(#${prefix}${i + 1})`);

/**
 * Papercut layers whose grounds ALTERNATE: layer 1 solid ink, layer 2 a grey hatch on
 * the paper tone, layer 3 a grey cross-hatch on the ink tone. Adjacent layers differ in
 * ground as well as in geometry, so every cut edge is a light-against-dark edge in both
 * bands and the stack reads as cut paper at any size.
 */
export function alternatingLayers(series, paper, prefix = "a") {
  const ink = series[0].hex;
  const spec = [
    { geometry: "solid", ground: ink, line: null },
    { geometry: "hatch", ground: paper, line: series[1].hex },
    { geometry: "cross", ground: ink, line: series[2].hex },
  ];
  return spec.map((s, i) => ({
    ...s,
    pattern: GEOMETRIES[s.geometry],
    fill: s.geometry === "solid" ? s.ground : `url(#${prefix}${i + 1})`,
    def: s.geometry === "solid" ? "" : tile(`${prefix}${i + 1}`, s.geometry, s.ground, s.line),
  }));
}

/** The mark's polygon, scaled by k, rotated about its own centre, placed at (x, y). */
export function markPathAt(points, vb, x, y, k, rotDeg = 0) {
  const r = (rotDeg * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r), m = vb / 2;
  const pts = points.map(([px, py]) => {
    const dx = px - m, dy = py - m;
    return [x + (m + dx * c - dy * s) * k, y + (m + dx * s + dy * c) * k];
  });
  return "M " + pts.map(([px, py]) => `${+px.toFixed(2)} ${+py.toFixed(2)}`).join(" L ") + " Z";
}

/** Every hex in `text` with OKLCH chroma above CHROMA_MAX. Empty means monochrome. */
export function chromaOffenders(text) {
  const hexes = [...new Set(text.match(/#[0-9a-fA-F]{6}\b/g) || [])];
  return hexes.map((h) => [h, ok(parse(h))?.c ?? 0]).filter(([, c]) => c > CHROMA_MAX);
}

/** Refuse to write a file that carries colour. */
export function assertMonochrome(label, text) {
  const bad = chromaOffenders(text);
  if (bad.length) {
    console.error(`FAILED: ${label} carries chroma — ${bad.map(([h, c]) => `${h} c=${c.toFixed(3)}`).join(", ")}`);
    console.error("Nothing written.");
    process.exit(1);
  }
}
