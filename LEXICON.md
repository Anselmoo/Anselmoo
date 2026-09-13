# Lexicon

This system's own vocabulary, and what happened when it was audited against five
reference vocabularies — colour, grid and spacing, icons, motion, typography.

Two things are recorded here that live nowhere else. First, **kind**: whether a term
names something stored, something computed, a constraint, or something merely
observed. A system that files a property as a token invites someone to edit it, and a
system that files a rule as a property never checks it. Second, the audit's
**verdicts** — what the references confirmed, what they broke, and what they left
open, including the verdicts that go against this system.

The audit was not a documentation exercise. Five of its findings changed code: the
dark band's colour roles, the weight tokens, the spacing scale's guarantee, the
motion rule, and the icon set's geometry. Those are described under *Defects found*
below, with the numbers that forced each one.

| Kind | Meaning |
|---|---|
| `token` | A stored value. Lives in `tokens.json` and a generated CSS file. |
| `derived` | Computed from tokens. Never stored twice. |
| `rule` | A constraint on use. Belongs in the handbook with its counter-case. |
| `property` | Observed or measured. Not stored, and not editable. |
| `gate` | A rule the build enforces. Fails generation rather than warning. |

---

## This system's vocabulary, by kind

### Colour

| Term | Kind | Value or constraint |
|---|---|---|
| `--paper` · `--paper-alt` · `--paper-dim` | `token` | The three grounds, per band |
| `--ink` · `--ink-secondary` · `--ink-tertiary` | `token` | The ink ladder, solved against two standards at once |
| `--decor` | `token` | A set value, no target, redundant decoration only |
| `--hairline` · `--hairline-strong` | `token` | The only separator this system has |
| Band | `rule` | light and dark, each solved separately, never derived from the other |
| Ladder | `rule` | Neighbouring roles at least 1.20× apart in contrast |
| Contrast ratio | `derived` | WCAG 2, computed, never asserted |
| Lc | `derived` | APCA, signed — the sign *is* the polarity |
| Which standard binds | `property` | WCAG in the light band, APCA in the dark one |
| Polarity gap | `gate` | The two bands' worst Lc within 8 points. Currently 0.4 and 3.8 |
| Appearance | `rule` | Three, not two: light, dark, and `prefers-contrast: more` |
| High contrast | `derived` | The ladder collapsed upward inside the band in force — no third palette |
| Forced colours | `rule` | Hairlines restated in system keywords; nothing to lose, being monochrome |
| Imagery series | `token` | Three greys one 0.155 lightness step apart at chroma 0, each with its own pattern: solid, hatch, cross-hatch |
| Greyscale spread | `property` | 0.190 light, 0.523 dark. Measured, not a target |

### Type

| Term | Kind | Value or constraint |
|---|---|---|
| Text style | `token` | `--text-{grade}-{size,weight,tracking,leading}` — a bundle, never a bare size |
| Grade (scale step) | `token` | display · headline · subhead · body · caption · eyebrow |
| Grade (optical) | `token` | −15 wght in the dark band. A set value, bounded and checked |
| Step ratio | `rule` | Neighbours at least 1.125× apart; responsive pairs exempt |
| `--measure` · `--measure-code` | `token` | 34em and 28.6em — 67 and 48 characters, measured |
| Font chain | `token` | Every position carries a measured `size-adjust` |
| Advance · x-height | `property` | Set values from a browser measurement, with the date |
| Slot | `token` | An existing size named for a purpose. `deck` is the only one with a consumer |
| Emphasis | `rule` | Weight 500. No italic is shipped, so none is synthesised |
| Synthetic face | `gate` | `font-synthesis: none` — the browser may not invent a cut |

### Space

| Term | Kind | Value or constraint |
|---|---|---|
| `--space-1` … `--space-9` | `token` | 4 8 12 16 24 32 48 64 96 — hybrid, linear then modular |
| Append-only | `gate` | An index may never be repointed. Checked against `SPACE_FROZEN` |
| Base unit | `property` | 4px. The divisor of the scale, not a separate token |
| `--page-inset` | `token` | 7vw. Named inset, not margin — `margin` is already the box property |
| `--radius-card` · `--radius-chip` | `token` | 28px and 999px; the radius follows the surface, not the name |
| Sheet | `rule` | The layout unit: a sequence of sheets, each carrying one thought |
| Container | `rule` | Components query their own inline size; the page keeps the one breakpoint |
| `--page-inset` floor | `token` | 20px, inside the same `max()` as 7vw and the safe-area cutout |
| Logical axis | `rule` | `inline-start`/`end` only; physical left and right appear nowhere |

### Motion

