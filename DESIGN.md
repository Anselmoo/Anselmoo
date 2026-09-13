# DESIGN.md

Reference document for the Anselm Hahn brand system. Source for every number:
`system-readme.md`, `design-handbook.md`, `tokens/tokens.json`,
`tokens/paper.mjs`. Every token, every rule and every rationale live
deliberately in the same file — separate reference and rationale documents
would be two truths about the same system.

---

## Visual Theme & Atmosphere

The system is a monochrome document system for two surfaces: the GitHub
profile (layer 1) and the portfolio page (layer 2), with two further layers
for illustration (layer 3, no series limit) and re-illustration of project
data (layer 4, three series). The base tone is a pure white-grey in the light
band (`#fafafa`) against a pure near-black in the dark band (`#232323`) — the
same two hex values only swap roles between the bands, and neither carries a tint.

Emphasis comes from size, weight and pictogram, never from colour. There is
no colour anywhere — typography, controls and imagery are black, grey and
white, and imagery separates its series by pattern. `npm run chroma` fails on
any value above OKLCH chroma 0.004. The
surface itself carries a generated, not sourced, paper structure
(`tokens/paper.mjs`) made of two frequency bands — fine grain plus
low-frequency sheet formation — instead of a photographic texture. The
result reads as paper, not as screen, without the surface looking greyer or
darker than its token value as a result: the structure is luminance-neutral
by construction, measured at 0.01 % deviation and 1.01× anisotropy.

The system is a sibling of *Statement Papers*, the letterhead system for
real letters, not its child. What is shared is one file — paper, ink,
hairlines, typefaces, 4px division — not a common rule layer, because this
system breaks four Statement Papers rules (animation, forbidden textures
behind text, no form elements, fixed 88px margins). The separation is a
checked decision, not an oversight.

---

## Color Palette & Roles

No colour role was chosen. For every text role, lightness is solved by
bisection against a contrast target — at fixed hue and chroma, against the
most demanding of the three grounds (paper, aged ground, muted ground), so
the value holds against all three.

| Role | light | dark | Target | vsPaper light | vsPaper dark |
|---|---|---|---|---|---|
| `--ink` | `#232320` | `#fbfaf7` | ≥10:1 (lower bound, carried over from the identity, not solved) | 15.1:1 | 15.1:1 |
| `--ink-secondary` | `#4c4b46` | `#d4d5ce` | 7:1 and Lc 75 | 8.38:1 · Lc 75.8 | 10.66:1 · Lc 75.4 |
| `--ink-tertiary` | `#696863` | `#babbb4` | 4.5:1 and Lc 60 | 5.35:1 · Lc 63.8 | 8.14:1 · Lc 60.0 |
| `--ink-faint` | `#85857f` | `#9fa099` | 3:1 and Lc 45 — **non-text and large text only** | 3.56:1 · Lc 50.6 | 5.97:1 · Lc 45.2 |
| `--decor` | `#a6a49c` | `#72726d` | no target — a set value, purely redundant decoration | 2.39:1 | 3.26:1 |

Grounds, **five per band** since 2026-09-12: paper (`#fbfaf7` / `#232320`), veil
(`#f7f6f1` / `#262623`), aged ground (`#f3f1ec` / `#292926`), shade (`#efece5` /
`#2d2d2a`) and muted ground (`#eae7df` / `#31312e`). Hairline colours: light
`#ddd9d0` / `#c9c5ba`, dark `#383835` / `#4d4d4a`.

Veil and shade are the OKLCH midpoints of the pairs they sit between, and they are
**interleaved rather than appended**. A ground darker than the muted one would have
become the new most demanding ground, and since every text role is solved against the
most demanding ground, all of them would have re-solved — a request for one more
sheet tone would have moved every piece of type on both surfaces. Between existing
grounds they cannot, and every role is re-measured against all five.

The five grounds are where the portfolio surface's visual separation comes from. That
is not a preference either: colour in typography stayed forbidden through the
2026-09-12 amendment, so the only channels available for separating one sheet from the
next are ground, line and elevation.

### Five ink roles, not seven

The amendment asked for three new rungs. The measurement allowed one, and the refusal
is recorded because a rule whose reason is lost gets re-broken. A rung needs 1.20×
of clearance on both sides, so it needs 1.44× of gap to sit in, and the best it can
achieve is the geometric midpoint:

