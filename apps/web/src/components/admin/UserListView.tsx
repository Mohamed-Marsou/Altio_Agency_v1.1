"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { fetchSession, type SessionState } from "@/lib/admin/auth-client";
import type { PublicAdmin } from "@/lib/admin/adminSchemas";
import { ApiError, adminApi } from "@/lib/admin/client";
import { formatDateTime } from "@/lib/admin/helpers";
import ConfirmDialog from "./ConfirmDialog";
import ServerNotice from "./ServerNotice";
import ui from "./ui.module.scss";

// The list of admins: add, edit, open the full page of one, delete.
export default function UserListView() {
  const [admins, setAdmins] = useState<PublicAdmin[] | null>(null);
  const [session, setSession] = useState<SessionState | null>(null);
  const [offline, setOffline] = useState(false);
  const [toDelete, setToDelete] = useState<PublicAdmin | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const [list, current] = await Promise.all([adminApi.admins.list(), fetchSession()]);
      setAdmins(list);
      setSession(current);
      setOffline(false);
    } catch (error) {
      if (error instanceof ApiError && error.code === "OFFLINE") setOffline(true);
      else setMessage({ kind: "error", text: error instanceof ApiError ? error.message : "Could not load the admins." });
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => void load(), 0);
    return () => clearTimeout(id);
  }, [load]);

  async function confirmDelete() {
    if (!toDelete) return;
    setBusy(true);
    try {
      await adminApi.admins.remove(toDelete.id);
      setMessage({ kind: "success", text: `${toDelete.name} was deleted. Their past work stays on the site, under Altio.` });
      setToDelete(null);
      await load();
    } catch (error) {
      setToDelete(null);
      setMessage({ kind: "error", text: error instanceof ApiError ? error.message : "Delete failed." });
    } finally {
      setBusy(false);
    }
  }

  const myId = session?.actor?.id ?? null;

  return (
    <div className={ui.page}>
      <div className={ui.head}>
        <div>
          <h1 className={ui.title}>Users and admins</h1>
          <p className={ui.sub}>The people who can log into this dashboard. Visitors of the public site have no account.</p>
        </div>
        <Link href="/admindash/users/edit/" className={`${ui.btn} ${ui.btnPrimary}`}>
          <Plus size={16} aria-hidden="true" /> New admin
        </Link>
      </div>

      {offline && <ServerNotice />}
      {message && (
        <div className={`${ui.notice} ${message.kind === "success" ? ui.noticeSuccess : ui.noticeError}`} role={message.kind === "error" ? "alert" : "status"}>
          {message.text}
        </div>
      )}

      {admins && session && session.mode !== "accounts" && (
        <div className={`${ui.notice} ${ui.noticeWarn}`} role="note">
          {session.mode === "shared"
            ? "Today everybody uses one shared password. As soon as you create the first admin here, that password stops working and each admin logs in with their email and their own password."
            : "There is no login yet (your own computer). When you create the first admin, the dashboard starts asking for email and password."}
        </div>
      )}

      {admins &&
        (admins.length === 0 ? (
          <p className={ui.empty}>No admin account yet.</p>
        ) : (
          <ul className={ui.list}>
            {admins.map((admin) => (
              <li key={admin.id} className={ui.row}>
                <span className={ui.thumb} aria-hidden="true" style={{ display: "grid", placeItems: "center", fontWeight: 700 }}>
                  {admin.name.trim().charAt(0).toUpperCase()}
                </span>
                <div className={ui.rowMain}>
                  <strong>
                    {admin.name}
                    {admin.id === myId && <span className={`${ui.badge} ${ui.badgeAccent}`}>You</span>}
                    {admin.status === "disabled" && <span className={ui.badge}>Disabled</span>}
                  </strong>
                  <span className={ui.muted}>
                    {admin.email} · {admin.lastLoginAt ? `last login ${formatDateTime(admin.lastLoginAt)}` : "never logged in"}
                  </span>
                  {admin.description && <span className={ui.muted}>{admin.description}</span>}
                </div>
                <div className={ui.rowActions}>
                  <Link href={`/admindash/users/profile/?id=${admin.id}`} className={`${ui.btn} ${ui.btnSmall}`}>
                    Full page
                  </Link>
                  <Link href={`/admindash/users/edit/?id=${admin.id}`} className={`${ui.btn} ${ui.btnSmall}`}>
                    Edit
                  </Link>
                  <button type="button" className={`${ui.btn} ${ui.btnSmall} ${ui.btnDanger}`} disabled={admin.id === myId} title={admin.id === myId ? "You cannot delete your own account" : undefined} onClick={() => setToDelete(admin)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ))}

      <ConfirmDialog open={toDelete !== null} title="Delete this admin?" confirmLabel="Delete admin" danger busy={busy} onConfirm={() => void confirmDelete()} onCancel={() => setToDelete(null)}>
        <p>
          {toDelete?.name} will no longer be able to log in. The posts, projects and pictures they made stay on the site (under Altio); the history of what they did is kept.
        </p>
      </ConfirmDialog>
    </div>
  );
}
