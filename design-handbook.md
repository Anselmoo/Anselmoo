# Design Handbook

Personal brand system by Anselm W. Hahn. Sibling of *Statement Papers*, which remains
unchanged for real letters — this system inherits the **identity, not the rule set**.

It applies across four levels and two bands. Every dimension below answers both.

| Level | Container | Particularity |
|---|---|---|
| 1 · GitHub markdown | foreign (GitHub) | margin, width and wrap are not ours |
| 2 · Web, portfolio | own | full control |
| 3 · Illustration, non-project | own | no series limit (no data behind it) |
| 4 · Re-illustration of projects | own | 3–4 series, each ≥3:1 against its ground |

**Design identity surfaces:** A sequence of sheets, each carrying one thought — not a
grid that shows everything at once.
**Design identity imagery layer:** It shows measurement, not scenes — every motif is a
shape derived from a reading.

---

## Dimensions

### color-and-contrast · `analyzed`

**Rule.** Every text role is generated, not chosen: lightness is solved by bisection
against **two contrast standards at once**, at fixed hue and chroma, against the most
demanding of the three grounds. WCAG 2 — `ink` ≥10:1 (from the identity, not
solved), `--ink-secondary` 7:1, `--ink-tertiary` 4.5:1. APCA — Lc **75** secondary,
Lc **60** tertiary, the draft's own levels for body-size and secondary text. In
addition, the **ladder must stay a ladder**: neighbouring roles are at least 1.20×
apart. `--decor` is the only role without a target and is permitted exclusively for
redundant decoration.

**Why two standards.** WCAG 2 is symmetric by construction: it scores light-on-dark
and dark-on-light identically, and they do not read identically. This system's own
dark tertiary was the proof — WCAG **4.54** against its light twin's **4.52**, and
**22.3 Lc** weaker (41.5 against 63.8). APCA sees polarity; WCAG is what an audit
cites. Neither alone produces this palette: APCA alone drops the light band to 6.86
and 3.99, under AA. So both are solved for, and **which one binds differs by band** —
WCAG binds the light band, APCA the dark one. A polarity check fails the build when
the two bands' worst readings drift more than 8 Lc apart; they currently sit 0.4 and
3.8 apart, where they were 22.3.

**Evidence.** `_scripts/derive-tokens.mjs` (`TARGETS`, `APCA_FLOORS = { secondary: 75,
tertiary: 60 }`, `INK_FLOOR = 10.0`, `LADDER_STEP = 1.20`, the APCA implementation at
SAPC 0.1.9 constants, all four checks, and exit 1 with nothing written on failure).
Measured values per role, per ground, in both standards in
`tokens/tokens.json`.

**Levels.** 1 · Colour reaches the README only as a URL parameter of the badge
services; categories run there on pictogram, not on colour. 2 · Tokens directly.
3 and 4 · see *material-and-imagery* — the imagery layer is the only one with colour.
**Bands.** Both fully derived and checked. They no longer mirror each other in ratio
(light steps 1.80/1.57/2.24, dark 1.42/1.31/2.50) and that is the point: they are now
solved to the same *reading* rather than to the same number.

> The ladder check arose from a real mistake: the same target for secondary and
> tertiary produced two names for one colour (`#696863` against `#6a6861`). An
> independent counter-check then found that `ink` was measured but never checked.

### empty-and-error-states · `analyzed` *(component and specimen added)*

**Rule.** Every script-driven output surface with asynchronous work carries
placeholder text as its initial content and catches its topmost asynchronous chain, so
that an error **replaces** the placeholder with a readable message instead of leaving
an empty surface behind.

**Evidence.** `tokens/paper-check.html:15` (`<pre id="out">measuring…</pre>`) and
`:75` (`.catch(e => … "Error: " + e.message)`); `tokens/texture-lab.html` with an
identical pattern. The live case is `content/orcid.mjs`, which returns
`origin: "live" | "fallback"` with an `asOf`, and throws only when the live fetch and
the committed copy are both dead. `components/components.css` carries `.notice`,
`.notice-stamp` and `.notice--failure` — exactly those three returns and no fourth;
`guidelines/states-async.html` shows them side by side in both bands.

**Two defects the specimen found.** Writing the card meant rendering what the page
actually produces, and the page produced neither. `_scripts/build-page.mjs` destructured
`{ werke, origin, stand }` from a function that returns `{ works, origin, asOf }`, so
the fallback notice could never appear and every load ended in the catch — the one
branch nobody looks at was the only one that ran. The catch then wrapped a message that
already reads "Publications could not be loaded" in a second "Publications could not be
loaded". Both are fixed, and the wording now belongs to `content/orcid.mjs` alone.

**Levels.** 1 · Confirmed dead foreign endpoints are removed in the same commit; `alt`
carries the statement when an image fails to load. Nothing there is asynchronous — the
README is generated and committed — so the component is suspended, not violated.
2 · ORCID can fail: a visible notice plus a profile link and a committed fallback,
never a silent empty area. 3 and 4 · if a motif is missing, the surface stays empty
instead of showing a placeholder — a missing image is not an error that needs
explaining.
**Bands.** Messages use `--ink-secondary`, checked in both bands. A failure is
separated by a **line**, the 2px `--ink` rule `.project--flagship` already uses, never
by a colour — there is no red in this system.

### spacing-and-layout-grid · `analyzed` *(scope narrowed after counter-check)*

**Rule — the token scale.** `--space-1` … `--space-9` are **append-only**. An index may
never be repointed: insert 20px in the middle and `--space-5` names 24px in every
file written before today and 20px in every file written after, with nothing visible
in either. Add at the end or not at all. A numbered scale buys precision over
`xs…xl` and owes this guarantee in return; it is checked at generation time against
`SPACE_FROZEN`, not promised in prose.

