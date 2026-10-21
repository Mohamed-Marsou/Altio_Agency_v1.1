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

export async function handleApi(store: Store, req: ApiRequest): Promise<ApiResponse> {
  try {
    return await route(store, req);
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

async function route(store: Store, req: ApiRequest): Promise<ApiResponse> {
  const parts = req.path.replace(/^\/api\/?/, "").split("/").filter(Boolean);
  const [resource, id] = parts;
  const m = req.method;

  if (resource === "health" && m === "GET") return ok({ status: "ok" });

  // ---- posts and projects (same shape, different store) --------------------
  if (resource === "posts" || resource === "projects") {
    const collection = store[resource];
    if (parts.length === 1) {
      if (m === "GET") return ok({ items: collection.list() });
      if (m === "POST") return ok(collection.create(json(req)), 201);
    } else if (parts.length === 2 && id !== undefined) {
      const slug = slugSchema.safeParse(id);
      if (!slug.success) return fail(400, "BAD_SLUG", "Invalid address.");
      if (m === "GET") {
        const item = collection.get(slug.data);
        return item ? ok(item) : fail(404, "NOT_FOUND", "Not found.");
      }
      if (m === "PUT") return ok(collection.update(slug.data, json(req)));
      if (m === "DELETE") {
        collection.remove(slug.data);
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
        return ok({ ...entry, duplicate }, duplicate ? 200 : 201);
      }
    } else if (parts.length === 2 && id !== undefined) {
      const mediaId = mediaIdSchema.safeParse(id);
      if (!mediaId.success) return fail(400, "BAD_ID", "Invalid picture id.");
      if (m === "PATCH") {
        const parsed = mediaAltSchema.safeParse(json(req));
        if (!parsed.success) return fail(422, "VALIDATION_ERROR", "Some fields are invalid.", flattenIssues(parsed.error));
        return ok(store.media.setAlt(mediaId.data, parsed.data));
      }
      if (m === "DELETE") {
        store.media.remove(mediaId.data);
        return ok({ ok: true });
      }
    }
    return fail(405, "METHOD_NOT_ALLOWED", "This method is not allowed here.");
  }

  return fail(404, "NOT_FOUND", "This endpoint does not exist.");
}
