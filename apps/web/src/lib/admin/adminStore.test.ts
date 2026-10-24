// @vitest-environment node
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { passwordProblem, type AdminProfile, type PublicAdmin } from "./adminSchemas";
import { createAdminStore, type Actor } from "./adminStore";
import { createAuth } from "./auth";
import { handleApi, type ApiResponse } from "./devApi";
import { type PostRecord } from "./schemas";
import { createStore } from "./store";

let tmp: string;
let admins: ReturnType<typeof createAdminStore>;
let revoked: string[];
let call: (actor: Actor, method: string, url: string, body?: unknown) => Promise<ApiResponse>;

const ME: Actor = { id: null, name: "Local (no login)" };
const GOOD = "correct horse battery";
const mk = (name: string, email: string) => ({ name, email, description: `${name} works on the website`, password: GOOD });

beforeEach(() => {
  tmp = mkdtempSync(path.join(tmpdir(), "altio-admins-"));
  cpSync(path.resolve(__dirname, "../../content"), path.join(tmp, "content"), { recursive: true });
  mkdirSync(path.join(tmp, "public"), { recursive: true });
  revoked = [];
  admins = createAdminStore({ dataDir: path.join(tmp, ".admin-data"), onRevoke: (id) => revoked.push(id) });
  const store = createStore({ contentDir: path.join(tmp, "content"), publicDir: path.join(tmp, "public") });
  call = (actor, method, url, body) =>
    handleApi(store, { method, path: url, query: new URLSearchParams(), body: body === undefined ? Buffer.alloc(0) : Buffer.from(JSON.stringify(body)) }, { admins, actor });
});
afterEach(() => rmSync(tmp, { recursive: true, force: true }));

describe("password rules", () => {
  it("refuses short, common, repeated and personal passwords", () => {
    expect(passwordProblem("short")).toMatch(/12 characters/);
    expect(passwordProblem("aaaaaaaaaaaaaa")).toMatch(/easy to guess/);
    expect(passwordProblem("password1234")).toMatch(/easy to guess/);
    expect(passwordProblem("my-sarah.ben-pass", { email: "sarah.ben@altio.ma" })).toMatch(/email/);
    expect(passwordProblem("hello Sarah Ben 99", { name: "Sarah Ben" })).toMatch(/name/);
    expect(passwordProblem("x".repeat(201))).toMatch(/too long/);
    expect(passwordProblem(GOOD)).toBeNull();
  });
});

describe("admin accounts", () => {
  it("creates, lists, updates and never returns the password fingerprint", () => {
    const sarah = admins.admins.create(mk("Sarah", "Sarah@Altio.ma"), ME);
    expect(sarah.email).toBe("sarah@altio.ma"); // stored in lower case
    expect(JSON.stringify(admins.admins.list())).not.toMatch(/scrypt|hash/i);
    expect(readFileSync(path.join(tmp, ".admin-data", "admins.json"), "utf8")).not.toContain(GOOD);

    const changed = admins.admins.update(sarah.id, { name: "Sarah B.", email: "sarah@altio.ma", description: "Design", status: "active" }, ME);
    expect(changed.name).toBe("Sarah B.");
    expect(admins.admins.get(sarah.id)?.description).toBe("Design");
  });

  it("refuses a duplicate email, bad input and an unknown id", () => {
    admins.admins.create(mk("Sarah", "sarah@altio.ma"), ME);
    expect(() => admins.admins.create(mk("Other", "SARAH@altio.ma"), ME)).toThrow(/already exists/);
    expect(() => admins.admins.create({ ...mk("X", "bad"), password: "short" }, ME)).toThrow(/invalid/);
    expect(() => admins.admins.update("aaaaaaaaaaaa", { name: "Zed", email: "z@z.co", description: "", status: "active" }, ME)).toThrow(/not found/);
  });

  it("keeps at least one active admin and refuses self-delete", () => {
    const a = admins.admins.create(mk("Alice", "alice@altio.ma"), ME);
    expect(() => admins.admins.update(a.id, { name: "Alice", email: "alice@altio.ma", description: "", status: "disabled" }, ME)).toThrow(/At least one/);
    expect(() => admins.admins.remove(a.id, ME)).toThrow(/At least one/);
    const b = admins.admins.create(mk("Bob", "bob@altio.ma"), { id: a.id, name: "Alice" });
    expect(() => admins.admins.remove(a.id, { id: a.id, name: "Alice" })).toThrow(/cannot delete the account/);
    admins.admins.remove(b.id, { id: a.id, name: "Alice" });
    expect(admins.admins.list()).toHaveLength(1);
    expect(revoked).toContain(b.id);
  });

  it("sets a new password: the old one stops working, other sessions end", () => {
    const a = admins.admins.create(mk("Alice", "alice@altio.ma"), ME);
    const auth = createAuth({ hash: undefined, accounts: { hasActive: admins.admins.hasActive, credentials: admins.admins.credentials } });
    expect(auth.login(GOOD, "ip", "alice@altio.ma").ok).toBe(true);
    expect(() => admins.admins.setPassword(a.id, "short", ME)).toThrow(/invalid/);
    admins.admins.setPassword(a.id, "another long passphrase", ME);
    expect(revoked).toContain(a.id);
    expect(auth.login(GOOD, "ip2", "alice@altio.ma").ok).toBe(false);
    expect(auth.login("another long passphrase", "ip3", "alice@altio.ma").ok).toBe(true);
  });
});

