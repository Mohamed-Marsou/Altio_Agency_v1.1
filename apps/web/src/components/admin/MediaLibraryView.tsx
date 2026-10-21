/* eslint-disable @next/next/no-img-element -- pictures here are local previews of the uploaded WebP files */
"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, adminApi } from "@/lib/admin/client";
import { formatBytes, pickVariant } from "@/lib/admin/helpers";
import type { MediaEntry, PostRecord, ProjectRecord } from "@/lib/admin/schemas";
import ConfirmDialog from "./ConfirmDialog";
import ServerNotice from "./ServerNotice";
import UploadDropzone from "./UploadDropzone";
import ui from "./ui.module.scss";

// The picture library: upload (converted to WebP automatically), write the alt
// text in each language (needed for accessibility and SEO), see where a picture
// is used and delete the ones that are not.
export default function MediaLibraryView() {
  const [items, setItems] = useState<MediaEntry[] | null>(null);
  const [uses, setUses] = useState<Record<string, string[]>>({});
  const [offline, setOffline] = useState(false);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [toDelete, setToDelete] = useState<MediaEntry | null>(null);
  const [busy, setBusy] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, MediaEntry["alt"]>>({});

  const load = useCallback(async () => {
    try {
      const [media, posts, projects] = await Promise.all([adminApi.media.list(), adminApi.posts.list(), adminApi.projects.list()]);
      const map: Record<string, string[]> = {};
      posts.forEach((p: PostRecord) => p.cover && (map[p.cover] ??= []).push(`Post: ${p.i18n.en.title}`));
      projects.forEach((p: ProjectRecord) => p.cover && (map[p.cover] ??= []).push(`Project: ${p.i18n.en.title}`));
      setItems(media);
      setUses(map);
      setOffline(false);
    } catch (error) {
      if (error instanceof ApiError && error.code === "OFFLINE") setOffline(true);
      else setMessage({ kind: "error", text: error instanceof ApiError ? error.message : "Could not load the pictures." });
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => void load(), 0);
    return () => clearTimeout(id);
  }, [load]);

  async function saveAlt(media: MediaEntry) {
    const alt = drafts[media.id];
    if (!alt) return;
    try {
      await adminApi.media.setAlt(media.id, alt);
      setMessage({ kind: "success", text: "Alt text saved." });
      setDrafts((d) => Object.fromEntries(Object.entries(d).filter(([id]) => id !== media.id)));
      await load();
    } catch (error) {
      setMessage({ kind: "error", text: error instanceof ApiError ? error.message : "Could not save the alt text." });
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setBusy(true);
    try {
      await adminApi.media.remove(toDelete.id);
      setMessage({ kind: "success", text: "Picture deleted." });
      setToDelete(null);
      await load();
    } catch (error) {
      setToDelete(null);
      setMessage({ kind: "error", text: error instanceof ApiError ? error.message : "Delete failed." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={ui.page}>
      <div className={ui.head}>
        <div>
          <h1 className={ui.title}>Media</h1>
          <p className={ui.sub}>Every picture is converted to WebP, resized to 480, 960 and 1600 px, and cleaned of hidden data.</p>
        </div>
      </div>

      {offline && <ServerNotice />}
      {message && (
        <div className={`${ui.notice} ${message.kind === "success" ? ui.noticeSuccess : ui.noticeError}`} role={message.kind === "error" ? "alert" : "status"}>
          {message.text}
        </div>
      )}

      {!offline && <UploadDropzone onUploaded={() => void load()} />}

      {items && (
        <>
          <p className={ui.muted}>{items.length} pictures</p>
          {items.length === 0 ? (
            <p className={ui.empty}>No picture yet. Upload your first one above.</p>
          ) : (
            <div className={ui.mediaGrid}>
              {items.map((media) => {
                const variant = pickVariant(media, 480);
                const alt = drafts[media.id] ?? media.alt;
                const total = media.variants.reduce((sum, v) => sum + v.bytes, 0);
                const used = uses[media.id] ?? [];
                return (
                  <article key={media.id} className={ui.mediaCard}>
                    {variant && <img src={variant.path} alt={media.alt.en || media.originalName} loading="lazy" />}
                    <strong style={{ overflowWrap: "anywhere" }}>{media.originalName}</strong>
                    <span className={ui.muted}>
                      {media.width} × {media.height} · {media.variants.length} sizes · {formatBytes(total)}
                    </span>
                    {(["en", "fr", "ar"] as const).map((l) => (
                      <label key={l} className={ui.field}>
                        <span>Alt text ({l.toUpperCase()})</span>
                        <input
                          dir={l === "ar" ? "rtl" : "ltr"}
                          value={alt[l]}
                          maxLength={200}
                          onChange={(event) => setDrafts((d) => ({ ...d, [media.id]: { ...alt, [l]: event.target.value } }))}
                        />
                      </label>
                    ))}
                    {!alt.en && <span className={ui.error}>English alt text is missing.</span>}
                    {used.length > 0 && <span className={ui.muted}>Used by: {used.join(", ")}</span>}
                    <div className={ui.actions}>
                      <button type="button" className={`${ui.btn} ${ui.btnSmall} ${ui.btnPrimary}`} disabled={!drafts[media.id]} onClick={() => void saveAlt(media)}>
                        Save alt text
                      </button>
                      <button type="button" className={`${ui.btn} ${ui.btnSmall} ${ui.btnDanger}`} onClick={() => setToDelete(media)}>
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      <ConfirmDialog open={toDelete !== null} title="Delete this picture?" confirmLabel="Delete picture" danger busy={busy} onConfirm={() => void confirmDelete()} onCancel={() => setToDelete(null)}>
        <p>“{toDelete?.originalName}” and its three sizes will be removed. A picture that is still used as a cover cannot be deleted.</p>
      </ConfirmDialog>
    </div>
  );
}
