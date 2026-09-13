// The component renderers, in BOTH expressions, side by side.
//
// components/components.css states the rule this file exists to keep:
// "TWO EXPRESSIONS PER COMPONENT ... Both must make the same statement."
// Until now the HTML expression lived in build-page.mjs and the markdown
// expression lived in build-readme.mjs, several hundred lines apart in two
// files. Nothing made a drift between them visible, and a drift is exactly
// what happened: a German -> English rename moved components.css and left
// eleven class names in the generator behind, unstyled, for as long as
// nobody looked.
//
// So each component here is one object with an `html` and an `md` method.
// They sit on adjacent lines. A change to one that is not made to the other
// is visible in the diff, which is the cheapest possible enforcement.
//
// THIS MODULE IS IMPORTED BY BOTH NODE AND THE BROWSER. It therefore imports
// nothing at all — no node:fs, no node:path. That is what lets the runtime
// publication refresh render an entry through exactly the same function the
// build used, instead of through a second copy that would drift from it.
// It lives in lib/ rather than _scripts/ for the same reason: _scripts/ is a
// build directory and is not shipped.
//
// CLASS NAMES ARE THE CONTRACT AND components.css OWNS THEM. If a class here
// is not defined in a stylesheet, _scripts/check-classes.mjs fails the build.

