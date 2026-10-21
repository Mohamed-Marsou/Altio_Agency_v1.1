// =============================================================================
// CONTENT STORE  (server side only)
// -----------------------------------------------------------------------------
// Reads and writes the JSON files that hold the blog posts, the projects and the
// list of uploaded pictures. The dashboard talks to this through the dev API
// (lib/admin/devApi.ts). When the real backend exists, a database version of this
// same set of functions replaces it, and the dashboard does not change.
//
//   content/<lang>/posts.json     one list per language
//   content/<lang>/projects.json  one list per language
//   content/shared/media.json     uploaded pictures (ids, alt texts, WebP paths)
//   public/uploads/<id>-<w>.webp  the picture files
//
// A "record" is one post or project with its three languages put together, which
// is what the dashboard edits. Saving splits it back into the three files.
// =============================================================================
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { processImage, toMediaEntry } from "./mediaPipeline";
import {
  LOCALES,
  postRecordSchema,
  projectRecordSchema,
  type LocaleKey,
  type MediaEntry,
  type PostRecord,
  type ProjectRecord,
} from "./schemas";

export class StoreError extends Error {
  constructor(
    public readonly status: 400 | 404 | 409 | 413 | 415 | 422,
    public readonly code: string,
    message: string,
    public readonly fields?: Record<string, string>,
  ) {
    super(message);
  }
}

type StoreOptions = {
  /** .../src/content */
  contentDir: string;
  /** .../public */
  publicDir: string;
  /** Called after posts, projects or pictures were written (the dev server uses it to refresh its page list). */
  onChange?: (kind: "posts" | "projects" | "media") => void;
};

type Json = Record<string, unknown>;

