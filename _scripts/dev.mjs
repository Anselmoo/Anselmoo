#!/usr/bin/env node
// npm run dev — build index.html, serve the repository, rebuild on change, reload.
//
// No dependencies: node:http serves, fs.watch (recursive, macOS and Linux on Node 20+)
// watches, and a Server-Sent Events stream tells the open tab to reload. The reload
// snippet is injected into HTML RESPONSES only; nothing on disk carries it, so the
// built index.html stays exactly what build-index.mjs wrote.
//
// Two kinds of change:
//   an input of build-index.mjs   -> rebuild index.html, then reload
//   anything else (css, svg, a guideline card, …) -> reload only; the browser
//                                    re-reads it, there is nothing to build
// The heavier generators (tokens, imagery, hero, figures, og) are NOT run on change:
// they take seconds and rewrite dozens of files. Run `npm run build` for those.
//
// Usage:  node _scripts/dev.mjs      PORT=9000 node _scripts/dev.mjs

import { createServer } from "node:http";
import { watch, createReadStream, readFileSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, dirname, extname, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.PORT) || 8742;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".md": "text/plain; charset=utf-8",
  ".csv": "text/plain; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

// What build-index.mjs reads. Keep in step with its imports and read() calls.
const REBUILD = [
  /^templates\//,
  /^content\/(?:profile|motivation)\.json$/,
  /^_scripts\/build-index\.mjs$/,
  /^lib\/render\.mjs$/,
];
const IGNORE = /^(?:\.git|node_modules)(?:\/|$)|^index\.html$|\.DS_Store$|~$|\.sw[px]$/;

function build() {
  const r = spawnSync(process.execPath, [join(ROOT, "_scripts/build-index.mjs")], {
    cwd: ROOT,
    encoding: "utf8",
  });
  if (r.status === 0) {
    process.stdout.write(`dev: ${r.stdout}`);
    return true;
  }
  process.stderr.write(r.stderr || r.stdout);
  return false;
}

// ------------------------------------------------------------------ Reload

const clients = new Set();
const RELOAD = `<script>new EventSource("/__dev/reload").onmessage = () => location.reload();</script>`;
const notify = (what) => { for (const res of clients) res.write(`data: ${what}\n\n`); };

// ------------------------------------------------------------------ Server

const server = createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");

  if (url.pathname === "/__dev/reload") {
    res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
    res.write(": connected\n\n");
    clients.add(res);
    req.on("close", () => clients.delete(res));
    return;
  }

  let rel = decodeURIComponent(url.pathname);
  if (rel.endsWith("/")) rel += "index.html";
  const abs = normalize(join(ROOT, rel));
  if (abs !== ROOT && !abs.startsWith(ROOT + sep)) return res.writeHead(403).end();

  let stat;
  try { stat = statSync(abs); } catch {
    return res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end(`404 ${rel}`);
  }
  if (stat.isDirectory()) return res.writeHead(301, { Location: `${url.pathname}/` }).end();

  const type = TYPES[extname(abs)] || "application/octet-stream";
  const headers = { "Content-Type": type, "Cache-Control": "no-store" };
  if (type.startsWith("text/html")) {
    const html = readFileSync(abs, "utf8");
    const at = html.lastIndexOf("</body>");
    return res.writeHead(200, headers).end(at < 0 ? html + RELOAD : html.slice(0, at) + RELOAD + html.slice(at));
  }
  res.writeHead(200, headers);
  createReadStream(abs).pipe(res);
});

server.on("error", (e) => {
  console.error(e.code === "EADDRINUSE" ? `dev: port ${PORT} is in use. Stop the other server or set PORT.` : e);
  process.exit(1);
});

// ------------------------------------------------------------------- Watch

let timer = null;
let pending = { rebuild: false, files: new Set() };

function flush() {
  const { rebuild, files } = pending;
  pending = { rebuild: false, files: new Set() };
  const list = [...files].join(", ");
  // A failed rebuild keeps serving the last good index.html and does not reload:
  // the error is in this terminal, and the tab keeps showing a working page.
  if (rebuild && !build()) return;
  console.log(`dev: reload (${list})`);
  notify(list);
}

build();
watch(ROOT, { recursive: true }, (_event, name) => {
  if (!name) return;
  const rel = name.split(sep).join("/");
  if (IGNORE.test(rel)) return;
  if (REBUILD.some((r) => r.test(rel))) pending.rebuild = true;
  pending.files.add(rel);
  clearTimeout(timer);
  timer = setTimeout(flush, 80);
});

server.listen(PORT, () => {
  console.log(`dev: http://localhost:${PORT}/ — watching ${ROOT}`);
});
