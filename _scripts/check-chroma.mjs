import { readFileSync } from "node:fs";
import { converter, parse } from "culori";
const ok = converter("oklch");
const files = process.argv.slice(2); let bad = 0; const byFile = [];
// rgb()/rgba() in either syntax — "35 35 32 / 0.03" or "35, 35, 32, 0.03". Alpha is
// dropped: a translucent tint is still a tint. Percent channels are scaled to 0–255.
const RGB = /rgba?\(\s*([\d.]+%?)[\s,]+([\d.]+%?)[\s,]+([\d.]+%?)/g;
const channel = v => Math.round(v.endsWith("%") ? parseFloat(v) * 2.55 : parseFloat(v));
const toHex = (r, g, b) => "#" + [r, g, b].map(n => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0")).join("");
for (const f of files) {
  let s = readFileSync(f, "utf8"); if (f.endsWith(".css")) s = s.replace(/\/\*[\s\S]*?\*\//g, "");
  const found = new Map((s.match(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g) || []).map(h => [h, h]));
  for (const m of s.matchAll(RGB)) found.set(m[0] + ")", toHex(channel(m[1]), channel(m[2]), channel(m[3])));
  const hot = [...found].map(([lit, h]) => [lit, ok(parse(h))?.c ?? 0]).filter(([, c]) => c > 0.004);
  if (hot.length) { bad++; byFile.push(`${f}  max c ${Math.max(...hot.map(x => x[1])).toFixed(3)}  ${hot.slice(0,4).map(x=>x[0]).join(" ")}`); }
}
console.log(byFile.join("\n")); console.log(`${bad}/${files.length} files carry chroma > 0.004`);
