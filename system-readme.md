# Anselm Hahn — Personal Brand System

A monochrome document system for two surfaces: the GitHub profile and the
portfolio page. White, grey and near-black — no tint, no accent, no colour
anywhere, the image layer included. Emphasis comes from size, weight and
pictogram; imagery separates its series by pattern.

## Relationship to Statement Papers

**Sibling, not child.** Statement Papers remains unchanged as the letterhead
system for real letters. This system inherits the **identity, not the rule
set**.

The reason is checkable, not a matter of taste: this system has to break
four Statement Papers rules — "Animation: none", "No photography,
gradients, textures, or patterns behind text", "no Button/Input/Dialog",
"page margins 88px… the margin IS the design". Built as an extension,
Statement Papers would have to carry "except on the web" everywhere and
would become blurrier for its actual job.

What is shared is therefore one **file**, not a layer: paper, ink,
hairlines, typefaces, 4px division. If this shared core grows past ~50
lines, the sibling decision is outdated and a real base is due.

## How it is used

- **Link one stylesheet** — `styles.css`. It imports all tokens.
- **Every value through `var()`.** Never hardcode a hex, a typeface or a px
  value that a token already carries.
- **Do not edit tokens by hand.** `tokens/colors.css`,
  `tokens/typography.css`, `tokens/spacing.css` and `tokens/motion.css` are
  generated. Changing them means: adjust `_scripts/derive-tokens.mjs` and run
  `npm run tokens`. The script is the specification.

## Why the values are what they are

No colour role was chosen. For every text role, lightness is solved by
bisection against a contrast target — at fixed hue and chroma, against the
most demanding of the three grounds, so it holds against all three and not
just against the most convenient one.

| Role | light | dark | Target |
|---|---|---|---|
| `--ink` | `#232320` | `#fbfaf7` | ≥ 10:1 (from the identity, not solved) |
| `--ink-secondary` | `#4c4b46` | `#d4d5ce` | 7:1 **and** APCA Lc 75 |
| `--ink-tertiary` | `#696863` | `#babbb4` | 4.5:1 **and** APCA Lc 60 |
| `--ink-faint` | `#85857f` | `#9fa099` | 3:1 **and** APCA Lc 45 — non-text and large text only |
| `--decor` | `#a6a49c` | `#72726d` | none — a set value, purely redundant decoration |

Targets are **staggered**, and that is the core of it. An earlier draft gave
secondary and tertiary the same target; the result was `#696863` and
`#6a6861` — two names for one colour. Since then the generator additionally
checks that neighbouring roles are at least 1.20× apart. The ladder must
stay a ladder.

**Five rungs, not seven, and the refusal is the interesting part.** The 2026-09-12
amendment asked for three more; the measurement allowed one. A rung needs 1.20× of
clearance on both sides, so 1.44× of gap to sit in, and the best it can manage is the
geometric midpoint. Measured against paper: `ink → secondary` leaves 1.343× in the
light band and 1.190× in the dark; `secondary → tertiary` leaves 1.251× and 1.144×;
only `tertiary → decor` clears both, at 1.496× and 1.581×, and that rung became
`--ink-faint`. The dark band is the narrow one because APCA pins its roles above what
WCAG asks — dark secondary lands at 10.66 where 7:1 was the target — so the crowding
is a consequence of the second standard, not of the palette. A set that is seven in
one band and five in the other is not one set, which is the same finding
`imagery/series.json` records for the fourth motif series.

`--ink-faint` did not need a target invented for it: the geometric midpoint of
tertiary and decor is 3.015 against the hardest ground, and the WCAG 1.4.11 non-text
floor is 3.00. The rung the ladder wanted was one the standard already named.

**Five grounds per band, not three.** paper, veil, alt, shade, dim — veil and shade
are the OKLCH midpoints of the pairs they sit between. **Interleaved, not appended:**
a ground darker than dim would have become the new most demanding ground, and since
every role is solved against that ground, all of them would have re-solved. A request
for one more sheet tone would have moved every piece of type on both surfaces.
Between existing grounds they cannot, and every role is re-measured against all five.
The grounds are where the portfolio surface's visual separation comes from, because
colour in typography stayed forbidden.

The same rule applies to typography: neighbouring grades keep at least
1.125× distance. That is why caption is 14 and not 13 — 13 against eyebrow
12 gives 1.083 and is not a step, but a coincidence. Between headline and
body sits `subhead 23`, because a page with subsections needs the step that
a letterhead never needed.