**Rule — the page inset.** `--page-inset` is one value with a floor and a hardware
term inside it: `max(20px, 7vw, env(safe-area-inset-left), env(safe-area-inset-right))`.
The proportional value alone is not an inset — at a 280px viewport 7vw is 19.6px, and
on a notched phone in landscape the cutout can exceed 7vw outright. The floor token
existed before this and was applied to nothing, which is the quieter version of the
same defect: two tokens where one was needed, one of them decorative.

**Rule — logical properties.** Physical `left` and `right` appear nowhere in
`components/components.css`. The file mirrors `.icon--mirror` under `:dir(rtl)`, and a
system that flips its arrows while its accent rule, its code gutter and its numeric
column stay pinned to the left is half-translated, which is worse than untranslated.

**Rule.** In `README.md`, for every table row **that declares widths at all**: every
`<td width="N%">` is the integer rounding of a grid-compatible fraction (halves,
thirds, quarters, fifths → 33, 40, 50, 60, 67, 75, 100), and the row sum lies at ≤100
and ≥(100 − (column count − 1)). A three-column row may therefore sum to 98–100, a
two-column row must be exactly 100.

**Evidence.** `README.md:19,30,41` (three `33%`, sum 99) and `README.md:105,119`
(`60%`/`40%`, sum 100).

**Explicitly excepted:** `README.md:53-73` — a third row with three
`<td align="center">` **with no** `width` at all. This is its own, centred pattern. A
rule saying "every row" would fail against the project's own README.

**Levels.** 1 · as above; the foundation's margin device is not available there,
because GitHub owns the container. 2 · the sheet is the unit, not the page; margin
proportional instead of a fixed 88px. 3 and 4 · one motif per surface.
**Bands.** Space is band-independent.

### typography-system · `analyzed` *(upgraded from scaffolded; the scale now exists)*

**Rule.** Font family, grades, line heights and tracking are declared once as custom
properties and consumed via `var()`, never as bare literals. Neighbouring grades
differ by at least a factor of **1.125**; responsive pairs of the same grade (such as
`display` / `display-sm`) are exempt from this check. **Inter is fixed**,
`-apple-system` is dropped.

**Rule — emphasis, and the faces this system does not have.** Inter is self-hosted
and ships **roman only**, so `font-synthesis: none` is set globally: nothing fakes a
cut nobody drew. Emphasis (`em`, `i`, `cite`) is carried by **weight 500** — one
variable step, short of the 600 a subhead uses, so emphasis inside a sentence cannot
be read as a heading. Until this rule the `<em>`s on both surfaces were browser
synthesised obliques, and unstable ones: the metric fallbacks carry real italics, so
emphasis changed shape between the fallback and the webfont. Shipping the real Inter
italic cut supersedes the rule; nothing else does. Specimen:
`guidelines/type-emphasis.html`.

**Rule — slots, which are not steps.** The reference vocabulary names the editorial
slots a system needs — eyebrow, headline, deck, lede, pull quote, caption, label —
and most map onto grades already here. One did not, and its absence was being papered
over with italics: the **deck**, the summary line between a heading and the body. A
slot names an existing size for a purpose, carries no new value, and sits outside the
1.125 neighbour check by construction — deck and subhead are the same size on purpose.
Only slots with a real consumer are declared; a pull-quote token with nothing to quote
would be the dead token this system polices.

**Evidence.** `_scripts/derive-tokens.mjs` holds `SCALE` and checks `TYPE_MIN_RATIO`
at generation time, writing nothing when the check fails. The generated scale is
display 62 / headline 30 / subhead 23 / body 18 / caption 14 / eyebrow 12, with ratios
2.07, 1.30, 1.28, 1.29 and 1.17 — the smallest gap clears the 1.125 floor.
`tokens/typography.css` declares every grade as a custom property, and every grade is
a **bundle** — size, weight, tracking and leading together — so no consumer ever
re-decides a line-height.

**The measure, in the unit the rule is about.** `--measure` is 34em, which is 612px at
body size; Inter's measured advance is 9.09px a character, so the line is **67
characters**, inside the 45–75 that prose wants. `--measure-code` is 28.6em, 48
characters at mono's 10.80px. The em values are unchanged — what was wrong was the
claim about them: `tokens/spacing.css` read "about 34 characters" and "about 29",
which silently treats an em as a character.

**What was outstanding and is now closed.** The dimension was first written as a
reasoned anticipation, at a time when the repository had no typography tokens at all
and the only file with typography custom properties was the Cupertino plugin's own
report viewer. Three defects were listed then, and all three are resolved: eyebrow 12
and caption 13 collided at 1.08 — caption is now 14 and the gap is 1.17; the missing
step between headline 30 and body 18 is filled by subhead 23; `display-sm` no longer
inherits `line-height: 1.05` from the 62px value but carries 1.12 of its own.

**What it does NOT cover.** The font stack beyond the first position, and the mono
scale. Both proved to need their own treatment and live in `font-chain` and
`code-and-tabular` below. Keeping them here would have hidden the fact that the rule
"Inter is fixed" had been applied to one position and not to the rest.

**Levels.** 1 · Font choice is not ours there, GitHub sets it — carry as an
exception, not as a violation. 2 · full scale. 3 and 4 · labelling in motifs follows
the scale; level-4 motifs ship **without axis labels or tick marks**.
**Bands.** Sizes, tracking and leading are band-independent. **Weight is not**: light
ink on a dark ground reads heavier at the same weight, so the dark band carries an
optical grade of **−15 wght** — a set value, bounded to under a quarter of a weight
step and checked, so no grade can carry a role into the neighbouring named weight.
Inter has no `GRAD` axis, so the compensation rides the continuous `wght` axis; the
metric fallbacks are not variable and round back to the nominal weight, which is
correct, because the grade refines the real face rather than the layout. It is
emitted as whole per-band weight blocks and never as a `calc()` on a shared token: a
custom property resolves where it is declared, so a `calc()` on `:root` would ignore
the `[data-theme]` block every specimen card in this repository is built from.

### interaction-and-motion · `analyzed` *(upgraded from scaffolded; the tokens now exist)*

