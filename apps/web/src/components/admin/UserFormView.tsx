"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { MIN_PASSWORD, passwordProblem, type PublicAdmin } from "@/lib/admin/adminSchemas";
import { ApiError, adminApi } from "@/lib/admin/client";
import { useQueryParam } from "@/lib/admin/useQueryParam";
import ServerNotice from "./ServerNotice";
import ui from "./ui.module.scss";

type Form = { name: string; email: string; description: string; status: PublicAdmin["status"] };
const EMPTY: Form = { name: "", email: "", description: "", status: "active" };

// Create a new admin, or change one (name, email, description, active/disabled, new password).
export default function UserFormView() {
  const id = useQueryParam("id");
  const [savedId, setSavedId] = useState<string | null>(null);
  const adminId = savedId ?? id ?? null;
  const isNew = adminId === null;

  const [form, setForm] = useState<Form>(EMPTY);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [offline, setOffline] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  // New password for an existing admin (separate card, separate button)
  const [newPassword, setNewPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (id === undefined) return; // the address was not read yet
    if (id === null) {
      const t = setTimeout(() => setLoaded(true), 0);
      return () => clearTimeout(t);
    }
    let alive = true;
    adminApi.admins
      .get(id)
      .then((admin) => {
        if (!alive) return;
        setForm({ name: admin.name, email: admin.email, description: admin.description, status: admin.status });
        setLoaded(true);
      })
      .catch((error) => {
        if (!alive) return;
        if (error instanceof ApiError && error.code === "OFFLINE") setOffline(true);
        else setMessage({ kind: "error", text: error instanceof ApiError ? error.message : "Could not load this admin." });
        setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, [id]);

  const set = (key: keyof Form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  async function save(event: FormEvent) {
    event.preventDefault();
    const problems: Record<string, string> = {};
    if (form.name.trim().length < 2) problems.name = "Enter a name (2 letters at least)";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) problems.email = "Enter a valid email address";
    if (isNew) {
      const problem = passwordProblem(password, form);
      if (problem) problems.password = problem;
    }
    setFields(problems);
    if (Object.keys(problems).length) return setMessage({ kind: "error", text: "Please fix the fields in red." });

    setBusy(true);
    setMessage(null);
    try {
      const base = { name: form.name, email: form.email, description: form.description };
      if (isNew) {
        const created = await adminApi.admins.create({ ...base, password });
        setSavedId(created.id);
        setPassword("");
        window.history.replaceState(null, "", `/admindash/users/edit/?id=${created.id}`);
        setMessage({ kind: "success", text: "Admin created. If this was the first one, you will be asked to log in with it." });
      } else {
        await adminApi.admins.update(adminId, { ...base, status: form.status });
        setMessage({ kind: "success", text: "Saved." });
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setFields(error.fields ?? {});
        setMessage({ kind: "error", text: error.message });
      } else setMessage({ kind: "error", text: "Could not save." });
    } finally {
      setBusy(false);
    }
  }

  async function changePassword() {
    if (!adminId) return;
    const problem = passwordProblem(newPassword, form);
    if (problem) return setPasswordMessage({ kind: "error", text: problem });
    setBusy(true);
    try {
      await adminApi.admins.setPassword(adminId, newPassword);
      setNewPassword("");
      setPasswordMessage({ kind: "success", text: "New password saved. That admin must log in again." });
    } catch (error) {
      setPasswordMessage({ kind: "error", text: error instanceof ApiError ? (error.fields?.password ?? error.message) : "Could not save the password." });
    } finally {
      setBusy(false);
    }
  }

  const err = (key: string) => fields[key];

  return (
    <div className={ui.page}>
      <div className={ui.head}>
        <div>
          <h1 className={ui.title}>{isNew ? "New admin" : "Edit admin"}</h1>
          <p className={ui.sub}>Name, email and a short description. Only people with an account can open this dashboard.</p>
        </div>
        <div className={ui.actions}>
          {!isNew && (
            <Link href={`/admindash/users/profile/?id=${adminId}`} className={ui.btn}>
              Full page
            </Link>
          )}
          <Link href="/admindash/users/" className={ui.btn}>
            Back to the list
          </Link>
        </div>
      </div>

      {offline && <ServerNotice />}
      {message && (
        <div className={`${ui.notice} ${message.kind === "success" ? ui.noticeSuccess : ui.noticeError}`} role={message.kind === "error" ? "alert" : "status"}>
          {message.text}
        </div>
      )}

      {loaded && !offline && (
        <>
          <form onSubmit={save} className={ui.card} noValidate>
            <h2 className={ui.cardTitle}>Details</h2>
            <div className={ui.grid}>
              <label className={ui.field}>
                <span>Name</span>
                <input value={form.name} maxLength={80} aria-invalid={Boolean(err("name"))} onChange={(e) => set("name", e.target.value)} />
                {err("name") && <small className={ui.error}>{err("name")}</small>}
              </label>
              <label className={ui.field}>
                <span>Email (used to log in)</span>
                <input type="email" value={form.email} maxLength={120} autoComplete="off" aria-invalid={Boolean(err("email"))} onChange={(e) => set("email", e.target.value)} />
                {err("email") && <small className={ui.error}>{err("email")}</small>}
              </label>
            </div>
            <label className={ui.field}>
              <span>Description (role in the team, what they handle)</span>
              <textarea rows={3} value={form.description} maxLength={500} aria-invalid={Boolean(err("description"))} onChange={(e) => set("description", e.target.value)} />
              <small className={ui.hint}>{form.description.length}/500. Only visible in this dashboard, never on the public site.</small>
              {err("description") && <small className={ui.error}>{err("description")}</small>}
            </label>

            {isNew ? (
              <>
                <label className={ui.field}>
                  <span>Password</span>
                  <input type={showPassword ? "text" : "password"} value={password} autoComplete="new-password" aria-invalid={Boolean(err("password"))} onChange={(e) => setPassword(e.target.value)} />
                  <small className={ui.hint}>At least {MIN_PASSWORD} characters. Several words together work well. It is stored as a one-way fingerprint; nobody can read it back.</small>
                  {err("password") && <small className={ui.error}>{err("password")}</small>}
                </label>
                <label className={ui.check}>
                  <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />
                  Show the password
                </label>
              </>
            ) : (
              <label className={ui.field}>
                <span>Status</span>
                <select value={form.status} onChange={(e) => set("status", e.target.value)}>
                  <option value="active">Active (can log in)</option>
                  <option value="disabled">Disabled (cannot log in)</option>
                </select>
              </label>
            )}

            <div className={ui.actions}>
              <button type="submit" className={`${ui.btn} ${ui.btnPrimary}`} disabled={busy}>
                {busy ? "Saving…" : isNew ? "Create admin" : "Save changes"}
              </button>
            </div>
          </form>

          {!isNew && (
            <section className={ui.card} aria-labelledby="pw-title">
              <h2 id="pw-title" className={ui.cardTitle}>Set a new password</h2>
              <p className={ui.muted}>Use it if the password was forgotten. That admin is logged out everywhere and must use the new one.</p>
              <label className={ui.field}>
                <span>New password</span>
                <input type="password" value={newPassword} autoComplete="new-password" onChange={(e) => setNewPassword(e.target.value)} />
              </label>
              {passwordMessage && (
                <p role={passwordMessage.kind === "error" ? "alert" : "status"} className={passwordMessage.kind === "error" ? ui.error : ui.muted}>
                  {passwordMessage.text}
                </p>
              )}
              <div className={ui.actions}>
                <button type="button" className={ui.btn} disabled={busy || !newPassword} onClick={() => void changePassword()}>
                  Save the new password
                </button>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