| Term | Kind | Value or constraint |
|---|---|---|
| `--motion-fast` | `token` | 120ms, guard-free class: colour and opacity only |
| `--motion-ease` | `token` | `cubic-bezier(0, 0, 0.58, 1)` — the spec's own `ease-out` |
| Guard boundary | `rule` | 200ms. Checked at generation time |
| Reduced motion | `rule` | Substitution, never deletion |
| Gesture · exit curve | `gate` | Declared `null`. A transform in any stylesheet fails the build until both exist |
| Layout animation | `gate` | Animating width, height, margin or an offset fails the build outright |

### Assets

| Term | Kind | Value or constraint |
|---|---|---|
| Origin | `rule` | `derivable` whole · `drawn` as seed plus growth rule · `captured` and `shot` as rules |
| Icon canvas | `token` | 18 units, stroke 1 — the hairline at body size |
| Live area | `token` | 13 units, 2.5 clear on every side |
| Keyline | `token` | round 13×13 · square 11×11 · portrait 9×13 · landscape 13×9, reserved |
| Ink mass | `derived` | Path length, because the stroke is uniform. Median 56.24u, band ±20 % |
| Icon midtone | `token` | `#7f7f79`, solved on WCAG across all six grounds |
| Growth rule | `rule` | Authored, in `assets/icons/README.md` — it cannot be measured |
| Papercut | `rule` | One silhouette, offset inward, a series step apart, a shadow between |
| Layer count | `derived` | The series count, 3 — the palette has no fourth rung to spend |
| Ring | `token` | 48px at hero scale, `--space-7`; 7.62 % of the side at any other |
| Layer-drop | `gate` | A ring under 8px sheds a layer. 630→3, 96→2, 64→1 |
| Thumbnail | `derived` | The same figure with fewer layers — never a shrunk card image |
| Gradient field | `token` | `--gradient-field`, `--paper` to `--paper-dim` |
| Interpolation space | `rule` | Declared `in oklch` in CSS; sampled to 9 stops in SVG |
| Scrim · key art | `rule` | Refused. Alpha, and no campaign — both recorded, not merely absent |
| Size ramp | `rule` | One size: 18px. Below it the stroke goes sub-pixel and the icon is omitted |
| Icon geometry | `gate` | `npm run icons` re-measures the set and fails on a drawing that leaves it |

---

## Audit

### What the references confirmed

**Text styles, not sizes.** Every grade is a bundle of size, weight, tracking and
leading. A consumer never re-decides a line-height.

**Role before value.** Colour is addressed only as `--ink-secondary`, never as a
primitive. There is no `neutral-400` tier at all — see the note on tiers below.

**Contrast computed, never asserted.** Every ratio here comes out of the generator,
which writes nothing when a check fails.

**The contrast tables carry the appearance mode.** Pair, ratio, threshold *and* mode —
which is what makes a role behaving differently in the two bands visible instead of
averaged away. It is also what made the polarity defect below findable at all.

**Tabular figures earn their place.** Measured: the setting does nothing in JetBrains
Mono and moves Inter's digits from a 15.26px spread to zero.

**No alpha anywhere.** The opacity-versus-tint trap does not exist here: every role is
a solid, separately solved value, so nothing changes meaning over a different ground.

**No shadow ramp.** Elevation runs on hairlines, for reasons already in `DESIGN.md`.

**Icon delivery.** Local SVG with `currentColor`, no icon font, no CDN.

### Defects found, and fixed

**The dark band was weaker than the light one at the same number.** WCAG 2 is
symmetric by construction: it scores light-on-dark and dark-on-light identically, and
they do not read identically. Measured on this system's own roles — dark tertiary at
WCAG **4.54**, its light twin at **4.52**, and a perceptual gap of **22.3 Lc** (41.5
against 63.8). Every text role is now solved against **both** standards at once, on
the hardest ground: WCAG 7:1 and 4.5:1, APCA Lc 75 and 60. Neither alone would give
this palette — APCA alone drops the light band to 6.86 and 3.99, under AA. The light
band did not move at all; the dark band's roles lifted to `#d4d5ce` and `#babbb4`, and
the gap closed to 0.4 and 3.8. A polarity check now fails the build past 8.

**Nothing compensated the dark band's optical weight.** Light ink on a dark ground
reads heavier at the same weight. The typographic answer is a `GRAD` axis and Inter
has none, so the compensation rides the continuous `wght` axis instead: **−15 units in
the dark band**, a set value, bounded to under a quarter of a weight step so no grade
can ever carry a role into the neighbouring named weight. Emitted as whole per-band
weight blocks rather than a `calc()` on a shared token — a custom property resolves
where it is declared, so a `calc()` on `:root` would ignore the `[data-theme]` blocks
every specimen card in this repository is built from.