**Rule.** Motion is functional, plus at most **one** deliberate gesture per surface.
Transform and position run only under a `prefers-reduced-motion` guard; colour and
opacity transitions under 200 ms are uncritical and need none. Duration and easing
come from shared custom properties, not from literals. **Under a reduced-motion
preference the motion is replaced, not removed** — what is left is the guard-free
colour or opacity change, because feedback that vanishes leaves the reader unsure
whether the input registered. Server-rendered foreign embeds that cannot accept a
guard are listed **by name** in the exception list below.

**What is deliberately absent, and now enforced.** A duration for the guarded class,
and the exit curve that would partner it. The asymmetry principle — an element that
arrives decelerates, one that leaves accelerates — needs two curves, and a system in
which nothing arrives or leaves cannot honour it. Shipping `ease-in` now would be the
third dead motion token in a repository whose handbook names the first two as the
defect. So the pair is declared `null` and **gated**: `_scripts/derive-tokens.mjs`
reads the stylesheets at generation time, and the first `transition` touching a
transform fails the build until `MOTION.gesture` and `MOTION.easeIn` are filled in.
Animating a layout property — width, height, margin, an offset — fails it outright,
because that is a correctness defect and not a matter of taste. The rule stopped
being a sentence and became a gate.

**Evidence.** `tokens/motion.css` declares the whole set: `--motion-fast: 120ms` and
`--motion-ease: cubic-bezier(0, 0, 0.58, 1)`. Both are held in `MOTION` in
`_scripts/derive-tokens.mjs`, which fails the run and writes nothing if `--motion-fast`
ever reaches the 200 ms boundary — the same treatment the contrast targets get.
`components/components.css` consumes both in `.link` and `.button`, and
`_scripts/build-page.mjs` no longer carries its own `transition: … 150ms` for the theme
toggle. Specimen: `guidelines/motion.html`.

**Where the numbers come from.** 120 ms is not a new number. It is the
`--transition-fast` from `.cupertino/CUPERTINO_REVIEW_FLOW.html` that this dimension
itself named as a dead token — adopted unchanged, now with a consumer. Its sibling
`--transition-base: 200ms` is deliberately **not** adopted: 200 ms is the boundary the
guard rule is measured against, and a duration must not sit on its own boundary. The
easing is the CSS Easing Functions Level 1 definition of the `ease-out` keyword,
written out so it can be inspected; four hand-tuned control points would be four
numbers with no source.

**What is deliberately absent.** A duration for the guarded class. Nothing in this
system moves — the portfolio page's one gesture was removed together with the decision
it served — and a `--motion-gesture` with no consumer would be the third dead motion
token in a repository whose handbook already names the first two as the defect. It
arrives with the first surface that moves. The same reasoning holds off a second
easing curve: the asymmetry principle wants `ease-out` for arriving and `ease-in` for
leaving, and a system in which nothing arrives or leaves cannot honour it with a
token. One curve, until something exits.

> Not verifiable and therefore not carried as a finding: the motion behaviour of the
> reference pages. `developer.apple.com` is blocked in the browser and JS-rendered,
> the text fetch delivered speculation. The rule instead rests on the project's own
> evidence — all three previous page drafts **had** motion and were nonetheless
> called soulless.

**Levels.** 1 · GitHub allows no CSS; motion arises there only from foreign,
server-rendered banners — see the exception list. 2 · guards mandatory.
3 and 4 · motifs are static.
**Bands.** Band-independent — which is why `guidelines/motion.html` shows one band and
says so on the card.

### accessibility-baseline · `analyzed`

**Rule.** Appearance is **three** states, not two: light, dark, and more-contrast.
The first two are solved palettes; the third is orthogonal to them and is served by
collapsing the ladder upward inside whichever band is in force — `--ink-tertiary` and
`--decor` take the value of `--ink-secondary`, `--hairline` takes `--hairline-strong`.
Two rungs instead of three is the correct answer to a request for more contrast,
because the alternative is inventing a role stronger than `--ink`, and `--ink` is the
identity. A third solved palette would double the colour system to carry one
preference. Forced-colours mode is separate again and restates the hairlines in
system keywords.

**Rule.** No colour value for text, control, or chart mark is adopted without a
measured contrast, in **both** standards — WCAG 2 for the audit, APCA for the polarity
WCAG 2 cannot see. Measurement is programmatic, not by eye, and the value is recorded
next to the token. Thresholds: ≥4.5:1 for text, ≥3:1 for non-text elements and chart
marks (WCAG 1.4.11). **Category must never run on colour alone** — equally light
colours have a greyscale spread of 0.002 and collapse together when desaturated.

**Evidence.** `_scripts/derive-tokens.mjs:17-32` (WCAG luminance and contrast, the
real formula), `:148-170` (checks), `tokens/tokens.json` (`contrast` block, measured
values per role against all three grounds).

**Levels.** 1 · Exactly one `#`, sections at `##`; linked images with descriptive
`alt`, decorative ones with `alt=""` — **never without the attribute**, or the screen
reader reads out the URL. 2 · `:focus-visible` always visible, never the browser
default. 3 and 4 · every load-bearing motif with `alt`, every decorative one with
`alt=""`; desaturation test before delivery.
**Bands.** Both measured individually, never derived from one another.

---

## Own inventions outside the Cupertino catalogue

The design domain's catalogue knows six dimensions and **neither an imagery nor an
icon level**. `cupertino-handbook-draft` does not generate the six that follow; they
stand here by hand and are marked as own inventions, so that `cupertino-handbook-check`
checks them instead of overlooking them.

### material-and-imagery · `analyzed` *(own invention; upgraded from scaffolded, the layer now exists)*

**Rule — material.** Textures are generated, not sourced, and are
**luminance-neutral**: mean luminance deviates by at most ±1 % from the flat token,
chroma loss is at most 10 % relative. Under running text the texture must be
**isotropic** (directional energy ≤1.15× against the paper-grain reference).

