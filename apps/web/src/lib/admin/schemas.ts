// =============================================================================
// ADMIN DATA RULES (Zod)
// -----------------------------------------------------------------------------
// The shape and limits of a blog post, a project and an uploaded picture. The SAME
// rules are used in the dashboard forms (to show errors early) and in the dev API
// that writes the JSON files. When the real backend exists it imports this file
// too, so the two can never disagree.
// =============================================================================
import { z } from "zod";

export const LOCALES = ["en", "fr", "ar"] as const;
export type LocaleKey = (typeof LOCALES)[number];

// ---- shared pieces ----------------------------------------------------------
const NO_CONTROL = /^[^\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]*$/;

const text = (max: number, min = 1) => z.string().trim().min(min, "Required").max(max, `Max ${max} characters`).regex(NO_CONTROL, "Invalid characters");
const optionalText = (max: number) => z.string().trim().max(max, `Max ${max} characters`).regex(NO_CONTROL, "Invalid characters");

/** A web address part: lowercase letters, digits and dashes. */
export const slugSchema = z
  .string()
  .trim()
  .min(3, "At least 3 characters")
  .max(80, "Max 80 characters")
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, digits and single dashes");

export const mediaIdSchema = z.string().regex(/^[0-9a-f]{12}$/, "Invalid media id");

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the format YYYY-MM-DD")
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), "Not a real date");

// ---- blog posts -------------------------------------------------------------
export const POST_CATEGORIES = ["web", "seo", "shop", "apps", "tips"] as const;

export const postBlockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("p"), text: text(4000) }),
  z.object({ type: z.literal("h2"), id: z.string().trim().min(1).max(60).regex(/^[\p{L}\p{N}-]+$/u, "Letters, digits and dashes only"), text: text(200) }),
  z.object({ type: z.literal("quote"), text: text(500) }),
  z.object({ type: z.literal("callout"), title: text(120), items: z.array(text(200)).min(1).max(10) }),
  z.object({ type: z.literal("figure"), caption: text(300) }),
]);
export type PostBlockInput = z.infer<typeof postBlockSchema>;

export const postTextSchema = z.object({
  title: text(140),
  excerpt: text(300),
  // Only shown when the post is the featured one; may stay empty.
  featuredExcerpt: optionalText(400),
  body: z.array(postBlockSchema).min(1, "Write at least one paragraph").max(80),
});

export const postRecordSchema = z
  .object({
    slug: slugSchema,
    category: z.enum(POST_CATEGORIES),
    featured: z.boolean(),
    date: isoDate,
    readTime: z.number().int().min(1).max(60),
    cover: mediaIdSchema.nullable().optional(),
    i18n: z.object({ en: postTextSchema, fr: postTextSchema, ar: postTextSchema }),
  })
  .superRefine((post, ctx) => {
    // Section ids must be unique inside one article (the table of contents links to them).
    for (const locale of LOCALES) {
      const ids = post.i18n[locale].body.flatMap((block) => (block.type === "h2" ? [block.id] : []));
      if (new Set(ids).size !== ids.length) ctx.addIssue({ code: "custom", message: "Two sections have the same id", path: ["i18n", locale, "body"] });
    }
  });
export type PostRecord = z.infer<typeof postRecordSchema>;

// ---- projects (case studies) ------------------------------------------------
export const PROJECT_CATEGORIES = ["websites", "stores", "apps", "managed"] as const;
export const PROJECT_VIBES = ["estate", "store", "app", "managed"] as const;
export const PROJECT_STATUSES = ["live", "private"] as const;
export const CASE_VISUALS = ["listing", "admin", "whatsapp", "cart", "calendar", "report"] as const;

const barSchema = z.object({ label: text(60), value: z.number().min(0).max(100) });

export const caseSchema = z.object({
  heroTitle: text(80),
  heroAccent: text(120),
  heroLead: text(400),
  liveSince: text(80),
  facts: z.object({ client: text(80), service: text(80), timeline: text(80), stack: text(120) }),
  problem: z.object({
    title: text(120),
    lead: text(300),
    pains: z.array(text(200)).min(1).max(6),
    notes: z.array(text(40)).min(1).max(6),
  }),
  journey: z.array(z.object({ when: text(40), title: text(60), text: text(300) })).min(1).max(6),
  built: z.array(z.object({ title: text(80), text: text(300), visual: z.enum(CASE_VISUALS) })).min(1).max(6),
  compare: z.object({ before: z.array(barSchema).min(1).max(5), after: z.array(barSchema).min(1).max(5) }),
  results: z.array(z.object({ value: text(20), label: text(60), note: text(100) })).min(1).max(6),
  quote: z.object({ text: text(300), by: text(100) }),
});

export const projectTextSchema = z.object({
  tag: text(40),
  title: text(80),
  featuredTitle: optionalText(160),
  teaser: text(300),
  result: text(80),
  stats: z.array(z.object({ value: text(20), label: text(60) })).max(4),
  case: caseSchema,
});

export const projectRecordSchema = z.object({
  slug: slugSchema,
  vibe: z.enum(PROJECT_VIBES),
  art: z.enum(PROJECT_VIBES),
  featured: z.boolean(),
  status: z.enum(PROJECT_STATUSES),
  url: optionalText(120),
  category: z.enum(PROJECT_CATEGORIES),
  cover: mediaIdSchema.nullable().optional(),
  i18n: z.object({ en: projectTextSchema, fr: projectTextSchema, ar: projectTextSchema }),
});
export type ProjectRecord = z.infer<typeof projectRecordSchema>;
export type ProjectText = z.infer<typeof projectTextSchema>;

// ---- media ------------------------------------------------------------------
/** Largest file the dashboard accepts. Checked in the browser AND on the server. */
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;

export const mediaAltSchema = z.object({ en: optionalText(200), fr: optionalText(200), ar: optionalText(200) });

export type MediaVariant = { width: number; path: string; bytes: number };
export type MediaEntry = {
  id: string;
  /** SHA-256 of the uploaded file: the same picture is never stored twice. */
  hash: string;
  originalName: string;
  alt: { en: string; fr: string; ar: string };
  width: number;
  height: number;
  /** The picture in the sizes the site uses (WebP). */
  variants: MediaVariant[];
  createdAt: string;
};

/** First error message of every field, e.g. { "i18n.fr.title": "Required" }. */
export function flattenIssues(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!(key in result)) result[key] = issue.message;
  }
  return result;
}
