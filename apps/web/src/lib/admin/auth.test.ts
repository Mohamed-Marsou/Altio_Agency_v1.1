// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createAuth, hashPassword, verifyPassword } from "./auth";

const PASSWORD = "correct horse battery staple";

describe("password fingerprint", () => {
  it("does not contain the password and is different every time (salt)", () => {
    const a = hashPassword(PASSWORD);
    const b = hashPassword(PASSWORD);
    expect(a).not.toContain(PASSWORD);
    expect(a).not.toBe(b);
    expect(a.startsWith("scrypt:")).toBe(true);
  });

  it("accepts the right password and refuses the others", () => {
    const stored = hashPassword(PASSWORD);
    expect(verifyPassword(PASSWORD, stored)).toBe(true);
    expect(verifyPassword("wrong password!!", stored)).toBe(false);
    expect(verifyPassword("", stored)).toBe(false);
  });

  it("survives a .env file (no dollar sign that could be read as a variable)", () => {
    expect(hashPassword(PASSWORD)).not.toContain("$");
  });

  it("refuses a broken or foreign stored value instead of crashing", () => {
    expect(verifyPassword(PASSWORD, "")).toBe(false);
    expect(verifyPassword(PASSWORD, "plain-text-password")).toBe(false);
    expect(verifyPassword(PASSWORD, "scrypt:abc:def")).toBe(false);
  });
});

describe("login sessions", () => {
  it("is open when no password is configured", () => {
    const auth = createAuth({ hash: undefined });
    expect(auth.required).toBe(false);
    expect(auth.validate(null)).toBe(true);
  });

  it("gives a token for the right password and nothing for a wrong one", () => {
    const auth = createAuth({ hash: hashPassword(PASSWORD) });
    expect(auth.required).toBe(true);
    expect(auth.validate("anything")).toBe(false);

    const bad = auth.login("nope nope nope", "1.1.1.1");
    expect(bad).toMatchObject({ ok: false, status: 401, code: "WRONG_PASSWORD" });

    const good = auth.login(PASSWORD, "1.1.1.1");
    expect(good.ok).toBe(true);
    if (good.ok) {
      expect(good.token).toMatch(/^[0-9a-f]{64}$/);
      expect(auth.validate(good.token)).toBe(true);
      expect(auth.validate(`${good.token}0`)).toBe(false);
    }
  });

  it("ends a session at the expiry time and on logout", () => {
    let time = 1_000_000;
    const auth = createAuth({ hash: hashPassword(PASSWORD), ttlMs: 1000, now: () => time });
    const first = auth.login(PASSWORD, "ip");
    if (!first.ok) throw new Error("login failed");
    expect(auth.validate(first.token)).toBe(true);
    time += 1001;
    expect(auth.validate(first.token)).toBe(false);

    const second = auth.login(PASSWORD, "ip");
    if (!second.ok) throw new Error("login failed");
    auth.logout(second.token);
    expect(auth.validate(second.token)).toBe(false);
  });

  it("locks an address after 5 wrong tries, even for the right password, then unlocks", () => {
    let time = 0;
    const auth = createAuth({ hash: hashPassword(PASSWORD), now: () => time, maxFails: 5, windowMs: 60_000 });
    for (let i = 0; i < 5; i++) expect(auth.login("bad password 123", "9.9.9.9")).toMatchObject({ status: 401 });

    const locked = auth.login(PASSWORD, "9.9.9.9");
    expect(locked).toMatchObject({ ok: false, status: 429, code: "TOO_MANY_ATTEMPTS" });
    expect(locked.ok === false && locked.retryAfterSeconds).toBeGreaterThan(0);

    // another address is not affected
    expect(auth.login(PASSWORD, "8.8.8.8").ok).toBe(true);

    time += 60_001;
    expect(auth.login(PASSWORD, "9.9.9.9").ok).toBe(true);
  });

  it("forgets the wrong tries after a good login", () => {
    const auth = createAuth({ hash: hashPassword(PASSWORD), maxFails: 3 });
    auth.login("bad password 123", "ip");
    auth.login("bad password 123", "ip");
    expect(auth.login(PASSWORD, "ip").ok).toBe(true);
    auth.login("bad password 123", "ip");
    auth.login("bad password 123", "ip");
    expect(auth.login(PASSWORD, "ip").ok).toBe(true);
  });
});
