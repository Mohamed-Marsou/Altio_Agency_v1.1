"use client";

import { useState, type FormEvent } from "react";
import { login } from "@/lib/admin/auth-client";
import ui from "./ui.module.scss";

// The password screen of the dashboard. The password goes to the admin server, which
// compares it with a stored fingerprint; this page never holds the real password.
// With admin accounts ("accounts" mode) it also asks for the email.
export default function LoginScreen({ onSuccess, mode = "shared" }: { onSuccess: () => void; mode?: "accounts" | "shared" | "open" }) {
  const withEmail = mode === "accounts";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [visible, setVisible] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (withEmail && !email.trim()) return setError("Enter your email.");
    if (!password) return setError("Enter your password.");
    setBusy(true);
    setError("");
    const result = await login(password, withEmail ? email.trim() : undefined);
    setBusy(false);
    if (result.ok) {
      setPassword("");
      onSuccess();
    } else {
      setError(result.message);
    }
  }

  return (
    <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: "1rem", background: "var(--color-page)", color: "var(--color-text)" }}>
      <form onSubmit={submit} className={ui.card} style={{ width: "min(26rem, 100%)" }} noValidate>
        <h1 className={ui.title} style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>
          Altio admin
        </h1>
        <p className={ui.sub} style={{ marginBottom: "1rem" }}>
          Private area. {withEmail ? "Log in with your admin email and password." : "Enter the dashboard password."}
        </p>

        {withEmail && (
          <label className={ui.field}>
            <span>Email</span>
            <input type="email" value={email} autoComplete="username" autoFocus onChange={(event) => setEmail(event.target.value)} />
          </label>
        )}

        <label className={ui.field}>
          <span>Password</span>
          <input
            type={visible ? "text" : "password"}
            value={password}
            autoComplete="current-password"
            autoFocus={!withEmail}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "login-error" : undefined}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <label className={ui.check}>
          <input type="checkbox" checked={visible} onChange={(event) => setVisible(event.target.checked)} />
          Show the password
        </label>

        {error && (
          <p id="login-error" role="alert" className={ui.error} style={{ margin: "0.5rem 0" }}>
            {error}
          </p>
        )}

        <button type="submit" className={`${ui.btn} ${ui.btnPrimary}`} disabled={busy} style={{ width: "100%", marginTop: "0.5rem" }}>
          {busy ? "Checking…" : "Log in"}
        </button>
      </form>
    </main>
  );
}
