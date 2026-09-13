#!/usr/bin/env node
// Checks the content model against itself.
//
// The model is hand-picked — that is the decision, and it is the right one,
// because stars demonstrably misrepresent this holdings' usage. But
// hand-picked also means: typos go unnoticed until someone looks. This check
// looks. It does not replace judgement, it catches carelessness.
//
// Errors exit with code 1. Notes do not — they report what to do, not what is
// broken. The difference matters: a check that goes red on every open
// question gets ignored.

import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const read = (p) => JSON.parse(readFileSync(p, "utf8"));
const projects = read("content/projects.json");
const pubs = read("content/publications.json");
const profile = read("content/profile.json");
const contribs = read("content/contributions.json");
const archive = read("content/software-archive.json");
const skills = read("content/skills.json");
const motivation = read("content/motivation.json");
const leadCase = read("content/lead.json");
const figuresManifest = read("content/figures.json");

const errors = [];
const notes = [];

// --- Structure ---
const REQUIRED = ["id", "repo", "name", "summary", "stars", "language"];
const ids = new Set();
let count = 0;

for (const k of projects.categories) {
  if (!k.id || !k.name || !k.audience) errors.push(`Category without id, name or audience: ${k.id || "?"}`);
  if (!k.projects?.length) errors.push(`Category "${k.id}" is empty`);
  for (const p of k.projects || []) {
    count++;
    for (const f of REQUIRED) {
      if (p[f] === undefined || p[f] === null || p[f] === "") errors.push(`${p.id || "?"}: field "${f}" is missing`);
    }
    if (ids.has(p.id)) errors.push(`duplicate id: ${p.id}`);
    ids.add(p.id);
    if (p.repo && !/^[\w.-]+\/[\w.-]+$/.test(p.repo)) errors.push(`${p.id}: repo "${p.repo}" is not owner/name`);
    if (p.summary && !p.summary.endsWith(".")) notes.push(`${p.id}: the summary ends without a period`);
    if (p.summary && /!/.test(p.summary)) errors.push(`${p.id}: exclamation mark in the summary — the system forbids it as punctuation`);
  }
}

// --- Cross-reference: does a project claim a DOI the publication list doesn't know? ---
//
// Zenodo assigns TWO DOIs: one per version and one for all versions. The
// citable one is the concept DOI, but ORCID usually carries a VERSION. So it
// is enough if EITHER of the two is known to the publication list — requiring
// both would fail for every Zenodo project, and a check that is always red
// gets ignored.
const knownDois = new Set(pubs.works.map((w) => w.doi));
for (const k of projects.categories) {
  for (const p of k.projects || []) {
    const candidates = [p.doiConcept, p.doiVersion].filter(Boolean);
    if (!candidates.length) continue;
    if (!candidates.some((d) => knownDois.has(d))) {
      errors.push(`${p.id}: neither doiConcept (${p.doiConcept}) nor doiVersion (${p.doiVersion}) `
        + `appears in an ORCID work — a typo, or the entry is missing from ORCID`);
    }
    if (p.doiVersion && !p.doiConcept) {
      errors.push(`${p.id}: doiVersion without doiConcept. The concept DOI is what gets cited, `
        + `because it always points to the newest version.`);
    }
  }
}

// --- Contributions to third-party software ---
for (const b of contribs.contributions || []) {
  for (const f of ["id", "project", "what", "role", "doiConcept", "year"]) {
    if (!b[f]) errors.push(`Contribution ${b.id || "?"}: field "${f}" is missing`);
  }
  if (b.authors != null && b.authors < 2) {
    notes.push(`Contribution ${b.id}: only ${b.authors} author — is this really a contribution to third-party software?`);
  }
}

// --- Own software with a DOI that is not a curated project ---
const curatedRepos = new Set();
for (const k of projects.categories) for (const p of k.projects || []) curatedRepos.add(p.repo);
for (const e of archive.entries || []) {
  if (!e.doiConcept) errors.push(`Archive ${e.repo}: doiConcept is missing`);
  if (curatedRepos.has(e.repo)) {
    errors.push(`Archive ${e.repo}: also appears as a curated project in projects.json. `
      + `The archive explicitly lists only what is NOT a curated project.`);
  }
}

