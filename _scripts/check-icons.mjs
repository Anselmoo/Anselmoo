// Measures the icon set and fails when a drawing leaves the system.
//
// The growth rule in assets/icons/README.md was authored because it could not be
// measured. Most of it still cannot be — no script decides whether a metaphor is
// dated. But four of its clauses ARE geometry, and geometry is exactly the kind of
// rule that rots quietly: an icon drawn a little smaller, or with a little less ink,
// looks fine on its own and makes the family look almost-right.
//
// Call:  node _scripts/check-icons.mjs [icon-directory]
//
// KEYLINES. Derived from the set as drawn, not imported from another system: round
// 13x13, square 11x11, portrait 9x13, landscape 13x9.
//
// The square is SMALLER than the round one on purpose, and not by taste: a square at
// the same extent covers about a quarter more area than a circle and reads heavier.
// The received correction is 0.9. Here it lands at 11/13 = 0.846, because a 1-unit
// stroke only renders crisp at 18px when its edges sit on half-integers, so the legal
// square extents are 11 and 13 and nothing in between.
//
// WHAT THE PARSER READS, 2026-09-13. The first version read absolute M/L/H/V only,
// "by rule" — and the set it guarded grew past that rule: rounded rects, circles, arcs
// and relative commands arrived with the eleven-icon amendment and the checker threw
// on the first of them, so `npm run icons` measured nothing at all. It now reads what
// the family actually draws. Curves are sampled for their extent and their length, and
// the half-unit grid applies to line vertices only: a curve has no vertex to place.
const KEYLINES = [
  { name: "round",    w: 13, h: 13, note: "circle, hexagon, any silhouette that reads as round" },
  { name: "square",   w: 11, h: 11, note: "0.846 of the round keyline — the nearest legal value to the 0.9 ideal" },
  { name: "portrait", w: 9,  h: 13, note: "upright sheets and documents" },
  { name: "landscape", w: 13, h: 9, note: "wide silhouettes: a DOI's two links, an envelope" },
];
const CANVAS = 18;
const MIN_CLEARANCE = 2.5;   // live area 13 on an 18 canvas
const KEYLINE_TOL = 0.5;     // half a grid unit
const INK_BAND = 0.20;       // +/- 20 % of the set median
const SET_STOP = 16;         // the amended growth rule's stop condition (assets/icons/README.md)
const ARC_SAMPLES = 24;

import { readdirSync, readFileSync } from "node:fs";

const DIR = process.argv[2] ?? "assets/icons";

/** Points along an SVG elliptical arc (SVG 1.1 F.6.5, endpoint to centre form). */
function arcPoints(x1, y1, rx, ry, phiDeg, large, sweep, x2, y2) {
  if (rx === 0 || ry === 0) return [[x2, y2]];
  const phi = (phiDeg * Math.PI) / 180, cp = Math.cos(phi), sp = Math.sin(phi);
  const dx = (x1 - x2) / 2, dy = (y1 - y2) / 2;
  const x1p = cp * dx + sp * dy, y1p = -sp * dx + cp * dy;
  rx = Math.abs(rx); ry = Math.abs(ry);
  const lam = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lam > 1) { rx *= Math.sqrt(lam); ry *= Math.sqrt(lam); }
  const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
  const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
  const co = (large === sweep ? -1 : 1) * Math.sqrt(Math.max(0, num / den));
  const cxp = (co * rx * y1p) / ry, cyp = (-co * ry * x1p) / rx;
  const cx = cp * cxp - sp * cyp + (x1 + x2) / 2, cy = sp * cxp + cp * cyp + (y1 + y2) / 2;
  const ang = (ux, uy, vx, vy) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
  const t1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let dt = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
  if (!sweep && dt > 0) dt -= 2 * Math.PI; else if (sweep && dt < 0) dt += 2 * Math.PI;
  return Array.from({ length: ARC_SAMPLES }, (_, i) => {
    const t = t1 + (dt * (i + 1)) / ARC_SAMPLES;
    return [cx + rx * Math.cos(t) * cp - ry * Math.sin(t) * sp, cy + rx * Math.cos(t) * sp + ry * Math.sin(t) * cp];
  });
}

