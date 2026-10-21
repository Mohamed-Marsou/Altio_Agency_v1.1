// @vitest-environment node
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MediaError, TARGET_BYTES, detectImageType, processImage } from "./mediaPipeline";
import { MAX_UPLOAD_BYTES, postRecordSchema, projectRecordSchema, type PostRecord } from "./schemas";
import { StoreError, createStore, type Store } from "./store";

// Every test works on a COPY of the real content in a temporary folder, so the
// project files are never touched.
const realContent = path.resolve(__dirname, "../../content");
let tmp: string;
let store: Store;

beforeEach(() => {
  tmp = mkdtempSync(path.join(tmpdir(), "altio-store-"));
  cpSync(realContent, path.join(tmp, "content"), { recursive: true });
  mkdirSync(path.join(tmp, "public"), { recursive: true });
  store = createStore({ contentDir: path.join(tmp, "content"), publicDir: path.join(tmp, "public") });
});
afterEach(() => rmSync(tmp, { recursive: true, force: true }));

const readList = (locale: string, name: string) => JSON.parse(readFileSync(path.join(tmp, "content", locale, `${name}.json`), "utf8")) as { slug: string; title: string }[];

function newPost(slug = "my-new-post"): PostRecord {
  const text = (title: string) => ({
    title,
    excerpt: "A short summary.",
    featuredExcerpt: "",
    body: [
      { type: "p" as const, text: "First paragraph." },
      { type: "h2" as const, id: "part-one", text: "Part one" },
      { type: "p" as const, text: "More text." },
    ],
  });
  return { slug, category: "tips", featured: false, date: "2026-04-01", readTime: 3, cover: null, i18n: { en: text("My new post"), fr: text("Mon nouvel article"), ar: text("مقالي الجديد") } };
}

async function jpeg(width: number, height: number, options: { exif?: boolean; orientation?: number } = {}) {
  let image = sharp({ create: { width, height, channels: 3, background: { r: 30, g: 120, b: 200 } } }).jpeg({ quality: 90 });
  if (options.orientation) image = image.withMetadata({ orientation: options.orientation });
  if (options.exif) image = image.withExif({ IFD0: { Copyright: "secret", ImageDescription: "GPS place" } });
  return image.toBuffer();
}

describe("the real content passes the rules", () => {
  it("every post and every project is valid", () => {
    for (const post of store.posts.list()) expect(postRecordSchema.safeParse(post).success, post.slug).toBe(true);
    for (const project of store.projects.list()) expect(projectRecordSchema.safeParse(project).success, project.slug).toBe(true);
  });

  it("lists posts newest first", () => {
    const dates = store.posts.list().map((p) => p.date);
    expect(dates).toEqual([...dates].sort().reverse());
    expect(dates.length).toBe(7);
  });
});