// ---------------------------------------------------------------- Escaping
//
// Content comes from JSON, but JSON is still foreign text on its way into
// HTML — an & or < from a title (say, an ampersand in a journal name) would
// otherwise be read as markup.
export const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// Markdown has its own foreign characters. A title containing [ or * would
// otherwise become a link or an emphasis on surface 1.
//
// NARROW ON PURPOSE. The first version escaped the whole CommonMark punctuation
// set, which turned ordinary prose into "X\\-ray absorption\\." — rendering
// correctly but leaving a source nobody would want to read or hand-edit, on the
// one file people DO read as source. Only characters that are syntax in
// mid-sentence position are escaped; . - # + ! ( ) are syntax at the start of a
// line, and nothing here is emitted at the start of a line.
//
// < and > become entities rather than backslash escapes: GitHub reads a raw <
// as the start of HTML, and a backslash does not stop it.
export const escMd = (s) =>
  String(s ?? "")
    .replace(/&(?![a-zA-Z#][a-zA-Z0-9]*;)/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/([\\`*_\[\]|])/g, "\\$1");

// ORCID hands back whatever URL the depositor registered, which for older
// records is http://dx.doi.org/... — an insecure scheme on a legacy host that
// only redirects. Normalising here means both surfaces link the same resolver.
export const normalizeDoiUrl = (url, doi) => {
  if (!url) return doi ? doiUrl(doi) : null;
  const m = String(url).match(/^https?:\/\/(?:dx\.)?doi\.org\/(.+)$/i);
  return m ? `https://doi.org/${m[1]}` : String(url).replace(/^http:\/\//i, "https://");
};

export const githubUrl = (repo) => `https://github.com/${repo}`;
export const doiUrl = (doi) => `https://doi.org/${doi}`;

// -------------------------------------------------------- Registry addresses
//
// THE PAGE NAMED "pypistats.org" BESIDE "229 PyPI downloads per month" AND NEVER
// LINKED PyPI. Those are two different places and the page was conflating them:
// pypistats.org is where the number was MEASURED, pypi.org is where the thing the
// number counts actually LIVES. content/projects.json has carried a `package`
// field — kind and name — since the figures were first fetched, and nothing on
// either surface ever resolved it into an address.
//
// THE ADDRESS IS DERIVED, NOT TYPED. Each of the three registries has exactly one
// canonical shape for a package page, so a name plus a kind is an address. The
// marketplace fallback `AnselmHahn.<name>` is not invented here either: it is the
// same expression _scripts/fetch-usage.mjs uses to ASK the marketplace for the
// install count, so the link points at the identifier the number was measured
// against, and vsplot's listing note confirms it ("AnselmHahn.vsplot is
// authoritative"). A package kind with no shape returns null and gets no link —
// a guessed URL would be a claim without a source, in link form.
const REGISTRY = {
  pypi: {
    url: (name) => `https://pypi.org/project/${name}/`,
    word: "PyPI",
  },
  npm: {
    url: (name) => `https://www.npmjs.com/package/${name}`,
    word: "npm",
  },
  "vscode-marketplace": {
    url: (name, id) => `https://marketplace.visualstudio.com/items?itemName=${id || `AnselmHahn.${name}`}`,
    word: "Marketplace",
  },
};

/**
 * The outbound link a usage figure earns from its own package field.
 *
 * THE WORD IS THE LINK. A registry figure and a marketplace figure are different
 * units that content/model.md forbids weighing against one another, so the link
 * names its destination in one word: "PyPI", "npm", "Marketplace".
 */
export const packageLink = (pkg) => {
  const r = pkg && REGISTRY[pkg.kind];
  return r ? { href: r.url(pkg.name, pkg.marketplaceId), word: r.word } : null;
};

// ------------------------------------------------------------------ No icons
//
// There are none, by decision (2026-09-13). Every link names its destination in
// words — a repository by its name, a DOI by its digits, a package by its
// registry — so a glyph beside it would say the same thing twice, and a family
// of glyphs invites the next one for a licence or a language. See `icon` in
// LEXICON.md.

// ------------------------------------------------------------ Usage figure
//
// Arises directly from the model rule: a number without a source is a claim.
// ALWAYS carries value, unit, source and as-of date — never just the number.
//
// THIS IS THE UNTIERED FORM, and it is still the right one where an entry has
// one line to give: a contribution and an archive record each carry a single
// piece of evidence, so splitting them into three tiers would be a hierarchy
// over one thing. The Programs chapter, where an entry carries five different
// kinds of thing at once, uses `quantity` and `provenance` below instead.
export const usage = {
  html(n) {
    if (!n) return "";
    return `<div class="usage">
        <span class="usage-value">${esc(n.value)}</span>
        <span class="usage-unit">${esc(n.unit)}</span>
        <span class="usage-source">${esc(n.source)}, as of ${esc(n.asOf)}</span>
      </div>`;
  },
  md(n) {
    if (!n) return "";
    return `\`${n.value}\` ${n.unit} · ${n.source}, as of ${n.asOf}`;
  },
};

// A usage figure assembled from parts rather than read from a `usage` object.
// Contributions and archive entries carry their evidence in other fields, but
// the component is the same one, so it is built through the same function
// rather than hand-written twice.
export const usageOf = (value, unit, source) => ({
  html: () =>
    `<div class="usage">
        <span class="usage-value">${esc(value)}</span>
        <span class="usage-unit">${esc(unit)}</span>
        <span class="usage-source">${esc(source)}</span>
      </div>`,
  md: () => `\`${value}\` ${unit} · ${source}`,
});

// ---------------------------------------------------------- Unit cohorts
//
// content/model.md: "npm downloads, PyPI downloads and marketplace installs
// measure different things and must not be weighed against one another." A bar
// is exactly such a weighing made visual, so the prohibition has to survive
// contact with a renderer — and a comment saying "remember to pass the right
// cohort" is not survival, it is a note next to a loaded gun.
//
// SO THERE IS NO WAY TO PASS A COHORT. `unitCohorts()` is given every figure on
// the surface and returns a LOOKUP, and that lookup takes the figure itself and
// reads the unit off it. The caller never names a unit, never holds a maximum,
// and has no parameter through which the wrong one could arrive. A unit the
// index has never seen throws rather than falling back to something plausible —
// a silently wrong bar is the only outcome that must not be possible.
//
// A COHORT OF ONE GETS NO BAR. The bar exists to separate a figure from its
// peers; with no peers there is nothing to separate, and a lone member would
// draw a full track and read as "the most" when it means "the only". That is
// why mcp-ai-agent-guidelines, alone in npm downloads, carries its number and
// no bar — the prohibition on cross-unit comparison is not merely obeyed here,
// it is visible.
export function unitCohorts(figures) {
  const byUnit = new Map();
  for (const n of figures) {
    if (!n || n.value == null || !n.unit) continue;
    if (!byUnit.has(n.unit)) byUnit.set(n.unit, []);
    byUnit.get(n.unit).push(Number(n.value));
  }
  const index = new Map();
  for (const [unit, values] of byUnit) {
    index.set(unit, { unit, values, max: Math.max(...values), distinct: new Set(values).size });
  }
  return function cohortOf(n) {
    if (!n || n.value == null || !n.unit) return null;
    const c = index.get(n.unit);
    if (!c) {
      throw new Error(
        `cohort: the unit "${n.unit}" is not in the set the cohorts were built from. ` +
        `Build the index from every figure on the surface, or the bar is scaled against the wrong peers.`
      );
    }
    if (c.distinct < 2) return null;
    const v = Number(n.value);
    return { unit: c.unit, max: c.max, size: c.values.length,
             // Rank is a fact about a list, not a fifth measurement: it is read
             // off figures that each carry their own source, one line below.
             rank: 1 + c.values.filter((x) => x > v).length,
             fraction: v / c.max };
  };
}

// -------------------------------------------------------- The quantity marks
//
// TWO DRAWINGS, ONE FAMILY, AND BOTH ARE INK. DESIGN.md admits colour only
// inside .figure; a quantity mark sits in running text, so it is paper and ink
// like everything else around it. They share one geometry — --quantity-track by
// --quantity-height, both SOLVED in _scripts/derive-tokens.mjs against a target
// and recorded under "quantity" in tokens/tokens.json — and one hairline, drawn
// in CSS as the element's own bottom border. For the bar that hairline is the
// full track it is a fraction of; for the sparkline it is the zero line. One
// separator, two correct meanings, and no filled field anywhere: this system
// separates with hairlines and nothing else.
//
// THE VIEWBOX IS DRAWING SPACE, NOT PIXELS. lib/render.mjs imports nothing, so
// it cannot read the solved token — and it does not need to: the SVG is drawn
// in a 1000x100 box and CSS sizes it from the token. preserveAspectRatio="none"
// is deliberate here and is NOT the trap the masthead ground fell into: a chart
// is *supposed* to be fitted per axis, days across and downloads up, and
// vector-effect="non-scaling-stroke" keeps the line one pixel wide while it
// happens. What must not be stretched anisotropically is a texture, not a plot.
//
// BOTH MARKS ARE aria-hidden. They carry nothing the text does not already say:
// the number stands beside the bar, the rank stands in the markdown expression,
// and the series' window and source stand in the provenance row underneath. A
// mark that duplicates its own caption should not be read out twice.
const VB = { w: 1000, h: 100 };
const nn = (v) => Number(v.toFixed(2));

const cohortBar = (cohort) => {
  if (!cohort) return "";
  return `<svg class="quantity-mark quantity-bar" viewBox="0 0 ${VB.w} ${VB.h}" preserveAspectRatio="none" aria-hidden="true" focusable="false">` +
    `<rect x="0" y="0" width="${nn(cohort.fraction * VB.w)}" height="${VB.h}" style="fill: var(--ink)"></rect></svg>`;
};

// The sparkline is SELF-SCALED, against its own maximum and nothing else. That
// is what a sparkline is for — it shows a shape, never a level — and it is also
// the only scaling that is allowed to exist beside the cohort bar without
// contradicting it. Its ink is --ink-secondary, one rung below the bar: the bar
// answers the tier-2 question (how large, against its peers), the shape is
// context for it.
const sparkline = (series) => {
  if (!series?.points?.length) return "";
  const pts = series.points.map(Number);
  const max = Math.max(...pts, 1);
  const step = pts.length > 1 ? VB.w / (pts.length - 1) : 0;
  const d = pts.map((v, i) => `${i ? "L" : "M"}${nn(i * step)} ${nn(VB.h - (v / max) * VB.h)}`).join(" ");
  return `<svg class="quantity-mark quantity-series" viewBox="0 0 ${VB.w} ${VB.h}" preserveAspectRatio="none" aria-hidden="true" focusable="false">` +
    `<path d="${d}" fill="none" stroke-width="1" stroke-linejoin="round" vector-effect="non-scaling-stroke" style="stroke: var(--ink-secondary)"></path></svg>`;
};

// ---------------------------------------------------------------- TIER 2
//
// The quantity, with weight. One row: the number, its mark, its unit — and
// nothing else, because everything else demotes to tier 3.
//
// WHAT LEVEL 1 SHOWS INSTEAD OF THE BAR. A bar has no markdown form, and the
// README already carries the number and its source, so the honest question is
// what the bar's CONTENT is rather than how to fake its shape. A cohort bar is
// read for one thing: where this figure sits among the figures in the same
// unit. That is its RANK, and a rank survives without geometry. So level 1 says
// "2nd of 8 in this unit" where level 2 draws a bar — the same statement, not a
// consolation prize, and it disappears in exactly the same cases the bar does.
//
// The sparkline's markdown form is a row of its own, not a squiggle: its
// quantity line states the window and its unit, and the "Series" provenance row
// underneath states where the ninety measurements came from. An entry with no
// series has neither line, which is how the have/have-not split stays visible
// on a surface with no CSS.
// THE OUTBOUND LINK STANDS AT THE END OF THE ROW. The value column is a fixed
// --quantity-value-col so that two rows line up, and a link in front of it on
// the rows that HAVE a package — and not on the series or Zenodo rows, which
// have none — would stagger the one column that exists to be straight.
const outbound = {
  html: (link) => link ? `<a class="quantity-link" href="${esc(link.href)}">${esc(link.word)}</a>` : "",
  md: (link) => link ? ` · [${link.word}](${link.href})` : "",
};

export const quantity = {
  html(n, cohort, series, link) {
    if (!n) return "";
    return `<div class="quantity">
        <span class="quantity-value">${esc(n.value)}</span>
        ${cohortBar(cohort)}${sparkline(series)}
        <span class="quantity-unit">${esc(n.unit)}</span>
        ${outbound.html(link)}
      </div>`;
  },
  md(n, cohort, link) {
    if (!n) return "";
    const rank = cohort ? ` · ${ordinal(cohort.rank)} of ${cohort.size} in this unit` : "";
    return `\`${n.value}\` ${escMd(n.unit)}${rank}${outbound.md(link)}`;
  },
};

const ordinal = (n) => {
  const t = n % 100;
  const suffix = t >= 11 && t <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th";
  return `${n}${suffix}`;
};

// The series, expressed as a quantity of its own rather than as an ornament on
// the monthly figure. It is a DIFFERENT measurement — downloads per day, not
// per month — and giving it its own row keeps one unit to a row, which is the
// same discipline the cohort bar enforces one level down.
export const seriesQuantity = {
  html(series) {
    if (!series?.points?.length) return "";
    // The window length is NOT set as a quantity-value. 90 is how long we looked,
    // not a thing that got bigger — giving it the same weight as "5862 npm
    // downloads per month" put a number the reader does not care about at the
    // same rung as the one they do.
    return `<div class="quantity quantity--series">
        ${sparkline(series)}
        <span class="quantity-unit">${esc(series.days)} days, ${esc(series.unit)}, to ${esc(series.to)}</span>
      </div>`;
  },
  md(series) {
    if (!series?.points?.length) return "";
    return `\`${series.days}\` days, ${escMd(series.unit)}, to ${series.to}`;
  },
};

// ---------------------------------------------------------------- TIER 3
//
// Provenance and listings. NOTHING IS REMOVED — the rule that a number carries
// its source is not a rule about prominence, it is a rule about presence. What
// changes is only the reading order: one ink rung (tertiary), caption size, and
// a label column of its own, so the block scans as one object the eye may skip
// and return to.
//
// NOT BEHIND A HOVER AND NOT INSIDE A <details>. A source that needs an
// interaction is weaker evidence than a source that is simply there, and both
// mechanisms evaporate on surface 1, where there is no CSS to hide anything and
// nothing to hover with.
//
// A ROW IS ONE CALL, TWO EXPRESSIONS. `row()` returns the label with both
// spellings of its value from a single site, which is the same discipline the
// html()/md() pairs keep — a value that is right in HTML and wrong in markdown
// cannot be written here without writing it twice on adjacent lines.
const row = (label, html, md) => ({ label, labelHtml: esc(label), labelMd: label, html, md });

// The label is a parameter because an entry can carry TWO quantities — a package
// figure and a Zenodo figure — and two rows both reading "Source" leave the
// reader to work out which one belongs to which number by counting. The rows are
// in the same order as the quantities above them, but an order is not a label.
// A SOURCE NAMES THE SERVICE, NOT THE ENDPOINT.
//
// content/projects.json stores the exact query the fetch used —
// "pypistats.org/api/packages/spectrafit/overall?mirrors=false" — and it should:
// that file is the record, and a record that cannot be re-run is not a record.
// But rendering it inline put 137 characters of query string into a reader's eye
// thirteen times, and the longest three text nodes on the whole page became the
// same URL with a different package name in it.
//
// The rule is that a number carries its source. "pypistats.org" IS the source;
// "?mirrors=false" is how we asked it. Keeping the second on the page was
// provenance at the wrong granularity, and it cost exactly the density the tier
// work was meant to buy.
const service = (url) => String(url || "").replace(/^https?:\/\//, "").split("/")[0];

export const sourceRow = (n, label = "Source") =>
  n ? row(label, `${esc(n.source)}, as of ${esc(n.asOf)}`, `${n.source}, as of ${n.asOf}`) : null;

// The window is NOT repeated here. The quantity row directly above already reads
// "90 days, PyPI downloads per day, to 2026-09-11" — restating it as "90 daily
// measurements, 2026-06-14 to 2026-09-11" said the same thing twice in two
// formats, which is worse than saying it once, and made the reader check whether
// the two agreed.
export const seriesRow = (s) =>
  s?.points?.length
    ? row("Series", `${esc(service(s.source))}, as of ${esc(s.asOf)}`,
                    `${service(s.source)}, as of ${s.asOf}`)
    : null;

// "Concept DOI": concept-versus-version is the half a reader cannot infer.
export const doiRow = (doi) =>
  doi ? row("Concept DOI",
    `<a class="publication-doi" href="${doiUrl(doi)}">${esc(doi)}</a>`,
    `[${doi}](${doiUrl(doi)})`) : null;

// A record of this software in someone else's index.
export const listingRows = (entries) =>
  (entries || []).map((g) => {
    const tail = (n) => [n.classification, n.note, `as of ${n.asOf}`].filter(Boolean).join(" · ");
    return row("Listed",
      `<a href="${esc(g.url)}">${esc(g.where)}</a> — ${esc(tail(g))}`,
      `[${g.where}](${g.url}) — ${tail(g)}`);
  });

export const provenance = {
  html(rows) {
    const r = rows.filter(Boolean);
    if (!r.length) return "";
    return `<dl class="provenance">
        ${r.map((x) => `<dt>${x.labelHtml}</dt><dd>${x.html}</dd>`).join("\n        ")}
      </dl>`;
  },
  md(rows) {
    const r = rows.filter(Boolean);
    return r.length ? r.map((x) => `${x.labelMd}: ${x.md}`).join("<br>") : "";
  },
};

// ------------------------------------------------------------------ DOI line
// Mono via the existing .publication-doi rule, no new component. Built on
// doiRow above so the link is spelled once, not twice — and it takes doiRow's
// label with it, so the same word the provenance column dropped is dropped
// here. Both call sites used to pass "DOI (concept):" and now pass "Concept:".
const doiLineRow = (label, doi) => {
  const base = doiRow(doi);
  return base && row(base.label, base.html, base.md, "doi", label);
};

export const doiLine = {
  html(label, doi) {
    const r = doiLineRow(label, doi);
    return r ? `<div class="listing">${r.labelHtml} ${r.html}</div>` : "";
  },
  md(label, doi) {
    const r = doiLineRow(label, doi);
    return r ? `${r.labelMd} ${r.md}` : "";
  },
};

// ------------------------------------------------------------------ Listing
// A visibility record, not a measurement — so it never carries a number.
// Built on listingRows above, for the same reason as doiLine, and so it drops
// the same repeated words: "Listed on" was two of them.
export const listings = {
  html(entries) {
    const r = listingRows(entries);
    return r.length ? r.map((x) => `<div class="listing">${x.labelHtml} ${x.html}</div>`).join("\n      ") : "";
  },
  md(entries) {
    const r = listingRows(entries);
    return r.length ? r.map((x) => `${x.labelMd} ${x.md}`).join("<br>") : "";
  },
};

// ------------------------------------------------------------ Project entry
//
// THREE TIERS, AND THE THREE-SECOND READ IS TIER 1 ALONE: what it does, and
// that it is used. Before this, one entry was sixty words carrying identity,
// description, quantity, provenance and sometimes a caveat at nearly one
// visual weight, and a reader had to parse all five to learn either.
//
//   tier 1  name and purpose        the read
//   tier 2  the quantity            with weight, and its mark
//   tier 3  provenance and listings  one ink rung, caption size, own column
//
// Flagship is an editorial emphasis via weight and a rule, never via colour.
//
// THE COHORT LOOKUP IS A PARAMETER because it has to be built from every figure
// on the surface — a per-category index would scale a PyPI figure against three
// peers instead of eight and quietly draw the wrong bar. Both generators build
// it once, from the whole model, and hand the same function to every entry.
// FOUR CLASSES OF DESTINATION, EACH NAMED IN WORDS: the repository by its name
// (tier 1), the registry by its word (tier 2), the DOI by its digits and an
// index record by its place (tier 3).
//
// `p.zenodo` deliberately gets no outbound link: its address is its concept DOI,
// which stands one tier below. A second link to the same record would be noise.
export const project = {
  html(p, cohortOf) {
    const flagship = p.flagship ? " project--flagship" : "";
    return `<div class="project${flagship}">
      <div class="project-head">
        <span class="project-name"><a href="${githubUrl(p.repo)}">${esc(p.name)}</a></span>
        <span class="listing">${esc(p.language)}</span>
      </div>
      <p class="project-summary">${esc(p.summary)}</p>
      ${quantity.html(p.usage, cohortOf(p.usage), null, packageLink(p.package))}
      ${quantity.html(p.zenodo, cohortOf(p.zenodo))}
      ${seriesQuantity.html(p.series)}
      ${provenance.html([sourceRow(p.usage), sourceRow(p.zenodo, "Source, Zenodo"), seriesRow(p.series), doiRow(p.doiConcept), ...listingRows(p.listings)])}
    </div>`;
  },
  md(p, cohortOf) {
    const tier1 = `**[${escMd(p.name)}](${githubUrl(p.repo)})** — ${escMd(p.summary)}`;
    const tier2 = [quantity.md(p.usage, cohortOf(p.usage), packageLink(p.package)), quantity.md(p.zenodo, cohortOf(p.zenodo)), seriesQuantity.md(p.series)]
      .filter(Boolean).join("<br>");
    const tier3 = provenance.md([sourceRow(p.usage), sourceRow(p.zenodo, "Source, Zenodo"), seriesRow(p.series), doiRow(p.doiConcept), ...listingRows(p.listings)]);
    return [tier1, tier2, tier3].filter(Boolean).join("  \n");
  },
};

// ------------------------------------------------------------ Contribution
// Contribution to someone else's software: a different kind of evidence than
// an own repository.
export const contribution = {
  html(b) {
    const u = usageOf(b.role, `${b.authors} authors${b.version ? " · " + b.version : ""}`, b.year);
    return `<div class="project">
      <div class="project-head">
        <span class="project-name"><a href="${githubUrl(b.project)}">${esc(b.project)}</a></span>
      </div>
      <p class="project-summary">${esc(b.what)}</p>
      ${u.html()}
      ${doiLine.html("Concept:", b.doiConcept)}
      ${b.whyItCounts ? `<p class="listing">${esc(b.whyItCounts)}</p>` : ""}
    </div>`;
  },
  md(b) {
    const u = usageOf(b.role, `${b.authors} authors${b.version ? " · " + b.version : ""}`, b.year);
    const evidence = [u.md(), doiLine.md("Concept:", b.doiConcept), b.whyItCounts].filter(Boolean);
    return [`**[${escMd(b.project)}](${githubUrl(b.project)})** — ${escMd(b.what)}`, evidence.join("<br>")]
      .filter(Boolean).join("  \n");
  },
};

// -------------------------------------------------------- Archive entry
// Own software with a DOI that is not a curated project.
export const archiveEntry = {
  html(e, asOf) {
    const u = e.zenodo
      ? usageOf(e.zenodo.downloads, "total Zenodo downloads", `${e.zenodo.views} views, zenodo.org, as of ${asOf}`)
      : null;
    return `<div class="project">
      <div class="project-head">
        <span class="project-name"><a href="${githubUrl(e.repo)}">${esc(e.title)}</a></span>
        <span class="listing">${esc(e.year)}</span>
      </div>
      ${u ? u.html() : ""}
      ${doiLine.html("Concept:", e.doiConcept)}
    </div>`;
  },
  md(e, asOf) {
    const u = e.zenodo
      ? usageOf(e.zenodo.downloads, "total Zenodo downloads", `${e.zenodo.views} views, zenodo.org, as of ${asOf}`)
      : null;
    const evidence = [u ? u.md() : "", doiLine.md("Concept:", e.doiConcept)].filter(Boolean);
    return [`**[${escMd(e.title)}](${githubUrl(e.repo)})** — ${e.year}`, evidence.join("<br>")]
      .filter(Boolean).join("  \n");
  },
};

// -------------------------------------------------------- Publication entry
// -------------------------------------------------------- Publication entry
//
// THE SAME THREE TIERS AS A PROJECT, WITH ONE DEVIATION STATED.
//
// The entry used to read "2024 · Introducing SpectraFit… · ACS Omega ·
// 10.1021/acsomega.3c09262" — the title, the venue and the identifier at one
// weight, joined by middots, with the DOI carrying no mark at all while every
// project link beside it had one. Fifteen of those is the same wall the project
// list was, in a chapter that was never pulled out of it.
//
//   tier 1   .publication-title    the title, ink
//   tier 2   .publication-source   the VENUE — what a reader judges the work by
//   tier 3   .provenance           the DOI, and what it is a preprint of
//
// THE DEVIATION: there is no quantity. A paper has no downloads-per-month, and
// inventing a citation count to fill tier 2 would be a number from a source this
// model does not carry. So the venue takes tier 2, because it is the thing a
// reader actually weighs, and the tier stays a tier rather than being left empty
// or padded.
//
// The year keeps its own column. It is an index, not a tier — it is how a reader
// scans a chronological list, and it is deliberately NOT set at tier-1 weight.
export const publication = {
  html(w) {
    const rows = [
      w.doi ? row("DOI", `<a class="publication-doi" href="${esc(normalizeDoiUrl(w.url, w.doi))}">${esc(w.doi)}</a>`,
                  `[${w.doi}](${normalizeDoiUrl(w.url, w.doi)})`) : null,
      w.preprintOf ? row("Preprint of",
                  `<a class="publication-doi" href="${doiUrl(w.preprintOf)}">${esc(w.preprintOf)}</a>`,
                  `[${w.preprintOf}](${doiUrl(w.preprintOf)})`) : null,
    ];
    return `<div class="publication">
      <div class="publication-year">${esc(w.year ?? "")}</div>
      <div>
        <div class="publication-title">${esc(w.title)}</div>
        ${w.journal ? `<div class="publication-source">${esc(w.journal)}</div>` : ""}
        ${provenance.html(rows)}
      </div>
    </div>`;
  },
  // No label column in markdown: the tiering carries as the hard line break.
  md(w) {
    const head = [String(w.year ?? ""), `**${escMd(w.title)}**`, w.journal ? escMd(w.journal) : ""]
      .filter(Boolean).join(" \u00b7 ");
    const tail = [
      w.doi ? `[${w.doi}](${normalizeDoiUrl(w.url, w.doi)})` : "",
      w.preprintOf ? `preprint of [${w.preprintOf}](${doiUrl(w.preprintOf)})` : "",
    ].filter(Boolean).join(" \u00b7 ");
    return tail ? `${head}  \n${tail}` : head;
  },
};

// ------------------------------------------------------ Publication groups
//
// Grouped by WHAT ADMITS A WORK, not by year: a peer-reviewed article and a
// preprint are different kinds of evidence, and a reader weighs them
// differently. The year stays the index inside each group.
//
// TWO LEVELS OF INTRODUCTION. The chapter's standfirst says where the list comes
// from; each group's lead says what is in it. The lead is DERIVED — count and
// span — never written, so it cannot disagree with the list beneath it. A type
// no group names falls into the last group rather than vanishing, and a group
// with no works is not drawn.
const PUBLICATION_GROUPS = [
  { id: "articles", title: "Peer-reviewed articles", types: ["journal-article"] },
  { id: "chapters", title: "Book chapters", types: ["book-chapter"] },
  { id: "other", title: "Preprints and software", types: null },
];

const spanOf = (works) => {
  const years = works.map((w) => w.year).filter(Number.isFinite);
  if (!years.length) return "";
  const lo = Math.min(...years), hi = Math.max(...years);
  return lo === hi ? String(lo) : `${lo}–${hi}`;
};

export function groupWorks(works) {
  const named = new Set(PUBLICATION_GROUPS.flatMap((g) => g.types || []));
  return PUBLICATION_GROUPS
    .map((g) => {
      const members = works.filter((w) => (g.types ? g.types.includes(w.type) : !named.has(w.type)));
      const count = `${members.length} ${members.length === 1 ? "work" : "works"}`;
      const span = spanOf(members);
      return { id: g.id, title: g.title, works: members, lead: span ? `${count}, ${span}.` : `${count}.` };
    })
    .filter((g) => g.works.length);
}

export const publicationGroup = {
  html: (g) => `<div class="sheet">
      <div class="sheet-eyebrow">${esc(g.title)}</div>
      <p class="sheet-lead">${esc(g.lead)}</p>
      ${g.works.map((w) => publication.html(w)).join("\n      ")}
    </div>`,
  md: (g) => [`### ${escMd(g.title)}`, "", `*${escMd(g.lead)}*`, "",
              ...g.works.flatMap((w) => [publication.md(w), ""])].join("\n"),
};

// ---------------------------------------------------------------- Capability
//
// A skill is admitted by an ARTEFACT, never by a self-assessment. There is no
// level, no percentage, no proficiency and no years-of-experience — and
// check-content.mjs fails the build if one appears. The evidence links are the
// whole claim; without them the entry is an assertion, which is the thing the
// usage figure was invented to avoid, and a capability gets no exemption.
//
// `since` is DERIVED here, from the earliest dated evidence, and is omitted
// entirely when no evidence carries a year. An author-supplied "since 2016"
// would be a number with no source — the one thing content/model.md forbids
// everywhere else — and it is the field on a skills list most likely to drift
// upward over time with nobody able to check it.
const sinceOf = (c, resolve) => {
  const years = (c.evidence || []).map((e) => resolve(e).year).filter((y) => Number.isFinite(y));
  return years.length ? Math.min(...years) : null;
};

export const capability = {
  html(c, resolve) {
    const since = sinceOf(c, resolve);
    const evidence = (c.evidence || [])
      .map((e) => {
        const r = resolve(e);
        return `<a href="${esc(r.url)}">${esc(r.label)}</a>`;
      })
      .join("\n        ");
    return `<div class="capability">
      <div class="capability-name">${esc(c.name)}</div>
      <p class="capability-claim">${esc(c.claim)}</p>
      <div class="capability-evidence">
        ${evidence}
        ${since ? `<span class="capability-since">since ${since}</span>` : ""}
      </div>
    </div>`;
  },
  md(c, resolve) {
    const since = sinceOf(c, resolve);
    const evidence = (c.evidence || []).map((e) => {
      const r = resolve(e);
      return `[${escMd(r.label)}](${r.url})`;
    });
    const tail = evidence.join(" \u00b7 ") + (since ? ` \u00b7 since ${since}` : "");
    return `**${escMd(c.name)}** \u2014 ${escMd(c.claim)}  \nEvidence: ${tail}`;
  },
};

// -------------------------------------------------------------------- Figure
//
// A figure is an ARTEFACT, so its caption carries the same contract as a usage
// figure: what it shows, what produced it, and when. A picture whose origin is
// not stated is exactly the "claim without a source" the model model forbids
// for numbers, and there is no reason the rule should stop at numbers.
//
// The two bands ship as two drawings, not one recoloured drawing: DESIGN.md
// forbids reaching for a CSS filter, because a filter moves a measured hue off
// the value it was solved for. `<picture>` cannot do the switch either — it
// sees prefers-color-scheme but not the [data-theme] attribute the toggle sets,
// so a reader who overrode their OS would get the wrong band.
export const figure = {
  html({ id, alt, caption, source, light, dark }) {
    return `<figure class="figure" id="${esc(id)}">
      <div class="figure-light" role="img" aria-label="${esc(alt)}">${light}</div>
      <div class="figure-dark" role="img" aria-label="${esc(alt)}" aria-hidden="true">${dark}</div>
      <figcaption>${esc(caption)}
        <span class="figure-source">${esc(source)}</span>
      </figcaption>
    </figure>`;
  },
  // On GitHub there is no stylesheet, but <picture> IS honoured — and there is
  // no toggle there to contradict prefers-color-scheme, so the mechanism that
  // is wrong on the page is exactly right on the README.
  md({ id, alt, caption, source }) {
    return `<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/figures/${id}-dark.svg">
  <img alt="${alt}" src="assets/figures/${id}-light.svg">
</picture>

*${caption} — ${source}*`;
  },
};

// ------------------------------------------------------------------ Colophon
//
// Values come from tokens/tokens.json, not from a second, hand-maintained copy —
// otherwise the colophon would drift from the system, exactly the problem
// build-colophon.mjs already solves for COLOPHON.md.
export const colophon = {
  rows(t, extra = []) {
    const bands = Object.keys(t.bands || {}).join(", ");
    const targets = t.method?.targets
      ? `secondary ${t.method.targets.secondary}:1, tertiary ${t.method.targets.tertiary}:1`
      : "";
    return [
      ["Generated by", t.generatedBy],
      ["Bands", bands],
      ["Contrast targets", targets],
      ["All targets met", t.allTargetsMet ? "yes" : "no"],
      ["Typeface", `${t.typography?.fontSans} / ${t.typography?.fontMono}`],
      ["Radius", `${t.spacing?.radiusCard}px`],
      ["Measure", t.spacing?.measure],
      ["Page margin", t.spacing?.pageMargin],
      ["Mark", "the bend, decided 2026-09-11 — 50.00 % ink, 0.000 % self-inversion"],
      ...extra,
    ];
  },
  html(t, extra = []) {
    const rows = this.rows(t, extra)
      .map(([k, v]) => `      <dt>${esc(k)}</dt><dd>${v}</dd>`)
      .join("\n");
    return `<footer class="colophon">
    <dl>
${rows}
    </dl>
  </footer>`;
  },
  md(t, extra = []) {
    return this.rows(t, extra).map(([k, v]) => `${k}: ${String(v).replace(/<[^>]+>/g, "")}`).join(" · ");
  },
};

// ---------------------------------------------------------------------- Mark
//
// DECIDED on 2026-09-11: the bend.
//
// The path stands verbatim rather than being recomputed — a script that
// regenerated it could diverge from the approved form without anyone noticing.
export const MARK = {
  label: "The bend",
  description: "A single change of direction.",
  d: "M 6 6 L 23.68 14.32 L 32 32 L 40.32 49.68 L 58 58 L 58 6 Z",
};

export const markSvg = (size, { hidden = false } = {}) =>
  `<svg class="mark" viewBox="0 0 64 64" width="${size}" height="${size}" role="img"` +
  (hidden ? ` aria-hidden="true"` : ` aria-label="${MARK.label}"`) +
  `><path d="${MARK.d}" fill-rule="evenodd" style="fill: var(--ink)"></path></svg>`;

/** The favicon is the mark itself, inlined — no second file, no runtime request. */
export function faviconDataUri() {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">` +
    `<path d="${MARK.d}" fill-rule="evenodd" fill="%23232320"/></svg>`;
  return "data:image/svg+xml," + svg.replace(/</g, "%3C").replace(/>/g, "%3E").replace(/"/g, "'");
}

// ----------------------------------------------------------------- Lead case
//
// Composed from the SAME parts a list entry is: the quantity components, the
// provenance rows, the figure. The only thing the lead adds is prose, and the
// only thing it changes is scale. It cannot state a number of its own — every
// figure it shows is read from the project it names.
export const lead = {
  html(l, project, cohortOf, figuresHtml, ground) {
    return `<section class="lead" id="lead">
      ${ground}
      <div class="sheet-eyebrow">${esc(l.eyebrow)}</div>
      <h2 class="lead-name"><a href="${githubUrl(project.repo)}">${esc(project.name)}</a></h2>
      <div class="lead-prose">
        ${l.paragraphs.map((t) => `<p>${esc(t)}</p>`).join("\n        ")}
      </div>
      ${figuresHtml}
      ${quantity.html(project.usage, cohortOf(project.usage), null, packageLink(project.package))}
      ${seriesQuantity.html(project.series)}
      ${provenance.html([sourceRow(project.usage), seriesRow(project.series), doiRow(project.doiConcept)])}
    </section>`;
  },
  md(l, project, cohortOf, figuresMd) {
    const parts = [
      `### ${escMd(l.eyebrow)} \u2014 [${escMd(project.name)}](${githubUrl(project.repo)})`,
      "",
      ...l.paragraphs.flatMap((t) => [escMd(t), ""]),
    ];
    if (figuresMd) parts.push(figuresMd, "");
    const q = quantity.md(project.usage, cohortOf(project.usage), packageLink(project.package));
    if (q) parts.push(q, "");
    const tier3 = provenance.md([sourceRow(project.usage), seriesRow(project.series), doiRow(project.doiConcept)]);
    if (tier3) parts.push(tier3, "");
    return parts.join("\n");
  },
};