export function createStore({ contentDir, publicDir, onChange }: StoreOptions) {
  const file = (locale: LocaleKey, name: string) => path.join(contentDir, locale, `${name}.json`);
  const mediaFile = path.join(contentDir, "shared", "media.json");
  const uploadsDir = path.join(publicDir, "uploads");

  // ---- low level -----------------------------------------------------------
  const readJson = <T>(target: string, fallback: T): T => (existsSync(target) ? (JSON.parse(readFileSync(target, "utf8")) as T) : fallback);

  /** Writes many files "all or nothing": every file is written to a temp name first. */
  function writeAll(files: { target: string; data: unknown }[]) {
    const temps: string[] = [];
    try {
      for (const { target, data } of files) {
        mkdirSync(path.dirname(target), { recursive: true });
        const temp = `${target}.tmp-${process.pid}`;
        writeFileSync(temp, `${JSON.stringify(data, null, 2)}\n`, "utf8");
        temps.push(temp);
      }
      files.forEach(({ target }, i) => renameSync(temps[i]!, target));
    } catch (error) {
      for (const temp of temps) rmSync(temp, { force: true });
      throw error;
    }
  }

  // ---- posts ---------------------------------------------------------------
  const readPosts = (locale: LocaleKey) => readJson<Json[]>(file(locale, "posts"), []);

  function postRecordFor(slug: string): PostRecord | undefined {
    const entries = Object.fromEntries(LOCALES.map((l) => [l, readPosts(l).find((p) => p.slug === slug)])) as Record<LocaleKey, Json | undefined>;
    const base = entries.en;
    if (!base) return undefined;
    const text = (locale: LocaleKey) => {
      const entry = entries[locale] ?? base; // a missing translation starts as the English text
      return { title: entry.title, excerpt: entry.excerpt, featuredExcerpt: entry.featuredExcerpt ?? "", body: entry.body };
    };
    return {
      slug,
      category: base.category,
      featured: Boolean(base.featured),
      date: base.date,
      readTime: base.readTime,
      cover: (base.cover as string | undefined) ?? null,
      i18n: { en: text("en"), fr: text("fr"), ar: text("ar") },
    } as PostRecord;
  }

  function postEntry(record: PostRecord, locale: LocaleKey): Json {
    const t = record.i18n[locale];
    return {
      slug: record.slug,
      category: record.category,
      featured: record.featured,
      date: record.date,
      readTime: record.readTime,
      ...(record.cover ? { cover: record.cover } : {}),
      title: t.title,
      excerpt: t.excerpt,
      featuredExcerpt: t.featuredExcerpt,
      body: t.body,
    };
  }

  // ---- projects ------------------------------------------------------------
  const readProjects = (locale: LocaleKey) => readJson<Json[]>(file(locale, "projects"), []);

  function projectRecordFor(slug: string): ProjectRecord | undefined {
    const entries = Object.fromEntries(LOCALES.map((l) => [l, readProjects(l).find((p) => p.slug === slug)])) as Record<LocaleKey, Json | undefined>;
    const base = entries.en;
    if (!base) return undefined;
    const text = (locale: LocaleKey) => {
      const e = entries[locale] ?? base;
      return { tag: e.tag, title: e.title, featuredTitle: e.featuredTitle ?? "", teaser: e.teaser, result: e.result, stats: e.stats ?? [], case: e.case };
    };
    return {
      slug,
      vibe: base.vibe,
      art: base.art,
      featured: Boolean(base.featured),
      status: base.status,
      url: base.url ?? "",
      category: base.category,
      cover: (base.cover as string | undefined) ?? null,
      i18n: { en: text("en"), fr: text("fr"), ar: text("ar") },
    } as ProjectRecord;
  }

  function projectEntry(record: ProjectRecord, locale: LocaleKey): Json {
    const t = record.i18n[locale];
    return {
      slug: record.slug,
      vibe: record.vibe,
      art: record.art,
      featured: record.featured,
      status: record.status,
      url: record.url,
      category: record.category,
      ...(record.cover ? { cover: record.cover } : {}),
      tag: t.tag,
      title: t.title,
      featuredTitle: t.featuredTitle,
      teaser: t.teaser,
      result: t.result,
      stats: t.stats,
      case: t.case,
    };
  }

  // ---- generic list helpers ------------------------------------------------
  function saveList(name: "posts" | "projects", lists: Record<LocaleKey, Json[]>) {
    writeAll(LOCALES.map((locale) => ({ target: file(locale, name), data: lists[locale] })));
    onChange?.(name);
  }

  const validation = (error: { issues: { path: PropertyKey[]; message: string }[] }) => {
    const fields: Record<string, string> = {};
    for (const issue of error.issues) {
      const key = issue.path.join(".");
      if (!(key in fields)) fields[key] = issue.message;
    }
    return new StoreError(422, "VALIDATION_ERROR", "Some fields are invalid.", fields);
  };

  function assertCoverExists(cover: string | null | undefined) {
    if (cover && !media.list().some((m) => m.id === cover)) {
      throw new StoreError(422, "VALIDATION_ERROR", "The cover picture does not exist.", { cover: "Unknown picture" });
    }
  }

  // ---- media ---------------------------------------------------------------
  const media = {
    list(): MediaEntry[] {
      return readJson<MediaEntry[]>(mediaFile, []);
    },

    /** Where a picture is used (posts and projects), as readable labels. */
    usage(id: string): string[] {
      const used: string[] = [];
      for (const p of readPosts("en")) if (p.cover === id) used.push(`Post: ${String(p.slug)}`);
      for (const p of readProjects("en")) if (p.cover === id) used.push(`Project: ${String(p.slug)}`);
      return used;
    },

    async add(buffer: Buffer, originalName: string): Promise<{ entry: MediaEntry; duplicate: boolean }> {
      const processed = await processImage(buffer); // throws MediaError (mapped by the API)
      const existing = media.list().find((m) => m.hash === processed.hash);
      if (existing) return { entry: existing, duplicate: true }; // same picture: reuse it
      mkdirSync(uploadsDir, { recursive: true });
      for (const f of processed.files) writeFileSync(path.join(uploadsDir, `${processed.id}-${f.width}.webp`), f.buffer);
      const entry = toMediaEntry(processed, originalName);
      writeAll([{ target: mediaFile, data: [entry, ...media.list()] }]);
      return { entry, duplicate: false };
    },

    setAlt(id: string, alt: MediaEntry["alt"]): MediaEntry {
      const list = media.list();
      const found = list.find((m) => m.id === id);
      if (!found) throw new StoreError(404, "NOT_FOUND", "Picture not found.");
      found.alt = alt;
      writeAll([{ target: mediaFile, data: list }]);
      return found;
    },

    remove(id: string) {
      const list = media.list();
      const found = list.find((m) => m.id === id);
      if (!found) throw new StoreError(404, "NOT_FOUND", "Picture not found.");
      const used = media.usage(id);
      if (used.length) throw new StoreError(409, "IN_USE", `This picture is used by: ${used.join(", ")}. Change the cover first.`);
      writeAll([{ target: mediaFile, data: list.filter((m) => m.id !== id) }]);
      for (const variant of found.variants) rmSync(path.join(publicDir, variant.path), { force: true });
    },
  };

  // ---- posts API -----------------------------------------------------------
  const posts = {
    list(): PostRecord[] {
      return readPosts("en")
        .map((p) => postRecordFor(String(p.slug)))
        .filter((p): p is PostRecord => Boolean(p))
        .sort((a, b) => b.date.localeCompare(a.date));
    },
    get: (slug: string) => postRecordFor(slug),

    create(input: unknown): PostRecord {
      const parsed = postRecordSchema.safeParse(input);
      if (!parsed.success) throw validation(parsed.error);
      const record = parsed.data;
      if (postRecordFor(record.slug)) throw new StoreError(409, "SLUG_TAKEN", "A post with this address already exists.", { slug: "Already used" });
      assertCoverExists(record.cover);
      const lists = Object.fromEntries(LOCALES.map((l) => [l, [postEntry(record, l), ...readPosts(l)]])) as Record<LocaleKey, Json[]>;
      saveList("posts", lists);
      return record;
    },

    update(slug: string, input: unknown): PostRecord {
      const parsed = postRecordSchema.safeParse(input);
      if (!parsed.success) throw validation(parsed.error);
      const record = parsed.data;
      if (record.slug !== slug) throw new StoreError(422, "VALIDATION_ERROR", "The address of a post cannot change.", { slug: "Cannot be changed" });
      if (!postRecordFor(slug)) throw new StoreError(404, "NOT_FOUND", "Post not found.");
      assertCoverExists(record.cover);
      const lists = Object.fromEntries(
        LOCALES.map((l) => {
          const current = readPosts(l);
          const exists = current.some((p) => p.slug === slug);
          return [l, exists ? current.map((p) => (p.slug === slug ? postEntry(record, l) : p)) : [postEntry(record, l), ...current]];
        }),
      ) as Record<LocaleKey, Json[]>;
      saveList("posts", lists);
      return record;
    },

    remove(slug: string) {
      if (!postRecordFor(slug)) throw new StoreError(404, "NOT_FOUND", "Post not found.");
      if (posts.list().length <= 1) throw new StoreError(409, "LAST_ITEM", "The blog needs at least one post.");
      const lists = Object.fromEntries(LOCALES.map((l) => [l, readPosts(l).filter((p) => p.slug !== slug)])) as Record<LocaleKey, Json[]>;
      saveList("posts", lists);
    },
  };

  // ---- projects API --------------------------------------------------------
  /** Pages that link to a project (the home page "Selected work" cards). */
  function projectLinks(slug: string): string[] {
    const found: string[] = [];
    for (const locale of LOCALES) {
      const work = readJson<{ items?: { href?: string }[] }>(file(locale, "work"), {});
      if (work.items?.some((item) => item.href === `/work/${slug}/`)) found.push(`home page (${locale})`);
    }
    return found;
  }

  const projects = {
    list(): ProjectRecord[] {
      return readProjects("en")
        .map((p) => projectRecordFor(String(p.slug)))
        .filter((p): p is ProjectRecord => Boolean(p));
    },
    get: (slug: string) => projectRecordFor(slug),

    create(input: unknown): ProjectRecord {
      const parsed = projectRecordSchema.safeParse(input);
      if (!parsed.success) throw validation(parsed.error);
      const record = parsed.data;
      if (projectRecordFor(record.slug)) throw new StoreError(409, "SLUG_TAKEN", "A project with this address already exists.", { slug: "Already used" });
      assertCoverExists(record.cover);
      const lists = Object.fromEntries(LOCALES.map((l) => [l, [...readProjects(l), projectEntry(record, l)]])) as Record<LocaleKey, Json[]>;
      saveList("projects", lists);
      return record;
    },

    update(slug: string, input: unknown): ProjectRecord {
      const parsed = projectRecordSchema.safeParse(input);
      if (!parsed.success) throw validation(parsed.error);
      const record = parsed.data;
      if (record.slug !== slug) throw new StoreError(422, "VALIDATION_ERROR", "The address of a project cannot change.", { slug: "Cannot be changed" });
      if (!projectRecordFor(slug)) throw new StoreError(404, "NOT_FOUND", "Project not found.");
      assertCoverExists(record.cover);
      const lists = Object.fromEntries(
        LOCALES.map((l) => {
          const current = readProjects(l);
          const exists = current.some((p) => p.slug === slug);
          return [l, exists ? current.map((p) => (p.slug === slug ? projectEntry(record, l) : p)) : [...current, projectEntry(record, l)]];
        }),
      ) as Record<LocaleKey, Json[]>;
      saveList("projects", lists);
      return record;
    },

    remove(slug: string) {
      if (!projectRecordFor(slug)) throw new StoreError(404, "NOT_FOUND", "Project not found.");
      if (projects.list().length <= 1) throw new StoreError(409, "LAST_ITEM", "The site needs at least one project.");
      const links = projectLinks(slug);
      if (links.length) throw new StoreError(409, "IN_USE", `This project is linked from the ${links[0]} (Selected work). Remove that card first.`);
      const lists = Object.fromEntries(LOCALES.map((l) => [l, readProjects(l).filter((p) => p.slug !== slug)])) as Record<LocaleKey, Json[]>;
      saveList("projects", lists);
    },
  };

  return { posts, projects, media };
}

export type Store = ReturnType<typeof createStore>;
