// =============================================================================
// A tiny static web server for the BUILT site (out/). It behaves like Hostinger:
//   /fr/blog/        -> out/fr/blog/index.html
//   unknown address  -> out/404.html with the status 404
// Used by the end-to-end tests, Lighthouse and the smoke test.
//   node scripts/serve-out.mjs [port]      (default 4173)
// =============================================================================
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "out");

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

/** Finds the file for an address, like a normal web server would. */
export function resolveFile(urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0].split("#")[0]);
  const target = path.normalize(path.join(root, clean));
  if (!target.startsWith(root)) return null; // never leave out/
  if (existsSync(target) && statSync(target).isFile()) return target;
  const index = path.join(target, "index.html");
  return existsSync(index) ? index : null;
}

export function startServer(port = 4173) {
  const server = createServer((req, res) => {
    const file = resolveFile(req.url ?? "/");
    const notFound = !file;
    const target = file ?? path.join(root, "404.html");
    const type = TYPES[path.extname(target)] ?? "application/octet-stream";
    let body = readFileSync(target);
    const headers = { "Content-Type": type, "Cache-Control": target.includes("_next/static") ? "public, max-age=31536000, immutable" : "no-cache" };
    // Compress text files like the real server does, so speed tests are honest.
    if (/text|javascript|json|xml|svg/.test(type) && String(req.headers["accept-encoding"] ?? "").includes("gzip")) {
      body = gzipSync(body);
      headers["Content-Encoding"] = "gzip";
    }
    res.writeHead(notFound ? 404 : 200, headers);
    res.end(body);
  });
  return new Promise((resolve) => server.listen(port, "127.0.0.1", () => resolve(server)));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.argv[2] ?? 4173);
  await startServer(port);
  console.log(`Serving out/ at http://127.0.0.1:${port}`);
}
