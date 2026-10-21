// @vitest-environment node
import { cpSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { handleApi, maxBodyBytes, type ApiResponse } from "./devApi";
import { MAX_UPLOAD_BYTES, type PostRecord } from "./schemas";
import { createStore } from "./store";

let tmp: string;
let call: (method: string, url: string, body?: unknown) => Promise<ApiResponse>;
let callRaw: (method: string, url: string, body: Buffer) => Promise<ApiResponse>;

beforeEach(() => {
  tmp = mkdtempSync(path.join(tmpdir(), "altio-api-"));
  cpSync(path.resolve(__dirname, "../../content"), path.join(tmp, "content"), { recursive: true });
  mkdirSync(path.join(tmp, "public"), { recursive: true });
  const store = createStore({ contentDir: path.join(tmp, "content"), publicDir: path.join(tmp, "public") });
  callRaw = (method, url, body) => {
    const [pathname, query = ""] = url.split("?");
    return handleApi(store, { method, path: pathname!, query: new URLSearchParams(query), body });
  };
  call = (method, url, body) => callRaw(method, url, body === undefined ? Buffer.alloc(0) : Buffer.from(JSON.stringify(body)));
});
afterEach(() => rmSync(tmp, { recursive: true, force: true }));

const errorOf = (r: ApiResponse) => (r.body as { error: { code: string; message: string; fields?: Record<string, string> } }).error;

describe("dev API: posts", () => {
  it("lists, reads, creates, updates and deletes (the whole CRUD)", async () => {
    const list = await call("GET", "/api/posts");
    expect(list.status).toBe(200);
    const items = (list.body as { items: PostRecord[] }).items;
    expect(items).toHaveLength(7);

    const one = await call("GET", `/api/posts/${items[0]!.slug}`);
    expect(one.status).toBe(200);

    const fresh = { ...items[0]!, slug: "brand-new-post" };
    const created = await call("POST", "/api/posts", fresh);
    expect(created.status).toBe(201);
    expect((await call("GET", "/api/posts")).body).toMatchObject({ items: expect.arrayContaining([expect.objectContaining({ slug: "brand-new-post" })]) });

    const updated = await call("PUT", "/api/posts/brand-new-post", { ...fresh, readTime: 9 });
    expect(updated.status).toBe(200);
    expect((updated.body as PostRecord).readTime).toBe(9);

    expect((await call("DELETE", "/api/posts/brand-new-post")).status).toBe(200);
    expect((await call("GET", "/api/posts/brand-new-post")).status).toBe(404);
  });

  it("answers with one error shape", async () => {
    const duplicate = await call("POST", "/api/posts", (await call("GET", "/api/posts")).body && ((await call("GET", "/api/posts")).body as { items: PostRecord[] }).items[0]);
    expect(duplicate.status).toBe(409);
    expect(errorOf(duplicate).code).toBe("SLUG_TAKEN");

    const invalid = await call("POST", "/api/posts", { slug: "x" });
    expect(invalid.status).toBe(422);
    expect(errorOf(invalid).fields).toBeDefined();

    const badJson = await callRaw("POST", "/api/posts", Buffer.from("{nope"));
    expect(badJson.status).toBe(400);
    expect(errorOf(badJson).code).toBe("BAD_JSON");
  });

  it("refuses a dangerous address", async () => {
    for (const slug of ["..", "..%2f..%2fsecret", "a/b", "UPPER", "x"]) {
      const response = await call("GET", `/api/posts/${slug}`);
      expect([400, 404, 405]).toContain(response.status);
    }
  });

  it("refuses methods that do not exist and unknown endpoints", async () => {
    expect((await call("PATCH", "/api/posts")).status).toBe(405);
    expect((await call("GET", "/api/nothing")).status).toBe(404);
    expect((await call("GET", "/api/health")).status).toBe(200);
  });
});

describe("dev API: projects", () => {
  it("lists projects and refuses to delete one linked from the home page", async () => {
    const list = await call("GET", "/api/projects");
    expect((list.body as { items: unknown[] }).items).toHaveLength(4);
    const refused = await call("DELETE", "/api/projects/atlas-immo");
    expect(refused.status).toBe(409);
    expect(errorOf(refused).code).toBe("IN_USE");
  });
});

describe("dev API: media", () => {
  const picture = (width: number, height: number) => sharp({ create: { width, height, channels: 3, background: "#3366cc" } }).jpeg().toBuffer();

  it("uploads, lists, changes the alt text and deletes", async () => {
    const uploaded = await callRaw("POST", "/api/media?name=team.jpg", await picture(2000, 1200));
    expect(uploaded.status).toBe(201);
    const entry = uploaded.body as { id: string; variants: { path: string }[] };
    expect(entry.variants.length).toBeGreaterThan(0);

    expect(((await call("GET", "/api/media")).body as { items: unknown[] }).items).toHaveLength(1);
    const patched = await call("PATCH", `/api/media/${entry.id}`, { en: "The team", fr: "L’équipe", ar: "الفريق" });
    expect(patched.status).toBe(200);
    expect((await call("PATCH", `/api/media/${entry.id}`, { en: "x".repeat(300), fr: "", ar: "" })).status).toBe(422);
    expect((await call("DELETE", `/api/media/${entry.id}`)).status).toBe(200);
  });

  it("answers 200 (not 201) for a picture that is already there", async () => {
    const buffer = await picture(800, 500);
    await callRaw("POST", "/api/media?name=a.jpg", buffer);
    const again = await callRaw("POST", "/api/media?name=a.jpg", buffer);
    expect(again.status).toBe(200);
    expect(again.body).toMatchObject({ duplicate: true });
  });

  it("uses the right error code for each refused file", async () => {
    expect((await callRaw("POST", "/api/media", Buffer.from("<svg></svg>"))).status).toBe(415);
    expect((await callRaw("POST", "/api/media", Buffer.alloc(0))).status).toBe(400);
    const huge = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(MAX_UPLOAD_BYTES)]);
    const response = await callRaw("POST", "/api/media", huge);
    expect(response.status).toBe(413);
    expect(errorOf(response).code).toBe("TOO_LARGE");
  });

  it("tells the HTTP layer how much it may read", () => {
    expect(maxBodyBytes("POST", "/api/media")).toBeGreaterThan(MAX_UPLOAD_BYTES);
    expect(maxBodyBytes("POST", "/api/posts")).toBeLessThan(MAX_UPLOAD_BYTES);
  });

  it("refuses a bad picture id", async () => {
    expect((await call("DELETE", "/api/media/not-an-id")).status).toBe(400);
  });
});
