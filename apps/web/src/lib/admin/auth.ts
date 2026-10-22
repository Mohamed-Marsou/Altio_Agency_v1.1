// =============================================================================
// ADMIN LOGIN  (server side only: runs in the dev server, later in the backend)
// -----------------------------------------------------------------------------
// The password is NEVER written in the code and never sent to the browser.
//   - You choose it once with `npm run admin:password`. Only a HASH is saved, in
//     apps/web/.env.local (git-ignored): a one-way fingerprint that cannot be turned
//     back into the password.
//   - The dev server (lib/logger/server.ts) reads that variable, which lives only in
//     its memory. The browser sends the typed password to the server; the server
//     compares fingerprints and answers with a short-lived session token.
//   - Without ADMIN_PASSWORD_HASH there is no login (open on your own computer).
// Same rules as the future backend: scrypt hashing, constant-time compare, a lock
// after 5 wrong tries, sessions that expire.
// =============================================================================
import { createHash, randomBytes } from "node:crypto";

import { hashPassword, verifyPassword, MIN_PASSWORD_LENGTH } from "./passwordHash.mjs";

export { hashPassword, verifyPassword, MIN_PASSWORD_LENGTH };

export type LoginResult =
  | { ok: true; token: string; expiresAt: number }
  | { ok: false; status: 401 | 429; code: "WRONG_PASSWORD" | "TOO_MANY_ATTEMPTS"; retryAfterSeconds?: number };

type AuthOptions = {
  /** The stored fingerprint (ADMIN_PASSWORD_HASH). Empty or missing = no login required. */
  hash: string | undefined;
  /** How long a login lasts. */
  ttlMs?: number;
  /** Wrong tries allowed per address in the window. */
  maxFails?: number;
  windowMs?: number;
  now?: () => number;
};

export function createAuth({ hash, ttlMs = 8 * 60 * 60 * 1000, maxFails = 5, windowMs = 15 * 60 * 1000, now = Date.now }: AuthOptions) {
  const sessions = new Map<string, number>(); // sha256(token) -> expiry
  const fails = new Map<string, number[]>(); // address -> times of wrong tries
  const required = Boolean(hash);
  const fingerprint = (token: string) => createHash("sha256").update(token).digest("hex");

  function recentFails(ip: string): number[] {
    const list = (fails.get(ip) ?? []).filter((t) => now() - t < windowMs);
    fails.set(ip, list);
    return list;
  }

  return {
    required,

    login(password: string, ip: string): LoginResult {
      const tries = recentFails(ip);
      if (tries.length >= maxFails) {
        return { ok: false, status: 429, code: "TOO_MANY_ATTEMPTS", retryAfterSeconds: Math.ceil((windowMs - (now() - tries[0]!)) / 1000) };
      }
      // Always do the expensive comparison, so a wrong guess costs the same time.
      const good = Boolean(hash) && verifyPassword(password, hash as string);
      if (!good) {
        fails.set(ip, [...tries, now()]);
        return { ok: false, status: 401, code: "WRONG_PASSWORD" };
      }
      fails.delete(ip);
      const token = randomBytes(32).toString("hex");
      const expiresAt = now() + ttlMs;
      sessions.set(fingerprint(token), expiresAt);
      return { ok: true, token, expiresAt };
    },

    /** Is this token a live session? Always true when no password is set. */
    validate(token: string | null | undefined): boolean {
      if (!required) return true;
      if (!token) return false;
      const key = fingerprint(token);
      const expiry = sessions.get(key);
      if (!expiry) return false;
      if (expiry <= now()) {
        sessions.delete(key);
        return false;
      }
      return true;
    },

    logout(token: string | null | undefined) {
      if (token) sessions.delete(fingerprint(token));
    },
  };
}

export type Auth = ReturnType<typeof createAuth>;
