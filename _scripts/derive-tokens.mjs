// Derives the system's colour roles — both bands, calculated rather than chosen.
//
// Principle: no role is set by eye. For every text role, the lightness is
// solved by bisection against a contrast target, at fixed hue and chroma.
// The calculation runs against the MOST DEMANDING of the three grounds, so the
// values hold on all three surfaces and not only on the most convenient one.
//
// The targets are deliberately STAGGERED (7:1 secondary, 4.5:1 tertiary). The same
// target for both would produce two names for one colour — the same structural error
// as two font sizes 1.08 apart.
//
// Call:    node _scripts/derive-tokens.mjs [target-directory]
// Without a target directory, only a report is printed, nothing is written.

import { converter, formatHex, parse } from "culori";
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";

const ok = converter("oklch");
const toRgb = converter("rgb");

// ---------- WCAG ----------
const lin = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const relLum = (hex) => {
  const c = toRgb(parse(hex));
  return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
};
const contrast = (a, b) => {
  const [x, y] = [relLum(a), relLum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

// ---------- APCA ----------
// SAPC-APCA 0.1.9, the W3 draft constants. NOT a replacement for WCAG 2 — a second
// constraint alongside it, for one reason: WCAG 2 is symmetric by construction and
// cannot tell light-on-dark from dark-on-light. The difference is not academic. It was
// measured on this system's own roles: dark tertiary at WCAG 4.54 scored Lc 41.5,
// while its light-band twin at WCAG 4.52 scored Lc 63.8. The same number, 22 points of
// perceptual difference, and the dark band was the weaker one every time.
//
// WCAG stays because it is the standard an audit will cite. APCA is added because it
// is the one that notices. Every text role must now clear BOTH, on the hardest ground.
const apcaY = (h) => {
  const c = toRgb(parse(h));
  return 0.2126729 * c.r ** 2.4 + 0.7151522 * c.g ** 2.4 + 0.0721750 * c.b ** 2.4;
};
const softClamp = (y) => (y > 0.022 ? y : y + (0.022 - y) ** 1.414);
function apca(txtHex, bgHex) {
  const Yt = softClamp(apcaY(txtHex)), Yb = softClamp(apcaY(bgHex));
  if (Math.abs(Yb - Yt) < 0.0005) return 0;
  let s;
  if (Yb > Yt) { s = (Yb ** 0.56 - Yt ** 0.57) * 1.14; s = s < 0.1 ? 0 : s - 0.027; }
  else { s = (Yb ** 0.65 - Yt ** 0.62) * 1.14; s = s > -0.1 ? 0 : s + 0.027; }
  return s * 100;
}
/** Signed Lc keeps the polarity; the floors are checked against its magnitude. */
const lcAbs = (a, b) => Math.abs(apca(a, b));

// ---------- sRGB gamut ----------
const inGamut = (o) => {
  const c = toRgb(o);
  return [c.r, c.g, c.b].every((v) => v >= -1e-4 && v <= 1 + 1e-4);
};
function fitChroma(l, c, h) {
  if (inGamut({ mode: "oklch", l, c, h })) return c;
  let lo = 0, hi = c;
  for (let i = 0; i < 40; i++) {
    const m = (lo + hi) / 2;
    inGamut({ mode: "oklch", l, c: m, h }) ? (lo = m) : (hi = m);
  }
  return lo;
}
// A grey has no hue; culori reports it as undefined and averaging two of them yields NaN.
const hex = (l, c, h) => { h = Number.isFinite(h) ? h : 0; return formatHex({ mode: "oklch", l, c: fitChroma(l, c, h), h }); };

/**
 * Solves for the lightness that satisfies BOTH standards against `bg`: at least
 * `target` WCAG contrast and at least `apcaFloor` APCA Lc. Whichever binds, binds —
 * and which one binds is not the same in the two bands, which is the whole point.
 * Both predicates are monotone in lightness, so the bisection is still valid.
 * dir = -1: go darker (light band), +1: go lighter (dark band).
 */
function solveL(seedHex, bg, target, dir, apcaFloor = 0) {
  const o = ok(parse(seedHex));
  let lo = 0.02, hi = 0.98;
  for (let i = 0; i < 60; i++) {
    const m = (lo + hi) / 2;
    const h = hex(m, o.c, o.h);
    const good = contrast(h, bg) >= target && lcAbs(h, bg) >= apcaFloor;
    if (dir > 0) good ? (hi = m) : (lo = m);
    else good ? (lo = m) : (hi = m);
  }
  return hex(dir > 0 ? hi : lo, o.c, o.h);
}

// ---------- Identity (shared with Statement Papers) ----------
const IDENTITY_WARM = {
  paper: "#fbfaf7",
  paperAlt: "#f3f1ec",
  paperDim: "#eae7df",
  ink: "#232320",
  seed: "#6e6e68",   // starting tone for the derived text roles
  hairline: "#ddd9d0",
  hairlineStrong: "#c9c5ba",
};

// PURE GREYS, 2026-09-13. The set above is the warm identity Statement Papers keeps;
// this system drops the tint entirely — no colour at all, paper and ink included. Each
// value keeps its OKLCH lightness at chroma 0, so every contrast below moves by rounding
// only, and every role re-solves on neutral greys.
const CHROMA_MAX = 0.004;
const neutral = (h) => formatHex({ mode: "oklch", l: ok(parse(h)).l, c: 0, h: 0 });
const IDENTITY = Object.fromEntries(Object.entries(IDENTITY_WARM).map(([k, v]) => [k, neutral(v)]));

// ---------- The interleaved grounds ----------
//
// Two more grounds per band, added 2026-09-12 because the portfolio surface needed
// sheet-to-sheet separation and this system has no hue to separate with. They are
// DERIVED, not picked: each is the OKLCH midpoint of the pair it sits between.
//
// INTERLEAVED, NOT APPENDED, and that is the whole design of them. A ground darker
// than --paper-dim would become the new most demanding ground, and since every text
// role is solved against the most demanding ground, all three would silently
// re-solve — a request for "one more sheet colour" would have moved every piece of
// type on both surfaces. Sitting between existing grounds, they cannot: every
// contrast in this file is bounded by paper and dim, which do not move. The roles
// are nonetheless re-measured against all five below, because "cannot" is a claim
// and the measurement is the check.
const midGround = (a, b) => {
  const x = ok(parse(a)), y = ok(parse(b));
  return hex((x.l + y.l) / 2, (x.c + y.c) / 2, (x.h + y.h) / 2);
};
const PAPER_VEIL = midGround(IDENTITY.paper, IDENTITY.paperAlt);
const PAPER_SHADE = midGround(IDENTITY.paperAlt, IDENTITY.paperDim);

// Targets per role. Staggered so that every step is a real step.
//
// `faint` was added 2026-09-12 and it is the only rung the measurement allowed — see
// the headroom report below, which refuses the other two candidates. Its target is
// not interpolated: the geometric midpoint of tertiary and decor is 3.015 against
// dim, and the WCAG 1.4.11 non-text floor is 3.00. The rung the ladder wanted is a
// rung the standard already names, so it takes the standard's number rather than the
// arithmetic. It is therefore a NON-TEXT and large-text role and never becomes a
// body-text value; components.css uses --ink-tertiary wherever a caption is meant.
const TARGETS = { secondary: 7.0, tertiary: 4.5, faint: 3.0 };

// APCA floors, from the draft's own use-case table: Lc 75 is the level for body-size
// text, Lc 60 for secondary and larger text. ONE pair of floors for BOTH bands — the
// point is not to give the dark band its own softer standard but to hold both to the
// same perceptual level, which WCAG alone does not do.
//
// MEASURED CONSEQUENCE, and the reason this is two constraints and not one:
//   light band — WCAG binds. Solving on WCAG alone already lands at Lc 75.8 and 63.8,
//                over both floors, so these values do not move at all.
//   dark band  — APCA binds. WCAG alone landed at Lc 62.3 and 41.5, under both floors;
//                the floors lift the roles to #d4d5ce and #babbb4.
// Neither standard alone would have produced this palette: APCA alone drops the light
// band to WCAG 6.86 and 3.99, under AA.
// `faint` takes Lc 45, the draft's large-text minimum, and it is the one role where
// the two standards split cleanly by band: WCAG binds the light band (#85857f, Lc
// 50.6, over its floor) and APCA binds the dark one (#9fa099, WCAG 4.95, over its
// floor). Solving on either standard alone would have produced a role that failed the
// other in one band — which is the argument for two constraints, made a third time.
const APCA_FLOORS = { secondary: 75, tertiary: 60, faint: 45 };

// `--decor` is a SET VALUE, not a derivation: decoration by definition has
// no contrast target. The value is held, not calculated.
const DECOR_LIGHT = neutral("#a6a49c");
const DECOR_DARK_L = 0.55;

// ---------- Font chain: SET VALUES, measured in a browser ----------
//
// Same standing as DECOR_LIGHT above, and for the same reason: these numbers are HELD,
// not calculated. No script here can derive them — that would need a font-parsing
// library, and none is installed. They come from rendering text in a browser and
// measuring the result.
//
// Measured 2026-09-11, Inter and JetBrains Mono at 18px, probe string
// "Handgloves 0123456789 illIL":
//
//   Inter                 advance 245.43   x-height 9.83     the reference
//   Helvetica Neue        advance 232.42   x-height 9.31     -5.30 %
//   Arial                 advance 232.18   x-height 9.33     -5.40 %
//   JetBrains Mono        advance 291.60   x-height 9.90     the mono reference
//   Menlo-Regular         advance 292.60   x-height 9.84     +0.34 %
//   Monaco                advance 291.65   x-height 9.84     +0.02 %
//
// One size-adjust value corrects BOTH advance and x-height, which is not a given —
// it holds only because for these faces the two ratios nearly coincide. Verified:
// Helvetica Neue at 105.6 % lands at -0.04 % advance and -0.10 % x-height; Arial at
// 105.4 % lands at -0.30 % and +0.10 %. From -5.3 % to under half a percent.
//
// local() has NO rule, only cases. local("Menlo") does not resolve while
// local("Menlo-Regular") does; local("Arial") resolves while local("Arial-Regular")
// does not. Each face therefore names both spellings and the first that resolves wins.
//
// ui-monospace is NOT in the stack. It did not resolve in the test browser at all and
// fell through silently to the generic default, 25.6 % narrower — a keyword whose
// failure is invisible is worse than a named face that is merely absent.
//
// THE TELLTALE of a fallback that silently failed to resolve is advance 216.98 at 18px,
// the generic default. If a re-measurement reports that number, the local() name is
// wrong, not the font.
//
// A FONT UPDATE INVALIDATES EVERY VALUE HERE. tokens/fonts.json carries the sha256 of
// each file and .github/workflows/font-updates.yml watches both the checksums and the
// upstream releases — but it deliberately does not re-measure. Helvetica Neue, Arial and
// Menlo are operating-system faces and are not installed on Linux CI runners, so a
// headless measurement there would produce confident, wrong numbers. It opens an issue
// for a human instead.
const FONT_CHAIN = {
  sans: {
    self: { family: "Inter", file: "assets/fonts/inter-latin-var.woff2", weights: "400 700" },
    // THE ITALIC, declared 2026-09-12 as its own family rather than as a second
    // font-style on "Inter". That is what makes the degradation predictable: with
    // font-synthesis: none, a missing "Inter Italic" falls through to "Inter", which
    // has no italic, so emphasis renders roman at weight 500 — exactly the device
    // this system used before the cut existed. Declared as a style on "Inter" it
    // would instead fall through to the metric fallbacks, which DO carry real
    // italics, and every <em> would change family mid-sentence.
    italic: { family: "Inter Italic", file: "assets/fonts/inter-latin-italic-var.woff2", weights: "400 700" },
    fallbacks: [
      { name: "Inter Fallback HN", local: ["Helvetica Neue", "HelveticaNeue"], sizeAdjust: "105.6%" },
      { name: "Inter Fallback A",  local: ["Arial", "ArialMT"],                sizeAdjust: "105.4%" },
    ],
    generic: "sans-serif",
  },
  mono: {
    self: { family: "JetBrains Mono", file: "assets/fonts/jetbrains-mono-latin-var.woff2", weights: "400 500" },
    fallbacks: [
      { name: "Mono Fallback M", local: ["Menlo-Regular", "Menlo"], sizeAdjust: "99.9%" },
      { name: "Mono Fallback O", local: ["Monaco"],                 sizeAdjust: "100.1%" },
    ],
    generic: "monospace",
  },
};

// Mono is its own scale, not a rung of the sans ladder. Measured: the x-heights differ
// by 0.7 % (9.83 against 9.90), so mono at the SAME nominal size is already optically
// matched and there is nothing to solve. Seven of sixteen specimen cards had settled on
// caption size by habit; this turns that habit into a rule.
//
// The 1.125 neighbour check does NOT apply between MONO and SCALE. They are two scales,
// not two neighbours in one ladder, and checking across them would report a step that
// does not exist.
const MONO = [
  { name: "code", of: "caption", weight: 400, leading: 1.5 },
];

// ---------- Editorial slots ----------
// The reference vocabulary names slots a system needs and this one had no word for:
// eyebrow, headline, deck, lede, pull quote, caption, label. Most map onto grades
// already here. One did not, and its absence was being papered over with italics: the
// audience line under each README heading — a DECK, the summary between a heading and
// the body.
//
// A slot is NOT a step. It carries no new size, it names an existing one for a
// purpose, exactly as MONO does, and it is therefore outside the 1.125 neighbour
// check by construction — deck and subhead are the same size on purpose. Only slots
// with a real consumer are declared: a pull-quote token with nothing to quote would
// be the dead token this system polices.
const SLOTS = [
  { name: "deck", size: "subhead", weight: "body", tracking: "subhead", leading: 1.45,
    note: "the summary line between a heading and the body" },
];

// Mono runs 18.8 % wider at the same size (advance 291.60 against 245.43). The same
// 34em therefore carries fewer characters, and CHARACTERS are what the rule is about:
// an em is not a character, and a comment here once said 34em "carries about 34".
// Measured per character at 18px: Inter 9.09px, JetBrains Mono 10.80px.
const MEASURE_SANS_EM = 34;
const MONO_ADVANCE_RATIO = 245.43 / 291.60;
const MEASURE_CODE_EM = +(MEASURE_SANS_EM * MONO_ADVANCE_RATIO).toFixed(1);
const CHAR_SANS_PX = 245.43 / 27;
const CHAR_MONO_PX = 291.60 / 27;
const MEASURE_CHARS = Math.round((MEASURE_SANS_EM * 18) / CHAR_SANS_PX);
const MEASURE_CODE_CHARS = Math.round((MEASURE_CODE_EM * 18) / CHAR_MONO_PX);

// ---------- Motion: held values with a source and a boundary ----------
//
// SET VALUES, the same standing as DECOR_LIGHT and FONT_CHAIN above. Nothing here is
// solved: a duration has no contrast target to bisect against. What it has is a
// source and a boundary, and both are written down.
//
// SOURCE of the 120 ms. It is the only motion number this repository has ever held.
// The handbook records two dead tokens in .cupertino/CUPERTINO_REVIEW_FLOW.html —
// --transition-fast: 120ms and --transition-base: 200ms — consumed there by no rule.
// The first is adopted unchanged and now has a consumer. The second is NOT adopted as
// a duration, because 200 ms is the rule's own boundary and a value must not sit on
// the line it is measured against.
//
// BOUNDARY. The rule says colour and opacity transitions under 200 ms need no
// prefers-reduced-motion guard. A guard-free duration that reached the boundary would
// make the rule false, so the boundary is checked at generation time, below.
//
// EASING is not invented. cubic-bezier(0, 0, 0.58, 1) is the CSS Easing Functions
// Level 1 definition of the `ease-out` keyword. Four hand-tuned control points would
// be four numbers with no source.
//
// DELIBERATELY ABSENT: a duration for the guarded class (transform, position). No
// surface in this system moves — the portfolio page's one gesture was removed together
// with the decision it served. Shipping --motion-gesture now would add a third dead
// motion token to a repository whose handbook already names the first two as a defect.
// It arrives with the first surface that moves, not before.
//
// REDUCED MOTION IS SUBSTITUTION, NOT DELETION. The guard removes the transform; it
// must not remove the feedback, or the reader is left unsure whether the input
// registered. What is left is the guard-free class at --motion-fast: the colour or
// opacity change that says the same thing without moving anything.
const MOTION = {
  fast: 120,                            // ms — colour and opacity, guard-free
  guardFreeMax: 200,                    // ms — the rule's boundary, not a duration
  ease: "cubic-bezier(0, 0, 0.58, 1)",  // CSS Easing Level 1, the `ease-out` keyword
  // THE EXIT CURVE, and why it is null rather than absent. The asymmetry principle
  // says an element that arrives decelerates and an element that leaves accelerates:
  // one curve cannot express it, and a system in which nothing arrives or leaves
  // cannot honour it. Shipping `ease-in` now would be the dead token this file exists
  // to prevent. So the pair is declared here as null and ENFORCED below: the moment
  // any stylesheet transitions a transform, the build fails until both are filled in.
  // The rule stops being a sentence and becomes a gate.
  // FILLED IN 2026-09-12, through the gate rather than around it. templates/
  // portfolio-index/ reveals a sheet as it enters, draws a hairline across, and lets
  // the wordmark answer the scroll, so this system now has a surface that moves and
  // the pair stopped being a dead token the moment it acquired a consumer.
  //
  // 360 is a SET VALUE ON A MEASURED BASE, the same standing as the imagery layer's
  // chroma: 3 x MOTION.fast exactly. An arbitrary number beside a 120 ms token reads
  // as two motion systems on one page; a whole multiple reads as one system at two
  // speeds. Three is the smallest multiple that reads as a travel rather than a
  // switch — at 2x a 16px reveal lands before the eye has followed it, which makes
  // the movement pointless rather than gentle.
  gesture: 360,                         // ms — the guarded class
  easeIn: "cubic-bezier(0.42, 0, 1, 1)", // CSS Easing Level 1, the `ease-in` keyword
};
if (MOTION.gesture % MOTION.fast !== 0) {
  // The multiple is the whole justification for the number, so it is checked rather
  // than merely asserted in the comment above it.
  throw new Error(`MOTION.gesture ${MOTION.gesture}ms is not a whole multiple of MOTION.fast ${MOTION.fast}ms`);
}

const inkO = ok(parse(IDENTITY.ink));
const li = (h) => ok(parse(h)).l;

// Dark band: mirror the light band's lightness steps.
const mirrorror = (l) => 1.24 - l;
const DARK = {
  paper: IDENTITY.ink,
  paperVeil: hex(mirrorror(li(PAPER_VEIL)), inkO.c, inkO.h),
  paperAlt: hex(mirrorror(li(IDENTITY.paperAlt)), inkO.c, inkO.h),
  paperShade: hex(mirrorror(li(PAPER_SHADE)), inkO.c, inkO.h),
  paperDim: hex(mirrorror(li(IDENTITY.paperDim)), inkO.c, inkO.h),
  ink: IDENTITY.paper,
  hairline: hex(0.34, 0, 0),
  hairlineStrong: hex(0.42, 0, 0),
};

// The role ladder, top to bottom. One list, consumed by the solver, the report, the
// ladder check and the emitters — so a rung cannot be added to one and forgotten in
// another, which is how a palette ends up with a token nothing checks.
const ROLES = ["ink", "secondary", "tertiary", "faint", "decor"];
const GROUNDS = ["paper", "veil", "alt", "shade", "dim"];

function band(name, grounds, dir, decor) {
  // The most demanding ground is the one that delivers the least contrast, and after
  // the 2026-09-12 interleave that is still dim: veil and shade sit between paper and
  // dim by construction, so neither can take the title.
  const hardest = grounds.dim;
  const t = { ink: dir < 0 ? IDENTITY.ink : IDENTITY.paper };
  for (const role of ["secondary", "tertiary", "faint"]) {
    t[role] = solveL(IDENTITY.seed, hardest, TARGETS[role], dir, APCA_FLOORS[role]);
  }
  t.decor = decor;
  const measured = {};
  for (const [role, h] of Object.entries(t)) {
    const m = { hex: h };
    for (const g of GROUNDS) {
      const key = g === "paper" ? "Paper" : g[0].toUpperCase() + g.slice(1);
      m["vs" + key] = +contrast(h, grounds[g]).toFixed(2);
      // Signed, because the sign IS the polarity: negative is light ink on dark paper.
      m["lc" + key] = +apca(h, grounds[g]).toFixed(1);
    }
    // The worst case across ALL grounds, named rather than recomputed by every
    // consumer. Five grounds is where doing that by hand starts going wrong.
    m.worstWcag = +Math.min(...GROUNDS.map((g) => contrast(h, grounds[g]))).toFixed(2);
    m.worstLc = +Math.min(...GROUNDS.map((g) => lcAbs(h, grounds[g]))).toFixed(1);
    measured[role] = m;
  }
  return { name, grounds, roles: t, measured };
}

// ---------- Ladder headroom ----------
//
// Reports, for every adjacent pair, whether a new rung could sit between them: it
// needs LADDER_STEP of clearance on BOTH sides, so it needs LADDER_STEP squared of
// gap, and the best it can do is the geometric midpoint.
//
// This exists because the 2026-09-12 amendment asked for three new rungs and the
// measurement allowed one. Without the report the refusal would have been an opinion.
function headroom(b, step) {
  const rows = [];
  for (let i = 0; i < ROLES.length - 1; i++) {
    const a = b.measured[ROLES[i]].vsPaper, c = b.measured[ROLES[i + 1]].vsPaper;
    const gap = a / c, per = Math.sqrt(gap);
    rows.push({ pair: ROLES[i] + " -> " + ROLES[i + 1], gap: +gap.toFixed(3), per: +per.toFixed(3), fits: per >= step });
  }
  return rows;
}

// ---------- Icon midtone: solved, not chosen ----------
//
// Surface 1 gets ONE icon file, not a light/dark pair. GitHub serves both <picture>
// sources verbatim and the browser picks against the OS setting rather than GitHub's
// theme, so a light asset lands on a dark page and <picture> cannot fix it. One tone
// therefore has to hold on every ground this system has.
//
// SOLVED the same way the text roles are, with a different objective: not "reach a
// target" but "maximise the worst case". Lightness is searched at the tint held from
// IDENTITY.seed (g = r, b = r - 6, the seed's own channel offsets), and the value that
// maximises the MINIMUM contrast across all six grounds wins. Solved 2026-09-11:
// #7f7f79, worst case 3.24 against --paper-dim in the dark band.
//
// It is NOT a CSS token and deliberately does not become one. It exists only inside
// assets/icons/*-mid.svg, the files surface 1 loads as <img>, where no custom property
// reaches. On surface 2 the icons carry currentColor and take the ink role of their
// context, which is always better than 3.24.
const ICON_MID = neutral("#7f7f79");
const ICON_MIN = 3.0;   // WCAG 1.4.11, non-text

const LIGHT_GROUNDS = { paper: IDENTITY.paper, veil: PAPER_VEIL, alt: IDENTITY.paperAlt, shade: PAPER_SHADE, dim: IDENTITY.paperDim };
const DARK_GROUNDS = { paper: DARK.paper, veil: DARK.paperVeil, alt: DARK.paperAlt, shade: DARK.paperShade, dim: DARK.paperDim };

// ---------- Elevation: a bound, not a style ----------
//
// Shadows were forbidden until 2026-09-12, on three stated grounds: monochrome,
// luminance neutrality, and the fact that surface 1 has no box-shadow at all. The
// third still holds and is why this is surface-2 only. The first two are answered by
// giving the shadow a CEILING derived from the ground ladder rather than a taste:
//
//   the darkest point of a shadow may not darken its ground past the darkest
//   ground this system owns.
//
// Solved, not chosen: compositing --ink over --paper at alpha a lands at lightness
// L_paper - a * (L_paper - L_ink), and setting that equal to L_dim gives the ceiling.
// Light band: 0.0780. The two ramps peak at 0.070 and 0.075 where their layers
// overlap, so both clear it, and the check below fails the build if a ramp does not.
//
// THE DARK BAND GETS NO SHADOW, and that is derived as well. Its grounds run the
// other way — paper IS the darkest of its five — so there is no ground below paper to
// bound a shadow against, and anything darker is a value this system does not have.
// Elevation rides the ground ladder there instead, which is what the interleave is
// for. `none` rather than an absent token, so the intent survives a reader.
const shadowCeiling = (g, ink) => Math.abs((li(g.paper) - li(g.dim)) / (li(g.paper) - li(ink)));
const SHADOW_LIGHT = {
  sheet: { peak: 0.070, css: "0 1px 2px rgb(35 35 35 / 0.03), 0 4px 12px rgb(35 35 35 / 0.04)" },
  raised: { peak: 0.075, css: "0 2px 4px rgb(35 35 35 / 0.03), 0 8px 24px rgb(35 35 35 / 0.045)" },
};

const light = band("light", LIGHT_GROUNDS, -1, DECOR_LIGHT);
const dark = band("dark", DARK_GROUNDS, +1, hex(DECOR_DARK_L, 0, 0));

// ---------- Report ----------
console.log("Band    Role          Hex        vs paper   vs alt   vs dim   Step      Lc paper   Lc alt   Lc dim");
console.log("-".repeat(104));
for (const b of [light, dark]) {
  let prev = null;
  for (const role of ROLES) {
    const m = b.measured[role];
    const step = prev ? (prev / m.vsPaper).toFixed(2) + "x" : "—";
    console.log(
      b.name.padEnd(8) + role.padEnd(14) + m.hex +
      m.vsPaper.toFixed(2).padStart(11) + m.vsAlt.toFixed(2).padStart(9) +
      m.vsDim.toFixed(2).padStart(9) + step.padStart(8) +
      m.lcPaper.toFixed(1).padStart(11) + m.lcAlt.toFixed(1).padStart(9) + m.lcDim.toFixed(1).padStart(9)
    );
    prev = m.vsPaper;
  }
  console.log("  Grounds: " + Object.values(b.grounds).join("  ") +
              "   Hairlines: " + (b.name === "light"
                ? IDENTITY.hairline + " / " + IDENTITY.hairlineStrong
                : DARK.hairline + " / " + DARK.hairlineStrong));
  console.log("-".repeat(104));
}

// ---------- Checks ----------
// Two invariants, not one. The second one was missing at first and was found by an
// independent counter-check: `ink` was measured, but never checked.
// Documenting it as a mere caveat would be too weak — if the shared
// identity.css drifts, nobody else would notice.
const INK_FLOOR = 10.0;      // ink comes from the identity, not from the solver
const LADDER_STEP = 1.20;    // every rung must be distinguishable from the next

const failures = [];
for (const b of [light, dark]) {
  // (1) Targets per role, on the most demanding ground — both standards, not one.
  const perRole = [["ink", INK_FLOOR], ["secondary", TARGETS.secondary], ["tertiary", TARGETS.tertiary], ["faint", TARGETS.faint]];
  for (const [role, target] of perRole) {
    // m.worstWcag, not min of three: the band carries five grounds since the
    // interleave, and a check that still looked at three would pass a role that
    // fails on a ground nobody re-listed here.
    const worst = b.measured[role].worstWcag;
    if (worst < target) failures.push(`${b.name}/${role}: ${worst} < ${target} (target missed)`);
  }
  for (const [role, floor] of Object.entries(APCA_FLOORS)) {
    // m.worstLc, across all five grounds. The old form listed three by name and
    // would have skipped veil and shade in silence after the interleave.
    const worstLc = b.measured[role].worstLc;
    if (worstLc < floor) failures.push(`${b.name}/${role}: Lc ${worstLc.toFixed(1)} < ${floor} (APCA floor missed)`);
  }
  // (2) The ladder must stay a ladder. Equal targets for two roles
  //     produce two names for one colour — exactly the mistake the first
  //     calculation produced (#696863 against #6a6861).
  const rungs = ROLES;
  for (let i = 0; i < rungs.length - 1; i++) {
    const a = b.measured[rungs[i]].vsPaper, c = b.measured[rungs[i + 1]].vsPaper;
    if (a / c < LADDER_STEP) {
      failures.push(`${b.name}: ${rungs[i]}/${rungs[i + 1]} only ${(a / c).toFixed(2)}x apart (< ${LADDER_STEP}x — not a step)`);
    }
  }
}
// (4) POLARITY. The defect APCA was added to catch: two bands agreeing on their WCAG
//     number while diverging perceptually. Before the floors were added the gap was
//     22.3 Lc on tertiary — same ratio, half the legibility. A ladder that means one
//     thing in one band and another in the other is not one system.
const POLARITY_MAX = 8;   // Lc points between the bands' worst grounds
for (const role of Object.keys(APCA_FLOORS)) {
  const worst = (b) => b.measured[role].worstLc;
  const gap = Math.abs(worst(light) - worst(dark));
  console.log(`Polarity     ${role.padEnd(10)} light Lc ${worst(light).toFixed(1)}   dark Lc ${worst(dark).toFixed(1)}   gap ${gap.toFixed(1)}   (max ${POLARITY_MAX})`);
  if (gap > POLARITY_MAX) {
    failures.push(`${role}: bands ${gap.toFixed(1)} Lc apart (> ${POLARITY_MAX}) — same role, two different readings`);
  }
}

// (5) The icon midtone must clear the non-text floor on ALL SIX grounds, not on the
//     two it was eyeballed against. It is one file for both bands; if a ground ever
//     moves, the file becomes wrong silently, and this is what notices.
const iconWorst = Math.min(
  ...[LIGHT_GROUNDS, DARK_GROUNDS].flatMap((g) => Object.values(g).map((bg) => contrast(ICON_MID, bg)))
);
if (iconWorst < ICON_MIN) {
  failures.push(`Icon midtone ${ICON_MID}: worst ground ${iconWorst.toFixed(2)} < ${ICON_MIN} (WCAG 1.4.11, non-text)`);
}
console.log(`\nIcon midtone ${ICON_MID}   worst of six grounds ${iconWorst.toFixed(2)}   (floor ${ICON_MIN})`);

// The icon midtone is the one place where the two standards CANNOT both be satisfied,
// and it is recorded rather than quietly resolved in favour of whichever reads better.
// Maximising the worst-case Lc across the six grounds instead of the worst-case WCAG
// lands at #979797: Lc 41.2, but WCAG 2.35 — under the 3:1 non-text floor. One tone on
// six grounds cannot have both. It stays solved on WCAG, because that is the floor an
// audit enforces, and because the icon is redundant beside its own text label on both
// surfaces: it is never the only carrier of the meaning.
const iconWorstLc = Math.min(
  ...[LIGHT_GROUNDS, DARK_GROUNDS].flatMap((g) => Object.values(g).map((bg) => lcAbs(ICON_MID, bg)))
);
console.log(`             ${ICON_MID}   worst of six grounds Lc ${iconWorstLc.toFixed(1)}   (recorded, not enforced — see the note above)`);

console.log(failures.length
  ? "FAILED:\n  " + failures.join("\n  ")
  : "All text roles hold their target on all three grounds.");

// ---------- Files ----------
const oklchOf = (h) => {
  const o = ok(parse(h));
  return `oklch(${o.l.toFixed(4)} ${o.c.toFixed(4)} ${(o.h ?? 0).toFixed(1)})`;
};
const decl = (name, value, comment, indent) =>
  `${indent}--${name}: ${value};\n${indent}--${name}: ${oklchOf(value)};${comment ? ` /* ${comment} */` : ""}`;

function blockFor(b, hair, indent) {
  const g = b.grounds;
  const lines = [
    decl("paper", g.paper, "page ground", indent),
    decl("paper-veil", g.veil, "first separation — the OKLCH midpoint of paper and alt", indent),
    decl("paper-alt", g.alt, "raised surface", indent),
    decl("paper-shade", g.shade, "third separation — the OKLCH midpoint of alt and dim", indent),
    decl("paper-dim", g.dim, "recessed surface, and the most demanding ground", indent),
    decl("ink", b.roles.ink, "body text, heading", indent),
    decl("ink-secondary", b.roles.secondary, `solved to ${TARGETS.secondary}:1 and Lc ${APCA_FLOORS.secondary}`, indent),
    decl("ink-tertiary", b.roles.tertiary, `solved to ${TARGETS.tertiary}:1 and Lc ${APCA_FLOORS.tertiary}`, indent),
    decl("ink-faint", b.roles.faint, `solved to ${TARGETS.faint}:1 and Lc ${APCA_FLOORS.faint} — NON-TEXT and large text only`, indent),
    decl("decor", b.roles.decor, "SET VALUE, no target — merely redundant decoration", indent),
    decl("hairline", hair[0], "", indent),
    decl("hairline-strong", hair[1], "", indent),
  ];
  // Elevation, emitted per band for the reason --gradient-field is: a custom property
  // resolves where it is declared, so one :root shadow would carry the light band's
  // value into a [data-theme="dark"] subtree that has no shadow at all.
  if (b.name === "light") {
    lines.push(`${indent}--shadow-sheet: ${SHADOW_LIGHT.sheet.css};   /* @kind other */`);
    lines.push(`${indent}--shadow-raised: ${SHADOW_LIGHT.raised.css};   /* @kind other */`);
  } else {
    lines.push(`${indent}--shadow-sheet: none;   /* @kind other — no ground below paper to bound it */`);
    lines.push(`${indent}--shadow-raised: none;   /* @kind other */`);
  }
  return lines.join("\n");
}

const css = `/* Colour roles — GENERATED by _scripts/derive-tokens.mjs, do not edit by hand.
 *
 * Strictly monochrome. Emphasis comes from size, weight and pictograms, never from
 * colour. Colour lives exclusively in the image plane.
 *
 * Every text role is solved by bisection against TWO contrast standards at once, on
 * the most demanding of the three grounds: WCAG 2 (${TARGETS.secondary}:1 secondary, ${TARGETS.tertiary}:1 tertiary) and
 * APCA (Lc ${APCA_FLOORS.secondary} secondary, Lc ${APCA_FLOORS.tertiary} tertiary). Targets staggered — the same target for two
 * roles would produce two names for one colour.
 *
 * WCAG alone is not enough because it is symmetric: it scores light-on-dark and
 * dark-on-light identically, and they do not read identically. This system's own dark
 * tertiary was the proof — WCAG 4.54, the same as its light-band twin, and Lc 41.5
 * against that twin's 63.8. APCA alone is not enough either: it would drop the light
 * band under AA. Which standard binds differs by band, and both are checked.
 *
 * --decor is the sole exception: a set value, not a calculated one, because
 * decoration by definition has no contrast target.
 *
 * Hex first, OKLCH after: hex is the fallback, the modern value wins.
 */
:root {
${blockFor(light, [IDENTITY.hairline, IDENTITY.hairlineStrong], "  ")}
}

@media (prefers-color-scheme: dark) {
  /* Plain :root, not :root:not([data-theme="light"]). The explicit override is
   * carried by the [data-theme="light"] block BELOW instead: it has the same
   * specificity and comes later, so it wins by order. Same behaviour, and the
   * dark band's values stay readable as tokens rather than hiding inside a
   * negation nobody can resolve. */
  :root {
${blockFor(dark, [DARK.hairline, DARK.hairlineStrong], "    ")}
  }
}

[data-theme="dark"] {
${blockFor(dark, [DARK.hairline, DARK.hairlineStrong], "  ")}
}

[data-theme="light"] {
${blockFor(light, [IDENTITY.hairline, IDENTITY.hairlineStrong], "  ")}
}
`;

const json = {
  $comment: "GENERATED by _scripts/derive-tokens.mjs — do not edit by hand.",
  generatedBy: "_scripts/derive-tokens.mjs",
  method: {
    approach: "Lightness solved by bisection against two contrast standards at once (WCAG 2 and APCA), against the most demanding ground",
    targets: TARGETS,
    apcaFloors: APCA_FLOORS,
    whyBoth: "WCAG 2 is symmetric and cannot see polarity: dark tertiary scored 4.54 against its light twin's 4.52 while reading 22.3 Lc weaker. APCA alone would drop the light band under AA. Which standard binds differs by band.",
    polarityMaxLc: POLARITY_MAX,
    decorIsSetting: "--decor is set, not calculated: decoration has no target",
    monochrome: "Colour lives exclusively in the image plane, never in typography or controls",
  },
  bands: {
    light: { grounds: LIGHT_GROUNDS, roles: light.roles, hairline: [IDENTITY.hairline, IDENTITY.hairlineStrong] },
    dark: { grounds: DARK_GROUNDS, roles: dark.roles, hairline: [DARK.hairline, DARK.hairlineStrong] },
  },
  contrast: { light: light.measured, dark: dark.measured },
  allTargetsMet: failures.length === 0,
};

// ---------- Typography ----------
// Inter is fixed; -apple-system is dropped because that stack renders a different
// font with different metrics on Apple hardware, and the scale is trimmed to
// -0.022em tracking.
//
// R2: neighbouring sizes must differ by at least 1.125. Responsive pairs of the
// same size (display / display-sm) are exempt — they are one step in two sizes,
// not two steps.
const TYPE_MIN_RATIO = 1.125;

// ---------- Optical grade ----------
// Light ink on a dark ground reads HEAVIER than the same weight reversed: the glyph
// is identical, the perception is not, and at 400 on this paper the dark band looks
// about half a weight step bolder than the light one. The typographic answer is a
// GRAD axis, which varies stem weight without changing a single advance. Inter has
// no GRAD axis.
//
// What Inter does have is a continuous wght axis, so the compensation is applied
// there instead — as a SET VALUE, the same standing as DECOR_LIGHT, because no
// script can bisect its way to a perceptual match. It is BOUNDED rather than
// eyeballed: a grade must stay under a quarter of a weight step, so that no grade can
// ever carry a role across into the neighbouring named weight and quietly turn a
// 600 into a 500. The bound is checked below.
//
// Applied per BAND, not per element, and emitted as complete weight blocks rather
// than a calc() on a shared token: a custom property resolves where it is declared,
// so a calc() on :root would ignore a [data-theme] set further down the tree — which
// is exactly how every specimen card in this repository is built.
//
// The metric fallbacks are not variable fonts and will round to 400. That is correct:
// the compensation is a refinement of the real face, not a requirement of the layout.
const GRADE = { dark: -15, maxAbs: 25 };
if (Math.abs(GRADE.dark) > GRADE.maxAbs) {
  failures.push(`Grade ${GRADE.dark} exceeds ${GRADE.maxAbs} — a grade that large renames the weight`);
}

const SCALE = [
  { name: "display",  px: 62, weight: 700, tracking: "-0.022em", leading: 1.05 },
  { name: "headline", px: 30, weight: 600, tracking: "-0.012em", leading: 1.2 },
  { name: "subhead",  px: 23, weight: 600, tracking: "-0.008em", leading: 1.3 },
  { name: "body",     px: 18, weight: 400, tracking: "0",        leading: 1.65 },
  { name: "caption",  px: 14, weight: 400, tracking: "0",        leading: 1.5 },
  { name: "eyebrow",  px: 12, weight: 600, tracking: "0.09em",   leading: 1.3 },
];
// Responsive variant, explicitly outside the ladder check.
const RESPONSIVE = [{ name: "display-sm", px: 40, leading: 1.12, of: "display" }];

for (let i = 0; i < SCALE.length - 1; i++) {
  const r = SCALE[i].px / SCALE[i + 1].px;
  if (r < TYPE_MIN_RATIO) {
    failures.push(`Type ${SCALE[i].name}/${SCALE[i + 1].name}: ${r.toFixed(3)} < ${TYPE_MIN_RATIO} (not a step)`);
  }
}

console.log("\nType scale   px   Ratio to next");
console.log("-".repeat(50));
SCALE.forEach((s, i) => {
  const r = i < SCALE.length - 1 ? (s.px / SCALE[i + 1].px).toFixed(3) + "x" : "—";
  console.log("  " + s.name.padEnd(12) + String(s.px).padStart(3) + r.padStart(12));
});
RESPONSIVE.forEach(s => console.log("  " + s.name.padEnd(12) + String(s.px).padStart(3) + "   (variant of " + s.of + ", exempt)"));

// The motion boundary, checked for the same reason the contrast targets are: a rule
// that nobody checks is a sentence, not a rule.
if (MOTION.fast >= MOTION.guardFreeMax) {
  failures.push(`Motion --motion-fast ${MOTION.fast}ms is not under the guard-free boundary of ${MOTION.guardFreeMax}ms`);
}
console.log(`\nMotion       --motion-fast ${MOTION.fast}ms  (guard-free boundary ${MOTION.guardFreeMax}ms)  --motion-ease ${MOTION.ease}`);

// THE GESTURE GATE. Two rules this repository states and, until now, only stated.
// A transition is read out of the stylesheets themselves rather than trusted:
//
//   (a) A LAYOUT PROPERTY must never be animated. width, height, margin and the
//       offsets relayout every frame and drop them on a slow machine — this is a
//       correctness defect, not a taste one.
//   (b) A TRANSFORM needs the guarded pair. The instant one appears, --motion-gesture
//       and the exit curve must exist, and the build stops until they do.
//
//   (c) THE GAP THIS GATE HAD, found 2026-09-12 by the first component that moved.
//       It scanned `transition:` declarations only. CSS moves things two ways, and a
//       @keyframes block with `transform:` in it went straight past — so the reveal
//       gesture, which is a keyframe animation on a view timeline and not a
//       transition at all, would have shipped without ever touching the pair it was
//       supposed to require. A gate that catches one of the two ways is half a gate.
//       Both are scanned now, and @keyframes is checked for layout properties too.
const LAYOUT_PROPS = /\b(width|height|margin|padding|top|left|right|bottom|inset)\s*:/;
const TRANSFORM_PROPS = /\b(transform|translate|rotate|scale)\b/;
// letter-spacing relayouts a line, so it counts as a layout property — with one
// stated exemption. .wordmark--scroll animates it, and it may: the wordmark is a
// single line of text in a container nothing else shares, so its reflow relayouts
// one line and cannot push anything below it. The exemption is a NAMED selector, not
// a property allowance, so the same animation on a paragraph still fails.
const TRACKING_PROP = /\bletter-spacing\s*:/;
const TRACKING_EXEMPT = /wordmark-settle|wordmark--scroll/;
for (const f of ["components/components.css", "styles.css"].filter((p) => existsSync(p))) {
  const src = readFileSync(f, "utf8");
  for (const m of src.matchAll(/transition:[^;}]+/g)) {
    const t = m[0].replace(/\s+/g, " ").trim();
    if (LAYOUT_PROPS.test(t + ":")) failures.push(`${f}: a layout property is animated — ${t.slice(0, 64)}`);
    if (TRANSFORM_PROPS.test(t) && !(MOTION.gesture && MOTION.easeIn)) {
      failures.push(`${f}: a transform is animated, so this system now has a gesture — fill in MOTION.gesture and MOTION.easeIn (the exit curve) before shipping it`);
    }
  }
  // The keyframe names that are actually driven by a TIMELINE. Only these are
  // capable of the failure below: a time-based animation runs for its duration and
  // always reaches its last frame, so an opening frame at opacity 0 resolves within
  // --motion-gesture whatever the reader does. A timeline-driven one may never
  // complete — its progress is a scroll position, which can be negative or can stop
  // short at either end of a document. The rule is therefore a pair, not a ban:
  //   timeline-driven  -> transform only, cover phase, never opacity
  //   time-based       -> opacity is fine, because it always finishes
  const timelineDriven = new Set();
  for (const r of src.matchAll(/\{[^{}]*animation-timeline[^{}]*\}/g)) {
    for (const n of r[0].matchAll(/animation(?:-name)?:\s*([^;}]+)/g)) {
      for (const tok of n[1].split(/[\s,]+/)) {
        // a shorthand can list the name in any position; keep the plausible idents
        if (/^[a-zA-Z_-][\w-]*$/.test(tok) && !/^(none|both|forwards|backwards|infinite|normal|reverse|alternate|linear|ease|ease-in|ease-out|ease-in-out|running|paused|view|scroll|auto)$/.test(tok)) {
          timelineDriven.add(tok);
        }
      }
    }
  }
  for (const m of src.matchAll(/@keyframes\s+([\w-]+)\s*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g)) {
    const [block, name] = m;
    if (TRANSFORM_PROPS.test(block) && !(MOTION.gesture && MOTION.easeIn)) {
      failures.push(`${f}: @keyframes ${name} animates a transform — fill in MOTION.gesture and MOTION.easeIn before shipping it`);
    }
    if (LAYOUT_PROPS.test(block)) failures.push(`${f}: @keyframes ${name} animates a layout property`);
    // (d) A TIMELINE-DRIVEN KEYFRAME'S OPENING STATE MUST BE A VISIBLE STATE. The
    //     check that would have caught the worst defect this system has shipped:
    //     `reveal-in` opened on `opacity: 0`, and with `animation-fill-mode: both` any
    //     timeline whose progress goes negative pins the element there permanently.
    //     All seven sheets of the portfolio surface were invisible at every scroll
    //     position, with the animation attached, the timeline live and no console
    //     error — measured at currentTime -5.9%, because the `entry` phase is
    //     ill-defined for a subject taller than the scrollport.
    //
    //     Scoped to timelineDriven above, so the cover's time-based entrance is not
    //     caught by it: that one cannot fail this way. A keyframe may also fade
    //     something OUT — `cue-retire` opens at `opacity: 1` — because that failure
    //     direction leaves content on the page.
    const opening = /(?:^|\})\s*(?:from|0%)\s*\{([^}]*)\}/.exec(block);
    if (timelineDriven.has(name) && opening && /opacity\s*:\s*0*(?:\.0+)?\s*[;}]/.test(opening[1] + ";")) {
      failures.push(`${f}: @keyframes ${name} is driven by a timeline and opens on opacity 0 — an out-of-range or ill-defined timeline pins the element there and the content disappears. Animate transform instead, and leave opacity to the guard-free class or to a time-based animation.`);
    }
    // The tracking check belongs to the keyframe it reads. It had been pasted into the
    // animation-range loop below, where `block` and `name` do not exist, so the
    // generator threw before writing anything.
    if (TRACKING_PROP.test(block) && !TRACKING_EXEMPT.test(name)) {
      failures.push(`${f}: @keyframes ${name} animates letter-spacing, which relayouts a line — the only exemption is the wordmark, and it is named`);
    }
  }
  // (e) A NAMED PHASE THAT STOPS BEING DEFINED. `entry` and `exit` are ill-defined for
  //     a subject taller than the scrollport; `cover` and `contain` are not. Author-time
  //     height is unknowable, so the phase is what gets fixed rather than the element.
  //
  //     THIS CHECK WAS WRONG TWICE BEFORE IT WAS RIGHT, and both faults are the same
  //     mistake: it tested `src` — the whole stylesheet — and gated on the keyframe
  //     name "reveal-in". So it fired on an unrelated rule's `entry` range, pushed a
  //     failure on every run, and made the file the handbook calls "the specification"
  //     ungeneratable; and because it matched a name rather than a declaration, it
  //     could never say WHICH selector was at fault and would have gone silent the
  //     moment the keyframe was renamed. A check that cannot name its offender is a
  //     check nobody can act on. It iterates declarations now.
  for (const m of src.matchAll(/animation-range:\s*([^;}]+)/g)) {
    const value = m[1].replace(/\s+/g, " ").trim();
    if (/\b(entry|exit)\b/.test(value)) {
      failures.push(`${f}: animation-range "${value}" uses the entry or exit phase, which is ill-defined for a subject taller than the scrollport — use cover or contain`);
    }
  }
}