**Rule — imagery layer.** No colour: every motif is black, grey and white. Series are
separated by **lightness and by pattern** — solid, 45° hatch, cross-hatch — so the
encoding survives desaturation, a photocopy and a 9px bar. Every motif is delivered
separately per band (`…-dark`), never recoloured via CSS filter. Gradients run only
between two grey grounds. Images sit beside text, never beneath it.

**Measured.** Fibre field (grain + sheet formation): deviation 0.01 %, anisotropy
1.01× → permitted under text. Linen: 1.20× → **only outside body text**. Separation
by hue alone at equal lightness: smallest ΔE 9.6, greyscale spread 0.017 →
**untenable**. Separation by lightness: ΔE 15.8, spread 0.478 → viable.

**Hard limit.** With lightness separation, contrast against paper ranges from 9.76 to
1.73; the lightest series is invisible as a line. Every series must hold 3:1 against
its ground. That limits **level 4 to three to four series**. An eight-line
Tanabe-Sugano diagram is therefore not an illustration motif — it remains a figure in
the content.

**Level 3 versus level 4.** The series limit binds **only level 4**. Level 3 is bound
solely to monochromy. After the
council resolution, level-3 families are cut down to those that likewise point to
measurement: the gradient as continuum, style objects as instrument shapes. A sunset
survives only if it reads as a spectrum and not as a scene.

**Banding.** Large gradients at low chroma in the 75° band show banding. They are
limited in area **and underlaid with the existing paper texture** — which is measured
luminance-neutral and breaks the banding without shifting the tone.

**Boundary.** What is adopted are structural properties — separate delivery per band,
restraint, one motif per surface, colour only in the image. **Not** adopted is the
visual handwriting of a foreign brand, and its numbers are not measured out.

**Rule — the hero, and the papercut construction.** The largest class in the imagery
layer, and the only place all three series meet at once. Every parameter of it is
derived rather than drawn: **three layers**, because three is the measured series
count; **fills** are series 1–3 of the band, so the lightness step between layers *is*
the solved series step (0.155 in both bands), layers 2 and 3 carry their patterns, and the depth order is band-stable;
**inset** 48px per side per layer (`--space-7`); **shadow** 12px, exactly one quarter
of the inset, checked at generation time, because a blur wider than half the ring
makes the stack read as one soft blob instead of cut paper. The silhouette is the
mark, **scaled** about its centre — scaled, not offset: a true inward offset of a
self-inverse wedge is ambiguous at the notch. The hero **splits rather than
overlays**, which is what preserves the no-alpha property.

**Rule — the layer-drop rule, which is also the thumbnail rule.** A ring narrower
than **8px** (`--space-2`, the smallest step that is not a pair of hairlines) stops
reading as cut paper, so a figure below that drops a layer and the remaining rings
widen. Measured: 630px → 3 layers at 48px, 272 → 3 at 20.7, 96 → 2 at 11.0, 64 → 1
and no ring. A thumbnail is therefore never a shrunk card image — it is the same
figure with the layer count its size can carry, which is exactly the defect the
taxonomy warns about, answered by construction.

**Rule — gradients.** A gradient may run only between two grounds the system already
owns; anything with a hue belongs to the imagery layer. The interpolation space is
declared, never defaulted: CSS says `in oklch` out loud, and SVG, which cannot, gets
the perceptual path **sampled** into nine stops — enough that no step exceeds two
8-bit quanta, which is where a ramp this shallow bands. The existing paper noise is
the banding mitigation, and it was already there.

**Refused, with reasons.** **Key art** — campaign-level, and there is no campaign.
**Scrim** — alpha, which every role here was solved to avoid. **Card image as a
per-item drawing** — this system has one mark, so a per-item variation would be
decoration pretending to be identification; the card image is the *section's* spot,
shared by every item under that heading, which is a weaker claim honestly made. Each
refusal is recorded in `imagery/figures.json` rather than left as an absence.

**Evidence.** `tokens/paper.mjs` (filter definition, `SEED_NUDGE`),
`tokens/texture-lab.html` and `tokens/paper-check.html` (measurements) for the
material. `_scripts/build-imagery.mjs` for the layer: it solves the series palette by
the same bisection the text roles use and writes `imagery/series.json` plus two
motifs per band. Specimens: `guidelines/imagery-series.html`,
`guidelines/imagery-motifs.html`.

**The series, solved.** Series 1 is the band's ink; every further series is one 0.155
step of OKLCH lightness toward the ground, at chroma 0. Light: `#232323` 12.71,
`#4b4b4b` 7.05, `#767676` 3.67 against `--paper-dim`. Dark: `#fafafa` 12.46,
`#c7c7c7` 7.70, `#979797` 4.45. Patterns: solid, 45° hatch (4px, 1.2), cross-hatch
(5px, 1).

**No chroma.** The hue series (0.079, hues 70–145°) and the warm token tint (0.0041 to
0.0158) were both retired on 2026-09-13. Every generator asserts chroma ≤ 0.004 before
it writes, and `npm run chroma` checks every token, stylesheet, figure and icon.

**Three series, not three to four.** The earlier limit was a range; measured, it is a
number. A fourth series leaves the light band 0.0845 of lightness between neighbours,
under the 0.10 the desaturation test needs. The dark band would carry four at 0.1016,
and a set that is four in one band and three in the other is not one set.
`_scripts/build-imagery.mjs` fails the run rather than shipping it.

**Level 3, the seed.** The level-3 motif is the bisection that solved
`--ink-secondary`: fourteen intervals, each halved, converging on `#4c4b46` at 7.07 —
the value in the token file. It is what a spot illustration is in this system: not a
thematic drawing beside the text, but the reading that produced the thing the text is
about. `drawn` classes ship as a system plus a seed, and this is the seed.

**The suffix is `-dark`, not `~dark`.** The tilde was borrowed from Xcode's asset
catalogues. Nothing in this system's own tooling required it, and it is awkward in a
URL and rejected outright by some file stores.

