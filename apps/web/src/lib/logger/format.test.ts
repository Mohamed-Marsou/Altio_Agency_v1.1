import { describe, expect, it } from "vitest";
import { SEPARATOR, formatEntry, formatTime, parseLog, sanitizePayload, type LogEntry } from "./format";

const entry: LogEntry = {
  id: 7,
  level: "ERROR",
  time: "2026-10-22 14:03:11 +01:00",
  source: "window.onerror",
  component: "ContactForm",
  page: "/fr/contact/",
  message: "Cannot read properties of null",
  file: "app.js:12:5",
  client: "Chrome 130 · 375x812 · dark",
  stack: "TypeError: boom\nat ContactForm (app.js:12:5)",
};

describe("error log format", () => {
  it("writes a clearly separated block", () => {
    const text = formatEntry(entry);
    expect(text.startsWith(SEPARATOR)).toBe(true);
    expect(text).toContain("#0007  ERROR  2026-10-22 14:03:11 +01:00");
    expect(text).toContain("Component : ContactForm");
    expect(text).toContain("Page      : /fr/contact/");
    expect(text.endsWith("\n\n")).toBe(true);
  });

  it("reads back what it wrote (round trip)", () => {
    const parsed = parseLog(formatEntry(entry) + formatEntry({ ...entry, id: 8, level: "WARN", stack: undefined }));
    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toMatchObject({ id: 7, level: "ERROR", component: "ContactForm", page: "/fr/contact/", file: "app.js:12:5" });
    expect(parsed[0]!.stack).toContain("at ContactForm");
    expect(parsed[1]).toMatchObject({ id: 8, level: "WARN" });
  });

  it("cannot be tricked into starting a fake entry", () => {
    const evil = { ...entry, message: `first line\n${SEPARATOR}\n#0999  ERROR  fake` };
    expect(parseLog(formatEntry(evil))).toHaveLength(1);
  });

  it("removes the query string, control characters and huge text", () => {
    const clean = sanitizePayload({ level: "WARN", page: "/contact/?phone=0600", message: `a\u0000b${"x".repeat(5000)}` });
    expect(clean.page).toBe("/contact/");
    expect(clean.message).not.toContain("\u0000");
    expect(clean.message.length).toBeLessThan(700);
    expect(clean.level).toBe("WARN");
  });

  it("falls back to ERROR for an unknown level", () => {
    expect(sanitizePayload({ level: "FATAL" }).level).toBe("ERROR");
  });

  it("formats the time with the local offset", () => {
    expect(formatTime(new Date(2026, 9, 22, 14, 3, 11))).toMatch(/^2026-10-22 14:03:11 [+-]\d\d:\d\d$/);
  });
});