**The spacing scale had no guarantee.** A numbered scale has one failure mode a
t-shirt scale does not: insert 20px in the middle and `--space-5` names 24px in every
file written before today and 20px in every file after, invisibly. The scale is now
**append-only**, frozen by index and checked at generation time.

**The measure was stated in the wrong unit.** `tokens/spacing.css` claimed 34em
"carries about 34 characters". That conflates an em with a character. Measured against
the advances this system already holds — Inter 9.09px, JetBrains Mono 10.80px at 18px
— the body measure is **67 characters** and the code measure **48**. The em values
were right; the claim about them was not.

**The icon set claimed a growth rule it did not have,** and had no keylines. Both are
now real. The keylines are derived from the set as drawn — round 13×13, square 11×11,
portrait 9×13 — and the square is deliberately smaller than the round one, because a
square at equal extent covers about a quarter more area and reads heavier. The
received correction is 0.9; this set lands at **0.846**, because a 1-unit stroke only
renders crisp at 18px with its edges on half-integers, so the legal square extents are
11 and 13 and 11.7 is unreachable. The grid quantises the keyline. Ink mass is
measurable here only because the stroke is uniform, which makes path length the ink
area: 46.49u, 56.24u, 61.52u, median 56.24, band ±20 %. `npm run icons` enforces all
of it.

**Every `<em>` was a fake.** Inter is self-hosted and ships roman only, so the
browser synthesised an oblique — the roman mechanically skewed, which is not a cut
anyone drew. It was also unstable: the metric fallbacks *do* carry real italics, so
emphasis changed shape between the fallback and the webfont. `font-synthesis: none`
now refuses it, and emphasis is carried by weight 500 — one variable step, short of
a subhead's 600. Shipping the real Inter italic supersedes the rule; nothing else
does.

**The deck had no name, so it was set in italics.** The audience line under each
heading is a *deck*, one of the editorial slots the typography vocabulary names. It
is now a slot token: an existing size named for a purpose, outside the neighbour
check by construction, declared only because it has a consumer.

**The page inset had a floor token that applied to nothing.** 7vw alone is not an
inset — 19.6px at a 280px viewport, and less than the cutout on a notched phone in
landscape. The floor, the proportional value and `env(safe-area-inset-*)` are now one
`max()`.

**The components were half-translated.** `.icon--mirror` flipped under `:dir(rtl)`
while the flagship rule, the code gutter and the numeric column stayed pinned to the
left. Physical `left`/`right` are gone.

**Reduced motion said delete where it must say substitute.** Removing a transform must
leave the feedback, or the reader cannot tell whether the input registered.

**Two motion rules were only sentences.** The stylesheets are now scanned at
generation time: animating a layout property fails the build outright, and the first
transform transition fails it until `--motion-gesture` and the exit curve are filled
in. The asymmetry principle — arriving decelerates, leaving accelerates — is therefore
encoded without shipping a second dead token for a gesture that does not exist yet.

### Open, and deliberately so

**No primitive or alias tier.** The tier structure — primitive, alias, component — is
collapsed to one: roles, generated directly. There is no `neutral-200` to alias,
because no value here was chosen before it had a role. The cost is real: a second
brand could not be swapped underneath these roles, because the roles *are* the values.
For a one-person system with two surfaces that is the right trade; for a themeable
product it would not be.

**No component tokens.** `button.background` does not exist; `.button` reads the roles
directly. With four components the indirection would cost more than it returns.

**One keyline unused, and one size on the ramp.** An icon renders at 18px or not at
all: the 1-unit stroke is exactly `--hairline` there and 0.78px at caption size,
which the renderer greys. A drawn 14-unit master would lift the rule. Nothing needs
it yet, and scaling the 18 down is not the same thing.

**No baseline grid.** Vertical rhythm comes from the spacing scale and the unitless
line-heights, not from a grid text baselines sit on. The two answer different
questions; this system has the scale.

**One keyline unused.** `landscape` 13×9 is declared and nothing draws on it. A
keyline set is a statement about permitted silhouettes, so the reserved one is part of
the statement rather than a dead token — but it is the one entry here with no consumer.

### Refused, and recorded

**Scrim.** A scrim is alpha, and every role here is solid and separately solved so
that nothing changes meaning over a different ground. Text never sits on imagery —
the hero splits rather than overlays — so the token has no consumer. The papercut
drop shadow is the single alpha value in the system, confined to the imagery layer.

**Key art.** Campaign-level, and there is no campaign. A one-person system that
ships key art ships an asset with no occasion.

