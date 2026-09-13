// The system's paper — a definition, not a picture.
//
// Two frequency bands: fine grain plus low-frequency sheet formation. The
// amplitude is symmetric around the ground tone (feComposite k2=1 k3=1 k4=-0.5),
// so the surface is luminance-neutral instead of greying it. Alpha
// is forced hard to 1 via feColorMatrix — feTurbulence otherwise noises
// the alpha channel too, and the arithmetic works with premultiplied alpha.
//
// Every sheet gets its fibre lay from its own name. Same stock,
// a different lay — the way two sheets from one ream differ. The seed is deterministic,
// so a project looks the same for good.

// MEASURED, not assumed: the seed leaves the luminance alone, but not the
// isotropy. Across six real project names the R6 deviation was at most
// 0.055 % (limit 1 %) — the anisotropy, however, ranged from 1.01x
// to 1.15x and thereby hit the R3 limit. fractalNoise is isotropic on average,
// but a single finite crop has a random directional bias.
//
// Hence NUDGE: if a sheet fails the build-time check, its
// name gets an offset here, and the seed moves one place forward. The mapping
// stays deterministic and readable, instead of leaving isotropy to chance.
// Entries belong here only when tokens/paper-check.html has required them.
export const SEED_NUDGE = {
  // MEASURED at 220x130, the tile size of the check:
  //   offset 0 -> seed 4962, anisotropy 1.1542x  above the limit 1.1500x
  //   offset 1 -> seed 4963, anisotropy 1.0487x  R6 deviation +0.0167 %
  // The smallest possible offset is enough; larger ones were checked and are
  // not needed. The sheet thus stays deterministic and readable.
  "bashplot": 1,
};

/** Stable 32-bit hash (FNV-1a). Same name, same sheet — for good. */
export function sheetSeed(name) {
  let h = 0x811c9dc5;
  for (let i = 0; i < name.length; i++) {
    h ^= name.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  // feTurbulence accepts large seeds, but small values are more readable
  // and cover the range of variation completely.
  return (h % 9973) + (SEED_NUDGE[name] || 0);
}

const GREY_ALPHA1 =
  'type="matrix" values="0.3333 0.3333 0.3333 0 0  0.3333 0.3333 0.3333 0 0  0.3333 0.3333 0.3333 0 0  0 0 0 0 1"';

/**
 * Filter definition for a sheet.
 * @param {string} sheetName  Name of the sheet — determines the fibre lay.
 * @param {object} [opt]
 * @param {number} [opt.strength=0.15]  Amplitude around the ground tone. Changes
 *   visibility, not neutrality — that is by construction.
 * @param {number} [opt.grainRatio=0.55] Proportion of grain versus sheet formation.
 * @param {string} [opt.id]  Filter id; derived from the name by default.
 */
export function paperFilter(sheetName, opt = {}) {
  const { strength = 0.15, grainRatio = 0.55 } = opt;
  const seed = sheetSeed(sheetName);
  const id = opt.id || `paper-${seed}`;
  const ic = (0.5 - strength * 0.5).toFixed(4);
  const g = grainRatio.toFixed(2);
  const f = (1 - grainRatio).toFixed(2);

  return `<filter id="${id}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" seed="${seed}" result="n1"/>
  <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="${seed + 1}" result="n2"/>
  <feColorMatrix in="n1" ${GREY_ALPHA1} result="g1"/>
  <feColorMatrix in="n2" ${GREY_ALPHA1} result="g2"/>
  <feComposite in="g1" in2="g2" operator="arithmetic" k1="0" k2="${g}" k3="${f}" k4="0" result="mix"/>
  <feComponentTransfer in="mix" result="off">
    <feFuncR type="linear" slope="${strength}" intercept="${ic}"/>
    <feFuncG type="linear" slope="${strength}" intercept="${ic}"/>
    <feFuncB type="linear" slope="${strength}" intercept="${ic}"/>
  </feComponentTransfer>
  <feComposite in="off" in2="SourceGraphic" operator="arithmetic" k1="0" k2="1" k3="1" k4="-0.5"/>
</filter>`;
}

/** A complete sheet as a standalone SVG. */
export function paperSheet(sheetName, { width = 300, height = 180, ground = "#fafafa", ...opt } = {}) {
  const seed = sheetSeed(sheetName);
  const id = `paper-${seed}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`
    + `<defs>${paperFilter(sheetName, { ...opt, id })}</defs>`
    + `<rect width="${width}" height="${height}" fill="${ground}" filter="url(#${id})"/></svg>`;
}