/** Path data to polylines. Returns { lines, vertices }: every sampled point, and the
 *  subset that are true line vertices (the ones the half-unit grid governs). */
function parsePath(d) {
  const tok = d.match(/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?)(?:e[-+]?\d+)?/g) ?? [];
  const lines = [], vertices = [];
  let cur = null, x = 0, y = 0, sx = 0, sy = 0, cmd = "", i = 0;
  const num = () => parseFloat(tok[i++]);
  const line = (nx, ny) => { x = nx; y = ny; cur.push([x, y]); vertices.push([x, y]); };
  while (i < tok.length) {
    if (/^[a-zA-Z]$/.test(tok[i])) {
      cmd = tok[i++];
      if (cmd === "Z" || cmd === "z") { cur?.push([sx, sy]); x = sx; y = sy; }
      continue;
    }
    const rel = cmd === cmd.toLowerCase();
    switch (cmd.toUpperCase()) {
      case "M": {
        const nx = num() + (rel ? x : 0), ny = num() + (rel ? y : 0);
        x = sx = nx; y = sy = ny; cur = [[x, y]]; lines.push(cur); vertices.push([x, y]);
        cmd = rel ? "l" : "L";   // further pairs after a moveto are implicit linetos
        break;
      }
      case "L": { const nx = num() + (rel ? x : 0), ny = num() + (rel ? y : 0); line(nx, ny); break; }
      case "H": line(num() + (rel ? x : 0), y); break;
      case "V": line(x, num() + (rel ? y : 0)); break;
      case "A": {
        const rx = num(), ry = num(), rot = num(), large = num(), sweep = num();
        const nx = num() + (rel ? x : 0), ny = num() + (rel ? y : 0);
        for (const p of arcPoints(x, y, rx, ry, rot, !!large, !!sweep, nx, ny)) cur.push(p);
        x = nx; y = ny;
        break;
      }
      default:
        throw new Error(`unsupported path command "${cmd}" — the family draws lines and arcs only`);
    }
  }
  return { lines, vertices };
}

/** A rounded rect as a closed outline: straight edges plus sampled quarter-arcs. */
function rectShape(x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  const d = r > 0
    ? `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`
    : `M${x} ${y}H${x + w}V${y + h}H${x}Z`;
  const shape = parsePath(d);
  // Rect edges are what the grid governs; corner tangent points of a radius are not.
  shape.vertices = r > 0 ? [[x, y], [x + w, y + h]] : shape.vertices;
  return shape;
}

const circleShape = (cx, cy, r) =>
  ({ lines: [Array.from({ length: ARC_SAMPLES * 2 + 1 }, (_, i) => [cx + r * Math.cos((i * Math.PI) / ARC_SAMPLES), cy + r * Math.sin((i * Math.PI) / ARC_SAMPLES)])], vertices: [] });

const attr = (tag, a) => { const m = tag.match(new RegExp(`\\s${a}="([^"]+)"`)); return m ? parseFloat(m[1]) : 0; };

function shapesOf(src) {
  const shapes = [];
  for (const m of src.matchAll(/<path\b[^>]*\sd="([^"]+)"/g)) shapes.push(parsePath(m[1]));
  for (const m of src.matchAll(/<rect\b[^>]*>/g)) shapes.push(rectShape(attr(m[0], "x"), attr(m[0], "y"), attr(m[0], "width"), attr(m[0], "height"), attr(m[0], "rx")));
  for (const m of src.matchAll(/<circle\b[^>]*>/g)) shapes.push(circleShape(attr(m[0], "cx"), attr(m[0], "cy"), attr(m[0], "r")));
  return shapes;
}

const files = readdirSync(DIR).filter((f) => f.endsWith(".svg"));
const names = [...new Set(files.map((f) => f.replace(/(-mid)?\.svg$/, "")))].sort();
const failures = [];
const rows = [];

