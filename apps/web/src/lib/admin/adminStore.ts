// =============================================================================
// ADMIN ACCOUNTS + ACTIVITY LOG  (server side only)
// -----------------------------------------------------------------------------
// Two private files, kept OUTSIDE the website content so they can never reach the
// public pages:
//
//   apps/web/.admin-data/admins.json    the admin accounts (password = one-way fingerprint)
//   apps/web/.admin-data/activity.json  who created / edited / deleted what, and when
//
// Both are git-ignored and never imported by the public site. The posts, projects and
// pictures themselves do NOT store who made them: that link lives only in the activity
// log. So the public HTML / JSON-LD / sitemap cannot show an author, everything stays
// "Altio".
//
// When the real backend exists, the same functions are replaced by database tables
// (User + AuditLog) and the dashboard screens do not change.
// =============================================================================
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { hashPassword } from "./passwordHash.mjs";
import {
  adminCreateSchema,
  adminProfileSchema,
  passwordProblem,
  type ActivityAction,
  type ActivityEvent,
  type ActivityKind,
  type AdminProfile,
  type ProfileItem,
  type PublicAdmin,
} from "./adminSchemas";
import { StoreError } from "./store";
import { flattenIssues } from "./schemas";

/** Who is doing an action. id is null when nobody is logged in (local) or the shared password is used. */
export type Actor = { id: string | null; name: string };

type StoredAdmin = PublicAdmin & { hash: string };

const MAX_EVENTS = 5000;

type Options = {
  /** apps/web/.admin-data */
  dataDir: string;
  now?: () => Date;
  /** Called when an admin is disabled, deleted or gets a new password: their sessions must end. */
  onRevoke?: (adminId: string) => void;
};

