// =============================================================================
// ERROR LOG: THE FILE WRITER  (runs only inside `npm run dev`, never in the browser)
// -----------------------------------------------------------------------------
// A browser cannot write a file on your disk. So while you develop, the Next dev
// server also opens a tiny HTTP server on 127.0.0.1:4001 (started from
// src/instrumentation.ts). The browser sends each error there, and this file
// appends it to  logs/frontend-errors.txt  in the web project.
//
//   POST /log        add one entry (JSON text in the body)
//   GET  /logs       the entries as JSON (the dashboard "Audit log" page)
//   GET  /logs.txt   the raw text file (download)
//
// Safety: it listens on 127.0.0.1 only (not reachable from the network), accepts
// only our own dev origins, caps the body size, rate-limits, and cleans every
// field before writing (see format.ts).
//
// The SAME server also carries the dashboard dev API (/api/..., see
// lib/admin/devApi.ts): create, edit and delete posts, projects and pictures.
// =============================================================================
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { appendFileSync, existsSync, mkdirSync, readFileSync, renameSync, statSync, utimesSync } from "node:fs";
import path from "node:path";
import { createAuth } from "../admin/auth";
import { handleApi, maxBodyBytes } from "../admin/devApi";
import { createStore } from "../admin/store";
import { formatEntry, formatTime, parseLog, sanitizePayload, type LogEntry, type LogPayload } from "./format";

const PORT = Number(process.env.ERROR_LOG_PORT ?? 4001);
const LOG_FILE = process.env.ERROR_LOG_FILE ?? path.join(process.cwd(), "logs", "frontend-errors.txt");
const MAX_BODY = 16 * 1024; // 16 KB
const MAX_FILE = 2 * 1024 * 1024; // 2 MB, then the file is archived and a new one starts
const MAX_PER_SECOND = 20;

// Only pages served by our own dev servers may talk to the logger.
const ALLOWED_ORIGINS = new Set([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
]);

// The dashboard login. ADMIN_PASSWORD_HASH comes from apps/web/.env.local (made by
// `npm run admin:password`). It stays in this server's memory and never reaches the browser.
// Without it there is no login (your own computer only).
const auth = createAuth({ hash: process.env.ADMIN_PASSWORD_HASH });

function bearerToken(req: IncomingMessage): string | null {
  return /^Bearer (\S+)$/.exec(String(req.headers.authorization ?? ""))?.[1] ?? null;
}

const unauthorized = (res: ServerResponse) =>
  send(res, 401, JSON.stringify({ error: { code: "UNAUTHORIZED", message: "Please log in." } }));

let nextId = 1;
let windowStart = 0;
let windowCount = 0;

function ensureFile() {
  mkdirSync(path.dirname(LOG_FILE), { recursive: true });
  if (!existsSync(LOG_FILE)) return;
  if (statSync(LOG_FILE).size < MAX_FILE) return;
  // Too big: keep it as an archive next to the file, start a fresh one.
  const stamp = formatTime(new Date()).replace(/[: ]/g, "-").replace("+", "p");
  renameSync(LOG_FILE, LOG_FILE.replace(/\.txt$/, `.${stamp}.txt`));
  nextId = 1;
}

/** Appends one error to the txt file. Also used directly by instrumentation.ts. */
export function writeLog(payload: LogPayload): LogEntry {
  ensureFile();
  const entry: LogEntry = { ...payload, id: nextId++, time: formatTime(new Date()) };
  appendFileSync(LOG_FILE, formatEntry(entry), "utf8");
  return entry;
}

function readEntries(): LogEntry[] {
  return existsSync(LOG_FILE) ? parseLog(readFileSync(LOG_FILE, "utf8")) : [];
}

function cors(req: IncomingMessage, res: ServerResponse) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
}

function send(res: ServerResponse, status: number, body: string, type = "application/json") {
  res.writeHead(status, { "Content-Type": `${type}; charset=utf-8`, "Cache-Control": "no-store" });
  res.end(body);
}

