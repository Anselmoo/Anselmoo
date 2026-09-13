// Publications at runtime: ORCID first, otherwise the committed fallback.
//
// The fallback is not a stopgap, it's half of the decision. A live
// fetch without it makes the list vanish on every third-party outage — and
// the researcher arriving from a DOI is then facing an empty
// surface. With it, the page degrades: it shows the same content, just older,
// and says so.
//
// CHECKED, not assumed: pub.orcid.org responds with
// access-control-allow-origin: *, so a fetch from a static page works.
// The API version sits in the path — if it moves, this fetch fails, and that's
// exactly why the second half exists.
//
// The committed copy is loaded as a JSON module rather than fetched from a URL
// built out of import.meta.url. Both properties that mattered are kept and one
// mechanism is dropped: the specifier resolves against THIS file, so a page at any
// depth may import it, and the import sits inside the catch, so the copy is still
// only read once the live fetch has already failed. On an engine without JSON
// modules the import throws and lands in the hard-failure branch below — which is
// the honest outcome, not a silent empty surface.
//
// It is also the one change in this file made for a reader that is not a browser:
// this repository is compiled by an in-browser bundler that parses every module as
// a script, and import.meta is a syntax error there. This file is the only genuine
// browser module in the system, so it is the only one worth meeting halfway.

const ORCID = "0000-0003-4543-4833";
const API = `https://pub.orcid.org/v3.0/${ORCID}/works`;
const TIMEOUT = 6000;

const RANK = { "journal-article": 4, "book-chapter": 3, software: 2, preprint: 1 };

/**
 * Works kept off the page on purpose, by DOI, each with its reason. Shared with
 * _scripts/fetch-orcid.mjs so the snapshot and the live fetch omit the same works —
 * otherwise a successful live fetch would put back what the build took out.
 */
export const OMIT = new Map([
  ["10.1007/978-3-658-42060-4_10", "German-language title; the page is English only"],
  ["10.1007/978-3-658-37926-1_14", "German-language title; the page is English only"],
]);

const entities = (s) => s
  .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
const titleKey = (t) => entities(t)
  .toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "")
  .replace(/[^a-z0-9]+/g, " ").trim();
const baseDoi = (d) => d.replace(/\/v\d+$/i, "");
const version = (d) => { const m = d.match(/\/v(\d+)$/i); return m ? +m[1] : 0; };

function read(group) {
  const s = group["work-summary"][0];
  const ids = (group["external-ids"] || {})["external-id"] || [];
  const doi = (ids.find((e) => e["external-id-type"] === "doi") || {})["external-id-value"] || null;
  const year = ((s["publication-date"] || {}).year || {}).value || null;
  return {
    doi, type: s.type || "unknown",
    title: entities((s.title.title || {}).value || "").trim(),
    year: year ? Number(year) : null,
    journal: ((s["journal-title"] || {}).value || "").trim() || null,
    url: (s.url || {}).value || (doi ? `https://doi.org/${doi}` : null),
  };
}

/** The same two rules as _scripts/fetch-orcid.mjs. If one moves, both move. */
function dedupe(raw) {
  const byBase = new Map();
  for (const w of raw) {
    const k = w.doi ? baseDoi(w.doi) : `no-doi:${titleKey(w.title)}`;
    const b = byBase.get(k);
    if (!b) { byBase.set(k, w); continue; }
    byBase.set(k, version(w.doi || "") > version(b.doi || "") ? w : b);
  }
  const byTitle = new Map();
  for (const w of byBase.values()) {
    const k = titleKey(w.title);
    const b = byTitle.get(k);
    if (!b) { byTitle.set(k, w); continue; }
    const winner = (RANK[w.type] || 0) > (RANK[b.type] || 0) ? w : b;
    const loser = winner === w ? b : w;
    if (loser.type === "preprint") winner.preprintOf = loser.doi;
    byTitle.set(k, winner);
  }
  return [...byTitle.values()].filter((w) => !OMIT.has(w.doi)).sort(
    (a, b) => (b.year || 0) - (a.year || 0) || a.title.localeCompare(b.title));
}

/**
 * @returns {Promise<{works: Array, origin: "live"|"fallback", asOf: string, reason?: string}>}
 *   origin tells the page whether it needs to show a note about how current the data is.
 */
export async function loadPublications() {
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), TIMEOUT);
  try {
    const res = await fetch(API, { headers: { Accept: "application/json" }, signal: abort.signal });
    if (!res.ok) throw new Error(`ORCID responded ${res.status}`);
    const works = dedupe((await res.json()).group.map(read));
    if (!works.length) throw new Error("ORCID returned no works");
    return { works, origin: "live", asOf: new Date().toISOString().slice(0, 10) };
  } catch (e) {
    try {
      const d = (await import("./publications.json", { with: { type: "json" } })).default;
      return { works: d.works, origin: "fallback", asOf: d.fetchedAt, reason: String(e.message || e) };
    } catch (e2) {
      // Both paths are dead. Better an honest error than a silent empty surface.
      throw new Error(`Publications could not be loaded: live "${e.message}", fallback "${e2.message}"`);
    }
  } finally {
    clearTimeout(timer);
  }
}
