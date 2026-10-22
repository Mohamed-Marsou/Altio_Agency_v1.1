// =============================================================================
// ADMIN LOGIN  (browser side)
// -----------------------------------------------------------------------------
// The browser never knows the password: it sends what you type to the server, and
// keeps only the short-lived session token the server answers with. The token is
// saved in this browser (localStorage) with its expiry, so a refresh or a restart of
// the browser does not ask again until it ends (8 hours) or you log out.
// =============================================================================
import { getApiBase } from "./client";

const KEY = "altio-admin-session";
export const LOGOUT_EVENT = "altio-admin-logout";

type Saved = { token: string; expiresAt: number };

export function getToken(): string | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Saved;
    if (!saved.token || saved.expiresAt <= Date.now()) {
      localStorage.removeItem(KEY);
      return null;
    }
    return saved.token;
  } catch {
    return null;
  }
}

export function saveToken(saved: Saved) {
  try {
    localStorage.setItem(KEY, JSON.stringify(saved));
  } catch {
    // storage blocked: the login works until the page is closed
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

/** The header every request to the admin server carries. */
export function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Called when the server answers "please log in": forget the token and show the login screen. */
export function signalLoggedOut() {
  clearToken();
  if (typeof window !== "undefined") window.dispatchEvent(new Event(LOGOUT_EVENT));
}

export type SessionState = {
  required: boolean;
  authenticated: boolean;
  /** accounts = email + own password, shared = one password, open = no login */
  mode: "accounts" | "shared" | "open";
  /** who is logged in (null when not logged in) */
  actor: { id: string | null; name: string } | null;
};

/** Does the server need a password, and are we logged in? null = server not reachable. */
export async function fetchSession(): Promise<SessionState | null> {
  const base = getApiBase();
  if (!base) return null;
  try {
    const response = await fetch(`${base}/api/session`, { headers: authHeaders(), cache: "no-store" });
    if (!response.ok) return null;
    return (await response.json()) as SessionState;
  } catch {
    return null;
  }
}

export type LoginOutcome = { ok: true } | { ok: false; message: string };

/** `email` is only needed in "accounts" mode. */
export async function login(password: string, email?: string): Promise<LoginOutcome> {
  const base = getApiBase();
  if (!base) return { ok: false, message: "The admin server is not connected." };
  try {
    const response = await fetch(`${base}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, ...(email ? { email } : {}) }),
    });
    const data = (await response.json().catch(() => null)) as { token?: string; expiresAt?: number; error?: { message?: string } } | null;
    if (response.ok && data?.token && data.expiresAt) {
      saveToken({ token: data.token, expiresAt: data.expiresAt });
      return { ok: true };
    }
    return { ok: false, message: data?.error?.message ?? "Login failed." };
  } catch {
    return { ok: false, message: "Could not reach the admin server. Is `npm run dev` running?" };
  }
}

export async function logout() {
  const base = getApiBase();
  if (base) {
    try {
      await fetch(`${base}/api/logout`, { method: "POST", headers: authHeaders() });
    } catch {
      // the token is dropped here anyway
    }
  }
  clearToken();
}