// The elevation ramps, checked against the ceiling the ground ladder sets.
const ceilingLight = shadowCeiling(LIGHT_GROUNDS, light.roles.ink);
console.log(`\nElevation    ceiling alpha ${ceilingLight.toFixed(4)} (light band; the dark band carries none)`);
for (const [name, s] of Object.entries(SHADOW_LIGHT)) {
  console.log(`             --shadow-${name.padEnd(7)} peak ${s.peak.toFixed(3)}   ${s.peak <= ceilingLight ? "under the ceiling" : "OVER"}`);
  if (s.peak > ceilingLight) {
    failures.push(`--shadow-${name}: peak alpha ${s.peak} exceeds the ceiling ${ceilingLight.toFixed(4)} — a shadow that dark reads as a sixth ground`);
  }
}

// APPEND-ONLY, and checked. A numbered spacing scale has one failure mode a t-shirt
// scale does not: insert 20px in the middle and --space-5 names 24px in every file
// written before today and 20px in every file written after, with nothing to see in
// either. Steps may be added at the end; an existing index may never be repointed.
// 4px division, as in the foundation. Density 0.70x is already factored in.
const SPACE = [4, 8, 12, 16, 24, 32, 48, 64, 96];
const SPACE_FROZEN = [4, 8, 12, 16, 24, 32, 48, 64, 96];
SPACE_FROZEN.forEach((v, i) => {
  if (SPACE[i] !== v) failures.push(`Space step ${i + 1} was ${v}px and is now ${SPACE[i]}px — the scale is append-only`);
});
console.log(`\nSpace        ${SPACE.join(" ")}   (append-only, ${SPACE_FROZEN.length} steps frozen)`);

