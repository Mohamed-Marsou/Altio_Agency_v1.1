"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError, adminApi } from "@/lib/admin/client";
import { useQueryParam } from "@/lib/admin/useQueryParam";
import { emptyPost, slugify } from "@/lib/admin/helpers";
import { LOCALES, POST_CATEGORIES, flattenIssues, postRecordSchema, type LocaleKey, type PostRecord } from "@/lib/admin/schemas";
import BlockEditor from "./BlockEditor";
import ConfirmDialog from "./ConfirmDialog";
import MediaPicker from "./MediaPicker";
import ServerNotice from "./ServerNotice";
import ui from "./ui.module.scss";

const LOCALE_LABEL: Record<LocaleKey, string> = { en: "English", fr: "Français", ar: "العربية" };
const CATEGORY_LABEL: Record<(typeof POST_CATEGORIES)[number], string> = { web: "Websites", seo: "SEO", shop: "Online stores", apps: "Web apps", tips: "Business tips" };

/** Removes empty lines from tip boxes and trims texts, so small typing slips do not block saving. */
function clean(record: PostRecord): PostRecord {
  const copy = structuredClone(record);
  for (const locale of LOCALES) {
    copy.i18n[locale].body = copy.i18n[locale].body.map((block) =>
      block.type === "callout" ? { ...block, items: block.items.map((i) => i.trim()).filter(Boolean) } : block,
    );
  }
  return copy;
}