| Gap | light | dark | Verdict |
|---|---|---|---|
| ink → secondary | 1.343× | 1.190× | refused |
| secondary → tertiary | 1.251× | 1.144× | refused |
| tertiary → decor | 1.496× | 1.581× | carried — became `--ink-faint` |

The dark band is the narrower one, and the cause is the second standard rather than
the palette: APCA pins dark secondary at 10.66 where 7:1 was the target and dark
tertiary at 8.14 where 4.5 was, so those two crowd the space between them. A set that
is seven rungs in one band and five in the other is not one set — the same finding
`imagery/series.json` records for the fourth motif series.

`--ink-faint`'s target is not interpolated. The geometric midpoint of tertiary and
decor is 3.015 against the muted ground and the WCAG 1.4.11 non-text floor is 3.00,
so the rung the ladder wanted is one the standard already names. It is therefore a
non-text and large-text role: rules, the progress bar, an icon stroke, a heading at
display size. Where a caption is meant, `--ink-tertiary` is still the answer.

The targets are staggered, and that is the core of the rule: an earlier
draft gave `--ink-secondary` and `--ink-tertiary` the same target, and the
result was `#696863` and `#6a6861` — two names for the same colour. Since
then the generator additionally checks that neighbouring roles are at least
1.20× apart (the ladder check); a ladder must stay a ladder, or it collapses
unnoticed. `--decor` is the only role without a contrast target, because
decoration by definition carries no target — in the dark band it sits at
3.26:1 instead of symmetrically at 2.39:1, and that is a deliberate set
value, not a derived symmetry. `--ink` is the only role that is not solved:
it comes from the shared identity, and only the lower bound of 10:1 is
checked, so that a drift of the shared identity is caught instead of going
unnoticed.

Category never runs on colour alone: equally light colours have a greyscale
spread of only 0.002 and collapse together once desaturated — on GitHub
(layer 1) the pictogram takes over this job, in diagrams (layer 4) the
lightness staggering does.

### The imagery layer's series

Three greys, solved the same way as the text roles: series 1 is the band's ink,
and every further series is one 0.155 step of OKLCH lightness toward the ground, at
chroma 0. Lightness alone merges at a 9px bar, so each series also carries a
pattern — the encoding is redundant rather than resting on one channel.

| Series | pattern | light | vs dim | dark | vs dim |
|---|---|---|---|---|---|
| 1 | solid | `#232323` | 12.71 | `#fafafa` | 12.46 |
| 2 | hatch 45°, 4px | `#4b4b4b` | 7.05 | `#c7c7c7` | 7.70 |
| 3 | cross-hatch 5px | `#767676` | 3.67 | `#979797` | 4.45 |

Series 1 is the ink in both bands, so the rank cannot change with the band.
**Three series, not four** — a fourth would need a fourth geometry, not a fourth
angle, and `_scripts/build-imagery.mjs` fails the run on any series under 3:1
against `--paper-dim`, under the 0.10 lightness gap, or above chroma 0.004.

---

## Typography Rules

Typeface: `Inter` for body text, `JetBrains Mono` for code. `-apple-system`
is deliberately left out — on Apple hardware it renders a different typeface
with different metrics, and the scale is trimmed to −0.022em tracking,
exactly where metric differences become visible.

| Grade | px | Weight | Tracking | Line height |
|---|---|---|---|---|
| display | 62 | 700 | −0.022em | 1.05 |
| headline | 30 | 600 | −0.012em | 1.2 |
| subhead | 23 | 600 | −0.008em | 1.3 |
| body | 18 | 400 | 0 | 1.65 |
| caption | 14 | 400 | 0 | 1.5 |
| eyebrow | 12 | 600 | 0.09em | 1.3 |

Responsive pair: `display-sm`, 40px, line height 1.12, derived from
`display` and exempted from the step check.

Neighbouring grades differ by at least a factor of 1.125 — which is why
`caption` is 14 rather than 13: 13 against `eyebrow` 12 gives only 1.083 and
is not a step, but a coincidence. Between `headline` and `body` sits
`subhead` 23, because a page with subsections needs the intermediate step
that a letterhead never needed. Every value is declared as a custom property
and consumed through `var()`, never as a bare literal.