**Inter is fixed.** `-apple-system` is deliberately left out: on Apple
hardware it renders a different typeface with different metrics, and this
scale is trimmed to −0.022em tracking — exactly where metric differences
become visible.

An italic cut is **specified and not shipped.** `FONT_CHAIN.sans.italic` names it as
its own family rather than as a second style on Inter, so that a missing file
degrades to weight-500 roman instead of to Arial Italic — and the `@font-face` and
`--font-sans-italic` are gated together on the file existing, because a face with no
file and a token with no face are the same dead declaration seen from two ends.

## Material

The paper structure is **generated, not sourced** (`tokens/paper.mjs`). The
reason is measured: a grain overlay that only darkens lowers the mean
luminance below the token value and pulls the already minimal warm chroma
toward neutral grey. The surface then does not become textured, it becomes
greyer.

The generated structure is **luminance-neutral by construction**: symmetric
lightening and darkening around the token value, alpha forced hard to 1.
Measured: deviation 0.01 %, anisotropy 1.01×. Two frequency bands — fine
grain plus low-frequency sheet formation; grain alone reads as image noise,
only the second band reads as material.

**Linen measures 1.20× directional energy** and therefore does not belong
under body text, but on cards and title surfaces. Fibrous is isotropic and
thus the choice for text surfaces.

Every sheet gets its fibre lay from its own name. Same stock, different
lay — like two sheets from one ream. That only works because the material
is a definition and not a file; a PNG *is* a sheet.

## Mark

Three candidates, all **self-inverse**: rotated 180°, the figure yields
exactly its complement. This means "works in both bands without a second
drawing" is constructed rather than merely checked. Measured: ink coverage
50.00 %, self-inversion 0.000 %.

A first draft built point symmetry and meant self-inversion — the two
properties exclude each other. A figure that maps onto itself under
rotation cannot map onto its complement. The measurement caught this before
it made it into the system.

**The choice among the three is still open.** Until then, no surface
carries a mark.

## Image layer

Built. `npm run imagery` solves the palette and writes the motifs; the
rules it enforces were fixed before it existed:

- It carries **no colour**: three greys one 0.155 lightness step apart, each with its
  own pattern — solid, 45° hatch, cross-hatch — so a series survives desaturation,
  a photocopy and a 9px bar.
- Every motif is **shipped separately** per band (`-dark`), never recoloured
  via CSS filter.
- Gradients run only between two grey grounds.
- Every generator refuses to write a value above OKLCH chroma 0.004, and
  `npm run chroma` checks the whole tree.

What the build writes: series 1 is the band's ink; worst case 3.67 light and 4.45
dark against `--paper-dim`. **Three series, not four** — a fourth needs a fourth
geometry, not a fourth angle.

Two seed motifs, each delivered twice: publications per year as a level-4
chart (14 dated works, the one undated work left out rather than placed
somewhere convenient), and the bisection that solved `--ink-secondary` as a
level-3 spot illustration — fourteen intervals converging on `#4c4b46` at
7.07, which is the value in the token file.

## Rules

- **No emoji.** Anywhere. The one prohibition kept verbatim through the 2026-09-12
  amendment, which dropped the other six.
- **The exclamation mark** is no longer prohibited and is still not used: the rule
  went, nothing adopted it as a device, so only its status moved.
- **Never category by colour alone.** Equally light colours have a
  greyscale spread of 0.002 and collapse together once desaturated.
- **Decorative images carry `alt=""`** — not *no* attribute at all,
  otherwise the screen reader reads the URL aloud.
- **Motion** is functional plus at most one deliberate gesture. Duration and
  easing come from `tokens/motion.css` — `--motion-fast` (120 ms) and
  `--motion-ease` — never from a literal. Both belong to the guard-free
  class: colour and opacity under 200 ms. Transform and position take a
  `prefers-reduced-motion` guard and have no token yet, because nothing in
  this system moves. Under reduced motion a gesture is **replaced** by the
  guard-free colour change, never simply removed — feedback has to survive.
  What is rendered server-side and cannot take a guard is
  named individually in the handbook's exceptions.
