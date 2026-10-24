// =============================================================================
// FORM RULES (Zod)
// -----------------------------------------------------------------------------
// One schema per form. The error TEXT comes from the content files (so it is in
// the visitor's language); the RULES live here. The same schemas will be reused
// by the backend later, so the site and the API can never disagree.
// =============================================================================
import { z } from "zod";
import { normalizePhone } from "./phone";

export type ContactErrors = { name: string; phone: string; need: string; tooLong: string };
export type ReferralErrors = { yourName: string; yourPhone: string; theirName: string; tooLong: string };

// Letters, spaces, apostrophes, dots and dashes in any alphabet; no control characters.
const NO_CONTROL = /^[^\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]*$/;

const text = (required: string, tooLong: string, max: number) =>
  z.string().trim().min(1, required).max(max, tooLong).regex(NO_CONTROL, required);

const optionalText = (tooLong: string, max: number) => z.string().trim().max(max, tooLong).regex(NO_CONTROL, tooLong);

const phone = (message: string) =>
  z
    .string()
    .trim()
    .refine((value) => normalizePhone(value) !== null, message)
    .transform((value) => normalizePhone(value) as string);

export function contactSchema(errors: ContactErrors) {
  return z.object({
    name: text(errors.name, errors.tooLong, 80),
    phone: phone(errors.phone),
    business: optionalText(errors.tooLong, 120),
    need: text(errors.need, errors.tooLong, 60),
    details: optionalText(errors.tooLong, 1000),
  });
}
export type ContactInput = z.output<ReturnType<typeof contactSchema>>;

export function referralSchema(errors: ReferralErrors) {
  return z.object({
    yourName: text(errors.yourName, errors.tooLong, 80),
    yourPhone: phone(errors.yourPhone),
    theirName: text(errors.theirName, errors.tooLong, 120),
    // The referred person's number is optional, but if it is there it must be real.
    theirPhone: z
      .string()
      .trim()
      .refine((value) => value === "" || normalizePhone(value) !== null, errors.yourPhone)
      .transform((value) => (value === "" ? "" : (normalizePhone(value) as string))),
    reward: z.string().trim().max(60, errors.tooLong),
  });
}
export type ReferralInput = z.output<ReturnType<typeof referralSchema>>;

/** First error message of every field, e.g. { phone: "Enter a number..." }. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!(key in result)) result[key] = issue.message;
  }
  return result;
}
