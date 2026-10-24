/* eslint-disable @next/next/no-img-element -- pictures here are local previews of the uploaded WebP files */
"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError, adminApi } from "@/lib/admin/client";
import { pickVariant } from "@/lib/admin/helpers";
import { PROJECT_CATEGORIES, type MediaEntry, type ProjectRecord } from "@/lib/admin/schemas";
import ConfirmDialog from "./ConfirmDialog";
import ServerNotice from "./ServerNotice";
import ui from "./ui.module.scss";

// The list of projects (case studies): search, filter by type, edit and delete.
export default function ProjectListView() {
  const [projects, setProjects] = useState<ProjectRecord[] | null>(null);
  const [media, setMedia] = useState<MediaEntry[]>([]);
  const [offline, setOffline] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [toDelete, setToDelete] = useState<ProjectRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const [p, m] = await Promise.all([adminApi.projects.list(), adminApi.media.list()]);
      setProjects(p);
      setMedia(m);
      setOffline(false);
    } catch (error) {
      if (error instanceof ApiError && error.code === "OFFLINE") setOffline(true);
      else setMessage({ kind: "error", text: error instanceof ApiError ? error.message : "Could not load the projects." });
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => void load(), 0);
    return () => clearTimeout(id);
  }, [load]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (projects ?? []).filter(
      (project) => (category === "all" || project.category === category) && (!q || `${project.slug} ${project.i18n.en.title} ${project.i18n.fr.title}`.toLowerCase().includes(q)),
    );
  }, [projects, query, category]);

  async function confirmDelete() {
    if (!toDelete) return;
    setBusy(true);
    try {
      await adminApi.projects.remove(toDelete.slug);
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
          <h1 className={ui.title}>Projects</h1>
          <p className={ui.sub}>The case studies shown on the Work page.</p>
        </div>
        <Link href="/admindash/projects/edit/" className={`${ui.btn} ${ui.btnPrimary}`}>
          <Plus size={16} aria-hidden="true" /> New project
        </Link>
      </div>

      {offline && <ServerNotice />}
      {message && (
        <div className={`${ui.notice} ${message.kind === "success" ? ui.noticeSuccess : ui.noticeError}`} role={message.kind === "error" ? "alert" : "status"}>
          {message.text}
        </div>
      )}

      {projects && (
        <>
          <div className={ui.toolbar}>
            <label className={ui.field}>
              <span className={ui.srOnly}>Search</span>
              <input type="search" placeholder="Search by name or address" value={query} onChange={(event) => setQuery(event.target.value)} />
            </label>
            <label className={ui.field}>
              <span className={ui.srOnly}>Type</span>
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="all">All types</option>
                {PROJECT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <p className={ui.muted}>
            {shown.length} of {projects.length} projects
          </p>

          {shown.length === 0 ? (
            <p className={ui.empty}>{projects.length === 0 ? "No project yet." : "No project matches your search."}</p>
          ) : (
            <ul className={ui.list}>
              {shown.map((project) => {
                const cover = media.find((m) => m.id === project.cover);
                const variant = cover ? pickVariant(cover, 480) : undefined;
                return (
                  <li key={project.slug} className={ui.row}>
                    {variant ? <img className={ui.thumb} src={variant.path} alt="" /> : <span className={ui.thumb} aria-hidden="true" />}
                    <div className={ui.rowMain}>
                      <strong>{project.i18n.en.title}</strong>
                      <span className={ui.muted}>
                        <span className={`${ui.badge} ${ui.badgeAccent}`}>{project.category}</span>
                        <span className={ui.badge}>{project.status}</span>
                        {project.featured && <span className={ui.badge}>Featured</span>}
                        /work/{project.slug}/
                      </span>
                    </div>
                    <div className={ui.rowActions}>
                      <Link href={`/admindash/projects/edit/?slug=${project.slug}`} className={`${ui.btn} ${ui.btnSmall}`}>
                        Edit
                      </Link>
                      <button type="button" className={`${ui.btn} ${ui.btnSmall} ${ui.btnDanger}`} onClick={() => setToDelete(project)}>
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

      <ConfirmDialog open={toDelete !== null} title="Delete this project?" confirmLabel="Delete project" danger busy={busy} onConfirm={() => void confirmDelete()} onCancel={() => setToDelete(null)}>
        <p>“{toDelete?.i18n.en.title}” will be removed from the site in all three languages.</p>
      </ConfirmDialog>
    </div>
  );
}