// --- Honesty of the usage figures ---
for (const k of projects.categories) {
  for (const p of k.projects || []) {
    if (p.usage && /UNBEST/i.test(p.usage.asOf || "")) {
      notes.push(`${p.id}: usage figure ${p.usage.value} ${p.usage.unit} is unconfirmed — remeasure or remove`);
    }
    if (p.usage && p.usage.value != null && !p.usage.source) {
      errors.push(`${p.id}: usage figure without a source. A number without provenance is a claim.`);
    }
  }
}

// --- The ninety-day series: real, or absent ---
//
// The sparkline is the one mark on the page that could be faked without anyone
// noticing, because a plausible line is easy and ninety plausible numbers look
// exactly like ninety measured ones. So the checks here are all about PROVENANCE
// and SHAPE, never about whether the curve looks nice.
//
// Only two of the four sources publish a daily series at all — pypistats and
// api.npmjs.org do, the VS Marketplace and Zenodo report totals only. That
// have/have-not split is REAL and it is visible on both surfaces, which means a
// series appearing on a marketplace entry could only have been invented. It is
// an ERROR, not a note: it is the exact failure "a number without a source is a
// claim" exists to refuse, ninety times over.
const SERIES_KINDS = new Set(["pypi", "npm"]);
const SERIES_FIELDS = ["unit", "days", "from", "to", "points", "source", "asOf"];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
for (const k of projects.categories) {
  for (const p of k.projects || []) {
    const r = p.series;
    if (!r) continue;
    if (!SERIES_KINDS.has(p.package?.kind)) {
      errors.push(`${p.id}: carries a series, but its package kind "${p.package?.kind ?? "none"}" publishes `
        + `no daily data — only totals. A series here could not have been measured, and a synthesised `
        + `line is ninety claims without a source.`);
      continue;
    }
    for (const f of SERIES_FIELDS) {
      if (r[f] === undefined || r[f] === null || r[f] === "") errors.push(`${p.id}: series field "${f}" is missing`);
    }
    if (!Array.isArray(r.points) || !r.points.length) {
      errors.push(`${p.id}: series without points`);
      continue;
    }
    if (r.points.length !== r.days) {
      errors.push(`${p.id}: series says ${r.days} days but carries ${r.points.length} points`);
    }
    if (!r.points.every((v) => Number.isInteger(v) && v >= 0)) {
      errors.push(`${p.id}: series carries a point that is not a non-negative integer — these are download counts, `
        + `and a fractional one would mean something has been interpolated`);
    }
    // The window has to be the calendar it claims. A series read straight out of
    // a response with missing days would pass every other check here and misdate
    // every point in it; this is the check that catches that.
    if (ISO_DATE.test(r.from || "") && ISO_DATE.test(r.to || "")) {
      const span = Math.round((Date.parse(r.to) - Date.parse(r.from)) / 86400000) + 1;
      if (span !== r.points.length) {
        errors.push(`${p.id}: series runs ${r.from} to ${r.to}, which is ${span} calendar days, `
          + `but carries ${r.points.length} points. A day missing from the source is a measured zero, not a missing point.`);
      }
    }
    if (p.usage?.unit && r.unit === p.usage.unit) {
      errors.push(`${p.id}: the series claims the same unit as the usage figure ("${r.unit}"). `
        + `They are two different measurements — a rate per day against a total per month — and giving them one `
        + `unit invites exactly the comparison the model forbids.`);
    }
    const age = Math.round((Date.now() - Date.parse(r.asOf)) / 86400000);
    if (Number.isFinite(age) && age > r.days) {
      notes.push(`${p.id}: the series is ${age} days old and only covers ${r.days} — the window it draws `
        + `has now passed entirely. Refresh with "npm run usage --only=series".`);
    }
  }
}

// --- Independent listings: evidence, not measurement ---
for (const k of projects.categories) {
  for (const p of k.projects || []) {
    for (const g of p.listings || []) {
      if (!g.url || !g.where) errors.push(`${p.id}: listing without a "where" or url`);
      if (!g.asOf) notes.push(`${p.id}: listing "${g.where}" has no as-of date`);
      if (g.value !== undefined) {
        errors.push(`${p.id}: listing "${g.where}" carries a number. A listing is evidence of visibility, `
          + `not usage — numbers belong under usage, with a source.`);
      }
    }
  }
}

