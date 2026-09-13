# Content Model

One source for both surfaces. Today the same projects sit in three homepage
drafts nearly identically and are maintained by hand a fourth time in the
profile README — four versions of one truth. This directory replaces them.

## Five types

The typing follows the data, not a preference. ORCID distinguishes
`journal-article`, `book-chapter`, `preprint` and `software`; added to that
is the repository as its own type, because a tool without a DOI is still
work.

| Type | Source | Maintained by |
|---|---|---|
| Project | `projects.json` | Human |
| Article · chapter · preprint · software DOI | ORCID, mirrored into `publications.json` | Script |
| Contribution to someone else's software | `contributions.json` | Human |
| Own software with a DOI outside the selection | `software-archive.json` | Human |

The last two were added later, both from a discovery rather than from a
system. The **contribution** carries something different from an own repo:
not "I built this", but "others have taken my work into theirs" —
`faccts/orca-external-tools` with seven authors, and ORCA is an established
quantum-chemistry package. The **archive** holds own software with a DOI
that is not a curated project. Staying quiet about it would be convenient;
`useful-math-functions` is, with 105 downloads, the most-downloaded Zenodo
record in the entire holdings, and neither the repo nor this model knew
about it before the concept DOIs were resolved.

## Zenodo: two DOIs, and search is not an enumeration

Zenodo assigns two DOIs per piece of software: one per version and one for
all versions. The one to cite is the **concept DOI** — it always points to
the newest. The model therefore keeps `doiConcept` and `doiVersion`
separate.

For TanabeSugano, three were in circulation, all resolving to the same
concept DOI:

| DOI | what | where |
|---|---|---|
| `10.5281/zenodo.3402463` | concept, all versions | now in the model |
| `10.5281/zenodo.7751230` | version 2023-03-20 | the repo's `CITATION.cff` — **outdated** |
| `10.5281/zenodo.22062396` | version 2026-08-22 | ORCID |
| `10.5281/zenodo.22070277` | version 2026-08-23, current | — |

The check therefore requires that **one** of the two is known to the
ORCID record, not both: ORCID as a rule carries one version, and requiring
both would build a check that turns red on every Zenodo project.

⚠️ **A Zenodo name search is not an enumeration.** `q="Anselm Hahn"` returns
seven records and leaves out precisely TanabeSugano and SpectraFit, whose
metadata carries the name differently. It therefore reports the holdings as
systematically too small, and silently at that. `npm run usage` therefore
starts **from the model's DOIs**, not from a name.

## Selection: hand-picked, with the evidenced numbers alongside

**What gets included is decided by the human.** An automatic rule would
here be either wrong or unsupported, and the measurement says why:

| Project | Stars | measured usage per month |
|---|---|---|
| `repo-release-tools` | **1** | **2230** PyPI downloads |
| `tanabesugano` | 21 | 1082 PyPI downloads |
| `mcp-server-analyzer` | 11 | 863 PyPI downloads |
| `spectrafit` | **36** | 557 PyPI downloads |
| `mcp-zen-of-languages` | 2 | 337 PyPI downloads |
| `bashplot` | 8 | 35 PyPI downloads |
| `moplots` | 1 | 13 PyPI downloads |
| `mcp-ai-agent-guidelines` | 6 | 6509 npm downloads |
| `vsplot` | 2 | 588 installs |
| `caligo-vscode-theme` | 0 | 65 installs, 501 downloads total |

Stars order this set almost inversely to usage. The most-downloaded Python
package has **one** star, the one with the most stars sits in fourth place.
Sorting by stars sorts by visibility instead of by impact.

**Three units, not one.** npm downloads, PyPI downloads and marketplace
installs measure different things and must not be weighed against one
another. The ordering in the model therefore only orders within one unit;
`npm run content` fails a violation of that.

**The first entry per category is exempt** and set editorially — it has to
state its reason in the field `orderRationale`. Without this exception, the
ordering would be a sort, not a statement.

`cupertino-focus` struck the weekly metrics cron, with explicitly named
costs — pinned repos drift from reality. This bill is paid with
`npm run usage`: **on call, not on its own.** The command fetches stars,
npm downloads and marketplace installs and writes them into the model with
date and source.