describe("posts: create, read, update, delete", () => {
  it("creates a post in the three language files", () => {
    store.posts.create(newPost());
    for (const [locale, title] of [["en", "My new post"], ["fr", "Mon nouvel article"], ["ar", "مقالي الجديد"]] as const) {
      expect(readList(locale, "posts").find((p) => p.slug === "my-new-post")?.title).toBe(title);
    }
    expect(store.posts.get("my-new-post")?.i18n.fr.title).toBe("Mon nouvel article");
    expect(store.posts.list()).toHaveLength(8);
  });

  it("refuses a slug that is already used", () => {
    store.posts.create(newPost());
    expect(() => store.posts.create(newPost())).toThrowError(StoreError);
    try {
      store.posts.create(newPost());
    } catch (error) {
      expect((error as StoreError).status).toBe(409);
      expect((error as StoreError).code).toBe("SLUG_TAKEN");
    }
  });

  it("refuses bad data and says which field is wrong", () => {
    const bad = { ...newPost("ab"), date: "12/03/2026" };
    try {
      store.posts.create(bad);
      expect.unreachable();
    } catch (error) {
      const e = error as StoreError;
      expect(e.status).toBe(422);
      expect(Object.keys(e.fields ?? {})).toEqual(expect.arrayContaining(["slug", "date"]));
    }
  });

  it("needs a title and some text in every language", () => {
    const post = newPost();
    post.i18n.ar.title = "";
    post.i18n.fr.body = [];
    try {
      store.posts.create(post);
      expect.unreachable();
    } catch (error) {
      const fields = (error as StoreError).fields ?? {};
      expect(fields["i18n.ar.title"]).toBeDefined();
      expect(fields["i18n.fr.body"]).toBeDefined();
    }
  });

  it("refuses two sections with the same id", () => {
    const post = newPost();
    post.i18n.en.body.push({ type: "h2", id: "part-one", text: "Again" });
    expect(() => store.posts.create(post)).toThrowError(/invalid/i);
  });

  it("updates one post without touching the others", () => {
    const before = store.posts.list();
    const target = before[0]!;
    const changed = { ...target, i18n: { ...target.i18n, fr: { ...target.i18n.fr, title: "Titre modifié" } } };
    store.posts.update(target.slug, changed);
    expect(store.posts.get(target.slug)?.i18n.fr.title).toBe("Titre modifié");
    expect(store.posts.get(target.slug)?.i18n.en.title).toBe(target.i18n.en.title);
    expect(store.posts.list().map((p) => p.slug).sort()).toEqual(before.map((p) => p.slug).sort());
  });

  it("does not allow the address of a post to change, or an unknown post", () => {
    const post = store.posts.list()[0]!;
    expect(() => store.posts.update(post.slug, { ...post, slug: "other-address" })).toThrowError(/cannot change/);
    expect(() => store.posts.update("ghost-post", newPost("ghost-post"))).toThrowError(/not found/i);
  });

  it("deletes a post from the three files", () => {
    store.posts.create(newPost());
    store.posts.remove("my-new-post");
    for (const locale of ["en", "fr", "ar"]) expect(readList(locale, "posts").some((p) => p.slug === "my-new-post")).toBe(false);
    expect(() => store.posts.remove("my-new-post")).toThrowError(/not found/i);
  });

  it("keeps at least one post", () => {
    const slugs = store.posts.list().map((p) => p.slug);
    for (const slug of slugs.slice(1)) store.posts.remove(slug);
    expect(() => store.posts.remove(slugs[0]!)).toThrowError(/at least one/);
  });

  it("keeps the files valid JSON after many saves (written all or nothing)", () => {
    for (let i = 0; i < 5; i++) store.posts.create(newPost(`post-number-${i}`));
    for (const locale of ["en", "fr", "ar"]) expect(readList(locale, "posts")).toHaveLength(12);
  });
});

describe("projects: create, update, delete", () => {
  const sample = () => {
    const base = store.projects.get("atlas-immo")!;
    return { ...base, slug: "new-project", featured: false };
  };

  it("creates, updates and deletes a project", () => {
    store.projects.create(sample());
    expect(store.projects.list()).toHaveLength(5);
    const created = store.projects.get("new-project")!;
    store.projects.update("new-project", { ...created, i18n: { ...created.i18n, ar: { ...created.i18n.ar, title: "مشروع جديد" } } });
    expect(readList("ar", "projects").find((p) => p.slug === "new-project")?.title).toBe("مشروع جديد");
    store.projects.remove("new-project");
    expect(store.projects.list()).toHaveLength(4);
  });

  it("refuses to delete a project that the home page links to", () => {
    expect(() => store.projects.remove("atlas-immo")).toThrowError(/Selected work/);
    expect(store.projects.get("atlas-immo")).toBeDefined();
  });

  it("checks the case study fields", () => {
    const project = sample();
    project.i18n.en.case.results = [];
    project.i18n.en.case.built[0]!.visual = "unknown" as never;
    try {
      store.projects.create(project);
      expect.unreachable();
    } catch (error) {
      const fields = (error as StoreError).fields ?? {};
      expect(fields["i18n.en.case.results"]).toBeDefined();
      expect(fields["i18n.en.case.built.0.visual"]).toBeDefined();
    }
  });
});

