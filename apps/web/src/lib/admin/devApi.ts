// =============================================================================
// DEV API  (server side only)
// -----------------------------------------------------------------------------
// The little "backend" that lets the dashboard create, edit and delete posts,
// projects and pictures while you develop (`npm run dev`). It is plain functions:
// give it a request, get a response. The tiny HTTP server in lib/logger/server.ts
// connects it to the network; the tests call it directly.
//
//   GET    /api/posts            list         GET    /api/projects            list
//   GET    /api/posts/:slug      one          GET    /api/projects/:slug      one
//   POST   /api/posts            create       POST   /api/projects            create
//   PUT    /api/posts/:slug      update       PUT    /api/projects/:slug      update
//   DELETE /api/posts/:slug      delete       DELETE /api/projects/:slug      delete
//   GET    /api/media            list pictures
//   POST   /api/media?name=a.jpg  upload (the raw file in the body, max 8 MB)
//   PATCH  /api/media/:id        change the alt texts
//   DELETE /api/media/:id        delete a picture (refused while it is used)
//
// Every error has one shape:  { error: { code, message, fields? } }
// =============================================================================
import type { ActivityKind } from "./adminSchemas";
import { adminIdSchema } from "./adminSchemas";
import type { Actor, AdminStore } from "./adminStore";
import { MediaError } from "./mediaPipeline";
import { MAX_UPLOAD_BYTES, flattenIssues, mediaAltSchema, mediaIdSchema, slugSchema } from "./schemas";
import { StoreError, type Store } from "./store";

export type ApiRequest = {
  method: string;
  /** Path without the query string, e.g. "/api/posts/my-post" */
  path: string;
  query: URLSearchParams;
  body: Buffer;
};

export type ApiResponse = { status: number; body: unknown };

/** Who is calling and where the admin accounts live. Without it nothing is recorded and /api/admins does not exist. */
export type ApiContext = { admins: AdminStore; actor: Actor };

const ok = (body: unknown, status = 200): ApiResponse => ({ status, body });
const fail = (status: number, code: string, message: string, fields?: Record<string, string>): ApiResponse => ({
  status,
  body: { error: { code, message, ...(fields ? { fields } : {}) } },
});

function json(req: ApiRequest): unknown {
  try {
    return JSON.parse(req.body.toString("utf8"));
  } catch {
    throw new StoreError(400, "BAD_JSON", "The request body is not valid JSON.");
  }
}

/** Bytes of the biggest body this API accepts for a path (the HTTP layer uses it to stop early). */
export function maxBodyBytes(method: string, path: string): number {
  return method === "POST" && path === "/api/media" ? MAX_UPLOAD_BYTES + 1024 : 2 * 1024 * 1024;
}

export async function handleApi(store: Store, req: ApiRequest, ctx?: ApiContext): Promise<ApiResponse> {
  try {
    return await route(store, req, ctx);
  } catch (error) {
    if (error instanceof StoreError) return fail(error.status, error.code, error.message, error.fields);
    if (error instanceof MediaError) {
      const status = { TOO_LARGE: 413, BAD_TYPE: 415, UNREADABLE: 422, EMPTY: 400 }[error.code];
      return fail(status, error.code, error.message);
    }
    console.error("[dev-api]", error);
    return fail(500, "INTERNAL_ERROR", "Something went wrong while saving.");
  }
}

