// Rendered-page audit. Paste into the browser console, or inject it with a
// driver, against a served copy of the page. Returns a JSON summary.
//
// WHY IT IS NOT A NODE SCRIPT. Every question here is about what the BROWSER
// computed: which rule won the cascade, what a var() resolved to in this band,
// whether a figure is the one being displayed. A static parse of the CSS cannot
// answer any of them, and would give a confident wrong answer to all of them.
//
// COLOUR IS RESOLVED BY PAINTING IT, NOT BY PARSING IT. tokens/colors.css emits
// an oklch() override after each hex, and Chrome returns the computed colour in
// the same colour function it was authored in. A regex that pulls three numbers
// out of "oklch(0.4121 0.0083 97.5)" and calls them r, g, b produces contrast
// ratios around 1.03 for black text on white paper — which is what the first
// version of this audit did, and it read like a catastrophic accessibility
// failure rather than a broken checker. Painting one pixel and reading it back
// asks the engine the same question the reader's eye asks.
// FLIPPING THE BAND? WAIT FOR THE TRANSITION FIRST.
//
// components/interaction.css transitions `color` over
// --motion-quick (120ms). If you set data-theme and measure in the same tick,
// getComputedStyle returns the INTERPOLATED value, and it reports it as oklab()
// where a settled value reads oklch(). Measured mid-flight, the rail links and
// the toggle came back at 1.49:1 and 1.61:1 against their own ground — five
// contrast failures that did not exist, in exactly the elements that animate.
//
// So: await settle() after any theme change, before auditing. The tell that you
// forgot is an oklab() in the failure list.
const settle = () => new Promise((r) => setTimeout(r, 400));

(() => {
  const cv = document.createElement("canvas"); cv.width = cv.height = 1;
  const ctx = cv.getContext("2d", { willReadFrequently: true });
  const cache = new Map();
  const toRGB = (css) => {
    if (cache.has(css)) return cache.get(css);
    ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = "#000"; ctx.fillStyle = css; ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    const v = { r: d[0] / 255, g: d[1] / 255, b: d[2] / 255, a: d[3] / 255 };
    cache.set(css, v); return v;
  };
  // The same formula as _scripts/derive-tokens.mjs:17-32. If one moves, both move.
  const lin = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const lum = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const bgOf = (el) => {
    for (let e = el; e; e = e.parentElement) { const c = toRGB(getComputedStyle(e).backgroundColor); if (c.a > 0.01) return c; }
    return toRGB(getComputedStyle(document.body).backgroundColor);
  };
  const chroma = (c) => Math.max(c.r, c.g, c.b) - Math.min(c.r, c.g, c.b);

  const contrast = [], chromaHits = [], measure = [];
  let checked = 0; const seen = new Set();
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node; (node = walk.nextNode());) {
    if (!node.textContent.trim()) continue;
    const el = node.parentElement; if (!el || seen.has(el)) continue; seen.add(el);
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none") continue;
    // The image layer has its own floor (3:1, DESIGN.md) and is checked below.
    // .skip is off-screen until focused.
    if (el.closest(".figure") || el.closest("svg") || el.closest(".skip")) continue;
    checked++;
    const fg = toRGB(cs.color), bg = bgOf(el);
    const size = parseFloat(cs.fontSize), bold = +cs.fontWeight >= 700;
    const need = size >= 24 || (size >= 18.66 && bold) ? 3.0 : 4.5;
    const r = ratio(fg, bg);
    if (r < need) contrast.push(`${el.className || el.tagName} ${r.toFixed(2)} < ${need}`);
    // Chrome must stay monochrome: colour is admitted in the image layer only.
    if (chroma(fg) > 0.05) chromaHits.push(`${el.className || el.tagName} ${cs.color}`);
  }
  for (const el of document.querySelectorAll(".project-summary, .publication-title, .prose p, .capability-claim, .sheet-lead")) {
    const fs = parseFloat(getComputedStyle(el).fontSize);
    if (el.clientWidth > 34 * fs + 1) measure.push(`${el.className} ${Math.round(el.clientWidth)}px > ${Math.round(34 * fs)}px`);
  }

  // Image layer: every series at least 3:1 against the ground it is drawn on.
  const band = document.querySelector(".figure-dark") &&
    getComputedStyle(document.querySelector(".figure-dark")).display !== "none" ? "dark" : "light";
  const series = [];
  const holder = document.querySelector(`.figure-${band}`);
  if (holder) {
    const ground = toRGB(getComputedStyle(holder.querySelector("svg rect")).fill);
    for (const s of new Set([...holder.querySelectorAll("[stroke]")].map((e) => e.getAttribute("stroke")).filter((s) => s && s !== "none"))) {
      series.push({ stroke: s, vsGround: +ratio(toRGB(s), ground).toFixed(2) });
    }
  }

  return {
    band: `${document.documentElement.getAttribute("data-theme") || "system"} / ${matchMedia("(prefers-color-scheme: dark)").matches ? "os-dark" : "os-light"} / figures=${band}`,
    viewport: [window.innerWidth, window.innerHeight],
    textElementsChecked: checked,
    contrastFailures: contrast,
    chromaInChrome: chromaHits,
    measureViolations: measure,
    imageLayerSeries: series,
    boxShadows: [...document.querySelectorAll("*")].filter((e) => getComputedStyle(e).boxShadow !== "none").length,
    horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
    motion: ["--motion-quick", "--ease-standard"]
      .map((n) => `${n}=${getComputedStyle(document.documentElement).getPropertyValue(n).trim()}`),
    transitionDurations: [...new Set([...document.querySelectorAll("a, .toggle, .project, .rail a")]
      .map((e) => getComputedStyle(e).transitionDuration))],
  };
})();