// --- Order: no smaller number above a larger one in the SAME unit ---
// There are now FOUR units: npm downloads per month, PyPI downloads per
// month, Marketplace installations and Zenodo downloads total. Only the
// usage field is ordered; the zenodo field is a second axis and does not
// enter the ordering, because "total for years" and "in thirty days" do not
// answer the same question. The first entry per category is exempt: it is
// set editorially and must name its reason. Without this exemption the
// ordering would just be a sort.
for (const k of projects.categories) {
  if (!k.orderRationale) errors.push(`Category "${k.id}": first entry is editorial, but orderRationale is missing`);
  const rest = (k.projects || []).slice(1).filter((p) => p.usage?.value != null);
  const byUnit = new Map();
  for (const p of rest) {
    const e = p.usage.unit;
    const previous = byUnit.get(e);
    if (previous && previous.usage.value < p.usage.value) {
      errors.push(`Category "${k.id}": ${p.id} (${p.usage.value}) stands below ${previous.id} `
        + `(${previous.usage.value}) at the same unit "${e}"`);
    }
    byUnit.set(e, p);
  }
}

// --- English only: every tracked text file ---
//
// Content, code, comments, file names and design documents are English. This
// used to check content VALUES only and exempted publications.json, whose titles
// are quoted verbatim. The two German-language works are now omitted at the
// source (content/orcid.mjs, OMIT), so nothing needs exempting.
//
// Three signals, because each alone is either blind or noisy:
//   - an umlaut or sharp s. "Prägnanz", the English name of the Gestalt law, is
//     the one allowed occurrence;
//   - two distinct German function words on one line. One alone is noise, two
//     together are a sentence;
//   - a German identifier stem this repository actually used.
// This file is skipped: its own patterns would match themselves.
const TEXT_FILE = /\.(md|mjs|js|css|json|html|svg|txt|ya?ml|toml|cff|sh|py)$|(^|\/)\.gitignore$/;
const UMLAUT = /[äöüÄÖÜß]/;
const ALLOWED = /Prägnanz|pr%C3%A4gnanz/gi;
const FUNCTION_WORDS = /\b(der|die|das|und|nicht|eine|ist|mit|wird|werden|kann|oder|fuer|ueber|auf|nur)\b/g;
const GERMAN_IDENTIFIER = /\b(pfad|datei|inhalt|quelle|beitraege|archiv|pflicht|gruppen|setzung|lexikon|kein)\b/i;
const trackedText = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .split("\n").filter((f) => TEXT_FILE.test(f) && f !== "_scripts/check-content.mjs");
for (const file of trackedText) {
  let text;
  try { text = readFileSync(file, "utf8"); } catch { continue; } // deleted, not yet committed
  text.split("\n").forEach((line, i) => {
    const clean = line.replace(ALLOWED, "");
    const words = new Set(clean.match(FUNCTION_WORDS) || []);
    const identifier = clean.match(GERMAN_IDENTIFIER);
    const hit = UMLAUT.test(clean) ? "an umlaut"
      : words.size >= 2 ? `the German words "${[...words].join('", "')}"`
      : identifier ? `the German identifier "${identifier[0]}"` : null;
    if (hit) errors.push(`${file}:${i + 1}: contains ${hit}. The repository is English only.`);
  });
}

// --- llm/tokens.json must not drift from tokens/tokens.json ---
//
// The extract for agents is hand-maintained. It used to claim it was generated, which
// was false — nothing generated it. The honest fix is to say so AND to make the claim
// checkable, because a hand-kept copy that nobody compares is a copy that quietly
// disagrees. This compares the values that appear in both.
{
  const llm = read("llm/tokens.json");
  const src = read("tokens/tokens.json");
  for (const band of ["light", "dark"]) {
    for (const role of ["ink", "secondary", "tertiary", "decor"]) {
      const a = llm.bands?.[band]?.roles?.[role];
      const b = src.bands?.[band]?.roles?.[role];
      if (a && b && a !== b) {
        errors.push(`llm/tokens.json: ${band}.${role} is ${a}, tokens/tokens.json says ${b}`);
      }
    }
  }
  const at = llm.method?.targets, bt = src.method?.targets;
  if (at && bt && (at.secondary !== bt.secondary || at.tertiary !== bt.tertiary)) {
    errors.push(`llm/tokens.json: contrast targets disagree with tokens/tokens.json`);
  }
}