describe("login with accounts", () => {
  const setup = () => {
    const a = admins.admins.create(mk("Alice", "alice@altio.ma"), ME);
    const auth = createAuth({
      hash: undefined,
      accounts: { hasActive: admins.admins.hasActive, credentials: admins.admins.credentials, onLogin: admins.admins.recordLogin },
    });
    return { a, auth };
  };

  it("needs email AND the admin's own password, and records the last login", () => {
    const { a, auth } = setup();
    expect(auth.mode()).toBe("accounts");
    expect(auth.login(GOOD, "ip").ok).toBe(false); // no email
    expect(auth.login(GOOD, "ip", "nobody@altio.ma").ok).toBe(false); // unknown email
    expect(auth.login("wrong wrong wrong", "ip", "alice@altio.ma").ok).toBe(false);
    const ok = auth.login(GOOD, "ip", " ALICE@altio.ma ");
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.adminId).toBe(a.id);
      expect(auth.identify(ok.token)).toEqual({ adminId: a.id });
    }
    expect(admins.admins.get(a.id)?.lastLoginAt).not.toBeNull();
  });

  it("a disabled admin cannot log in and loses the open session", () => {
    const { a, auth } = setup();
    admins.admins.create(mk("Bob", "bob@altio.ma"), ME);
    const first = auth.login(GOOD, "ip", "alice@altio.ma");
    admins.admins.update(a.id, { name: "Alice", email: "alice@altio.ma", description: "", status: "disabled" }, ME);
    auth.revokeAdmin(a.id);
    if (first.ok) expect(auth.validate(first.token)).toBe(false);
    expect(auth.login(GOOD, "ip9", "alice@altio.ma").ok).toBe(false);
  });

  it("locks one email after 5 wrong tries even from another address", () => {
    const { auth } = setup();
    for (let i = 0; i < 5; i++) auth.login("wrong wrong wrong", `ip-${i}`, "alice@altio.ma");
    const locked = auth.login(GOOD, "fresh-ip", "alice@altio.ma");
    expect(locked).toMatchObject({ ok: false, status: 429 });
  });

  it("the shared password stops working once an admin exists", () => {
    const shared = createAuth({ hash: "x", accounts: { hasActive: admins.admins.hasActive, credentials: admins.admins.credentials } });
    expect(shared.mode()).toBe("shared");
    const auth = createAuth({ hash: undefined, accounts: { hasActive: admins.admins.hasActive, credentials: admins.admins.credentials } });
    expect(auth.mode()).toBe("open");
    expect(auth.identify(null)).toEqual({ adminId: null });
    admins.admins.create(mk("Alice", "alice@altio.ma"), ME);
    expect(auth.mode()).toBe("accounts");
    expect(auth.identify(null)).toBeNull();
  });
});