// NO COLOUR: every ground, role, hairline and the icon midtone must be a pure grey.
for (const [where, h] of [
  ...Object.entries(LIGHT_GROUNDS).map(([k, v]) => [`light/${k}`, v]),
  ...Object.entries(DARK_GROUNDS).map(([k, v]) => [`dark/${k}`, v]),
  ...Object.entries(light.roles).map(([k, v]) => [`light/${k}`, v]),
  ...Object.entries(dark.roles).map(([k, v]) => [`dark/${k}`, v]),
  ["light/hairline", IDENTITY.hairline], ["light/hairline-strong", IDENTITY.hairlineStrong],
  ["dark/hairline", DARK.hairline], ["dark/hairline-strong", DARK.hairlineStrong], ["icon-mid", ICON_MID],
]) {
  const c = ok(parse(h)).c || 0;
  if (c > CHROMA_MAX) failures.push(`${where} ${h}: chroma ${c.toFixed(4)} > ${CHROMA_MAX} — this system carries no colour`);
}

// A failed check must not produce output that looks valid.
// Otherwise a token file sits in the tree that nobody questions any more.
if (failures.length) {
  console.error("\nFAILED:\n  " + failures.join("\n  "));
  console.error("Nothing written — pass the check first.");
  process.exit(1);
}

