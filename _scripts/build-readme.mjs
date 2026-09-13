#!/usr/bin/env node
// Generates README.md from the content model — the SECOND expression of the
// same components the page uses.
//
// WHY IT WAS REWRITTEN. The previous generator destructured p.usage by its
// pre-rename field names, from a model carrying { value, unit, source }, and
// printed "undefined undefined · undefined" on fourteen lines. That is the
// *same* defect as the page generator's publication loader: one half of a
// vocabulary rename, in a file far enough from the other half that nobody
// compared them.
//
// The fix is structural rather than a corrected spelling. Both surfaces now
// render through lib/render.mjs, where each component's html() and md() sit on
// adjacent lines. A rename that touches one and not the other is visible in
// the diff, and the two expressions can no longer drift apart silently.
//
// WHAT LEVEL 1 CANNOT HAVE. GitHub strips CSS, so nothing here relies on a
// class. What carries is structure, restraint and the mark. What is gone is
// the whole apparatus that was standing in for a design: four animated gradient
// dividers, two typing SVGs, roughly forty shields badges and nine
// externally-rendered stats cards — none of which are values this system owns,
// all of which are third-party runtime requests, and every one of which would
// contradict a page whose argument is that its numbers carry sources.
//
// <picture> IS the exception, and it is honoured on GitHub: the same two-band
// figures the page inlines are referenced here with a prefers-color-scheme
// source. One drawing, two surfaces.
//
// Usage:  node _scripts/build-readme.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import {
  escMd, githubUrl, doiUrl, normalizeDoiUrl, unitCohorts,
  project, contribution, archiveEntry, groupWorks, publicationGroup, capability, colophon, figure, lead,
} from "../lib/render.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));

const profile = read("content/profile.json");
const motivation = read("content/motivation.json");
const skills = read("content/skills.json");
const projects = read("content/projects.json");
const pubs = read("content/publications.json");
const contributions = read("content/contributions.json");
const archive = read("content/software-archive.json");
const figures = read("content/figures.json");
const leadCase = read("content/lead.json");
const tokens = read("tokens/tokens.json");

// ------------------------------------------------------------- Unit cohorts
//
// Built ONCE, from every figure in the model, and handed to every entry. A
// per-category index would scale a PyPI figure against the three peers in its
// own sheet instead of the eight in its unit, and draw a confidently wrong bar.
// lib/render.mjs takes it from here and reads the unit off each figure itself,
// so there is no parameter left through which the wrong cohort could arrive.
const cohortOf = unitCohorts(
  projects.categories.flatMap((k) => (k.projects || []).flatMap((p) => [p.usage, p.zenodo]))
);

// The same evidence index the page builds. Identical rules, so a capability
// resolves to the same artefact on both surfaces.
const INDEX = new Map();
for (const c of projects.categories) for (const p of c.projects)
  INDEX.set(`project:${p.id}`, { url: githubUrl(p.repo), label: p.name, year: null });
for (const w of pubs.works) if (w.doi)
  INDEX.set(`publication:${w.doi}`, { url: normalizeDoiUrl(w.url, w.doi), label: w.journal || String(w.year ?? w.doi), year: w.year ?? null });
for (const b of contributions.contributions || [])
  INDEX.set(`contribution:${b.id}`, { url: githubUrl(b.project), label: b.project, year: b.year ?? null });
for (const e of archive.entries || [])
  INDEX.set(`archive:${e.repo}`, { url: githubUrl(e.repo), label: e.title, year: e.year ?? null });
const resolve = (e) => {
  const hit = INDEX.get(`${e.kind}:${e.ref || e.doi}`);
  if (!hit) throw new Error(`skills.json references ${e.kind}:${e.ref || e.doi}, absent from the content model`);
  return hit;
};

const L = [];
const orcid = profile.links.find((v) => v.what === "ORCID");
const github = profile.links.find((v) => v.what === "GitHub");

// EXACTLY ONE H1, sections at ##. The previous README had eight ### and no H1
// at all, which is a heading outline with no top — invisible in rendering and
// wrong for every reader who navigates by structure.
L.push(`<img src="assets/mark.svg" alt="" width="44" height="44">`, "");
L.push(`# ${profile.name}`, "");
L.push(`**${escMd(motivation.lead)}**`, "");
L.push(`[ORCID](${orcid.url}) · [GitHub](${github.url})`, "");
L.push("---", "");

L.push("## Motivation", "");
for (const p of motivation.paragraphs) L.push(escMd(p), "");

for (const f of figures.figures.filter((f) => f.placement === "motivation")) L.push(figure.md(f), "");

L.push("## Skills", "");
L.push("*Every capability links the artefact that admits it. There is no self-assessed level here: a bar is a claim about a person, a link is evidence.*", "");
for (const g of skills.groups) {
  L.push(`### ${escMd(g.name)}`, "");
  for (const c of g.capabilities) L.push(capability.md(c, resolve), "");
}

L.push("## Programs", "");
{
  const p = projects.categories.flatMap((k) => k.projects).find((x) => x.id === leadCase.project);
  if (!p) throw new Error(`content/lead.json names "${leadCase.project}", which is not a project`);
  const fig = figures.figures.filter((f) => f.placement === "lead").map(figure.md).join("\n\n");
  L.push(lead.md(leadCase, p, cohortOf, fig), "");
}
for (const k of projects.categories) {
  L.push(`### ${escMd(k.name)}`, "");
  L.push(`*${escMd(k.audience)}*`, "");
  for (const f of figures.figures.filter((f) => f.placement === `category:${k.id}`)) L.push(figure.md(f), "");
  for (const p of k.projects) L.push(project.md(p, cohortOf), "");
  // The ordering rationale travels with the order it explains. Without it the
  // editorial exception on the first entry looks like an unexplained deviation.
  if (k.orderRationale) L.push(`<sub>Ordering: ${escMd(k.orderRationale)}</sub>`, "");
}

L.push("## Work taken into other people's software", "");
L.push("*A different kind of evidence than an own repository: not \"I built something\", but \"others took my work into theirs\".*", "");
for (const b of contributions.contributions || []) L.push(contribution.md(b), "");

L.push("## Publications", "");
for (const g of groupWorks(pubs.works)) L.push(publicationGroup.md(g), "");
L.push("", `<sub>${pubs.works.length} works, ORCID snapshot of ${pubs.fetchedAt}.</sub>`, "");

// <details> is one of the few interactive elements GitHub keeps. The archive is
// real and it is not the point, so it is present and closed.
L.push("<details>", `<summary>Further software with a DOI (${(archive.entries || []).length})</summary>`, "");
L.push(escMd(archive.note), "");
for (const e of archive.entries || []) L.push(archiveEntry.md(e, archive.asOf), "");
L.push("", "</details>", "");

L.push("---", "");
L.push(`<sub>${colophon.md(tokens, [["Motion", "120ms quick / 240ms considered, one curve"], ["Generated by", "_scripts/build-readme.mjs from content/"]])}</sub>`, "");

writeFileSync(join(ROOT, "README.md"), L.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n");

const nCap = skills.groups.reduce((n, g) => n + g.capabilities.length, 0);
console.log(
  `README.md written — ${projects.categories.length} categories, ` +
  `${projects.categories.reduce((n, k) => n + k.projects.length, 0)} projects, ${nCap} capabilities, ` +
  `${pubs.works.length} publications, ${figures.figures.length} figures via <picture>. ` +
  `Zero badges, zero third-party runtime requests.`
);