export function createAdminStore({ dataDir, now = () => new Date(), onRevoke }: Options) {
  const adminsFile = path.join(dataDir, "admins.json");
  const activityFile = path.join(dataDir, "activity.json");

  const read = <T>(target: string): T[] => (existsSync(target) ? (JSON.parse(readFileSync(target, "utf8")) as T[]) : []);
  function write(target: string, data: unknown) {
    mkdirSync(dataDir, { recursive: true });
    const temp = `${target}.tmp-${process.pid}`;
    writeFileSync(temp, `${JSON.stringify(data, null, 2)}\n`, "utf8");
    renameSync(temp, target);
  }

  const all = () => read<StoredAdmin>(adminsFile);
  const strip = ({ hash: _hash, ...rest }: StoredAdmin): PublicAdmin => {
    void _hash;
    return rest;
  };
  const newId = () => randomBytes(6).toString("hex");

  const validation = (error: Parameters<typeof flattenIssues>[0]) =>
    new StoreError(422, "VALIDATION_ERROR", "Some fields are invalid.", flattenIssues(error));

  // ---- activity log ---------------------------------------------------------
  const activity = {
    list: (): ActivityEvent[] => read<ActivityEvent>(activityFile),

    record(actor: Actor, action: ActivityAction, kind: ActivityKind, targetId: string, title: string) {
      const events = activity.list();
      events.push({ id: newId(), at: now().toISOString(), adminId: actor.id, adminName: actor.name, action, kind, targetId, title: title.slice(0, 140) });
      write(activityFile, events.slice(-MAX_EVENTS));
    },
  };

  const activeCount = (list: StoredAdmin[]) => list.filter((a) => a.status === "active").length;
  const emailTaken = (list: StoredAdmin[], email: string, exceptId?: string) => list.some((a) => a.email === email && a.id !== exceptId);

  const admins = {
    list: (): PublicAdmin[] => all().map(strip),
    get: (id: string): PublicAdmin | undefined => {
      const found = all().find((a) => a.id === id);
      return found ? strip(found) : undefined;
    },
    /** True when at least one admin can log in (then the login asks for an email). */
    hasActive: () => activeCount(all()) > 0,

    create(input: unknown, actor: Actor): PublicAdmin {
      const parsed = adminCreateSchema.safeParse(input);
      if (!parsed.success) throw validation(parsed.error);
      const list = all();
      if (emailTaken(list, parsed.data.email)) throw new StoreError(409, "EMAIL_TAKEN", "An admin with this email already exists.", { email: "Already used" });
      const stamp = now().toISOString();
      const record: StoredAdmin = {
        id: newId(),
        name: parsed.data.name,
        email: parsed.data.email,
        description: parsed.data.description,
        role: "admin",
        status: "active",
        createdAt: stamp,
        updatedAt: stamp,
        lastLoginAt: null,
        createdByName: actor.name,
        hash: hashPassword(parsed.data.password),
      };
      write(adminsFile, [...list, record]);
      activity.record(actor, "create", "admin", record.id, record.name);
      return strip(record);
    },

    update(id: string, input: unknown, actor: Actor): PublicAdmin {
      const parsed = adminProfileSchema.safeParse(input);
      if (!parsed.success) throw validation(parsed.error);
      const list = all();
      const current = list.find((a) => a.id === id);
      if (!current) throw new StoreError(404, "NOT_FOUND", "Admin not found.");
      if (emailTaken(list, parsed.data.email, id)) throw new StoreError(409, "EMAIL_TAKEN", "An admin with this email already exists.", { email: "Already used" });
      if (parsed.data.status === "disabled" && current.status === "active" && activeCount(list) <= 1) {
        throw new StoreError(409, "LAST_ADMIN", "At least one admin must stay active.");
      }
      const next: StoredAdmin = { ...current, ...parsed.data, updatedAt: now().toISOString() };
      write(adminsFile, list.map((a) => (a.id === id ? next : a)));
      const action: ActivityAction = current.status !== next.status ? (next.status === "disabled" ? "disable" : "enable") : "update";
      activity.record(actor, action, "admin", id, next.name);
      if (next.status === "disabled") onRevoke?.(id);
      return strip(next);
    },

    setPassword(id: string, password: string, actor: Actor) {
      const list = all();
      const current = list.find((a) => a.id === id);
      if (!current) throw new StoreError(404, "NOT_FOUND", "Admin not found.");
      const problem = passwordProblem(String(password ?? ""), current);
      if (problem) throw new StoreError(422, "VALIDATION_ERROR", "Some fields are invalid.", { password: problem });
      write(adminsFile, list.map((a) => (a.id === id ? { ...a, hash: hashPassword(password), updatedAt: now().toISOString() } : a)));
      activity.record(actor, "password", "admin", id, current.name);
      // A new password ends every open session of that admin, except it cannot end the caller's own
      // (they just typed it): the caller keeps working, others must log in again.
      if (actor.id !== id) onRevoke?.(id);
    },

    remove(id: string, actor: Actor) {
      const list = all();
      const current = list.find((a) => a.id === id);
      if (!current) throw new StoreError(404, "NOT_FOUND", "Admin not found.");
      if (actor.id === id) throw new StoreError(409, "SELF_DELETE", "You cannot delete the account you are logged in with.");
      if (current.status === "active" && activeCount(list) <= 1) throw new StoreError(409, "LAST_ADMIN", "At least one admin must stay active.");
      write(adminsFile, list.filter((a) => a.id !== id));
      activity.record(actor, "delete", "admin", id, current.name);
      onRevoke?.(id);
    },

    /** For the login: the stored fingerprint of an email (never sent to the browser). */
    credentials(email: string): { id: string; hash: string; status: PublicAdmin["status"] } | undefined {
      const found = all().find((a) => a.email === email.trim().toLowerCase());
      return found ? { id: found.id, hash: found.hash, status: found.status } : undefined;
    },

    recordLogin(id: string) {
      const list = all();
      if (!list.some((a) => a.id === id)) return;
      write(adminsFile, list.map((a) => (a.id === id ? { ...a, lastLoginAt: now().toISOString() } : a)));
    },
  };

  /**
   * The full page of one admin. `resolve` says whether an item still exists and gives its
   * current title / small picture (it comes from the content store).
   */
  function profile(id: string, resolve: (kind: ActivityKind, targetId: string) => { title: string; thumb?: string } | null): AdminProfile {
    const admin = admins.get(id);
    if (!admin) throw new StoreError(404, "NOT_FOUND", "Admin not found.");
    const events = activity.list();
    const mine = events.filter((e) => e.adminId === id);

    const item = (e: ActivityEvent): ProfileItem => {
      const found = resolve(e.kind, e.targetId);
      return { id: e.targetId, title: found?.title ?? e.title, at: e.at, exists: Boolean(found), ...(found?.thumb ? { thumb: found.thumb } : {}) };
    };
    const newestFirst = <T extends { at: string }>(list: T[]) => [...list].sort((a, b) => b.at.localeCompare(a.at));
    // The same thing can appear more than once in the log (created, deleted, created again): keep the last event.
    const unique = (list: ActivityEvent[]) => [...new Map(list.map((e) => [`${e.kind}:${e.targetId}`, e])).values()];

    const createdEvents = unique(mine.filter((e) => e.action === "create" && e.kind !== "admin"));
    const created = {
      posts: newestFirst(createdEvents.filter((e) => e.kind === "post").map(item)),
      projects: newestFirst(createdEvents.filter((e) => e.kind === "project").map(item)),
      media: newestFirst(createdEvents.filter((e) => e.kind === "media").map(item)),
    };

    const createdKeys = new Set(createdEvents.map((e) => `${e.kind}:${e.targetId}`));
    const updates = mine.filter((e) => e.action === "update" && e.kind !== "admin");
    const edited = newestFirst(
      unique(updates).map((last) => ({
        ...item(last),
        kind: last.kind,
        times: updates.filter((u) => u.kind === last.kind && u.targetId === last.targetId).length,
        createdByThisAdmin: createdKeys.has(`${last.kind}:${last.targetId}`),
      })),
    );

    const deletions = mine.filter((e) => e.action === "delete" && e.kind !== "admin");
    const deleted = newestFirst(deletions.map((e) => ({ id: e.targetId, title: e.title, at: e.at, exists: false, kind: e.kind })));

    return {
      admin,
      created,
      edited,
      deleted,
      recent: [...mine].reverse().slice(0, 30),
      totals: {
        posts: created.posts.length,
        projects: created.projects.length,
        media: created.media.length,
        edits: updates.length,
        deletions: deletions.length,
      },
    };
  }

  return { admins, activity, profile };
}

export type AdminStore = ReturnType<typeof createAdminStore>;
