/* eslint-disable @next/next/no-img-element -- small previews of the uploaded WebP files */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ActivityEvent, AdminProfile, ProfileItem } from "@/lib/admin/adminSchemas";
import { ApiError, adminApi } from "@/lib/admin/client";
import { formatDateTime } from "@/lib/admin/helpers";
import { useQueryParam } from "@/lib/admin/useQueryParam";
import ServerNotice from "./ServerNotice";
import ui from "./ui.module.scss";

// Where to open an item in the dashboard.
const hrefFor = (kind: string, id: string): string | null =>
  kind === "post" ? `/admindash/blog/edit/?slug=${id}` : kind === "project" ? `/admindash/projects/edit/?slug=${id}` : kind === "media" ? "/admindash/media/" : null;

const KIND_LABEL: Record<string, string> = { post: "Post", project: "Project", media: "Picture", admin: "Admin" };
const ACTION_LABEL: Record<string, string> = {
  create: "created",
  update: "edited",
  delete: "deleted",
  password: "changed the password of",
  disable: "disabled",
  enable: "enabled",
};

function ItemList({ items, kind, empty }: { items: ProfileItem[]; kind: string; empty: string }) {
  if (items.length === 0) return <p className={ui.muted}>{empty}</p>;
  return (
    <ul className={ui.list}>
      {items.map((item) => {
        const href = item.exists ? hrefFor(kind, item.id) : null;
        return (
          <li key={`${kind}-${item.id}`} className={ui.row}>
            {kind === "media" &&
              (item.thumb ? <img className={ui.thumb} src={item.thumb} alt="" /> : <span className={ui.thumb} aria-hidden="true" />)}
            <div className={ui.rowMain}>
              <strong>{item.title}</strong>
              <span className={ui.muted}>
                {formatDateTime(item.at)}
                {!item.exists && <span className={ui.badge}>Deleted since</span>}
              </span>
            </div>
            {href && (
              <div className={ui.rowActions}>
                <Link href={href} className={`${ui.btn} ${ui.btnSmall}`}>
                  Open
                </Link>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

// The full page of one admin: details, totals, and everything they created, edited and deleted.
export default function UserProfileView() {
  const id = useQueryParam("id");
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id === undefined) return;
    if (id === null) {
      const t = setTimeout(() => setError("No admin selected."), 0);
      return () => clearTimeout(t);
    }
    let alive = true;
    adminApi.admins
      .profile(id)
      .then((p) => alive && setProfile(p))
      .catch((e) => {
        if (!alive) return;
        if (e instanceof ApiError && e.code === "OFFLINE") setOffline(true);
        else setError(e instanceof ApiError ? e.message : "Could not load this page.");
      });
    return () => {
      alive = false;
    };
  }, [id]);

  const admin = profile?.admin;
  const totals = profile?.totals;

  return (
    <div className={ui.page}>
      <div className={ui.head}>
        <div>
          <h1 className={ui.title}>{admin ? admin.name : "Admin"}</h1>
          <p className={ui.sub}>{admin ? admin.email : "Full page of one admin"}</p>
        </div>
        <div className={ui.actions}>
          {admin && (
            <Link href={`/admindash/users/edit/?id=${admin.id}`} className={ui.btn}>
              Edit
            </Link>
          )}
          <Link href="/admindash/users/" className={ui.btn}>
            Back to the list
          </Link>
        </div>
      </div>

      {offline && <ServerNotice />}
      {error && (
        <div className={`${ui.notice} ${ui.noticeError}`} role="alert">
          {error}
        </div>
      )}

      {profile && admin && totals && (
        <>
          <section className={ui.card} aria-label="Details">
            <p>
              <span className={`${ui.badge} ${admin.status === "active" ? ui.badgeAccent : ""}`}>{admin.status === "active" ? "Active" : "Disabled"}</span>
              <span className={ui.badge}>{admin.role}</span>
            </p>
            <p>{admin.description || <span className={ui.muted}>No description.</span>}</p>
            <p className={ui.muted}>
              Account created {formatDateTime(admin.createdAt)}
              {admin.createdByName ? ` by ${admin.createdByName}` : ""} · {admin.lastLoginAt ? `last login ${formatDateTime(admin.lastLoginAt)}` : "never logged in"}
            </p>
          </section>

          <div className={ui.notice} role="note">
            Private view. On the public site everything stays published by Altio: no page, feed or data shows who made a post, a project or a picture.
          </div>

          <section aria-label="Totals" className={ui.grid}>
            {[
              ["Posts created", totals.posts],
              ["Projects created", totals.projects],
              ["Pictures uploaded", totals.media],
              ["Edits", totals.edits],
              ["Deletions", totals.deletions],
            ].map(([label, value]) => (
              <div key={label} className={ui.card}>
                <p className={ui.muted}>{label}</p>
                <p className={ui.title} style={{ fontSize: "1.75rem", margin: 0 }}>
                  {value}
                </p>
              </div>
            ))}
          </section>

          <section className={ui.card} aria-labelledby="h-posts">
            <h2 id="h-posts" className={ui.cardTitle}>Blog posts created ({totals.posts})</h2>
            <ItemList items={profile.created.posts} kind="post" empty="No post yet. Posts made before accounts existed have no owner." />
          </section>

          <section className={ui.card} aria-labelledby="h-projects">
            <h2 id="h-projects" className={ui.cardTitle}>Projects created ({totals.projects})</h2>
            <ItemList items={profile.created.projects} kind="project" empty="No project yet." />
          </section>

          <section className={ui.card} aria-labelledby="h-media">
            <h2 id="h-media" className={ui.cardTitle}>Pictures uploaded ({totals.media})</h2>
            <ItemList items={profile.created.media} kind="media" empty="No picture yet." />
          </section>

          <section className={ui.card} aria-labelledby="h-edited">
            <h2 id="h-edited" className={ui.cardTitle}>Edited ({profile.edited.length})</h2>
            {profile.edited.length === 0 ? (
              <p className={ui.muted}>Nothing edited yet.</p>
            ) : (
              <ul className={ui.list}>
                {profile.edited.map((item) => {
                  const href = item.exists ? hrefFor(item.kind, item.id) : null;
                  return (
                    <li key={`${item.kind}-${item.id}`} className={ui.row}>
                      <div className={ui.rowMain}>
                        <strong>{item.title}</strong>
                        <span className={ui.muted}>
                          <span className={ui.badge}>{KIND_LABEL[item.kind]}</span>
                          {item.times}× · last {formatDateTime(item.at)}
                          {!item.createdByThisAdmin && " · made by someone else"}
                          {!item.exists && <span className={ui.badge}>Deleted since</span>}
                        </span>
                      </div>
                      {href && (
                        <div className={ui.rowActions}>
                          <Link href={href} className={`${ui.btn} ${ui.btnSmall}`}>
                            Open
                          </Link>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className={ui.card} aria-labelledby="h-deleted">
            <h2 id="h-deleted" className={ui.cardTitle}>Deleted ({profile.deleted.length})</h2>
            {profile.deleted.length === 0 ? (
              <p className={ui.muted}>Nothing deleted.</p>
            ) : (
              <ul className={ui.list}>
                {profile.deleted.map((item, index) => (
                  <li key={`${item.kind}-${item.id}-${index}`} className={ui.row}>
                    <div className={ui.rowMain}>
                      <strong>{item.title}</strong>
                      <span className={ui.muted}>
                        <span className={ui.badge}>{KIND_LABEL[item.kind]}</span>
                        {formatDateTime(item.at)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={ui.card} aria-labelledby="h-recent">
            <h2 id="h-recent" className={ui.cardTitle}>Recent activity</h2>
            {profile.recent.length === 0 ? (
              <p className={ui.muted}>No activity yet.</p>
            ) : (
              <ul className={ui.list}>
                {profile.recent.map((event: ActivityEvent) => (
                  <li key={event.id} className={ui.row}>
                    <div className={ui.rowMain}>
                      <span>
                        {ACTION_LABEL[event.action]} <strong>{event.title}</strong> <span className={ui.badge}>{KIND_LABEL[event.kind]}</span>
                      </span>
                      <span className={ui.muted}>{formatDateTime(event.at)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