On GitHub (layer 1) the typeface choice is not ours — GitHub sets it; the
scale counts there as an exception, not a violation. On layer 2 the full
scale applies. In layers 3 and 4, labelling within motifs follows the same
scale, though layer 4 motifs go without axis labels and tick marks.

---

## Component Stylings

This section stayed empty for as long as the surfaces had nothing to style, and
the rule that kept it empty still holds: a component is admitted when a surface
actually needs it, and it is derived from that surface rather than anticipated
from a catalogue. Four have since been admitted, each against that test.

| Component | Admitted because | Means |
|---|---|---|
| `.link` | both surfaces are made of outbound links, and every one of them was styled per component | line: `--hairline-strong` at rest, `--ink` on hover |
| `.button` | the portfolio page has one control, the light/dark toggle, whose five states were written inline in its generator | line ladder `--hairline` → `--hairline-strong` → `--ink` |
| `.notice` | the publication list loads at runtime and can end in three conditions, of which two used to have no styling at all | `--ink-secondary`, a 2px `--ink` rule for a failure |
| `.icon` | three glyphs recur across both surfaces often enough to be counted | 1em box, stroke rendering at the hairline width |
| `.wordmark` | the display grade existed and nothing was set in it | weight alternation, 700 against 500 — never an italic |
| `.index` | a numbered work list, and it is `.publication`'s year grid with an ordinal in front rather than a new one | hairline row, mono ordinal and figure, 64px thumbnail at rest |
| `.ordinal` | seven of the nine references number their sections, and it tells the reader how much is left | mono, tabular, `--ink-tertiary` |
| `.address` | one contact address, and a form would need field, label and validation admitted at once | display grade, 2px underline on the state ladder |
| `.tenure` | year-pairs carry a trajectory more compactly than a paragraph | mono tabular span, hairline row |
| `.locale` | place and local time, which every reference carries and which no component covered | mono, tabular — a clock is content, not motion |
| `.badge` | usage figures needed a compact form, and the old objection was to shields.io hosting our numbers, not to the shape | system-owned, mono, keeps its source |
| `.platform` | third-party platform marks needed an origin that is not the drawn icon set | a fence and a flattening rule; the marks arrive as files |
| `.gi` | eleven glyphs existed on disk and no stylesheet could reach them | 18px box, `background-image` on the `-mid` file |
| `.divider` | 72px of nothing between two sheets, and a reader with no way to tell whether the page had ended | hairline at `--ink-faint`, glyph knocked out, drawn from the centre |
| `.cover` | the page opened in the middle of its own index, and the wordmark gesture had no travel to be legible in | one full viewport, `100dvh`, three rows |
| `.usage-bar` | a bare figure is unreadable until you know the set it sits in — 229 means nothing without 2230 | 2px rule, share of the maximum **in its own unit only** |
| `.stack-figure` | the stack question, answered by counted repositories rather than a grid of third-party logos | name, track, count — no marks |
| `.specimen` | the paper is a definition, and a definition can be shown at any size for any sheet name | SVG for live, PNG at 2× for print and feeds |
| `.sparkline` | **declared, not shipped** — there is no daily series in `content/`, and ninety points drawn from a monthly total would be ninety fabricated numbers | one polyline, no axes, `--ink-faint` |
| `.rings` | the cover needed a figure, and the imagery layer already owned papercut layering | five levels, one hue at 107.5°, turned by scroll — never by a clock |

The five admitted on 2026-09-12 came from a reading of nine portfolio references,
recorded concept by concept in `guidelines/reference-reading.html` together with the
seven that were refused and the measurement behind each refusal.

What is still not here: field, dialog, navigation, tab, tooltip, card variants.
No surface has one. The admission test is the section, not the table.

States are carried by weight, size and line, never by colour — this system has no
accent, and a hover is the cheapest possible occasion to invent one. A disabled
control drops to `--ink-tertiary` (5.35 light, 8.14 dark) and never to `--decor`
(2.39 / 3.26), because a disabled control is still read. `:focus-visible` is the
global 2px `--ink` outline from `styles.css` and is never overridden.

---

## Layout Principles

Base grid: 4px division. Step sequence in `tokens/tokens.json`:
4, 8, 12, 16, 24, 32, 48, 64, 96.