for (const name of names) {
  const src = readFileSync(`${DIR}/${name}.svg`, "utf8").replace(/<metadata>[\s\S]*?<\/metadata>/g, "");
  let shapes;
  try { shapes = shapesOf(src); } catch (e) { failures.push(`${name}: ${e.message}`); continue; }
  const lines = shapes.flatMap((s) => s.lines), vertices = shapes.flatMap((s) => s.vertices);
  const pts = lines.flat();
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const box = { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
  const w = +(box.x1 - box.x0).toFixed(2), h = +(box.y1 - box.y0).toFixed(2);
  const clearance = +Math.min(box.x0, box.y0, CANVAS - box.x1, CANVAS - box.y1).toFixed(2);
  const ink = +lines.reduce((s, p) => s + p.slice(1).reduce((t, q, i) => t + Math.hypot(q[0] - p[i][0], q[1] - p[i][1]), 0), 0).toFixed(2);
  const key = KEYLINES.find((k) => Math.abs(k.w - w) <= KEYLINE_TOL && Math.abs(k.h - h) <= KEYLINE_TOL);

  if (!/viewBox="0 0 18 18"/.test(src)) failures.push(`${name}: not an ${CANVAS}-unit canvas`);
  if (!/stroke-width="1"/.test(src)) failures.push(`${name}: stroke is not 1 unit — the set has one weight`);
  if (!/stroke-linecap="round"/.test(src) || !/stroke-linejoin="round"/.test(src)) failures.push(`${name}: caps and joins must be round`);
  if (!/fill="none"/.test(src)) failures.push(`${name}: outlined only, no fill`);
  if (clearance < MIN_CLEARANCE) failures.push(`${name}: clearance ${clearance} < ${MIN_CLEARANCE} — it oversteps the live area`);
  if (!key) failures.push(`${name}: silhouette ${w}x${h} sits on no keyline (${KEYLINES.map((k) => `${k.name} ${k.w}x${k.h}`).join(", ")})`);
  if (!files.includes(`${name}-mid.svg`)) failures.push(`${name}: no -mid variant — it would be broken on surface 1`);
  const offGrid = vertices.filter(([x, y]) => Math.abs((x * 2) % 1) > 1e-9 || Math.abs((y * 2) % 1) > 1e-9);
  if (offGrid.length) failures.push(`${name}: ${offGrid.length} line vertices off the half-unit grid, e.g. ${offGrid[0].map((v) => +v.toFixed(2)).join(",")}`);
  rows.push({ name, w, h, clearance, ink, key: key?.name ?? "—" });
}

// Ink mass. A uniform stroke makes total path LENGTH the ink area, so optical volume
// is measurable here even though it usually is not. Outside +/-20 % of the median an
// icon stops belonging to the family.
const inks = rows.map((r) => r.ink).sort((a, b) => a - b);
const median = inks.length % 2 ? inks[(inks.length - 1) / 2] : (inks[inks.length / 2 - 1] + inks[inks.length / 2]) / 2;
for (const r of rows) {
  r.dev = +((r.ink / median - 1) * 100).toFixed(1);
  if (Math.abs(r.dev) > INK_BAND * 100) failures.push(`${r.name}: ink ${r.ink}u is ${r.dev}% off the median ${median}u (band +/-${INK_BAND * 100}%)`);
}
if (names.length > SET_STOP) {
  failures.push(`${names.length} icons — past the stop condition of ${SET_STOP}. The set needs a keyline review, not another admission.`);
}

console.log("Icon        Silhouette   Keyline     Clearance      Ink   vs median");
console.log("-".repeat(70));
for (const r of rows) {
  console.log(r.name.padEnd(12) + `${r.w}x${r.h}`.padEnd(13) + r.key.padEnd(12) +
    String(r.clearance).padStart(9) + String(r.ink).padStart(9) + (r.dev > 0 ? "+" : "") + String(r.dev).padStart(8) + "%");
}
console.log("-".repeat(70));
console.log(`${names.length} icons of a maximum ${SET_STOP}   median ink ${median}u   band +/-${INK_BAND * 100}%`);

if (failures.length) {
  console.error("\nFAILED:\n  " + failures.join("\n  "));
  process.exit(1);
}
console.log("\nEvery icon sits on a keyline, inside the live area, and within the ink band.");
