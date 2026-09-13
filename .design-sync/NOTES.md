# design-sync notes

Standing corrections from the owner. Read before any sync.

- **The Claude Design project is the reference.** Direction is pull: local is overwritten
  from the project. Local changes go back to the project only as an explicit fix.
- **Not a component package.** No React bundle, no `dist/`, no Storybook. The project
  holds guideline cards (`@dsCard` first line), tokens, scripts and imagery. Never run the
  design-sync converter on this repo; there is deliberately no `pkg` in `config.json`.
- **No colour at all.** Black, grey and white only, everywhere — paper, ink, imagery, hero.
  Series and layers are told apart by lightness **and a pattern** (solid, hatch, dots).
  Any hex with OKLCH chroma above 0.004 is a defect.
- **English only.** Content, code, comments, file names and docs. The reference's
  `package.json` description arrived in German and was translated.
- **Not pulled into the repo:** `uploads/` and `screenshots/` (private evidence, public
  profile repo), `*.png`, `_ds_manifest.json` (compiled by the app), `.thumbnail`.
  Generated imagery is rebuilt locally, not copied.
- **Retired locally 2026-09-13, still in the reference: skip on a pull.** `mockup/`,
  `github.md`, `_adherence.oxlintrc.json`, `design-handbook_summary.json`, `GLOSSARY.md`
  (folded into `LEXICON.md`), `_scripts/build-page.mjs` and `_scripts/preview-readme.mjs`
  (the page is now `index.html`, rendered from the template by `_scripts/build-index.mjs`),
  and eight decided candidate cards: `guidelines/brand-mark-candidates`, `-knot`, `-peak`,
  `brand-cover-figure`, `motion-cover-candidates`, `motion-hero-candidates`,
  `motion-hero-figures`, `figure-studies`.
- **Push back writes changed paths only, never deletes** — the project holds work that
  does not exist locally.
- **DesignSync is main-session only.** Subagents cannot load it; a parallel download
  through agents fails with "No matching deferred tools found".
