"use client";

import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError, adminApi } from "@/lib/admin/client";
import { useQueryParam } from "@/lib/admin/useQueryParam";
import { caseTemplate, emptyProject, slugify } from "@/lib/admin/helpers";
import { LOCALES, PROJECT_CATEGORIES, PROJECT_STATUSES, PROJECT_VIBES, flattenIssues, projectRecordSchema, type LocaleKey, type ProjectRecord } from "@/lib/admin/schemas";
import ConfirmDialog from "./ConfirmDialog";
import MediaPicker from "./MediaPicker";
import ServerNotice from "./ServerNotice";
import ui from "./ui.module.scss";

const LOCALE_LABEL: Record<LocaleKey, string> = { en: "English", fr: "Français", ar: "العربية" };
const CATEGORY_LABEL: Record<(typeof PROJECT_CATEGORIES)[number], string> = { websites: "Websites", stores: "Online stores", apps: "Web apps", managed: "Managed care" };
const LOOK_LABEL: Record<(typeof PROJECT_VIBES)[number], string> = { estate: "Real estate (blue)", store: "Store (pink)", app: "App (green)", managed: "Managed (orange)" };

// Create or edit one project (case study) in three languages. The case study
// (the story chapters) is edited as structured JSON text with a template button;
// it is checked against the same rules as the server before saving.
export default function ProjectEditorView() {
  const router = useRouter();
  const addressSlug = useQueryParam("slug"); // undefined until the browser has read the address
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);
  const slugParam = createdSlug ?? addressSlug;
  const isNew = !slugParam;

  const [record, setRecord] = useState<ProjectRecord>(emptyProject);
  // The case study is typed as text, so half-written JSON is never lost.
  const [caseText, setCaseText] = useState<Record<LocaleKey, string>>(() => ({
    en: JSON.stringify(caseTemplate(), null, 2),
    fr: JSON.stringify(caseTemplate(), null, 2),
    ar: JSON.stringify(caseTemplate(), null, 2),
  }));
  const [loaded, setLoaded] = useState(false);
  const [offline, setOffline] = useState(false);
  const [locale, setLocale] = useState<LocaleKey>("en");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!addressSlug) return; // new item, or the address is not read yet
    const slugToLoad = addressSlug;
    let alive = true;
    adminApi.projects
      .get(slugToLoad)
      .then((project) => {
        if (!alive) return;
        setRecord(project);
        setCaseText({
          en: JSON.stringify(project.i18n.en.case, null, 2),
          fr: JSON.stringify(project.i18n.fr.case, null, 2),
          ar: JSON.stringify(project.i18n.ar.case, null, 2),
        });
        setLoaded(true);
      })
      .catch((error) => {
        if (!alive) return;
        if (error instanceof ApiError && error.code === "OFFLINE") setOffline(true);
        else setMessage({ kind: "error", text: error instanceof ApiError ? error.message : "Could not load this project." });
        setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, [addressSlug]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const change = useCallback((fn: (draft: ProjectRecord) => ProjectRecord) => {
    setRecord((current) => fn(structuredClone(current)));
    setDirty(true);
    setMessage(null);
  }, []);

  const setText = (key: "tag" | "title" | "featuredTitle" | "teaser" | "result", value: string) =>
    change((d) => {
      d.i18n[locale][key] = value;
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

  async function save() {
    // 1. the case study text of each language must be valid JSON
    const draft = structuredClone(record);
    const found: Record<string, string> = {};
    for (const l of LOCALES) {
      try {
        draft.i18n[l].case = JSON.parse(caseText[l]);
      } catch (error) {
        found[`i18n.${l}.case`] = `The case study is not valid JSON (${(error as Error).message}).`;
      }
    }
    // 2. then the same rules as the server
    const parsed = projectRecordSchema.safeParse(draft);
    if (!parsed.success) Object.assign(found, flattenIssues(parsed.error));
    if (Object.keys(found).length > 0 || !parsed.success) {
      setErrors(found);
      const first = LOCALES.find((l) => Object.keys(found).some((k) => k.startsWith(`i18n.${l}.`)));
      if (first) setLocale(first);
      setMessage({ kind: "error", text: "Some fields need attention (marked in red)." });
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      const saved = isNew ? await adminApi.projects.create(parsed.data) : await adminApi.projects.update(parsed.data.slug, parsed.data);
      setRecord(saved);
      setDirty(false);
      setMessage({ kind: "success", text: "Saved. The site shows the change after it reloads." });
      if (isNew) {
        setCreatedSlug(saved.slug);
        router.replace(`/admindash/projects/edit/?slug=${saved.slug}`);
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
      await adminApi.projects.remove(record.slug);
      setDirty(false);
      router.push("/admindash/projects/");
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
          <h1 className={ui.title}>{isNew ? "New project" : "Edit project"}</h1>
          <p className={ui.sub}>{isNew ? "Fill the details, then the three languages." : record.slug}</p>
        </div>
        <Link href="/admindash/projects/" className={ui.btn}>
          Back to the list
        </Link>
      </div>

      {message && (
        <div className={`${ui.notice} ${message.kind === "success" ? ui.noticeSuccess : ui.noticeError}`} role={message.kind === "error" ? "alert" : "status"}>
          {message.text}
        </div>
      )}

      <section className={ui.card} aria-labelledby="proj-details">
        <h2 id="proj-details" className={ui.cardTitle}>
          Details
        </h2>
        <div className={ui.grid}>
          <label className={ui.field}>
            <span>
              Web address <span className={ui.hint}>(/work/…/ , cannot change after saving)</span>
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
            <span>Type</span>
            <select value={record.category} onChange={(event) => change((d) => ((d.category = event.target.value as ProjectRecord["category"]), d))}>
              {PROJECT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABEL[c]}
                </option>
              ))}
            </select>
          </label>
          <label className={ui.field}>
            <span>Status</span>
            <select value={record.status} onChange={(event) => change((d) => ((d.status = event.target.value as ProjectRecord["status"]), d))}>
              {PROJECT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s === "live" ? "Live (public website)" : "Private build"}
                </option>
              ))}
            </select>
          </label>
          <label className={ui.field}>
            <span>Colour and picture style</span>
            <select value={record.vibe} onChange={(event) => change((d) => ((d.vibe = d.art = event.target.value as ProjectRecord["vibe"]), d))}>
              {PROJECT_VIBES.map((v) => (
                <option key={v} value={v}>
                  {LOOK_LABEL[v]}
                </option>
              ))}
            </select>
          </label>
          <label className={ui.field}>
            <span>
              Website address <span className={ui.hint}>(e.g. atlasimmo.ma; empty for a private build)</span>
            </span>
            <input value={record.url} dir="ltr" aria-invalid={Boolean(err("url"))} onChange={(event) => change((d) => ((d.url = event.target.value), d))} />
            {err("url") && <span className={ui.error}>{err("url")}</span>}
          </label>
          <MediaPicker label="Cover picture" value={record.cover} onChange={(id) => change((d) => ((d.cover = id), d))} />
          <label className={ui.check}>
            <input type="checkbox" checked={record.featured} onChange={(event) => change((d) => ((d.featured = event.target.checked), d))} />
            Featured (big card at the top of the Work page)
          </label>
        </div>
        {err("cover") && <span className={ui.error}>{err("cover")}</span>}
      </section>

      <section className={ui.card} aria-labelledby="proj-text">
        <h2 id="proj-text" className={ui.cardTitle}>
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
              onClick={() => {
                change((d) => ((d.i18n[locale] = structuredClone(d.i18n.en)), d));
                setCaseText((c) => ({ ...c, [locale]: c.en }));
              }}
            >
              Copy the English text here, then translate
            </button>
          </p>
        )}

        <div className={ui.page} style={{ marginTop: "0.75rem" }}>
          <div className={ui.grid}>
            <label className={ui.field}>
              <span>Project name</span>
              <input dir={dir} value={text.title} aria-invalid={Boolean(le.title)} onChange={(event) => setText("title", event.target.value)} />
              {le.title && <span className={ui.error}>{le.title}</span>}
            </label>
            <label className={ui.field}>
              <span>Label (e.g. Real estate)</span>
              <input dir={dir} value={text.tag} aria-invalid={Boolean(le.tag)} onChange={(event) => setText("tag", event.target.value)} />
              {le.tag && <span className={ui.error}>{le.tag}</span>}
            </label>
          </div>
          <label className={ui.field}>
            <span>Short description</span>
            <textarea dir={dir} rows={2} value={text.teaser} aria-invalid={Boolean(le.teaser)} onChange={(event) => setText("teaser", event.target.value)} />
            {le.teaser && <span className={ui.error}>{le.teaser}</span>}
          </label>
          <div className={ui.grid}>
            <label className={ui.field}>
              <span>Main result (e.g. ×3 enquiries)</span>
              <input dir={dir} value={text.result} aria-invalid={Boolean(le.result)} onChange={(event) => setText("result", event.target.value)} />
              {le.result && <span className={ui.error}>{le.result}</span>}
            </label>
            {record.featured && (
              <label className={ui.field}>
                <span>Featured headline</span>
                <input dir={dir} value={text.featuredTitle} aria-invalid={Boolean(le.featuredTitle)} onChange={(event) => setText("featuredTitle", event.target.value)} />
                {le.featuredTitle && <span className={ui.error}>{le.featuredTitle}</span>}
              </label>
            )}
          </div>

          <fieldset className={ui.field} style={{ border: 0, padding: 0, margin: 0 }}>
            <legend>Key figures (up to 4)</legend>
            {text.stats.map((stat, index) => (
              <div key={index} className={ui.actions} style={{ marginBottom: "0.5rem" }}>
                <input aria-label={`Figure ${index + 1} value`} dir={dir} value={stat.value} style={{ width: "6rem" }} onChange={(event) => change((d) => ((d.i18n[locale].stats[index]!.value = event.target.value), d))} />
                <input aria-label={`Figure ${index + 1} label`} dir={dir} value={stat.label} style={{ flex: 1, minWidth: "8rem" }} onChange={(event) => change((d) => ((d.i18n[locale].stats[index]!.label = event.target.value), d))} />
                <button type="button" className={`${ui.btn} ${ui.btnSmall} ${ui.btnDanger}`} aria-label={`Delete figure ${index + 1}`} onClick={() => change((d) => ((d.i18n[locale].stats = d.i18n[locale].stats.filter((_, i) => i !== index)), d))}>
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              </div>
            ))}
            {text.stats.length < 4 && (
              <div>
                <button type="button" className={`${ui.btn} ${ui.btnSmall}`} onClick={() => change((d) => (d.i18n[locale].stats.push({ value: "", label: "" }), d))}>
                  <Plus size={14} aria-hidden="true" /> Add a figure
                </button>
              </div>
            )}
            {(le.stats || Object.keys(le).some((k) => k.startsWith("stats."))) && <span className={ui.error}>Fill every figure (value and label), or delete it.</span>}
          </fieldset>

          <label className={ui.field}>
            <span>
              Case study <span className={ui.hint}>(the story chapters, as JSON; keep the same keys as the template)</span>
            </span>
            <textarea
              dir="ltr"
              className={ui.mono}
              rows={18}
              spellCheck={false}
              value={caseText[locale]}
              aria-invalid={Object.keys(le).some((k) => k === "case" || k.startsWith("case."))}
              onChange={(event) => {
                setCaseText((c) => ({ ...c, [locale]: event.target.value }));
                setDirty(true);
              }}
            />
          </label>
          <div className={ui.actions}>
            <button type="button" className={`${ui.btn} ${ui.btnSmall}`} onClick={() => setCaseText((c) => ({ ...c, [locale]: JSON.stringify(caseTemplate(), null, 2) }))}>
              Insert the template
            </button>
          </div>
          {Object.entries(le)
            .filter(([k]) => k === "case" || k.startsWith("case."))
            .map(([k, v]) => (
              <span key={k} className={ui.error}>
                {k}: {v}
              </span>
            ))}
        </div>
      </section>

      <div className={ui.saveBar}>
        <button type="submit" className={`${ui.btn} ${ui.btnPrimary}`} disabled={saving}>
          {saving ? "Saving…" : "Save project"}
        </button>
        {dirty && <span className={ui.muted}>Unsaved changes</span>}
        <span style={{ flex: 1 }} />
        {!isNew && (
          <button type="button" className={`${ui.btn} ${ui.btnDanger}`} onClick={() => setConfirmDelete(true)} disabled={saving}>
            Delete project
          </button>
        )}
      </div>

      <ConfirmDialog open={confirmDelete} title="Delete this project?" confirmLabel="Delete project" danger busy={saving} onConfirm={() => void remove()} onCancel={() => setConfirmDelete(false)}>
        <p>“{record.i18n.en.title}” will be removed from the site in all three languages.</p>
      </ConfirmDialog>
    </form>
  );
}
