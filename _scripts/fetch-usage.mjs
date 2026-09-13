#!/usr/bin/env node
// Refreshes the usage figures in the content model. ON CALL, not on a cron.
//
// cupertino-focus struck the weekly metrics cron, with named costs: pinned
// repos drift from reality. The selection stays hand-picked — that is the
// decision. But a hand-picked NUMBER that nobody remeasures turns into folklore
// after three months. This command makes the difference between "I once read
// that" and "this carries a date".
//
// CHECKED SOURCES: GitHub REST, api.npmjs.org, VS Marketplace extensionquery,
// pypistats.org.
//
// PyPI was left out in the first version, with the justification "pypistats
// returns 429". That was an inherited note, not a measurement of its own — and
// it was misleading. pypistats answers with 200; the 429 is a RATE LIMIT that
// kicks in after about five quick calls and clears after roughly 15 seconds.
// The right response is to wait, not to leave it out: measured this way, all
// eight packages came back, including repo-release-tools with 2230 downloads
// a month at 1 star.
//
// pepy.tech stays out: v2 answers 401 without a key, v1 answers 403.
//
// ZENODO is resolved via the MODEL's OWN DOIs, not a name search. That is not
// a preference, it is a measured result: q="Anselm Hahn" returns seven
// records and leaves out exactly TanabeSugano and SpectraFit, because their
// metadata carries the name differently. A name search therefore reports the
// holdings as systematically too small — and silently so. Going from the
// projects to their DOIs is the only direction that can be complete.

import { readFileSync, writeFileSync } from "node:fs";

const HEUTE = new Date().toISOString().slice(0, 10);
const UA = "anselmoo-brand/1.0 (+https://github.com/Anselmoo)";
const d = JSON.parse(readFileSync("content/projects.json", "utf8"));

async function npmMonth(name) {
  const r = await fetch(`https://api.npmjs.org/downloads/point/last-month/${name}`);
  if (!r.ok) throw new Error(`npm ${r.status}`);
  const j = await r.json();
  return { value: j.downloads, unit: "npm downloads per month",
           source: `api.npmjs.org, ${j.start} to ${j.end}`, asOf: HEUTE };
}

async function marketplace(name) {
  const r = await fetch("https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json;api-version=7.2-preview.1" },
    body: JSON.stringify({ filters: [{ criteria: [{ filterType: 7, value: name }] }], flags: 914 }),
  });
  if (!r.ok) throw new Error(`Marketplace ${r.status}`);
  const ex = (await r.json()).results?.[0]?.extensions ?? [];
  if (!ex.length) throw new Error(`no extension "${name}"`);
  const stat = (n) => ex[0].statistics?.find((s) => s.statisticName === n)?.value;
  return { value: stat("install"), unit: "installations",
           source: `VS Marketplace, ${stat("downloadCount")} downloads total`, asOf: HEUTE };
}

/**
 * pypistats with a retreat. The limit is real, but it is a limit, not a
 * no — whoever respects it gets the number.
 */
async function pypiMonth(name) {
  for (let versuch = 1; versuch <= 3; versuch++) {
    const r = await fetch(`https://pypistats.org/api/packages/${name}/recent`);
    if (r.ok) {
      const d = (await r.json()).data;
      return { value: d.last_month, unit: "PyPI downloads per month",
               source: `pypistats.org, last week ${d.last_week}`, asOf: HEUTE };
    }
    if (r.status !== 429) throw new Error(`pypistats ${r.status}`);
    await wait(versuch * 15000);
  }
  throw new Error("pypistats stays at 429");
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Zenodo per concept DOI. The concept DOI is the citable one: it always
 * points to the newest version, and its statistics count across all versions.
 */
async function zenodo(doiKonzept) {
  const id = doiKonzept.replace(/^10\.5281\/zenodo\./, "");
  // MEASURED: Zenodo answers with 403 when no User-Agent is sent along.
  // Node's fetch sends none of its own accord, curl does — which is why the
  // same call worked on the command line but not in the script. Not a rate
  // limit, a header.
  const r = await fetch(`https://zenodo.org/api/records/${id}`, {
    redirect: "follow",
    headers: { "User-Agent": UA, Accept: "application/json" },
  });
  if (!r.ok) throw new Error(`Zenodo ${r.status}`);
  const j = await r.json();
  if (j.conceptdoi && j.conceptdoi !== doiKonzept) {
    throw new Error(`${doiKonzept} is not a concept DOI — Zenodo reports ${j.conceptdoi}`);
  }
  const st = j.stats || {};
  return { value: st.downloads, unit: "Zenodo downloads total",
           source: `zenodo.org, ${st.views} views, newest version ${j.doi}`, asOf: HEUTE };
}

async function sterne(repo) {
  const r = await fetch(`https://api.github.com/repos/${repo}`, {
    headers: { Accept: "application/vnd.github+json" } });
  if (!r.ok) throw new Error(`GitHub ${r.status}`);
  return (await r.json()).stargazers_count;
}

let changed = 0;
for (const k of d.categories) {
  for (const p of k.projects) {
    // Stars always — they are cheap and they date the holdings.
    try {
      const s = await sterne(p.repo);
      if (s !== p.stars) { console.log(`  ${p.id.padEnd(26)} stars ${p.stars} -> ${s}`); p.stars = s; changed++; }
    } catch (e) { console.error(`  ${p.id}: stars not retrievable (${e.message})`); }

    // Zenodo first: a concept DOI is stronger evidence than a package number,
    // and it counts across all versions instead of over thirty days.
    if (p.doiConcept && /zenodo/.test(p.doiConcept)) {
      try {
        const z = await zenodo(p.doiConcept);
        p.zenodo = z; changed++;
        console.log(`  ${p.id.padEnd(26)} ${z.unit}: ${z.value}`);
      } catch (e) { console.error(`  ${p.id}: Zenodo not retrievable (${e.message})`); }
      await wait(1200);
    }

    if (!p.package) continue;
    try {
      let n = null;
      if (p.package.kind === "npm") n = await npmMonth(p.package.name);
      else if (p.package.kind === "vscode-marketplace") n = await marketplace(p.package.marketplaceId || `AnselmHahn.${p.package.name}`);
      else if (p.package.kind === "pypi") { n = await pypiMonth(p.package.name); await wait(2500); }
      if (n) {
        const vorher = p.usage?.value;
        p.usage = n; changed++;
        console.log(`  ${p.id.padEnd(26)} ${n.unit}: ${vorher ?? "—"} -> ${n.value}`);
      }
    } catch (e) { console.error(`  ${p.id}: ${p.package.kind} not retrievable (${e.message})`); }
  }
}

d.starsAsOf = HEUTE;
writeFileSync("content/projects.json", JSON.stringify(d, null, 2) + "\n");
console.log(`\n${changed} values refreshed, as of ${HEUTE}.`);
