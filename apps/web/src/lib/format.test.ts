import { describe, expect, it } from "vitest";
import { formatDate } from "./format";

describe("formatDate", () => {
  it("writes the date the local way", () => {
    expect(formatDate("2026-03-12", "en")).toBe("Mar 12, 2026");
    expect(formatDate("2026-03-12", "fr")).toMatch(/12 mars 2026/);
  });

  it("uses Western digits in Arabic", () => {
    const text = formatDate("2026-03-12", "ar");
    expect(text).toMatch(/12/);
    expect(text).toMatch(/2026/);
  });

  it("does not move the day with the time zone", () => {
    expect(formatDate("2026-01-01", "en")).toBe("Jan 1, 2026");
  });
});