**Correction:** the first version said here "PyPI is deliberately left
out". That was wrong, and for the worst possible reason — it was a
carried-over note rather than a measurement of its own. `pypistats.org`
answers with **200**. The 429 is a rate limit that kicks in after about
five fast calls and clears after roughly 15 seconds; the right response to
it is waiting, not leaving it out. `npm run usage` therefore has a fallback
built in and measures all eight Python packages.

What stays left out is only `pepy.tech`: v2 answers 401 without a key, v1
answers 403. That is checked, not assumed.

## Listings are evidence, not measurements

`mcp-server-analyzer` is independently listed at
[MCP Market](https://mcpmarket.com/server/analyzer), filed under "Developer
Tools, Security & Testing". That sits in the field `listings`, not in
`usage` — and the difference is not pedantry: the same page states 11 stars
in its header and 0 in its generated feature list. Its numbers do not hold
up. What holds up is the listing itself: a third party decided that this
tool belongs in a directory.

`npm run content` fails a listing that carries a number along with it.

Four listings are entered:

| Project | where | notable |
|---|---|---|
| `mcp-server-analyzer` | MCP Market | contradicts itself: header states 11 stars, feature list 0 |
| `vsplot` | Visual Studio Marketplace | the URL carries the identifier lowercase, the API returns it capitalized — the authoritative form is `AnselmHahn.vsplot` |
| `repo-release-tools` | GitHub Marketplace | action "repo-release-tools policy checks" |
| `mcp2mcpb` | GitHub Marketplace | **under `build-mcpb-bundle`**, not under the repo name. Whoever searches for `mcp2mcpb` does not find the action |

## Two traps when fetching, both measured

**Zenodo answers Node with 403.** Not because of a rate limit, but because
Node's `fetch` sends no User-Agent on its own, and Zenodo rejects that.
`curl` sends one, which is why the same call worked on the command line but
not in the script. One header, no mystery — but without the cross-check it
would have looked like a block.

**The npm number moves.** On the first measurement, 6509, on the second,
5862 — same package, same script, two hours later.
`api.npmjs.org/downloads/point/last-month` is a sliding thirty-day window,
not a calendar month. That is exactly why every number carries its
**asOf**: without it, the smaller number would be a mystery instead of a
movement.

**A number without a source is an assertion** — `npm run content` fails on
that, it does not merely warn.

## Publications: live AND frozen

The page fetches ORCID at runtime and falls back to `publications.json`.
Both together, not just one of them: `cupertino-longevity` named the fetch
without a fallback as a vista trap, and the clock visibly runs — the API
version sits in the path (`v3.0`). If it moves, the page degrades to the
state of the last refresh, instead of showing an empty surface.
`loadPublications()` returns `origin: "live" | "fallback"`, so the surface
can say so too.

### Two dedup rules, because there are two cases

The original plan said "dedupe by DOI". That would have caught only the
first case. Measured against the 17 raw groups:

| Rule | Case | recognizable by |
|---|---|---|
| **R1** | `chemrxiv.15007941/v1` and `/v2` — versions of the same preprint | DOI, strip the version suffix |
| **R2** | `10.1021/acsomega.3c09262` against `chemrxiv-2023-cdrxf` — version of record against preprint | **the title alone**; the DOIs share nothing |

ORCID already groups by DOI. That the preprint still appears twice means:
two different DOIs for the same work. A pure DOI rule is blind to that.

The preprint does not disappear, it becomes the field `preprintOf`. The
prior publication belongs to the history, just not as a second entry.

**17 raw groups → 15 works.** Each rule fires exactly once.

## Commands

```
npm run orcid     Fetch ORCID, dedupe, write publications.json
npm run usage     Refresh stars and package numbers (no cron)
npm run content   Check the model against itself
```

`npm run content` separates **errors** from **notices**. Errors end with
exit 1: missing required fields, duplicate identifiers, a DOI that appears
in no ORCID work, a number without a source. Notices do not — they report
open points, not damage. A check that turns red on every open point gets
ignored.

## What is not here

- **Legal notice (Impressum).** The block is prepared in `profile.json` and
  unlinked. What is authoritative is the operator's seat, not the server
  location; GitHub hosting does not exempt you. For Switzerland, a purely
  private page carries no general obligation. Legal information, not legal
  advice.
- **LinkedIn and Google Scholar** are references, not data sources. Scholar
  has no official interface.