/** The self-hosted face plus one @font-face per fallback, each carrying its
 *  measured size-adjust.
 *
 *  The "../" is load-bearing: url() inside an imported stylesheet resolves against
 *  THAT stylesheet's own location, not against the document. typography.css lives in
 *  tokens/, so a bare "assets/fonts/..." would point at tokens/assets/fonts/ and the
 *  face would silently fall back. Found by measuring, not by reading. Both spellings of every local() name are listed because
 *  which one resolves is a per-face accident, not a rule. */
function faceBlock(g) {
  const one = (family, file, weights, style) => `@font-face {
  font-family: "${family}";
  src: url("../${file}") format("woff2");${style ? `\n  font-style: ${style};` : ""}
  font-weight: ${weights};
  font-display: swap;
}`;
  const self = one(g.self.family, g.self.file, g.self.weights);
  // GATED ON THE FILE, and the gate is the honest half of this decision. The italic
  // is a real intent — declared in FONT_CHAIN with its reasoning — but a @font-face
  // pointing at a woff2 that is not in the tree fails silently: no console error, no
  // visible defect, just a family that never resolves. That is the dead declaration
  // this generator exists to prevent, and the same rule that keeps `captured` assets
  // out of the repository rather than stubbed into it.
  //
  // So the face and its token appear together, or neither appears. `npm run fonts`
  // fetches the cut; the next `npm run tokens` emits both. Until then emphasis is
  // weight 500, which is not a fallback but the device this system already shipped.
  const hasItalic = Boolean(g.italic) && existsSync(g.italic.file);
  const ital = hasItalic ? "\n" + one(g.italic.family, g.italic.file, g.italic.weights, "italic") : "";
  const fb = g.fallbacks.map((f) => `@font-face {
  font-family: "${f.name}";
  src: ${f.local.map((n) => `local("${n}")`).join(", ")};
  size-adjust: ${f.sizeAdjust};
}`).join("\n");
  return self + ital + "\n" + fb;
}

