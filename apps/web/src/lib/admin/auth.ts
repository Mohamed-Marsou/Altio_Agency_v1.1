// =============================================================================
// ADMIN LOGIN  (server side only: runs in the dev server, later in the backend)
// -----------------------------------------------------------------------------
// Passwords are NEVER written in the code and never sent to the browser. Only one-way
// fingerprints (scrypt) are stored. Three modes, picked automatically:
//
//   accounts  at least one admin exists (Users page) -> log in with email + own password
//   shared    no admin yet, ADMIN_PASSWORD_HASH is set in apps/web/.env.local
//             -> one password for everybody (temporary, see `npm run admin:password`)
//   open      no admin and no shared password -> no login (your own computer only)
//
// Same rules as the future backend: constant-time compare, a lock after 5 wrong tries
// (per address AND per email), sessions that expire and end when the admin is disabled,
// deleted or gets a new password.
// =============================================================================
import { createHash, randomBytes } from "node:crypto";

import { hashPassword, verifyPassword, MIN_PASSWORD_LENGTH } from "./passwordHash.mjs";

export { hashPassword, verifyPassword, MIN_PASSWORD_LENGTH };

export type AuthMode = "accounts" | "shared" | "open";

export type LoginResult =
  | { ok: true; token: string; expiresAt: number; adminId: string | null }
  | { ok: false; status: 401 | 429; code: "WRONG_PASSWORD" | "TOO_MANY_ATTEMPTS"; retryAfterSeconds?: number };

/** What the login needs to know about the admin accounts (provided by adminStore). */
export type AccountSource = {
  hasActive: () => boolean;
  credentials: (email: string) => { id: string; hash: string; status: "active" | "disabled" } | undefined;
  onLogin?: (adminId: string) => void;
};

type AuthOptions = {
  /** The shared fingerprint (ADMIN_PASSWORD_HASH). Empty or missing = no shared password. */
  hash: string | undefined;
  accounts?: AccountSource;
  /** How long a login lasts. */
  ttlMs?: number;
  /** Wrong tries allowed per key in the window. */
  maxFails?: number;
  windowMs?: number;
  now?: () => number;
};

type Session = { expiresAt: number; adminId: string | null };

export function createAuth({ hash, accounts, ttlMs = 8 * 60 * 60 * 1000, maxFails = 5, windowMs = 15 * 60 * 1000, now = Date.now }: AuthOptions) {
  const sessions = new Map<string, Session>(); // sha256(token) -> session
  const fails = new Map<string, number[]>(); // key (address or email) -> times of wrong tries
  const fingerprint = (token: string) => createHash("sha256").update(token).digest("hex");
  // Used when the email does not exist, so an unknown email costs the same time as a wrong password.
  const dummy = hashPassword("no-such-admin-password");

  const mode = (): AuthMode => (accounts?.hasActive() ? "accounts" : hash ? "shared" : "open");

  function recentFails(key: string): number[] {
    const list = (fails.get(key) ?? []).filter((t) => now() - t < windowMs);
    fails.set(key, list);
    return list;
  }

  return {
    mode,
    /** True when a login is needed. */
    get required() {
      return mode() !== "open";
    },

    login(password: string, ip: string, email?: string): LoginResult {
      const keys = [`ip:${ip}`, ...(email ? [`mail:${email.trim().toLowerCase()}`] : [])];
      const locked = keys.map(recentFails).find((tries) => tries.length >= maxFails);
      if (locked) {
        return { ok: false, status: 429, code: "TOO_MANY_ATTEMPTS", retryAfterSeconds: Math.ceil((windowMs - (now() - locked[0]!)) / 1000) };
      }

      const current = mode();
      let adminId: string | null = null;
      let good = false;
      // Always do the expensive comparison, so a wrong guess costs the same time.
      if (current === "accounts") {
        const account = email ? accounts?.credentials(email) : undefined;
        const matches = verifyPassword(password, account?.hash ?? dummy);
        good = Boolean(account) && account?.status === "active" && matches;
        adminId = good ? (account?.id ?? null) : null;
      } else if (current === "shared") {
        good = verifyPassword(password, hash as string);
      }

      if (!good) {
        for (const key of keys) fails.set(key, [...recentFails(key), now()]);
        return { ok: false, status: 401, code: "WRONG_PASSWORD" };
      }
      for (const key of keys) fails.delete(key);
      const token = randomBytes(32).toString("hex");
      const expiresAt = now() + ttlMs;
      sessions.set(fingerprint(token), { expiresAt, adminId });
      if (adminId) accounts?.onLogin?.(adminId);
      return { ok: true, token, expiresAt, adminId };
    },

    /** Who is behind this token? null = not logged in. In "open" mode everybody is the local user. */
    identify(token: string | null | undefined): { adminId: string | null } | null {
      const current = mode();
      if (current === "open") return { adminId: null };
      if (!token) return null;
      const key = fingerprint(token);
      const session = sessions.get(key);
      if (!session) return null;
      if (session.expiresAt <= now()) {
        sessions.delete(key);
        return null;
      }
      // A shared-password session stops working as soon as the first admin account exists.
      if (current === "accounts" && !session.adminId) return null;
      return { adminId: session.adminId };
    },

    /** Is this token a live session? Always true when no password is set. */
    validate(token: string | null | undefined): boolean {
      return this.identify(token) !== null;
    },

    logout(token: string | null | undefined) {
      if (token) sessions.delete(fingerprint(token));
    },

    /** Ends every session of one admin (disabled, deleted, new password). */
    revokeAdmin(adminId: string) {
      for (const [key, session] of sessions) if (session.adminId === adminId) sessions.delete(key);
    },
  };
}

export type Auth = ReturnType<typeof createAuth>;