Emphasis is **weight 500**. Until 2026-09-12 the sentence continued "never an
italic", because Inter self-hosted shipped roman only and `font-synthesis: none`
forbids the browser from inventing one. The 2026-09-12 amendment put italics in play
and the sentence is now conditional rather than absolute: a real cut —
`assets/fonts/inter-latin-italic-var.woff2` — is specified in `FONT_CHAIN.sans.italic`
as its own family rather than as a second style on Inter, and the weight stays at 500
either way. **It is not shipped.** The cut is not in the repository, and the
`@font-face` and `--font-sans-italic` are gated together on the file existing, because
a face with no file and a token with no face are the same dead declaration seen from
two ends. `npm run fonts` fetches it; the next `npm run tokens` emits both. Until
then emphasis is weight alone, which is what it always was.

Specifying it as its own family is what makes the eventual degradation predictable:
with synthesis off, a missing `Inter Italic` falls through to `Inter`, which has no
italic, so emphasis renders roman at weight 500 — exactly the device that preceded
it. Declared as a style on Inter it would instead fall through to the metric
fallbacks, which *do* carry real italics, and every `<em>` would change family
mid-sentence. The **deck** slot (`--text-deck-*`) is subhead size at body weight —
the summary line under a heading, which used to be set in italics for want of a
name, and which keeps the slot now that an italic exists.

Page inset (`page-inset`): `max(20px, 7vw, env(safe-area-inset-left),
env(safe-area-inset-right))` — proportional, floored, and clear of the hardware.
Components use logical properties only; physical `left`/`right` appear nowhere.

Measure (`measure`): 34em — **67 characters** at Inter's measured advance of
9.09px, inside the 45 to 75 a line of prose wants. `measure-code` is 28.6em,
48 characters at mono's 10.80px. An em is not a character, and the comment
that once said otherwise is corrected. Page margin (`pageInset`): 7vw —
proportional, not the fixed 88px mark from Statement Papers, because here the
sheet is the unit, not the page. Card radius (`radiusCard`): 28px.

Design-identity surfaces are a sequence of sheets, each carrying one
thought — not a grid that shows everything at once.

On GitHub (layer 1) margin, width and wrap are not ours — the container
belongs to someone else. For table rows that declare widths at all, a
checked rule still applies: every `<td width="N%">` is the integer rounding
of a grid-compatible fraction (33, 40, 50, 60, 67, 75, 100), and the row sum
sits at ≤100 and ≥(100 − (column count − 1)) — a three-column row may total
98–100, a two-column row must hit exactly 100. Rows with no `width`
attribute at all are explicitly exempt, a centred pattern of their own.

---

## Depth & Elevation

The system carried no shadows until 2026-09-12. It now carries two, **bounded rather
than styled**, and the three original reasons are worth keeping because two of them
are answered and one still holds.

The rule is one sentence: *the darkest point of a shadow may not darken its ground
past the darkest ground this system owns.* Solved, not chosen — compositing `--ink`
over `--paper` at alpha *a* lands at `L_paper − a × (L_paper − L_ink)`, and setting
that equal to the muted ground's lightness gives the ceiling. In the light band:
**alpha 0.078**. The two ramps peak at 0.070 and 0.075 where their layers overlap, and
`_scripts/derive-tokens.mjs` fails the build if a ramp passes the ceiling. Offsets
come from the 4px division; the colour is `--ink`'s own rgb and not black, because a
neutral shadow on warm paper cools it — the trap `tokens/paper.mjs` was built to avoid.

1. **Monochrome.** Answered. A bounded shadow is a darkening toward a ground the
   system already owns, not a light source and not a colour statement. Emphasis still
   comes from size, weight and pictogram; the shadow separates surfaces, it does not
   rank them.
2. **Luminance neutrality.** Answered by the ceiling, which is exactly the quantity
   the old objection was reaching for. A shadow that may not pass the muted ground
   cannot turn the surface greyer than a surface the system already ships.
3. **Layer 1 knows no CSS.** Still true, and it is why elevation is a **layer-2-only**
   device. Hairlines remain the separation that works on both surfaces, and nothing
   in the system depends on a shadow to be legible.

**The dark band carries no shadow at all**, and that is derived rather than preferred.
Its grounds run the other way — paper *is* the darkest of its five — so there is no
ground below paper to bound a shadow against, and anything darker is a value this
system does not have. `--shadow-sheet` resolves to `none` there and elevation rides
the ground ladder instead, which is the second job the interleaved grounds do.
`.sheet--raised` is therefore one class with two mechanisms, and the token decides
which.