// --- Freshness of the fallback ---
const days = Math.round((Date.now() - Date.parse(pubs.fetchedAt)) / 86400000);
if (Number.isFinite(days) && days > 180) {
  notes.push(`Publications fallback is ${days} days old — refresh with "npm run orcid"`);
}
if (pubs.works.length !== pubs.afterDedupe - (pubs.omitted || []).length) {
  errors.push("publications.json: afterDedupe minus omitted does not match the number of works");
}

// --- Profile ---
if (!profile.orcid || !/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(profile.orcid)) errors.push("profile.json: ORCID is missing or is not a valid iD");
for (const v of profile.links || []) {
  if (v.url === null) notes.push(`Profile: link "${v.what}" has no URL yet`);
}

// --- Skills: evidence, never self-assessment ---
//
// This is the strictest block in the file, and deliberately so. A skills
// section is the single easiest place on a portfolio to make an unfalsifiable
// claim, and the system already settled the general question for numbers:
// "a number without provenance is a claim". A proficiency bar is that same
// claim with the source removed and a graphic added.
//
// So the forbidden keys are ERRORS, not notes. A note would be a suggestion,
// and the whole point is that this is not negotiable at the moment somebody is
// tempted — which is late at night, adding "Python ... 95%".
const FORBIDDEN_KEYS = ["level", "years", "percent", "proficiency", "rating", "score", "stars"];
const MAX_CAPABILITIES_PER_GROUP = 3;
const MAX_EVIDENCE_PER_CAPABILITY = 2;

// Everything a capability may point at. Built from the OTHER content files, so
// a reference can only resolve to something that actually exists.
const evidenceIndex = new Set();
for (const k of projects.categories) for (const p of k.projects || []) evidenceIndex.add(`project:${p.id}`);
for (const w of pubs.works) if (w.doi) evidenceIndex.add(`publication:${w.doi}`);
for (const b of contribs.contributions || []) evidenceIndex.add(`contribution:${b.id}`);
for (const e of archive.entries || []) evidenceIndex.add(`archive:${e.repo}`);

const capIds = new Set();
let capCount = 0;
for (const g of skills.groups || []) {
  if (!g.id || !g.name) errors.push(`skills.json: group without id or name (${g.id || "?"})`);
  if (!g.capabilities?.length) errors.push(`skills.json: group "${g.id}" is empty`);
  if ((g.capabilities || []).length > MAX_CAPABILITIES_PER_GROUP) {
    // The cap is what keeps this a skills section rather than a second badge
    // wall in prose. It belongs here and not in somebody's self-discipline.
    errors.push(`skills.json: group "${g.id}" has ${g.capabilities.length} capabilities, `
      + `the limit is ${MAX_CAPABILITIES_PER_GROUP}. Cut, or split the group and justify the split.`);
  }
  for (const c of g.capabilities || []) {
    capCount++;
    if (capIds.has(c.id)) errors.push(`skills.json: duplicate capability id "${c.id}"`);
    capIds.add(c.id);
    for (const f of ["id", "name", "claim"]) {
      if (!c[f]) errors.push(`skills.json: capability "${c.id || "?"}" is missing "${f}"`);
    }
    if (c.claim && !c.claim.endsWith(".")) notes.push(`skills.json: claim of "${c.id}" ends without a period`);

    for (const key of FORBIDDEN_KEYS) {
      if (key in c) {
        errors.push(`skills.json: capability "${c.id}" carries "${key}". Self-assessment is refused here — `
          + `a level is a claim about a person, an evidence link is a fact about an artefact.`);
      }
    }
    if ("since" in c) {
      errors.push(`skills.json: capability "${c.id}" states "since". That year is DERIVED from the earliest `
        + `dated evidence (see sinceRule); an author-supplied one is a number without a source.`);
    }

    if (!c.evidence?.length) {
      errors.push(`skills.json: capability "${c.id}" has no evidence. A capability with nothing to point at `
        + `is exactly the assertion this component exists to refuse.`);
      continue;
    }
    if (c.evidence.length > MAX_EVIDENCE_PER_CAPABILITY) {
      errors.push(`skills.json: capability "${c.id}" cites ${c.evidence.length} artefacts, `
        + `the limit is ${MAX_EVIDENCE_PER_CAPABILITY}. Cite the strongest, not all of them.`);
    }
    for (const e of c.evidence) {
      const key = `${e.kind}:${e.ref || e.doi}`;
      if (!evidenceIndex.has(key)) {
        errors.push(`skills.json: capability "${c.id}" cites ${key}, which is not in the content model. `
          + `A renamed project must not leave a skills entry pointing at a 404.`);
      }
    }
  }
}