### iconography · `analyzed` *(own invention; upgraded from scaffolded, the icons now exist)*

**Rule.** Icons live **locally as SVG in the repo**, not via CDN. One stroke weight,
monochrome. Where 3:1 suffices, **one transparent midtone version** is delivered
instead of a pair of bands.

**Derived from the existing portfolio.** Anchor Sheet carries lucide and simple-icons
locally, SpectraFit its own SVGs, repo-release-tools even the shields logos as local
JSON. Only Statement Papers loads from `unpkg.com` — and that is the print system,
where runtime hosts do not hurt. For a system that dismantles foreign hosts, the
matter is settled.

**Why the midtone version.** Empirically evidenced: GitHub serves **both**
`<source media="(prefers-color-scheme: …)">` literally and selects nothing
server-side. The browser makes the choice against the **OS setting**, not against
GitHub's theme setting. Anyone who sets GitHub to dark and has their OS set to light
gets the light version on a dark page — not fixable via `<picture>`. A transparent
midtone version is immune to this mismatch.

**The set, and why it is three.** `assets/icons/external.svg`, `doi.svg`,
`package.svg`. Counted in the two surfaces on 2026-09-11: 34 outbound links on
surface 2 and 18 on surface 1; 9 static DOI lines plus 15 publication DOIs on
surface 2, and 15 on surface 1; 19 usage figures, each naming npm, PyPI or Zenodo as
its source. Nothing else recurs often enough to earn a glyph, and a general-purpose
icon library is the exact shape of this system's named drift risk — "complete
component coverage the foundation does not have".

**The midtone is solved, not chosen.** `#7f7f79`, with the same WCAG formula the
colour roles use and a different objective: not "reach a target" but "maximise the
worst case". Lightness is searched at the tint held from `IDENTITY.seed`, taking the
value with the best minimum across all six grounds. Measured 2026-09-11: light band
3.86 / 3.57 / 3.26 against paper, alt and dim; dark band 3.91 / 3.62 / 3.24. The floor
is 3:1 for non-text (WCAG 1.4.11), so the worst case clears it by 0.24.
`_scripts/derive-tokens.mjs` re-checks this on every run and fails if a ground moves.
It is deliberately **not** a CSS token: it exists only inside `assets/icons/*-mid.svg`,
the files surface 1 loads as `<img>`, where no custom property reaches.

**Drawing.** 18-unit grid, 1-unit stroke, round caps and joins, no fill. At body size
the stroke renders at exactly 1.00px — the width of `--hairline`. An icon is therefore
drawn at text size, with the line the rest of the system separates with. Axis-aligned
edges sit on half-integer coordinates. Specimen: `guidelines/icons.html`; the counts,
the measurement and the two-file rule are written out in `assets/icons/README.md`.

**Rule — the size ramp is one size.** An icon renders at **18px or larger**, the size
it is drawn at, or it does not render. The 1-unit stroke is exactly 1.00px at 18px —
the width of `--hairline`, which is the whole claim the drawing rests on. At caption
size it is 14/18 = **0.78px**: sub-pixel, greyed by the renderer, and an icon whose
line is lighter than every rule on the page is no longer drawn with the system's own
line. Below 18px the label carries alone, which costs nothing, because every icon
here is redundant beside its own text. A drawn 14-unit master would lift the rule;
scaling this one down will not.

**The keylines, and why the square is smaller.** A keyline set is what stops a family
looking almost-right at five members, and this one is derived from the set as drawn
rather than imported: round **13×13** (`package`), square **11×11** (`external`),
portrait **9×13** (`doi`), landscape 13×9 reserved. The square is deliberately
smaller, because a square at equal extent covers about a quarter more area and reads
heavier; the received correction is 0.9 and this set lands at **0.846**, because a
1-unit stroke renders crisp at 18px only with its edges on half-integers — the legal
square extents are 11 and 13, and 11.7 is unreachable. The grid quantises the
keyline. **Ink mass** is measurable here only because the stroke is uniform, which
makes total path length the ink area: 46.49u, 56.24u, 61.52u, median 56.24, and a new
icon holds within ±20 % of it. `npm run icons` re-measures canvas, stroke, caps,
fill, clearance, keyline, grid alignment, both variants and ink mass, and fails on a
drawing that has left the family. Specimen: `guidelines/icon-keylines.html`.

**Where the two contrast standards cannot both be met.** The midtone is one file for
six grounds, so they pull against each other: maximising the worst-case Lc lands at
`#989892` — Lc 41.2 but WCAG **2.35**, under the 3:1 non-text floor. It stays solved
on WCAG, because that is the floor an audit enforces and because the icon is
redundant beside its own label on both surfaces. The residual is recorded rather than
left to be discovered: worst case **Lc 28.8**.

**The growth rule, authored.** A `drawn` class owes a seed set *and* a rule for how it
grows, and this one could not be measured — it had to be written. It is in
`assets/icons/README.md`: count before drawing, with a floor of nineteen occurrences
across the two surfaces; the existing construction, never a second stroke weight; both
variants or neither; no dated metaphors; no second glyph for a shape already in the
set; semantic names; and a stop condition at eight icons, past which the set needs a
keyline review instead of another admission.

**Two files per icon, and why that is not a band pair.** `<name>.svg` carries
`stroke="currentColor"` and takes the ink role of its context on surface 2, so it needs
no band variant at all. `<name>-mid.svg` carries the solved midtone for surface 1. One
file per container, not one per band.

**Levels.** 1 · the `-mid` file as an `<img>`, with `alt=""` where it is redundant
beside its label. 2 · the `currentColor` file inline, `aria-hidden` where redundant.
3 and 4 · no icons in the imagery layer.
**Bands.** One band on the card, and the card says why: the `currentColor` version has
no colour of its own to show, and the midtone was solved against all six grounds
precisely so that it needs no second version.

### interaction-states · `analyzed` *(own invention)*