---

## Do's and Don'ts

- **Never a relative `url()` inside a custom property.** It resolves against the
  **document**, not the stylesheet, because the value is substituted as a token at
  computed-value time. The figure assets carried this fault for as long as their only
  consumers were guideline cards one level down, where `../imagery/` happened to be
  right; from `templates/portfolio-index/`, two levels down, every one resolved to
  `templates/imagery/` and 404'd in silence, because a failed `background-image` logs
  nothing. The glyph layer was bitten identically the same day. Write the `url()` out
  in the rule that uses it — more lines, one fewer indirection, and the indirection
  was the whole bug.
- Every value through `var()` — never hardcode a hex, a typeface or a px
  value that a token already carries.
- Do not edit tokens by hand. Changes go through
  `_scripts/derive-tokens.mjs` and `npm run tokens`; the script is the
  specification.
- No emoji, anywhere. This is the one prohibition kept verbatim through the
  2026-09-12 amendment.
- The exclamation mark is **no longer prohibited and is still not used.** The rule
  was dropped with the other six; nothing adopted it as a device, so the practice is
  unchanged and only its status moved. As a shape in the image layer (layer 3) it was
  always allowed, like any other geometric shape.
- Never decide category by colour alone.
- **The radius follows the surface, not the token name.** `--radius-card`
  (28px) belongs on a sheet, `--radius-chip` (999px) on a pill. Applied to a
  44px field, the first makes a circle, and so does the second. When the
  card layer was first built, exactly that happened twice, independently —
  on a paper field and on a mark, which was thereby clipped and stopped
  being a mark. For small surfaces the right answer is usually no radius at
  all.
- **`--page-inset` is a page measure, not a component measure.** It sits
  at `7vw` and thereby measures the browser window, not the container it
  sits in. In a component or a specimen card, a value from the four-pixel
  division belongs (`--space-5`, `--space-6`); whoever wants to show the
  proportion takes a percentage and notes alongside it that the token
  measures against the window.
- **`box-sizing: border-box` is set globally in `styles.css` and is not set
  again.** Without it, every padding adds to the set height; on the first
  card layer, six out of ten cards therefore ran past their own frame, two
  of them by exactly the sum of their padding.
- Decorative images carry `alt=""`, not no attribute at all — otherwise the
  screen reader reads the URL aloud.
- Motion is functional plus the four gestures layer 2 admitted on 2026-09-12.
  Duration and easing come from `tokens/motion.css`: `--motion-fast` (120ms) and
  `--motion-ease` for the guard-free class, and `--motion-gesture` (360ms, exactly
  3 × `--motion-fast`) with `--motion-ease-in` for the guarded class. Never a
  literal. Colour and opacity under 200 ms. Transform and position run under a
  `prefers-reduced-motion` guard, at `--motion-gesture`; a layout property is never
  animated at all, and the generator fails the build rather than warning. The one
  stated exemption is `letter-spacing` on `.wordmark--scroll`, which relayouts a
  single line in a container nothing else shares — a named selector, not a property
  allowance. **A timeline-driven keyframe animates transform and never opacity, and
  every `animation-range` uses the `cover` phase.** A **time-based** animation is the
  exception and may touch opacity, because it runs for its duration and always reaches
  its last frame — the cover's entrance is the one instance, staggered at multiples of
  `--motion-fast`. Both rules were bought: a reveal
  that opened on `opacity: 0` with `fill-mode: both` made all seven sheets of the
  portfolio surface invisible at every scroll position, because the `entry` phase is
  ill-defined for a subject taller than the scrollport and negative progress pins an
  element to its opening keyframe. The generator now fails the build on both. **Under reduced motion the
  motion is replaced, not deleted** — the guard-free colour change stays, so
  the feedback survives. The four gestures are built on view and scroll timelines
  rather than a scroll listener, because a declarative timeline is something the
  generator's gate can read. Server-rendered third-party
  embeds unable to take a guard are named individually in the handbook's
  exceptions (`capsule-render.vercel.app`, `readme-typing-svg.herokuapp.com`).