- **Icons locally**, not via CDN. One stroke weight, monochrome, **eleven of them**
  since 2026-09-12. The count-based growth rule was *amended* rather than applied that
  day: counted honestly it admitted one candidate of six, and a surface that needs a
  glyph per section, per platform and per unit cannot be built from one. Coherence now
  rests on the four closed keylines, the ±20 % ink-mass band (all eleven inside it,
  median 52.14, spread 1.36×) and the no-duplicate-silhouette clause — the one clause
  the amendment did not relax. New stop condition: sixteen. Third-party platform marks
  — Octocat, PyPI, npm, Zenodo — are **not** members; they are fenced in `.platform`,
  and the glyphs in front of platform names on surface 2 are ours and name the kind of
  thing, not the brand. A glyph reaches surface 2 through `.gi` as a `background-image`
  on the `-mid` file: two attempts at tinting it with `currentColor` through a CSS mask
  rendered filled squares with every precondition holding, so the documented midtone
  now carries both surfaces — `#7f7f79`, re-measured against all ten grounds, worst
  case 3.24 against a floor of 3. One file per container, not a pair per band: it is
  immune to the mismatch of "GitHub theme dark on a light OS".
- **Every asset belongs to a class, and the class carries an origin.**
  `derivable` is delivered whole, `drawn` as a system plus a seed set and a
  growth rule, `captured` and `shot` as rules and no assets. An absent class
  is written down as absent with its reason.
- **States by line, not by colour.** Rest, hover, `:focus-visible`, active
  and disabled run on `--hairline` → `--hairline-strong` → `--ink`. Disabled
  is `--ink-tertiary`, never `--decor`, because a disabled control is still
  read.

## The design-system compiler, and the underscore

This repository is read by two things with different ideas of what a file is.
`node` runs the build scripts; the studio's in-browser compiler bundles every
module it finds into `_ds_bundle.js` for a page. The build scripts are Node
programs — `node:fs`, `culori`, shebangs, top-level `await fetch` — and none
of that survives a browser bundler. Fixing it layer by layer does not work:
measured on 2026-09-11, `import.meta` gives way to the shebangs, the shebangs
to the unresolvable packages, and those to the top-level awaits. The floor is
`node:fs`, which has no browser implementation to inline.

**So the scripts are not offered to it.** The compiler skips any directory
whose name begins with an underscore, which is why `_scripts/` carries one.

That gives the prefix two jobs, and a prefix with two unstated meanings is
the kind of drift this handbook exists to catch, so both are stated here:

| Name | Meaning |
|---|---|
| `_ds_bundle.js`, `_ds_manifest.json`, `_adherence.oxlintrc.json` | the compiler **writes** this — do not edit |
| `_scripts/` | the compiler must **not read** this — it is not browser code |

What they share is the only thing that matters at a glance: an underscore
means *this file belongs to a machine, not to a reader of the system*. The
scripts remain the specification — `_scripts/derive-tokens.mjs` is still the
file that decides every colour, and the handbook still cites it by line — but
what a consumer of this design system uses is `styles.css`, the tokens, the
components and the assets. None of those live behind an underscore.

One file was met halfway rather than moved: `content/orcid.mjs` is genuine
browser code, and it loads the committed fallback as a JSON module instead of
resolving it through `import.meta.url`. The resolution is still relative to
the module and the read still happens only after the live fetch has failed.

## What lives here

