# Icons

Eleven icons. It was three until 2026-09-12, and the growth from three to eleven was
an **amendment to the growth rule below, not an application of it** — the rule as
written admitted exactly one of six counted candidates, and the surfaces needed a set.
The amendment is recorded here rather than performed quietly, because the rule it
replaces was the thing keeping the set coherent.

| File | Stands for | Origin |
|---|---|---|
| `external.svg` | a link that leaves the surface | counted: 34 outbound links on surface 2, 18 on surface 1 |
| `doi.svg` | a DOI, concept or version | counted: 24 across both surfaces |
| `package.svg` | a published package | counted: 19 usage figures |
| `listing.svg` | a listing on a third-party marketplace | counted: 49 |
| `download.svg` | a download | counted: 26 — admitted by the amendment, which waived the duplicate objection |
| `star.svg` | a star on a repository | admitted by the amendment |
| `tag.svg` | a tagged release | admitted by the amendment |
| `identifier.svg` | a persistent researcher identifier | admitted by the amendment |
| `repo.svg` | a source repository | admitted by the amendment |
| `chart.svg` | a measured figure | admitted by the amendment |
| `terminal.svg` | a command line | admitted by the amendment |

The first three counts were taken 2026-09-11 in the since-retired `mockup/index.html`,
`mockup/README.md` and `content/publications.json`; the next two 2026-09-12 in the
same files. The last six are **not** counted and do not claim to be: they exist
because `templates/portfolio-index/` needed a glyph per section, per platform and per
unit, and a set that covers two thirds of a surface is worse than one that covers it.

## Two files per icon, and why that is not a band pair

`<name>.svg` carries `stroke="currentColor"`. On surface 2 an icon therefore takes
the ink role of whatever it sits in and needs no band variant at all.

`<name>-mid.svg` carries the solved midtone `#7f7f79`. It is for surface 1, where
GitHub serves the file as an `<img>` and no custom property reaches it. GitHub also
serves both `<picture>` sources verbatim and lets the browser choose against the
**OS** setting rather than GitHub's theme, so a light asset lands on a dark page and
`<picture>` cannot repair it. One tone that holds on every ground is the only thing
that is immune.

So this is not a light/dark pair. It is one file per container.

## The midtone, measured

Solved 2026-09-11 with the WCAG formula from `_scripts/derive-tokens.mjs`: lightness
searched at the tint held from `IDENTITY.seed`, taking the value that maximises the
minimum contrast across all six grounds.

| | paper | alt | dim |
|---|---|---|---|
| light band | 3.86 | 3.57 | 3.26 |
| dark band | 3.91 | 3.62 | 3.24 |

Worst case 3.24, against the non-text floor of 3:1 (WCAG 1.4.11). The generator
re-checks this on every run; if a ground moves, the build fails rather than the file
quietly becoming wrong.

## Drawing

18-unit grid, 1-unit stroke, round caps and joins, no fills. At body size (18px) the
stroke renders at exactly 1.00px — the width of `--hairline`. Axis-aligned edges sit
on half-integer coordinates so they land on whole pixels.

## The size ramp

**One size: 18px, the size it is drawn at.** The set has no size ramp and no micro
cut, and that is a rule rather than an omission. The 1-unit stroke on an 18-unit
canvas renders at exactly 1.00px at 18px — the width of `--hairline`, which is the
whole claim the drawing rests on. At caption size the same stroke is 14/18 = **0.78px**:
sub-pixel, so the renderer greys it, and an icon whose line is lighter than every
rule on the page is no longer drawn with the system's own line.

So an icon appears at body size or larger, or it does not appear. Below that the
label carries alone — which costs nothing, because every icon in this system is
redundant beside its own text. A drawn 14-unit master would lift the rule; scaling
this one down will not.

## The keyline review, due at eight and done at eleven

The old growth rule ended: *"At eight icons the growth rule is void. A set that size
needs a keyline review — the permitted silhouettes stated, not inferred."* The set is
eleven, so here is that review. The four keylines are now **stated and closed**: a new
icon takes one of these four extents or it is not drawn.

