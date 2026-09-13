// Mark — candidates, derived from the system's rules.
//
// Hard requirements from the handbook:
//   - monochrome, ONE stroke weight (here: pure area, no stroke at all)
//   - equally clear at 16px (favicon) and 62px (display)
//   - both bands without a second drawing
//
// The third requirement is not hoped for, it is forced: every candidate is
// SELF-INVERSE. Rotate the figure 180 degrees and you get exactly its complement —
// ink becomes paper and paper becomes ink, and the mark stays the same.
// That is what makes the two-bands property built rather than checked.
//
// The candidates are defined as point lists, not as path strings, so that the
// drawing and the check share the same source and cannot drift apart.

export const VB = 64;   // drawing area
const M = 6;            // margin, so nothing touches the edge at 16px
const S = VB - 2 * M;   // usable edge length
const A = M, B = M + S; // edges
const C = M + S / 2;    // centre

// A figure that falls onto ITSELF under a 180-degree rotation cannot also fall
// onto its COMPLEMENT — the two properties are mutually exclusive. The first
// draft had built point symmetry and meant self-inversion; the measurement caught
// it (rotational deviation 0.000 %, self-inversion 100 %).
//
// The correct construction is an ANTISYMMETRIC division: a dividing line from
// corner to corner that, AS A LINE, is point-symmetric about the centre. Then the
// two halves are congruent and swap under rotation.

/** Mirrors a point about the centre. */
const mirror = ([x, y]) => [2 * C - x, 2 * C - y];

/**
 * Builds the figure from the HALF dividing line: given are the points from (A,A)
 * to the centre; the second half is produced by mirroring. That makes the line
 * point-symmetric by construction, not by hope. It is closed via the corner
 * (B,A) — the figure is one of the two congruent halves.
 */
function fromHalf(half) {
  const second = half.slice(0, -1).reverse().map(mirror);
  return [[A, A], ...half, ...second, [B, B], [B, A]];
}

/**
 * Stairs: the staggering the system stands on.
 * The half line runs from (A,A) EXACTLY to the centre — n steps over S/2.
 * An earlier draft computed S/(2n) per step and thereby overshot the centre;
 * the path crossed itself and was only masked by the evenodd fill rule.
 */
const stairs = (n) => {
  const d = S / 2 / n;
  const pts = [];
  for (let i = 0; i < n; i++) {
    pts.push([A + i * d, A + (i + 1) * d]);       // up
    pts.push([A + (i + 1) * d, A + (i + 1) * d]); // right
  }
  return fromHalf(pts); // last point is (C,C)
};

/** Bend: a single change of direction before the centre. */
const bend = (k) => fromHalf([[A + S * k, A + S * (0.5 - k)], [C, C]]);

/** Wave: two bends, a longer movement. */
const wave = () => fromHalf([[A + S * 0.30, A + S * 0.08], [A + S * 0.20, A + S * 0.34], [C, C]]);

/**
 * DECIDED on 2026-09-11: the bend.
 *
 * The three candidates stay. They are not leftovers — they are the record the choice
 * was made against, and a mark whose alternatives are gone cannot be re-argued.
 *
 * Why the bend and not the stairs. The stairs told the better story: four contrast
 * steps, three jumps, the staggering the whole system rests on. But the measurement
 * decides it at 16px, not at 58, and three steps is exactly one step too many at
 * favicon size. The council's precedence is fixed — Usability before Metaphor — and
 * this is the case where the two part company.
 *
 * All three measure ink coverage 50.00 % and self-inversion 0.000 %, so the choice
 * cost nothing on the two-band property. It was decided on legibility alone.
 */
export const CHOSEN = "bend";

/** The mark, at whatever size. Use this rather than reaching into CANDIDATES. */
export const markPath = () => pathOf(CHOSEN);

export const CANDIDATES = {
  stairs: { label: "Stairs — three steps", polys: [stairs(3)],
            note: "The staggering the system stands on: four contrast steps, three jumps." },
  bend:  { label: "Bend — one change of direction", polys: [bend(0.34)],
            note: "A single division with one bend. Calmest at a small degree." },
  wave:  { label: "Wave — two bends", polys: [wave()],
            note: "Longer movement through the area; reads as interlocking at a large degree." },
};

const toPath = (poly) => "M " + poly.map(([x, y]) => `${+x.toFixed(3)} ${+y.toFixed(3)}`).join(" L ") + " Z";
const pathOf = (key) => CANDIDATES[key].polys.map(toPath).join(" ");

export function markSVG(key, { ink = "#232323", paper = "none", size = 64 } = {}) {
  const bg = paper === "none" ? "" : `<rect width="${VB}" height="${VB}" fill="${paper}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VB} ${VB}" width="${size}" height="${size}" role="img" aria-label="Mark">`
       + bg + `<path d="${pathOf(key)}" fill="${ink}" fill-rule="evenodd"/></svg>`;
}

export function markInverted(key, { ink = "#fafafa", paper = "#232323", size = 64 } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VB} ${VB}" width="${size}" height="${size}" role="img" aria-label="Mark, inverted">`
       + `<rect width="${VB}" height="${VB}" fill="${paper}"/>`
       + `<path d="${pathOf(key)}" fill="${ink}" fill-rule="evenodd"/></svg>`;
}

// ---------- Check, exact rather than photographed ----------

/** Point-in-polygon, odd crossing count (matches the evenodd fill rule). */
function inside(polys, x, y) {
  let n = 0;
  for (const poly of polys) {
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) n++;
    }
  }
  return n % 2 === 1;
}

/**
 * Measures three things on a grid:
 *   coverage       ink share of the drawing area (should sit near 50 %)
 *   selfInverse    deviation between the figure and its 180-degree-rotated complement
 *   rotational     deviation between the figure and its own 180-degree rotation
 */
export function measure(key, N = 512) {
  const { polys } = CANDIDATES[key];
  let on = 0, invDiff = 0, rotDiff = 0, cells = 0;
  for (let iy = 0; iy < N; iy++) {
    const y = M + ((iy + 0.5) / N) * S;
    for (let ix = 0; ix < N; ix++) {
      const x = M + ((ix + 0.5) / N) * S;
      const a = inside(polys, x, y);
      // rotated partner
      const rx = 2 * C - x, ry = 2 * C - y;
      const r = inside(polys, rx, ry);
      if (a) on++;
      if (a !== !r) invDiff++;   // self-inverse: a should be the complement of the rotated one
      if (a !== r) rotDiff++;    // rotationally symmetric: a should equal the rotated one
      cells++;
    }
  }
  return { coverage: on / cells, selfInverse: invDiff / cells, rotational: rotDiff / cells };
}