/** The stack: self-hosted face, then the metric-corrected fallbacks, then generic. */
function stack(g) {
  return [`"${g.self.family}"`, ...g.fallbacks.map((f) => `"${f.name}"`), g.generic].join(", ");
}

/** The italic stack, or the absence note. Two families and no further: the metric
 *  fallbacks DO carry real italics, so continuing into them would set every <em> in a
 *  different family from its own sentence — the exact shape-change font-synthesis:
 *  none was set to prevent, reached from the other side.
 *
 *  Emitted only when the cut is actually present. A token naming a family with no
 *  @font-face is the same dead declaration as a @font-face with no file, seen from
 *  the other end, so the two are emitted together or not at all. */
function italicDecl(g) {
  if (!(g.italic && existsSync(g.italic.file))) {
    return `  /* --font-sans-italic is NOT declared: ${g.italic ? g.italic.file : "no italic in FONT_CHAIN"}
   * is not in the repository, and a token naming a family with no @font-face is the
   * same dead declaration as a @font-face with no file. Run \`npm run fonts\` to fetch
   * the cut; the next \`npm run tokens\` emits the face and this token together.
   * Until then emphasis is weight 500 — see the note in styles.css. */`;
  }
  return `  /* EMPHASIS ONLY, and deliberately two families long — it stops at
   * "${g.self.family}" rather than continuing into the metric fallbacks. */
  --font-sans-italic: "${g.italic.family}", "${g.self.family}", ${g.generic};`;
}

