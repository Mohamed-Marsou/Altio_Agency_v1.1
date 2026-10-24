// =============================================================================
// ERROR LOG: THE BROWSER SIDE
// -----------------------------------------------------------------------------
//   logger.error("Could not open WhatsApp", { component: "ContactForm" })
//   logger.warn("Image failed to load", { component: "Hero" })
//   installGlobalHandlers()   // called once by <ErrorReporter/>: catches everything else
//
// Where the error goes:
//   - `npm run dev`: to the file writer (src/lib/logger/server.ts) -> logs/frontend-errors.txt
//   - production (static site): nowhere, unless NEXT_PUBLIC_ERROR_LOG_URL is set.
//     That variable is how the backend will receive errors later.
// Logging must NEVER break the page: every step is wrapped, nothing is thrown.
// =============================================================================
import type { LogLevel, LogPayload } from "./format";

const DEV_URL = "http://127.0.0.1:4001/log";

/** Where to send errors, or null when logging is off. */
export function getLogUrl(): string | null {
  if (process.env.NEXT_PUBLIC_ERROR_LOG_URL) return process.env.NEXT_PUBLIC_ERROR_LOG_URL;
  return process.env.NODE_ENV === "development" ? DEV_URL : null;
}

/** The base address of the logger (for the audit page). */
export function getLogBase(): string | null {
  const url = getLogUrl();
  return url ? url.replace(/\/log$/, "") : null;
}

// Protection against floods: an error inside a loop must not send thousands.
const MAX_PER_PAGE = 50;
const DEDUPE_MS = 2000;
let sent = 0;
const recent = new Map<string, number>();

export type LogOptions = {
  component?: string;
  source?: string;
  stack?: string;
};

/** First useful "file:line:col" and component name found in a stack trace. */
export function readStack(stack: string | undefined): { component?: string; file?: string } {
  if (!stack) return {};
  for (const line of stack.split("\n")) {
    if (line.includes("node_modules") || line.includes("/lib/logger/")) continue;
    // Chrome: "at Name (http://localhost:3000/_next/...:12:5)"   Firefox: "Name@http://..."
    const match = /(?:at\s+)?([A-Za-z_$][\w$.]*)?\s*[@(]?(?:https?:\/\/[^/]+)?([^\s()]+:\d+:\d+)\)?$/.exec(line.trim());
    if (match?.[2]) {
      const name = match[1];
      const isComponent = !!name && /^[A-Z]/.test(name);
      return { component: isComponent ? name : undefined, file: match[2] };
    }
  }
  return {};
}

function clientSummary(): string {
  const ua = navigator.userAgent;
  const browser =
    /Edg\/(\d+)/.exec(ua)?.[0].replace("Edg/", "Edge ") ??
    /Firefox\/(\d+)/.exec(ua)?.[0].replace("/", " ") ??
    /Chrome\/(\d+)/.exec(ua)?.[0].replace("/", " ") ??
    /Version\/(\d+).*Safari/.exec(ua)?.[1]?.replace(/^/, "Safari ") ??
    "unknown browser";
  return `${browser} · ${window.innerWidth}x${window.innerHeight} · ${document.documentElement.getAttribute("data-theme") ?? "light"}`;
}

function send(level: LogLevel, message: string, options: LogOptions = {}) {
  try {
    const url = getLogUrl();
    if (!url || typeof window === "undefined") return;

    const fromStack = readStack(options.stack);
    const component = options.component ?? fromStack.component ?? "unknown";

    // Same error twice within 2 seconds (React Strict Mode, loops): keep one.
    const key = `${level}|${component}|${message}`;
    const now = Date.now();
    if (now - (recent.get(key) ?? 0) < DEDUPE_MS) return;
    recent.set(key, now);
    if (++sent > MAX_PER_PAGE) return;

    const payload: LogPayload = {
      level,
      source: options.source ?? "manual",
      component,
      page: window.location.pathname, // path only, no query string
      message,
      file: fromStack.file,
      stack: options.stack,
      client: clientSummary(),
    };

    // text/plain avoids a CORS preflight request; the server reads it as JSON.
    void fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      // logger offline: ignore, never break the page
    });
  } catch {
    // ignore
  }
}

export const logger = {
  error(message: string, options?: LogOptions) {
    send("ERROR", message, options);
  },
  warn(message: string, options?: LogOptions) {
    send("WARN", message, options);
  },
  /** For catch blocks:  logger.exception(err, { component: "ContactForm" }) */
  exception(err: unknown, options: LogOptions = {}) {
    const error = err instanceof Error ? err : new Error(String(err));
    send("ERROR", `${error.name}: ${error.message}`, { ...options, stack: options.stack ?? error.stack });
  },
};

let installed = false;

/** Catches errors nobody handled: script errors, rejected promises, failed resources. */
export function installGlobalHandlers() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", (event) => {
    // Broken <img>, <script>, <link>: the event comes from the element, not from code.
    const target = event.target as HTMLElement | null;
    if (target && target !== (window as unknown as HTMLElement) && target.tagName) {
      const src = (target as HTMLImageElement).src || (target as HTMLLinkElement).href || "";
      send("WARN", `Resource failed to load: <${target.tagName.toLowerCase()}> ${src.replace(window.location.origin, "")}`, {
        source: "resource-error",
        component: target.tagName.toLowerCase(),
      });
      return;
    }
    send("ERROR", event.message || "Unknown script error", {
      source: "window.onerror",
      stack: event.error instanceof Error ? event.error.stack : `at ${event.filename}:${event.lineno}:${event.colno}`,
    });
  }, true);

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const error = reason instanceof Error ? reason : new Error(typeof reason === "string" ? reason : JSON.stringify(reason));
    send("ERROR", `Unhandled promise rejection: ${error.message}`, { source: "unhandledrejection", stack: error.stack });
  });
}