async function route(store: Store, req: ApiRequest, ctx?: ApiContext): Promise<ApiResponse> {
  const parts = req.path.replace(/^\/api\/?/, "").split("/").filter(Boolean);
  const [resource, id] = parts;
  const m = req.method;

  // Writes one line in the private activity log ("who did what"). The posts, projects and
  // pictures themselves never store the author, so the public site cannot show it.
  const log = (action: "create" | "update" | "delete", kind: ActivityKind, targetId: string, title: string) =>
    ctx?.admins.activity.record(ctx.actor, action, kind, targetId, title);

  if (resource === "health" && m === "GET") return ok({ status: "ok" });

  // ---- the admin accounts and their pages ----------------------------------
  if ((resource === "admins" || resource === "me") && ctx) return adminRoutes(store, req, ctx, parts);

  // ---- posts and projects (same shape, different store) --------------------
  if (resource === "posts" || resource === "projects") {
    const collection = store[resource];
    const kind: ActivityKind = resource === "posts" ? "post" : "project";
    const titleOf = (slug: string) => collection.get(slug)?.i18n.en.title ?? slug;
    if (parts.length === 1) {
      if (m === "GET") return ok({ items: collection.list() });
      if (m === "POST") {
        const created = collection.create(json(req));
        log("create", kind, created.slug, created.i18n.en.title);
        return ok(created, 201);
      }
    } else if (parts.length === 2 && id !== undefined) {
      const slug = slugSchema.safeParse(id);
      if (!slug.success) return fail(400, "BAD_SLUG", "Invalid address.");
      if (m === "GET") {
        const item = collection.get(slug.data);
        return item ? ok(item) : fail(404, "NOT_FOUND", "Not found.");
      }
      if (m === "PUT") {
        const updated = collection.update(slug.data, json(req));
        log("update", kind, updated.slug, updated.i18n.en.title);
        return ok(updated);
      }
      if (m === "DELETE") {
        const title = titleOf(slug.data); // read before it is gone
        collection.remove(slug.data);
        log("delete", kind, slug.data, title);
        return ok({ ok: true });
      }
    }
    return fail(405, "METHOD_NOT_ALLOWED", "This method is not allowed here.");
  }

  // ---- media ---------------------------------------------------------------
  if (resource === "media") {
    if (parts.length === 1) {
      if (m === "GET") return ok({ items: store.media.list() });
      if (m === "POST") {
        const name = req.query.get("name") ?? "image";
        const { entry, duplicate } = await store.media.add(req.body, name);
        if (!duplicate) log("create", "media", entry.id, entry.originalName); // a reused picture is not a new upload
        return ok({ ...entry, duplicate }, duplicate ? 200 : 201);
      }
    } else if (parts.length === 2 && id !== undefined) {
      const mediaId = mediaIdSchema.safeParse(id);
      if (!mediaId.success) return fail(400, "BAD_ID", "Invalid picture id.");
      if (m === "PATCH") {
        const parsed = mediaAltSchema.safeParse(json(req));
        if (!parsed.success) return fail(422, "VALIDATION_ERROR", "Some fields are invalid.", flattenIssues(parsed.error));
        const updated = store.media.setAlt(mediaId.data, parsed.data);
        log("update", "media", updated.id, updated.originalName);
        return ok(updated);
      }
      if (m === "DELETE") {
        const name = store.media.list().find((x) => x.id === mediaId.data)?.originalName ?? mediaId.data;
        store.media.remove(mediaId.data);
        log("delete", "media", mediaId.data, name);
        return ok({ ok: true });
      }
    }
    return fail(405, "METHOD_NOT_ALLOWED", "This method is not allowed here.");
  }

  return fail(404, "NOT_FOUND", "This endpoint does not exist.");
}

// ---- admin accounts ---------------------------------------------------------
//   GET    /api/me                      who am I (the person behind the session)
//   GET    /api/admins                  list          POST   /api/admins                 create
//   GET    /api/admins/:id              one           PUT    /api/admins/:id             change name / email / description / status
//   DELETE /api/admins/:id              delete        POST   /api/admins/:id/password    set a new password
//   GET    /api/admins/:id/profile      the full page: everything this admin created, edited, deleted
function adminRoutes(store: Store, req: ApiRequest, ctx: ApiContext, parts: string[]): ApiResponse {
  const { admins, actor } = ctx;
  const m = req.method;
  const [resource, id, sub] = parts;

  if (resource === "me") {
    if (m !== "GET" || parts.length !== 1) return fail(405, "METHOD_NOT_ALLOWED", "This method is not allowed here.");
    return ok({ actor, admin: actor.id ? (admins.admins.get(actor.id) ?? null) : null });
  }

  if (parts.length === 1) {
    if (m === "GET") return ok({ items: admins.admins.list() });
    if (m === "POST") return ok(admins.admins.create(json(req), actor), 201);
    return fail(405, "METHOD_NOT_ALLOWED", "This method is not allowed here.");
  }

  const adminId = adminIdSchema.safeParse(id);
  if (!adminId.success) return fail(400, "BAD_ID", "Invalid admin id.");

  if (parts.length === 2) {
    if (m === "GET") {
      const found = admins.admins.get(adminId.data);
      return found ? ok(found) : fail(404, "NOT_FOUND", "Admin not found.");
    }
    if (m === "PUT") return ok(admins.admins.update(adminId.data, json(req), actor));
    if (m === "DELETE") {
      admins.admins.remove(adminId.data, actor);
      return ok({ ok: true });
    }
  } else if (parts.length === 3 && sub === "password" && m === "POST") {
    const body = json(req) as { password?: unknown };
    admins.admins.setPassword(adminId.data, typeof body.password === "string" ? body.password : "", actor);
    return ok({ ok: true });
  } else if (parts.length === 3 && sub === "profile" && m === "GET") {
    // For each logged item: does it still exist, and what is it called now?
    const resolve = (kind: ActivityKind, target: string) => {
      if (kind === "post") {
        const found = store.posts.get(target);
        return found ? { title: found.i18n.en.title } : null;
      }
      if (kind === "project") {
        const found = store.projects.get(target);
        return found ? { title: found.i18n.en.title } : null;
      }
      if (kind === "media") {
        const found = store.media.list().find((x) => x.id === target);
        return found ? { title: found.originalName, thumb: found.variants[0]?.path } : null;
      }
      const found = admins.admins.get(target);
      return found ? { title: found.name } : null;
    };
    return ok(admins.profile(adminId.data, resolve));
  }
  return fail(405, "METHOD_NOT_ALLOWED", "This method is not allowed here.");
}

export type { Actor };