**Rule.** Five states — rest, hover, `:focus-visible`, active, disabled — carried by
**weight, size and line**, never by colour. The line is a ladder the system already
owns: `--hairline` → `--hairline-strong` → `--ink`. `:focus-visible` is always visible
and never the browser default. A disabled control drops to `--ink-tertiary`, never to
`--decor`. No state changes a size or a position, so no state reflows the line of text
a link sits in.

**Evidence.** `components/components.css` carries `.link` and `.button` with all five
states; `styles.css` sets the global `:focus-visible` at 2px `--ink` with 2px offset,
which neither class overrides. Measured: a disabled control at `--ink-tertiary` holds
5.35 light and 8.14 dark against paper, while `--decor` reaches only 2.39 and 3.26 and
fails 4.5:1 — the drop goes one rung, not two. Transitions run at `--motion-fast`
(120 ms) on colour and border-colour only. Specimen:
`guidelines/interaction-states.html`, both bands, all five states side by side.

**Why colour is not available here.** This system has no accent. Emphasis by hue would
be the only break of the monochrome rule outside the imagery layer, and it would be
made for a hover — the cheapest occasion there is. The line does the work instead, and
unlike a colour it carries on a surface where no stylesheet applies.

> `--decor` looks like the obvious disabled colour and is the wrong answer, for the
> same reason it is the wrong answer for a line number: a disabled control still says
> what will be possible later, so somebody reads it, so it is text, so it has a target.

**Why this is an own invention.** The catalogue's `interaction-and-motion` is about
movement. The state of a control is a different question, and the draft generates
nothing for it. Added by hand so that `cupertino-handbook-check` sees it at all.

**Levels.** 1 · a link is a link and GitHub owns every one of its states; there is no
button there at all, which makes `.button` the one component in this system with a
single expression, stated rather than papered over. 2 · full rule. 3 and 4 · motifs
have no states.
**Bands.** Both, and shown in both: every value is a role, so the same five
declarations serve the dark band with no second rule set.

---

### asset-classes · `analyzed` *(own invention)*

**Rule.** Every visual asset belongs to a named class, and every class carries an
**origin** that fixes what this system is allowed to promise for it:

| Origin | The promise |
|---|---|
| `derivable` | The asset itself, completely. |
| `drawn` | A system — grid, keylines, stroke, naming — plus a seed set and a rule for growth. Never complete coverage. |
| `captured` | Capture rules: frame, chrome, state, redaction. Never assets. |
| `shot` | Direction: subject, colour temperature, crop, scrim level. Never assets. |

A class that is absent is **written down as absent, with its reason**. A blank in an
inventory reads as an oversight; "absent, because no surface has a collection grid"
reads as a decision.

**Evidence.** `guidelines/asset-classes.html` carries the inventory. `derivable`
delivered whole: the Open Graph images (`assets/og/`, four files), the favicon (the
mark inlined as a data URI by `_scripts/build-page.mjs`, no second file), the paper
texture (`tokens/paper.mjs`), the level-4 chart motif, the loading placeholder
(`.notice`). `drawn` delivered as system plus seed: the mark (one), the icons
(three, counted in the surfaces), the level-3 spot illustration (one).
`captured` and `shot`: nothing, and the reasons are recorded.

**Why this dimension exists.** It is the answer to the question the icon set raised
and could not settle on its own — how many icons is enough. Under this rule the
question does not arise: a `drawn` class ships a seed and a growth rule, and a
complete icon library is a promise that cannot be kept. A prior analysis named
"complete component coverage the foundation does not have" as this system's main
drift risk, and this is the rule that names the limit instead of trusting restraint.

**Three classes almost every system is missing**, and where this one stands: **empty
state** and **error state** are covered by `empty-and-error-states` — answered with
type rather than with an illustration, because a drawn empty state is a `drawn`
class and this system has no surface that would carry four of them. **Open Graph
image** is covered here: `derivable`, so the asset itself, generated by
`_scripts/build-og.mjs`.

**Thumbnail is derived, card image is authored, and they must not be confused.** A
system that shrinks card images into thumbnails produces illegible thumbnails,
because the card image was composed for a size it is no longer shown at. Both are
absent here — there is no collection grid — and the rule is written now so the
distinction survives the surface that eventually needs it.

> `scrim` is deliberately not in the inventory. It is a treatment applied to an
> image, not an image, and it belongs to the tokens. This system has none: no image
> sits under text, by the imagery rule.

**Levels.** 1 · only `derivable` and the icon midtone reach GitHub; the avatar there
is GitHub's. 2 · full inventory. 3 and 4 · the imagery layer is itself two classes,
spot illustration and chart, and takes their origins.
**Bands.** Per class, not per dimension: an icon inherits, an OG image brings its own
paper, a motif ships twice. The three answers are different on purpose and each one
is recorded with its class.

### code-and-tabular · `analyzed` *(own invention)*

**Rule.** A code fence sits on `--paper-dim` and takes three rungs of the existing ink
ladder, assigned by importance and not by taste: the code itself `--ink`, comments
`--ink-secondary`, the gutter `--ink-tertiary`. `--decor` is forbidden there. Tables
separate with hairlines only — `--hairline` between rows, `--hairline-strong` under the
header — and never with a fill. Every numeric cell carries `--font-mono` together with
`font-variant-numeric: tabular-nums`. Mono is its own scale, exempt from the 1.125
neighbour check, and carries its own measure.

**Evidence.** Measured against `--paper-dim`, the ground a fence sits on: `--ink` 12.75
light and 12.50 dark, `--ink-secondary` 7.07 and 8.83, `--ink-tertiary` 4.52 and 6.74 —
all three clear 4.5:1 in both bands. `--decor` reaches only 2.02 and 2.70 and fails.
So **no new colour token was needed**; `tokens/tokens.json` already carried the answer.
Digit widths in Inter at 18px run 7.33 to 11.63 px, a spread of 4.30 px; with
`tabular-nums` every digit is 11.67 px and the spread is 0.00.
`components/components.css` carries `.code`, `.code-comment`, `.code-gutter`, `.table`
and `.cell-num`; `guidelines/code-fence.html` and `guidelines/table.html` show them.

