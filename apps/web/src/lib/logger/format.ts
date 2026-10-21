// =============================================================================
// ERROR LOG: FORMAT (shared by the browser and the server)
// -----------------------------------------------------------------------------
// Pure functions only (no browser or Node APIs), so they are easy to unit test.
//   formatEntry(entry)  -> the text block written to the .txt file
//   parseLog(text)      -> the entries read back from the file (audit page)
// Every entry starts with a long "=====" line, so two errors can never be
// confused, even when the message or stack has several lines.
// =============================================================================

export type LogLevel = "ERROR" | "WARN";

/** What the browser sends. Everything is plain text. */
export type LogPayload = {
  level: LogLevel;
  /** where it was caught: window.onerror, unhandledrejection, react-error-boundary, ... */
  source: string;
  /** the component (or function) that caused it, best effort */
  component: string;
  /** page path only, never the query string (it may hold personal data) */
  page: string;
  message: string;
  /** "file:line:col" of the first line of OUR code in the stack */
  file?: string;
  stack?: string;
  /** short browser and screen summary, e.g. "Chrome 130 · 375x812" */
  client?: string;
};

/** What is stored: the payload plus the id and the time added by the server. */
export type LogEntry = LogPayload & {
  id: number;
  /** "2026-10-22 14:03:11 +01:00" (machine local time) */
  time: string;
};

export const SEPARATOR = "=".repeat(80);
const THIN = "-".repeat(80);
const LABEL_WIDTH = 10; // "Component " is the longest label

// Limits so one bad error cannot fill the disk.
const MAX_FIELD = 600;
const MAX_STACK = 4000;

/** Remove control characters and cut to a maximum length. */
function clean(value: unknown, max: number): string {
  const text = typeof value === "string" ? value : String(value ?? "");
  const noControl = text.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "");
  return noControl.length > max ? `${noControl.slice(0, max)}… [cut]` : noControl;
}

/** A line that looks like our separator would split an entry in two: indent it. */
function safeLine(line: string): string {
  return line.startsWith("====") ? ` ${line}` : line;
}

function indentLines(text: string, spaces: number): string {
  const pad = " ".repeat(spaces);
  return text
    .split(/\r?\n/)
    .map((line, i) => (i === 0 ? safeLine(line) : pad + safeLine(line)))
    .join("\n");
}

function field(label: string, value: string): string {
  return `${label.padEnd(LABEL_WIDTH)}: ${indentLines(value, LABEL_WIDTH + 2)}`;
}

/** Turns a Date into "2026-10-22 14:03:11 +01:00" in the machine's local time. */
export function formatTime(date: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  const offsetMin = -date.getTimezoneOffset();
  const sign = offsetMin >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMin);
  return (
    `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())} ` +
    `${p(date.getHours())}:${p(date.getMinutes())}:${p(date.getSeconds())} ` +
    `${sign}${p(Math.floor(abs / 60))}:${p(abs % 60)}`
  );
}

/** Cleans an incoming payload (it comes from the network, so it is never trusted). */
export function sanitizePayload(input: Partial<Record<keyof LogPayload, unknown>>): LogPayload {
  const level: LogLevel = input.level === "WARN" ? "WARN" : "ERROR";
  return {
    level,
    source: clean(input.source || "unknown", 80),
    component: clean(input.component || "unknown", 120),
    page: clean(String(input.page ?? "").split(/[?#]/)[0] || "unknown", 200),
    message: clean(input.message || "(no message)", MAX_FIELD),
    file: input.file ? clean(input.file, 300) : undefined,
    stack: input.stack ? clean(input.stack, MAX_STACK) : undefined,
    client: input.client ? clean(input.client, 120) : undefined,
  };
}

/** The exact text block appended to the .txt file for one entry. */
export function formatEntry(entry: LogEntry): string {
  const lines = [
    SEPARATOR,
    `#${String(entry.id).padStart(4, "0")}  ${entry.level}  ${entry.time}`,
    THIN,
    field("Component", entry.component),
    field("Source", entry.source),
    field("Page", entry.page),
    field("Message", entry.message),
  ];
  if (entry.file) lines.push(field("File", entry.file));
  if (entry.client) lines.push(field("Client", entry.client));
  if (entry.stack) {
    lines.push("Stack     :");
    lines.push(...entry.stack.split(/\r?\n/).map((l) => `    ${safeLine(l.trim())}`));
  }
  return `${lines.join("\n")}\n\n`;
}

/** Reads the .txt file back into entries (newest last). Unknown blocks are skipped. */
export function parseLog(text: string): LogEntry[] {
  const entries: LogEntry[] = [];
  const blocks = text.split(new RegExp(`^${SEPARATOR}$`, "m")).slice(1);

  for (const block of blocks) {
    const lines = block.split(/\r?\n/);
    const header = /^#(\d+)\s+(ERROR|WARN)\s+(.+)$/.exec(lines[1] ?? "");
    if (!header) continue;

    const values: Record<string, string> = {};
    const stack: string[] = [];
    let current = "";
    let inStack = false;

    for (const line of lines.slice(3)) {
      const label = /^([A-Za-z]+)\s*:\s?(.*)$/.exec(line);
      if (!inStack && label && ["Component", "Source", "Page", "Message", "File", "Client", "Stack"].includes(label[1]!)) {
        current = label[1]!.toLowerCase();
        if (current === "stack") {
          inStack = true;
        } else {
          values[current] = label[2] ?? "";
        }
      } else if (inStack) {
        if (line.trim()) stack.push(line.trim());
      } else if (current && line.trim()) {
        // continuation of a multi-line value
        values[current] = `${values[current] ?? ""}\n${line.trim()}`;
      }
    }

    entries.push({
      id: Number(header[1]),
      level: header[2] as LogLevel,
      time: header[3]!.trim(),
      component: values.component ?? "unknown",
      source: values.source ?? "unknown",
      page: values.page ?? "unknown",
      message: values.message ?? "",
      file: values.file,
      client: values.client,
      stack: stack.length ? stack.join("\n") : undefined,
    });
  }
  return entries;
}
