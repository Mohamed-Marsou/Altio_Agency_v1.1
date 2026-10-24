import { describe, expect, it } from "vitest";
import { findPlaceholders, walkStrings } from "./check-site-data.mjs";

describe("placeholder detection", () => {
  it.each([
    ["hello@yourdomain.ma", "fake email domain"],
    ["WhatsApp: +212 6 00 00 00 00", "fake phone number"],
    ["212600000000", "fake phone number"],
    ["TODO write this", "TODO marker"],
    ["Add stack · year · result", "unfinished sentence"],
  ])("finds %s", (text, name) => {
    expect(findPlaceholders(text)).toContain(name);
  });

  it("accepts real-looking values and format hints", () => {
    expect(findPlaceholders("+212 6XX XX XX XX")).toEqual([]);
    expect(findPlaceholders("contact@altio.ma")).toEqual([]);
    expect(findPlaceholders("+212 661 23 45 67")).toEqual([]);
  });

  it("walks every string with its path", () => {
    const found = [...walkStrings({ a: "x", b: [{ c: "y" }] })];
    expect(found).toEqual([["a", "x"], ["b[0].c", "y"]]);
  });
});