describe("picture detection", () => {
  it("reads the real type from the first bytes", async () => {
    expect(detectImageType(await jpeg(10, 10))).toBe("jpeg");
    expect(detectImageType(await sharp({ create: { width: 4, height: 4, channels: 3, background: "#fff" } }).png().toBuffer())).toBe("png");
    expect(detectImageType(await sharp({ create: { width: 4, height: 4, channels: 3, background: "#fff" } }).webp().toBuffer())).toBe("webp");
    expect(detectImageType(Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'></svg>"))).toBeNull();
    expect(detectImageType(Buffer.concat([Buffer.from("MZ"), Buffer.alloc(40)]))).toBeNull();
  });
});

describe("picture pipeline", () => {
  it("makes three WebP sizes and never enlarges", async () => {
    const result = await processImage(await jpeg(3000, 2000));
    expect(result.files.map((f) => f.width)).toEqual([480, 960, 1600]);
    for (const file of result.files) {
      expect(file.bytes).toBeLessThanOrEqual(TARGET_BYTES);
      expect((await sharp(file.buffer).metadata()).format).toBe("webp");
      expect((await sharp(file.buffer).metadata()).width).toBe(file.width);
    }
    const small = await processImage(await jpeg(300, 200));
    expect(small.files.map((f) => f.width)).toEqual([300]);
    const medium = await processImage(await jpeg(1000, 600));
    expect(medium.files.map((f) => f.width)).toEqual([480, 960, 1000]);
  });

  it("removes the hidden data (EXIF, GPS)", async () => {
    const withExif = await jpeg(800, 600, { exif: true });
    expect((await sharp(withExif).metadata()).exif).toBeDefined();
    const result = await processImage(withExif);
    for (const file of result.files) expect((await sharp(file.buffer).metadata()).exif).toBeUndefined();
  });

  it("turns a rotated phone photo the right way up", async () => {
    const result = await processImage(await jpeg(400, 200, { orientation: 6 }));
    expect(result.width).toBe(200);
    expect(result.height).toBe(400);
  });

  it("refuses files that are not pictures, even with a picture name", async () => {
    await expect(processImage(Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>"))).rejects.toMatchObject({ code: "BAD_TYPE" });
    await expect(processImage(Buffer.concat([Buffer.from("MZ"), Buffer.alloc(200)]))).rejects.toMatchObject({ code: "BAD_TYPE" });
  });

  it("respects the upload limit", async () => {
    const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
    const tooBig = Buffer.concat([jpegHeader, Buffer.alloc(MAX_UPLOAD_BYTES)]);
    await expect(processImage(tooBig)).rejects.toMatchObject({ code: "TOO_LARGE" });
    await expect(processImage(Buffer.alloc(0))).rejects.toMatchObject({ code: "EMPTY" });
  });

  it("refuses a broken picture", async () => {
    const broken = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64)]);
    await expect(processImage(broken)).rejects.toBeInstanceOf(MediaError);
    await expect(processImage(broken)).rejects.toMatchObject({ code: "UNREADABLE" });
  });
});

describe("media library", () => {
  it("saves the files and records the paths in the JSON", async () => {
    const { entry, duplicate } = await store.media.add(await jpeg(2400, 1600), "Holiday Photo (1).JPG");
    expect(duplicate).toBe(false);
    expect(entry.variants.map((v) => v.path)).toEqual([`/uploads/${entry.id}-480.webp`, `/uploads/${entry.id}-960.webp`, `/uploads/${entry.id}-1600.webp`]);
    for (const variant of entry.variants) expect(existsSync(path.join(tmp, "public", variant.path))).toBe(true);
    expect(store.media.list()[0]?.id).toBe(entry.id);
    expect(JSON.parse(readFileSync(path.join(tmp, "content", "shared", "media.json"), "utf8"))[0].variants[0].path).toBe(entry.variants[0]!.path);
    expect(entry.originalName).toBe("Holiday Photo 1.JPG");
  });

  it("does not store the same picture twice", async () => {
    const buffer = await jpeg(1200, 800);
    const first = await store.media.add(buffer, "a.jpg");
    const second = await store.media.add(buffer, "b.jpg");
    expect(second.duplicate).toBe(true);
    expect(second.entry.id).toBe(first.entry.id);
    expect(store.media.list()).toHaveLength(1);
  });

  it("keeps alt texts per language", async () => {
    const { entry } = await store.media.add(await jpeg(900, 600), "a.jpg");
    store.media.setAlt(entry.id, { en: "A team", fr: "Une équipe", ar: "فريق" });
    expect(store.media.list()[0]!.alt.fr).toBe("Une équipe");
    expect(() => store.media.setAlt("aaaaaaaaaaaa", { en: "", fr: "", ar: "" })).toThrowError(/not found/i);
  });

  it("uses a picture as a cover, and refuses to delete it while it is used", async () => {
    const { entry } = await store.media.add(await jpeg(1000, 700), "cover.jpg");
    const post = store.posts.list()[0]!;
    store.posts.update(post.slug, { ...post, cover: entry.id });
    expect(readList("fr", "posts").find((p) => p.slug === post.slug)).toMatchObject({ cover: entry.id });

    try {
      store.media.remove(entry.id);
      expect.unreachable();
    } catch (error) {
      expect((error as StoreError).code).toBe("IN_USE");
      expect((error as StoreError).message).toContain(post.slug);
    }

    store.posts.update(post.slug, { ...post, cover: null });
    store.media.remove(entry.id);
    expect(store.media.list()).toHaveLength(0);
    for (const variant of entry.variants) expect(existsSync(path.join(tmp, "public", variant.path))).toBe(false);
  });

  it("refuses a cover that does not exist", () => {
    const post = store.posts.list()[0]!;
    expect(() => store.posts.update(post.slug, { ...post, cover: "ffffffffffff" })).toThrowError(/does not exist/);
  });
});