**Why this is an own invention.** The Cupertino catalogue has no dimension for code or
tabular matter, just as it has none for material or icons. It was added by hand so that
`cupertino-handbook-check` sees it at all.

> The gutter is the interesting case. `--decor` exists for redundant decoration, and a
> line number looks decorative — but it is referenced in conversation ("see line 92"),
> which makes it semantic. It gets `--ink-tertiary` and its 4.52, not `--decor` and its
> 2.02. The distinction is not aesthetic; it is about whether anyone has to read the thing.

**Levels.** 1 · On GitHub the fence and the table belong to GitHub. Only the column
fractions carry, and rule R5 governs them. 2 · Full rule. 3 and 4 · No code or tables in
the imagery layer.
**Bands.** Code is two-band, because the colour assignment is the statement and has to
hold in both. Tables are structural and shown in one; the Colors cards carry the band
evidence.

### font-chain · `analyzed` *(own invention)*

**Rule.** Every position in a font stack carries measured metrics, not only the first.
Each fallback is declared as its own `@font-face` with a `size-adjust` that brings its
advance and x-height within half a percent of the primary face. `local()` names both the
family and the PostScript spelling, because which one resolves is a per-face accident.
Bare generic keywords whose resolution is not guaranteed come last or not at all. Fonts
are self-hosted and fetched at build time, never at runtime.

**Evidence.** Measured 2026-09-11 at 18px: Inter advance 245.43 and x-height 9.83;
Helvetica Neue −5.30 % and −5.29 %; Arial −5.40 % and −5.09 %. With `size-adjust`
105.6 % and 105.4 % those become −0.04 % and −0.30 %. `local("Menlo")` does not resolve
while `local("Menlo-Regular")` does; `local("Arial")` resolves while
`local("Arial-Regular")` does not. `ui-monospace` did not resolve at all and fell
through silently to the generic default at 216.98, which is 25.6 % narrower — it was
removed from the stack. Values held in `FONT_CHAIN` in `_scripts/derive-tokens.mjs`.

**Why the values are held and not solved.** They are **set values**, with the same
standing as `--decor`: no script here can derive them, because that needs a font-parsing
library and none is installed. They come from rendering text in a browser. Recording
them as held, with the date and the method, is honest; laundering them through the
solver would make the generator assert numbers it never computed.

> The rule used to apply to the first position only. The handbook said Inter is fixed
> because two metrics at tight tracking become visible — and the stack then read
> `"Inter", "Helvetica Neue", Arial`, which are 5.3 % apart from Inter. The rule was
> stated and broken two lines later, for two years of positions nobody had measured.

**Levels.** 1 · The font belongs to GitHub; the dimension is suspended there, not
violated. 2 · Full rule. 3 and 4 · Labelling in motifs follows the same stack.
**Bands.** Type is band-independent.

## Exceptions & waivers

- **Level 1, typography.** Font choice does not belong to us on GitHub.
  `typography-system` does not apply there; the rule is suspended, not violated.
- **Level 1, space.** `spacing-and-layout-grid` applies only to table rows that
  declare widths. `README.md:53-73` (three `<td align="center">` without `width`) is
  its own pattern and explicitly excepted.
- **Level 1, motion — documented motion exceptions.** Server-rendered, technically
  unable to accept `prefers-reduced-motion`. Deliberately kept:
  `capsule-render.vercel.app` (`animation=twinkling` ×4, `animation=fadeIn` ×1),
  `readme-typing-svg.herokuapp.com` (2 occurrences).
- **Exclamation mark.** Forbidden as **punctuation** in body text, heading, badge or
  caption (rule from *Statement Papers*). Allowed as a **shape in the imagery layer**
  (level 3), like any other geometric shape. The two cases are different and must not
  be conflated.
- **`--decor`.** The only colour role without a contrast target, exclusively for
  redundant decoration. In the dark band it sits at 3.26 instead of 2.39 — that is
  **a set value**, because decoration by definition has no target, no derived
  symmetry.
- **`ink`.** Comes from the shared `identity.css` and is not solved. What is checked
  is a floor (10:1), so that a drift in the shared identity is noticed.
- **Icon midtone.** `#7f7f79` is a colour value that is deliberately **not** a token.
  It lives only inside `assets/icons/*-mid.svg`, because its whole purpose is to work
  where custom properties do not reach. Making it a token would invite it onto
  surface 2, where `currentColor` is strictly better.
- **`.button`, one expression.** Every other component in `components/components.css`
  carries a markdown form for surface 1. A button has none: GitHub markdown has no
  buttons. The component is therefore surface-2 only, and that is recorded in the file
  rather than hidden by a pretend markdown equivalent.

---

## Change log

- **2026-09-11 (sixth pass)** — The imagery layer's remaining classes, built on one
  construction. **Hero**: papercut layering whose every parameter was already decided
  somewhere in the repository — three layers because three is the measured series
  count, the lightness step *is* the solved series step, the inset is `--space-7`,
  and the shadow is one quarter of the inset with a check that fails the build if it
  ever bridges two layers. **Gradient field**: `--gradient-field`, declared
  `in oklch` in CSS and sampled into nine stops in SVG, which has no way to say it.
  **Spot, banner, ornament, thumbnail**: the same construction at other sizes, sized
  by the **layer-drop rule** — a ring under 8px stops reading as cut paper, so the
  figure sheds a layer rather than shrinking into mush, which makes a thumbnail a
  real derivation instead of a scaled card image. **Three refusals recorded**: key
  art (no campaign), scrim (alpha, which every role was solved to avoid), and the
  per-item card image (one mark cannot identify twelve items without pretending).
  The reference images that prompted this were saturated purple, pink, green and
  orange; the construction is adoptable and the palette is not, because colour here
  lives only in the imagery layer and is solved rather than picked.