// --- Motivation: author-written, and it has to actually be there ---
//
// The one file in content/ a script has no opinion about. It is checked for
// presence and shape only — an empty motivation would leave the page opening
// on a heading with nothing under it.
if (!motivation.lead) errors.push("motivation.json: no lead. It is the masthead sentence and the meta description.");
if (!motivation.paragraphs?.length) errors.push("motivation.json: no paragraphs.");
for (const [i, para] of (motivation.paragraphs || []).entries()) {
  if (para.length < 40) errors.push(`motivation.json: paragraph ${i + 1} is ${para.length} characters — that is a caption, not a paragraph.`);
}

// --- The lead case study must earn its size ---
//
// The lead is the only entry on the page given the weight of a section, so the
// question "why this one" has to have an answer that is not "it is newest". The
// rule content/lead.json states for itself is enforced here rather than trusted:
// a figure, because without one there is nothing to show at that size, and a
// peer-reviewed publication, because without one it is an assertion set larger.
{
  const all = projects.categories.flatMap((k) => k.projects);
  const p = all.find((x) => x.id === leadCase.project);
  if (!p) {
    errors.push(`lead.json: names "${leadCase.project}", which is not a project in projects.json`);
  } else {
    const hasFigure = (figuresManifest.figures || []).some((f) => f.placement === "lead");
    if (!hasFigure) {
      errors.push(`lead.json: "${p.id}" is the lead but no figure carries placement "lead". `
        + `The lead is given a section's weight; without a figure there is nothing to show at that size.`);
    }
    const dois = [p.doiConcept, p.doiVersion].filter(Boolean);
    const reviewed = pubs.works.some((w) => dois.includes(w.doi) && w.type !== "software");
    if (!reviewed) {
      errors.push(`lead.json: "${p.id}" has no peer-reviewed publication in publications.json. `
        + `A lead without one is an assertion set larger than the entries around it.`);
    }
  }
  if (!leadCase.paragraphs?.length) errors.push("lead.json: no paragraphs.");
  for (const [i, t] of (leadCase.paragraphs || []).entries()) {
    if (/\b\d{3,}\b/.test(t)) {
      errors.push(`lead.json: paragraph ${i + 1} states a bare number. Every figure on this surface `
        + `must come from projects.json through the shared components, or the case study can claim `
        + `more than its own list entry does.`);
    }
  }
}

// --- Report ---
const types = pubs.works.reduce((a, w) => ({ ...a, [w.type]: (a[w.type] || 0) + 1 }), {});
const units = new Set();
for (const k of projects.categories) for (const p of k.projects || []) if (p.usage?.unit) units.add(p.usage.unit);
const withSeries = projects.categories.flatMap((k) => k.projects || []).filter((p) => p.series?.points?.length);
console.log(`Projects       ${count} in ${projects.categories.length} categories, ${units.size} units`);
console.log(`Series         ${withSeries.length} of ${count} carry a real daily series (pypistats, api.npmjs.org); the rest have sources that publish totals only`);
console.log(`Contributions  ${(contribs.contributions || []).length} to third-party software`);
console.log(`Archive        ${(archive.entries || []).length} own DOIs outside the selection`);
console.log(`Lead case      ${leadCase.project} — figure + peer-reviewed publication required and present`);
console.log(`Capabilities   ${capCount} in ${(skills.groups || []).length} groups, all evidence-backed`);
console.log(`Works          ${pubs.works.length} (${Object.entries(types).map(([t, n]) => `${n} ${t}`).join(", ")}), as of ${pubs.fetchedAt}`);
console.log("");
if (notes.length) {
  console.log("Notes — open, not broken:");
  notes.forEach((h) => console.log("  - " + h));
  console.log("");
}
if (errors.length) {
  console.error("Errors:");
  errors.forEach((f) => console.error("  - " + f));
  process.exit(1);
}
console.log("The content model carries.");