describe("who made what (private) and the public site", () => {
  async function firstPost(slug: string): Promise<PostRecord> {
    const list = (await call(ME, "GET", "/api/posts")).body as { items: PostRecord[] };
    return { ...list.items[0]!, slug };
  }

  it("records creates, edits and deletes per admin and builds the full page", async () => {
    const alice = admins.admins.create(mk("Alice", "alice@altio.ma"), ME);
    const bob = admins.admins.create(mk("Bob", "bob@altio.ma"), ME);
    const asAlice: Actor = { id: alice.id, name: "Alice" };
    const asBob: Actor = { id: bob.id, name: "Bob" };

    const fresh = await firstPost("alice-first-post");
    expect((await call(asAlice, "POST", "/api/posts", fresh)).status).toBe(201);
    expect((await call(asAlice, "PUT", "/api/posts/alice-first-post", { ...fresh, readTime: 8 })).status).toBe(200);
    expect((await call(asBob, "PUT", "/api/posts/alice-first-post", { ...fresh, readTime: 9 })).status).toBe(200);
    expect((await call(asBob, "POST", "/api/posts", { ...fresh, slug: "bob-post" })).status).toBe(201);
    expect((await call(asBob, "DELETE", "/api/posts/bob-post")).status).toBe(200);

    const forAlice = (await call(asAlice, "GET", `/api/admins/${alice.id}/profile`)).body as AdminProfile;
    expect(forAlice.created.posts.map((p) => p.id)).toEqual(["alice-first-post"]);
    expect(forAlice.totals).toMatchObject({ posts: 1, projects: 0, media: 0, edits: 1, deletions: 0 });
    expect(forAlice.edited[0]).toMatchObject({ id: "alice-first-post", createdByThisAdmin: true, times: 1 });

    const forBob = (await call(asAlice, "GET", `/api/admins/${bob.id}/profile`)).body as AdminProfile;
    expect(forBob.created.posts.map((p) => p.id)).toEqual(["bob-post"]);
    expect(forBob.created.posts[0]).toMatchObject({ exists: false }); // deleted since
    expect(forBob.edited[0]).toMatchObject({ id: "alice-first-post", createdByThisAdmin: false });
    expect(forBob.deleted.map((d) => d.id)).toEqual(["bob-post"]);
    expect(forBob.recent[0]).toMatchObject({ action: "delete", kind: "post" });
  });

  it("the posts, projects and pictures never store the author", async () => {
    const alice = admins.admins.create(mk("Alice Secretname", "alice.secret@altio.ma"), ME);
    const fresh = await firstPost("authorless-post");
    await call({ id: alice.id, name: alice.name }, "POST", "/api/posts", fresh);

    // The whole content folder (what the public site is built from) must not mention the admin.
    const walk = (dir: string): string[] =>
      readdirSync(dir).flatMap((name) => {
        const full = path.join(dir, name);
        return statSync(full).isDirectory() ? walk(full) : full.endsWith(".json") ? [full] : [];
      });
    for (const file of walk(path.join(tmp, "content"))) {
      const text = readFileSync(file, "utf8");
      expect(text, file).not.toContain(alice.id);
      expect(text, file).not.toMatch(/Secretname|alice\.secret|adminId|createdBy|uploadedBy|authorId/i); // the fixed label "author: Altio team" is allowed
    }
    // The only file that knows is the private one.
    expect(readFileSync(path.join(tmp, ".admin-data", "activity.json"), "utf8")).toContain(alice.id);
  });

  it("keeps the history of a deleted admin (name stays readable)", async () => {
    const alice = admins.admins.create(mk("Alice", "alice@altio.ma"), ME);
    const bob = admins.admins.create(mk("Bob", "bob@altio.ma"), ME);
    await call({ id: bob.id, name: "Bob" }, "POST", "/api/posts", await firstPost("bobs-post"));
    admins.admins.remove(bob.id, { id: alice.id, name: "Alice" });
    const events = admins.activity.list();
    expect(events.some((e) => e.adminName === "Bob" && e.action === "create" && e.targetId === "bobs-post")).toBe(true);
    expect((await call(ME, "GET", `/api/admins/${bob.id}/profile`)).status).toBe(404);
    expect(readFileSync(path.join(tmp, "content", "en", "posts.json"), "utf8")).toContain("bobs-post"); // the post stays
  });
});

describe("admin routes", () => {
  it("full CRUD through the API, with clear errors", async () => {
    const created = await call(ME, "POST", "/api/admins", mk("Alice", "alice@altio.ma"));
    expect(created.status).toBe(201);
    const id = (created.body as PublicAdmin).id;

    expect((await call(ME, "GET", "/api/admins")).body).toMatchObject({ items: [expect.objectContaining({ id, name: "Alice" })] });
    expect((await call(ME, "GET", `/api/admins/${id}`)).status).toBe(200);
    expect((await call(ME, "GET", "/api/admins/zzzz")).status).toBe(400);
    expect((await call(ME, "GET", "/api/admins/aaaaaaaaaaaa")).status).toBe(404);

    const bad = await call(ME, "POST", "/api/admins", { ...mk("B", "b@altio.ma"), password: "short" });
    expect(bad.status).toBe(422);
    expect((bad.body as { error: { fields: Record<string, string> } }).error.fields.password).toMatch(/12 characters/);
    expect((await call(ME, "POST", "/api/admins", mk("Alice 2", "alice@altio.ma"))).status).toBe(409);

    expect((await call(ME, "PUT", `/api/admins/${id}`, { name: "Alice B", email: "alice@altio.ma", description: "x", status: "active" })).status).toBe(200);
    expect((await call(ME, "POST", `/api/admins/${id}/password`, { password: "short" })).status).toBe(422);
    expect((await call(ME, "POST", `/api/admins/${id}/password`, { password: "a brand new passphrase" })).status).toBe(200);
    expect((await call(ME, "PATCH", "/api/admins")).status).toBe(405);

    const me = await call({ id, name: "Alice B" }, "GET", "/api/me");
    expect(me.body).toMatchObject({ admin: { id, name: "Alice B" } });
    expect((await call({ id, name: "Alice B" }, "DELETE", `/api/admins/${id}`)).status).toBe(409);
  });

  it("does not exist without a context (the old tests keep working)", async () => {
    const store = createStore({ contentDir: path.join(tmp, "content"), publicDir: path.join(tmp, "public") });
    const result = await handleApi(store, { method: "GET", path: "/api/admins", query: new URLSearchParams(), body: Buffer.alloc(0) });
    expect(result.status).toBe(404);
  });
});