// Create or edit one blog post, in the three languages. The same rules as the
// server (lib/admin/schemas.ts) are checked here first, so errors show next to the
// field before anything is sent.
export default function PostEditorView() {
  const router = useRouter();
  const addressSlug = useQueryParam("slug"); // undefined until the browser has read the address
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);
  const slugParam = createdSlug ?? addressSlug;
  const isNew = !slugParam;

  const [record, setRecord] = useState<PostRecord>(emptyPost);
  const [loaded, setLoaded] = useState(false);
  const [offline, setOffline] = useState(false);
  const [locale, setLocale] = useState<LocaleKey>("en");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Load the post when editing.
  useEffect(() => {
    if (!addressSlug) return; // new item, or the address is not read yet
    const slugToLoad = addressSlug;
    let alive = true;
    adminApi.posts
      .get(slugToLoad)
      .then((post) => alive && (setRecord(post), setLoaded(true)))
      .catch((error) => {
        if (!alive) return;
        if (error instanceof ApiError && error.code === "OFFLINE") setOffline(true);
        else setMessage({ kind: "error", text: error instanceof ApiError ? error.message : "Could not load this post." });
        setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, [addressSlug]);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const change = useCallback((fn: (draft: PostRecord) => PostRecord) => {
    setRecord((current) => fn(structuredClone(current)));
    setDirty(true);
    setMessage(null);
  }, []);

  const setText = <K extends "title" | "excerpt" | "featuredExcerpt">(key: K, value: string) =>
    change((d) => {
      d.i18n[locale][key] = value;
      // A new post gets its web address from the English title until it is edited by hand.
      if (isNew && !slugEdited && locale === "en" && key === "title") d.slug = slugify(value);
      return d;
    });

  const localeErrors = useMemo(() => {
    const result: Record<string, Record<string, string>> = { en: {}, fr: {}, ar: {} };
    for (const [path, text] of Object.entries(errors)) {
      const match = /^i18n\.(en|fr|ar)\.(.+)$/.exec(path);
      if (match) result[match[1]!]![match[2]!] = text;
    }
    return result;
  }, [errors]);

  // Block errors look like "body.2.text" -> "2.text" for the block editor.
  const blockErrors = (l: LocaleKey) =>
    Object.fromEntries(Object.entries(localeErrors[l]!).filter(([k]) => k.startsWith("body.")).map(([k, v]) => [k.slice(5), v]));

  async function save() {
    const prepared = clean(record);
    const parsed = postRecordSchema.safeParse(prepared);
    if (!parsed.success) {
      const found = flattenIssues(parsed.error);
      setErrors(found);
      // Jump to the first language that has a problem.
      const first = LOCALES.find((l) => Object.keys(found).some((k) => k.startsWith(`i18n.${l}.`)));
      if (first) setLocale(first);
      setMessage({ kind: "error", text: "Some fields need attention (marked in red)." });
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      const saved = isNew ? await adminApi.posts.create(parsed.data) : await adminApi.posts.update(parsed.data.slug, parsed.data);
      setRecord(saved);
      setDirty(false);
      setMessage({ kind: "success", text: "Saved. The site shows the change after it reloads." });
      if (isNew) {
        setCreatedSlug(saved.slug);
        router.replace(`/admindash/blog/edit/?slug=${saved.slug}`);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.fields) setErrors(error.fields);
        setMessage({ kind: "error", text: error.message });
      } else setMessage({ kind: "error", text: "Saving failed." });
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    setSaving(true);
    try {
      await adminApi.posts.remove(record.slug);
      setDirty(false);
      router.push("/admindash/blog/");
    } catch (error) {
      setConfirmDelete(false);
      setMessage({ kind: "error", text: error instanceof ApiError ? error.message : "Delete failed." });
    } finally {
      setSaving(false);
    }
  }

  if (offline) return <ServerNotice />;
  if (addressSlug === undefined || (addressSlug !== null && !loaded && !createdSlug)) return <p className={ui.muted}>Loading…</p>;

  const text = record.i18n[locale];
  const le = localeErrors[locale]!;
  const dir = locale === "ar" ? "rtl" : "ltr";
  const err = (key: string) => errors[key];

  return (
    <form
      className={ui.page}
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
      noValidate
    >
      <div className={ui.head}>
        <div>
          <h1 className={ui.title}>{isNew ? "New post" : "Edit post"}</h1>
          <p className={ui.sub}>{isNew ? "Write it in the three languages, then save." : record.slug}</p>
        </div>
        <Link href="/admindash/blog/" className={ui.btn}>
          Back to the list
        </Link>
      </div>

      {message && (
        <div className={`${ui.notice} ${message.kind === "success" ? ui.noticeSuccess : ui.noticeError}`} role={message.kind === "error" ? "alert" : "status"}>
          {message.text}
        </div>
      )}

      <section className={ui.card} aria-labelledby="post-details">
        <h2 id="post-details" className={ui.cardTitle}>
          Details
        </h2>
        <div className={ui.grid}>
          <label className={ui.field}>
            <span>
              Web address <span className={ui.hint}>(/blog/…/ , cannot change after saving)</span>
            </span>
            <input
              value={record.slug}
              disabled={!isNew}
              className={ui.mono}
              aria-invalid={Boolean(err("slug"))}
              onChange={(event) => {
                setSlugEdited(true);
                change((d) => ((d.slug = event.target.value.toLowerCase()), d));
              }}
            />
            {err("slug") && <span className={ui.error}>{err("slug")}</span>}
          </label>
          <label className={ui.field}>
            <span>Topic</span>
            <select value={record.category} onChange={(event) => change((d) => ((d.category = event.target.value as PostRecord["category"]), d))}>
              {POST_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABEL[c]}
                </option>
              ))}
            </select>
          </label>
          <label className={ui.field}>
            <span>Date</span>
            <input type="date" value={record.date} aria-invalid={Boolean(err("date"))} onChange={(event) => change((d) => ((d.date = event.target.value), d))} />
            {err("date") && <span className={ui.error}>{err("date")}</span>}
          </label>
          <label className={ui.field}>
            <span>Reading time (minutes)</span>
            <input type="number" min={1} max={60} value={record.readTime} aria-invalid={Boolean(err("readTime"))} onChange={(event) => change((d) => ((d.readTime = Number(event.target.value)), d))} />
            {err("readTime") && <span className={ui.error}>{err("readTime")}</span>}
          </label>
          <MediaPicker label="Cover picture" value={record.cover} onChange={(id) => change((d) => ((d.cover = id), d))} />
          <label className={ui.check}>
            <input type="checkbox" checked={record.featured} onChange={(event) => change((d) => ((d.featured = event.target.checked), d))} />
            Featured (shown big at the top of the blog)
          </label>
        </div>
        {err("cover") && <span className={ui.error}>{err("cover")}</span>}
      </section>

      <section className={ui.card} aria-labelledby="post-text">
        <h2 id="post-text" className={ui.cardTitle}>
          Text
        </h2>
        <div className={ui.tabs} role="tablist" aria-label="Language">
          {LOCALES.map((l) => (
            <button key={l} type="button" role="tab" aria-selected={locale === l} className={`${ui.tab} ${locale === l ? ui.tabOn : ""}`} onClick={() => setLocale(l)}>
              {LOCALE_LABEL[l]}
              {Object.keys(localeErrors[l]!).length > 0 && <span className={ui.tabDot} aria-label="has errors" />}
            </button>
          ))}
        </div>

        {locale !== "en" && (
          <p style={{ marginTop: "0.75rem" }}>
            <button
              type="button"
              className={`${ui.btn} ${ui.btnSmall}`}
              onClick={() => change((d) => ((d.i18n[locale] = structuredClone(d.i18n.en)), d))}
            >
              Copy the English text here, then translate
            </button>
          </p>
        )}

        <div className={ui.page} style={{ marginTop: "0.75rem" }}>
          <label className={ui.field}>
            <span>Title</span>
            <input dir={dir} value={text.title} aria-invalid={Boolean(le.title)} onChange={(event) => setText("title", event.target.value)} />
            {le.title && <span className={ui.error}>{le.title}</span>}
          </label>
          <label className={ui.field}>
            <span>Short summary</span>
            <textarea dir={dir} rows={2} value={text.excerpt} aria-invalid={Boolean(le.excerpt)} onChange={(event) => setText("excerpt", event.target.value)} />
            {le.excerpt && <span className={ui.error}>{le.excerpt}</span>}
          </label>
          {record.featured && (
            <label className={ui.field}>
              <span>
                Longer summary <span className={ui.hint}>(shown when the post is featured)</span>
              </span>
              <textarea dir={dir} rows={3} value={text.featuredExcerpt} aria-invalid={Boolean(le.featuredExcerpt)} onChange={(event) => setText("featuredExcerpt", event.target.value)} />
              {le.featuredExcerpt && <span className={ui.error}>{le.featuredExcerpt}</span>}
            </label>
          )}
          <div>
            <p className={ui.muted} style={{ marginBottom: "0.5rem" }}>
              Article body
            </p>
            {le.body && <p className={ui.error}>{le.body}</p>}
            <BlockEditor
              dir={dir}
              blocks={text.body}
              errors={blockErrors(locale)}
              onChange={(blocks) => change((d) => ((d.i18n[locale].body = blocks), d))}
            />
          </div>
        </div>
      </section>

      <div className={ui.saveBar}>
        <button type="submit" className={`${ui.btn} ${ui.btnPrimary}`} disabled={saving}>
          {saving ? "Saving…" : "Save post"}
        </button>
        {dirty && <span className={ui.muted}>Unsaved changes</span>}
        <span style={{ flex: 1 }} />
        {!isNew && (
          <button type="button" className={`${ui.btn} ${ui.btnDanger}`} onClick={() => setConfirmDelete(true)} disabled={saving}>
            Delete post
          </button>
        )}
      </div>

      <ConfirmDialog open={confirmDelete} title="Delete this post?" confirmLabel="Delete post" danger busy={saving} onConfirm={() => void remove()} onCancel={() => setConfirmDelete(false)}>
        <p>
          “{record.i18n.en.title}” will be removed from the site in all three languages. This cannot be undone (except from git).
        </p>
      </ConfirmDialog>
    </form>
  );
}
