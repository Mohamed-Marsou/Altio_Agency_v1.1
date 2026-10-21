// =============================================================================
// ADMIN API CLIENT  (browser side)
// -----------------------------------------------------------------------------
// The one place the dashboard talks to the server. Today the server is the dev API
// (lib/admin/devApi.ts, started by `npm run dev`). When the real backend exists,
// set NEXT_PUBLIC_ADMIN_API_URL and add login: the screens do not change.
// =============================================================================
import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES, type MediaEntry, type PostRecord, type ProjectRecord } from "./schemas";

const DEV_BASE = "http://127.0.0.1:4001";

/** The server address, or null when there is none (the live static site). */
export function getApiBase(): string | null {
  if (process.env.NEXT_PUBLIC_ADMIN_API_URL) return process.env.NEXT_PUBLIC_ADMIN_API_URL.replace(/\/$/, "");
  return process.env.NODE_ENV === "development" ? DEV_BASE : null;
}

/** Everything that can go wrong when talking to the server, in one type. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly fields?: Record<string, string>,
  ) {
    super(message);
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const base = getApiBase();
  if (!base) throw new ApiError(0, "OFFLINE", "The admin server is not connected.");
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, "OFFLINE", "Could not reach the admin server. Is `npm run dev` running?");
  }
  const data = (await response.json().catch(() => null)) as { error?: { code: string; message: string; fields?: Record<string, string> } } | null;
  if (!response.ok) {
    const error = data?.error;
    throw new ApiError(response.status, error?.code ?? "ERROR", error?.message ?? "Something went wrong.", error?.fields);
  }
  return data as T;
}

/** Checks a picture BEFORE sending it (the server checks again, this only saves time). */
export function checkUpload(file: Pick<File, "size" | "type" | "name">): void {
  if (file.size === 0) throw new ApiError(400, "EMPTY", `"${file.name}" is empty.`);
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new ApiError(413, "TOO_LARGE", `"${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.`);
  }
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    throw new ApiError(415, "BAD_TYPE", `"${file.name}" is not a JPEG, PNG, WebP or AVIF picture.`);
  }
}

/** Uploads one picture with a progress callback (fetch cannot report upload progress). */
function upload(file: File, onProgress?: (percent: number) => void): Promise<MediaEntry & { duplicate: boolean }> {
  checkUpload(file);
  const base = getApiBase();
  if (!base) return Promise.reject(new ApiError(0, "OFFLINE", "The admin server is not connected."));

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${base}/api/media?name=${encodeURIComponent(file.name)}`);
    xhr.setRequestHeader("Content-Type", "application/octet-stream");
    xhr.upload.onprogress = (event) => event.lengthComputable && onProgress?.(Math.round((event.loaded / event.total) * 100));
    xhr.onerror = () => reject(new ApiError(0, "OFFLINE", "Could not reach the admin server. Is `npm run dev` running?"));
    xhr.onload = () => {
      let data: { error?: { code: string; message: string } } & Partial<MediaEntry & { duplicate: boolean }> = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        // not JSON: handled below
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data as MediaEntry & { duplicate: boolean });
      else reject(new ApiError(xhr.status, data.error?.code ?? "ERROR", data.error?.message ?? "The upload failed."));
    };
    xhr.send(file);
  });
}

export const adminApi = {
  health: () => request<{ status: string }>("GET", "/api/health"),
  posts: {
    list: () => request<{ items: PostRecord[] }>("GET", "/api/posts").then((r) => r.items),
    get: (slug: string) => request<PostRecord>("GET", `/api/posts/${slug}`),
    create: (record: PostRecord) => request<PostRecord>("POST", "/api/posts", record),
    update: (slug: string, record: PostRecord) => request<PostRecord>("PUT", `/api/posts/${slug}`, record),
    remove: (slug: string) => request<{ ok: true }>("DELETE", `/api/posts/${slug}`),
  },
  projects: {
    list: () => request<{ items: ProjectRecord[] }>("GET", "/api/projects").then((r) => r.items),
    get: (slug: string) => request<ProjectRecord>("GET", `/api/projects/${slug}`),
    create: (record: ProjectRecord) => request<ProjectRecord>("POST", "/api/projects", record),
    update: (slug: string, record: ProjectRecord) => request<ProjectRecord>("PUT", `/api/projects/${slug}`, record),
    remove: (slug: string) => request<{ ok: true }>("DELETE", `/api/projects/${slug}`),
  },
  media: {
    list: () => request<{ items: MediaEntry[] }>("GET", "/api/media").then((r) => r.items),
    upload,
    setAlt: (id: string, alt: MediaEntry["alt"]) => request<MediaEntry>("PATCH", `/api/media/${id}`, alt),
    remove: (id: string) => request<{ ok: true }>("DELETE", `/api/media/${id}`),
  },
};