```
styles.css                  Single entry point (imports all tokens)
tokens/
  colors.css                Colour roles, both bands — GENERATED
  typography.css            Type and scale — GENERATED
  spacing.css                4px division, measure, margins — GENERATED
  motion.css                 Duration and easing — GENERATED, two tokens
  tokens.json                Machine-readable: values, measurements, procedure
  paper.mjs                  Material definition, fibre lay per sheet
  texture-lab.html          Material variants with their own measurement
  paper-check.html          Seed invariance across real project names
components/
  components.css            Sheet, project, usage, publication, colophon, code,
                            table, link, button, notice, icon, and the twelve
                            admitted 2026-09-12: wordmark, index, ordinal, address,
                            tenure, locale, progress, reveal, badge, zebra,
                            elevation, platform, glyph, divider, cover, usage-bar,
                            stack-figure, specimen — plus sparkline, declared and
                            not shipped for want of a daily series
templates/
  portfolio-index/          Layer 2 as a Design Component — the surface that admits
                            the new components, on real content from content/*.json
assets/
  mark.mjs                    Mark candidates plus exact check
  icons/                      Eleven icons, each currentColor and midtone, four
                              closed keylines, +/-20% ink-mass band
  og/                         Open Graph images, 1200x630, plus the raster lab
imagery/
  series.json                 The three solved series, both bands — GENERATED
  hero-*.svg                  The hero, per band — papercut layering
  hero.json                   Every hero parameter and where it came from
  spot-*.svg                  Three section spots per band, two layers each
  banner-*.svg                Wide, short, carries its own text, and does not move
  ornament-*.svg              A divider that has earned one; the hairline is default
  figures.json                The layer-drop rule, and the three refused classes
  bisection.svg               Level 3, the reading that made --ink-secondary
  publications-by-year.svg    Level 4, from content/publications.json
  thumb-*-light.svg           26 index thumbnails, one layer each, generated from
  thumb-*-dark.svg            content/projects.json — `shot` promoted to `drawn`
  paper-*-light.svg           Paper specimens: the definition in tokens/paper.mjs
  paper-*-light.png           evaluated per sheet name, shipped as SVG (live) and
  paper-*-dark.svg            PNG at 2x (feeds, README, print — no SVG filters there).
  paper-*-dark.png            Measured: R 243-255, mean 250.7 on a ground of 251.
_scripts/
  derive-tokens.mjs         Generates all tokens. Checks WCAG, APCA, the ladder,
                            polarity, the grade bound, the frozen spacing scale
                            and the motion gates. Writes nothing on failure.
  check-icons.mjs           Re-measures the icon set: canvas, stroke, clearance,
                            keyline, half-unit grid, both variants, ink mass
  build-imagery.mjs         Solves the series, writes the motifs per band
  build-hero.mjs            The hero: papercut layering, every parameter derived
  build-figures.mjs         Spots, banner, ornament — and the layer-drop rule
  build-og.mjs              Writes the Open Graph images from the content model
  build-colophon.mjs        Generates COLOPHON.md from what is actually there
design-handbook.md          Twelve dimensions, four layers, two bands
LEXICON.md                  The vocabulary by kind, and the audit against five
                            reference vocabularies — what it changed, what is open
COLOPHON.md                   Entry point — also names what is missing
```

## What is still missing

The mark choice is made, the image layer is built, and layer 2 now exists as
`templates/portfolio-index/`. What is left is named in the inventory rather than
here: no screenshot rule, no card image, no key art — each absent because no surface
has asked, and each written down as absent with its reason. Two named gaps carry
dates instead: `assets/fonts/inter-latin-italic-var.woff2` is declared in
`tokens/typography.css` and not yet fetched — the face is declared ahead of its file
on purpose, so that `npm run fonts` (or dropping the woff2 in) is the only step, and
emphasis renders as weight-500 roman until then with nothing substituted; and
`content/tenure.json` does not exist, so the tenure component is specimen-visible
with its rows recorded as an absence. The colophon carries the current state each
time; it is generated and therefore cannot claim what isn't there.

## What the strict version cost

Recorded because the amendment was a reversal, and a reversal with no record invites
the next one. Of eight standing prohibitions, seven were dropped on 2026-09-12 and
one — no emoji — was kept verbatim. The reason given was that the rules were all
phrased as refusals, so the system could say what a page must not do and had nothing
to say about what it was for; three earlier page drafts came out correct and empty.

In play now: shadows, italics, badge rows, zebra striping, and exactly one headline
figure without a source line. Dropped but not adopted: the exclamation mark. **Not
dropped:** colour in typography and controls, which is why the visual separation the
amendment was asked for is carried by five grounds, an elevation ceiling and a line
ladder rather than by hue. Every refusal that survived a concept-by-concept reading of
nine portfolio references is kept in `guidelines/reference-reading.html` with the
measurement behind it — including the two ink rungs the dark band refused and the
five icon candidates the count refused.

## Inventions as inventions

Six handbook dimensions — **material-and-imagery**, **iconography**,
**interaction-states**, **asset-classes**, **code-and-tabular** and
**font-chain** — sit outside the Cupertino catalogue and were added by hand.
The catalogue knows neither an image layer nor an icon layer, has nothing for
code or tabular matter, nothing for a font stack past its first position,
nothing for what a system may promise per asset class, and its
`interaction-and-motion` is about movement rather than about the state of a
control. Without this addition, `cupertino-handbook-check` would never check
them.

Not verified and therefore not carried as a finding: the motion behaviour of
the reference pages. The recommendation instead rests on the project's own
evidence — three earlier page drafts had motion and still felt empty.