| Keyline | Extent | Members |
|---|---|---|
| round | 13 × 13 | `package`, `star`, `tag`, `identifier` |
| square | 11 × 11 | `external`, `repo` |
| portrait | 9 × 13 | `doi` |
| landscape | 13 × 9 | `listing`, `download`, `chart`, `terminal` |

**The square is smaller than the round one, and not by taste.** A square at the same
extent covers about a quarter more area and reads heavier; the received correction is
0.9. Here it lands at 11/13 = 0.846, because the drawing grid is stricter than the
ideal — a 1-unit stroke renders crisp at 18px only when its edges sit on
half-integers, so the legal square extents are 11 and 13 with nothing in between.
11.7 is unreachable. The grid quantises the keyline and 11 is the nearest legal value
on the correct side.

**Ink mass, re-measured across eleven.** The stroke is uniform, so total path length
*is* ink area. The three-icon set had a median of 56.24 and a spread of 1.32×. Eleven
icons sit at a median of 52.14 and a spread of 1.36×, with **every member inside
±20 %** — the widest deviations are `package` at +18.0 % and `star` at −13.0 %.
That took two passes: the first draft of the eight new glyphs came in far too light
(`chart` at −28.3 %, `download` at −33.4 %) and they were redrawn denser rather than
the band widened to fit them. The band is still ±20 % of the whole-set median, not a
per-keyline band, because a per-keyline band with one member in it is not a band.

The figures above are estimates from straight-line and arc geometry. `npm run icons`
is the authoritative measurement and re-checks every file against the keylines.

## The growth rule, as amended 2026-09-12

The rule was: *a new icon is admitted when, and only when, the thing it names has been
counted nineteen times across both surfaces.* Applied honestly on 2026-09-12 it
admitted **one** candidate of six — `listing` at 49 — and refused `download` at 26 for
duplicating `package`, `orcid` at 15, `release` at 5, `star` at 4 and `arrow` at 2.
A surface that needed a glyph per section, per platform and per unit cannot be built
from one glyph, so the count stopped being the admission test.

**What replaced it.** A glyph is admitted when it names something the surfaces
*present*, whether or not that thing repeats nineteen times. `star` appears beside
eleven projects, not nineteen, and a star with no glyph beside it is just a number.
What did **not** change, and what now carries the coherence the count used to:

- **The four keylines are closed.** Round 13×13, square 11×11, portrait 9×13,
  landscape 13×9. A candidate that fits none of them is not drawn.
- **±20 % of the set median in ink mass.** Measured, not eyeballed, and the reason the
  eight new glyphs were redrawn once.
- **18-unit grid, 1-unit stroke**, round caps and joins, no fill, axis-aligned edges on
  half-integers. No second stroke weight anywhere; a candidate needing one belongs to
  a different set.
- **No duplicate silhouettes.** `doi` is a document, so a second document-shaped glyph
  for "paper" or "preprint" is refused — this is the one clause the amendment did not
  relax, and it is why `download` had to be drawn as a tray rather than as a second
  package.
- **Semantic names, not literal ones.** `external`, not `arrow-up-right`; `identifier`,
  not `orcid`. A literal name does not survive the redraw, and a brand name is not ours
  to put in the set at all.
- **Its metaphor must not be dated.** No floppy disks, no rotary receivers.
- **Both variants, always.** The `currentColor` file and the `-mid` file.

**The new stop condition is sixteen**, and it is a real one: at sixteen the keylines
get reviewed again and the ±20 % band is recomputed. Eleven to sixteen is deliberately
narrow — the amendment bought coverage for one surface, not a licence to become a
library, and "complete component coverage the foundation does not have" is still named
as this system's main drift risk.

**Third-party platform marks are not members of this set and never become one.**
Octocat, the PyPI and npm marks and the Zenodo logo are other people's drawings; they
satisfy none of the construction rules above. `.platform` in
`components/components.css` fences them with their own origin and their own rule. The
glyphs that stand in front of platform names on surface 2 are ours — `repo`,
`package`, `identifier`, `listing` — and they name the *kind* of thing, not the brand.

## The fenced set: Simple Icons, post-processed

