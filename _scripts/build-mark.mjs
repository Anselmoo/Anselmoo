#!/usr/bin/env node
// Emit the decided mark as a real file.
//
// Until 2026-09-11 there was no assets/mark.svg, and rightly so: three candidates were
// in play and a file would have implied a decision that had not been made. Now that the
// bend is chosen, the file is the natural form — a favicon, a README image and a print
// asset all want a file rather than a path string pasted from a module.
//
// GENERATED from assets/mark.mjs, never drawn. The module holds the geometry and the
// measurement that justifies it; a hand-drawn copy would be a second source that drifts.
//
// Two variants, and the second one is the interesting one:
//   mark.svg          fills with currentColor, so the surrounding text colour decides
//                     the band. One file for both, no <picture> pairing needed — which
//                     is exactly what the iconography rule asks for wherever 3:1 suffices.
//   mark-ink.svg      fills with the literal ink of the light band, for contexts that
//                     cannot inherit a colour (a favicon link, an OG image).

import { writeFileSync, readFileSync } from "node:fs";
import { CHOSEN, markPath, VB, measure } from "../assets/mark.mjs";

const tokens = JSON.parse(readFileSync("tokens/tokens.json", "utf8"));
const ink = tokens.bands.light.roles.ink;
const d = markPath();

const svg = (fill, title) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VB} ${VB}" role="img" aria-label="${title}">`
  + `<title>${title}</title>`
  + `<path d="${d}" fill-rule="evenodd" fill="${fill}"/></svg>\n`;

writeFileSync("assets/mark.svg", svg("currentColor", "Mark"));
writeFileSync("assets/mark-ink.svg", svg(ink, "Mark"));

const m = measure(CHOSEN, 512);
console.log(`assets/mark.svg and assets/mark-ink.svg written — "${CHOSEN}"`);
console.log(`  ink coverage   ${(m.coverage * 100).toFixed(2)} %   (50 % means it weighs the same in both bands)`);
console.log(`  self-inversion ${(m.selfInverse * 100).toFixed(3)} %   (0 % means rotating it yields its own complement)`);
console.log(`  rotational     ${(m.rotational * 100).toFixed(3)} %   (deliberately NOT 0: point symmetry and self-inversion exclude each other)`);