function readBody(req: IncomingMessage, limit = MAX_BODY): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error("too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function handle(req: IncomingMessage, res: ServerResponse) {
  const origin = req.headers.origin;
  // Browsers always send Origin on POST; refuse anything from an unknown site.
  if (origin && !ALLOWED_ORIGINS.has(origin)) return send(res, 403, '{"error":"origin not allowed"}');
  cors(req, res);

  const url = (req.url ?? "").split("?")[0];

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return send(res, 204, "");
  }

  // The dashboard API. Anything that changes data must come from one of our own pages.
  if (url.startsWith("/api/")) {
    if (req.method !== "GET" && !origin) return send(res, 403, JSON.stringify({ error: { code: "ORIGIN_REQUIRED", message: "Missing origin." } }));

    // ---- login (public) ----
    if (url === "/api/session" && req.method === "GET") {
      return send(res, 200, JSON.stringify({ required: auth.required, authenticated: auth.validate(bearerToken(req)) }));
    }
    if (url === "/api/login" && req.method === "POST") {
      readBody(req, 2048)
        .then((raw) => {
          const password = String((JSON.parse(raw.toString("utf8")) as { password?: unknown }).password ?? "");
          const result = auth.login(password, req.socket.remoteAddress ?? "unknown");
          if (result.ok) return send(res, 200, JSON.stringify({ token: result.token, expiresAt: result.expiresAt }));
          const message = result.code === "TOO_MANY_ATTEMPTS" ? `Too many wrong tries. Try again in ${Math.ceil((result.retryAfterSeconds ?? 60) / 60)} minute(s).` : "Wrong password.";
          if (result.retryAfterSeconds) res.setHeader("Retry-After", String(result.retryAfterSeconds));
          send(res, result.status, JSON.stringify({ error: { code: result.code, message } }));
        })
        .catch(() => send(res, 400, JSON.stringify({ error: { code: "BAD_REQUEST", message: "Could not read the request." } })));
      return;
    }
    if (url === "/api/logout" && req.method === "POST") {
      auth.logout(bearerToken(req));
      return send(res, 200, '{"ok":true}');
    }

    // ---- everything else needs a session (when a password is set) ----
    if (url !== "/api/health" && !auth.validate(bearerToken(req))) return unauthorized(res);
    void handleApiHttp(req, res, url);
    return;
  }

  if (req.method === "POST" && url === "/log") {
    const now = Date.now();
    if (now - windowStart > 1000) {
      windowStart = now;
      windowCount = 0;
    }
    if (++windowCount > MAX_PER_SECOND) return send(res, 429, '{"error":"too many"}');

    readBody(req)
      .then((raw) => {
        const entry = writeLog(sanitizePayload(JSON.parse(raw.toString("utf8"))));
        send(res, 201, JSON.stringify({ ok: true, id: entry.id }));
      })
      .catch(() => send(res, 400, '{"error":"bad request"}'));
    return;
  }

  if (req.method === "GET" && (url === "/logs" || url === "/logs.txt") && !auth.validate(bearerToken(req))) return unauthorized(res);

  if (req.method === "GET" && url === "/logs") {
    const entries = readEntries().reverse(); // newest first
    return send(res, 200, JSON.stringify({ file: path.relative(process.cwd(), LOG_FILE), entries }));
  }

  if (req.method === "GET" && url === "/logs.txt") {
    const text = existsSync(LOG_FILE) ? readFileSync(LOG_FILE, "utf8") : "";
    return send(res, 200, text, "text/plain");
  }

  send(res, 404, '{"error":"not found"}');
}

// Connects the dev API (plain functions) to the network.
// Next.js remembers the list of article and project addresses of a page and does not notice
// that a JSON file changed. After every save we "touch" the page files, which makes the dev
// server rebuild that list: a new post or project then opens at once (and a deleted one stops).
const TOUCH = [
  path.join(process.cwd(), "src", "app", "(site)", "[locale]", "blog", "[slug]", "page.tsx"),
  path.join(process.cwd(), "src", "app", "(site)", "[locale]", "work", "[slug]", "page.tsx"),
];

const store = createStore({
  contentDir: path.join(process.cwd(), "src", "content"),
  publicDir: path.join(process.cwd(), "public"),
  onChange(kind) {
    if (kind === "media") return;
    const now = new Date();
    for (const file of TOUCH) {
      try {
        utimesSync(file, now, now);
      } catch {
        // not fatal: the list refreshes at the next restart
      }
    }
  },
});

async function handleApiHttp(req: IncomingMessage, res: ServerResponse, url: string) {
  const method = req.method ?? "GET";
  try {
    const limit = maxBodyBytes(method, url);
    const declared = Number(req.headers["content-length"] ?? 0);
    if (declared > limit) {
      req.resume(); // read and drop the body so the browser can read our answer
      return send(res, 413, JSON.stringify({ error: { code: "TOO_LARGE", message: "The file is too large." } }));
    }
    const body = method === "GET" || method === "DELETE" ? Buffer.alloc(0) : await readBody(req, limit);
    const query = new URL(req.url ?? "/", "http://localhost").searchParams;
    const result = await handleApi(store, { method, path: url, query, body });
    send(res, result.status, JSON.stringify(result.body));
  } catch {
    send(res, 413, JSON.stringify({ error: { code: "TOO_LARGE", message: "The request is too large." } }));
  }
}

type GlobalWithLogger = typeof globalThis & { __altioLoggerStarted?: boolean };

/** Starts the logger once per dev session (Next may call register() more than once). */
export function startLogServer() {
  const g = globalThis as GlobalWithLogger;
  if (g.__altioLoggerStarted) return;
  g.__altioLoggerStarted = true;

  try {
    ensureFile();
    // Continue numbering after the last entry already in the file.
    const existing = readEntries();
    nextId = (existing[existing.length - 1]?.id ?? 0) + 1;
  } catch {
    // an unreadable file must not stop the dev server
  }

  const server = createServer(handle);
  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.warn(`[error-logger] port ${PORT} is already in use, file logging is off for this run.`);
    } else {
      console.warn("[error-logger] could not start:", err.message);
    }
  });
  server.listen(PORT, "127.0.0.1", () => {
    console.log(`[error-logger] writing browser errors to ${path.relative(process.cwd(), LOG_FILE)} (http://127.0.0.1:${PORT})`);
  });
  server.unref(); // never keeps the process alive on its own
}
