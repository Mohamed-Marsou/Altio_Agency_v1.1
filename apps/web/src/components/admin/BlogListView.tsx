/* eslint-disable @next/next/no-img-element -- pictures here are local previews of the uploaded WebP files */
"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError, adminApi } from "@/lib/admin/client";
import { pickVariant } from "@/lib/admin/helpers";
import { POST_CATEGORIES, type MediaEntry, type PostRecord } from "@/lib/admin/schemas";
import ConfirmDialog from "./ConfirmDialog";
import ServerNotice from "./ServerNotice";
import ui from "./ui.module.scss";

// The list of blog posts: search, filter by topic, edit and delete.
export default function BlogListView() {
  const [posts, setPosts] = useState<PostRecord[] | null>(null);
  const [media, setMedia] = useState<MediaEntry[]>([]);
  const [offline, setOffline] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [toDelete, setToDelete] = useState<PostRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const [p, m] = await Promise.all([adminApi.posts.list(), adminApi.media.list()]);
      setPosts(p);
      setMedia(m);
      setOffline(false);
    } catch (error) {
      if (error instanceof ApiError && error.code === "OFFLINE") setOffline(true);
      else setMessage({ kind: "error", text: error instanceof ApiError ? error.message : "Could not load the posts." });
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => void load(), 0);
    return () => clearTimeout(id);
  }, [load]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (posts ?? []).filter(
      (post) => (category === "all" || post.category === category) && (!q || `${post.slug} ${post.i18n.en.title} ${post.i18n.fr.title}`.toLowerCase().includes(q)),
    );
  }, [posts, query, category]);

  async function confirmDelete() {
    if (!toDelete) return;
    setBusy(true);
    try {
      await adminApi.posts.remove(toDelete.slug);
      setMessage({ kind: "success", text: `“${toDelete.i18n.en.title}” was deleted.` });
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
          <h1 className={ui.title}>Blog</h1>
          <p className={ui.sub}>Articles shown on the public blog, in English, French and Arabic.</p>
        </div>
        <Link href="/admindash/blog/edit/" className={`${ui.btn} ${ui.btnPrimary}`}>
          <Plus size={16} aria-hidden="true" /> New post
        </Link>
      </div>

      {offline && <ServerNotice />}
      {message && (
        <div className={`${ui.notice} ${message.kind === "success" ? ui.noticeSuccess : ui.noticeError}`} role={message.kind === "error" ? "alert" : "status"}>
          {message.text}
        </div>
      )}

      {posts && (
        <>
          <div className={ui.toolbar}>
            <label className={ui.field}>
              <span className={ui.srOnly}>Search</span>
              <input type="search" placeholder="Search by title or address" value={query} onChange={(event) => setQuery(event.target.value)} />
            </label>
            <label className={ui.field}>
              <span className={ui.srOnly}>Topic</span>
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="all">All topics</option>
                {POST_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <p className={ui.muted}>
            {shown.length} of {posts.length} posts
          </p>

          {shown.length === 0 ? (
            <p className={ui.empty}>{posts.length === 0 ? "No post yet." : "No post matches your search."}</p>
          ) : (
            <ul className={ui.list}>
              {shown.map((post) => {
                const cover = media.find((m) => m.id === post.cover);
                const variant = cover ? pickVariant(cover, 480) : undefined;
                return (
                  <li key={post.slug} className={ui.row}>
                    {variant ? <img className={ui.thumb} src={variant.path} alt="" /> : <span className={ui.thumb} aria-hidden="true" />}
                    <div className={ui.rowMain}>
                      <strong>{post.i18n.en.title}</strong>
                      <span className={ui.muted}>
                        <span className={`${ui.badge} ${ui.badgeAccent}`}>{post.category}</span>
                        {post.featured && <span className={ui.badge}>Featured</span>}
                        {post.date} · {post.readTime} min · /blog/{post.slug}/
                      </span>
                    </div>
                    <div className={ui.rowActions}>
                      <Link href={`/admindash/blog/edit/?slug=${post.slug}`} className={`${ui.btn} ${ui.btnSmall}`}>
                        Edit
                      </Link>
                      <button type="button" className={`${ui.btn} ${ui.btnSmall} ${ui.btnDanger}`} onClick={() => setToDelete(post)}>
                        Delete
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      <ConfirmDialog open={toDelete !== null} title="Delete this post?" confirmLabel="Delete post" danger busy={busy} onConfirm={() => void confirmDelete()} onCancel={() => setToDelete(null)}>
        <p>“{toDelete?.i18n.en.title}” will be removed from the site in all three languages.</p>
      </ConfirmDialog>
    </div>
  );
}