/** Every weight token at one grade, for one band's block. */
function gradeBlock(g, indent) {
  return [
    ...SCALE.map((s) => `${indent}--text-${s.name}-weight: ${s.weight + g};`),
    ...MONO.map((m) => `${indent}--text-${m.name}-weight: ${m.weight + g};`),
  ].join("\n");
}

const typographyCss = `/* Typography — GENERATED by _scripts/derive-tokens.mjs, do not edit by hand.
 *
 * Inter is fixed and self-hosted. -apple-system is deliberately dropped: on Apple
 * hardware it renders a different font with different metrics, and this scale is
 * trimmed to tight tracking, where metric differences become visible.
 *
 * That rule used to apply to the first position only. The stack read
 * "Inter", "Helvetica Neue", Arial — and those two are 5.3 % smaller than Inter, which
 * is exactly the problem the rule was written to prevent, moved one position down.
 * Every fallback now carries a measured size-adjust, bringing the deviation under half
 * a percent. The values are SET VALUES from a browser measurement; see FONT_CHAIN in
 * _scripts/derive-tokens.mjs for the numbers and the date.
 *
 * Neighbouring sizes hold at least ${TYPE_MIN_RATIO}x apart (R2). Checked at generation time.
 * --text-display-sm is a variant of the same size, not its own step.
 */
${faceBlock(FONT_CHAIN.sans)}
${faceBlock(FONT_CHAIN.mono)}
:root {
  --font-sans: ${stack(FONT_CHAIN.sans)};
  --font-mono: ${stack(FONT_CHAIN.mono)};
${italicDecl(FONT_CHAIN.sans)}

${SCALE.map(s => `  --text-${s.name}-size: ${s.px}px;
  --text-${s.name}-weight: ${s.weight};
  --text-${s.name}-tracking: ${s.tracking};
  --text-${s.name}-leading: ${s.leading};`).join("\n\n")}

${RESPONSIVE.map(s => `  --text-${s.name}-size: ${s.px}px;   /* variant of --text-${s.of}-size */
  --text-${s.name}-leading: ${s.leading};`).join("\n")}

  /* Mono is its own scale, not a rung of the ladder above. Measured: the x-heights
   * differ by 0.7 % (Inter 9.83, JetBrains Mono 9.90), so the same nominal size is
   * already optically matched. The 1.125 neighbour check does not apply across the
   * two scales — they are not neighbours. Leading is tighter than body text because
   * a line of code is a closed unit, not flowing prose. */
${MONO.map(m => `  --text-${m.name}-size: var(--text-${m.of}-size);
  --text-${m.name}-weight: ${m.weight};
  --text-${m.name}-leading: ${m.leading};`).join("\n")}

  /* Editorial slots. A slot names an existing size for a purpose; it is not a step,
   * carries no new value, and is outside the neighbour check by construction. */
${SLOTS.map(s => `  /* ${s.note} */
  --text-${s.name}-size: var(--text-${s.size}-size);
  --text-${s.name}-weight: var(--text-${s.weight}-weight);
  --text-${s.name}-tracking: var(--text-${s.tracking}-tracking);
  --text-${s.name}-leading: ${s.leading};`).join("\n")}
}

/* OPTICAL GRADE. Light ink on a dark ground reads heavier than the same weight
 * reversed, so the dark band carries ${GRADE.dark} units of wght — under a quarter of a
 * weight step, checked at generation time, so no role can cross into the next named
 * weight. Whole blocks rather than a calc() on one token: a custom property resolves
 * where it is declared, and a [data-theme] block further down the tree would never
 * reach a calc() sitting on :root. Inter's wght axis is continuous; the metric
 * fallbacks are not variable and round back to the nominal weight. */
@media (prefers-color-scheme: dark) {
  :root {
${gradeBlock(GRADE.dark, "    ")}
  }
}

[data-theme="dark"] {
${gradeBlock(GRADE.dark, "  ")}
}

[data-theme="light"] {
${gradeBlock(0, "  ")}
}
`;

