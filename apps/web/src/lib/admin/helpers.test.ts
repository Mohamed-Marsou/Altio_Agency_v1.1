import { describe, expect, it } from "vitest";
import { BLOCK_LABELS, caseTemplate, emptyBlock, emptyPost, emptyProject, formatBytes, pickVariant, sectionId, slugify } from "./helpers";
import { caseSchema, postRecordSchema, slugSchema, type MediaEntry } from "./schemas";

describe("slugify", () => {
  it.each([
    ["Hello World! 2026", "hello-world-2026"],
    ["  Café  Médina  ", "cafe-medina"],
    ["7 things your site needs", "7-things-your-site-needs"],
    ["--already--dashed--", "already-dashed"],
    ["", ""],
    ["مقالي", ""],
  ])("%j -> %j", (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });

  it("cuts very long titles", () => {
    expect(slugify("a".repeat(200)).length).toBeLessThanOrEqual(60);
  });

  it("produces addresses the server accepts", () => {
    expect(slugSchema.safeParse(slugify("My first post")).success).toBe(true);
  });
});

describe("section ids", () => {
  it("comes from the title, or section-N when the title has no latin letters", () => {
    expect(sectionId("Fast on a phone", 1)).toBe("fast-on-a-phone");
    expect(sectionId("سريع على الهاتف", 2)).toBe("section-3");
  });
});

describe("formatBytes", () => {
  it("writes sizes people understand", () => {
    expect(formatBytes(500)).toBe("500 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});

describe("pickVariant", () => {
  const media = { variants: [{ width: 1600, path: "c", bytes: 1 }, { width: 480, path: "a", bytes: 1 }, { width: 960, path: "b", bytes: 1 }] } as MediaEntry;
  it("gives the smallest picture that is big enough", () => {
    expect(pickVariant(media, 480)?.path).toBe("a");
    expect(pickVariant(media, 700)?.path).toBe("b");
    expect(pickVariant(media, 5000)?.path).toBe("c");
  });
});

describe("starting points for new items", () => {
  it("a new post has three languages and one empty paragraph", () => {
    const post = emptyPost();
    expect(Object.keys(post.i18n)).toEqual(["en", "fr", "ar"]);
    expect(post.i18n.en.body).toHaveLength(1);
    expect(postRecordSchema.safeParse(post).success).toBe(false); // empty fields are refused until filled
  });

  it("the case study template is valid, so a new project can be saved after the words are written", () => {
    expect(caseSchema.safeParse(caseTemplate()).success).toBe(true);
    expect(emptyProject().i18n.fr.case.heroTitle).toBeTruthy();
  });

  it("every block type can be created", () => {
    for (const type of Object.keys(BLOCK_LABELS) as (keyof typeof BLOCK_LABELS)[]) {
      expect(emptyBlock(type, 0).type).toBe(type);
    }
    expect(emptyBlock("h2", 4)).toMatchObject({ id: "section-5" });
  });
});
