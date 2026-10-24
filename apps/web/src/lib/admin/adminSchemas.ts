// =============================================================================
// ADMIN ACCOUNTS: RULES (shared by the dashboard forms and the server)
// -----------------------------------------------------------------------------
// An "admin" is a person who can log into the dashboard. For now there are only
// admins (role "admin"); the visitors of the public site have no account. The same
// file will describe the users of the real backend later.
// =============================================================================
import { z } from "zod";

export const ADMIN_ROLES = ["admin"] as const;
export const ADMIN_STATUSES = ["active", "disabled"] as const;
export const MIN_PASSWORD = 12;

export const adminIdSchema = z.string().regex(/^[0-9a-f]{12}$/, "Invalid admin id");

// A short list of passwords that are always refused (the most used ones).
const COMMON = new Set(["password1234", "123456789012", "qwertyuiop12", "administrator", "motdepasse12", "azertyuiop12", "altio2026altio"]);

/**
 * Returns what is wrong with a password, or null when it is acceptable.
 * Rules: at least 12 characters, not a very common one, not made of the name or the email.
 */
export function passwordProblem(password: string, context: { email?: string; name?: string } = {}): string | null {
  if (password.length < MIN_PASSWORD) return `Use at least ${MIN_PASSWORD} characters (a few words together work well).`;
  if (password.length > 200) return "That password is too long (200 characters at most).";
  const lower = password.toLowerCase();
  if (COMMON.has(lower) || /^(.)\1+$/.test(password)) return "That password is too easy to guess.";
  const local = (context.email ?? "").split("@")[0]?.toLowerCase() ?? "";
  if (local.length >= 4 && lower.includes(local)) return "The password must not contain the email address.";
  const name = (context.name ?? "").trim().toLowerCase();
  if (name.length >= 4 && lower.includes(name)) return "The password must not contain the name.";
  return null;
}

const NO_CONTROL = /^[^\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]*$/;

const name = z.string().trim().min(2, "Enter a name (2 letters at least)").max(80, "Max 80 characters").regex(NO_CONTROL, "Invalid characters");
const email = z.string().trim().toLowerCase().max(120, "Max 120 characters").pipe(z.email("Enter a valid email address"));
const description = z.string().trim().max(500, "Max 500 characters").regex(NO_CONTROL, "Invalid characters");

export const adminProfileSchema = z.object({
  name,
  email,
  description,
  status: z.enum(ADMIN_STATUSES),
});

export const adminCreateSchema = adminProfileSchema
  .omit({ status: true })
  .extend({ password: z.string() })
  .superRefine((value, ctx) => {
    const problem = passwordProblem(value.password, value);
    if (problem) ctx.addIssue({ code: "custom", path: ["password"], message: problem });
  });

export type AdminProfileInput = z.output<typeof adminProfileSchema>;
export type AdminCreateInput = z.output<typeof adminCreateSchema>;

/** What the dashboard may see about an admin (never the password fingerprint). */
export type PublicAdmin = {
  id: string;
  name: string;
  email: string;
  description: string;
  role: (typeof ADMIN_ROLES)[number];
  status: (typeof ADMIN_STATUSES)[number];
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  /** name of the admin who created this account (kept even if that admin is deleted later) */
  createdByName: string | null;
};

export type ActivityKind = "post" | "project" | "media" | "admin";
export type ActivityAction = "create" | "update" | "delete" | "password" | "disable" | "enable";

/** One line of the private activity log: who did what, when. */
export type ActivityEvent = {
  id: string;
  at: string;
  /** null when nobody was logged in (dashboard open on a local computer) */
  adminId: string | null;
  /** the name at that time, so the line stays readable if the admin is deleted */
  adminName: string;
  action: ActivityAction;
  kind: ActivityKind;
  targetId: string;
  title: string;
};

export type ProfileItem = {
  id: string;
  title: string;
  at: string;
  /** false when the item was deleted since */
  exists: boolean;
  /** a small picture path for media */
  thumb?: string;
};

/** The full page of one admin: what they created, edited and removed. */
export type AdminProfile = {
  admin: PublicAdmin;
  created: { posts: ProfileItem[]; projects: ProfileItem[]; media: ProfileItem[] };
  edited: (ProfileItem & { kind: ActivityKind; times: number; createdByThisAdmin: boolean })[];
  deleted: (ProfileItem & { kind: ActivityKind })[];
  recent: ActivityEvent[];
  totals: { posts: number; projects: number; media: number; edits: number; deletions: number };
};