// ---------- Space ----------
const spacingCss = `/* Space — GENERATED by _scripts/derive-tokens.mjs, do not edit by hand.
 *
 * APPEND-ONLY. --space-5 must name 24px for as long as this system exists: a step
 * inserted in the middle would repoint every index above it, in every file already
 * written, invisibly. Add at the end or not at all — checked at generation time
 * against SPACE_FROZEN.
 *
 * 4px division. On surfaces that belong to us, the margin is the actual
 * design device — but proportional, not fixed: the sheet is the unit,
 * not the page.
 */
:root {
${SPACE.map((v, i) => `  --space-${i + 1}: ${v}px;`).join("\n")}

  --radius-card: 28px;
  --radius-chip: 999px;

  /* The floor comes FIRST because the page inset is built out of it. 7vw alone is
   * not an inset: at a 280px viewport it is 19.6px, and the rule that the margin is
   * the design device stops being true somewhere around 20. The floor token existed
   * and was never applied to anything — two tokens, one of them decorative. Now the
   * proportional value and its floor are one value.
   *
   * env() is inside the same max() rather than bolted on at the page: on a notched
   * phone in landscape the cutout can exceed 7vw, and an inset that the hardware
   * overruns is not an inset either. Both fall back to 0px where there is no cutout. */
  --page-inset-min: 20px;
  --page-inset: max(var(--page-inset-min), 7vw,
                    env(safe-area-inset-left, 0px), env(safe-area-inset-right, 0px));

  /* ${MEASURE_SANS_EM}em is ${MEASURE_SANS_EM * 18}px at body size, and Inter's measured advance is
   * ${CHAR_SANS_PX.toFixed(2)}px a character, so the body measure is ${MEASURE_CHARS} CHARACTERS — inside the 45 to 75
   * a line of prose wants. An em is not a character; an earlier comment here
   * conflated the two and claimed ${MEASURE_SANS_EM}em carried ${MEASURE_SANS_EM} characters. */
  --measure: ${MEASURE_SANS_EM}em;
  /* Mono runs 18.8 % wider at the same size (advance 291.60 against 245.43), so the
   * same column of ink is ${MEASURE_CODE_EM}em and holds ${MEASURE_CODE_CHARS} characters at ${CHAR_MONO_PX.toFixed(2)}px each. Plain
   * arithmetic on measured numbers, not a solved value. */
  --measure-code: ${MEASURE_CODE_EM}em;
  /* The name is --page-inset and not --page-margin on purpose: \`margin\` already
   * names the CSS box property every component uses, and one word for two concepts
   * is the most common vocabulary collision there is. */
}
`;

// ---------- Motion file ----------
const motionCss = `/* Motion — GENERATED by _scripts/derive-tokens.mjs, do not edit by hand.
 *
 * Four tokens, and that is the whole set: two for colour and opacity, two for the
 * gesture. This system has at most one deliberate gesture per surface, not a motion
 * library.
 *
 * --motion-fast is a SET VALUE, not a solved one, and it is not new: it is the
 * --transition-fast: 120ms that sat unused in .cupertino/CUPERTINO_REVIEW_FLOW.html
 * and that the handbook names as a dead token. It now has a consumer. The sibling
 * --transition-base: 200ms is deliberately NOT adopted — 200 ms is the boundary the
 * guard rule is measured against, and a duration must not sit on its own boundary.
 * _scripts/derive-tokens.mjs fails the build if --motion-fast ever reaches it.
 *
 * --motion-ease is the CSS Easing Functions Level 1 definition of \`ease-out\`, written
 * out so the value is inspectable. A hand-tuned curve would be four numbers with no source.
 *
 * COLOUR AND OPACITY: --motion-fast and --motion-ease belong to the guard-free class:
 * under ${MOTION.guardFreeMax} ms, colour and opacity need no prefers-reduced-motion guard. Transform
 * and position do, always, and the gesture pair is only ever used inside that guard:
 *
 *   @media (prefers-reduced-motion: no-preference) {
 *     .something { transition: transform var(--motion-gesture) var(--motion-ease); }
 *   }
 *
 * Under a reduced-motion preference the motion is REPLACED, never merely removed: the
 * element keeps the guard-free colour or opacity change at --motion-fast. Feedback that
 * vanishes leaves the reader unsure whether the input registered, which is worse than
 * the motion it was meant to spare them.
 *
 * --motion-gesture and --motion-ease-in arrived with the first surface that moves: the
 * chapter heads' 03 Scan (components/components.css). MOTION held both values while
 * this template emitted neither, so every var(--motion-gesture) resolved to nothing,
 * the animation declaration went invalid at computed-value time, and the Scan silently
 * never ran. A value the generator checks but never writes is the dead-token defect in
 * its other direction.
 */
:root {
  /* colour and opacity, guard-free below ${MOTION.guardFreeMax}ms */
  --motion-fast: ${MOTION.fast}ms;   /* @kind other */
  /* CSS Easing Level 1, the \`ease-out\` keyword */
  --motion-ease: ${MOTION.ease};   /* @kind other */
  /* the guarded class: transform and position, always under prefers-reduced-motion */
  --motion-gesture: ${MOTION.gesture}ms;   /* @kind other */
  /* CSS Easing Level 1, the \`ease-in\` keyword — the exit curve */
  --motion-ease-in: ${MOTION.easeIn};   /* @kind other */
}
`;