**The per-item card image.** A card image is supposed to identify one item in a
collection. This system has one mark, so a per-item variation of it would be
decoration pretending to be identification, and the item is already identified by
its name and its DOI. The card image here is the *section's* spot — a weaker claim,
honestly made.

### Open, and unresolved

**The icon midtone cannot satisfy both standards.** It is one file for six grounds, so
the two pull against each other: maximising the worst-case Lc lands at `#989892` —
Lc 41.2 but WCAG **2.35**, under the 3:1 non-text floor. It stays solved on WCAG,
because that is the floor an audit enforces and because the icon is redundant beside
its own label on both surfaces. The residual is recorded: worst-case **Lc 28.8**.

**Two foreign embeds animate without a pause control.** `capsule-render` and
`readme-typing-svg` are server-rendered into surface 1 and cannot take a
`prefers-reduced-motion` guard. They are named exceptions, which is a record rather
than a fix.

**Dark-band weight compensation is a set value, not a measured one.** The −15 is
bounded and reasoned, but no script can bisect its way to a perceptual match, and
nothing here has been measured against a reader. It is the one typography value in
this system with a justification instead of a measurement.

**The banner cannot use this system's face.** An SVG loaded as an image reaches no
webfont, so `imagery/banner-*.svg` sets its two lines in the viewer's fallback
stack. The mitigation is layout, not type: the lines are short, single and
left-aligned, where a metric difference cannot break anything. It is the same Level 1
exception the handbook already carries for GitHub's typography, in a second place.

**The banner has not replaced the embed yet.** It exists precisely to retire
`capsule-render`, which animates with no pause control, and the README still carries
the embed. Shipping the asset is not the same as adopting it.

**APCA is a draft.** The constants are SAPC-APCA 0.1.9. If they move, the dark band
moves with them — which is the correct behaviour, and worth knowing before it happens.

## Words, and why each one was chosen

Folded in from the former GLOSSARY.md. The tables above give each term its kind; this
section gives the reason for the word itself. Without it, forty authors invent forty
vocabularies, and a design system with a fragmented vocabulary is a swatch collection.

### The terms that carry the system

| Term | Why this word |
|---|---|
| **paper** | The token name `--paper`. A printing term on purpose. |
| **ink** | `--ink`, not "text colour". The system thinks in printing, not in screens. |
| **ground** | Not "background". A ground is what you print *on*; a background is what sits *behind*. The system means the former. |
| **hairline** | `--hairline`. The only separator the system has — it replaces shadows entirely. |
| **sheet** | The layout unit and the material sample are one metaphor: a sheet of paper. |
| **ream** | "One ream, different sheets" — the same stock, a different fibre lay. Since the amplitude is solved per band, the light and the dark band are two reams, not one. |
| **fibre lay** | Not "grain". Grain in paper means the fibre *direction*; the lay is the particular arrangement of one sheet. The system varies the lay per project, not the direction. |
| **ladder** | The contrast steps. A ladder stays a ladder: neighbours at least 1.333× apart. |
| **step** | A rung of that ladder, and a step of the spacing scale. |
| **band · bands** | Light and dark. Not "theme" and not "mode": a band is a range the system was solved against, and both were measured separately. The amplitude is **solved per band** to one constant perceptual step, and the dark band's grain runs an octave coarser — char rather than fibre. What stays constant across the bands is the **effect**, not the recipe. See `tokens/tokens.json` → `paper`. |
| **decoration** | `--decor`, the one role without a contrast target. |
| **set value** | The counterpart to *solved*. `--decor` in the dark band is set, not derived — and the handbook says so, because a value that looks derived but is not is the kind of thing that quietly rots. |

### Content model

**summary** (the one-line description) · **usage figure** · **listing** · **flagship** ·
**contribution** · **work** · **fallback** · **asOf** · **source** · **unit** ·
**ordering · orderRationale** · **selectionRule** · **jurisdiction**

*"Usage figure"* rather than *"metric"*: a metric is a number, a figure is a number
someone stated — and the system's rule is that a number without a source is an assertion.
The word should carry that.

*"Flagship"* rather than *"lighthouse"*: flagship is the English idiom for a showcase
project.

### Making and measuring

evidence · **specimen card** · **instrument** · **workbench** · **generator** ·
**amplitude** · **greying** · **deviation** · **caveat** · **waiver** (as in the
handbook's `Exceptions & waivers`)

### Mark candidates

**stairs** · **bend** (chosen) · **wave**

### The rule going forward

Content, code, comments, file names and documentation are English. `npm run content` fails
on German text in any tracked text file.