- **2026-09-11 (fifth pass)** — Elementary gaps the five vocabularies name and this
  system had no answer for. **Type:** Inter ships roman only, so every `<em>` on
  both surfaces was a browser-synthesised oblique — and an unstable one, because the
  metric fallbacks carry real italics and emphasis changed shape on font swap.
  `font-synthesis: none` now refuses the fake; emphasis is weight 500, one variable
  step short of a subhead's 600. The **deck** slot exists, because the audience line
  was set in italics for want of a name — a slot names an existing size for a
  purpose and is not a step. **Grid:** `--page-inset` folds in its own floor and the
  safe-area cutout (`max(20px, 7vw, env(…))`); the floor token had existed and
  applied to nothing. Physical `left`/`right` are gone from the components, which
  the RTL icon mirroring had made a half-translation. **Theme:** a third appearance,
  `prefers-contrast: more`, collapses the ink ladder upward rather than doubling the
  palette. **Icons:** the size ramp is one size — 18px, where the 1-unit stroke is
  exactly the hairline; at caption size it is 0.78px, sub-pixel, so the icon is
  omitted and the label carries alone.

- **2026-09-11 (fourth pass)** — The five reference vocabularies applied as *work*
  rather than inventory. Five findings changed code. **Colour:** WCAG 2 is symmetric
  and could not see that dark tertiary, at the same 4.5 ratio as its light twin, read
  22.3 Lc weaker; every text role is now solved against WCAG *and* APCA at once, the
  dark band lifting to `#d4d5ce` and `#babbb4`, the polarity gap closing to 0.4 and
  3.8, and a check failing the build past 8. **Type:** the dark band carries a −15
  optical grade, bounded to under a quarter of a weight step, because Inter has no
  `GRAD` axis. **Space:** the numbered scale is append-only, frozen by index and
  checked. **Motion:** the layout-animation ban and the exit-curve requirement are
  now gates that read the stylesheets, not sentences. **Icons:** keylines derived
  from the set (round 13×13, square 11×11 at 0.846 because the half-integer grid
  quantises it, portrait 9×13), ink mass measured at 46.49/56.24/61.52u with a ±20 %
  band, and `npm run icons` enforcing all of it. Recorded as unresolved: the icon
  midtone cannot satisfy both standards at once (the APCA optimum falls to WCAG 2.35),
  two foreign embeds still animate without a pause control, and the optical grade is
  reasoned rather than measured.

- **2026-09-11 (third pass)** — Audited against five reference vocabularies
  (colour, grid and spacing, icons, motion, typography); the audit and this
  system's vocabulary classified by kind are in `LEXICON.md`. Three defects found
  and fixed: the measure was stated in ems and its character count was wrong (34em
  is **67 characters** at Inter's measured 9.09px, not 34; the code measure is 48,
  not 29); the icon set claimed a growth rule it did not have, so one is now
  authored in `assets/icons/README.md`; and the reduced-motion rule said delete
  where it must say **substitute**, since feedback that vanishes leaves the reader
  unsure whether the input registered. Recorded as open rather than papered over:
  `--page-inset` collides with the CSS box `margin` and wants renaming to
  `--page-inset`; one breakpoint and no container query; no exit easing, because
  nothing exits; no `GRAD` axis to compensate the dark band's optical weight; and
  WCAG 2's polarity blindness, which under-reports the dark band by construction.

- **2026-09-11 (second pass)** — The asset taxonomy applied. `asset-classes` added
  as an own invention: every class carries an origin, and the origin fixes what may
  be promised — `derivable` whole, `drawn` as a seed plus a growth rule, `captured`
  and `shot` as rules only. It is the rule that explains why the icon set stops at
  three. `material-and-imagery` upgraded to `analyzed`: the imagery layer exists,
  with a series palette solved against both bands (worst case 3.00 light, 3.01 dark)
  and two seed motifs delivered per band. The series limit sharpened from "three to
  four" to **three**, measured: a fourth leaves the light band 0.0845 apart, under
  the 0.10 the desaturation test needs. Open Graph images added as the last of the
  three classes almost every system is missing; the canvas is the page's own sheet
  at 2×, because 1200 ÷ 612 is 1.96. The per-band suffix changed from `~dark` to
  `-dark`.

- **2026-09-11** — Four gaps closed, all of them rules that had nothing behind them.
  `interaction-and-motion` upgraded to `analyzed`: `tokens/motion.css` now holds
  `--motion-fast` and `--motion-ease`, both generated and both checked against the
  200 ms boundary; the 120 ms is the repository's own dead token, adopted and given a
  consumer, and no gesture duration was shipped because nothing moves.
  `iconography` upgraded to `analyzed`: three icons, counted in the two surfaces, with
  a midtone solved against all six grounds (`#7f7f79`, worst case 3.24).
  `interaction-states` added as an own invention — five states carried by line and
  weight, with `--ink-tertiary` for disabled and the measurement that rules out
  `--decor`. `empty-and-error-states` kept its `analyzed` mark and gained a component,
  a specimen and two repairs: `_scripts/build-page.mjs` destructured names the loader
  does not return, so the fallback notice could never appear, and the failure message
  said "Publications could not be loaded" twice. Four specimen cards added.

- **2026-09-10** — First version. Six catalogue dimensions from
  `cupertino-handbook-draft` (12 agents, proposal plus blind counter-check), two own
  inventions added by hand. Two counter-checks led to changes: `color-and-contrast`
  flagged an unchecked `ink` target (fixed by `INK_FLOOR` and a ladder check in
  `_scripts/derive-tokens.mjs`, whose effect was counter-checked); `spacing-and-layout-grid`
  flagged an over-generalised rule (scope narrowed, third table row excepted).
  `typography-system` was downgraded from `analyzed` to `scaffolded`, because the only
  evidence came from the output of the Cupertino plugin and not from design work on
  this project.