const stylesCss = `/* Single entry point. Link from every surface.
 * Source every value through var(), never hardcode a hex, a font or a px value
 * that a token already carries.
 */
@import url("tokens/typography.css");
@import url("tokens/colors.css");
@import url("tokens/spacing.css");
@import url("tokens/motion.css");
@import url("components/components.css");

/* MEASURED, not assumed: without this reset, every padding adds itself to the
 * set height. Six of ten specimen cards overflowed their own frame because of
 * this, two of them by exactly the sum of their padding (64px = 2x --space-6,
 * 106px = 2x 7vw at 760px). The reset fully fixes four of the six cases.
 * It belongs here and not in every card: a surface that forgets it would
 * otherwise behave differently from the system. */
*, *::before, *::after { box-sizing: border-box; }

html { color-scheme: light dark; }
body {
  background: var(--paper);
  color: var(--ink);
  font-family: var(--font-sans);
  font-size: var(--text-body-size);
  line-height: var(--text-body-leading);
  -webkit-font-smoothing: antialiased;
  /* NO SYNTHETIC FACES. Inter is self-hosted and ships roman only, so every <em> in
   * this system was a browser-synthesised oblique — the roman mechanically skewed,
   * which is not an italic and is not a cut anyone drew. Worse, it was unstable: the
   * metric fallbacks DO carry real italics, so emphasis changed shape between the
   * fallback and the webfont. font-synthesis: none refuses the fake outright, which
   * makes the gap visible instead of plausible. The device that replaces it is
   * declared below. Shipping the real Inter italic cut supersedes all of this. */
  font-synthesis: none;
}

/* EMPHASIS WITHOUT AN ITALIC. With no italic file and no synthesis, emphasis takes
 * the carrier this system already uses for every other distinction — weight, one
 * variable step, not a jump to a named weight. 500 sits between body 400 and the
 * 600 of a subhead, so emphasis inside a sentence cannot be mistaken for a heading.
 * <cite> is included because journal titles in the publication list are the main
 * thing that would otherwise ask for an italic. */
em, i, cite { font-style: normal; font-weight: 500; }
/* The deck: the summary line between a heading and its body. It was being set in
 * italics for want of a name. */
.deck {
  font-size: var(--text-deck-size);
  font-weight: var(--text-deck-weight);
  letter-spacing: var(--text-deck-tracking);
  line-height: var(--text-deck-leading);
  color: var(--ink-secondary);
  max-width: var(--measure);
}
:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; }
/* A bare <a> is browser blue — a colour this system permits nowhere outside the
 * imagery layer, and the one that appears the moment somebody writes a link without
 * a class. It inherits the ink role it sits in and keeps its underline, drawn in the
 * same hairline everything else separates with. .link replaces that underline with a
 * border, because a border can carry the three-strength state ladder and a
 * text-decoration cannot. */
a { color: inherit; text-decoration-color: var(--hairline-strong); }
a:hover { text-decoration-color: var(--ink); }

/* RESILIENCE. Three things the system has to survive, each a real condition rather
 * than a preference.
 *
 * FORCED COLOURS. The OS replaces every colour it can reach. A system that
 * separates with hairlines and nothing else loses its separation entirely, because
 * a border in a colour the OS did not assign is a border the OS may drop. The two
 * hairline roles are therefore restated in system keywords, which forced-colours
 * mode does honour, and the focus ring takes Highlight. Monochrome makes this
 * cheap: there is no accent to lose.
 *
 * WRAPPING. A ${MEASURE_CHARS}-character measure makes a ragged last line and a widow likely.
 * text-wrap: pretty spends the browser's line-breaking budget at the end of the
 * paragraph, which is exactly where both defects sit; balance does the same for a
 * heading, which is short enough to solve completely.
 *
 * HYPHENATION. The content carries German publication titles, and German words
 * overrun a ${MEASURE_CHARS}-character line without it. It is language-dependent, so the element
 * needs a lang attribute for this to do anything. */
@media (forced-colors: active) {
  :root { --hairline: CanvasText; --hairline-strong: CanvasText; }
  :focus-visible { outline-color: Highlight; }
}

/* HIGH CONTRAST is the third appearance, not a variant of the second. The band
 * question is light or dark; this one is orthogonal to it, and a reader can ask for
 * both at once. Rather than a third set of solved roles — which would double the
 * palette to carry one preference — the ladder collapses upward: the weakest rung
 * takes the value of the one above it in whichever band is already in force. Two
 * rungs instead of three is the correct answer to "more contrast", because the
 * alternative is inventing a role stronger than --ink, and --ink is the identity.
 *
 * [data-theme] is named alongside :root and this block sits after every import, so
 * it also reaches the specimen cards, which set their band on a section rather than
 * on the document. */
@media (prefers-contrast: more) {
  :root, [data-theme] {
    --ink-tertiary: var(--ink-secondary);
    /* --ink-faint collapses to --ink-tertiary and not to --ink-secondary. It is a
     * non-text role — rules, the progress bar, the zebra edge — and collapsing it
     * two rungs would put page furniture at body-text strength, which is more
     * contrast in the wrong place. One rung up is the answer for a role that was
     * never text. */
    --ink-faint: var(--ink-tertiary);
    --decor: var(--ink-secondary);
    --hairline: var(--hairline-strong);
    /* The interleaved grounds collapse into their neighbours: five sheets one step
     * apart are a separation a reader asking for more contrast cannot see, and the
     * request is for fewer, stronger distinctions rather than more subtle ones. */
    --paper-veil: var(--paper);
    --paper-shade: var(--paper-dim);
  }
}
p, li, dd, figcaption { text-wrap: pretty; hyphens: auto; }
h1, h2, h3, h4 { text-wrap: balance; }
::selection { background: var(--ink); color: var(--paper); }
hr { border: 0; border-top: 1px solid var(--hairline); }

/* GRADIENTS. One token, two rules, and a refusal.
 *
 * RULE ONE: a gradient may run only between two grounds this system already owns.
 * --paper to --paper-dim is a ground with a direction, not a colour statement, so it
 * stays inside the monochrome rule. Anything with a hue in it belongs to the imagery
 * layer, where colour is solved rather than picked.
 *
 * RULE TWO: the interpolation space is declared, never defaulted. sRGB blends through
 * grey and puts a dead spot in the middle of a ramp; \`in oklch\` does not. CSS can say
 * it out loud, which is why the field is one line here and nine sampled stops in
 * imagery/hero-*.svg, where SVG has no way to declare it.
 *
 * BANDING: the ramp is shallow, which is exactly the case that bands on an 8-bit
 * display. The mitigation already exists — the paper texture from tokens/paper.mjs is
 * noise, and noise is what breaks a band.
 *
 * NO SCRIM. A scrim is alpha, and alpha is the one thing this palette does not use:
 * every role is solid and separately solved, so nothing changes meaning over a
 * different ground. Text never sits on imagery here — the hero splits, it does not
 * overlay — so the token that would need alpha has no consumer and is not shipped.
 */
/* Emitted in ALL FOUR band blocks, not once on :root. A custom property resolves
 * where it is DECLARED: the two var()s inside it would substitute at :root and the
 * gradient could never re-resolve inside a [data-theme] subtree — it would carry the
 * document's band into a section that had asked for the other one. This is the same
 * trap the optical grade is emitted in whole blocks to avoid. */
:root { --gradient-field: linear-gradient(in oklch to bottom, var(--paper), var(--paper-dim)); /* @kind other */ }
@media (prefers-color-scheme: dark) { :root { --gradient-field: linear-gradient(in oklch to bottom, var(--paper), var(--paper-dim)); /* @kind other */ } }
[data-theme="dark"] { --gradient-field: linear-gradient(in oklch to bottom, var(--paper), var(--paper-dim)); /* @kind other */ }
[data-theme="light"] { --gradient-field: linear-gradient(in oklch to bottom, var(--paper), var(--paper-dim)); /* @kind other */ }


`;

json.typography = { fontSans: "Inter", fontMono: "JetBrains Mono", minRatio: TYPE_MIN_RATIO,
                    scale: SCALE, responsive: RESPONSIVE,
                    grade: { dark: GRADE.dark, maxAbs: GRADE.maxAbs,
                             why: "light ink on a dark ground reads heavier at the same weight; Inter has no GRAD axis, so the compensation rides the continuous wght axis, bounded to under a quarter of a weight step",
                             isSetValue: true } };
json.spacing = { base: 4, steps: SPACE, radiusCard: 28, measure: "34em", pageInset: "7vw",
                 measureChars: MEASURE_CHARS, measureCodeChars: MEASURE_CODE_CHARS,
                 charPx: { sans: +CHAR_SANS_PX.toFixed(2), mono: +CHAR_MONO_PX.toFixed(2), atSize: 18 } };
json.icons = {
  midHex: ICON_MID,
  nonTextFloor: ICON_MIN,
  worstOfSixGrounds: +iconWorst.toFixed(2),
  worstOfSixGroundsLc: +iconWorstLc.toFixed(1),
  standardsConflict: "The one place the two standards cannot both be satisfied: maximising the worst-case Lc lands at #979797 (Lc 41.2) but WCAG 2.35, under the 3:1 non-text floor. Solved on WCAG, because that is the floor an audit enforces and the icon is redundant beside its label.",
  solvedOn: "2026-09-11",
  method: "lightness searched at the tint held from IDENTITY.seed, maximising the minimum contrast across all six grounds",
  usedIn: "assets/icons/*-mid.svg, for surface 1 only; surface 2 uses currentColor",
};
json.motion = {
  areSetValues: true,
  source: "--transition-fast: 120ms, the dead token in .cupertino/CUPERTINO_REVIEW_FLOW.html, adopted unchanged and given a consumer",
  fastMs: MOTION.fast,
  guardFreeMaxMs: MOTION.guardFreeMax,
  ease: MOTION.ease,
  easeSource: "CSS Easing Functions Level 1, the `ease-out` keyword",
  gestureMs: MOTION.gesture,
  easeIn: MOTION.easeIn,
  gestureIsMultiple: `${MOTION.gesture} = ${MOTION.gesture / MOTION.fast} x ${MOTION.fast} — checked, not asserted`,
  easeInSource: "CSS Easing Functions Level 1, the `ease-in` keyword",
  guarded: "transform runs only under @media (prefers-reduced-motion: no-preference), at --motion-gesture; the four gestures on templates/portfolio-index/ are the first consumers",
  reducedMotion: "substitution, never deletion: the guard removes the transform and the guard-free colour change stays, so the feedback survives",
  gate: "the stylesheets are scanned at generation time; a transform transition fails the build until MOTION.gesture and MOTION.easeIn (the exit curve) are filled in, and an animated layout property fails it outright",
};

const ROOT = process.argv[2];
if (ROOT) {
  mkdirSync(`${ROOT}/tokens`, { recursive: true });
  writeFileSync(`${ROOT}/tokens/colors.css`, css);
  writeFileSync(`${ROOT}/tokens/typography.css`, typographyCss);
  writeFileSync(`${ROOT}/tokens/spacing.css`, spacingCss);
  writeFileSync(`${ROOT}/tokens/motion.css`, motionCss);
  writeFileSync(`${ROOT}/styles.css`, stylesCss);
  writeFileSync(`${ROOT}/tokens/tokens.json`, JSON.stringify(json, null, 2) + "\n");
  console.log(`\nWritten: styles.css, tokens/colors.css, tokens/typography.css, tokens/spacing.css, tokens/motion.css, tokens/tokens.json`);
} else {
  console.log("\n(no target directory given — report only)");
}