- Icons locally as SVG in the repo, not via CDN. One stroke weight,
  monochrome, **eleven of them** since 2026-09-12. The count-based growth rule was
  **amended** rather than applied that day: counted honestly it admitted one candidate
  of six, and a surface needing a glyph per section, per platform and per unit cannot
  be built from one. What carries the coherence now is the four closed keylines (round
  13×13, square 11×11, portrait 9×13, landscape 13×9), the ±20 % ink-mass band — all
  eleven inside it, median 52.14 — and the no-duplicate-silhouette clause, which is the
  one the amendment did not relax. New stop condition: sixteen. Third-party platform
  marks are **not** members: they are fenced in `.platform`, and the glyphs standing in
  front of platform names are ours and name the kind, not the brand. On layer 2 a glyph
  reaches the page through `.gi` as a `background-image` on the `-mid` file — the mask
  that would have kept `currentColor` never clipped, measured — and on layer 1 the same
  `-mid` file at `#7f7f79`, re-measured against all ten grounds and unchanged at 3.24.
  It is deliberately not a token, because its whole purpose is to work where
  custom properties do not reach.
- **Every asset belongs to a class, and the class carries an origin.**
  `derivable` may be delivered whole; `drawn` ships as a system plus a seed
  set and a growth rule, never as complete coverage; `captured` and `shot`
  get rules and no assets. An absent class is written down as absent with
  its reason — a blank reads as an oversight.
- No colour in any image: greys only, series separated by pattern (solid,
  hatch, cross-hatch), checked by `npm run chroma`.
- Every layer-4 motif is shipped separately per band, never recoloured via
  CSS filter, and holds 3:1 against its ground — that limits layer 4 to
  three to four series.

---

## Responsive Behavior

The page margin is proportional (`pageInset: 7vw`), not fixed, because the
sheet is the unit here and not the page — unlike Statement Papers, whose
88px margin is itself the design. For typography, exactly one responsive
pair is defined: `display` (62px, line height 1.05) and `display-sm` (40px,
line height 1.12), both exempted from the 1.125 step check, because they
represent the same grade at different breakpoints rather than two different
grades.

On layer 1 (GitHub) there is no responsive behaviour in the system's own
sense, because the container belongs to someone else — margin, width and
wrap belong to GitHub there, not to this system. On layer 2 (portfolio)
full control over margin, scale and measure applies (`measure: 34em`).

---

## Agent Prompt Guide

For a model or agent working on this system:

- Cite colour roles only by their names `--ink`, `--ink-secondary`,
  `--ink-tertiary`, `--ink-faint`, `--decor` — never by hex values from memory. The
  hex values differ per band; the role name is band-stable. `--ink-faint` is
  non-text: use `--ink-tertiary` for a caption.
- Do not invent a new contrast target. `--ink-secondary` is fixed at 7:1,
  `--ink-tertiary` fixed at 4.5:1, `--ink-faint` fixed at 3:1, `--ink` checked only
  as a lower bound at 10:1. A new intermediate value requires a new bisection in
  `_scripts/derive-tokens.mjs`, not a freehand estimate — and check the headroom
  report first: two of the three rungs proposed on 2026-09-12 were refused by the
  dark band, one of them by ten thousandths.
- Do not finish building a control that this file does not list under
  Component Stylings. Twelve are listed; everything else is absent because no
  surface has asked for it, and the admission test is that a surface has.
- Do not add a colour for a state. Hover, active and disabled run on line
  and weight; disabled is `--ink-tertiary`, never `--decor`. Colour in typography and
  controls stayed forbidden through the 2026-09-12 amendment — it is the one rule the
  whole palette still rests on.
- Do not add a `box-shadow` outside the two tokens. Elevation is
  `--shadow-sheet` and `--shadow-raised`, layer 2 only, bounded at alpha 0.078 by the
  ground ladder, and the generator fails a ramp that passes the ceiling. The dark
  band has no shadow at all and carries elevation on the ground instead.
- Do not use an exclamation mark as punctuation in generated text, no
  emoji, no hardcoded hex or px outside a token.
- A generated image carries no colour either: pure greys, and a pattern
  wherever lightness alone would have to separate categories.
- Do not promise a complete set for a `drawn` class. Three icons and one
  spot illustration are a seed plus a rule, which is the whole promise.
- The Open Graph motif does not vary per project. It is a reading of the
  system; a per-project reading would need a per-project measurement, and
  monthly downloads are not comparable across npm, PyPI and a marketplace.
- When unsure about a numeric value: look it up in `tokens/tokens.json`, do
  not estimate. Every number in this file comes from there or from the
  three other source files named above.