Added 2026-09-12. `assets/icons/platform/` holds thirteen third-party marks from
[simple-icons](https://github.com/simple-icons/simple-icons) — github, pypi, npm,
zenodo, orcid, doi, python, typescript, javascript, vuedotjs, jupyter, numpy, scipy —
in two tones each.

**Why this is not a reversal.** The earlier refusal was never about logos as such; it
was about *inventing* brand drawings, and about admitting a logo into the stroked set,
which would have ended the growth rule. Simple Icons is **CC0 1.0** — public domain, so
there is no attribution obligation on the file — and the marks stay in the fence. The
reason for the fence is now sharper rather than weaker: these are **filled
silhouettes**, and no transform converts a fill into a 1-unit stroke. A fill cannot
join a stroked family. That is a construction fact, not a preference.

**What "post-processed" actually means.** Dropping them in unprocessed looks like a
ransom note, because Simple Icons vary enormously in visual weight. Measured at the
bare keyline scale, coverage ran from Jupyter at 8.71 % of the box to JavaScript at
45.22 % — a spread of **6.58×**. So:

1. Rescaled from 24 to the **round keyline 13×13** inside an 18-unit box, so every
   mark has the same optical extent as `package.svg`.
2. **Ink coverage measured**, by rasterising each at 72px and summing alpha. Filled
   area is the right analogue of the drawn set's path length — path length is
   meaningless for a silhouette.
3. **Scale corrected** by `sqrt(median / coverage)`, since area scales as the square.
4. **Clamped to 0.82–1.18**, and three marks stay outside the ±20 % band because of
   it: Zenodo at −68 %, Jupyter at −60 %, Vue at −28 %. Their silhouettes are
   intrinsically light and the keyline is the harder constraint — blowing them past it
   to reach the median would trade a family that shares an optical size for one that
   shares a weight, and at 18px that is the worse trade. Recorded, not fixed.
5. **Flattened to one tone**: `currentColor` for inline use, `#7f7f79` for
   `background-image`, which is the mechanism that actually works here.

After correction the spread is **3.19×** and ten of thirteen sit inside the same
±20 % band the drawn set holds. Parameters and per-icon numbers are in
`assets/icons/platform/platform-icons.json`.

**Licence and trademark are different things.** CC0 covers the *file*, so nothing is
owed for using it. The *brand* is still a trademark, so the marks are unmodified
beyond the flattening, always sit beside their own name, and never imply endorsement.
`assets/icons/platform/LICENSE.md` is the upstream licence, kept with the assets.

**Where each kind is used.** A brand mark where the thing named IS the brand — a
language, a registry, an identifier. One of ours where the thing named is a *kind* —
`listing` still carries VS Marketplace, because the set has no mark for it, and
`external` still carries a link that leaves the page, because that is not a brand at
all.

**On surface 1 an icon may carry category on its own.** That is the one place where a
pictogram is not redundant: the handbook's rule says category never runs on colour
alone and names the pictogram as what takes over on GitHub. This is why the midtone has
to clear 3:1 rather than merely look right.

## How a glyph reaches surface 2, and why it is the `-mid` file

`.icon` in `components.css` expects the SVG to be **inline**, so that
`stroke="currentColor"` resolves against surrounding text. That is correct, and it is
also why no icon appeared on any surface for a day: nothing inlines eleven files.

`.gi` is the class that reaches them from a stylesheet, and it uses
`background-image` with the **`-mid` variant**. Two earlier attempts tinted the glyph
with `currentColor` through a CSS mask and both rendered as a filled 18px square.
Probed in the page: the mask URL resolved absolutely, the file returned 200 with
`image/svg+xml`, the SVG loaded as an `Image` at 18×18, `mask-mode` computed to
`match-source`, and `CSS.supports` reported both spellings. Every precondition held
and the mask still did not clip. `background-image` is already proven in the same
file by `.spot`, `.thumb` and `.banner`.

The cost is that `currentColor` is gone — and the `-mid` variant is the answer this
README already had for that case, solved to clear the 3:1 non-text floor on all ten
grounds in both bands, worst case 3.24. One file per glyph rather than a pair per
band. If a glyph ever needs full ink contrast on surface 2, the fix is a per-band pair
like the imagery layer ships, not a filter and not a second tone.
